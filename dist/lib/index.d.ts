/**
 * Ireneo - Event-sourced transparent persistence for JavaScript
 *
 * "Funes the Memorious" by Jorge Luis Borges:
 * A man who remembered everything, unable to forget - perfect metaphor
 * for an event-sourced memory image system.
 *
 * @packageDocumentation
 */
export { createMemoryImage, serializeMemoryImageToJson, deserializeMemoryImageFromJson, replayEventsToMemoryImage, replayEventsFromLog, getMemoryImageMetadata, getMemoryImageInfrastructure, isMemoryImage, } from './memimg.js';
export { createTransaction } from './transaction.js';
export { createInMemoryEventLog, createFileEventLog, createIndexedDBEventLog, createLocalStorageEventLog, } from './event-log.js';
export type { Event, EventType, EventLog, Path, MutablePath, SerializedValue, SerializedPrimitive, SerializedArray, SerializedObject, MemoryImageOptions, ReplayState, ProxyInfrastructure, } from './types.js';
export type { Transaction, } from './transaction.js';
export { classifyValue, ValueCategory } from './type-classifier.js';
export type { TypeInfo } from './type-classifier.js';
export { isPrimitive, isCollection, isNullish, isPlainObject, isObject, } from './js-types.js';
//# sourceMappingURL=index.d.ts.map