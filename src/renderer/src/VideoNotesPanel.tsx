import { Markdown } from './UiParts';
import type { VideoNoteMode, VideoNoteResult } from '../../shared/video-notes';
import { invoke } from './ipc';
import { VideoMindmap } from './VideoMindmap';
import type { BiliSubtitle } from './video-ppt-shared';

export function VideoNotesPanel({
  busy,
  run,
  courseId,
  setSubtitle,
  setSubtitleSaved,
  summaryMode,
  setSummaryMode,
  subtitle,
  setSummary,
  summary,
  open,
  setProgress,
}: {
  busy: boolean;
  run: (fn: () => Promise<void>) => Promise<void>;
  courseId: string;
  setSubtitle: React.Dispatch<React.SetStateAction<BiliSubtitle | null>>;
  setSubtitleSaved: React.Dispatch<React.SetStateAction<string>>;
  summaryMode: string;
  setSummaryMode: React.Dispatch<React.SetStateAction<VideoNoteMode>>;
  subtitle: BiliSubtitle | null;
  setSummary: React.Dispatch<React.SetStateAction<VideoNoteResult | null>>;
  summary: VideoNoteResult | null;
  open: (path: string, reveal?: boolean) => Promise<void>;
  setProgress: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <section className="video-course-picker" aria-label="视频课程摘要">
      <header>
        <div>
          <h3>视频课程摘要</h3>
          <p className="hint">使用已取得或载入的字幕整理笔记，附原话与时间点，并保存到当前课程。</p>
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
        <label>
          摘要形式
          <select
            aria-label="摘要形式"
            value={summaryMode}
            disabled={busy}
            onChange={(e) => setSummaryMode(e.target.value as VideoNoteMode)}
          >
            <option value="brief">简要摘要</option>
            <option value="detailed">详细摘要</option>
            <option value="keypoints">课程要点</option>
            <option value="mindmap">思维导图</option>
          </select>
        </label>
        <button
          className="primary"
          disabled={busy || !subtitle}
          onClick={() =>
            void run(async () => {
              setSummary(null);
              setSummary(
                await invoke('video-ppt:summary', {
                  mode: summaryMode,
                  srt: subtitle!.srt,
                  title: subtitle!.title,
                  courseId: courseId || undefined,
                }),
              );
            })
          }
        >
          根据字幕生成并保存
        </button>
      </div>
      {subtitle && (
        <p className="hint">
          当前字幕：{subtitle.title} · {subtitle.count} 条 · {subtitle.source}
        </p>
      )}
      {summary && (
        <>
          <p role="status">已保存课程笔记 · {summary.count} 项字幕引文已核实</p>
          <details className="learning-path">
            <summary>查看保存位置</summary>
            <input aria-label="笔记保存位置" readOnly value={summary.path} />
          </details>
          <div className="learning-summary">
            {summaryMode === 'mindmap' ? (
              <VideoMindmap title={subtitle?.title || '课程笔记'} points={summary.points} />
            ) : (
              <Markdown text={summary.markdown} />
            )}
          </div>
          <div className="row">
            <button disabled={busy} onClick={() => void open(summary.path)}>
              打开 Markdown
            </button>
            {(['docx', 'pdf', 'svg'] as const).map((format) => (
              <button
                key={format}
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    const path = await invoke('video-ppt:notes-export', {
                      path: summary.path,
                      format,
                    });
                    setProgress(`${format.toUpperCase()} 已保存：${path}`);
                    await invoke('library:reveal', { path });
                  })
                }
              >
                导出 {format.toUpperCase()}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
