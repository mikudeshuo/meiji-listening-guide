import { useRef, useState } from 'react';
import type { Progress } from '../../shared/types';
import { errorMessage } from '../../shared/errors';

/** One line of the activity log: a progress report and the clock time it arrived. */
export type Activity = Progress & { at: string };

/**
 * Runs one foreground operation at a time and holds what the user sees about it:
 * the busy flag, the error banner, the latest progress line and the activity log.
 */
export function useTaskRunner() {
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState<Progress | null>(null),
    [activities, setActivities] = useState<Activity[]>([]);
  const operation = useRef(false);

  /** Runs `fn` unless another operation is already running; resolves to whether it succeeded. */
  async function task(fn: () => Promise<unknown>) {
    if (operation.current) return false;
    operation.current = true;
    setBusy(true);
    setError('');
    setProgress(null);
    try {
      await fn();
      setActivities((a) => [
        ...a,
        { stage: '完成', message: '操作已完成', at: new Date().toLocaleTimeString() },
      ]);
      return true;
    } catch (e) {
      const message = errorMessage(e);
      setError(message);
      setActivities((a) => [
        ...a,
        { stage: '失败', message, error: true, at: new Date().toLocaleTimeString() },
      ]);
      return false;
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }

  return { error, setError, busy, progress, setProgress, activities, setActivities, task };
}

export type TaskRunner = ReturnType<typeof useTaskRunner>;
