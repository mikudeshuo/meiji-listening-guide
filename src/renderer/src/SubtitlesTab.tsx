import { time } from '../../shared/srt';
import type { LectureDetail } from '../../shared/types';
import { invoke } from './ipc';
import { StudyIcon } from './StudyIcon';
import type { TaskRunner } from './useTaskRunner';
import type { CourseWorkspace } from './useCourseWorkspace';

export function SubtitlesTab({
  lecture,
  generate,
  setSrtEdit,
  srtEdit,
  exportResult,
  search,
  setSearch,
  jump,
  tasks,
  workspace,
}: {
  lecture: LectureDetail;
  generate: (
    action: 'subtitles:generate' | 'notes:generate' | 'practice:generate' | 'practice:prepare',
  ) => Promise<void>;
  setSrtEdit: React.Dispatch<React.SetStateAction<string | null>>;
  srtEdit: string | null;
  exportResult: (kind: string, format: string) => undefined;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  jump: (timestamp: string | number) => void;
  tasks: TaskRunner;
  workspace: CourseWorkspace;
}) {
  const { busy, task } = tasks;
  const { lectureId, reloadLecture } = workspace;

  return (
    <>
      <div className="toolbar">
        <button
          className="primary"
          disabled={busy || !lecture.lecture.transcript_path || !lecture.lecture.ppt_path}
          onClick={() => void task(() => generate('subtitles:generate'))}
        >
          <StudyIcon name="sparkle" />
          {lecture.correction
            ? '继续校订字幕'
            : lecture.segments.length
              ? '重新校订字幕'
              : '原文 + PPT 校订字幕'}
        </button>
        <button
          disabled={busy}
          onClick={() =>
            void task(async () => {
              await invoke('subtitles:import', { id: lectureId });
              await reloadLecture();
            })
          }
        >
          <StudyIcon name="upload" />
          导入 SRT
        </button>
        {lecture.segments.length > 0 && (
          <>
            <button
              disabled={busy || !!lecture.correction}
              onClick={() => setSrtEdit(srtEdit === null ? lecture.srt : null)}
            >
              <StudyIcon name="edit" />
              {srtEdit === null ? '编辑字幕' : '退出编辑'}
            </button>
            <button onClick={() => exportResult('subtitles', 'srt')}>
              <StudyIcon name="download" />
              SRT
            </button>
            <button onClick={() => exportResult('subtitles', 'txt')}>
              <StudyIcon name="download" />
              TXT
            </button>
          </>
        )}
      </div>
      {lecture.correction && (
        <p className="hint">
          已保存 {lecture.correction.completed}/{lecture.correction.total}{' '}
          条，以下为已完成部分；点击继续校订可恢复剩余内容。
        </p>
      )}
      {srtEdit !== null ? (
        <>
          <p className="hint">保存修改后，旧笔记与练习会清空，需重新生成。</p>
          <textarea
            className="srt-editor"
            value={srtEdit}
            onChange={(e) => setSrtEdit(e.target.value)}
          />
          <button
            className="primary"
            disabled={busy}
            onClick={() =>
              void task(async () => {
                await invoke('subtitles:save', {
                  id: lectureId,
                  srt: srtEdit,
                });
                await reloadLecture();
                setSrtEdit(null);
              })
            }
          >
            校验并保存字幕
          </button>
        </>
      ) : lecture.segments.length ? (
        <>
          <input
            className="search"
            placeholder="搜索老师的原话…"
            aria-label="搜索字幕"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="transcript">
            {lecture.segments
              .filter((s) => s.text.includes(search))
              .map((s, i) => (
                <div className="subtitle" data-stamp={s.start} key={i}>
                  <button className="timestamp" onClick={() => jump(s.start)}>
                    <StudyIcon name="clock" />
                    {time(s.start, false)}
                  </button>
                  <div>
                    <p>{s.text}</p>
                    {s.uncertain && <small className="warning">待核对：{s.reason}</small>}
                    {s.originalText && s.originalText !== s.text && (
                      <details>
                        <summary>对照识别原文</summary>
                        <p>{s.originalText}</p>
                        <small>{s.reason}</small>
                      </details>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </>
      ) : (
        <div className="empty">
          <h3>完整记录，不做摘要</h3>
          <p>
            先添加语音识别原文和 PPT，
            <br />
            再交给 Codex 识别与校订。原文保留，疑点明确标注。
          </p>
        </div>
      )}
    </>
  );
}
