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
import { classifyValue, ValueCategory } from "./type-classifier.js";
import { TYPE_MARKERS } from "./constants.js";
import { isClassInstance, getInstanceClassName } from "./instance-reconstructor.js";
/**
 * Cycle tracker for full snapshot serialization
 *
 * Uses Map to track all objects seen during THIS serialization.
 * Any object encountered twice becomes a reference.
 */
class SnapshotCycleTracker {
    constructor() {
        this.seen = new Map();
    }
    hasSeen(target) {
        return this.seen.has(target);
    }
    markSeen(target, path) {
        this.seen.set(target, path);
    }
    getReference(target) {
        if (this.seen.has(target)) {
            const refPath = this.seen.get(target);
            return {
                __type__: "ref",
                path: refPath || [],
            };
        }
        return null;
    }
}
/**
 * Cycle tracker for event value serialization
 *
 * Smart reference detection:
 * 1. Checks if object already exists in the graph (via targetToPath)
 * 2. Only creates ref if existing path is OUTSIDE the current value tree
 * 3. Uses Map to track internal paths for objects seen within this value
 */
class EventCycleTracker {
    constructor(targetToPath, currentPath) {
        this.targetToPath = targetToPath;
        this.currentPath = currentPath;
        this.seen = new Map();
    }
    hasSeen(target) {
        return this.seen.has(target);
    }
    markSeen(target, path) {
        this.seen.set(target, path);
    }
    getReference(target) {
        const existingPath = this.targetToPath.get(target);
        // Only create ref if object exists in graph AND is outside current value tree
        if (existingPath && existingPath.length > 0) {
            // Check if existing path is within the value path tree
            const isWithinValue = existingPath.length >= this.currentPath.length &&
                this.currentPath.every((seg, i) => seg === existingPath[i]);
            if (!isWithinValue) {
                // Object lives elsewhere in the graph - create reference
                return {
                    __type__: "ref",
                    path: existingPath,
                };
            }
        }
        // Check for internal references (same object appearing multiple times within this value)
        if (this.hasSeen(target)) {
            const internalPath = this.seen.get(target);
            // CRITICAL: Internal references need to be RELATIVE to the event's value root
            // The internalPath is absolute (e.g., ['depts', 'accounting', 'emps', '0', 'dept'])
            // But currentPath is the event path (e.g., ['depts'])
            // We need to strip the currentPath prefix to make it relative: ['accounting', 'emps', '0', 'dept']
            const relativePath = internalPath.slice(this.currentPath.length);
            return {
                __type__: "ref",
                path: relativePath,
            };
        }
        return null;
    }
}
// ============================================================================
// Unified Serialization Engine
// ============================================================================
/**
 * Core serialization function - works for both snapshot and event modes
 *
 * Uses classifyValue() for type detection, eliminating duplicated type checks.
 * Uses CycleTracker strategy for mode-specific cycle handling.
 *
 * @param value - Value to serialize
 * @param path - Current path in object graph
 * @param cycleTracker - Strategy for cycle detection
 * @param proxyToTarget - Map from proxies to their underlying targets
 * @returns Serialized representation
 */
function serializeValue(value, path, cycleTracker, proxyToTarget) {
    // CRITICAL FIX: Unwrap proxies BEFORE classification
    // This ensures instanceof checks work correctly for Date, Map, Set, etc.
    const unwrapped = (typeof value === 'object' && value !== null)
        ? (proxyToTarget.get(value) || value)
        : value;
    // Classify the unwrapped value
    const typeInfo = classifyValue(unwrapped);
    // Handle based on category
    switch (typeInfo.category) {
        case ValueCategory.NULL:
        case ValueCategory.UNDEFINED:
            return value;
        case ValueCategory.PRIMITIVE:
            return value;
        case ValueCategory.BIGINT:
            return {
                [TYPE_MARKERS.TYPE]: "bigint",
                value: value.toString(),
            };
        case ValueCategory.SYMBOL:
            return {
                [TYPE_MARKERS.TYPE]: "symbol",
                description: value.description,
            };
        case ValueCategory.DATE: {
            // Unwrap proxy to get underlying target
            const target = proxyToTarget.get(value) || value;
            // Check for circular reference
            const ref = cycleTracker.getReference(target);
            if (ref)
                return ref;
            // Mark as seen for cycle detection
            cycleTracker.markSeen(target, path);
            const dateObj = target;
            // Get timestamp value (handles invalid dates)
            const timestamp = dateObj.getTime();
            const dateValue = isNaN(timestamp) ? null : dateObj.toISOString();
            // Start with Date-specific fields
            const serialized = {
                [TYPE_MARKERS.TYPE]: "date",
                [TYPE_MARKERS.DATE_VALUE]: dateValue, // Internal timestamp (null if invalid)
            };
            // Serialize all user-defined enumerable properties
            // (This preserves properties like date.location, date.attendees, etc.)
            const entries = Object.entries(dateObj);
            for (const [key, val] of entries) {
                // Recursively serialize property values (handles nested objects, arrays, etc.)
                serialized[key] = serializeValue(val, [...path, key], cycleTracker, proxyToTarget);
            }
            return serialized;
        }
        case ValueCategory.REGEXP: {
            // Unwrap proxy to get underlying target
            const target = proxyToTarget.get(value) || value;
            // Check for circular reference
            const ref = cycleTracker.getReference(target);
            if (ref)
                return ref;
            // Mark as seen for cycle detection
            cycleTracker.markSeen(target, path);
            const regex = target;
            return {
                [TYPE_MARKERS.TYPE]: "regexp",
                source: regex.source,
                flags: regex.flags,
                lastIndex: regex.lastIndex
            };
        }
        case ValueCategory.FUNCTION: {
            const fn = value;
            if (fn.__type__ === "function") {
                return {
                    [TYPE_MARKERS.TYPE]: "function",
                    sourceCode: fn.sourceCode || value.toString(),
                };
            }
            // Non-serializable function - return undefined
            return undefined;
        }
        case ValueCategory.MAP:
        case ValueCategory.SET:
        case ValueCategory.ARRAY:
        case ValueCategory.OBJECT: {
            // Get the underlying target (unwrap proxy if needed)
            const target = proxyToTarget.get(value) || value;
            // Check if this should be a reference
            const ref = cycleTracker.getReference(target);
            if (ref)
                return ref;
            // Mark as seen
            cycleTracker.markSeen(target, path);
            // Serialize based on specific collection type
            if (typeInfo.category === ValueCategory.MAP) {
                return {
                    [TYPE_MARKERS.TYPE]: "map",
                    entries: Array.from(target.entries()).map(([k, v], i) => [
                        serializeValue(k, [...path, "key", String(i)], cycleTracker, proxyToTarget),
                        serializeValue(v, [...path, "value", String(i)], cycleTracker, proxyToTarget),
                    ]),
                };
            }
            if (typeInfo.category === ValueCategory.SET) {
                return {
                    [TYPE_MARKERS.TYPE]: "set",
                    values: Array.from(target.values()).map((v, i) => serializeValue(v, [...path, String(i)], cycleTracker, proxyToTarget)),
                };
            }
            if (typeInfo.category === ValueCategory.ARRAY) {
                return value.map((item, index) => serializeValue(item, [...path, String(index)], cycleTracker, proxyToTarget));
            }
            // Plain object (or class instance)
            const result = {};
            const obj = value;
            // Check if this is a class instance and add __class__ marker
            if (isClassInstance(target)) {
                const className = getInstanceClassName(target);
                if (className) {
                    result[TYPE_MARKERS.CLASS] = className;
                }
            }
            // Serialize all enumerable properties
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    result[key] = serializeValue(obj[key], [...path, key], cycleTracker, proxyToTarget);
                }
            }
            return result;
        }
        default:
            // Should never reach here if ValueCategory is exhaustive
            return undefined;
    }
}
// ============================================================================
// Public API
// ============================================================================
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
export const serializeMemoryImage = (root, proxyToTarget) => {
    const cycleTracker = new SnapshotCycleTracker();
    const serialized = serializeValue(root, [], cycleTracker, proxyToTarget);
    return JSON.stringify(serialized, null, 2);
};
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
export const serializeValueForEvent = (value, proxyToTarget, targetToPath, currentPath) => {
    const cycleTracker = new EventCycleTracker(targetToPath, currentPath);
    return serializeValue(value, currentPath, cycleTracker, proxyToTarget);
};
//# sourceMappingURL=serialize.js.map