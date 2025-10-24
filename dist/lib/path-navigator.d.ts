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
export declare function navigateToParent(root: unknown, path: Path, options?: NavigateOptions): NavigateResult | null;
/**
 * Gets a value at a path in an object graph.
 *
 * @param root - The root object
 * @param path - Path to navigate
 * @returns The value at the path, or undefined if not found
 */
export declare function getAtPath(root: unknown, path: Path): unknown;
/**
 * Sets a value at a path in an object graph.
 * Creates intermediate objects/arrays as needed.
 *
 * @param root - The root object
 * @param path - Path to navigate
 * @param value - Value to set
 * @returns True if successful, false otherwise
 */
export declare function setAtPath(root: unknown, path: Path, value: unknown): boolean;
/**
 * Deletes a value at a path in an object graph.
 *
 * @param root - The root object
 * @param path - Path to navigate
 * @returns True if successful, false otherwise
 */
export declare function deleteAtPath(root: unknown, path: Path): boolean;
//# sourceMappingURL=path-navigator.d.ts.map