/**
 * Event replay module for Memory Image Processor
 *
 * Reconstructs memory image state by replaying logged events.
 * Supports both full array iteration and async streaming.
 */
import { eventRegistry } from "./event-handlers.js";
import { navigateToParent } from "./path-navigator.js";
// ============================================================================
// Event Application Logic
// ============================================================================
/**
 * Applies a single event to a memory image root.
 */
const applyEvent = (root, event) => {
    // Navigate to parent using unified path navigator
    // createIntermediates=true ensures missing objects/arrays are created during replay
    const result = navigateToParent(root, event.path, { createIntermediates: true });
    if (!result) {
        // Empty path, nothing to apply
        return;
    }
    const { parent, key } = result;
    // Use registry to apply event (eliminates 153-line switch statement)
    eventRegistry.applyEvent(event, parent, key, root);
};
// ============================================================================
// Public API
// ============================================================================
/**
 * Replays events to reconstruct memory image state.
 */
export const replayEvents = async (root, events, replayState) => {
    replayState.isReplaying = true;
    if (Array.isArray(events)) {
        for (const event of events) {
            applyEvent(root, event);
        }
    }
    else {
        for await (const event of events) {
            applyEvent(root, event);
        }
    }
    replayState.isReplaying = false;
};
/**
 * Replays events from an event log to reconstruct memory image state.
 */
export const replayFromEventLog = async (root, eventLog, replayState) => {
    if (eventLog.stream) {
        await replayEvents(root, eventLog.stream(), replayState);
    }
    else {
        const events = await eventLog.getAll();
        await replayEvents(root, events, replayState);
    }
};
//# sourceMappingURL=replay.js.map