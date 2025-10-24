/**
 * Transaction Proxy - Proxy creation for transaction isolation
 *
 * Creates proxies that intercept all property access and modifications,
 * tracking changes in the delta manager for later commit or discard.
 *
 * Extracted from transaction.ts to separate proxy logic from transaction API.
 */
/**
 * Helper to check if value is an object (including arrays)
 */
function isObject(value) {
    return value !== null && typeof value === "object";
}
/**
 * Creates a transaction wrapper around a memory image
 *
 * All reads check delta first, then fall back to base.
 * All writes go to delta only (not applied to base until commit).
 *
 * @param memimg - The base memory image
 * @param deltaManager - Delta manager for tracking changes
 * @param path - Current path in object graph
 * @param proxyCache - Cache to ensure same proxy instance for same object
 * @param targetCache - Reverse cache (proxy → target) for unwrapping
 * @returns Transaction proxy
 */
export function createTransactionProxy(memimg, deltaManager, path, proxyCache, targetCache) {
    // Return cached proxy if it exists
    if (proxyCache.has(memimg)) {
        return proxyCache.get(memimg);
    }
    const DELETED = deltaManager.getDeletedSymbol();
    const proxy = new Proxy(memimg, {
        get(obj, prop) {
            // Skip special properties
            if (typeof prop === 'symbol') {
                return obj[prop];
            }
            const newPath = [...path, String(prop)];
            const pathKey = newPath.join('.');
            // Check delta first
            if (deltaManager.has(pathKey)) {
                const deltaValue = deltaManager.get(pathKey);
                // If marked as deleted, return undefined
                if (deltaValue === DELETED) {
                    return undefined;
                }
                // Regular value in delta - return it (wrapped if object)
                if (isObject(deltaValue)) {
                    // If it's already one of our proxies, return it directly (don't wrap again)
                    if (targetCache.has(deltaValue)) {
                        return deltaValue;
                    }
                    // Otherwise, wrap it in a proxy
                    return createTransactionProxy(deltaValue, deltaManager, newPath, proxyCache, targetCache);
                }
                return deltaValue;
            }
            // Fallback to original memimg value
            const value = obj[prop];
            // If it's a function and obj is an array, intercept mutating methods
            // Native array methods bypass proxy SET traps, so we need to manually track changes
            if (typeof value === 'function' && Array.isArray(obj)) {
                const methodName = String(prop);
                // List of array methods that mutate the array
                const mutatingMethods = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];
                if (mutatingMethods.includes(methodName)) {
                    return function (...args) {
                        const arrayPathKey = path.join('.');
                        // Get or create array copy in delta
                        let arrayCopy;
                        if (deltaManager.has(arrayPathKey)) {
                            arrayCopy = deltaManager.get(arrayPathKey);
                        }
                        else {
                            // First mutation - make a copy
                            arrayCopy = [...obj];
                            deltaManager.set(arrayPathKey, arrayCopy);
                        }
                        // Wrap object arguments before adding to array
                        // This ensures methods like find() return wrapped elements
                        let wrappedArgs = args;
                        if (methodName === 'push' || methodName === 'unshift' || methodName === 'splice') {
                            wrappedArgs = args.map((arg, idx) => {
                                // Only wrap objects
                                if (!isObject(arg))
                                    return arg;
                                // Check if already wrapped
                                if (proxyCache.has(arg))
                                    return proxyCache.get(arg);
                                if (targetCache.has(arg))
                                    return arg; // Already a transaction proxy
                                // Calculate the path for this item
                                let itemPath;
                                if (methodName === 'push') {
                                    itemPath = [...path, String(arrayCopy.length + idx)];
                                }
                                else if (methodName === 'unshift') {
                                    itemPath = [...path, String(idx)];
                                }
                                else { // splice
                                    const start = args[0];
                                    // For splice, only wrap items after start and deleteCount
                                    if (idx < 2)
                                        return arg;
                                    itemPath = [...path, String(start + idx - 2)];
                                }
                                // Wrap in transaction proxy
                                return createTransactionProxy(arg, deltaManager, itemPath, proxyCache, targetCache);
                            });
                        }
                        // Call the method on the COPY (not the original)
                        const result = value.apply(arrayCopy, wrappedArgs);
                        return result;
                    };
                }
                // Non-mutating methods that return elements need special handling
                // to ensure returned objects are wrapped
                const methodsReturningElements = ['find', 'findLast', 'filter', 'map', 'flatMap'];
                if (methodsReturningElements.includes(methodName)) {
                    return function (...args) {
                        const result = value.apply(obj, args);
                        // Wrap returned objects/arrays
                        if (result === null || result === undefined)
                            return result;
                        if (methodName === 'find' || methodName === 'findLast') {
                            // These return a single element
                            if (isObject(result)) {
                                // Find the index of this element to determine its path
                                const idx = obj.indexOf(result);
                                if (idx !== -1) {
                                    const itemPath = [...path, String(idx)];
                                    return createTransactionProxy(result, deltaManager, itemPath, proxyCache, targetCache);
                                }
                            }
                            return result;
                        }
                        else {
                            // filter, map, flatMap return arrays - wrap each element
                            if (Array.isArray(result)) {
                                return result.map((item, idx) => {
                                    if (isObject(item)) {
                                        const originalIdx = obj.indexOf(item);
                                        if (originalIdx !== -1) {
                                            const itemPath = [...path, String(originalIdx)];
                                            return createTransactionProxy(item, deltaManager, itemPath, proxyCache, targetCache);
                                        }
                                    }
                                    return item;
                                });
                            }
                            return result;
                        }
                    };
                }
                // Other non-mutating methods: just bind normally
                return value.bind(obj);
            }
            // Maps: Intercept both mutating and non-mutating methods
            if (typeof value === 'function' && obj instanceof Map) {
                const methodName = String(prop);
                const mutatingMethods = ['set', 'delete', 'clear'];
                if (mutatingMethods.includes(methodName)) {
                    return function (...args) {
                        // Granular key tracking: store individual keys, not entire Maps
                        if (methodName === 'set' && args.length >= 2) {
                            const [key, val] = args;
                            const keyPath = [...path, String(key)];
                            const keyPathKey = keyPath.join('.');
                            // Wrap value if it's an object
                            let finalVal = val;
                            if (isObject(val)) {
                                if (proxyCache.has(val)) {
                                    finalVal = proxyCache.get(val);
                                }
                                else if (!targetCache.has(val)) {
                                    finalVal = createTransactionProxy(val, deltaManager, keyPath, proxyCache, targetCache);
                                }
                            }
                            // Store individual key in delta ONLY
                            // (memimg stays unchanged - that's the whole point of transactions!)
                            deltaManager.set(keyPathKey, finalVal);
                            return obj; // Map.set() returns the Map
                        }
                        if (methodName === 'delete' && args.length >= 1) {
                            const [key] = args;
                            const keyPath = [...path, String(key)];
                            const keyPathKey = keyPath.join('.');
                            // Store DELETED marker in delta ONLY
                            deltaManager.delete(keyPathKey);
                            return true; // Map.delete() returns boolean
                        }
                        if (methodName === 'clear') {
                            // Mark all existing keys as deleted in delta
                            // Need to mark both memimg keys AND delta keys
                            const allKeys = new Set(obj.keys());
                            // Also add keys that exist in delta but not memimg
                            const mapPathPrefix = path.join('.') + '.';
                            for (const [deltaPath] of deltaManager.entries()) {
                                if (deltaPath.startsWith(mapPathPrefix)) {
                                    const remainder = deltaPath.slice(mapPathPrefix.length);
                                    if (!remainder.includes('.')) {
                                        allKeys.add(remainder);
                                    }
                                }
                            }
                            // Mark all keys as DELETED
                            for (const key of allKeys) {
                                const keyPath = [...path, String(key)];
                                const keyPathKey = keyPath.join('.');
                                deltaManager.delete(keyPathKey);
                            }
                            return undefined; // Map.clear() returns void
                        }
                        // Shouldn't reach here, but fallback to original behavior
                        return value.apply(obj, args);
                    };
                }
                // Non-mutating methods that return values need wrapping
                const methodsReturningValues = ['get'];
                if (methodsReturningValues.includes(methodName)) {
                    return function (...args) {
                        const [key] = args;
                        const keyPath = [...path, String(key)];
                        const keyPathKey = keyPath.join('.');
                        // Check delta first at extended path
                        if (deltaManager.has(keyPathKey)) {
                            const deltaValue = deltaManager.get(keyPathKey);
                            // If marked as deleted, return undefined
                            if (deltaValue === DELETED) {
                                return undefined;
                            }
                            // Wrap if object
                            if (isObject(deltaValue)) {
                                if (proxyCache.has(deltaValue))
                                    return proxyCache.get(deltaValue);
                                if (targetCache.has(deltaValue))
                                    return deltaValue;
                                return createTransactionProxy(deltaValue, deltaManager, keyPath, proxyCache, targetCache);
                            }
                            return deltaValue;
                        }
                        // Fall back to memimg (original Map)
                        const result = obj.get(key);
                        // Wrap returned object (including nested Maps/Sets)
                        if (result !== null && result !== undefined && isObject(result)) {
                            if (proxyCache.has(result))
                                return proxyCache.get(result);
                            if (targetCache.has(result))
                                return result;
                            return createTransactionProxy(result, deltaManager, keyPath, proxyCache, targetCache);
                        }
                        return result;
                    };
                }
                // Iterator methods that return values needing wrapping
                const iteratorMethods = ['values', 'entries', 'keys', 'forEach'];
                if (iteratorMethods.includes(methodName)) {
                    return function (...args) {
                        // Build merged view of Map (delta + memimg)
                        const mergedEntries = new Map();
                        // Start with memimg entries
                        for (const [k, v] of obj.entries()) {
                            mergedEntries.set(k, v);
                        }
                        // Apply delta changes
                        const mapPathPrefix = path.join('.') + '.';
                        for (const [deltaPath, deltaValue] of deltaManager.entries()) {
                            if (deltaPath.startsWith(mapPathPrefix)) {
                                const remainder = deltaPath.slice(mapPathPrefix.length);
                                // Only process direct children (no nested dots)
                                if (!remainder.includes('.')) {
                                    const key = remainder;
                                    if (deltaValue === DELETED) {
                                        mergedEntries.delete(key);
                                    }
                                    else {
                                        mergedEntries.set(key, deltaValue);
                                    }
                                }
                            }
                        }
                        if (methodName === 'forEach') {
                            // Wrap forEach callback to wrap values
                            const [callback, thisArg] = args;
                            for (const [k, v] of mergedEntries.entries()) {
                                let wrappedV = v;
                                if (isObject(v)) {
                                    const itemPath = [...path, String(k)];
                                    if (proxyCache.has(v)) {
                                        wrappedV = proxyCache.get(v);
                                    }
                                    else if (!targetCache.has(v)) {
                                        wrappedV = createTransactionProxy(v, deltaManager, itemPath, proxyCache, targetCache);
                                    }
                                }
                                callback.call(thisArg, wrappedV, k, obj);
                            }
                            return undefined;
                        }
                        else {
                            // For values(), entries(), keys() - return wrapped iterator
                            let iterator;
                            if (methodName === 'values') {
                                iterator = mergedEntries.values();
                            }
                            else if (methodName === 'entries') {
                                iterator = mergedEntries.entries();
                            }
                            else {
                                iterator = mergedEntries.keys();
                            }
                            // Create a wrapping iterator
                            return {
                                [Symbol.iterator]() {
                                    return this;
                                },
                                next() {
                                    const result = iterator.next();
                                    if (!result.done && result.value !== undefined) {
                                        if (methodName === 'values') {
                                            // Wrap the value
                                            const val = result.value;
                                            if (isObject(val)) {
                                                // Find the key for this value to build proper path
                                                let foundKey = null;
                                                for (const [k, v] of mergedEntries.entries()) {
                                                    if (v === val) {
                                                        foundKey = k;
                                                        break;
                                                    }
                                                }
                                                if (foundKey !== null && !proxyCache.has(val) && !targetCache.has(val)) {
                                                    const itemPath = [...path, String(foundKey)];
                                                    result.value = createTransactionProxy(val, deltaManager, itemPath, proxyCache, targetCache);
                                                }
                                                else if (proxyCache.has(val)) {
                                                    result.value = proxyCache.get(val);
                                                }
                                            }
                                        }
                                        else if (methodName === 'entries') {
                                            // Wrap the value in [key, value] tuple
                                            const [key, val] = result.value;
                                            if (isObject(val)) {
                                                if (proxyCache.has(val)) {
                                                    result.value = [key, proxyCache.get(val)];
                                                }
                                                else if (!targetCache.has(val)) {
                                                    const itemPath = [...path, String(key)];
                                                    result.value = [key, createTransactionProxy(val, deltaManager, itemPath, proxyCache, targetCache)];
                                                }
                                            }
                                        }
                                        // keys() doesn't need wrapping - they're primitives
                                    }
                                    return result;
                                }
                            };
                        }
                    };
                }
                // Other methods: just bind normally
                return value.bind(obj);
            }
            // Sets: Intercept both mutating and non-mutating methods
            if (typeof value === 'function' && obj instanceof Set) {
                const methodName = String(prop);
                const mutatingMethods = ['add', 'delete', 'clear'];
                if (mutatingMethods.includes(methodName)) {
                    return function (...args) {
                        const setPathKey = path.join('.');
                        // Get or create set copy in delta
                        let setCopy;
                        if (deltaManager.has(setPathKey)) {
                            setCopy = deltaManager.get(setPathKey);
                        }
                        else {
                            // First mutation - make a copy
                            setCopy = new Set(obj);
                            deltaManager.set(setPathKey, setCopy);
                        }
                        // For Set.add(), wrap the value being stored
                        if (methodName === 'add' && args.length >= 1) {
                            const val = args[0];
                            if (isObject(val)) {
                                // Check if already wrapped
                                if (!proxyCache.has(val) && !targetCache.has(val)) {
                                    const itemPath = [...path, String(val)];
                                    args[0] = createTransactionProxy(val, deltaManager, itemPath, proxyCache, targetCache);
                                }
                            }
                        }
                        // Call the method on the COPY (not the original)
                        const result = value.apply(setCopy, args);
                        return result;
                    };
                }
                // Non-mutating methods that return iterators need wrapping
                // Note: values(), entries(), keys(), forEach() all return/iterate over Set elements
                // For now, we bind them normally - full iterator wrapping would be more complex
                // TODO: Implement iterator wrapping for Set.values(), Set.entries(), etc.
                return value.bind(obj);
            }
            // Wrap objects so we can intercept their access too
            if (isObject(value)) {
                // If it's already one of our proxies, return it directly (don't wrap again)
                if (targetCache.has(value)) {
                    return value;
                }
                // Otherwise, wrap it in a proxy
                return createTransactionProxy(value, deltaManager, newPath, proxyCache, targetCache);
            }
            return value;
        },
        set(obj, prop, value) {
            const newPath = [...path, String(prop)];
            const pathKey = newPath.join('.');
            // Store value directly in delta (even if it's a proxy)
            // We'll unwrap during save()
            deltaManager.set(pathKey, value);
            return true;
        },
        has(obj, prop) {
            const newPath = [...path, String(prop)];
            const pathKey = newPath.join('.');
            // Check delta first
            if (deltaManager.has(pathKey)) {
                // If marked as deleted, return false
                return deltaManager.get(pathKey) !== DELETED;
            }
            // Fallback to original
            return prop in obj;
        },
        deleteProperty(obj, prop) {
            const newPath = [...path, String(prop)];
            const pathKey = newPath.join('.');
            // Mark as deleted in delta using DELETED symbol
            deltaManager.delete(pathKey);
            return true;
        },
        ownKeys(obj) {
            // Start with base keys
            const baseKeys = Reflect.ownKeys(obj);
            // Collect delta keys for this level
            const prefix = path.length > 0 ? path.join('.') + '.' : '';
            const deltaKeysAtLevel = new Set();
            // Iterate through delta to find keys at this level
            for (const [pathKey, value] of deltaManager.entries()) {
                if (pathKey.startsWith(prefix)) {
                    const remainder = pathKey.slice(prefix.length);
                    const nextDot = remainder.indexOf('.');
                    const key = nextDot === -1 ? remainder : remainder.slice(0, nextDot);
                    if (value !== DELETED) {
                        deltaKeysAtLevel.add(key);
                    }
                }
            }
            // Combine base keys with delta additions, exclude deletions
            const keySet = new Set(baseKeys);
            for (const [pathKey, value] of deltaManager.entries()) {
                if (pathKey.startsWith(prefix)) {
                    const remainder = pathKey.slice(prefix.length);
                    const nextDot = remainder.indexOf('.');
                    if (nextDot === -1) {
                        // This is a direct child key
                        const key = remainder;
                        if (value === DELETED) {
                            keySet.delete(key);
                        }
                        else {
                            keySet.add(key);
                        }
                    }
                }
            }
            return Array.from(keySet);
        },
        getOwnPropertyDescriptor(obj, prop) {
            const newPath = [...path, String(prop)];
            const pathKey = newPath.join('.');
            // Check delta first
            if (deltaManager.has(pathKey)) {
                const value = deltaManager.get(pathKey);
                // If deleted, return undefined
                if (value === DELETED) {
                    return undefined;
                }
                // Return descriptor for delta value
                return {
                    value,
                    writable: true,
                    enumerable: true,
                    configurable: true
                };
            }
            // Fallback to base
            return Reflect.getOwnPropertyDescriptor(obj, prop);
        }
    });
    // Cache the proxy before returning
    proxyCache.set(memimg, proxy);
    // Also cache the reverse mapping (proxy → target) for unwrapping
    targetCache.set(proxy, memimg);
    return proxy;
}
//# sourceMappingURL=transaction-proxy.js.map