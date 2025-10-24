# Ireneo: RFC

**Status:** Active Implementation
**Date:** 2025-10-24 (Updated)
**Version:** 0.1.0

---

## Abstract

**Ireneo** is a TypeScript/JavaScript library providing transparent, event-sourced persistence for in-memory object graphs. It eliminates the object-relational impedance mismatch by treating the object graph as the database, with no tables, no foreign keys, and no ORM ceremony. Built on the theoretical foundation of Memory Image/System Prevalence and mutation sourcing, Ireneo adds **class instance preservation** (methods + prototype chains) to enable true transparent persistence for TypeScript applications.

**Core Value Proposition:**
```typescript
// Define domain in vanilla TypeScript
class Employee {
  constructor(public empno: number, public name: string) {}
  giveRaise(amount: number) { this.sal += amount; }
}

// Create persistent store
const db = await Ireneo.create('./data', { employees: [] });

// Use objects naturally - changes persist automatically
db.employees.push(new Employee(7839, 'KING'));
db.employees[0].giveRaise(500);  // Method works after restart!
```

**What This RFC Defines:**
1. Architectural foundation (mutation sourcing + class preservation)
2. Complete JavaScript type system support (26+ types including missing ones)
3. Universal JavaScript runtime support (browser + Node.js + Deno + Bun)
4. Event-based synchronization for offline-first applications
5. Public API design
6. Serialization format (pluggable, with MessagePack default)
7. Storage layout and recovery strategy
8. Migration from MemImg (what changes, what stays)

**What This RFC Explicitly Does NOT Define:**
- TypeScript metadata extraction (deferred to Ireneo Full)
- Automatic schema migrations (user-provided migrations only)
- Runtime type validation (TypeScript compile-time only)
- Query optimization, indexing, or performance tuning
- CRDT-based eventual consistency (last-write-wins conflict resolution only)

---

## Table of Contents

1. [Motivation & Design Goals](#1-motivation--design-goals)
2. [Theoretical Foundation](#2-theoretical-foundation)
3. [Architecture Overview](#3-architecture-overview)
4. [Universal JavaScript Runtime Support](#4-universal-javascript-runtime-support)
5. [Complete JavaScript Type System Support](#5-complete-javascript-type-system-support)
6. [Class Instance Preservation](#6-class-instance-preservation)
7. [Event-Based Synchronization](#7-event-based-synchronization)
8. [Serialization Format](#8-serialization-format)
9. [Storage Layout](#9-storage-layout)
10. [Public API](#10-public-api)
11. [Migration from MemImg](#11-migration-from-memimg)
12. [Implementation Phases](#12-implementation-phases)
13. [Future Work (Ireneo Full)](#13-future-work-ireneo-full)

---

## 1. Motivation & Design Goals

### 1.1 The Problem: Object-Relational Impedance Mismatch

**Traditional database-centric architecture:**
```typescript
// Define schema (SQL)
CREATE TABLE employees (
  empno INT PRIMARY KEY,
  ename VARCHAR(50),
  sal DECIMAL(10,2),
  dept_id INT REFERENCES departments(deptno)
);

// Define ORM model (TypeScript)
@Entity()
class Employee {
  @PrimaryGeneratedColumn() empno: number;
  @Column() ename: string;
  @ManyToOne(() => Department) dept: Department;
}

// Query with ORM DSL
const king = await repo.findOne({ where: { ename: 'KING' } });
king.sal += 500;
await king.save();  // Explicit persistence
```

**Problems:**
1. **Dual representation** - Same entity defined in SQL + TypeScript
2. **Foreign keys + joins** - Relationships encoded as IDs, requiring joins
3. **ORM ceremony** - Decorators, repositories, query builders
4. **Explicit persistence** - Must call `.save()` manually
5. **Migration hell** - Schema changes require migration scripts

### 1.2 Ireneo's Solution

**Memory Image architecture with class preservation:**
```typescript
// Define domain (vanilla TypeScript)
class Employee {
  constructor(
    public empno: number,
    public ename: string,
    public sal: number,
    public dept?: Department
  ) {}

  giveRaise(amount: number) { this.sal += amount; }
}

// Create persistent store
const db = await Ireneo.create('./data', {
  employees: [],
  depts: []
});

// Use objects naturally
const king = new Employee(7839, 'KING', 5000);
db.employees.push(king);  // Automatically persisted

// Query with JavaScript
const highEarners = db.employees.filter(e => e.sal > 3000);

// Methods work after restart
king.giveRaise(500);  // Automatically persisted
```

**Benefits:**
1. ✅ **Single representation** - Just TypeScript classes
2. ✅ **Direct references** - `emp.dept` is the actual Department object
3. ✅ **Zero ceremony** - No decorators, just plain classes
4. ✅ **Transparent persistence** - No `.save()` calls
5. ✅ **Native queries** - JavaScript `.filter()`, `.map()`, etc.
6. ✅ **Methods preserved** - Class instances with working methods

### 1.3 Design Goals

**1. Transparency**
- Object mutations automatically persisted via proxies
- No explicit persistence API (`.save()`, `.persist()`)
- Developer writes normal TypeScript code

**2. Simplicity**
- No build step (class registry provided at runtime)
- No schema files (TypeScript types are documentation)
- No decorators (vanilla classes work)

**3. TypeScript Compatibility**
- Full TypeScript type support via generics
- Type assertions work: `Ireneo.load<MyRoot>('./data')`
- IDE autocomplete and type checking

**4. Completeness**
- All JavaScript types supported (26+ types)
- Circular references handled
- Class methods preserved
- Prototype chains intact

**5. Universal Runtime Support**
- Browser (IndexedDB, LocalStorage)
- Node.js (Filesystem)
- Deno (Deno APIs)
- Bun (Node.js compatible)
- Same code, different storage backends

**6. Offline-First by Design**
- Works without network (full app functionality)
- Event-based synchronization when online
- Conflict resolution strategies
- Progressive Web App (PWA) support

**7. Performance**
- Pluggable serialization (MessagePack faster than JSON)
- Snapshot + event log for fast recovery
- Lazy proxy wrapping (just-in-time)

**8. Extensibility**
- Pluggable serializers (JSON, MessagePack, Avro, custom)
- Pluggable storage backends (filesystem, IndexedDB, custom)
- User-provided migrations (manual schema evolution)

---

## 2. Theoretical Foundation

Ireneo builds on the theoretical foundation established by MemImg (documented in `docs/theory.md`). This section summarizes the key concepts and highlights where Ireneo extends the foundation.

### 2.1 Memory Image Pattern

**Classical pattern (Fowler, Prevayler):**
- Entire application state held in memory
- Durability via append-only event log
- Recovery via event replay
- Snapshots for fast startup

**Ireneo adopts this wholesale.**

### 2.2 Mutation Sourcing vs Command Sourcing

**Command Sourcing (classical):**
```typescript
// Log high-level commands
log.append({ type: 'CreateEmployee', empno: 7839, ename: 'KING' });
log.append({ type: 'GiveRaise', empno: 7839, amount: 500 });

// Replay by executing commands
for (const cmd of log) {
  switch (cmd.type) {
    case 'CreateEmployee': /* ... */
    case 'GiveRaise': /* ... */
  }
}
```

**Problems:**
- Tight coupling to application logic
- Schema evolution breaks replay (old commands don't match new code)
- Developers must write command classes

**Mutation Sourcing (MemImg, Ireneo):**
```typescript
// Log low-level mutations
log.append({ type: 'ARRAY_PUSH', path: ['employees'], value: {...} });
log.append({ type: 'SET', path: ['employees', 0, 'sal'], value: 5500 });

// Replay by applying mutations
for (const event of log) {
  applyMutation(root, event);  // Generic mutation engine
}
```

**Benefits:**
- Decoupled from application logic
- Schema evolution friendly (events are structural, not semantic)
- No developer ceremony (proxies generate events automatically)

**Ireneo adopts mutation sourcing from MemImg.**

### 2.3 Imperative Shell over Functional Core

**Functional Core:**
```typescript
// Pure function: State = fold(events)
function applyEvent(state: State, event: Event): State {
  // Deterministic, reproducible
}

const finalState = events.reduce(applyEvent, initialState);
```

**Imperative Shell:**
```typescript
// Developer writes imperative code
db.employees.push(new Employee(...));
db.employees[0].sal = 5500;

// Proxies translate to events
proxy.set = (target, prop, value) => {
  log.append({ type: 'SET', path: [prop], value });
  target[prop] = value;
};
```

**The shell makes the functional core transparent.**

**Ireneo adopts this architecture from MemImg.**

### 2.4 Ireneo's Extension: Class Instance Preservation

**MemImg limitation:**
```typescript
class Employee {
  giveRaise(amount) { this.sal += amount; }
}

// Serialize
const json = JSON.stringify(new Employee(7839, 'KING', 5000));

// Deserialize
const restored = JSON.parse(json);
restored.giveRaise(500);  // TypeError: giveRaise is not a function
```

**Root cause:** JSON serialization loses:
1. Constructor function
2. Prototype chain
3. Methods

**Ireneo solution:**
```typescript
// Serialize with class name
{
  __class__: 'Employee',
  empno: 7839,
  ename: 'KING',
  sal: 5000
}

// Deserialize with class registry
const classes = { Employee };
const restored = Object.create(classes['Employee'].prototype);
Object.assign(restored, data);

restored.giveRaise(500);  // ✓ Works!
restored instanceof Employee;  // ✓ true
```

**This is Ireneo's primary contribution beyond MemImg.**

### 2.5 Delta Layering for Transactions

**Three-tiered state (from MemImg):**
1. **Base state** - Last committed state (immutable during transaction)
2. **Delta layer** - Pending changes (Map<path, value>)
3. **Merged view** - Transactional proxy (reads from delta, falls back to base)

**Transaction lifecycle:**
```typescript
// Start transaction
const txn = await Ireneo.transaction('./data');

// Make changes (writes to delta layer)
txn.root.employees.push(new Employee(...));

// Commit (apply delta to base, log events)
await txn.save();

// OR rollback (discard delta)
txn.discard();
```

**Ireneo adopts transactions from MemImg unchanged.**

---

## 3. Architecture Overview

### 3.1 System Layers

```
┌─────────────────────────────────────────────────────┐
│ Developer Code                                      │
│ - Writes vanilla TypeScript/JavaScript             │
│ - Mutates objects naturally                        │
│ - Calls methods on class instances                 │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ Imperative Shell (Proxies)                         │
│ - Intercepts get/set/delete traps                  │
│ - Wraps nested objects lazily                      │
│ - Wraps collection methods (push, set, delete)     │
└────────────────┬────────────────────────────────────┘
                 │ Generates events
                 ▼
┌─────────────────────────────────────────────────────┐
│ Event Log                                           │
│ - Append-only mutation log                         │
│ - Pluggable backends (file, S3, custom)            │
│ - Serialized with pluggable format                 │
└────────────────┬────────────────────────────────────┘
                 │ Replays on startup
                 ▼
┌─────────────────────────────────────────────────────┐
│ Functional Core (Event Application)                │
│ - Deterministic event replay                       │
│ - Snapshot loading                                 │
│ - Class instance reconstruction                    │
└─────────────────────────────────────────────────────┘
```

### 3.2 Core Components (Inherited from MemImg)

**From MemImg (unchanged):**
- `proxy.ts` - Imperative shell, lazy wrapping, cycle handling
- `collection-wrapper.ts` - Array/Map/Set method interception
- `event-handlers.ts` - 18 mutation type handlers (SET, DELETE, ARRAY_PUSH, etc.)
- `type-classifier.ts` - Single source of truth for type detection
- `serialize.ts` - Two-mode serialization (snapshot vs event)
- `deserialize.ts` - Two-pass deserialization with reference resolution
- `transaction.ts` - Delta layering, optimistic concurrency
- `event-log.ts` - Pluggable storage interface

**New in Ireneo:**
- `class-registry.ts` - Maps class names to constructors
- `instance-reconstructor.ts` - Rebuilds class instances with prototypes
- `type-extensions.ts` - Serializers for missing JS types (RegExp, Error, ArrayBuffer, etc.)

### 3.3 Data Flow

**Write path:**
```
Developer mutation
  → Proxy trap intercepts
  → Event created (with class name if instance)
  → Event serialized (pluggable format)
  → Event appended to log
  → Target object updated
```

**Read path (cold start):**
```
Load latest snapshot
  → Deserialize objects
  → Reconstruct class instances (set prototypes)
  → Replay events since snapshot
  → Wrap root in proxies
  → Return to developer
```

**Read path (transaction):**
```
Load base state
  → Create delta layer (empty Map)
  → Create transactional proxies (reads check delta first)
  → Developer mutates (writes to delta)
  → txn.save() applies delta to base + logs events
  → OR txn.discard() throws delta away
```

---

## 4. Universal JavaScript Runtime Support

### 4.1 Platform Support Matrix

**Ireneo runs on all major JavaScript runtimes:**

| Platform | Storage Backend | Status | Notes |
|----------|----------------|--------|-------|
| **Node.js** | Filesystem | ✅ Primary | Event log + snapshots as files |
| **Browser** | IndexedDB | ✅ Primary | Structured storage, large capacity (50MB+) |
| **Browser** | LocalStorage | ✅ Fallback | Limited to 5-10MB, simple apps only |
| **Deno** | Filesystem (Deno API) | ✅ Supported | Native `Deno.writeTextFile` |
| **Bun** | Filesystem (Node compat) | ✅ Supported | Compatible with Node.js API |
| **Cloudflare Workers** | Durable Objects | 🔮 Future | Persistent edge storage |
| **Vercel Edge** | KV Store | 🔮 Future | Edge runtime persistence |

### 4.2 Storage Backend Abstraction

**Unified interface across platforms:**

```typescript
interface StorageBackend {
  // Event log operations
  appendEvent(event: Event): Promise<void>;
  getEvents(options?: GetEventsOptions): Promise<Event[]>;

  // Snapshot operations
  saveSnapshot(snapshot: Snapshot): Promise<void>;
  loadSnapshot(): Promise<Snapshot | null>;

  // Metadata operations
  saveMetadata(meta: Metadata): Promise<void>;
  loadMetadata(): Promise<Metadata | null>;

  // Sync operations (for offline-first apps)
  getEventsSince(timestamp: number): Promise<Event[]>;
  getEventRange(from: number, to: number): Promise<Event[]>;
}
```

**Implementations:**

1. **FilesystemStorage (Node.js, Deno, Bun)**
   - Event log as sequential files
   - Snapshots as compressed files
   - Lock file for concurrency control

2. **IndexedDBStorage (Browser)**
   - Events stored in object store
   - Snapshots in separate store
   - IndexedDB transactions for atomicity

3. **LocalStorageStorage (Browser fallback)**
   - Simple key-value persistence
   - Limited capacity (~5-10MB)
   - Synchronous API (wrapped in Promises)

### 4.3 Automatic Platform Detection

**Developer writes same code everywhere:**

```typescript
// This works in Node.js, Browser, Deno, Bun
const db = await Ireneo.create('myapp', initialData, {
  classes: { Employee, Department }
  // storage: auto-detected based on platform
});
```

**Platform detection logic:**
```typescript
function detectStorageBackend(): StorageBackend {
  // Node.js, Bun, Deno (filesystem available)
  if (typeof process !== 'undefined' && process.versions?.node) {
    return new FilesystemStorage();
  }

  // Deno (check for Deno global)
  if (typeof Deno !== 'undefined') {
    return new DenoFilesystemStorage();
  }

  // Browser (IndexedDB preferred)
  if (typeof indexedDB !== 'undefined') {
    return new IndexedDBStorage();
  }

  // Browser fallback (LocalStorage)
  if (typeof localStorage !== 'undefined') {
    return new LocalStorageStorage();
  }

  throw new Error('No supported storage backend available');
}
```

### 4.4 Browser Compatibility Notes

**IndexedDB considerations:**
- Async API (all operations return Promises)
- Transaction-based (automatic atomicity)
- Large storage capacity (50MB+ typical, browser-dependent)
- Persists across page reloads
- Works offline

**LocalStorage limitations:**
- Synchronous API (blocking)
- Limited to 5-10MB typically
- String-only storage (must serialize to JSON)
- Simpler but less capable

**Service Worker integration (future):**
- Background sync for offline-first apps
- Periodic snapshot creation
- Event log compaction

### 4.5 Package Exports for Platform-Specific Code

**Conditional exports in package.json:**

```json
{
  "name": "ireneo",
  "exports": {
    ".": {
      "browser": "./dist/browser.js",
      "node": "./dist/node.js",
      "deno": "./dist/deno.js",
      "default": "./dist/index.js"
    },
    "./storage/filesystem": {
      "node": "./dist/storage/filesystem.js",
      "deno": "./dist/storage/filesystem-deno.js"
    },
    "./storage/indexeddb": {
      "browser": "./dist/storage/indexeddb.js"
    }
  },
  "browser": {
    "./dist/storage/filesystem.js": false
  }
}
```

---

## 5. Complete JavaScript Type System Support

### 5.1 Current Coverage (MemImg)

**Supported (11 types):**
- ✅ Primitives: `null`, `undefined`, `string`, `number`, `boolean`
- ✅ Special primitives: `bigint`, `symbol`
- ✅ Objects: `Date`, `Function`, `Array`, `Map`, `Set`, plain `Object`

**Missing (15+ types):**
- ❌ Text processing: `RegExp`
- ❌ Error handling: `Error`, `TypeError`, `ReferenceError`, etc.
- ❌ Binary data: `ArrayBuffer`, `TypedArray` (10 variants), `DataView`
- ❌ Weak collections: `WeakMap`, `WeakSet` (not serializable by design)
- ❌ Async: `Promise` (not serializable by design)

### 5.2 Ireneo Extensions

**Priority 1: Common Types (implement immediately)**

#### RegExp
```typescript
// Serialize
const regex = /test/gi;
{
  __type__: 'regexp',
  source: 'test',
  flags: 'gi',
  lastIndex: 0
}

// Deserialize
const restored = new RegExp(data.source, data.flags);
restored.lastIndex = data.lastIndex;
```

**Properties to preserve:**
- `source` - Pattern string
- `flags` - `g`, `i`, `m`, `s`, `u`, `y`
- `lastIndex` - Current position (for stateful matching)

#### Error (and subtypes)
```typescript
// Serialize
const err = new TypeError('Invalid type');
{
  __type__: 'error',
  name: 'TypeError',
  message: 'Invalid type',
  stack: 'TypeError: Invalid type\n    at ...',
  // Custom properties preserved
  code: 'ERR_INVALID_TYPE'
}

// Deserialize
const ErrorConstructor = {
  'Error': Error,
  'TypeError': TypeError,
  'ReferenceError': ReferenceError,
  // ... etc
}[data.name];

const restored = new ErrorConstructor(data.message);
if (data.stack) restored.stack = data.stack;
// Restore custom properties
for (const key in data) {
  if (!['__type__', 'name', 'message', 'stack'].includes(key)) {
    restored[key] = data[key];
  }
}
```

**Error subtypes to support:**
- `Error` (base)
- `TypeError`, `ReferenceError`, `SyntaxError`, `RangeError`, `URIError`, `EvalError`
- `AggregateError` (contains array of errors)

**Priority 2: Binary Data (implement with caution)**

#### ArrayBuffer
```typescript
// Serialize (Base64 encoding)
const buffer = new ArrayBuffer(8);
{
  __type__: 'arraybuffer',
  byteLength: 8,
  data: 'AAAAAAAAAAA='  // Base64-encoded bytes
}

// Deserialize
const bytes = Buffer.from(data.data, 'base64');
const restored = bytes.buffer.slice(
  bytes.byteOffset,
  bytes.byteOffset + bytes.byteLength
);
```

**Serialization strategy:**
- Small buffers (< 1KB): Inline as Base64
- Large buffers (> 1KB): External file reference (future optimization)

#### TypedArray (10 variants)
```typescript
// Serialize
const arr = new Uint8Array([1, 2, 3, 4]);
{
  __type__: 'typedarray',
  variant: 'Uint8Array',
  buffer: { __ref__: ['buffers', 0] },  // Shared buffer reference
  byteOffset: 0,
  byteLength: 4
}

// OR inline for small arrays
{
  __type__: 'typedarray',
  variant: 'Uint8Array',
  data: [1, 2, 3, 4]
}

// Deserialize
const TypedArrayConstructor = {
  'Int8Array': Int8Array,
  'Uint8Array': Uint8Array,
  'Int16Array': Int16Array,
  'Uint16Array': Uint16Array,
  'Int32Array': Int32Array,
  'Uint32Array': Uint32Array,
  'Float32Array': Float32Array,
  'Float64Array': Float64Array,
  'BigInt64Array': BigInt64Array,
  'BigUint64Array': BigUint64Array,
}[data.variant];

const restored = data.data
  ? new TypedArrayConstructor(data.data)
  : new TypedArrayConstructor(data.buffer, data.byteOffset, data.byteLength / TypedArrayConstructor.BYTES_PER_ELEMENT);
```

**Challenge:** Shared ArrayBuffer instances
```typescript
// Multiple TypedArrays can share same buffer
const buffer = new ArrayBuffer(16);
const view1 = new Uint8Array(buffer, 0, 8);
const view2 = new Uint16Array(buffer, 8, 4);

// Must preserve buffer identity
// Solution: Serialize buffer once, reference it from views
```

#### DataView
```typescript
// Serialize
const view = new DataView(buffer, 4, 8);
{
  __type__: 'dataview',
  buffer: { __ref__: ['buffers', 0] },
  byteOffset: 4,
  byteLength: 8
}

// Deserialize
const restored = new DataView(
  resolveRef(data.buffer),
  data.byteOffset,
  data.byteLength
);
```

**Priority 3: Non-Serializable (document limitations)**

#### WeakMap & WeakSet
```typescript
// NOT SERIALIZABLE by design
// Reason: Keys are weak references, not enumerable

// Document limitation
// Workaround: Use Map/Set instead, implement manual cleanup
```

#### Promise
```typescript
// NOT SERIALIZABLE by design
// Reason: Represents pending async computation, callback state

// Possible future enhancement: Serialize resolved/rejected value only
{
  __type__: 'promise',
  state: 'fulfilled',  // pending | fulfilled | rejected
  value: 42  // OR error
}

// But: Loses callback chain, limited utility
// Recommendation: Don't serialize Promises
```

### 5.3 Type System Completeness Matrix

| Type | Category | Ireneo Support | Notes |
|------|----------|----------------|-------|
| `null` | Primitive | ✅ Full | Native JSON |
| `undefined` | Primitive | ✅ Full | Native JSON |
| `string` | Primitive | ✅ Full | Native JSON |
| `number` | Primitive | ✅ Full | Native JSON |
| `boolean` | Primitive | ✅ Full | Native JSON |
| `bigint` | Primitive | ✅ Full | String encoding |
| `symbol` | Primitive | ✅ Full | Description preserved |
| `Date` | Object | ✅ Full | ISO timestamp + properties |
| `Function` | Object | ✅ Full | Source code (pure methods only) |
| `Array` | Collection | ✅ Full | Native JSON |
| `Map` | Collection | ✅ Full | Entries array |
| `Set` | Collection | ✅ Full | Values array |
| `Object` | Object | ✅ Full | Native JSON |
| **`RegExp`** | **Object** | **✅ New** | Source + flags + lastIndex |
| **`Error`** | **Object** | **✅ New** | Name + message + stack + custom props |
| **`ArrayBuffer`** | **Binary** | **✅ New** | Base64 encoding |
| **`TypedArray`** | **Binary** | **✅ New** | Variant + buffer ref |
| **`DataView`** | **Binary** | **✅ New** | Buffer ref + offset + length |
| `WeakMap` | Collection | ❌ Not serializable | No enumeration |
| `WeakSet` | Collection | ❌ Not serializable | No enumeration |
| `Promise` | Async | ❌ Not serializable | Ephemeral state |
| `Proxy` | Object | ⚠️ Transparent | Serialize target, not proxy |

**Coverage:** 18 of 21 standard types (86%)

**Not supported:** 3 types (WeakMap, WeakSet, Promise) - by design, not serializable

---

## 6. Class Instance Preservation

### 6.1 The Problem

**JSON.parse loses class identity:**
```typescript
class Employee {
  constructor(public name: string) {}
  greet() { return `Hello, ${this.name}`; }
}

const emp = new Employee('Alice');

// Serialize
const json = JSON.stringify(emp);  // {"name":"Alice"}

// Deserialize
const restored = JSON.parse(json);

// Lost!
restored.greet();  // TypeError: greet is not a function
restored instanceof Employee;  // false
typeof restored.greet;  // undefined
Object.getPrototypeOf(restored);  // Object.prototype (not Employee.prototype!)
```

### 6.2 The Solution: Class Registry + Prototype Reattachment

**Step 1: Store class name during serialization**
```typescript
// Serialize (in serialize.ts)
function serializeValue(value) {
  if (isClassInstance(value)) {
    return {
      __class__: value.constructor.name,  // 'Employee'
      ...Object.entries(value)  // Properties
    };
  }
  // ... other types
}

function isClassInstance(value) {
  return typeof value === 'object' &&
         value !== null &&
         value.constructor &&
         value.constructor !== Object &&
         value.constructor !== Array;
}
```

**Step 2: Provide class registry at load time**
```typescript
// User provides class → constructor mapping
const classes = {
  Employee,
  Department,
  // ... all classes used in domain
};

const db = await Ireneo.load('./data', { classes });
```

**Step 3: Reconstruct instances during deserialization**
```typescript
// Deserialize (in instance-reconstructor.ts)
function reconstructInstance(data, classRegistry) {
  const className = data.__class__;
  const constructor = classRegistry[className];

  if (!constructor) {
    throw new Error(`Class '${className}' not found in registry`);
  }

  // Create instance with correct prototype
  const instance = Object.create(constructor.prototype);

  // Copy properties (skip __class__ metadata)
  for (const [key, value] of Object.entries(data)) {
    if (key !== '__class__') {
      instance[key] = value;
    }
  }

  return instance;
}
```

**Result:**
```typescript
restored.greet();  // ✓ "Hello, Alice"
restored instanceof Employee;  // ✓ true
typeof restored.greet;  // ✓ "function"
Object.getPrototypeOf(restored);  // ✓ Employee.prototype
```

### 6.3 Inheritance Chains

**Superclass + subclass:**
```typescript
class Person {
  constructor(public name: string) {}
  introduce() { return `I am ${this.name}`; }
}

class Employee extends Person {
  constructor(name: string, public empno: number) {
    super(name);
  }
  greet() { return `Employee ${this.empno}: ${this.introduce()}`; }
}

const emp = new Employee('Alice', 7839);
```

**Serialization preserves class name only (not entire chain):**
```typescript
{
  __class__: 'Employee',  // Leaf class only
  name: 'Alice',
  empno: 7839
}
```

**Deserialization reconstructs full chain automatically:**
```typescript
const instance = Object.create(Employee.prototype);
// Employee.prototype.__proto__ === Person.prototype (already linked)

instance.introduce();  // ✓ Works (from Person)
instance.greet();      // ✓ Works (from Employee)
instance instanceof Employee;  // ✓ true
instance instanceof Person;    // ✓ true
```

**Why this works:** JavaScript prototype chain is preserved in `Employee.prototype`. No need to serialize entire chain.

### 6.4 Constructor Arguments

**Challenge:** Constructors may have required parameters
```typescript
class Employee {
  constructor(public empno: number, public name: string) {
    if (!empno) throw new Error('empno required');
  }
}
```

**Problem:** `Object.create()` bypasses constructor
```typescript
const instance = Object.create(Employee.prototype);
// Constructor never called, empno undefined
```

**Solution:** This is fine! We're restoring from serialized state, not creating new instances.
```typescript
const instance = Object.create(Employee.prototype);
instance.empno = 7839;  // Restored from serialized data
instance.name = 'KING';
// No need to call constructor, state is already initialized
```

**Caveat:** Constructor side effects don't run
```typescript
class Employee {
  constructor(public name: string) {
    console.log('Created employee:', name);  // Won't run on deserialize
    this.createdAt = new Date();  // Won't run
  }
}

// Workaround: Store createdAt as property, serialize it
```

### 6.5 Private Fields

**JavaScript private fields (`#field`):**
```typescript
class Employee {
  #ssn: string;
  constructor(public name: string, ssn: string) {
    this.#ssn = ssn;
  }
}
```

**Problem:** Private fields are not enumerable
```typescript
Object.keys(new Employee('Alice', '123-45-6789'));
// ['name']  - #ssn is missing!
```

**Limitation:** Private fields are NOT serialized
```typescript
// Serialized
{
  __class__: 'Employee',
  name: 'Alice'
  // #ssn is LOST
}

// Deserialized
restored.#ssn;  // undefined
```

**Workaround:** Don't use private fields for persisted data. Use TypeScript `private` (compile-time only):
```typescript
class Employee {
  constructor(
    public name: string,
    private ssn: string  // TypeScript private, but JavaScript public
  ) {}
}

// Serialized
{
  __class__: 'Employee',
  name: 'Alice',
  ssn: '123-45-6789'  // ✓ Preserved
}
```

**Recommendation:** Document this limitation clearly. Private fields (`#`) are ephemeral.

---

## 7. Event-Based Synchronization

### 7.1 The Offline-First Use Case

**Progressive Web App pattern:**
- Client application works fully offline (IndexedDB storage)
- Server application persists to filesystem
- Both use same Ireneo library
- Periodic sync exchanges event logs

**Benefits:**
- User never blocked by network latency
- App works on subway, airplane, remote locations
- Sync happens in background when online
- Same domain model code on client and server

### 7.2 Sync API

**Enable synchronization:**

```typescript
interface SyncOptions {
  endpoint: string | SyncEndpoint;  // URL or sync object
  interval?: number;  // Auto-sync every N ms (optional)
  strategy?: 'last-write-wins' | 'client-wins' | 'server-wins';
  onConflict?: (local: Event, remote: Event) => Event | Event[];
  onSync?: (result: SyncResult) => void;  // Callback after sync
}

interface SyncEndpoint {
  getEventsSince(timestamp: number): Promise<Event[]>;
  applyEvents(events: Event[]): Promise<void>;
}

// Enable sync
await db.enableSync({
  endpoint: 'https://api.example.com/sync',
  interval: 30000,  // Sync every 30 seconds
  strategy: 'last-write-wins'
});

// Manual sync
const result = await db.sync();
console.log(result);  // { pushed: 12, pulled: 5, conflicts: 0 }

// Disable sync
await db.disableSync();

// Check sync status
console.log(db.syncStatus);
// { enabled: true, lastSync: 1730000000, pendingEvents: 12 }
```

### 7.3 Sync Protocol

**Bidirectional event exchange:**

```
┌─────────────┐                    ┌─────────────┐
│   Client    │                    │   Server    │
│  (Browser)  │                    │  (Node.js)  │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │ 1. GET /sync?since=1730000000   │
       │─────────────────────────────────>│
       │                                  │
       │ 2. Return server events          │
       │<─────────────────────────────────│
       │    {events: [...], timestamp}    │
       │                                  │
       │ 3. POST /sync {events: [...]}    │
       │─────────────────────────────────>│
       │                                  │
       │ 4. Apply client events           │
       │<─────────────────────────────────│
       │    {success: true}               │
       │                                  │
```

**Sync algorithm:**

```typescript
async function sync(db: IreneoInstance, options: SyncOptions): Promise<SyncResult> {
  const lastSync = db.syncMetadata.lastSyncTimestamp || 0;

  // 1. Pull server events
  const serverEvents = await options.endpoint.getEventsSince(lastSync);

  // 2. Push local events
  const localEvents = await db.getEventsSince(lastSync);
  await options.endpoint.applyEvents(localEvents);

  // 3. Detect conflicts
  const conflicts = detectConflicts(localEvents, serverEvents);

  // 4. Resolve conflicts
  const resolvedEvents = conflicts.length > 0
    ? resolveConflicts(conflicts, options.strategy, options.onConflict)
    : serverEvents;

  // 5. Apply resolved server events
  await db.applyEvents(resolvedEvents);

  // 6. Update sync timestamp
  db.syncMetadata.lastSyncTimestamp = Date.now();

  return {
    pushed: localEvents.length,
    pulled: resolvedEvents.length,
    conflicts: conflicts.length
  };
}
```

### 7.4 Conflict Detection

**Conflict occurs when:**
- Same path modified on both client and server
- Both modifications happened after last sync

**Example conflict:**

```typescript
// Last sync: 1730000000
// Client event (timestamp: 1730000100)
{ type: 'SET', path: ['employees', 0, 'sal'], value: 5500 }

// Server event (timestamp: 1730000150)
{ type: 'SET', path: ['employees', 0, 'sal'], value: 5600 }

// CONFLICT: Same property modified on both sides
```

### 7.5 Conflict Resolution Strategies

**1. Last-Write-Wins (default)**

```typescript
function resolveLastWriteWins(local: Event, remote: Event): Event {
  return local.timestamp > remote.timestamp ? local : remote;
}

// Result: Server event wins (5600) since timestamp 1730000150 > 1730000100
```

**2. Client-Wins**

```typescript
function resolveClientWins(local: Event, remote: Event): Event {
  return local;  // Always prefer client
}

// Result: Client event wins (5500)
```

**3. Server-Wins**

```typescript
function resolveServerWins(local: Event, remote: Event): Event {
  return remote;  // Always prefer server
}

// Result: Server event wins (5600)
```

**4. Custom Resolver**

```typescript
await db.enableSync({
  endpoint: 'https://api.example.com/sync',
  onConflict: (local, remote) => {
    // Custom logic
    if (local.path.join('.') === 'employees.0.sal') {
      // For salary changes, take higher value
      return local.value > remote.value ? local : remote;
    }
    // Default to last-write-wins
    return local.timestamp > remote.timestamp ? local : remote;
  }
});
```

### 7.6 Server-Side Sync Endpoint

**Example Express endpoint:**

```typescript
// server/sync.ts
import express from 'express';
import { Ireneo } from 'ireneo';

const app = express();
const db = await Ireneo.load('./data', {
  classes: { Employee, Department }
});

app.post('/sync', express.json(), async (req, res) => {
  const { events, since } = req.body;

  // Apply client events
  await db.applyEvents(events);

  // Get server events since client's last sync
  const serverEvents = await db.getEventsSince(since);

  res.json({
    events: serverEvents,
    timestamp: Date.now()
  });
});

app.listen(3000);
```

### 7.7 Progressive Web App Example

**Complete offline-first todo app:**

**Shared domain model:**
```typescript
// shared/domain.ts
export class Todo {
  constructor(
    public id: string,
    public text: string,
    public completed: boolean = false,
    public createdAt: Date = new Date()
  ) {}

  complete() {
    this.completed = true;
  }

  uncomplete() {
    this.completed = false;
  }
}

export interface TodoRoot {
  todos: Todo[];
}
```

**Server (Node.js):**
```typescript
// server/index.ts
import { Ireneo } from 'ireneo';
import { Todo, TodoRoot } from '../shared/domain';

const db = await Ireneo.create<TodoRoot>('./data', {
  todos: []
}, {
  classes: { Todo },
  storage: 'filesystem'
});

// Sync endpoint (see Section 7.6)
```

**Client (Browser):**
```typescript
// client/index.ts
import { Ireneo } from 'ireneo';
import { Todo, TodoRoot } from '../shared/domain';

const db = await Ireneo.create<TodoRoot>('todo-app', {
  todos: []
}, {
  classes: { Todo },
  storage: 'indexeddb'  // Browser storage
});

// Enable sync with server
await db.enableSync({
  endpoint: 'https://api.example.com/sync',
  interval: 30000,  // Sync every 30s when online
  strategy: 'last-write-wins'
});

// UI code
document.getElementById('add-todo').addEventListener('click', () => {
  const text = document.getElementById('todo-input').value;
  db.todos.push(new Todo(crypto.randomUUID(), text));
  // Persisted to IndexedDB immediately
  // Synced to server when online
});

document.querySelectorAll('.todo-checkbox').forEach(checkbox => {
  checkbox.addEventListener('change', (e) => {
    const todoId = e.target.dataset.id;
    const todo = db.todos.find(t => t.id === todoId);
    if (checkbox.checked) {
      todo.complete();  // Method call persisted!
    } else {
      todo.uncomplete();
    }
  });
});
```

**Result:**
- App works fully offline
- Changes persist to IndexedDB immediately
- Auto-syncs with server every 30 seconds when online
- Same code (Ireneo API, domain classes) on client and server
- Conflicts resolved automatically

### 7.8 Sync Limitations (Ireneo)

**Not implemented (deferred to Ireneo Full):**

- ❌ **CRDT-based conflict resolution** - Last-write-wins only
- ❌ **Causal consistency** - No vector clocks or logical timestamps
- ❌ **Multi-client coordination** - No consensus algorithm
- ❌ **Partial sync** - Must sync entire event log (no selective sync)
- ❌ **Compaction** - Old events not pruned automatically

**Workarounds:**
- Use conflict resolution callbacks for custom logic
- Snapshot frequently on server to limit sync payload
- Design domain model to minimize conflicts (e.g., append-only logs)

---

## 8. Serialization Format

### 8.1 Pluggable Serialization Interface

```typescript
// interface Serializer (serialize.ts)
interface Serializer {
  /**
   * Serialize a value (for events or snapshots)
   */
  serialize(value: unknown): Buffer | string;

  /**
   * Deserialize back to JavaScript value
   */
  deserialize(data: Buffer | string): unknown;

  /**
   * Human-readable name
   */
  readonly name: string;
}
```

### 8.2 JSON Serializer (default, for compatibility)

**Pros:**
- ✅ Human-readable (debugging, version control)
- ✅ Universal compatibility
- ✅ Simple implementation (built-in)

**Cons:**
- ❌ Verbose (property names repeated)
- ❌ Limited types (Date, Map, Set need custom handling)
- ❌ No binary data support

**Use cases:**
- Development and debugging
- Git-tracked data files
- Cross-language compatibility

### 8.3 MessagePack Serializer (recommended default)

**Why MessagePack?**
- ✅ Compact binary format (50-60% smaller than JSON)
- ✅ Supports binary data natively (ArrayBuffer, Buffer)
- ✅ Fast serialization/deserialization
- ✅ Mature libraries (`msgpackr` for Node.js)
- ✅ Preserves type information (distinguishes Date, Map, Set)

**Comparison (Scott schema example):**
```typescript
const data = {
  employees: [
    { empno: 7839, ename: 'KING', sal: 5000, hiredate: new Date() }
    // ... 13 more employees
  ],
  depts: [
    { deptno: 10, dname: 'ACCOUNTING', loc: 'NEW YORK', employees: [...] }
    // ... 3 more departments
  ]
};

// JSON: 2,847 bytes
JSON.stringify(data).length;  // 2847

// MessagePack: 1,621 bytes (43% smaller!)
msgpack.encode(data).byteLength;  // 1621
```

**Implementation:**
```typescript
// MessagePackSerializer (serialize.ts)
import { pack, unpack } from 'msgpackr';

class MessagePackSerializer implements Serializer {
  readonly name = 'messagepack';

  serialize(value: unknown): Buffer {
    return pack(value);
  }

  deserialize(data: Buffer): unknown {
    return unpack(data);
  }
}
```

### 8.4 Avro Serializer (future, for schema evolution)

**Why Avro?**
- ✅ Maximum compactness (schema stored separately)
- ✅ Built-in schema evolution support
- ✅ Cross-language compatibility

**Example:**
```typescript
// Schema (stored once in ireneo.meta)
{
  "type": "record",
  "name": "Employee",
  "fields": [
    {"name": "empno", "type": "int"},
    {"name": "ename", "type": "string"},
    {"name": "sal", "type": "int"}
  ]
}

// Data (field names omitted, even more compact)
[7839, "KING", 5000]
```

**Deferred to Ireneo Full** (requires TypeScript metadata extraction)

---

## 9. Storage Layout

### 9.1 Directory Structure

```
data/
├── ireneo.meta                  # Metadata file
│   ├── version: "0.1.0"
│   ├── serializer: "messagepack"
│   ├── classes: ["Employee", "Department"]
│   └── createdAt: "2024-10-23T10:00:00Z"
│
├── ireneo.lock                  # Lock file (prevents concurrent access)
│
├── events/                      # Event log (append-only)
│   ├── 00001.mpack             # First 1000 events
│   ├── 00002.mpack             # Next 1000 events
│   └── 00003.mpack             # Most recent events
│
└── snapshots/                   # Periodic snapshots (optional)
    ├── 2024-10-23T10:00:00Z.mpack  # Snapshot at 10am
    └── 2024-10-23T14:00:00Z.mpack  # Snapshot at 2pm
```

### 9.2 Event Log Format

**NDJSON (Newline Delimited JSON) for JSON serializer:**
```json
{"type":"SET","path":["employees"],"value":[...],"timestamp":1730000000}
{"type":"ARRAY_PUSH","path":["employees"],"value":{...},"timestamp":1730000001}
{"type":"SET","path":["employees",0,"sal"],"value":5500,"timestamp":1730000002}
```

**MessagePack sequence for MessagePack serializer:**
```
<msgpack event 1><newline>
<msgpack event 2><newline>
<msgpack event 3><newline>
```

**File rotation:** New file every N events (default: 1000)
- Prevents single massive file
- Enables concurrent reads (old files immutable)
- Simplifies snapshot logic (discard old event files after snapshot)

### 9.3 Snapshot Format

**Full memory image serialized:**
```typescript
{
  __snapshot__: true,
  timestamp: 1730000000000,
  eventCount: 2500,  // Events replayed to create this snapshot
  root: {
    employees: [...],
    depts: [...]
  }
}
```

**Snapshot strategy options:**
```typescript
{
  strategy: 'time',      // Snapshot every N minutes
  interval: 60,          // 60 minutes
}

{
  strategy: 'events',    // Snapshot every N events
  threshold: 1000,       // 1000 events
}

{
  strategy: 'manual',    // Explicit db.snapshot() calls only
}

{
  strategy: 'none',      // No snapshots (replay all events on startup)
}
```

### 9.4 Recovery Algorithm

**Cold start:**
```
1. Load ireneo.meta
   - Read serializer type
   - Read class names

2. Find latest snapshot (if exists)
   - Read snapshots/ directory
   - Pick most recent timestamp

3. Load snapshot
   - Deserialize with configured serializer
   - Reconstruct class instances (set prototypes)

4. Determine events to replay
   - snapshot.eventCount = 2500
   - Current events/ directory has 3000 events
   - Replay events 2501-3000

5. Replay events since snapshot
   - Apply each event to memory image

6. Wrap root in proxies
   - Enable transparent mutation tracking

7. Return to developer
```

**No snapshot:**
```
1. Load ireneo.meta
2. Replay ALL events from events/
3. Wrap root in proxies
4. Return to developer
```

**Performance:**
- With snapshots: O(events since snapshot)
- Without snapshots: O(all events)
- Recommendation: Snapshot every 1000 events or 60 minutes

---

## 10. Public API

### 10.1 Core API

#### `Ireneo.create<T>(path, initial, options?)`

**Create new persistent store:**
```typescript
interface CreateOptions {
  classes?: Record<string, Constructor>;  // Class registry
  serializer?: 'json' | 'messagepack' | Serializer;
  snapshotStrategy?: SnapshotStrategy;
}

const db = await Ireneo.create<MyRoot>('./data', {
  employees: [],
  depts: []
}, {
  classes: { Employee, Department },
  serializer: 'messagepack',
  snapshotStrategy: { strategy: 'events', threshold: 1000 }
});
```

**Returns:** Proxied root object (type `T`)

#### `Ireneo.load<T>(path, options?)`

**Load existing store:**
```typescript
interface LoadOptions {
  classes: Record<string, Constructor>;  // Required!
  serializer?: 'json' | 'messagepack' | Serializer;  // Auto-detect if omitted
  migrations?: Record<string, Migration>;  // User-provided migrations
}

const db = await Ireneo.load<MyRoot>('./data', {
  classes: { Employee, Department }
});
```

**Returns:** Proxied root object (type `T`)

**Note:** `classes` is REQUIRED for load (deserialization needs constructors)

#### `Ireneo.snapshot()`

**Create snapshot explicitly:**
```typescript
await db.snapshot();
```

**Use cases:**
- Before risky operations
- Before schema migrations
- After bulk imports
- On shutdown (graceful termination)

#### `Ireneo.close()`

**Flush and close:**
```typescript
await db.close();
```

**What it does:**
- Flush pending events
- Release file locks
- Clean up resources

### 10.2 Transaction API

#### `Ireneo.transaction<T>(path, options?)`

**Create transaction:**
```typescript
const txn = await Ireneo.transaction<MyRoot>('./data', {
  classes: { Employee, Department }
});

// Make changes
txn.root.employees.push(new Employee(...));

// Commit
await txn.save();

// OR rollback
txn.discard();
```

**Transaction lifecycle:**
1. Load base state (from snapshot + events)
2. Create delta layer (empty)
3. Developer makes changes (writes to delta)
4. `save()` applies delta to base + logs events
5. `discard()` throws delta away

#### `txn.save()`

**Commit transaction:**
```typescript
await txn.save();
```

**What it does:**
1. Sort delta entries (parents before children)
2. Apply each change to base state
3. Generate events
4. Append events to log
5. Clear delta

#### `txn.discard()`

**Rollback transaction:**
```typescript
txn.discard();
```

**What it does:**
- Clear delta (throw away changes)
- Base state unchanged

**No I/O, instant.**

### 10.3 Migration API (Manual Schema Evolution)

#### User-provided migrations

**When schema changes:**
```typescript
// Old version
class Employee {
  sal: number;
}

// New version
class Employee {
  salary: { amount: number; currency: string };
}

// Load with migration
const db = await Ireneo.load('./data', {
  classes: { Employee },
  migrations: {
    Employee: {
      version: 2,
      up: (old: any) => ({
        ...old,
        salary: { amount: old.sal, currency: 'USD' }
      })
    }
  }
});
```

**Migration runs once per object, results cached.**

**Future (Ireneo Full):** Automatic migrations via TypeScript metadata

---

## 11. Migration from MemImg

### 11.1 What Stays the Same

**Core architecture unchanged:**
- ✅ Mutation sourcing (not command sourcing)
- ✅ Imperative shell over functional core
- ✅ Proxy-based transparent persistence
- ✅ Two-mode serialization (snapshot vs event)
- ✅ Two-pass deserialization
- ✅ Delta layering for transactions
- ✅ Pluggable event logs

**Modules unchanged:**
- ✅ `proxy.ts` - Lazy wrapping, cycle handling
- ✅ `collection-wrapper.ts` - Array/Map/Set interception
- ✅ `event-handlers.ts` - 18 mutation type handlers
- ✅ `type-classifier.ts` - Type detection
- ✅ `transaction.ts` - Delta manager, transactional proxies
- ✅ `event-log.ts` - Pluggable storage

### 11.2 What Changes

**New modules:**
- ➕ `class-registry.ts` - Maps class names to constructors
- ➕ `instance-reconstructor.ts` - Rebuilds class instances
- ➕ `type-extensions.ts` - RegExp, Error, ArrayBuffer serializers

**Modified modules:**
- 🔄 `serialize.ts` - Add `__class__` for class instances
- 🔄 `deserialize.ts` - Call instance reconstructor after deserialization
- 🔄 `types.ts` - Add `classes` to options

### 11.3 Breaking Changes

1. **Class registry required** for load (new parameter)
2. **RegExp serialization** now includes lastIndex tracking
3. **API naming** - All MemImg references renamed to Ireneo

### 11.4 Compatibility Layer

**Option: Keep MemImg API for simple cases:**
```typescript
// MemImg API (no class support)
const root = createMemoryImage({ employees: [] });

// Ireneo API (with class support)
const root = await Ireneo.create('./data', { employees: [] }, {
  classes: { Employee }
});
```

**Export both from same package:**
```typescript
export {
  // MemImg API (browser + Node.js, no classes)
  createMemoryImage,
  serializeMemoryImage,
  // ...

  // Ireneo API (with classes and full features)
  Ireneo
};
```

---

## 12. Implementation Phases

### Architectural Foundation (COMPLETE - 2025-10-24)

**Status:** ✅ Complete

Prior to RFC feature implementation, comprehensive architectural refactoring established a solid foundation:

**Phase 2: Type Safety Migration**
- Branded types (`Proxied<T>`, `Target<T>`) for compile-time safety
- Eliminates proxy/target confusion at compile time
- Zero runtime cost

**Phase 1: Path Navigator Refactor**
- Unified path-navigator.ts utility (~220 lines)
- Map/Set-aware navigation
- Iterator protocol support (entries, values, forEach)
- ~60 lines duplication eliminated

**Phase 3: Collection Strategy Pattern**
- Data-driven collection handling (~320 lines)
- ArrayStrategy, MapStrategy, SetStrategy
- ~50 lines duplication eliminated

**Phase 4: Root Cause Analysis**
- Comprehensive limitation documentation
- Technical analysis and proposed solutions

**Phase A: Nested Collection Fix**
- **Granular key tracking for Maps**
- Nested Map mutations fully supported
- Zero regressions (656/657 tests passing)
- Completed in 1 day vs. 1-2 weeks estimated

**Result:** Production-ready architectural foundation with 94.74% test coverage.

---

### Phase 0: RegExp Support (COMPLETE)

**Status:** ✅ Complete

**Delivered:**
- RegExp serialization with source, flags, lastIndex
- Mutation tracking for lastIndex changes
- Full test coverage

### Phase 1: Class Instance Preservation (COMPLETE)

**Status:** ✅ Complete

**Delivered:**
- Implemented `class-registry.ts` (class name → constructor mapping)
- Implemented `instance-reconstructor.ts` (prototype reattachment)
- Modified serialization to detect and mark class instances
- Modified deserialization to reconstruct instances with methods
- Full test coverage:
  - Simple classes (methods work after deserialize)
  - Inheritance chains (superclass methods preserved)
  - Circular references between instances
  - Prototype chains intact

**Result:** Class instances fully supported with working methods

### Phase 2: Type System Extensions (1 week)

**Tasks:**
1. Implement `type-extensions.ts`:
   - Error serializer/deserializer (all subtypes)
   - ArrayBuffer serializer/deserializer (Base64)
   - TypedArray serializer/deserializer (10 variants)
   - DataView serializer/deserializer
2. Add to `type-classifier.ts`:
   - ERROR, ARRAYBUFFER, TYPEDARRAY, DATAVIEW categories
3. Integrate into `serialize.ts` and `deserialize.ts`
4. Write tests for each new type (round-trip)

**Deliverable:** 18 of 21 standard JavaScript types supported

### Phase 3: MessagePack Serializer (3 days)

**Tasks:**
1. Implement `MessagePackSerializer` class
2. Integrate `msgpackr` library
3. Update event log to handle binary formats
4. Benchmark vs JSON (size and speed)
5. Document trade-offs

**Deliverable:** Pluggable serializer with MessagePack default

### Phase 4: TypeScript Types & API Polish (3 days)

**Tasks:**
1. Add comprehensive type definitions:
   - Generic `Ireneo.create<T>` / `.load<T>`
   - Options interfaces
   - Transaction types
2. Improve error messages
3. Add JSDoc documentation
4. Create examples (Scott schema, todo app)

**Deliverable:** Production-ready TypeScript types

### Phase 5: Storage Optimization (1 week)

**Tasks:**
1. Implement file rotation (events split across multiple files)
2. Optimize snapshot strategy (time-based, event-based, manual)
3. Add snapshot compression (gzip for JSON, native for MessagePack)
4. Implement concurrent read optimization
5. Add metrics (snapshot size, event count, recovery time)

**Deliverable:** Optimized filesystem storage

### Phase 6: Documentation & Examples (1 week)

**Tasks:**
1. Getting started guide
2. API reference (auto-generated from JSDoc)
3. Migration guide (from ORMs, from plain JSON)
4. Examples:
   - Simple todo app
   - Scott schema (EMP/DEPT)
   - E-commerce domain (products, orders, customers)
5. Performance benchmarks
6. Limitations document (WeakMap, Promise, private fields)

**Deliverable:** Comprehensive documentation

**Remaining: 3-4 weeks** (Architectural foundation + Phase 0 + Phase 1 complete)

---

## 13. Future Work (Ireneo Full)

### Deferred to Ireneo Full:

1. **TypeScript metadata extraction**
   - Build-time type extraction via Compiler API
   - Store type definitions in ireneo.meta
   - Enable runtime type validation

2. **Automatic schema migrations**
   - Detect type changes automatically
   - Generate migration functions
   - Apply transformations to data

3. **Runtime validation**
   - Validate data matches TypeScript types
   - Catch type mismatches at load time
   - Better error messages

4. **Query optimization**
   - Indexes for fast lookups
   - Query planner
   - Lazy loading for large graphs

5. **Advanced serialization**
   - Closure context preservation
   - Generic type argument capture
   - Method dependency tracking

6. **Multi-process support**
   - Optimistic locking
   - Event log merging
   - Distributed transactions

**Ireneo is the foundation, Ireneo Full builds on it.**

---

## Conclusion

Ireneo provides transparent, event-sourced persistence for TypeScript/JavaScript applications, eliminating the object-relational impedance mismatch. By extending MemImg's solid foundation with class instance preservation and complete JavaScript type support, it delivers a practical alternative to traditional ORMs and databases.

**Key achievements:**
- ✅ Transparent persistence (no `.save()` calls)
- ✅ Class methods preserved (prototypes intact)
- ✅ 18 of 21 JavaScript types supported
- ✅ Native JavaScript queries (`.filter()`, `.map()`)
- ✅ Event sourcing built-in
- ✅ TypeScript compatibility (generics, type assertions)

**What's missing (by design):**
- ❌ Automatic schema migrations (user-provided only)
- ❌ Runtime validation (compile-time only)
- ❌ Build-time type extraction (deferred to Ireneo Full)

**The result:** A simple, powerful persistence layer that treats objects as the database.

---

## Appendix A: Example Usage

### Scott Schema (EMP/DEPT)

```typescript
// domain.ts
class Department {
  employees: Employee[] = [];

  constructor(
    public deptno: number,
    public dname: string,
    public loc: string
  ) {}

  addEmployee(emp: Employee) {
    this.employees.push(emp);
    emp.dept = this;
  }
}

class Employee {
  constructor(
    public empno: number,
    public ename: string,
    public job: string,
    public mgr: Employee | null,
    public hiredate: Date,
    public sal: number,
    public comm: number | null,
    public dept: Department | null
  ) {}

  giveRaise(amount: number) {
    this.sal += amount;
  }
}

// app.ts
import { Ireneo } from 'ireneo';
import { Department, Employee } from './domain';

// Create store
const db = await Ireneo.create('./data', {
  depts: [],
  emps: []
}, {
  classes: { Department, Employee }
});

// Populate
const accounting = new Department(10, 'ACCOUNTING', 'NEW YORK');
const research = new Department(20, 'RESEARCH', 'DALLAS');

db.depts.push(accounting, research);

const king = new Employee(7839, 'KING', 'PRESIDENT', null, new Date('1981-11-17'), 5000, null, null);
const blake = new Employee(7698, 'BLAKE', 'MANAGER', king, new Date('1981-05-01'), 2850, null, null);

accounting.addEmployee(king);
accounting.addEmployee(blake);

// Query
const highEarners = db.emps.filter(e => e.sal > 3000);
const accountingEmps = db.depts[0].employees;

// Methods work
king.giveRaise(500);

// Relationships are direct
console.log(king.dept.dname);  // 'ACCOUNTING'
console.log(accounting.employees[0].ename);  // 'KING'

// Restart
const db2 = await Ireneo.load('./data', {
  classes: { Department, Employee }
});

// Everything restored
db2.emps[0].giveRaise(500);  // ✓ Method works!
db2.emps[0] instanceof Employee;  // ✓ true
```

---

## Appendix B: Comparison with Alternatives

| Feature | Ireneo | Prisma (ORM) | MongoDB | Zod + JSON |
|---------|--------|--------------|---------|------------|
| Schema definition | TypeScript classes | schema.prisma | None | Zod schema |
| Query language | JavaScript | Prisma DSL | MongoDB query | JavaScript |
| Relationships | Direct references | Foreign keys | Embedded/refs | Manual |
| Methods | ✅ Preserved | ❌ Lost | ❌ Lost | ❌ Lost |
| Transparent persistence | ✅ Yes | ❌ No (.save()) | ❌ No (.save()) | ❌ No (manual) |
| Type safety | ✅ TypeScript | ✅ Generated | ❌ Runtime only | ✅ TypeScript |
| Schema evolution | Manual migrations | Prisma Migrate | Manual | Manual |
| Event sourcing | ✅ Built-in | ❌ No | ❌ No | ❌ No |
| Circular refs | ✅ Yes | ⚠️ Limited | ⚠️ Limited | ❌ No |
| Build step | ❌ No | ✅ Required | ❌ No | ❌ No |

---

**End of RFC**
