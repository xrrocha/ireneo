/**
 * Proxy infrastructure module for Memory Image Processor
 *
 * ==============================================================================
 * ARCHITECTURE: THE TRANSPARENT IMPERATIVE SHELL
 * ==============================================================================
 *
 * This module implements the "imperative shell" pattern - all mutations are
 * encapsulated behind proxies, making mutation tracking completely transparent
 * to users. You interact with normal-looking JavaScript objects; the proxies
 * intercept and log every change behind the scenes.
 *
 * CORE RESPONSIBILITIES:
 *
 * 1. **Proxy Infrastructure Setup** (createProxyInfrastructure)
 *    Creates the three WeakMaps that form our tracking system's backbone.
 *
 * 2. **Recursive Wrapping** (wrapIfNeeded)
 *    Wraps objects, arrays, Maps, Sets in proxies. Handles cycles correctly.
 *
 * 3. **Proxy Handler Definition** (createProxyHandler)
 *    Defines the traps that intercept get/set/deleteProperty operations.
 *
 * 4. **Collection Method Wrapping** (via collection-wrapper.ts)
 *    Wraps Array/Map/Set mutation methods (push, set, add, etc.)
 *
 * KEY DESIGN INSIGHT - Wrap Before Recurse:
 *
 * To handle circular references correctly, we MUST:
 * 1. Create the proxy immediately
 * 2. Register it in targetToProxy
 * 3. THEN recurse into properties
 *
 * If we recursed first, circular refs would infinite loop.
 * Example: emp.dept.employees[0] === emp
 *
 * THE INTERCEPTION FLOW:
 *
 * When user writes: `scott.emps.king.sal = 5000`
 *
 * 1. JavaScript evaluates left-to-right:
 *    - scott → returns proxy
 *    - scott.emps → GET trap fires → returns emps proxy
 *    - scott.emps.king → GET trap fires → returns king proxy
 *    - scott.emps.king.sal = 5000 → SET trap fires
 *
 * 2. SET trap executes:
 *    - Looks up king's path: ['emps', 'king']
 *    - Builds new path: ['emps', 'king', 'sal']
 *    - Wraps value: 5000 (primitive, returns as-is)
 *    - Performs assignment: king.sal = 5000
 *    - Creates event: { type: 'SET', path: ['emps', 'king', 'sal'], value: 5000 }
 *    - Logs event to EventLog
 *
 * 3. Later, during replay:
 *    - Event is read from log
 *    - Path ['emps', 'king', 'sal'] is traversed
 *    - Value 5000 is assigned
 *    - State is reconstructed
 *
 * SPECIAL CASES:
 *
 * - **Functions**: Proxied with metadata attached for serialization
 * - **Dates**: Proxied with methods bound to target (timestamp mutations tracked)
 * - **RegExp**: Proxied with methods bound to target (lastIndex mutations tracked)
 * - **Maps/Sets**: Proxied + methods wrapped for mutation tracking
 * - **Arrays**: Proxied + mutating methods (push, pop, etc.) wrapped
 * - **Primitives**: Pass through unwrapped (immutable)
 *
 * REFACTORING HIGHLIGHTS (Phase 7):
 *
 * - Unified collection method wrapping (eliminated 90 lines of duplication)
 * - All three collection types (Array, Map, Set) now use same wrapper
 * - Data-driven approach replaced three nearly-identical functions
 *
 * This is where the "magic" happens - transparent mutation tracking that
 * enables event sourcing, time-travel debugging, and delta synchronization.
 */
import type { Path, EventLog, ProxyInfrastructure, ReplayState, MetadataProvider } from "./types.js";
/**
 * Creates the WeakMap infrastructure for tracking objects and their proxies.
 *
 * These three WeakMaps form the core of our object tracking system:
 *
 * 1. targetToProxy: Given an unwrapped object, find its proxy
 *    - Ensures same object always gets same proxy (reference identity)
 *    - Prevents double-wrapping: if we see an object again, reuse its proxy
 *
 * 2. proxyToTarget: Given a proxy, find the original object
 *    - Needed for serialization: we serialize the target, not the proxy
 *    - Used to detect if a value is already wrapped
 *
 * 3. targetToPath: Given an object, find its path in the object graph
 *    - Path is array of property names from root: ['emps', 'smith', 'dept']
 *    - Used for cycle detection: if object already has path, create reference
 *    - Used for event logging: every mutation needs its path
 *
 * Why WeakMaps? They don't prevent garbage collection. If an object becomes
 * unreachable, it gets GC'd even if it's in these maps.
 */
export declare const createProxyInfrastructure: (metadata?: MetadataProvider) => ProxyInfrastructure;
/**
 * Collection method wrapping is now unified in collection-wrapper.ts
 *
 * Previous implementation had three nearly-identical functions:
 * - wrapArrayMethod (31 lines)
 * - wrapMapMethod (30 lines)
 * - wrapSetMethod (30 lines)
 *
 * Replaced with single wrapCollectionMethod (~30 lines) using data-driven approach.
 * Eliminates ~90 lines of duplication.
 *
 * See collection-wrapper.ts for implementation details.
 */
/**
 * Recursively wraps a value in a proxy, handling all JS types correctly.
 *
 * This is where the magic happens - every object assigned to our memory image
 * passes through this function and gets transparently wrapped.
 *
 * Key insight: We must wrap BEFORE recursing to handle circular references.
 * Example cycle:
 *   emp.dept = dept1
 *   dept1.employees = [emp]  // emp references dept1, dept1 references emp
 *
 * If we recursed first, we'd infinite loop. Instead:
 * 1. Create proxy immediately and register it in targetToProxy
 * 2. Then recurse into properties
 * 3. When we encounter emp again (via dept1.employees), targetToProxy.has(emp) is true
 * 4. Return existing proxy instead of creating new one
 *
 * @param value - Value to wrap (any JS type)
 * @param path - Path from root to this value (for cycle detection)
 * @param infrastructure - Proxy tracking infrastructure
 * @param eventLog - Optional event log
 * @param replayState - Replay state flag
 * @returns Wrapped value (proxy for objects, original for primitives)
 */
export declare const wrapIfNeeded: (value: unknown, path: Path, infrastructure: ProxyInfrastructure, eventLog?: EventLog, replayState?: ReplayState) => unknown;
//# sourceMappingURL=proxy.d.ts.map