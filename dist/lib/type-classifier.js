/**
 * Type Classifier - Single source of truth for JavaScript value classification
 *
 * This module centralizes all type detection logic, eliminating the 26+ scattered
 * typeof checks throughout the codebase. Used by serialization, deserialization,
 * and replay modules.
 *
 * NOTE: Type guard functions (isPrimitive, isCollection, etc.) are imported
 * from js-types.ts to centralize type detection logic.
 */
// Import shared type guards
import { isPrimitive as isPrimitiveBase, isCollection as isCollectionBase, isNullish as isNullishBase, isPlainObject as isPlainObjectBase, isObject as isObjectBase, } from './js-types.js';
// ============================================================================
// Type Classification Enums
// ============================================================================
/**
 * Categorical classification of JavaScript values
 */
export var ValueCategory;
(function (ValueCategory) {
    ValueCategory[ValueCategory["NULL"] = 0] = "NULL";
    ValueCategory[ValueCategory["UNDEFINED"] = 1] = "UNDEFINED";
    ValueCategory[ValueCategory["PRIMITIVE"] = 2] = "PRIMITIVE";
    ValueCategory[ValueCategory["BIGINT"] = 3] = "BIGINT";
    ValueCategory[ValueCategory["SYMBOL"] = 4] = "SYMBOL";
    ValueCategory[ValueCategory["DATE"] = 5] = "DATE";
    ValueCategory[ValueCategory["REGEXP"] = 6] = "REGEXP";
    ValueCategory[ValueCategory["FUNCTION"] = 7] = "FUNCTION";
    ValueCategory[ValueCategory["ARRAY"] = 8] = "ARRAY";
    ValueCategory[ValueCategory["MAP"] = 9] = "MAP";
    ValueCategory[ValueCategory["SET"] = 10] = "SET";
    ValueCategory[ValueCategory["OBJECT"] = 11] = "OBJECT";
})(ValueCategory || (ValueCategory = {}));
// ============================================================================
// Type Classifier Function
// ============================================================================
/**
 * Classify a JavaScript value into its type category
 *
 * Single source of truth for type detection. Use this instead of scattered
 * typeof checks and instanceof tests.
 *
 * @param value - The value to classify
 * @returns Complete type information
 *
 * @example
 * ```typescript
 * const info = classifyValue(new Date());
 * // { category: ValueCategory.DATE, isPrimitive: false, isObject: true,
 * //   isCollection: false, needsSpecialSerialization: true }
 *
 * const info2 = classifyValue([1, 2, 3]);
 * // { category: ValueCategory.ARRAY, isPrimitive: false, isObject: true,
 * //   isCollection: true, needsSpecialSerialization: false }
 * ```
 */
export function classifyValue(value) {
    // Null
    if (value === null) {
        return {
            category: ValueCategory.NULL,
            isPrimitive: true,
            isObject: false,
            isCollection: false,
            needsSpecialSerialization: false,
        };
    }
    // Undefined
    if (value === undefined) {
        return {
            category: ValueCategory.UNDEFINED,
            isPrimitive: true,
            isObject: false,
            isCollection: false,
            needsSpecialSerialization: false,
        };
    }
    const type = typeof value;
    // Primitives
    if (type === 'string' || type === 'number' || type === 'boolean') {
        return {
            category: ValueCategory.PRIMITIVE,
            isPrimitive: true,
            isObject: false,
            isCollection: false,
            needsSpecialSerialization: false,
        };
    }
    // BigInt
    if (type === 'bigint') {
        return {
            category: ValueCategory.BIGINT,
            isPrimitive: true,
            isObject: false,
            isCollection: false,
            needsSpecialSerialization: true,
        };
    }
    // Symbol
    if (type === 'symbol') {
        return {
            category: ValueCategory.SYMBOL,
            isPrimitive: true,
            isObject: false,
            isCollection: false,
            needsSpecialSerialization: true,
        };
    }
    // Date (check before generic object)
    if (value instanceof Date) {
        return {
            category: ValueCategory.DATE,
            isPrimitive: false,
            isObject: true,
            isCollection: false,
            needsSpecialSerialization: true,
        };
    }
    // RegExp (check before generic object)
    if (value instanceof RegExp) {
        return {
            category: ValueCategory.REGEXP,
            isPrimitive: false,
            isObject: true,
            isCollection: false,
            needsSpecialSerialization: true,
        };
    }
    // Function
    if (type === 'function') {
        return {
            category: ValueCategory.FUNCTION,
            isPrimitive: false,
            isObject: true,
            isCollection: false,
            needsSpecialSerialization: true,
        };
    }
    // Array
    if (Array.isArray(value)) {
        return {
            category: ValueCategory.ARRAY,
            isPrimitive: false,
            isObject: true,
            isCollection: true,
            needsSpecialSerialization: false,
        };
    }
    // Map
    if (value instanceof Map) {
        return {
            category: ValueCategory.MAP,
            isPrimitive: false,
            isObject: true,
            isCollection: true,
            needsSpecialSerialization: true,
        };
    }
    // Set
    if (value instanceof Set) {
        return {
            category: ValueCategory.SET,
            isPrimitive: false,
            isObject: true,
            isCollection: true,
            needsSpecialSerialization: true,
        };
    }
    // Plain object (fallback)
    return {
        category: ValueCategory.OBJECT,
        isPrimitive: false,
        isObject: true,
        isCollection: false,
        needsSpecialSerialization: false,
    };
}
// ============================================================================
// Type Guard Helpers (Re-exported for Convenience)
// ============================================================================
/**
 * Check if value is null or undefined
 *
 * Re-exported from js-types.ts for convenience.
 */
export const isNullish = isNullishBase;
/**
 * Check if value is a primitive (including bigint and symbol)
 *
 * Re-exported from js-types.ts for convenience.
 */
export const isPrimitive = isPrimitiveBase;
/**
 * Check if value is a plain object (not null, not array, not special objects)
 *
 * Re-exported from js-types.ts for convenience.
 */
export const isPlainObject = isPlainObjectBase;
/**
 * Check if value is a collection (Array, Map, or Set)
 *
 * Re-exported from js-types.ts for convenience.
 */
export const isCollection = isCollectionBase;
/**
 * Check if value is an object (not null)
 *
 * This is the standard object check used throughout the codebase.
 * Note: Functions are considered objects for consistency with classifyValue.
 *
 * Re-exported from js-types.ts for convenience.
 */
export const isObject = isObjectBase;
//# sourceMappingURL=type-classifier.js.map