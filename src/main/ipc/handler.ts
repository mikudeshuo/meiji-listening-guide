/** The argument record of one request, after the dispatcher has checked that it is a plain object. */
export type RequestObject = Record<string, unknown>;

/** Maps each action name to the function that performs it for one request. */
export type ActionTable = Record<string, () => unknown>;

export interface IpcHandler<T extends ActionTable = ActionTable> {
  /** Builds the action table for one request. Building has no side effects; only calling an entry does work. */
  readonly build: (object: RequestObject) => T;
  /** The action names this handler answers, taken from the table's keys. */
  readonly actions: ReadonlySet<string>;
}

/**
 * Declares a group of actions. The table's keys and return types are what the renderer's
 * `invoke` is typed against (see contract.ts), so adding an entry here is all it takes to
 * expose a new, typed action.
 */
export function defineHandler<T extends ActionTable>(
  build: (object: RequestObject) => T,
): IpcHandler<T> {
  return { build, actions: new Set(Object.keys(build({}))) };
}

export async function dispatch(
  handlers: readonly IpcHandler[],
  action: string,
  object: RequestObject,
): Promise<unknown> {
  const handler = handlers.find((item) => item.actions.has(action));
  if (!handler) throw new Error('未知操作');
  return handler.build(object)[action]();
}
