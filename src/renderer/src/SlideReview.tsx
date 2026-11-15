import type { VideoReview } from '../../shared/video-ppt';
import { invoke } from './ipc';
import { time } from './video-ppt-shared';

export function SlideReview({
  kept,
  review,
  checked,
  busy,
  setChecked,
  run,
  setSaved,
  courseId,
  refresh,
  setProgress,
  setReview,
}: {
  kept: number;
  review: VideoReview;
  checked: boolean;
  busy: boolean;
  setChecked: React.Dispatch<React.SetStateAction<boolean>>;
  run: (fn: () => Promise<void>) => Promise<void>;
  setSaved: React.Dispatch<
    React.SetStateAction<{
      path: string;
      kept: number;
      removed: number;
      cleaned: boolean;
      cleanupWarning: string;
    } | null>
  >;
  courseId: string;
  refresh: () => Promise<void>;
  setProgress: React.Dispatch<React.SetStateAction<string>>;
  setReview: React.Dispatch<React.SetStateAction<VideoReview | null>>;
}) {
  return (
    <>
      <div className="ppt-extract-summary">
        <strong>
          保留 {kept} 页 · 删除 {review.pages.length - kept} 页
        </strong>
        <label>
          <input
            type="checkbox"
            checked={checked}
            disabled={busy}
            onChange={(e) => setChecked(e.target.checked)}
          />
          已检查裁剪、重复和页面内容
        </label>
        <button
          className="primary"
          disabled={busy || !checked || !kept}
          onClick={() =>
            void run(async () => {
              setSaved(
                await invoke('video-ppt:export', {
                  id: review.id,
                  courseId: courseId || undefined,
                  checked,
                  pages: review.pages.map(({ page, keep, crop }) => ({ page, keep, crop })),
                }),
              );
              await refresh();
              setProgress('PDF 已保存并逐页检查');
            })
          }
        >
          保存 PDF 并清理临时文件
        </button>
        <button
          disabled={busy}
          onClick={() => {
            setReview(null);
            setChecked(false);
          }}
        >
          重新框选
        </button>
      </div>
      <div className="ppt-extract-grid">
        {review.pages.map((p) => {
          const c = p.crop,
            w = c.right - c.left,
            h = c.bottom - c.top;
          return (
            <article key={p.page} className={p.keep ? '' : 'removed'}>
              <label>
                <input
                  type="checkbox"
                  disabled={busy}
                  checked={p.keep}
                  onChange={(e) => {
                    setChecked(false);
                    setReview({
                      ...review,
                      pages: review.pages.map((q) =>
                        q.page === p.page ? { ...q, keep: e.target.checked } : q,
                      ),
                    });
                  }}
                />
                第 {p.page} 页 · {time(p.time)} · {p.keep ? '保留' : '删除'}
              </label>
              <div
                className="ppt-extract-preview"
                style={{ aspectRatio: (p.width * w) / (p.height * h) }}
              >
                <img
                  alt={`视频课件第 ${p.page} 页`}
                  src={p.preview}
                  style={{
                    width: 100 / w + '%',
                    height: 100 / h + '%',
                    left: (-100 * c.left) / w + '%',
                    top: (-100 * c.top) / h + '%',
                  }}
                />
              </div>
              <p>{p.reason}</p>
              <details>
                <summary>调整此页裁剪</summary>
                <div className="ppt-crop-inputs">
                  {(['left', 'right', 'top', 'bottom'] as const).map((key, i) => (
                    <label key={key}>
                      {['左', '右', '上', '下'][i]} %
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step=".1"
                        disabled={busy}
                        value={Number((c[key] * 100).toFixed(1))}
                        onChange={(e) => {
                          const crop = { ...c, [key]: Number(e.target.value) / 100 };
                          if (crop.right - crop.left >= 0.1 && crop.bottom - crop.top >= 0.1) {
                            setChecked(false);
                            setReview({
                              ...review,
                              pages: review.pages.map((q) =>
                                q.page === p.page ? { ...q, crop } : q,
                              ),
                            });
                          }
                        }}
                      />
                    </label>
                  ))}
                </div>
              </details>
            </article>
          );
        })}
      </div>
    </>
  );
}
