import type { VideoSeries } from '../../shared/video-ppt';
import { invoke } from './ipc';
import type { LearningView } from './LearningNav';
import type { BiliSubtitle } from './video-ppt-shared';

export function VideoSubtitlePanel({
  busy,
  run,
  courseId,
  setSubtitle,
  setSubtitleSaved,
  series,
  subtitlePage,
  setSubtitlePage,
  url,
  subtitle,
  setProgress,
  select,
  subtitleSaved,
}: {
  busy: boolean;
  run: (fn: () => Promise<void>) => Promise<void>;
  courseId: string;
  setSubtitle: React.Dispatch<React.SetStateAction<BiliSubtitle | null>>;
  setSubtitleSaved: React.Dispatch<React.SetStateAction<string>>;
  series: VideoSeries | null;
  subtitlePage: number;
  setSubtitlePage: React.Dispatch<React.SetStateAction<number>>;
  url: string;
  subtitle: BiliSubtitle | null;
  setProgress: React.Dispatch<React.SetStateAction<string>>;
  select: (view: LearningView) => void;
  subtitleSaved: string;
}) {
  return (
    <section className="video-course-picker" aria-label="B 站视频字幕">
      <header>
        <div>
          <h3>视频字幕</h3>
          <p className="hint">
            读取所选分集的站内字幕；没有字幕时可用离线模型转写。结果保存到当前课程的“语音原文”。
          </p>
        </div>
      </header>
      <div className="row">
        <button
          disabled={busy}
          onClick={() =>
            void run(async () => {
              const result = await invoke('video-ppt:subtitle-import', {
                courseId: courseId || undefined,
              });
              if (result) {
                setSubtitle(result);
                setSubtitleSaved(result.savedPath || '');
              }
            })
          }
        >
          载入已保存的 SRT
        </button>
        {series && (
          <label>
            选择分集
            <select
              aria-label="字幕分集"
              value={subtitlePage}
              disabled={busy}
              onChange={(e) => {
                setSubtitlePage(Number(e.target.value));
                setSubtitle(null);
                setSubtitleSaved('');
              }}
            >
              {series.episodes.map((e) => (
                <option key={e.page} value={e.page}>
                  P{e.page} · {e.title}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          className="primary"
          disabled={busy || !url.trim()}
          onClick={() =>
            void run(async () => {
              const target = series?.episodes.find((e) => e.page === subtitlePage)?.url || url;
              setSubtitleSaved('');
              setSubtitle(await invoke('video-ppt:subtitle', { url: target }));
            })
          }
        >
          读取字幕
        </button>
        <button
          disabled={busy || !url.trim()}
          onClick={() =>
            void run(async () => {
              const target = series?.episodes.find((e) => e.page === subtitlePage)?.url || url;
              const result = await invoke('video-ppt:subtitle-transcribe', {
                url: target,
                courseId: courseId || undefined,
              });
              setSubtitle(result);
              setSubtitleSaved(result.savedPath || '');
            })
          }
        >
          无站内字幕？离线转写并保存
        </button>
        <button
          disabled={busy}
          onClick={() =>
            void run(async () => {
              const result = await invoke('video-ppt:subtitle-transcribe-local', {
                courseId: courseId || undefined,
              });
              if (result) {
                setSubtitle(result);
                setSubtitleSaved(result.savedPath || '');
              }
            })
          }
        >
          选择本地视频转写
        </button>
      </div>
      {subtitle && (
        <>
          <p>
            {subtitle.title} · {subtitle.source} · {subtitle.count} 条
          </p>
          {subtitle.warning && (
            <p className="hint" role="alert">
              {subtitle.warning}
            </p>
          )}
          <details>
            <summary>预览完整字幕</summary>
            <textarea className="srt-editor" readOnly value={subtitle.srt} />
          </details>
          <button
            disabled={busy || !!subtitle.savedPath}
            onClick={() =>
              void run(async () => {
                const target = series?.episodes.find((e) => e.page === subtitlePage)?.url || url;
                setSubtitleSaved(
                  await invoke('video-ppt:subtitle-save', {
                    url: target,
                    title: subtitle.title,
                    srt: subtitle.srt,
                    courseId: courseId || undefined,
                  }),
                );
              })
            }
          >
            保存字幕 SRT
          </button>
          <div className="row">
            {(['txt', 'md', 'vtt'] as const).map((format) => (
              <button
                key={format}
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    const path = await invoke('video-ppt:subtitle-export', {
                      title: subtitle.title,
                      srt: subtitle.srt,
                      format,
                      courseId: courseId || undefined,
                    });
                    setProgress(`${format.toUpperCase()} 字幕已保存：${path}`);
                  })
                }
              >
                导出 {format.toUpperCase()}
              </button>
            ))}
            <button disabled={busy} onClick={() => select('videoNotes')}>
              整理课程笔记
            </button>
          </div>
          {subtitleSaved && <p role="status">已保存：{subtitleSaved}</p>}
        </>
      )}
    </section>
  );
}
