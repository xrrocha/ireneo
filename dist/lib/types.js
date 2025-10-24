/**
 * Core type definitions for Memory Image Processor
 *
 * These types define the event sourcing and serialization infrastructure.
 */
/**
 * Convert immutable Path to mutable array.
 *
 * Use this when you need to modify a path (e.g., navigation state updates).
 */
export function toMutablePath(path) {
    return [...path];
}
/**
 * Convert mutable array to immutable Path.
 *
 * Use this when passing navigation state to Ireneo functions.
 */
export function toPath(path) {
    return path;
}
/**
 * Type assertion: Mark a value as proxied.
 *
 * **Runtime behavior:** This is a no-op identity function. It simply returns
 * the input value unchanged. The branding exists only at the type level.
 *
 * **When to use:** When you've just created a Proxy and need to mark it as
 * Proxied<T> for type safety. Example: after `new Proxy(target, handler)`.
 *
 * @param value The proxy to brand as Proxied<T>
 * @returns The same value, typed as Proxied<T>
 *
 * @example
 * ```typescript
 * const target = { name: 'Alice' };
 * const proxy = new Proxy(target, handler);
 * const branded = asProxied(proxy);  // Now typed as Proxied<typeof target>
 * ```
 */
export function asProxied(value) {
    return value;
}
/**
 * Type assertion: Mark a value as a target (unwrapped).
 *
 * **Runtime behavior:** This is a no-op identity function. It simply returns
 * the input value unchanged. The branding exists only at the type level.
 *
 * **When to use:** When you have a plain object that you know is not proxied
 * and want to mark it as Target<T> for type safety.
 *
 * @param value The object to brand as Target<T>
 * @returns The same value, typed as Target<T>
 *
 * @example
 * ```typescript
 * const obj = { name: 'Alice' };
 * const branded = asTarget(obj);  // Now typed as Target<typeof obj>
 * ```
 */
export function asTarget(value) {
    return value;
}
/**
 * Type assertion: Remove branding from a value.
 *
 * **Runtime behavior:** This is a no-op identity function. It simply returns
 * the input value unchanged. The unbranding exists only at the type level.
 *
 * **When to use:** When you need to work with the underlying structure without
 * caring about proxy/target distinction (e.g., during serialization).
 *
 * @param value The branded value to unbrand
 * @returns The same value, with branding removed
 *
 * @example
 * ```typescript
 * const proxied: Proxied<User> = ...;
 * const unbranded = unbrand(proxied);  // Now typed as User (no brand)
 * JSON.stringify(unbranded);  // Works without brand getting in the way
 * ```
 */
export function unbrand(value) {
    return value;
}
// ============================================================================
// Type Guards
// ============================================================================
/**
 * Check if a value is a serialized reference
 */
export const isSerializedReference = (value) => {
    return (typeof value === "object" &&
        value !== null &&
        "__type__" in value &&
        value.__type__ === "ref" &&
        "path" in value);
};
/**
 * Check if a value is an unresolved reference (during deserialization)
 */
export const isUnresolvedReference = (value) => {
    return (typeof value === "object" &&
        value !== null &&
        "__isUnresolved" in value &&
        value.__isUnresolved === true);
};
/**
 * Check if a value is an object (not null)
 */
export const isObject = (value) => {
    return typeof value === "object" && value !== null;
};
//# sourceMappingURL=types.js.map