/**
 * Constants - Centralized magic strings and configuration values
 *
 * This module eliminates magic strings scattered throughout the codebase,
 * providing a single source of truth for event types, type markers, and
 * configuration values.
 */
/**
 * All event type constants
 *
 * Use these instead of string literals to prevent typos and enable
 * IDE autocomplete.
 */
export declare const EVENT_TYPES: {
    readonly SET: "SET";
    readonly DELETE: "DELETE";
    readonly ARRAY_PUSH: "ARRAY_PUSH";
    readonly ARRAY_POP: "ARRAY_POP";
    readonly ARRAY_SHIFT: "ARRAY_SHIFT";
    readonly ARRAY_UNSHIFT: "ARRAY_UNSHIFT";
    readonly ARRAY_SPLICE: "ARRAY_SPLICE";
    readonly ARRAY_SORT: "ARRAY_SORT";
    readonly ARRAY_REVERSE: "ARRAY_REVERSE";
    readonly ARRAY_FILL: "ARRAY_FILL";
    readonly ARRAY_COPYWITHIN: "ARRAY_COPYWITHIN";
    readonly MAP_SET: "MAP_SET";
    readonly MAP_DELETE: "MAP_DELETE";
    readonly MAP_CLEAR: "MAP_CLEAR";
    readonly SET_ADD: "SET_ADD";
    readonly SET_DELETE: "SET_DELETE";
    readonly SET_CLEAR: "SET_CLEAR";
    readonly SCRIPT: "SCRIPT";
};
/**
 * Special property markers used in serialization
 *
 * These markers identify special types during serialization/deserialization.
 */
export declare const TYPE_MARKERS: {
    /** Marker for typed values (e.g., functions, dates, bigints) */
    readonly TYPE: "__type__";
    /** Marker for class instances (preserves class identity across serialization) */
    readonly CLASS: "__class__";
    /** Marker for unresolved references during deserialization */
    readonly UNRESOLVED: "__isUnresolved";
    /** Marker for reference objects */
    readonly UNRESOLVED_REF: "__unresolved_ref__";
    /** Internal timestamp field for Date objects (preserves Date value while allowing properties) */
    readonly DATE_VALUE: "__dateValue__";
};
/**
 * Path separator for string representations
 */
export declare const PATH_SEPARATOR = ".";
/**
 * Pattern for detecting numeric array indices
 *
 * Used to distinguish between array indices and object keys when
 * creating intermediate objects during path traversal.
 */
export declare const NUMERIC_KEY_PATTERN: RegExp;
/**
 * Array methods that mutate the array
 *
 * These methods trigger event logging when called on proxied arrays.
 */
export declare const MUTATING_ARRAY_METHODS: readonly ["push", "pop", "shift", "unshift", "splice", "sort", "reverse", "fill", "copyWithin"];
/**
 * Map methods that mutate the map
 */
export declare const MUTATING_MAP_METHODS: readonly ["set", "delete", "clear"];
/**
 * Set methods that mutate the set
 */
export declare const MUTATING_SET_METHODS: readonly ["add", "delete", "clear"];
/**
 * Default IndexedDB database name
 */
export declare const DEFAULT_DB_NAME = "ireneo";
/**
 * Default IndexedDB object store name
 */
export declare const DEFAULT_STORE_NAME = "events";
/**
 * Default localStorage key for in-memory event logs
 */
export declare const DEFAULT_LOCALSTORAGE_KEY = "ireneo-events";
//# sourceMappingURL=constants.d.ts.map