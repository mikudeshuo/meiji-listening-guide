import type { MediaJob } from '../../shared/media';
import { invoke } from './ipc';
import { states, active } from './media-download-shared';

export function MediaJobList({
  jobs,
  busy,
  run,
}: {
  jobs: MediaJob[];
  busy: boolean;
  run: (fn: () => Promise<void>) => Promise<void>;
}) {
  return (
    <div className="media-jobs">
      {jobs.map((job) => (
        <article key={job.id}>
          <div>
            <strong>{job.title}</strong>
            <p>
              {states[job.state] || job.state}
              {job.progress.total
                ? ` · ${Math.min(100, Math.round(((job.progress.downloaded || 0) / job.progress.total) * 100))}%`
                : ''}
            </p>
            {job.error_message && (
              <p className="hint" role="alert">
                {job.error_message}
              </p>
            )}
            {job.warning && <p className="hint">{job.warning}</p>}
          </div>
          <div className="row">
            {active(job) ? (
              <button
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await invoke('media:cancel', { id: job.id });
                  })
                }
              >
                取消下载
              </button>
            ) : job.state === 'completed' ? (
              <button
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await invoke('media:open', { id: job.id });
                  })
                }
              >
                查看下载文件
              </button>
            ) : (
              <button
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await invoke('media:retry', { id: job.id });
                  })
                }
              >
                继续下载
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
