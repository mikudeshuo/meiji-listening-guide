/** Calls a main-process action through the preload bridge. */
export const invoke = <T>(action: string, args?: unknown) =>
  window.assistant.invoke<T>(action, args);

/** Calls an action of the tools backend (research, notes, learning records). */
export const toolsRequest = <T>(action: string, args: unknown = {}) =>
  invoke<T>('tools:request', { action, args });

/** Calls an action of the messaging backend, which is routed through the tools backend. */
export const imRequest = <T>(action: string, value: unknown = {}) =>
  invoke<T>('tools:request', { action: 'im', args: { action, value } });

/** A random 32-character hex id that lets the backend recognise a repeated request. */
export const operationId = () => crypto.randomUUID().replaceAll('-', '');
