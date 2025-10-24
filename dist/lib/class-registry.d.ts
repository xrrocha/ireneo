/**
 * Class Registry for Instance Preservation
 *
 * Maintains the mapping between class names and their constructors,
 * enabling class instances to survive serialization/deserialization.
 *
 * Key responsibilities:
 * - Store class name -> constructor mappings
 * - Validate class name uniqueness
 * - Provide lookup for prototype restoration
 * - Support both explicit names and auto-detection
 */
import type { ClassConstructor, ClassRegistry } from "./types.js";
/**
 * Internal registry implementation
 *
 * Uses Map for O(1) lookups and efficient iteration.
 * Validates uniqueness to prevent accidental overwrites.
 */
declare class ClassRegistryImpl {
    private registry;
    /**
     * Register a class constructor with an optional name
     *
     * @param constructor - The class constructor function
     * @param name - Optional explicit name (defaults to constructor.name)
     * @throws Error if class name is already registered with different constructor
     */
    register(constructor: ClassConstructor, name?: string): void;
    /**
     * Register multiple classes from an object
     *
     * @param classes - Object mapping names to constructors
     * @example
     * registry.registerAll({
     *   Employee: Employee,
     *   Department: Department
     * })
     */
    registerAll(classes: ClassRegistry): void;
    /**
     * Look up a constructor by class name
     *
     * @param className - The name of the class to look up
     * @returns The constructor function, or undefined if not found
     */
    lookup(className: string): ClassConstructor | undefined;
    /**
     * Get a constructor by class name (Map-compatible interface)
     *
     * Alias for lookup() to make ClassRegistryImpl compatible with Map interface.
     *
     * @param className - The name of the class to look up
     * @returns The constructor function, or undefined if not found
     */
    get(className: string): ClassConstructor | undefined;
    /**
     * Get the registered class name for a constructor
     *
     * @param constructor - The constructor to look up
     * @returns The registered name, or undefined if not found
     */
    getClassName(constructor: ClassConstructor): string | undefined;
    /**
     * Check if a class name is registered
     *
     * @param className - The name to check
     * @returns true if the class is registered
     */
    has(className: string): boolean;
    /**
     * Get all registered class names
     *
     * @returns Array of registered class names
     */
    getClassNames(): string[];
    /**
     * Clear all registered classes
     *
     * Useful for testing or resetting state.
     */
    clear(): void;
}
/**
 * Create a new class registry
 *
 * @param classes - Optional initial set of classes to register
 * @returns A new ClassRegistryImpl instance
 */
export declare function createClassRegistry(classes?: ClassRegistry): ClassRegistryImpl;
/**
 * Global class registry instance
 *
 * Note: In production, users will provide their own registry when calling
 * Ireneo.create() or Ireneo.load(). This global instance is primarily for
 * testing and simple use cases.
 */
export declare const globalClassRegistry: ClassRegistryImpl;
export {};
//# sourceMappingURL=class-registry.d.ts.map