import { EventEmitter } from "events";

// Shared in-process event bus.
// Workers and API server run in the same Node process, so this works without Redis pub/sub.
export const jobEvents = new EventEmitter();
jobEvents.setMaxListeners(100);
