/** Calls a main-process action through the preload bridge. */
export const invoke = <T>(action: string, args?: unknown) =>
  window.assistant.invoke<T>(action, args);
