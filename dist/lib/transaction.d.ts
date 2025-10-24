/**
 * Transaction API for Ireneo
 *
 * ==============================================================================
 * ARCHITECTURE: TRANSACTION ISOLATION VIA DELTA TRACKING
 * ==============================================================================
 *
 * Transactions provide explicit control over when changes are persisted,
 * essential for UI applications where users expect "save" and "cancel" buttons.
 *
 * DESIGN DECISION: Delta Tracking vs. Copy-on-Write
 *
 * We considered two approaches:
 *
 * 1. **Copy-on-Write** (not chosen)
 *    - Clone entire memory image for each transaction
 *    - Pros: Simple, isolated, no special proxies needed
 *    - Cons: O(n) memory for every transaction, slow for large graphs
 *    - Verdict: Too expensive for UI use cases (frequent edits)
 *
 * 2. **Delta Tracking** (chosen)
 *    - Track only changed paths in a Map<string, value>
 *    - Pros: O(changes) memory, fast, supports checkpoint/restore
 *    - Cons: More complex, requires transaction-specific proxies
 *    - Verdict: Optimal for UI with many small edits
 *
 * HOW IT WORKS:
 *
 * 1. **Base Memory Image** (baseRaw)
 *    - Plain JavaScript object (NOT proxied)
 *    - Contains all persisted state
 *    - Read from persistent EventLog on startup
 *    - Only modified during save()
 *
 * 2. **Delta Layer** (DeltaManager)
 *    - Map<path, value> tracking uncommitted changes
 *    - Example: { "user.name": "Alice", "user.age": 30 }
 *    - Deletions marked with special DELETED symbol
 *    - Checkpoint/restore for rollback support
 *
 * 3. **Transaction Proxy** (createTransactionProxy)
 *    - Wraps baseRaw in a special proxy
 *    - GET: checks delta first, falls back to base
 *    - SET: writes to delta, NOT to base
 *    - DELETE: marks as deleted in delta
 *    - Returns nested transaction proxies (not Ireneo proxies)
 *
 * 4. **Save Flow**:
 *    - Sort delta entries by depth (parents before children)
 *    - Unwrap all proxies recursively (preserve identity via shared WeakMap)
 *    - Apply each change to baseRaw
 *    - Log event to persistent EventLog
 *    - Clear delta
 *
 * 5. **Discard Flow**:
 *    - Simply clear delta
 *    - Base remains unchanged
 *    - User sees original values again
 *
 * WHY TRANSACTION PROXIES ≠ MEMIMG PROXIES:
 *
 * - **Ireneo proxies**: Track mutations, log events, wrap recursively
 * - **Transaction proxies**: Redirect to delta, don't log until save()
 *
 * Can't use Ireneo proxies for transactions because:
 * - Would log events immediately (can't discard)
 * - Would modify base (breaks isolation)
 * - Would create nested proxies (double-wrapping nightmare)
 *
 * CRITICAL FIX (Phase 9):
 *
 * Original transaction.ts reimplemented event replay (~40 lines).
 * WRONG! Violated DRY principle and risked bugs.
 * Fixed: Use replayFromEventLog() from replay.ts.
 * Result: Eliminated duplicate logic, consistent behavior.
 *
 * CHECKPOINT/RESTORE (Error Recovery):
 *
 * UI applications can use checkpoints for script execution:
 * 1. Create checkpoint before running user script
 * 2. Execute script (may mutate transaction)
 * 3. If script throws runtime error:
 *    - Restore checkpoint (discard partial mutations)
 *    - Show error to user
 *    - Transaction returns to pre-script state
 * 4. If script succeeds:
 *    - Discard checkpoint
 *    - User can save or discard at will
 *
 * Note: Syntax errors don't need checkpoints (code never executes).
 *
 * REFACTORING (Phase 9):
 *
 * Original: 505-line monolithic transaction.ts
 * Refactored into:
 * - transaction.ts (194 lines): Public API
 * - delta-manager.ts (118 lines): Delta tracking
 * - proxy-unwrapper.ts (85 lines): Deep unwrapping
 * - transaction-proxy.ts (237 lines): Proxy creation
 *
 * Benefits: Clear separation of concerns, independently testable modules.
 *
 * This two-layer architecture (base + delta) enables UI patterns like:
 * users can experiment freely, then commit or discard changes explicitly.
 */
import type { EventLog } from "./types.js";
/**
 * Transaction manages a memory image with uncommitted changes
 */
export interface Transaction {
    /**
     * The memory image root (transaction proxy for isolation)
     */
    root: unknown;
    /**
     * Check if there are uncommitted changes
     */
    isDirty(): boolean;
    /**
     * Commit uncommitted changes to persistent storage
     * Applies delta to base memory image (triggers event logging)
     */
    save(): Promise<void>;
    /**
     * Discard uncommitted changes
     * Clears transaction delta (baseRaw is unmodified)
     */
    discard(): void;
    /**
     * Get count of uncommitted changes
     */
    getUncommittedCount(): number;
    /**
     * Create a checkpoint of current delta state
     * Returns a checkpoint that can be used to restore delta state later
     */
    createCheckpoint(): Map<string, unknown>;
    /**
     * Restore delta to a previously saved checkpoint
     * Discards all changes made after the checkpoint was created
     */
    restoreCheckpoint(checkpoint: Map<string, unknown>): void;
    /**
     * Unwrap a transaction proxy to get the underlying value
     *
     * Useful for type detection when proxies hide the true type.
     * For example, checking if a proxied value is actually a Date.
     *
     * @param value - Value to unwrap (may be a proxy or raw value)
     * @returns The underlying value without proxy wrapping
     *
     * @example
     * ```typescript
     * const dateProxy = txn.root.user.hiredate;
     * const unwrapped = txn.unwrap(dateProxy);
     * console.log(unwrapped instanceof Date); // true
     * ```
     */
    unwrap(value: unknown): unknown;
}
/**
 * Creates a transaction
 *
 * @param persistentLog - Event log for permanent storage (IndexedDB/file)
 * @returns Transaction object with root and save/discard methods
 *
 * @example
 * ```typescript
 * const persistentLog = createIndexedDBEventLog('myapp', 'events');
 * const txn = await createTransaction(persistentLog);
 *
 * // Make changes (tracked in delta, not persistent yet)
 * txn.root.user = { name: 'Alice' };
 *
 * // Check if dirty
 * console.log(txn.isDirty()); // true
 *
 * // Commit to persistent storage
 * await txn.save();
 *
 * // Make more changes
 * txn.root.user.name = 'Bob';
 *
 * // Rollback changes
 * txn.discard(); // Reverts to 'Alice'
 * ```
 */
export declare function createTransaction(persistentLog: EventLog): Promise<Transaction>;
//# sourceMappingURL=transaction.d.ts.map