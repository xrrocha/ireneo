/**
 * Instance Reconstructor for Class Preservation
 *
 * Handles the restoration of class instances during deserialization by
 * reattaching prototypes to plain objects.
 *
 * Key insight: Use Object.create() to bypass constructor execution while
 * preserving the prototype chain. Constructor side effects don't run, which
 * is correct - we're restoring state, not initializing.
 *
 * Example:
 *   Input:  { __class__: 'Employee', name: 'Alice', salary: 50000 }
 *   Output: Employee instance with working methods like greet()
 */

import type { ClassConstructor } from "./types.js";
import { TYPE_MARKERS } from "./constants.js";

/**
 * Check if a value is a serialized class instance
 *
 * @param value - Value to check
 * @returns true if value has __class__ marker
 */
export function isSerializedClassInstance(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    TYPE_MARKERS.CLASS in value &&
    typeof (value as any)[TYPE_MARKERS.CLASS] === "string"
  );
}

/**
 * Get the class name from a serialized instance
 *
 * @param value - Serialized instance object
 * @returns The class name string
 */
export function getClassName(value: object): string {
  return (value as any)[TYPE_MARKERS.CLASS];
}

/**
 * Reconstruct a class instance from a plain object
 *
 * Takes a deserialized plain object with a __class__ marker and converts it
 * into a proper class instance with the correct prototype chain.
 *
 * Process:
 * 1. Look up the constructor in the registry
 * 2. Create new instance using Object.create(Constructor.prototype)
 * 3. Copy all properties except __class__ to the new instance
 * 4. Return the instance with methods intact
 *
 * @param plainObject - Deserialized object with __class__ marker
 * @param classRegistry - Registry mapping class names to constructors
 * @returns Reconstructed class instance
 * @throws Error if class is not registered
 */
export function reconstructInstance(
  plainObject: Record<string, unknown>,
  classRegistry: Map<string, ClassConstructor>,
): object {
  const className = getClassName(plainObject);

  // Look up constructor in registry
  const Constructor = classRegistry.get(className);
  if (!Constructor) {
    throw new Error(
      `Cannot reconstruct instance of class "${className}" - class not registered. ` +
      `Provide the class constructor in the classes option when calling load().`
    );
  }

  // Create instance with correct prototype, bypassing constructor
  const instance = Object.create(Constructor.prototype);

  // Copy all properties except __class__ marker
  for (const [key, value] of Object.entries(plainObject)) {
    if (key !== TYPE_MARKERS.CLASS) {
      instance[key] = value;
    }
  }

  return instance;
}

/**
 * Check if a value is a class instance (has a non-Object prototype)
 *
 * Used during serialization to detect objects that need __class__ markers.
 *
 * @param value - Value to check
 * @returns true if value is a class instance
 */
export function isClassInstance(value: unknown): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  // Get the prototype
  const proto = Object.getPrototypeOf(value);

  // null prototype or Object.prototype means not a class instance
  if (proto === null || proto === Object.prototype) {
    return false;
  }

  // Check for built-in types that we handle specially
  // (they shouldn't get __class__ markers)
  if (
    value instanceof Date ||
    value instanceof RegExp ||
    value instanceof Map ||
    value instanceof Set ||
    value instanceof Array ||
    value instanceof Error ||
    ArrayBuffer.isView(value) ||
    value instanceof ArrayBuffer
  ) {
    return false;
  }

  // Has a custom prototype - it's a class instance
  return true;
}

/**
 * Get the class name of an instance
 *
 * Returns the constructor name of the class instance.
 *
 * @param value - Class instance
 * @returns The class name, or null if cannot determine
 */
export function getInstanceClassName(value: object): string | null {
  const proto = Object.getPrototypeOf(value);
  if (!proto || proto === Object.prototype) {
    return null;
  }

  const constructor = proto.constructor;
  if (!constructor || !constructor.name) {
    return null;
  }

  return constructor.name;
}
