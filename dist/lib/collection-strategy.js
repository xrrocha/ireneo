/**
 * Collection Strategy Pattern
 *
 * Unified interface for handling different collection types (Array, Map, Set).
 * Eliminates if/else chains and makes adding new collection types easier.
 *
 * DESIGN GOALS:
 * 1. Single source of truth for collection-specific behavior
 * 2. Data-driven approach (like collection-wrapper.ts)
 * 3. Easy to extend with new collection types
 * 4. Type-safe with branded types
 */
import { asTarget } from "./types.js";
import { wrapCollectionMethod } from "./collection-wrapper.js";
import { MUTATING_ARRAY_METHODS, MUTATING_MAP_METHODS, MUTATING_SET_METHODS, } from "./constants.js";
// ============================================================================
// Array Strategy
// ============================================================================
class ArrayStrategy {
    constructor() {
        this.typeName = "Array";
        this.mutatingMethods = MUTATING_ARRAY_METHODS;
    }
    isApplicable(value) {
        return Array.isArray(value);
    }
    wrapContents(array, path, wrapValue) {
        for (let i = 0; i < array.length; i++) {
            const itemPath = [...path, String(i)];
            array[i] = wrapValue(array[i], itemPath);
        }
    }
    isMethod(array, property) {
        return (typeof property === "string" &&
            typeof array[property] === "function");
    }
    isMutatingMethod(methodName) {
        return this.mutatingMethods.includes(methodName);
    }
    wrapMutatingMethod(array, methodName, originalMethod, infrastructure, eventLog, replayState) {
        return wrapCollectionMethod(asTarget(array), this.typeName, methodName, originalMethod, infrastructure, eventLog, replayState);
    }
}
// ============================================================================
// Map Strategy
// ============================================================================
class MapStrategy {
    constructor() {
        this.typeName = "Map";
        this.mutatingMethods = MUTATING_MAP_METHODS;
    }
    isApplicable(value) {
        return value instanceof Map;
    }
    wrapContents(map, path, wrapValue) {
        const entries = Array.from(map.entries());
        map.clear();
        for (const [k, v] of entries) {
            const keyPath = [...path, String(k)];
            const wrappedKey = wrapValue(k, keyPath);
            const wrappedValue = wrapValue(v, keyPath);
            map.set(wrappedKey, wrappedValue);
        }
    }
    isMethod(map, property) {
        return (typeof property === "string" &&
            typeof map[property] === "function");
    }
    isMutatingMethod(methodName) {
        return this.mutatingMethods.includes(methodName);
    }
    wrapMutatingMethod(map, methodName, originalMethod, infrastructure, eventLog, replayState) {
        return wrapCollectionMethod(asTarget(map), this.typeName, methodName, originalMethod, infrastructure, eventLog, replayState);
    }
}
// ============================================================================
// Set Strategy
// ============================================================================
class SetStrategy {
    constructor() {
        this.typeName = "Set";
        this.mutatingMethods = MUTATING_SET_METHODS;
    }
    isApplicable(value) {
        return value instanceof Set;
    }
    wrapContents(set, path, wrapValue) {
        const values = Array.from(set.values());
        set.clear();
        for (const v of values) {
            const itemPath = [...path, String(v)];
            const wrappedValue = wrapValue(v, itemPath);
            set.add(wrappedValue);
        }
    }
    isMethod(set, property) {
        return (typeof property === "string" &&
            typeof set[property] === "function");
    }
    isMutatingMethod(methodName) {
        return this.mutatingMethods.includes(methodName);
    }
    wrapMutatingMethod(set, methodName, originalMethod, infrastructure, eventLog, replayState) {
        return wrapCollectionMethod(asTarget(set), this.typeName, methodName, originalMethod, infrastructure, eventLog, replayState);
    }
}
// ============================================================================
// Strategy Registry
// ============================================================================
/**
 * Registry of all collection strategies
 * Strategies are checked in order until one matches
 */
const strategies = [
    new ArrayStrategy(),
    new MapStrategy(),
    new SetStrategy(),
];
/**
 * Find the appropriate strategy for a value
 * @returns Strategy if value is a collection, undefined otherwise
 */
export function getCollectionStrategy(value) {
    return strategies.find((strategy) => strategy.isApplicable(value));
}
/**
 * Check if a value is a collection (Array, Map, or Set)
 */
export function isCollection(value) {
    return getCollectionStrategy(value) !== undefined;
}
/**
 * Wrap collection contents recursively
 */
export function wrapCollectionContents(collection, path, wrapValue) {
    const strategy = getCollectionStrategy(collection);
    if (strategy) {
        strategy.wrapContents(collection, path, wrapValue);
    }
}
//# sourceMappingURL=collection-strategy.js.map