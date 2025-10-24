/**
 * Transaction Proxy - Proxy creation for transaction isolation
 *
 * Creates proxies that intercept all property access and modifications,
 * tracking changes in the delta manager for later commit or discard.
 *
 * Extracted from transaction.ts to separate proxy logic from transaction API.
 */
import type { DeltaManager } from './delta-manager.js';
/**
 * Creates a transaction wrapper around a memory image
 *
 * All reads check delta first, then fall back to base.
 * All writes go to delta only (not applied to base until commit).
 *
 * @param memimg - The base memory image
 * @param deltaManager - Delta manager for tracking changes
 * @param path - Current path in object graph
 * @param proxyCache - Cache to ensure same proxy instance for same object
 * @param targetCache - Reverse cache (proxy → target) for unwrapping
 * @returns Transaction proxy
 */
export declare function createTransactionProxy(memimg: any, deltaManager: DeltaManager, path: string[], proxyCache: WeakMap<object, any>, targetCache: WeakMap<object, any>): any;
//# sourceMappingURL=transaction-proxy.d.ts.map