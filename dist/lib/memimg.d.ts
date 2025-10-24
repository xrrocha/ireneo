/**
 * Ireneo - Memory Image Processor
 *
 * ==============================================================================
 * ARCHITECTURE OVERVIEW
 * ==============================================================================
 *
 * Ireneo implements transparent event-sourced persistence for JavaScript object
 * graphs. It wraps your objects in proxies that automatically log every mutation
 * as an event, enabling:
 * - Full audit trails of all changes
 * - Time-travel debugging (replay to any point)
 * - Efficient delta-based synchronization
 * - Automatic snapshots with cycle handling
 *
 * CORE CONCEPTS:
 *
 * 1. **Transparent Proxies** (proxy.ts)
 *    Every object assigned to the memory image gets wrapped in a proxy that
 *    intercepts mutations (set, delete, array methods, Map/Set operations).
 *    Users interact with normal-looking objects; the proxies are invisible.
 *
 * 2. **Event Sourcing** (event-handlers.ts, event-log.ts)
 *    Every mutation generates an event with:
 *    - Type (SET, DELETE, ARRAY_PUSH, MAP_SET, etc.)
 *    - Path (location in object graph: ['emps', 'king', 'sal'])
 *    - Value (serialized with smart reference detection)
 *    - Timestamp
 *
 * 3. **Path-Based Addressing** (path-utils.ts)
 *    Objects are addressed by their path from root: ['emps', 'king', 'sal']
 *    This enables:
 *    - Cycle detection (if object already has a path, create reference)
 *    - Navigation (find any object by path)
 *    - Event targeting (events know exactly where to apply)
 *
 * 4. **Smart Serialization** (serialize.ts)
 *    Two modes for different purposes:
 *    a) Snapshot mode: Serialize entire graph with cycle detection
 *       - Tracks all objects seen during THIS serialization
 *       - Creates refs for any object encountered twice
 *       - Used for full snapshots (export, backup)
 *    b) Event mode: Serialize values with smart reference detection
 *       - Only creates refs for objects OUTSIDE current value tree
 *       - Detects internal cycles separately
 *       - Used for event logging (preserves object identity)
 *
 * 5. **Event Replay** (replay.ts)
 *    Reconstructs state by replaying events in order:
 *    - Applies each event using targetToPath navigation
 *    - Replayable events === reproducible state
 *    - Enables time-travel, branching, synchronization
 *
 * 6. **Transaction Isolation** (transaction.ts, delta-manager.ts)
 *    Optional layer for uncommitted changes:
 *    - Delta tracks modifications in-memory
 *    - save() applies delta to base + logs events
 *    - discard() clears delta without persisting
 *    - Checkpoint/restore for error recovery
 *
 * DESIGN PHILOSOPHY:
 *
 * - **Zero coupling**: Ireneo has no dependencies on UI or application code.
 *   It's a pure event-sourcing engine that works with any JavaScript objects.
 *
 * - **Pluggable storage**: EventLog interface abstracts persistence.
 *   Implementations exist for IndexedDB, localStorage, filesystem, REST APIs.
 *
 * - **Minimal API surface**: createMemoryImage(), serialize(), deserialize(),
 *   replay() - that's it. Everything else is implementation detail.
 *
 * - **WeakMap-based tracking**: All proxy-target mappings use WeakMaps,
 *   so objects can be garbage collected when no longer reachable.
 *
 * - **No magic strings**: All event types and markers are centralized
 *   in constants.ts, eliminating typos and enabling IDE autocomplete.
 *
 * REFACTORING HIGHLIGHTS (Phases 0-10):
 *
 * - Eliminated 265+ lines of switch cases via event handler registry
 * - Unified 100+ lines of duplicate serialization logic
 * - Reduced 90+ lines of collection wrapper duplication
 * - Fixed ObjectType proxy enumeration bug
 * - Established clean boundaries (ireneo has no dependencies)
 * - Added transaction isolation with delta tracking
 *
 * KEY INSIGHT - The Event Loop:
 *
 * 1. User mutates object: `emp.sal = 5000`
 * 2. Proxy intercepts SET operation
 * 3. Mutation applied to underlying object
 * 4. Event created via registry: { type: 'SET', path: ['emp', 'sal'], value: 5000 }
 * 5. Event logged to EventLog (if provided)
 * 6. Later: replay events to reconstruct state
 *
 * This module orchestrates all these pieces, providing a clean public API
 * while hiding the complexity of proxy wrapping, event logging, and serialization.
 */
import type { MemoryImageOptions, ProxyInfrastructure, MetadataProvider } from "./types.js";
/**
 * Creates a memory image - a transparent proxy wrapper around a root object
 * that tracks all mutations and optionally logs them as events.
 *
 * RUNTIME BEHAVIOR:
 *
 * When you call createMemoryImage(), several things happen:
 *
 * 1. **Infrastructure Setup**
 *    Creates three WeakMaps for tracking (proxy.ts:createProxyInfrastructure):
 *    - targetToProxy: Ensures same object always gets same proxy (identity)
 *    - proxyToTarget: Unwraps proxies for serialization
 *    - targetToPath: Maps objects to their canonical path in graph
 *
 * 2. **Recursive Wrapping**
 *    The root and all its descendants are wrapped (proxy.ts:wrapIfNeeded):
 *    - Objects/arrays → Proxy with traps for get/set/deleteProperty
 *    - Maps/Sets → Proxy with wrapped mutation methods
 *    - Functions → Proxy with metadata attached for serialization
 *    - Primitives/Dates → Pass through unwrapped (immutable)
 *
 * 3. **Cycle Handling**
 *    Critical design: wrap BEFORE recursing into properties.
 *    - Register proxy in targetToProxy immediately
 *    - Then recurse into properties
 *    - If we see same object again, targetToProxy.has() returns true
 *    - Return existing proxy instead of creating new one
 *    - This breaks cycles: emp.dept.employees includes emp
 *
 * 4. **Event Logging Setup**
 *    If eventLog provided, proxies will log mutations:
 *    - set trap → eventRegistry.createEvent('SET', ...) → eventLog.append()
 *    - deleteProperty trap → eventRegistry.createEvent('DELETE', ...)
 *    - Collection methods → eventRegistry.createEvent('ARRAY_PUSH', ...)
 *
 * 5. **Registry Storage**
 *    Root proxy registered in global WeakMap for:
 *    - Serialization (needs access to targetToProxy, targetToPath)
 *    - Metadata queries (UI layers can use this for presentation hints)
 *
 * DESIGN TRADE-OFFS:
 *
 * Why proxy the ENTIRE graph?
 * - Ensures ALL mutations are tracked, even deep nested changes
 * - Alternative (shallow proxy) would miss deep mutations
 * - Cost: O(n) wrapping time, but wrapping is lazy for new values
 *
 * Why WeakMaps instead of Maps?
 * - Prevents memory leaks: unreachable objects can be garbage collected
 * - Regular Maps would hold strong references, preventing GC
 * - Cost: WeakMap keys must be objects (not primitives)
 *
 * Why global registry?
 * - Serialization needs targetToProxy but root proxy doesn't expose it
 * - Alternative: attach metadata to proxy - pollutes object with __memimg__
 * - This way: clean API, no visible metadata, WeakMap = no memory leak
 *
 * @param root - The root object to wrap (default: empty object)
 * @param options - Configuration options
 * @returns Proxied root object that tracks all mutations
 *
 * @example
 * ```typescript
 * const eventLog = createFileEventLog('events.log');
 * const scott = createMemoryImage({}, { eventLog });
 * scott.emp = { empno: 7369, ename: 'SMITH' }; // Mutation logged as SET event
 * ```
 */
export declare const createMemoryImage: (root?: Record<string, unknown>, options?: MemoryImageOptions) => unknown;
/**
 * Serializes a memory image to JSON string.
 *
 * Creates a complete snapshot of the entire object graph, handling cycles
 * via path-based references.
 *
 * @param root - The memory image root (must be a memory image proxy)
 * @returns JSON string representation
 *
 * @example
 * ```typescript
 * const json = serializeMemoryImageToJson(root);
 * await fs.writeFile('snapshot.json', json);
 * ```
 */
export declare const serializeMemoryImageToJson: (root: unknown) => string;
/**
 * Deserializes a JSON string into a plain JavaScript object graph.
 *
 * Note: This returns a plain object, not a memory image. To create a
 * memory image from the deserialized data, wrap it with createMemoryImage().
 *
 * @param json - JSON string or parsed object
 * @returns Deserialized object graph with cycles restored
 *
 * @example
 * ```typescript
 * const json = await fs.readFile('snapshot.json', 'utf-8');
 * const data = deserializeMemoryImageFromJson(json);
 * const root = createMemoryImage(data as Record<string, unknown>, { eventLog });
 * ```
 */
export declare const deserializeMemoryImageFromJson: (json: string | unknown) => unknown;
/**
 * Replays events to reconstruct memory image state.
 *
 * This is typically used during startup to rebuild the memory image from
 * the event log.
 *
 * @param events - Array of events or async iterable
 * @param options - Configuration options (same as createMemoryImage)
 * @returns Reconstructed memory image
 *
 * @example
 * ```typescript
 * const eventLog = createFileEventLog('events.log');
 * const root = await replayEventsToMemoryImage(
 *   eventLog.stream(),
 *   { eventLog }
 * );
 * ```
 */
export declare const replayEventsToMemoryImage: (events: readonly unknown[] | AsyncIterable<unknown>, options?: MemoryImageOptions) => Promise<unknown>;
/**
 * Replays events from an event log to reconstruct memory image state.
 *
 * Convenience wrapper that fetches events from the log and replays them.
 *
 * @param options - Configuration options including eventLog
 * @returns Reconstructed memory image
 *
 * @example
 * ```typescript
 * const eventLog = createIndexedDBEventLog('myapp', 'events');
 * const root = await replayEventsFromLog({ eventLog });
 * // Memory image is now reconstructed and ready to use
 * ```
 */
export declare const replayEventsFromLog: (options: MemoryImageOptions) => Promise<unknown>;
/**
 * Gets the metadata provider for a memory image.
 *
 * @param root - The memory image root proxy
 * @returns MetadataProvider (either custom or default)
 *
 * @example
 * ```typescript
 * const metadata = getMemoryImageMetadata(root);
 * const descriptor = metadata.getDescriptor(someObject);
 * ```
 */
export declare const getMemoryImageMetadata: (root: unknown) => MetadataProvider;
/**
 * Gets the proxy infrastructure for a memory image.
 *
 * This provides controlled access to the internal tracking infrastructure,
 * primarily for UI layers to implement navigation features.
 *
 * @param root - The memory image root proxy
 * @returns ProxyInfrastructure or null if not a memory image
 *
 * @example
 * ```typescript
 * const infrastructure = getMemoryImageInfrastructure(root);
 * if (infrastructure) {
 *   const path = infrastructure.targetToPath.get(someObject);
 * }
 * ```
 */
export declare const getMemoryImageInfrastructure: (root: unknown) => ProxyInfrastructure | null;
/**
 * Checks if a value is a memory image proxy.
 *
 * @param value - The value to check
 * @returns true if value is a memory image root proxy
 *
 * @example
 * ```typescript
 * if (isMemoryImage(root)) {
 *   const json = serializeMemoryImageToJson(root);
 * }
 * ```
 */
export declare const isMemoryImage: (value: unknown) => boolean;
export { createTransaction } from "./transaction.js";
export type { Transaction } from "./transaction.js";
export type { Path, Event, EventType, EventLog, MemoryImageOptions, ReplayState, ProxyInfrastructure, SerializedValue, } from "./types.js";
//# sourceMappingURL=memimg.d.ts.map