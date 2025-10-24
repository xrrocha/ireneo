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
/**
 * Check if a value is a serialized class instance
 *
 * @param value - Value to check
 * @returns true if value has __class__ marker
 */
export declare function isSerializedClassInstance(value: unknown): boolean;
/**
 * Get the class name from a serialized instance
 *
 * @param value - Serialized instance object
 * @returns The class name string
 */
export declare function getClassName(value: object): string;
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
export declare function reconstructInstance(plainObject: Record<string, unknown>, classRegistry: Map<string, ClassConstructor>): object;
/**
 * Check if a value is a class instance (has a non-Object prototype)
 *
 * Used during serialization to detect objects that need __class__ markers.
 *
 * @param value - Value to check
 * @returns true if value is a class instance
 */
export declare function isClassInstance(value: unknown): boolean;
/**
 * Get the class name of an instance
 *
 * Returns the constructor name of the class instance.
 *
 * @param value - Class instance
 * @returns The class name, or null if cannot determine
 */
export declare function getInstanceClassName(value: object): string | null;
//# sourceMappingURL=instance-reconstructor.d.ts.map