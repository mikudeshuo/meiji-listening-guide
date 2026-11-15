import type { PendingVideoTask, VideoSource, VideoReview } from '../../shared/video-ppt';
import { invoke } from './ipc';
import type { LearningView } from './LearningNav';
import type { BiliSubtitle } from './video-ppt-shared';

export function PendingVideoTasks({
  pending,
  busy,
  run,
  setSubtitle,
  setSubtitleSaved,
  setProgress,
  select,
  setSource,
  setReview,
  setSaved,
  setChecked,
}: {
  pending: PendingVideoTask[];
  busy: boolean;
  run: (fn: () => Promise<void>) => Promise<void>;
  setSubtitle: React.Dispatch<React.SetStateAction<BiliSubtitle | null>>;
  setSubtitleSaved: React.Dispatch<React.SetStateAction<string>>;
  setProgress: React.Dispatch<React.SetStateAction<string>>;
  select: (view: LearningView) => void;
  setSource: React.Dispatch<React.SetStateAction<VideoSource | null>>;
  setReview: React.Dispatch<React.SetStateAction<VideoReview | null>>;
  setSaved: React.Dispatch<
    React.SetStateAction<{
      path: string;
      kept: number;
      removed: number;
      cleaned: boolean;
      cleanupWarning: string;
    } | null>
  >;
  setChecked: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <section className="ppt-export-history">
      <h3>未完成的任务</h3>
      {pending.map((t) => (
        <article key={t.id}>
          <div>
            <strong>{t.name}</strong>
            {t.kind === 'subtitle' && (
              <p className="hint">
                {t.savedPath ? '字幕已保存，待核对并清理临时视频' : '字幕转写可继续'}
              </p>
            )}
            {t.error && (
              <p className="hint" role="alert">
                {t.error}
              </p>
            )}
          </div>
          <button
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await invoke('video-ppt:reveal', { id: t.id });
              })
            }
          >
            查看保留文件
          </button>
          {t.kind === 'subtitle' ? (
            <button
              disabled={busy || !!t.error}
              onClick={() =>
                void run(async () => {
                  const result = await invoke('video-ppt:resume-subtitle', {
                    id: t.id,
                  });
                  setSubtitle(result);
                  setSubtitleSaved(result.savedPath || '');
                  setProgress('字幕任务已完成，临时视频已清理');
                  select('videoSubtitles');
                })
              }
            >
              {t.savedPath ? '核对字幕并清理' : '继续字幕转写'}
            </button>
          ) : (
            <button
              disabled={busy || !!t.error}
              onClick={() =>
                void run(async () => {
                  const restored = await invoke('video-ppt:restore', { id: t.id });
                  setSource(restored.source);
                  setReview(restored.review);
                  setSaved(null);
                  setChecked(false);
                  setProgress('已恢复任务，原视频和候选页仍在');
                  select('videoPpt');
                })
              }
            >
              继续检查
            </button>
          )}
        </article>
      ))}
    </section>
  );
}
