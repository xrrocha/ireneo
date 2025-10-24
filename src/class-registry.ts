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
class ClassRegistryImpl {
  private registry = new Map<string, ClassConstructor>();

  /**
   * Register a class constructor with an optional name
   *
   * @param constructor - The class constructor function
   * @param name - Optional explicit name (defaults to constructor.name)
   * @throws Error if class name is already registered with different constructor
   */
  register(constructor: ClassConstructor, name?: string): void {
    const className = name || constructor.name;

    if (!className) {
      throw new Error(
        "Cannot register class without a name. " +
        "Provide an explicit name or use a named class."
      );
    }

    const existing = this.registry.get(className);
    if (existing && existing !== constructor) {
      throw new Error(
        `Class name "${className}" is already registered with a different constructor. ` +
        `Use explicit names to avoid conflicts.`
      );
    }

    this.registry.set(className, constructor);
  }

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
  registerAll(classes: ClassRegistry): void {
    for (const [name, constructor] of Object.entries(classes)) {
      this.register(constructor, name);
    }
  }

  /**
   * Look up a constructor by class name
   *
   * @param className - The name of the class to look up
   * @returns The constructor function, or undefined if not found
   */
  lookup(className: string): ClassConstructor | undefined {
    return this.registry.get(className);
  }

  /**
   * Get a constructor by class name (Map-compatible interface)
   *
   * Alias for lookup() to make ClassRegistryImpl compatible with Map interface.
   *
   * @param className - The name of the class to look up
   * @returns The constructor function, or undefined if not found
   */
  get(className: string): ClassConstructor | undefined {
    return this.lookup(className);
  }

  /**
   * Get the registered class name for a constructor
   *
   * @param constructor - The constructor to look up
   * @returns The registered name, or undefined if not found
   */
  getClassName(constructor: ClassConstructor): string | undefined {
    for (const [name, ctor] of this.registry.entries()) {
      if (ctor === constructor) {
        return name;
      }
    }
    return undefined;
  }

  /**
   * Check if a class name is registered
   *
   * @param className - The name to check
   * @returns true if the class is registered
   */
  has(className: string): boolean {
    return this.registry.has(className);
  }

  /**
   * Get all registered class names
   *
   * @returns Array of registered class names
   */
  getClassNames(): string[] {
    return Array.from(this.registry.keys());
  }

  /**
   * Clear all registered classes
   *
   * Useful for testing or resetting state.
   */
  clear(): void {
    this.registry.clear();
  }
}

/**
 * Create a new class registry
 *
 * @param classes - Optional initial set of classes to register
 * @returns A new ClassRegistryImpl instance
 */
export function createClassRegistry(classes?: ClassRegistry): ClassRegistryImpl {
  const registry = new ClassRegistryImpl();
  if (classes) {
    registry.registerAll(classes);
  }
  return registry;
}

/**
 * Global class registry instance
 *
 * Note: In production, users will provide their own registry when calling
 * Ireneo.create() or Ireneo.load(). This global instance is primarily for
 * testing and simple use cases.
 */
export const globalClassRegistry = new ClassRegistryImpl();
