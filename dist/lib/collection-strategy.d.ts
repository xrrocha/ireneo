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
import type { Path, EventLog, ProxyInfrastructure, ReplayState } from "./types.js";
/**
 * Strategy for handling a specific collection type
 */
export interface CollectionStrategy<T = any> {
    /**
     * Check if this strategy applies to the given value
     */
    isApplicable(value: unknown): value is T;
    /**
     * Get collection type name for event logging
     */
    readonly typeName: "Array" | "Map" | "Set";
    /**
     * Get list of mutating method names
     */
    readonly mutatingMethods: readonly string[];
    /**
     * Recursively wrap collection contents during initial wrapping
     *
     * @param collection - The collection to wrap (mutated in place)
     * @param path - Path to this collection
     * @param wrapValue - Function to wrap individual values
     */
    wrapContents(collection: T, path: Path, wrapValue: (value: unknown, itemPath: Path) => unknown): void;
    /**
     * Check if a property access is a collection method
     */
    isMethod(collection: T, property: string | symbol): boolean;
    /**
     * Check if a method is mutating
     */
    isMutatingMethod(methodName: string): boolean;
    /**
     * Wrap a mutating collection method for event logging
     *
     * @param collection - The collection instance
     * @param methodName - Method being called
     * @param originalMethod - Original method function
     * @param infrastructure - Proxy infrastructure
     * @param eventLog - Event log for mutations
     * @param replayState - Replay state flag
     */
    wrapMutatingMethod(collection: T, methodName: string, originalMethod: Function, infrastructure: ProxyInfrastructure, eventLog?: EventLog, replayState?: ReplayState): Function;
}
/**
 * Find the appropriate strategy for a value
 * @returns Strategy if value is a collection, undefined otherwise
 */
export declare function getCollectionStrategy(value: unknown): CollectionStrategy | undefined;
/**
 * Check if a value is a collection (Array, Map, or Set)
 */
export declare function isCollection(value: unknown): boolean;
/**
 * Wrap collection contents recursively
 */
export declare function wrapCollectionContents(collection: unknown, path: Path, wrapValue: (value: unknown, itemPath: Path) => unknown): void;
//# sourceMappingURL=collection-strategy.d.ts.map