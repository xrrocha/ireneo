/**
 * Serialization module for Memory Image Processor
 *
 * Unified serialization using CycleTracker strategy pattern to eliminate
 * ~100 lines of duplicated type-handling logic.
 *
 * Two serialization modes:
 * 1. Snapshot mode - for full memory image serialization
 * 2. Event mode - for event logging with smart reference detection
 */
import type { Path, SerializedValue } from "./types.js";
/**
 * Serializes a memory image root to JSON string
 *
 * Creates a complete snapshot of the entire memory image state.
 * Uses SnapshotCycleTracker for simple cycle detection.
 *
 * @param root - The root object to serialize
 * @param proxyToTarget - Map from proxies to their targets
 * @returns JSON string representation
 */
export declare const serializeMemoryImage: (root: unknown, proxyToTarget: WeakMap<object, object>) => string;
/**
 * Serializes a value for event logging
 *
 * Smart reference detection - only creates refs for objects that exist
 * outside the current value tree. Detects internal cycles separately.
 *
 * Critical for event sourcing: When logging `scott.emps = {...}`, objects
 * referenced from within the new value that already exist elsewhere in the
 * graph become references, preserving object identity.
 *
 * @param value - Value to serialize
 * @param proxyToTarget - Map from proxies to targets
 * @param targetToPath - Map from targets to paths (for reference detection)
 * @param currentPath - Path where this value is being assigned
 * @returns Serialized value with smart references
 */
export declare const serializeValueForEvent: (value: unknown, proxyToTarget: WeakMap<object, object>, targetToPath: WeakMap<object, Path>, currentPath: Path) => SerializedValue;
//# sourceMappingURL=serialize.d.ts.map