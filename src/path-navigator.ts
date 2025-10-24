/**
 * Path Navigation Utility
 *
 * Unified logic for navigating object graphs with Map/Set awareness.
 * Eliminates duplication between transaction.ts, replay.ts, and other files.
 *
 * DESIGN:
 * - Supports both read-only navigation (transaction apply) and auto-creation (replay)
 * - Handles Map collections specially (target.get vs target[key])
 * - Handles Set collections (though Sets don't have nested access)
 * - Creates intermediate objects/arrays as needed during replay
 */

import type { Path } from "./types.js";

/**
 * Navigation options
 */
export interface NavigateOptions {
  /**
   * If true, creates missing intermediate objects/arrays.
   * If false, returns undefined if path doesn't exist.
   */
  createIntermediates?: boolean;
}

/**
 * Navigation result
 */
export interface NavigateResult {
  /**
   * The parent object containing the final property
   */
  parent: unknown;

  /**
   * The final property key to access/modify
   */
  key: string;

  /**
   * Whether the full path exists (always true if createIntermediates=true)
   */
  exists: boolean;
}

/**
 * Navigates to a path in an object graph, handling Maps specially.
 *
 * This function navigates to the PARENT of the final path segment,
 * returning both the parent and the final key. This allows the caller
 * to read, write, or delete the final property.
 *
 * Examples:
 * - Path ['users', 'alice', 'age'] → parent = users.alice, key = 'age'
 * - Path ['data', 'items', '0'] → parent = data.items, key = '0'
 * - Path ['map', 'key1', 'nested'] → parent = map.get('key1'), key = 'nested'
 *
 * @param root - The root object to navigate from
 * @param path - Array of path segments (e.g., ['users', 'alice', 'age'])
 * @param options - Navigation options
 * @returns Navigation result with parent, key, and exists flag
 */
export function navigateToParent(
  root: unknown,
  path: Path,
  options: NavigateOptions = {}
): NavigateResult | null {
  const { createIntermediates = false } = options;

  // Handle empty path
  if (path.length === 0) {
    return null;
  }

  // Single segment - parent is root
  if (path.length === 1) {
    return {
      parent: root,
      key: path[0]!,
      exists: true, // We can't check existence without accessing, let caller decide
    };
  }

  // Navigate to parent (all segments except last)
  let current: any = root;
  let exists = true;

  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i];
    if (!segment) continue; // Skip undefined segments

    // Handle Map access
    if (current instanceof Map) {
      if (!current.has(segment)) {
        if (createIntermediates) {
          // Look ahead to determine if we should create array or object
          const nextSegment = path[i + 1];
          const newValue = nextSegment && /^\d+$/.test(nextSegment) ? [] : {};
          current.set(segment, newValue);
        } else {
          exists = false;
          break;
        }
      }
      current = current.get(segment);
    } else if (current !== null && typeof current === 'object') {
      // Handle object/array access
      if (!(segment in current)) {
        if (createIntermediates) {
          // Look ahead to determine if we should create array or object
          const nextSegment = path[i + 1];
          current[segment] = nextSegment && /^\d+$/.test(nextSegment) ? [] : {};
        } else {
          exists = false;
          break;
        }
      }
      current = current[segment];
    } else {
      // Current is not an object/Map, can't navigate further
      exists = false;
      break;
    }
  }

  const finalKey = path[path.length - 1]!;

  return {
    parent: current,
    key: finalKey,
    exists,
  };
}

/**
 * Gets a value at a path in an object graph.
 *
 * @param root - The root object
 * @param path - Path to navigate
 * @returns The value at the path, or undefined if not found
 */
export function getAtPath(root: unknown, path: Path): unknown {
  const result = navigateToParent(root, path, { createIntermediates: false });
  if (!result || !result.exists) {
    return undefined;
  }

  const { parent, key } = result;

  if (parent instanceof Map) {
    return parent.get(key);
  } else if (parent !== null && typeof parent === 'object') {
    return (parent as Record<string, unknown>)[key];
  }

  return undefined;
}

/**
 * Sets a value at a path in an object graph.
 * Creates intermediate objects/arrays as needed.
 *
 * @param root - The root object
 * @param path - Path to navigate
 * @param value - Value to set
 * @returns True if successful, false otherwise
 */
export function setAtPath(root: unknown, path: Path, value: unknown): boolean {
  const result = navigateToParent(root, path, { createIntermediates: true });
  if (!result) {
    return false;
  }

  const { parent, key } = result;

  if (parent instanceof Map) {
    parent.set(key, value);
    return true;
  } else if (parent !== null && typeof parent === 'object') {
    (parent as Record<string, unknown>)[key] = value;
    return true;
  }

  return false;
}

/**
 * Deletes a value at a path in an object graph.
 *
 * @param root - The root object
 * @param path - Path to navigate
 * @returns True if successful, false otherwise
 */
export function deleteAtPath(root: unknown, path: Path): boolean {
  const result = navigateToParent(root, path, { createIntermediates: false });
  if (!result || !result.exists) {
    return false;
  }

  const { parent, key } = result;

  if (parent instanceof Map) {
    parent.delete(key);
    return true;
  } else if (parent instanceof Set) {
    parent.delete(key);
    return true;
  } else if (parent !== null && typeof parent === 'object') {
    delete (parent as Record<string, unknown>)[key];
    return true;
  }

  return false;
}
