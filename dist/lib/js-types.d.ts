/**
 * JavaScript Type Guards
 *
 * Pure type detection functions with zero dependencies.
 * Used throughout Ireneo for type classification and serialization.
 *
 * CRITICAL: This module MUST NOT import from other modules.
 *
 * Design Principles:
 * - Zero dependencies (pure functions only)
 * - Single source of truth for type detection
 * - Exhaustive testing (100% coverage)
 * - Type-safe guards where applicable
 */
/**
 * Check if value is a primitive (including null, undefined, bigint, symbol)
 *
 * Primitives are immutable values that are not objects:
 * - null, undefined
 * - string, number, boolean
 * - bigint, symbol
 *
 * @param value - Value to check
 * @returns true if value is a primitive
 *
 * @example
 * ```typescript
 * isPrimitive(42)           // true
 * isPrimitive('hello')      // true
 * isPrimitive(null)         // true
 * isPrimitive(123n)         // true
 * isPrimitive(Symbol())     // true
 * isPrimitive({})           // false
 * isPrimitive([])           // false
 * ```
 */
export declare function isPrimitive(value: unknown): boolean;
/**
 * Check if value is a collection (Array, Map, or Set)
 *
 * Collections are container objects that hold multiple values:
 * - Array (indexed collection)
 * - Map (key-value pairs)
 * - Set (unique values)
 *
 * Note: WeakMap and WeakSet are NOT considered collections here
 * as they're not iterable and can't be serialized.
 *
 * @param value - Value to check
 * @returns true if value is Array, Map, or Set
 *
 * @example
 * ```typescript
 * isCollection([1, 2, 3])          // true
 * isCollection(new Map())          // true
 * isCollection(new Set())          // true
 * isCollection({})                 // false
 * isCollection(new WeakMap())      // false
 * ```
 */
export declare function isCollection(value: unknown): value is unknown[] | Map<unknown, unknown> | Set<unknown>;
/**
 * Check if value is null or undefined
 *
 * Convenient helper for checking nullish values.
 * Useful for early exits and validation.
 *
 * @param value - Value to check
 * @returns true if value is null or undefined
 *
 * @example
 * ```typescript
 * isNullish(null)        // true
 * isNullish(undefined)   // true
 * isNullish(0)           // false
 * isNullish('')          // false
 * isNullish(false)       // false
 * ```
 */
export declare function isNullish(value: unknown): value is null | undefined;
/**
 * Check if value is a plain object (not null, not array, not special objects)
 *
 * Plain objects are ordinary objects created via object literals or Object.create:
 * - {}
 * - { a: 1 }
 * - Object.create(null)
 *
 * NOT plain objects:
 * - Arrays, Date, Map, Set, etc. (special object types)
 * - Functions (callable objects)
 *
 * @param value - Value to check
 * @returns true if value is a plain object
 *
 * @example
 * ```typescript
 * isPlainObject({})              // true
 * isPlainObject({ a: 1 })        // true
 * isPlainObject(Object.create(null)) // true
 * isPlainObject([])              // false
 * isPlainObject(new Date())      // false
 * isPlainObject(null)            // false
 * ```
 */
export declare function isPlainObject(value: unknown): value is Record<string, unknown>;
/**
 * Check if value is an object (not null, includes functions)
 *
 * In JavaScript, (almost) everything that's not a primitive is an object:
 * - Plain objects: {}
 * - Arrays: []
 * - Date, Map, Set, etc.
 * - Functions (callable objects)
 *
 * This is the standard object check used throughout the codebase.
 * Note: Functions are considered objects for consistency with JavaScript semantics.
 *
 * @param value - Value to check
 * @returns true if value is an object (including functions)
 *
 * @example
 * ```typescript
 * isObject({})              // true
 * isObject([])              // true
 * isObject(new Date())      // true
 * isObject(() => {})        // true (functions are objects)
 * isObject(null)            // false
 * isObject(undefined)       // false
 * isObject(42)              // false
 * ```
 */
export declare function isObject(value: unknown): value is object;
//# sourceMappingURL=js-types.d.ts.map