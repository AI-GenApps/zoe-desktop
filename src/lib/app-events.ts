type AppEventMap = {
  "break:started": void;
  "break:ended": void;
  "pause:started": void;
  "pause:ended": void;
  mentionsUpdated: void;
};

type Handler<T> = T extends void ? () => void : (payload: T) => void;

type Listeners = {
  [K in keyof AppEventMap]: Set<Handler<AppEventMap[K]>>;
};

const listeners: Listeners = {
  "break:started": new Set(),
  "break:ended": new Set(),
  "pause:started": new Set(),
  "pause:ended": new Set(),
  mentionsUpdated: new Set()
};

function on<K extends keyof AppEventMap>(event: K, handler: Handler<AppEventMap[K]>): () => void {
  (listeners[event] as Set<Handler<AppEventMap[K]>>).add(handler);
  return () => (listeners[event] as Set<Handler<AppEventMap[K]>>).delete(handler);
}

function emit<K extends keyof AppEventMap>(event: K): void {
  (listeners[event] as Set<() => void>).forEach((h) => h());
}

export const appEvents = { on, emit };
