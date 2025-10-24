/**
 * Deserialization module for Memory Image Processor
 *
 * Provides pure functions for reconstructing JavaScript object graphs from
 * serialized representations, handling cycles via two-pass resolution.
 *
 * CRITICAL: This implementation MUST mutate objects in place during reference
 * resolution to maintain object identity for cycles.
 */
import type { SerializedValue, ClassRegistryLookup } from "./types.js";
/**
 * Deserializes a snapshot JSON into a plain JavaScript object graph.
 *
 * WHY: Snapshots are created by serializeMemoryImage which uses SnapshotCycleTracker.
 * All references in a snapshot use absolute paths from the snapshot root (single-context).
 *
 * WHAT: Performs two-pass deserialization with single-context reference resolution:
 * - Pass 1: Reconstruct objects and special types
 * - Pass 2: Resolve all references from the snapshot root
 *
 * HOW: Uses deserializeTwoPass with a simple single-context resolver that
 * navigates from the root following path segments. No hierarchical scoping needed.
 *
 * Single-context resolution matches the serialization behavior of SnapshotCycleTracker
 * which creates refs for all objects seen during serialization, with paths from root.
 *
 * @param json - JSON string or parsed object from serializeMemoryImage
 * @param classRegistry - Optional registry for class instance reconstruction
 * @returns Deserialized object graph with cycles restored
 *
 * @example
 * ```typescript
 * const json = serializeMemoryImage(root, proxyToTarget);
 * const classRegistry = new Map([['Employee', Employee]]);
 * const restored = deserializeSnapshot(json, classRegistry);
 * // All circular references, object identity, and class methods preserved
 * ```
 */
export declare function deserializeSnapshot(json: string | unknown, classRegistry?: ClassRegistryLookup): unknown;
/**
 * Deserializes an event value with hierarchical scoped reference resolution.
 *
 * WHY: Event values exhibit closure semantics over the memory graph.
 *
 * Like closures in programming languages, event values have:
 * - **Internal structure** (local scope): Objects appearing multiple times within the value
 * - **Captured external context** (free variables): References to objects in the memory graph
 *
 * This requires hierarchical scoped resolution - exactly like variable lookup in nested scopes.
 *
 * WHAT: Performs two-pass deserialization with hierarchical scoped reference resolution:
 * 1. Try resolving from value scope first (internal refs - relative paths)
 * 2. Fall back to memory scope if not found (external refs - absolute paths)
 *
 * HOW: The resolver implements lexical scoping for reference resolution:
 * - **Local scope (value)**: Try resolving path from the value being deserialized
 * - **Outer scope (memory)**: Fall back to memory graph if not found locally
 * - Only throw error if BOTH scopes fail to resolve the path
 *
 * This matches the serialization behavior of EventCycleTracker which creates:
 * - **Internal refs**: Relative paths for objects within the value (stripped of currentPath prefix)
 * - **External refs**: Absolute paths for objects in the memory graph (outside value tree)
 *
 * The hierarchical resolution is NOT a special case - it's the CORRECT semantics
 * for closure-like structures, identical to variable lookup in nested scopes.
 *
 * @param value - Serialized event value (JSON string or object from serializeValueForEvent)
 * @param memoryRoot - Root of the memory graph for external ref resolution
 * @param classRegistry - Optional registry for class instance reconstruction
 * @returns Deserialized value with all refs resolved (internal + external)
 *
 * @example
 * ```typescript
 * // Event: SET root.dept = {...}
 * // The value may contain refs to both:
 * // - Internal objects (within the value being set) - relative paths
 * // - External objects (already in memory graph) - absolute paths
 *
 * const classRegistry = new Map([['Employee', Employee]]);
 * const deserialized = deserializeEventValue(
 *   setEvent.value,
 *   memoryRoot,
 *   classRegistry
 * );
 * // Internal refs resolve from value scope
 * // External refs resolve from memory scope
 * // Class instances get correct prototypes
 * ```
 */
export declare function deserializeEventValue(value: unknown, memoryRoot: unknown, classRegistry?: ClassRegistryLookup): unknown;
/**
 * Deserializes a JSON string into a plain JavaScript object graph.
 *
 * WHY: Backward compatibility - this was the original API for snapshot deserialization.
 *
 * WHAT: Alias for deserializeSnapshot. All behavior is identical.
 *
 * HOW: Direct function reference (not a wrapper).
 *
 * Uses two-pass algorithm:
 * 1. First pass: traverse and replace special types, mark refs as unresolved
 * 2. Second pass: resolve all references to actual objects
 *
 * CRITICAL: Must mutate objects in place to maintain object identity!
 *
 * @param json - JSON string or parsed object
 * @returns Deserialized object graph
 */
export declare const deserializeMemoryImage: typeof deserializeSnapshot;
/**
 * Reconstructs a value from event data, resolving references to existing
 * objects in the memory image.
 *
 * CRITICAL: Uses seen WeakMap to handle circular references and prevent
 * infinite recursion. Objects are added to seen BEFORE recursing into their
 * properties, allowing circular refs to be resolved correctly.
 */
export declare const reconstructValue: (value: SerializedValue, root: unknown, seen?: WeakMap<object, unknown>, classRegistry?: ClassRegistryLookup) => unknown;
//# sourceMappingURL=deserialize.d.ts.map