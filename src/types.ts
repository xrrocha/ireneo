/**
 * Core type definitions for Memory Image Processor
 *
 * These types define the event sourcing and serialization infrastructure.
 */

// ============================================================================
// Path & Navigation Types
// ============================================================================

/**
 * A path through the object graph, represented as an array of property keys.
 * Immutable by design (readonly).
 *
 * Example: ['depts', 'accounting', 'budget'] refers to root.depts.accounting.budget
 *
 * This is the canonical path type used throughout Ireneo for immutable references.
 */
export type Path = readonly string[];

/**
 * Mutable path array for navigation state management.
 *
 * UI code can use this mutable variant for managing navigation history
 * and selected paths, where state changes frequently.
 *
 * Can be converted to/from immutable Path as needed.
 */
export type MutablePath = string[];

/**
 * Convert immutable Path to mutable array.
 *
 * Use this when you need to modify a path (e.g., navigation state updates).
 */
export function toMutablePath(path: Path): MutablePath {
  return [...path];
}

/**
 * Convert mutable array to immutable Path.
 *
 * Use this when passing navigation state to Ireneo functions.
 */
export function toPath(path: MutablePath): Path {
  return path;
}

// ============================================================================
// Branded Types for Compile-Time Safety
// ============================================================================

/**
 * Brand symbol for proxied values.
 *
 * This unique symbol is used at the type level only (never at runtime)
 * to distinguish wrapped (proxied) values from unwrapped (target) values.
 *
 * Using `unique symbol` ensures that each branded type is incompatible
 * with every other type, preventing accidental mixing of proxied and
 * non-proxied values at compile time.
 */
declare const ProxiedBrand: unique symbol;

/**
 * Brand symbol for target (unwrapped) values.
 *
 * This unique symbol marks values that are NOT proxied, ensuring that
 * the compiler can distinguish between original objects and their proxies.
 */
declare const TargetBrand: unique symbol;

/**
 * Marks a type as proxied (wrapped in a Proxy).
 *
 * This branded type provides compile-time safety by making it a type error
 * to pass a proxied value where a target is expected (or vice versa).
 *
 * **Important:** This is a type-level construct only. At runtime, there is
 * no `__proxiedBrand` property. The brand exists only in TypeScript's type
 * system to enable compile-time checking.
 *
 * @example
 * ```typescript
 * const target: Target<User> = { name: 'Alice' };
 * const proxied: Proxied<User> = wrapIfNeeded(target);
 *
 * // Compile error - can't assign proxied to target!
 * const invalid: Target<User> = proxied;  // ❌ Type error
 *
 * // Must unwrap first
 * const valid: Target<User> = unwrap(proxied);  // ✅ OK
 * ```
 *
 * @template T The underlying type structure
 */
export type Proxied<T> = T & { readonly __proxiedBrand: typeof ProxiedBrand };

/**
 * Marks a type as a target (unwrapped, not proxied).
 *
 * This branded type ensures compile-time safety by preventing accidental
 * use of unwrapped values where proxied values are expected.
 *
 * **Important:** This is a type-level construct only. At runtime, there is
 * no `__targetBrand` property. The brand exists only in TypeScript's type
 * system to enable compile-time checking.
 *
 * @example
 * ```typescript
 * const target: Target<User> = { name: 'Alice' };
 * const proxied: Proxied<User> = wrapIfNeeded(target);
 *
 * // Compile error - can't assign target to proxied!
 * const invalid: Proxied<User> = target;  // ❌ Type error
 *
 * // Must wrap first
 * const valid: Proxied<User> = wrapIfNeeded(target);  // ✅ OK
 * ```
 *
 * @template T The underlying type structure
 */
export type Target<T> = T & { readonly __targetBrand: typeof TargetBrand };

/**
 * Removes branding from a type, returning the raw underlying type.
 *
 * Useful when you need to work with the actual structure without
 * caring about whether it's proxied or not (e.g., for serialization).
 *
 * @template T Either Proxied<U>, Target<U>, or a raw type U
 */
export type Unbranded<T> = T extends Proxied<infer U>
  ? U
  : T extends Target<infer U>
  ? U
  : T;

/**
 * Type assertion: Mark a value as proxied.
 *
 * **Runtime behavior:** This is a no-op identity function. It simply returns
 * the input value unchanged. The branding exists only at the type level.
 *
 * **When to use:** When you've just created a Proxy and need to mark it as
 * Proxied<T> for type safety. Example: after `new Proxy(target, handler)`.
 *
 * @param value The proxy to brand as Proxied<T>
 * @returns The same value, typed as Proxied<T>
 *
 * @example
 * ```typescript
 * const target = { name: 'Alice' };
 * const proxy = new Proxy(target, handler);
 * const branded = asProxied(proxy);  // Now typed as Proxied<typeof target>
 * ```
 */
export function asProxied<T>(value: T): Proxied<T> {
  return value as Proxied<T>;
}

/**
 * Type assertion: Mark a value as a target (unwrapped).
 *
 * **Runtime behavior:** This is a no-op identity function. It simply returns
 * the input value unchanged. The branding exists only at the type level.
 *
 * **When to use:** When you have a plain object that you know is not proxied
 * and want to mark it as Target<T> for type safety.
 *
 * @param value The object to brand as Target<T>
 * @returns The same value, typed as Target<T>
 *
 * @example
 * ```typescript
 * const obj = { name: 'Alice' };
 * const branded = asTarget(obj);  // Now typed as Target<typeof obj>
 * ```
 */
export function asTarget<T>(value: T): Target<T> {
  return value as Target<T>;
}

/**
 * Type assertion: Remove branding from a value.
 *
 * **Runtime behavior:** This is a no-op identity function. It simply returns
 * the input value unchanged. The unbranding exists only at the type level.
 *
 * **When to use:** When you need to work with the underlying structure without
 * caring about proxy/target distinction (e.g., during serialization).
 *
 * @param value The branded value to unbrand
 * @returns The same value, with branding removed
 *
 * @example
 * ```typescript
 * const proxied: Proxied<User> = ...;
 * const unbranded = unbrand(proxied);  // Now typed as User (no brand)
 * JSON.stringify(unbranded);  // Works without brand getting in the way
 * ```
 */
export function unbrand<T>(value: Proxied<T> | Target<T> | T): Unbranded<T> {
  return value as Unbranded<T>;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * All possible event types in the system.
 */
export type EventType =
  | "SET"
  | "DELETE"
  | "ARRAY_PUSH"
  | "ARRAY_POP"
  | "ARRAY_SHIFT"
  | "ARRAY_UNSHIFT"
  | "ARRAY_SPLICE"
  | "ARRAY_SORT"
  | "ARRAY_REVERSE"
  | "ARRAY_FILL"
  | "ARRAY_COPYWITHIN"
  | "MAP_SET"
  | "MAP_DELETE"
  | "MAP_CLEAR"
  | "SET_ADD"
  | "SET_DELETE"
  | "SET_CLEAR"
  | "SCRIPT";

/**
 * Base event structure - all events extend this.
 */
export interface BaseEvent {
  readonly type: EventType;
  readonly path: Path;
  readonly timestamp: number;
}

/**
 * Property assignment event
 */
export interface SetEvent extends BaseEvent {
  readonly type: "SET";
  readonly value: unknown;
}

/**
 * Property deletion event
 */
export interface DeleteEvent extends BaseEvent {
  readonly type: "DELETE";
}

/**
 * Array mutation events
 */
export interface ArrayPushEvent extends BaseEvent {
  readonly type: "ARRAY_PUSH";
  readonly items: readonly unknown[];
}

export interface ArrayPopEvent extends BaseEvent {
  readonly type: "ARRAY_POP";
}

export interface ArrayShiftEvent extends BaseEvent {
  readonly type: "ARRAY_SHIFT";
}

export interface ArrayUnshiftEvent extends BaseEvent {
  readonly type: "ARRAY_UNSHIFT";
  readonly items: readonly unknown[];
}

export interface ArraySpliceEvent extends BaseEvent {
  readonly type: "ARRAY_SPLICE";
  readonly start: number;
  readonly deleteCount: number;
  readonly items: readonly unknown[];
}

export interface ArraySortEvent extends BaseEvent {
  readonly type: "ARRAY_SORT";
}

export interface ArrayReverseEvent extends BaseEvent {
  readonly type: "ARRAY_REVERSE";
}

export interface ArrayFillEvent extends BaseEvent {
  readonly type: "ARRAY_FILL";
  readonly value: unknown;
  readonly start: number | undefined;
  readonly end: number | undefined;
}

export interface ArrayCopyWithinEvent extends BaseEvent {
  readonly type: "ARRAY_COPYWITHIN";
  readonly target: number;
  readonly start: number;
  readonly end: number | undefined;
}

/**
 * Map mutation events
 */
export interface MapSetEvent extends BaseEvent {
  readonly type: "MAP_SET";
  readonly key: unknown;
  readonly value: unknown;
}

export interface MapDeleteEvent extends BaseEvent {
  readonly type: "MAP_DELETE";
  readonly key: unknown;
}

export interface MapClearEvent extends BaseEvent {
  readonly type: "MAP_CLEAR";
}

/**
 * Set mutation events
 */
export interface SetAddEvent extends BaseEvent {
  readonly type: "SET_ADD";
  readonly value: unknown;
}

export interface SetDeleteEvent extends BaseEvent {
  readonly type: "SET_DELETE";
  readonly value: unknown;
}

export interface SetClearEvent extends BaseEvent {
  readonly type: "SET_CLEAR";
}

/**
 * Transaction script source logging event
 */
export interface ScriptEvent extends BaseEvent {
  readonly type: "SCRIPT";
  readonly source: string;
}

/**
 * Union type of all possible events
 */
export type Event =
  | SetEvent
  | DeleteEvent
  | ArrayPushEvent
  | ArrayPopEvent
  | ArrayShiftEvent
  | ArrayUnshiftEvent
  | ArraySpliceEvent
  | ArraySortEvent
  | ArrayReverseEvent
  | ArrayFillEvent
  | ArrayCopyWithinEvent
  | MapSetEvent
  | MapDeleteEvent
  | MapClearEvent
  | SetAddEvent
  | SetDeleteEvent
  | SetClearEvent
  | ScriptEvent;

// ============================================================================
// Serialization Types
// ============================================================================

/**
 * Primitive types that serialize directly
 */
export type SerializedPrimitive = string | number | boolean | null | undefined;

/**
 * Reference to another object in the graph (for cycle handling)
 */
export interface SerializedReference {
  readonly __type__: "ref";
  readonly path: Path;
}

/**
 * Serialized function representation
 */
export interface SerializedFunction {
  readonly __type__: "function";
  readonly sourceCode: string;
}

/**
 * Serialized Date representation
 */
export interface SerializedDate {
  readonly __type__: "date";
  readonly value: string; // ISO 8601 format
}

/**
 * Serialized BigInt representation
 */
export interface SerializedBigInt {
  readonly __type__: "bigint";
  readonly value: string;
}

/**
 * Serialized Symbol representation
 */
export interface SerializedSymbol {
  readonly __type__: "symbol";
  readonly description: string | undefined;
}

/**
 * Serialized Map representation
 */
export interface SerializedMap {
  readonly __type__: "map";
  readonly entries: readonly [unknown, unknown][];
}

/**
 * Serialized Set representation
 */
export interface SerializedSet {
  readonly __type__: "set";
  readonly values: readonly unknown[];
}

/**
 * Array serialization (no special __type__ needed)
 */
export type SerializedArray = readonly unknown[];

/**
 * Plain object serialization
 */
export type SerializedObject = {
  readonly [key: string]: unknown;
};

/**
 * Any serialized value
 */
export type SerializedValue =
  | SerializedPrimitive
  | SerializedReference
  | SerializedFunction
  | SerializedDate
  | SerializedBigInt
  | SerializedSymbol
  | SerializedMap
  | SerializedSet
  | SerializedArray
  | SerializedObject;

// ============================================================================
// Event Log Interface
// ============================================================================

/**
 * Pluggable event log interface.
 *
 * Any object implementing this interface can be used as event storage.
 * Examples: in-memory, filesystem, IndexedDB, REST API, etc.
 */
export interface EventLog {
  /**
   * Append an event to the log
   */
  append(event: Event): Promise<void>;

  /**
   * Retrieve all events from the log
   */
  getAll(): Promise<readonly Event[]>;

  /**
   * Clear all events (optional)
   */
  clear?(): Promise<void>;

  /**
   * Close the event log and release resources (optional)
   * Implementations that maintain persistent connections (like IndexedDB)
   * should close them here to prevent blocking version upgrades.
   */
  close?(): Promise<void>;

  /**
   * Stream events one at a time (optional, for memory efficiency)
   */
  stream?(): AsyncIterable<Event>;
}

// ============================================================================
// Class Instance Preservation
// ============================================================================

/**
 * Generic class constructor type
 *
 * Represents any class constructor that can be instantiated.
 * Used for class registry to map class names to constructors.
 */
export type ClassConstructor<T = any> = new (...args: any[]) => T;

/**
 * Registry of class constructors
 *
 * Maps class names to their constructor functions, enabling
 * class instance preservation across serialization/deserialization.
 *
 * @example
 * const classes = {
 *   Employee: Employee,
 *   Department: Department
 * }
 */
export type ClassRegistry = Record<string, ClassConstructor>;

/**
 * Interface for class registry lookup
 *
 * Supports both Map and custom registry implementations.
 */
export interface ClassRegistryLookup {
  get(className: string): ClassConstructor | undefined;
}

// ============================================================================
// Memory Image Configuration
// ============================================================================

/**
 * State flag for event replay - prevents logging events during replay
 */
export interface ReplayState {
  isReplaying: boolean;
}

/**
 * MetadataProvider - Optional interface for domain-specific presentation hints
 *
 * The Memory Image Processor (MIP) is intentionally decoupled from any domain
 * knowledge or metadata system. However, for rich UI experiences (like the
 * object explorer UIs), we need presentation hints such as:
 * - Which property should be used to describe/label an object?
 * - Which property is the primary key?
 * - Which properties should show in summaries vs. detail views?
 *
 * This interface allows external systems (like external metadata systems) to
 * inject presentation metadata WITHOUT creating a hard dependency.
 */
export interface MetadataProvider {
  /**
   * Get the property name to use as a descriptor/label for an object
   * @param obj - The object to describe
   * @returns Property name (e.g., 'name', 'title') or null if none
   */
  getDescriptor(obj: unknown): string | null;

  /**
   * Get the property name that serves as the primary key for an object
   * @param obj - The object
   * @returns Property name (e.g., 'id', 'empno') or null if none
   */
  getKeyProperty(obj: unknown): string | null;

  /**
   * Check if a property should be displayed in summary views
   * @param obj - The parent object
   * @param propName - The property name
   * @returns true if should be displayed in summaries
   */
  isDisplayProperty(obj: unknown, propName: string): boolean;

  /**
   * Get a human-readable label for a property name
   * @param obj - The parent object
   * @param propName - The property name
   * @returns Human-readable label or null to use property name
   */
  getPropertyLabel(obj: unknown, propName: string): string | null;
}

/**
 * Options for creating a memory image
 */
export interface MemoryImageOptions {
  /**
   * Event log backend (optional - if not provided, no events are logged)
   */
  readonly eventLog?: EventLog;

  /**
   * Replay state flag (optional - created automatically if not provided)
   */
  readonly replayState?: ReplayState;

  /**
   * Metadata provider for presentation hints (optional)
   */
  readonly metadata?: MetadataProvider;
}

// ============================================================================
// Proxy Infrastructure (Internal)
// ============================================================================

/**
 * Internal proxy tracking infrastructure.
 *
 * These WeakMaps maintain the relationship between original objects,
 * their proxies, and their paths in the object graph.
 *
 * **Type Safety:** Uses branded types (Target<T> and Proxied<T>) to ensure
 * compile-time safety when mapping between proxied and unwrapped values.
 * This prevents accidentally using a proxy where a target is expected, or
 * vice versa - the exact bug that caused Map.get() mutations to be lost.
 */
export interface ProxyInfrastructure {
  /**
   * Maps original (target) objects to their proxied wrappers.
   *
   * Type safety: Ensures we only look up targets and only store proxies.
   * Compile error if you try: `targetToProxy.get(proxy)` (wrong direction!)
   */
  readonly targetToProxy: WeakMap<Target<object>, Proxied<object>>;

  /**
   * Maps proxied wrappers back to their original (target) objects.
   *
   * Type safety: Ensures we only look up proxies and only get back targets.
   * Compile error if you try: `proxyToTarget.get(target)` (wrong direction!)
   */
  readonly proxyToTarget: WeakMap<Proxied<object>, Target<object>>;

  /**
   * Maps original (target) objects to their canonical path in the graph.
   *
   * Type safety: Paths are always associated with targets, not proxies.
   * This prevents confusion about which object's path we're tracking.
   */
  readonly targetToPath: WeakMap<Target<object>, Path>;

  /**
   * Optional metadata provider for presentation hints
   */
  readonly metadata?: MetadataProvider;
}

// ============================================================================
// Deserialization Helpers (Internal)
// ============================================================================

/**
 * Marker for unresolved references during deserialization.
 * Internal type used during two-pass deserialization.
 */
export interface UnresolvedReference {
  readonly __isUnresolved: true;
  readonly path: Path;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a value is a serialized reference
 */
export const isSerializedReference = (
  value: unknown,
): value is SerializedReference => {
  return (
    typeof value === "object" &&
    value !== null &&
    "__type__" in value &&
    value.__type__ === "ref" &&
    "path" in value
  );
};

/**
 * Check if a value is an unresolved reference (during deserialization)
 */
export const isUnresolvedReference = (
  value: unknown,
): value is UnresolvedReference => {
  return (
    typeof value === "object" &&
    value !== null &&
    "__isUnresolved" in value &&
    value.__isUnresolved === true
  );
};

/**
 * Check if a value is an object (not null)
 */
export const isObject = (value: unknown): value is object => {
  return typeof value === "object" && value !== null;
};
