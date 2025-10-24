/**
 * Event replay module for Memory Image Processor
 *
 * Reconstructs memory image state by replaying logged events.
 * Supports both full array iteration and async streaming.
 */
import type { Event, ReplayState } from "./types.js";
/**
 * Replays events to reconstruct memory image state.
 */
export declare const replayEvents: (root: unknown, events: readonly Event[] | AsyncIterable<Event>, replayState: ReplayState) => Promise<void>;
/**
 * Replays events from an event log to reconstruct memory image state.
 */
export declare const replayFromEventLog: (root: unknown, eventLog: {
    getAll(): Promise<readonly Event[]>;
    stream?(): AsyncIterable<Event>;
}, replayState: ReplayState) => Promise<void>;
//# sourceMappingURL=replay.d.ts.map