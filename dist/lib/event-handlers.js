/**
 * Event Handlers - Registry pattern for event creation and replay
 *
 * This module eliminates 40+ switch cases across proxy.ts and replay.ts
 * by providing a unified registry of event handlers.
 *
 * Each event type has ONE handler class that knows how to:
 * 1. Create the event (from proxy mutations)
 * 2. Apply the event (during replay)
 *
 * Benefits:
 * - Single source of truth per event type
 * - Testable in isolation
 * - Extensible - easy to add new event types
 * - Type safe - handlers are strongly typed
 */
import { EVENT_TYPES } from './constants.js';
import { serializeValueForEvent } from './serialize.js';
import { reconstructValue, deserializeEventValue } from './deserialize.js';
// ============================================================================
// Property Mutation Handlers (SET, DELETE)
// ============================================================================
/**
 * Handler for SET events (property assignment)
 */
class SetEventHandler {
    createEvent(path, args, infrastructure) {
        const [value] = args;
        return {
            type: EVENT_TYPES.SET,
            path,
            value: serializeValueForEvent(value, infrastructure.proxyToTarget, infrastructure.targetToPath, path),
            timestamp: Date.now(),
        };
    }
    applyEvent(event, target, key, root) {
        const setEvent = event;
        /**
         * Use hierarchical scoped resolution for event values.
         *
         * WHY: Event values exhibit closure semantics - they have internal structure
         * (objects within the value) and capture external context (references to
         * objects in the memory graph).
         *
         * WHAT: deserializeEventValue implements proper hierarchical scoped resolution:
         * 1. Try value scope first (internal refs - relative paths)
         * 2. Fall back to memory scope (external refs - absolute paths)
         *
         * HOW: This works correctly whether the value has:
         * - No references (simple values)
         * - Only internal references (cycles within value)
         * - Only external references (refs to memory)
         * - Mixed internal + external references (the critical case!)
         *
         * No special-case detection needed - hierarchical resolution handles all cases.
         */
        const deserializedValue = deserializeEventValue(setEvent.value, root // Memory root for external ref resolution
        );
        // Handle Maps specially - use .set() instead of bracket notation
        if (target instanceof Map) {
            target.set(key, deserializedValue);
        }
        else {
            target[key] = deserializedValue;
        }
    }
}
/**
 * Handler for DELETE events (property deletion)
 */
class DeleteEventHandler {
    createEvent(path) {
        return {
            type: EVENT_TYPES.DELETE,
            path,
            timestamp: Date.now(),
        };
    }
    applyEvent(_event, target, key) {
        delete target[key];
    }
}
// ============================================================================
// Array Mutation Handlers
// ============================================================================
/**
 * Handler for ARRAY_PUSH events
 */
class ArrayPushHandler {
    createEvent(path, args, infrastructure) {
        return {
            type: EVENT_TYPES.ARRAY_PUSH,
            path,
            items: args.map((v) => serializeValueForEvent(v, infrastructure.proxyToTarget, infrastructure.targetToPath, path)),
            timestamp: Date.now(),
        };
    }
    applyEvent(event, target, key, root) {
        const pushEvent = event;
        const arr = target[key];
        for (const item of pushEvent.items) {
            arr.push(reconstructValue(item, root));
        }
    }
}
/**
 * Handler for ARRAY_POP events
 */
class ArrayPopHandler {
    createEvent(path) {
        return {
            type: EVENT_TYPES.ARRAY_POP,
            path,
            timestamp: Date.now(),
        };
    }
    applyEvent(_event, target, key) {
        const arr = target[key];
        arr.pop();
    }
}
/**
 * Handler for ARRAY_SHIFT events
 */
class ArrayShiftHandler {
    createEvent(path) {
        return {
            type: EVENT_TYPES.ARRAY_SHIFT,
            path,
            timestamp: Date.now(),
        };
    }
    applyEvent(_event, target, key) {
        const arr = target[key];
        arr.shift();
    }
}
/**
 * Handler for ARRAY_UNSHIFT events
 */
class ArrayUnshiftHandler {
    createEvent(path, args, infrastructure) {
        return {
            type: EVENT_TYPES.ARRAY_UNSHIFT,
            path,
            items: args.map((v) => serializeValueForEvent(v, infrastructure.proxyToTarget, infrastructure.targetToPath, path)),
            timestamp: Date.now(),
        };
    }
    applyEvent(event, target, key, root) {
        const unshiftEvent = event;
        const arr = target[key];
        const items = unshiftEvent.items.map((v) => reconstructValue(v, root));
        arr.unshift(...items);
    }
}
/**
 * Handler for ARRAY_SPLICE events
 */
class ArraySpliceHandler {
    createEvent(path, args, infrastructure) {
        return {
            type: EVENT_TYPES.ARRAY_SPLICE,
            path,
            start: args[0],
            deleteCount: args[1] || 0,
            items: args
                .slice(2)
                .map((v) => serializeValueForEvent(v, infrastructure.proxyToTarget, infrastructure.targetToPath, path)),
            timestamp: Date.now(),
        };
    }
    applyEvent(event, target, key, root) {
        const spliceEvent = event;
        const arr = target[key];
        const items = spliceEvent.items.map((v) => reconstructValue(v, root));
        arr.splice(spliceEvent.start, spliceEvent.deleteCount, ...items);
    }
}
/**
 * Handler for ARRAY_SORT events
 */
class ArraySortHandler {
    createEvent(path) {
        return {
            type: EVENT_TYPES.ARRAY_SORT,
            path,
            timestamp: Date.now(),
        };
    }
    applyEvent(_event, target, key) {
        const arr = target[key];
        arr.sort();
    }
}
/**
 * Handler for ARRAY_REVERSE events
 */
class ArrayReverseHandler {
    createEvent(path) {
        return {
            type: EVENT_TYPES.ARRAY_REVERSE,
            path,
            timestamp: Date.now(),
        };
    }
    applyEvent(_event, target, key) {
        const arr = target[key];
        arr.reverse();
    }
}
/**
 * Handler for ARRAY_FILL events
 */
class ArrayFillHandler {
    createEvent(path, args, infrastructure) {
        return {
            type: EVENT_TYPES.ARRAY_FILL,
            path,
            value: serializeValueForEvent(args[0], infrastructure.proxyToTarget, infrastructure.targetToPath, path),
            start: args[1],
            end: args[2],
            timestamp: Date.now(),
        };
    }
    applyEvent(event, target, key, root) {
        const fillEvent = event;
        const arr = target[key];
        const value = reconstructValue(fillEvent.value, root);
        arr.fill(value, fillEvent.start, fillEvent.end);
    }
}
/**
 * Handler for ARRAY_COPYWITHIN events
 */
class ArrayCopyWithinHandler {
    createEvent(path, args) {
        return {
            type: EVENT_TYPES.ARRAY_COPYWITHIN,
            path,
            target: args[0],
            start: args[1],
            end: args[2],
            timestamp: Date.now(),
        };
    }
    applyEvent(event, target, key) {
        const copyEvent = event;
        const arr = target[key];
        arr.copyWithin(copyEvent.target, copyEvent.start, copyEvent.end);
    }
}
// ============================================================================
// Map Mutation Handlers
// ============================================================================
/**
 * Handler for MAP_SET events
 */
class MapSetHandler {
    createEvent(path, args, infrastructure) {
        return {
            type: EVENT_TYPES.MAP_SET,
            path,
            key: serializeValueForEvent(args[0], infrastructure.proxyToTarget, infrastructure.targetToPath, path),
            value: serializeValueForEvent(args[1], infrastructure.proxyToTarget, infrastructure.targetToPath, path),
            timestamp: Date.now(),
        };
    }
    applyEvent(event, target, key, root) {
        const mapSetEvent = event;
        const map = target[key];
        const mapKey = reconstructValue(mapSetEvent.key, root);
        const mapValue = reconstructValue(mapSetEvent.value, root);
        map.set(mapKey, mapValue);
    }
}
/**
 * Handler for MAP_DELETE events
 */
class MapDeleteHandler {
    createEvent(path, args, infrastructure) {
        return {
            type: EVENT_TYPES.MAP_DELETE,
            path,
            key: serializeValueForEvent(args[0], infrastructure.proxyToTarget, infrastructure.targetToPath, path),
            timestamp: Date.now(),
        };
    }
    applyEvent(event, target, key, root) {
        const mapDeleteEvent = event;
        const map = target[key];
        const mapKey = reconstructValue(mapDeleteEvent.key, root);
        map.delete(mapKey);
    }
}
/**
 * Handler for MAP_CLEAR events
 */
class MapClearHandler {
    createEvent(path) {
        return {
            type: EVENT_TYPES.MAP_CLEAR,
            path,
            timestamp: Date.now(),
        };
    }
    applyEvent(_event, target, key) {
        const map = target[key];
        map.clear();
    }
}
// ============================================================================
// Set Mutation Handlers
// ============================================================================
/**
 * Handler for SET_ADD events
 */
class SetAddHandler {
    createEvent(path, args, infrastructure) {
        return {
            type: EVENT_TYPES.SET_ADD,
            path,
            value: serializeValueForEvent(args[0], infrastructure.proxyToTarget, infrastructure.targetToPath, path),
            timestamp: Date.now(),
        };
    }
    applyEvent(event, target, key, root) {
        const setAddEvent = event;
        const set = target[key];
        const value = reconstructValue(setAddEvent.value, root);
        set.add(value);
    }
}
/**
 * Handler for SET_DELETE events
 */
class SetDeleteHandler {
    createEvent(path, args, infrastructure) {
        return {
            type: EVENT_TYPES.SET_DELETE,
            path,
            value: serializeValueForEvent(args[0], infrastructure.proxyToTarget, infrastructure.targetToPath, path),
            timestamp: Date.now(),
        };
    }
    applyEvent(event, target, key, root) {
        const setDeleteEvent = event;
        const set = target[key];
        const value = reconstructValue(setDeleteEvent.value, root);
        set.delete(value);
    }
}
/**
 * Handler for SET_CLEAR events
 */
class SetClearHandler {
    createEvent(path) {
        return {
            type: EVENT_TYPES.SET_CLEAR,
            path,
            timestamp: Date.now(),
        };
    }
    applyEvent(_event, target, key) {
        const set = target[key];
        set.clear();
    }
}
// ============================================================================
// Script Event Handler
// ============================================================================
/**
 * Handler for SCRIPT events (audit trail only, no mutation)
 */
class ScriptEventHandler {
    createEvent(path, args) {
        return {
            type: EVENT_TYPES.SCRIPT,
            path,
            source: args[0],
            timestamp: Date.now(),
        };
    }
    applyEvent() {
        // Script events don't mutate state, they're for audit trail only
    }
}
// ============================================================================
// Event Handler Registry
// ============================================================================
/**
 * Registry for event handlers
 *
 * Provides lookup and invocation of handlers by event type.
 */
export class EventHandlerRegistry {
    constructor() {
        this.handlers = new Map();
    }
    /**
     * Register a handler for an event type
     */
    register(eventType, handler) {
        this.handlers.set(eventType, handler);
    }
    /**
     * Create an event from a mutation
     *
     * Replaces 112 lines of switch cases in proxy.ts
     */
    createEvent(eventType, path, args, infrastructure) {
        const handler = this.handlers.get(eventType);
        if (!handler) {
            throw new Error(`No handler registered for event type: ${eventType}`);
        }
        return handler.createEvent(path, args, infrastructure);
    }
    /**
     * Apply an event during replay
     *
     * Replaces 153 lines of switch cases in replay.ts
     */
    applyEvent(event, target, key, root) {
        const handler = this.handlers.get(event.type);
        if (!handler) {
            throw new Error(`No handler registered for event type: ${event.type}`);
        }
        handler.applyEvent(event, target, key, root);
    }
    /**
     * Check if a handler is registered
     */
    hasHandler(eventType) {
        return this.handlers.has(eventType);
    }
}
// ============================================================================
// Exported Registry Instance
// ============================================================================
/**
 * Global event handler registry
 *
 * Pre-configured with all 18 event handlers.
 * Used by proxy.ts and replay.ts.
 */
export const eventRegistry = new EventHandlerRegistry();
// Register all handlers
eventRegistry.register(EVENT_TYPES.SET, new SetEventHandler());
eventRegistry.register(EVENT_TYPES.DELETE, new DeleteEventHandler());
eventRegistry.register(EVENT_TYPES.ARRAY_PUSH, new ArrayPushHandler());
eventRegistry.register(EVENT_TYPES.ARRAY_POP, new ArrayPopHandler());
eventRegistry.register(EVENT_TYPES.ARRAY_SHIFT, new ArrayShiftHandler());
eventRegistry.register(EVENT_TYPES.ARRAY_UNSHIFT, new ArrayUnshiftHandler());
eventRegistry.register(EVENT_TYPES.ARRAY_SPLICE, new ArraySpliceHandler());
eventRegistry.register(EVENT_TYPES.ARRAY_SORT, new ArraySortHandler());
eventRegistry.register(EVENT_TYPES.ARRAY_REVERSE, new ArrayReverseHandler());
eventRegistry.register(EVENT_TYPES.ARRAY_FILL, new ArrayFillHandler());
eventRegistry.register(EVENT_TYPES.ARRAY_COPYWITHIN, new ArrayCopyWithinHandler());
eventRegistry.register(EVENT_TYPES.MAP_SET, new MapSetHandler());
eventRegistry.register(EVENT_TYPES.MAP_DELETE, new MapDeleteHandler());
eventRegistry.register(EVENT_TYPES.MAP_CLEAR, new MapClearHandler());
eventRegistry.register(EVENT_TYPES.SET_ADD, new SetAddHandler());
eventRegistry.register(EVENT_TYPES.SET_DELETE, new SetDeleteHandler());
eventRegistry.register(EVENT_TYPES.SET_CLEAR, new SetClearHandler());
eventRegistry.register(EVENT_TYPES.SCRIPT, new ScriptEventHandler());
//# sourceMappingURL=event-handlers.js.map