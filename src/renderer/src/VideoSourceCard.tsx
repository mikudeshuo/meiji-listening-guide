import type { VideoSeries, VideoBatchItem, VideoSource, VideoReview } from '../../shared/video-ppt';
import { invoke } from './ipc';
import type { BiliSubtitle } from './video-ppt-shared';

export function VideoSourceCard({
  url,
  busy,
  setUrl,
  setSeries,
  setSelected,
  setBatch,
  setSubtitle,
  setSubtitleSaved,
  isVideo,
  run,
  setSource,
  setReview,
  setSaved,
  prompt,
  courseId,
}: {
  url: string;
  busy: boolean;
  setUrl: React.Dispatch<React.SetStateAction<string>>;
  setSeries: React.Dispatch<React.SetStateAction<VideoSeries | null>>;
  setSelected: React.Dispatch<React.SetStateAction<number[]>>;
  setBatch: React.Dispatch<React.SetStateAction<VideoBatchItem[]>>;
  setSubtitle: React.Dispatch<React.SetStateAction<BiliSubtitle | null>>;
  setSubtitleSaved: React.Dispatch<React.SetStateAction<string>>;
  isVideo: boolean;
  run: (fn: () => Promise<void>) => Promise<void>;
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
  prompt: string;
  courseId: string;
}) {
  return (
    <div className="learning-source-card">
      <label>
        B 站视频网址
        <input
          aria-label="B 站视频网址"
          placeholder="https://www.bilibili.com/video/BV…/?p=5"
          value={url}
          disabled={busy}
          onChange={(e) => {
            setUrl(e.target.value);
            setSeries(null);
            setSelected([]);
            setBatch([]);
            setSubtitle(null);
            setSubtitleSaved('');
          }}
        />
      </label>
      {isVideo && (
        <div className="row">
          <button
            className="primary"
            disabled={busy || !url.trim()}
            onClick={() =>
              void run(async () => {
                setSource(null);
                setReview(null);
                setSaved(null);
                setSaved(
                  await invoke('video-ppt:auto', {
                    url,
                    prompt,
                    courseId: courseId || undefined,
                  }),
                );
              })
            }
          >
            仅生成当前分集 PDF
          </button>
          <button
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const path = await invoke('video-ppt:pick');
                if (path) {
                  setSource(null);
                  setReview(null);
                  setSaved(null);
                  setSaved(
                    await invoke('video-ppt:auto', {
                      path,
                      prompt,
                      courseId: courseId || undefined,
                    }),
                  );
                }
              })
            }
          >
            使用已下载的视频
          </button>
          {busy && <button onClick={() => void invoke('cancel')}>取消处理</button>}
        </div>
      )}
    </div>
  );
}
