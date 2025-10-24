/**
 * event-log.ts - Pluggable mutation event logging backends
 *
 * ============================================================================
 * ARCHITECTURE: Pluggable Event Logs
 * ============================================================================
 *
 * Ireneo is completely agnostic about where/how events are stored. Any object
 * implementing the EventLog interface can be used.
 *
 * This means you can store events:
 * - In-memory (for testing/temporary state)
 * - In local files (Node.js fs module or browser File System Access API)
 * - In IndexedDB (browsers)
 * - In LocalStorage (browsers, for small datasets)
 * - Via REST API to a backend server
 * - In a database via PostgREST or similar
 * - Via WebSocket to a real-time sync server
 * - In cloud storage (S3, Firebase, etc.)
 * - Anywhere you can imagine!
 *
 * This module provides four reference implementations as convenience functions,
 * but you can create your own custom event log by implementing the EventLog interface.
 *
 * ============================================================================
 * BUILT-IN IMPLEMENTATIONS
 * ============================================================================
 *
 * 1. In-Memory - Fast, for testing, lost on process exit
 * 2. File - Persistent, NDJSON format, for Node.js (or Deno/Bun)
 * 3. IndexedDB - Persistent, for browsers
 * 4. LocalStorage - Simple persistent, for browsers
 *
 * Design principle: Simple, pluggable, no dependencies between backends
 */
import type { EventLog } from './types.js';
/**
 * In-memory event log with convenience length property.
 * Internal interface for testing purposes.
 */
interface InMemoryEventLog extends EventLog {
    readonly length: number;
}
/**
 * Creates an in-memory event log stored in a JavaScript array.
 *
 * Use case: Testing, development, scenarios where persistence isn't needed.
 *
 * Pros: Fast, simple, no I/O
 * Cons: Lost when process exits, unbounded memory growth
 *
 * @returns Event log with append/getAll/clear methods and length property
 */
export declare const createInMemoryEventLog: () => InMemoryEventLog;
/**
 * Creates a file-based event log using NDJSON (Newline Delimited JSON) format.
 *
 * Format: Each event is one line of JSON, lines separated by \n
 * Example file contents:
 *   {"type":"SET","path":["name"],"value":"Alice","timestamp":1234567890}
 *   {"type":"SET","path":["age"],"value":30,"timestamp":1234567891}
 *   {"type":"DELETE","path":["temp"],"timestamp":1234567892}
 *
 * Why NDJSON?
 * - Append-friendly: Just write newline to end, no need to rewrite entire file
 * - Streaming-friendly: Read line-by-line without loading entire file into memory
 * - Resilient: Corrupted line doesn't break entire file
 * - Tool-friendly: Works with standard Unix tools (grep, tail, wc, etc.)
 *
 * Use case: Server-side Node.js apps, CLIs, anywhere filesystem is available
 *
 * Pros: Persistent, streamable, human-readable, tool-friendly
 * Cons: Node.js only, slower than in-memory
 *
 * @param filepath - Path to event log file
 * @returns Event log with append/getAll/stream/clear methods
 */
export declare const createFileEventLog: (filepath: string) => Promise<EventLog>;
/**
 * Creates an IndexedDB-based event log for browser persistence.
 *
 * IndexedDB is the standard browser database API - it's asynchronous, persistent,
 * and can store large amounts of data (typically 50MB+, varies by browser).
 *
 * Design: We create an object store with auto-incrementing keys.
 * Each event is stored as a JavaScript object (no JSON serialization needed).
 * Events are retrieved in insertion order (key order).
 *
 * MULTI-STORE SUPPORT: This implementation now supports dynamic store creation.
 * The database version is incremented each time a new store needs to be created,
 * which allows multiple memory images to coexist with isolated event logs.
 *
 * Use case: Web apps that need offline persistence, Progressive Web Apps (PWAs)
 *
 * Pros: Persistent across browser sessions, larger storage than localStorage,
 *       stores objects directly (no JSON parsing), async
 * Cons: Browser only, more complex API than localStorage, quota limits
 *
 * Note: IndexedDB API is callback-based, we wrap it in Promises for cleaner async/await usage.
 *
 * @param dbName - Name of IndexedDB database (default: 'ireneo')
 * @param storeName - Name of object store (default: 'events')
 * @returns Event log with append/getAll/clear methods
 */
export declare const createIndexedDBEventLog: (dbName?: string, storeName?: string) => EventLog;
/**
 * Creates an event log backed by browser LocalStorage.
 *
 * Use case: Simple browser apps that need persistence without IndexedDB complexity.
 *
 * Pros: Simple, synchronous, widely supported, no database setup
 * Cons:
 *   - Limited to ~5-10MB depending on browser
 *   - Stores all events as single JSON string (not efficient for large logs)
 *   - Synchronous operations may block UI on large datasets
 *   - No streaming support
 *
 * Recommendation: Use IndexedDB for larger datasets or apps with many events.
 *
 * @param key - LocalStorage key to store events under (default: 'memimg-events')
 * @returns Event log with append/getAll/clear methods
 */
export declare const createLocalStorageEventLog: (key?: string) => EventLog;
export {};
//# sourceMappingURL=event-log.d.ts.map