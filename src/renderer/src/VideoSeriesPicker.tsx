import type { VideoSeries, VideoBatchItem, VideoSource, VideoReview } from '../../shared/video-ppt';
import { invoke } from './ipc';
import { time } from './video-ppt-shared';

export function VideoSeriesPicker({
  busy,
  url,
  run,
  setSeries,
  setSelected,
  setBatch,
  setFilter,
  setSubtitlePage,
  setProgress,
  series,
  filter,
  selected,
  batch,
  open,
  isVideo,
  setSaved,
  setSource,
  setReview,
  prompt,
  courseId,
}: {
  busy: boolean;
  url: string;
  run: (fn: () => Promise<void>) => Promise<void>;
  setSeries: React.Dispatch<React.SetStateAction<VideoSeries | null>>;
  setSelected: React.Dispatch<React.SetStateAction<number[]>>;
  setBatch: React.Dispatch<React.SetStateAction<VideoBatchItem[]>>;
  setFilter: React.Dispatch<React.SetStateAction<string>>;
  setSubtitlePage: React.Dispatch<React.SetStateAction<number>>;
  setProgress: React.Dispatch<React.SetStateAction<string>>;
  series: VideoSeries | null;
  filter: string;
  selected: number[];
  batch: VideoBatchItem[];
  open: (path: string, reveal?: boolean) => Promise<void>;
  isVideo: boolean;
  setSaved: React.Dispatch<
    React.SetStateAction<{
      path: string;
      kept: number;
      removed: number;
      cleaned: boolean;
      cleanupWarning: string;
    } | null>
  >;
  setSource: React.Dispatch<React.SetStateAction<VideoSource | null>>;
  setReview: React.Dispatch<React.SetStateAction<VideoReview | null>>;
  prompt: string;
  courseId: string;
}) {
  return (
    <section className="video-course-picker" aria-label="选择课程分集">
      <header>
        <div>
          <h3>选择课程</h3>
          <p className="hint">读取合集目录后勾选分集，只处理你选中的课程。</p>
        </div>
        <button
          className="primary"
          disabled={busy || !url.trim()}
          onClick={() =>
            void run(async () => {
              setSeries(null);
              setSelected([]);
              setBatch([]);
              setFilter('');
              const loaded = await invoke('video-ppt:series', { url });
              setSeries(loaded);
              const requested = Number(new URL(url).searchParams.get('p') || 1);
              setSubtitlePage(loaded.episodes.some((e) => e.page === requested) ? requested : 1);
              setProgress('课程列表已读取，请勾选需要的分集');
            })
          }
        >
          读取课程列表
        </button>
      </header>
      {series && (
        <>
          <strong>{series.title}</strong>
          <div className="video-course-toolbar">
            <input
              aria-label="搜索课程分集"
              placeholder="搜索课程名称"
              disabled={busy}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <span>
              已选 {selected.length} / {series.episodes.length}
            </span>
            <button
              disabled={busy}
              onClick={() =>
                setSelected(
                  series.episodes.filter((e) => e.title.includes(filter)).map((e) => e.page),
                )
              }
            >
              选择当前列表
            </button>
            <button disabled={busy} onClick={() => setSelected([])}>
              清空选择
            </button>
          </div>
          <div className="video-course-list">
            {series.episodes
              .filter((e) => e.title.includes(filter))
              .map((e) => {
                const item = batch.find((i) => i.page === e.page);
                return (
                  <label key={e.page} className={selected.includes(e.page) ? 'selected' : ''}>
                    <input
                      type="checkbox"
                      aria-label={`选择 P${e.page} ${e.title}`}
                      disabled={busy}
                      checked={selected.includes(e.page)}
                      onChange={(ev) =>
                        setSelected((s) =>
                          ev.target.checked ? [...s, e.page] : s.filter((p) => p !== e.page),
                        )
                      }
                    />
                    <span className="video-course-number">P{e.page}</span>
                    <span className="video-course-title">
                      {e.title}
                      {item?.error && <small role="alert">{item.error}</small>}
                    </span>
                    <span className="hint">{item?.status || time(e.duration)}</span>
                    {item?.path && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={(ev) => {
                          ev.preventDefault();
                          void open(item.path!);
                        }}
                      >
                        打开 PDF
                      </button>
                    )}
                  </label>
                );
              })}
          </div>
          {isVideo && (
            <div className="video-course-actions">
              <span className="hint">每个分集单独保存 PDF，完成后清理对应视频。</span>
              <button
                className="primary"
                disabled={busy || !selected.length}
                onClick={() =>
                  void run(async () => {
                    setSaved(null);
                    setSource(null);
                    setReview(null);
                    const result = await invoke('video-ppt:batch', {
                      url,
                      pages: selected,
                      prompt,
                      courseId: courseId || undefined,
                    });
                    setBatch(result);
                    setProgress(
                      `所选课程已处理：完成 ${result.filter((i) => i.status === '已完成').length}，失败 ${result.filter((i) => i.status === '失败').length}`,
                    );
                  })
                }
              >
                生成所选课件 PDF{selected.length ? `（${selected.length}）` : ''}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
