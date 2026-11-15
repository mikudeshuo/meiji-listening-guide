import type { LectureDetail } from '../../shared/types';
import { Notes } from './CoursePanels';
import { invoke } from './ipc';

export function NotesTab({
  busy,
  lecture,
  task,
  generate,
  exportResult,
  jump,
  lectureId,
  reloadLecture,
}: {
  busy: boolean;
  lecture: LectureDetail;
  task: (fn: () => Promise<unknown>) => Promise<boolean>;
  generate: (
    action: 'subtitles:generate' | 'notes:generate' | 'practice:generate' | 'practice:prepare',
  ) => Promise<void>;
  exportResult: (kind: string, format: string) => undefined;
  jump: (timestamp: string | number) => void;
  lectureId: string;
  reloadLecture: (id?: string) => Promise<LectureDetail>;
}) {
  return (
    <>
      <div className="toolbar">
        <button
          className="primary"
          disabled={busy || !lecture.segments.length || !!lecture.correction}
          onClick={() => void task(() => generate('notes:generate'))}
        >
          {lecture.notes ? '重新提取重点' : '生成听课重点笔记'}
        </button>
        {lecture.notes && (
          <>
            <button onClick={() => exportResult('notes', 'md')}>Markdown</button>
            <button onClick={() => exportResult('notes', 'docx')}>Word</button>
          </>
        )}
      </div>
      {lecture.notes ? (
        <Notes
          notes={lecture.notes}
          jump={jump}
          disabled={busy}
          save={(notes) =>
            task(async () => {
              await invoke('notes:save', { id: lectureId, notes });
              await reloadLecture();
            })
          }
        />
      ) : (
        <div className="empty">
          <h3>有证据，才算重点</h3>
          <p>字幕完成后，提取“要考”“很重要”“要求掌握”等明确表态。</p>
        </div>
      )}
    </>
  );
}
