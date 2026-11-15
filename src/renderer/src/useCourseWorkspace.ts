import { useEffect, useRef, useState } from 'react';
import type { ChatSession, Course, Detail, LectureDetail } from '../../shared/types';
import { invoke } from './ipc';

/**
 * What is open: the course list, the selected course with its sessions, and the selected
 * lecture. Selecting a course loads its detail and picks a session and lecture; selecting a
 * lecture loads its subtitles, notes and practice.
 *
 * `onCourseChange` / `onLectureChange` run at the moment the selection changes, before the new
 * data is requested, so the caller can clear state that belonged to the previous selection.
 */
export function useCourseWorkspace({
  onError,
  onCourseChange,
  onLectureChange,
}: {
  onError: (message: string) => void;
  onCourseChange: () => void;
  onLectureChange: () => void;
}) {
  const [sessions, setSessions] = useState<ChatSession[]>([]),
    [sessionId, setSessionId] = useState('');
  /** The session last chosen in each course, so returning to a course reopens it. */
  const selectedSessions = useRef<Record<string, string>>({});
  const [courses, setCourses] = useState<Course[]>([]),
    [courseId, setCourseId] = useState(''),
    [detail, setDetail] = useState<Detail | null>(null);
  const [lectureId, setLectureId] = useState(''),
    [lecture, setLecture] = useState<LectureDetail | null>(null);
  /** A lecture that was just imported and should be opened once its course has loaded. */
  const importedLecture = useRef('');
  /** The latest selection, readable from async callbacks that outlive the render they started in. */
  const current = useRef({ courseId: '', lectureId: '', sessionId: '' });
  current.current = { courseId, lectureId, sessionId };
  /** The caller's callbacks as of the latest render, for effects that must not re-run when they change. */
  const callbacks = useRef({ onError, onCourseChange, onLectureChange });
  callbacks.current = { onError, onCourseChange, onLectureChange };

  async function reloadCourse(id = courseId) {
    const result = await invoke('course:detail', { id });
    if (current.current.courseId === id) {
      setDetail(result);
      setSessions((v) => [...v.filter((s) => s.course_id !== id), ...result.sessions]);
    }
    return result;
  }
  async function reloadLecture(id = lectureId) {
    const result = await invoke('lecture:detail', { id });
    if (current.current.lectureId === id) setLecture(result);
    return result;
  }

  useEffect(() => {
    setDetail(null);
    setSessionId('');
    setLecture(null);
    setLectureId('');
    callbacks.current.onCourseChange();
    if (courseId)
      void invoke('course:detail', { id: courseId })
        .then((d) => {
          if (current.current.courseId === courseId) {
            setDetail(d);
            setSessions((v) => [...v.filter((s) => s.course_id !== courseId), ...d.sessions]);
            setSessionId(selectedSessions.current[courseId] || d.sessions[0]?.id || '');
            setLectureId(
              importedLecture.current ||
                d.sessions.find(
                  (s) => s.id === (selectedSessions.current[courseId] || d.sessions[0]?.id),
                )?.lecture_id ||
                d.lectures[0]?.id ||
                '',
            );
            importedLecture.current = '';
          }
        })
        .catch((e) => callbacks.current.onError(String(e)));
  }, [courseId]);
  useEffect(() => {
    setLecture(null);
    callbacks.current.onLectureChange();
    if (lectureId) void reloadLecture(lectureId).catch((e) => callbacks.current.onError(String(e)));
  }, [lectureId]);

  return {
    courses,
    setCourses,
    courseId,
    setCourseId,
    detail,
    setDetail,
    sessions,
    setSessions,
    sessionId,
    setSessionId,
    selectedSessions,
    lectureId,
    setLectureId,
    lecture,
    setLecture,
    importedLecture,
    current,
    reloadCourse,
    reloadLecture,
  };
}

export type CourseWorkspace = ReturnType<typeof useCourseWorkspace>;
