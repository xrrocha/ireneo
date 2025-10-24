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
import { isPrimitive as isPrimitiveBase, isCollection as isCollectionBase, isNullish as isNullishBase, isPlainObject as isPlainObjectBase, isObject as isObjectBase } from './js-types.js';
/**
 * Categorical classification of JavaScript values
 */
export declare enum ValueCategory {
    NULL = 0,
    UNDEFINED = 1,
    PRIMITIVE = 2,// string, number, boolean
    BIGINT = 3,
    SYMBOL = 4,
    DATE = 5,
    REGEXP = 6,
    FUNCTION = 7,
    ARRAY = 8,
    MAP = 9,
    SET = 10,
    OBJECT = 11
}
/**
 * Complete type information for a value
 *
 * Provides everything needed for serialization, formatting, and navigation
 * in a single classification call.
 */
export interface TypeInfo {
    /** Primary category */
    category: ValueCategory;
    /** Is this a primitive value? */
    isPrimitive: boolean;
    /** Is this an object (not null)? */
    isObject: boolean;
    /** Is this a collection (Array/Map/Set)? */
    isCollection: boolean;
    /** Does this need special serialization handling? */
    needsSpecialSerialization: boolean;
}
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
export declare function classifyValue(value: unknown): TypeInfo;
/**
 * Check if value is null or undefined
 *
 * Re-exported from js-types.ts for convenience.
 */
export declare const isNullish: typeof isNullishBase;
/**
 * Check if value is a primitive (including bigint and symbol)
 *
 * Re-exported from js-types.ts for convenience.
 */
export declare const isPrimitive: typeof isPrimitiveBase;
/**
 * Check if value is a plain object (not null, not array, not special objects)
 *
 * Re-exported from js-types.ts for convenience.
 */
export declare const isPlainObject: typeof isPlainObjectBase;
/**
 * Check if value is a collection (Array, Map, or Set)
 *
 * Re-exported from js-types.ts for convenience.
 */
export declare const isCollection: typeof isCollectionBase;
/**
 * Check if value is an object (not null)
 *
 * This is the standard object check used throughout the codebase.
 * Note: Functions are considered objects for consistency with classifyValue.
 *
 * Re-exported from js-types.ts for convenience.
 */
export declare const isObject: typeof isObjectBase;
//# sourceMappingURL=type-classifier.d.ts.map