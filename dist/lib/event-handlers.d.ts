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
import type { Path, Event, ProxyInfrastructure } from './types.js';
/**
 * Interface for event handlers
 *
 * Each event type implements this interface with type-specific logic.
 */
export interface EventHandler {
    /**
     * Create an event from a mutation
     *
     * Called by proxy when a mutation occurs.
     *
     * @param path - Path to the mutated object
     * @param args - Arguments passed to the mutating operation
     * @param infrastructure - Proxy infrastructure for serialization
     * @returns Event object ready to be logged
     */
    createEvent(path: Path, args: unknown[], infrastructure: ProxyInfrastructure): Event;
    /**
     * Apply an event during replay
     *
     * Called by replay engine to reconstruct state.
     *
     * @param event - Event to apply
     * @param target - Parent object containing the property
     * @param key - Property key to mutate
     * @param root - Root object for resolving references
     */
    applyEvent(event: Event, target: unknown, key: string, root: unknown): void;
}
/**
 * Registry for event handlers
 *
 * Provides lookup and invocation of handlers by event type.
 */
export declare class EventHandlerRegistry {
    private handlers;
    /**
     * Register a handler for an event type
     */
    register(eventType: string, handler: EventHandler): void;
    /**
     * Create an event from a mutation
     *
     * Replaces 112 lines of switch cases in proxy.ts
     */
    createEvent(eventType: string, path: Path, args: unknown[], infrastructure: ProxyInfrastructure): Event;
    /**
     * Apply an event during replay
     *
     * Replaces 153 lines of switch cases in replay.ts
     */
    applyEvent(event: Event, target: unknown, key: string, root: unknown): void;
    /**
     * Check if a handler is registered
     */
    hasHandler(eventType: string): boolean;
}
/**
 * Global event handler registry
 *
 * Pre-configured with all 18 event handlers.
 * Used by proxy.ts and replay.ts.
 */
export declare const eventRegistry: EventHandlerRegistry;
//# sourceMappingURL=event-handlers.d.ts.map