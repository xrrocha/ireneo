/**
 * Ireneo - Event-sourced transparent persistence for JavaScript
 *
 * "Funes the Memorious" by Jorge Luis Borges:
 * A man who remembered everything, unable to forget - perfect metaphor
 * for an event-sourced memory image system.
 *
 * @packageDocumentation
 */
// ============================================================================
// Core Memory Image API
// ============================================================================
export { createMemoryImage, serializeMemoryImageToJson, deserializeMemoryImageFromJson, replayEventsToMemoryImage, replayEventsFromLog, getMemoryImageMetadata, getMemoryImageInfrastructure, isMemoryImage, } from './memimg.js';
// ============================================================================
// Transaction API
// ============================================================================
export { createTransaction } from './transaction.js';
// ============================================================================
// Event Log Backends
// ============================================================================
export { createInMemoryEventLog, createFileEventLog, createIndexedDBEventLog, createLocalStorageEventLog, } from './event-log.js';
// ============================================================================
// Advanced API (for library consumers who need fine-grained control)
// ============================================================================
export { classifyValue, ValueCategory } from './type-classifier.js';
export { isPrimitive, isCollection, isNullish, isPlainObject, isObject, } from './js-types.js';
//# sourceMappingURL=index.js.map