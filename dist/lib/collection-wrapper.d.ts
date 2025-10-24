/**
 * Unified Collection Method Wrapper
 *
 * Eliminates ~90 lines of duplication between wrapArrayMethod, wrapMapMethod,
 * and wrapSetMethod by using a data-driven approach.
 *
 * All three collection types (Array, Map, Set) follow the same pattern:
 * 1. Get collection's path from infrastructure
 * 2. Execute the original method
 * 3. Log the mutation event
 *
 * The only differences are type annotations and event type prefix.
 */
import type { EventLog, ProxyInfrastructure, ReplayState } from "./types.js";
/**
 * Collection type metadata
 */
interface CollectionTypeInfo {
    /** Event type prefix (e.g., "ARRAY", "MAP", "SET") */
    eventPrefix: string;
}
/**
 * Registry mapping collection types to their metadata
 */
declare const COLLECTION_TYPES: Record<string, CollectionTypeInfo>;
/**
 * Wraps a collection mutation method to log events.
 *
 * This single function replaces three nearly-identical wrappers,
 * reducing code from ~90 lines to ~30 lines.
 *
 * Works for Array, Map, and Set - the behavior is identical:
 * 1. Execute the native method
 * 2. Log the mutation event using the event registry
 *
 * @param target - The unwrapped collection
 * @param collectionType - Collection type name ("Array", "Map", "Set")
 * @param methodName - Name of the method being called
 * @param originalMethod - The native collection method
 * @param infrastructure - Proxy tracking infrastructure
 * @param eventLog - Optional event log
 * @param replayState - Replay state flag
 * @returns Wrapped method that logs events
 */
export declare const wrapCollectionMethod: <T extends object>(target: T, collectionType: keyof typeof COLLECTION_TYPES, methodName: string, originalMethod: (...args: unknown[]) => unknown, infrastructure: ProxyInfrastructure, eventLog?: EventLog, replayState?: ReplayState) => ((...args: unknown[]) => unknown);
export {};
//# sourceMappingURL=collection-wrapper.d.ts.map