import type { Detail, Settings } from '../../shared/types';
import { CourseList } from './CourseList';
import { invoke } from './ipc';
import { ListeningBuddy } from './ListeningBuddy';
import { ThemeIcon } from './ThemeIcon';
import type { SetAppModal, SetLectureTab } from './app-state';
import type { CourseWorkspace } from './useCourseWorkspace';
import type { TaskRunner } from './useTaskRunner';
import type { ChatStream } from './useChatStream';

export function CourseSidebar({
  setModal,
  setTab,
  setSessionDraft,
  settings,
  setSettings,
  workspace,
  tasks,
  chat,
}: {
  setModal: SetAppModal;
  setTab: SetLectureTab;
  setSessionDraft: React.Dispatch<
    React.SetStateAction<{ detail: Detail; lectureId: string } | null>
  >;
  settings: Settings | null;
  setSettings: React.Dispatch<React.SetStateAction<Settings | null>>;
  workspace: CourseWorkspace;
  tasks: TaskRunner;
  chat: ChatStream;
}) {
  const {
    courses,
    courseId,
    sessions,
    sessionId,
    setSessions,
    selectedSessions,
    setSessionId,
    reloadCourse,
    setCourseId,
    setLectureId,
    lectureId,
    setCourses,
    setDetail,
    setLecture,
  } = workspace;
  const { busy, task, setError } = tasks;
  const { setInput, setChatText, setPendingChat, request } = chat;

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">
          <ListeningBuddy />
        </span>
        <div>
          <strong>梅酱的听课指南</strong>
          <small>把老师的原话留下来</small>
        </div>
      </div>
      <button className="new-course" onClick={() => setModal('course')}>
        ＋ 新建课程
      </button>
      <div className="sidebar-label">
        我的课程 <span>{courses.length}</span>
      </div>
      <CourseList
        courses={courses}
        selected={courseId}
        busy={busy}
        sessions={sessions}
        selectedSession={sessionId}
        removeSession={async (cid, sid) => {
          const ok = await task(async () => {
            const remaining = await invoke('session:delete', {
              courseId: cid,
              id: sid,
              confirmed: true,
            });
            setSessions((v) => [...v.filter((s) => s.course_id !== cid), ...remaining]);
            if (selectedSessions.current[cid] === sid)
              selectedSessions.current[cid] = remaining[0].id;
            if (cid === courseId) {
              if (sessionId === sid) {
                setSessionId(remaining[0].id);
                setInput('');
                setChatText('');
                setPendingChat('');
                request.current = '';
              }
              await reloadCourse(cid);
            }
          });
          if (!ok) throw new Error('会话未删除，请查看错误提示');
        }}
        selectSession={(cid, sid) => {
          selectedSessions.current[cid] = sid;
          setCourseId(cid);
          setSessionId(sid);
          if (cid === courseId) {
            const linked = sessions.find((s) => s.id === sid)?.lecture_id;
            if (linked) setLectureId(linked);
          }
          setTab('chat');
          setInput('');
        }}
        newSession={(cid) =>
          void invoke('course:detail', { id: cid })
            .then((d) => {
              const linked =
                cid === courseId ? sessions.find((s) => s.id === sessionId)?.lecture_id : undefined;
              setSessionDraft({
                detail: d,
                lectureId:
                  linked ||
                  (cid === courseId && d.lectures.some((l) => l.id === lectureId)
                    ? lectureId
                    : d.lectures[0]?.id) ||
                  '',
              });
            })
            .catch((e) => setError(String(e)))
        }
        select={setCourseId}
        remove={async (id) => {
          const ok = await task(async () => {
            await invoke('course:delete', { id, confirmed: true });
            const remaining = await invoke('courses');
            setCourses(remaining);
            setSessions((v) => v.filter((s) => s.course_id !== id));
            if (id === courseId) {
              setCourseId(remaining[0]?.id || '');
              setDetail(null);
              setLecture(null);
              setLectureId('');
              setTab('chat');
            }
          });
          if (!ok) throw new Error('课程未删除，请查看错误提示');
        }}
      />
      <div className="sidebar-bottom">
        <button
          onClick={() => {
            if (settings) {
              const next = {
                ...settings,
                theme: settings.theme === 'light' ? 'dark' : 'light',
              } as Settings;
              void task(async () => setSettings(await invoke('settings:save', { settings: next })));
            }
          }}
        >
          <ThemeIcon dark={settings?.theme === 'dark'} />
          {settings?.theme === 'dark' ? '切换浅色' : '切换深色'}
        </button>
      </div>
    </aside>
  );
}
