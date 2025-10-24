/**
 * Proxy Unwrapper - Deep proxy unwrapping utility
 *
 * Recursively unwraps transaction proxies to get raw objects/values.
 * Preserves object identity via seen map to handle circular references.
 *
 * Extracted from transaction.ts for reusability and testing.
 */
/**
 * Recursively unwrap all proxies to get raw objects/values
 *
 * When saving transaction changes, we need to unwrap any transaction proxies
 * back to their underlying raw values. This function handles:
 * - Arrays: recursively unwrap each element
 * - Objects: recursively unwrap each property
 * - Circular references: tracked via seen map to preserve identity
 * - Primitives: returned as-is
 *
 * @param value - Value to unwrap (may be a proxy or raw value)
 * @param targetCache - WeakMap<proxy, target> for identifying proxies
 * @param seen - WeakMap for tracking visited objects (prevents infinite loops)
 * @returns Unwrapped raw value
 *
 * @example
 * ```typescript
 * const targetCache = new WeakMap();
 * const proxy = createTransactionProxy(obj, ...);
 * targetCache.set(proxy, obj);
 *
 * const unwrapped = deepUnwrap(proxy, targetCache);
 * // unwrapped === obj (the raw object)
 * ```
 */
export declare function deepUnwrap(value: unknown, targetCache: WeakMap<object, any>, seen?: WeakMap<object, any>): unknown;
//# sourceMappingURL=proxy-unwrapper.d.ts.map