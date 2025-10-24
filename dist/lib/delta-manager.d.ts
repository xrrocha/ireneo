/**
 * Delta Manager - Transaction change tracking
 *
 * Manages the delta Map that tracks uncommitted changes in a transaction.
 * Provides checkpoint/restore functionality for rollback support.
 *
 * Extracted from transaction.ts to separate concerns and improve testability.
 */
/**
 * Delta Manager for tracking transaction changes
 *
 * Changes are stored as path → value mappings, where path is a dot-separated
 * string like "user.profile.name". Deletions are marked with a special DELETED symbol.
 */
export declare class DeltaManager {
    private delta;
    private readonly DELETED;
    /**
     * Get deletion marker symbol
     */
    getDeletedSymbol(): symbol;
    /**
     * Check if there are any uncommitted changes
     */
    isDirty(): boolean;
    /**
     * Get count of uncommitted changes
     */
    size(): number;
    /**
     * Check if a path exists in delta
     */
    has(pathKey: string): boolean;
    /**
     * Get value at path from delta
     */
    get(pathKey: string): unknown;
    /**
     * Set value at path in delta
     */
    set(pathKey: string, value: unknown): void;
    /**
     * Mark a path as deleted in delta
     */
    delete(pathKey: string): void;
    /**
     * Check if a path is marked as deleted
     */
    isDeleted(pathKey: string): boolean;
    /**
     * Clear all uncommitted changes
     */
    clear(): void;
    /**
     * Get all delta entries
     *
     * Returns array of [pathKey, value] tuples, sorted by path depth
     * (shallowest first). This ensures parent objects are created before children.
     */
    entries(): Array<[string, unknown]>;
    /**
     * Create a checkpoint of current delta state
     *
     * Returns a shallow copy of the delta Map that can be used to restore state later.
     * Used for transaction rollback (e.g., when script execution fails).
     */
    createCheckpoint(): Map<string, unknown>;
    /**
     * Restore delta to a previously saved checkpoint
     *
     * Discards all changes made after the checkpoint was created.
     */
    restoreCheckpoint(checkpoint: Map<string, unknown>): void;
}
//# sourceMappingURL=delta-manager.d.ts.map