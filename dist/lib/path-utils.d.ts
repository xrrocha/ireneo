/**
 * Path Utilities - Centralized path traversal and manipulation
 *
 * This module eliminates the 4+ duplicated path traversal loops throughout
 * the codebase, providing consistent path operations for replay, transaction,
 * and serialization modules.
 */
import type { Path } from './types.js';
/**
 * Navigate to a path in an object graph
 *
 * This is the core path traversal logic used by replay, transaction,
 * and deserialization modules.
 *
 * @param root - The root object
 * @param path - Path to navigate
 * @param options - Navigation options
 * @returns Object at the path, or { target, key } if navigating to parent
 *
 * @example
 * ```typescript
 * const obj = navigateToPath(root, ['emps', 'king', 'ename']);
 * // Returns the object at root.emps.king.ename
 *
 * const { target, key } = navigateToPath(root, ['emps', 'king', 'sal'], { parent: true });
 * // Returns { target: root.emps.king, key: 'sal' }
 * // Now can do: target[key] = 5000
 * ```
 */
export declare function navigateToPath(root: any, path: Path, options?: {
    /** Create intermediate objects if they don't exist */
    create?: boolean;
    /** Navigate to parent (all but last segment) */
    parent?: boolean;
}): any | {
    target: any;
    key: string | null;
};
/**
 * Get value at path
 *
 * Safe path traversal that returns undefined if path doesn't exist.
 *
 * @param root - The root object
 * @param path - Path to the value
 * @returns Value at path, or undefined if not found
 */
export declare function getAtPath(root: any, path: Path): any;
/**
 * Set value at path, creating intermediate objects as needed
 *
 * This is the core setter used by replay and transaction modules.
 *
 * @param root - The root object
 * @param path - Path where to set the value
 * @param value - Value to set
 *
 * @example
 * ```typescript
 * setAtPath(root, ['emps', 'king', 'sal'], 5000);
 * // Creates root.emps and root.emps.king if they don't exist
 * // Then sets root.emps.king.sal = 5000
 * ```
 */
export declare function setAtPath(root: any, path: Path, value: unknown): void;
/**
 * Delete value at path
 *
 * Used by replay and transaction modules for DELETE events.
 *
 * @param root - The root object
 * @param path - Path to delete
 */
export declare function deleteAtPath(root: any, path: Path): void;
/**
 * Check if a path segment represents a numeric array index
 *
 * Used during path traversal to determine whether to create an array
 * or object as an intermediate value.
 *
 * @param key - The key to check
 * @returns true if key is a numeric string like "0", "42", etc.
 */
export declare function isNumericKey(key: string): boolean;
/**
 * Convert path array to dot-separated string
 *
 * @param path - Path array
 * @returns Dot-separated string like "emps.king.sal"
 */
export declare function pathToString(path: Path): string;
/**
 * Convert dot-separated string to path array
 *
 * @param pathString - Dot-separated path string
 * @returns Path array
 */
export declare function stringToPath(pathString: string): Path;
/**
 * Check if a path is valid (all segments accessible from root)
 *
 * @param root - The root object
 * @param path - Path to validate
 * @returns true if path exists and is accessible
 */
export declare function isValidPath(root: any, path: Path): boolean;
/**
 * Get parent path (all but last segment)
 *
 * @param path - The path
 * @returns Parent path, or null if path has no parent
 */
export declare function getParentPath(path: Path): Path | null;
/**
 * Get the last segment of a path (the leaf)
 *
 * @param path - The path
 * @returns Last segment, or 'root' if path is empty
 */
export declare function getPathLeaf(path: Path): string;
//# sourceMappingURL=path-utils.d.ts.map