/**
 * Collection Strategy Pattern
 *
 * Unified interface for handling different collection types (Array, Map, Set).
 * Eliminates if/else chains and makes adding new collection types easier.
 *
 * DESIGN GOALS:
 * 1. Single source of truth for collection-specific behavior
 * 2. Data-driven approach (like collection-wrapper.ts)
 * 3. Easy to extend with new collection types
 * 4. Type-safe with branded types
 */

import type {
  Path,
  EventLog,
  ProxyInfrastructure,
  ReplayState,
  Proxied,
  Target,
} from "./types.js";
import { asProxied, asTarget } from "./types.js";
import { wrapCollectionMethod } from "./collection-wrapper.js";
import {
  MUTATING_ARRAY_METHODS,
  MUTATING_MAP_METHODS,
  MUTATING_SET_METHODS,
} from "./constants.js";

// ============================================================================
// Collection Strategy Interface
// ============================================================================

/**
 * Strategy for handling a specific collection type
 */
export interface CollectionStrategy<T = any> {
  /**
   * Check if this strategy applies to the given value
   */
  isApplicable(value: unknown): value is T;

  /**
   * Get collection type name for event logging
   */
  readonly typeName: "Array" | "Map" | "Set";

  /**
   * Get list of mutating method names
   */
  readonly mutatingMethods: readonly string[];

  /**
   * Recursively wrap collection contents during initial wrapping
   *
   * @param collection - The collection to wrap (mutated in place)
   * @param path - Path to this collection
   * @param wrapValue - Function to wrap individual values
   */
  wrapContents(
    collection: T,
    path: Path,
    wrapValue: (value: unknown, itemPath: Path) => unknown
  ): void;

  /**
   * Check if a property access is a collection method
   */
  isMethod(collection: T, property: string | symbol): boolean;

  /**
   * Check if a method is mutating
   */
  isMutatingMethod(methodName: string): boolean;

  /**
   * Wrap a mutating collection method for event logging
   *
   * @param collection - The collection instance
   * @param methodName - Method being called
   * @param originalMethod - Original method function
   * @param infrastructure - Proxy infrastructure
   * @param eventLog - Event log for mutations
   * @param replayState - Replay state flag
   */
  wrapMutatingMethod(
    collection: T,
    methodName: string,
    originalMethod: Function,
    infrastructure: ProxyInfrastructure,
    eventLog?: EventLog,
    replayState?: ReplayState
  ): Function;
}

// ============================================================================
// Array Strategy
// ============================================================================

class ArrayStrategy implements CollectionStrategy<any[]> {
  readonly typeName = "Array" as const;
  readonly mutatingMethods = MUTATING_ARRAY_METHODS;

  isApplicable(value: unknown): value is any[] {
    return Array.isArray(value);
  }

  wrapContents(
    array: any[],
    path: Path,
    wrapValue: (value: unknown, itemPath: Path) => unknown
  ): void {
    for (let i = 0; i < array.length; i++) {
      const itemPath = [...path, String(i)];
      array[i] = wrapValue(array[i], itemPath);
    }
  }

  isMethod(array: any[], property: string | symbol): boolean {
    return (
      typeof property === "string" &&
      typeof array[property as keyof typeof array] === "function"
    );
  }

  isMutatingMethod(methodName: string): boolean {
    return this.mutatingMethods.includes(methodName as any);
  }

  wrapMutatingMethod(
    array: any[],
    methodName: string,
    originalMethod: Function,
    infrastructure: ProxyInfrastructure,
    eventLog?: EventLog,
    replayState?: ReplayState
  ): Function {
    return wrapCollectionMethod(
      asTarget(array),
      this.typeName,
      methodName,
      originalMethod as any,
      infrastructure,
      eventLog,
      replayState
    );
  }
}

// ============================================================================
// Map Strategy
// ============================================================================

class MapStrategy implements CollectionStrategy<Map<any, any>> {
  readonly typeName = "Map" as const;
  readonly mutatingMethods = MUTATING_MAP_METHODS;

  isApplicable(value: unknown): value is Map<any, any> {
    return value instanceof Map;
  }

  wrapContents(
    map: Map<any, any>,
    path: Path,
    wrapValue: (value: unknown, itemPath: Path) => unknown
  ): void {
    const entries = Array.from(map.entries());
    map.clear();
    for (const [k, v] of entries) {
      const keyPath = [...path, String(k)];
      const wrappedKey = wrapValue(k, keyPath);
      const wrappedValue = wrapValue(v, keyPath);
      map.set(wrappedKey, wrappedValue);
    }
  }

  isMethod(map: Map<any, any>, property: string | symbol): boolean {
    return (
      typeof property === "string" &&
      typeof (map as any)[property] === "function"
    );
  }

  isMutatingMethod(methodName: string): boolean {
    return this.mutatingMethods.includes(methodName as any);
  }

  wrapMutatingMethod(
    map: Map<any, any>,
    methodName: string,
    originalMethod: Function,
    infrastructure: ProxyInfrastructure,
    eventLog?: EventLog,
    replayState?: ReplayState
  ): Function {
    return wrapCollectionMethod(
      asTarget(map),
      this.typeName,
      methodName,
      originalMethod as any,
      infrastructure,
      eventLog,
      replayState
    );
  }
}

// ============================================================================
// Set Strategy
// ============================================================================

class SetStrategy implements CollectionStrategy<Set<any>> {
  readonly typeName = "Set" as const;
  readonly mutatingMethods = MUTATING_SET_METHODS;

  isApplicable(value: unknown): value is Set<any> {
    return value instanceof Set;
  }

  wrapContents(
    set: Set<any>,
    path: Path,
    wrapValue: (value: unknown, itemPath: Path) => unknown
  ): void {
    const values = Array.from(set.values());
    set.clear();
    for (const v of values) {
      const itemPath = [...path, String(v)];
      const wrappedValue = wrapValue(v, itemPath);
      set.add(wrappedValue);
    }
  }

  isMethod(set: Set<any>, property: string | symbol): boolean {
    return (
      typeof property === "string" &&
      typeof (set as any)[property] === "function"
    );
  }

  isMutatingMethod(methodName: string): boolean {
    return this.mutatingMethods.includes(methodName as any);
  }

  wrapMutatingMethod(
    set: Set<any>,
    methodName: string,
    originalMethod: Function,
    infrastructure: ProxyInfrastructure,
    eventLog?: EventLog,
    replayState?: ReplayState
  ): Function {
    return wrapCollectionMethod(
      asTarget(set),
      this.typeName,
      methodName,
      originalMethod as any,
      infrastructure,
      eventLog,
      replayState
    );
  }
}

// ============================================================================
// Strategy Registry
// ============================================================================

/**
 * Registry of all collection strategies
 * Strategies are checked in order until one matches
 */
const strategies: readonly CollectionStrategy[] = [
  new ArrayStrategy(),
  new MapStrategy(),
  new SetStrategy(),
];

/**
 * Find the appropriate strategy for a value
 * @returns Strategy if value is a collection, undefined otherwise
 */
export function getCollectionStrategy(
  value: unknown
): CollectionStrategy | undefined {
  return strategies.find((strategy) => strategy.isApplicable(value));
}

/**
 * Check if a value is a collection (Array, Map, or Set)
 */
export function isCollection(value: unknown): boolean {
  return getCollectionStrategy(value) !== undefined;
}

/**
 * Wrap collection contents recursively
 */
export function wrapCollectionContents(
  collection: unknown,
  path: Path,
  wrapValue: (value: unknown, itemPath: Path) => unknown
): void {
  const strategy = getCollectionStrategy(collection);
  if (strategy) {
    strategy.wrapContents(collection as any, path, wrapValue);
  }
}
