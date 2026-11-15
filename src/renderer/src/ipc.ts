import type { IpcAction, IpcResult } from '../../main/ipc/contract';

/**
 * Calls a main-process action through the preload bridge.
 *
 * The action name is checked against the handlers the main process actually defines, and the
 * result is typed as what that handler returns: `await invoke('courses')` is `Course[]`.
 *
 * A few handlers forward to a worker process and return `unknown`. For those, state the
 * expected shape explicitly — `invoke<Material[]>('knowledge:read', …)` — which is an
 * unchecked assertion, exactly as every call used to be.
 */
export function invoke<Asserted = never, Action extends IpcAction = IpcAction>(
  action: Action,
  args?: unknown,
): Promise<[Asserted] extends [never] ? IpcResult<Action> : Asserted> {
  return window.assistant.invoke(action, args);
}
