import type { Detail } from '../../shared/types';
import { invoke } from './ipc';
import { Modal } from './UiParts';
import type { SetLectureTab } from './app-state';
import type { TaskRunner } from './useTaskRunner';
import type { CourseWorkspace } from './useCourseWorkspace';

export function SessionDraftDialog({
  setSessionDraft,
  sessionDraft,
  setTab,
  setInput,
  tasks,
  workspace,
}: {
  setSessionDraft: React.Dispatch<
    React.SetStateAction<{ detail: Detail; lectureId: string } | null>
  >;
  sessionDraft: { detail: Detail; lectureId: string };
  setTab: SetLectureTab;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  tasks: TaskRunner;
  workspace: CourseWorkspace;
}) {
  const { busy, task } = tasks;
  const { setSessions, selectedSessions, setCourseId, setSessionId, courseId, setLectureId } =
    workspace;

  return (
    <Modal
      title="新建会话"
      close={() => {
        if (!busy) setSessionDraft(null);
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const draft = sessionDraft;
          void task(async () => {
            const cid = draft.detail.course.id,
              next = await invoke('session:create', {
                courseId: cid,
                lectureId: draft.lectureId || undefined,
              });
            setSessions((v) => [...v, next]);
            selectedSessions.current[cid] = next.id;
            setCourseId(cid);
            setSessionId(next.id);
            if (cid === courseId && next.lecture_id) setLectureId(next.lecture_id);
            setTab('chat');
            setInput('');
            setSessionDraft(null);
          });
        }}
      >
        <label>
          对应课次
          <select
            aria-label="新会话对应课次"
            value={sessionDraft.lectureId}
            disabled={busy || !sessionDraft.detail.lectures.length}
            onChange={(e) => setSessionDraft({ ...sessionDraft, lectureId: e.target.value })}
          >
            {sessionDraft.detail.lectures.length ? (
              sessionDraft.detail.lectures.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))
            ) : (
              <option value="">暂无课次</option>
            )}
          </select>
        </label>
        <button type="submit" className="primary" disabled={busy}>
          创建会话
        </button>
      </form>
    </Modal>
  );
}
