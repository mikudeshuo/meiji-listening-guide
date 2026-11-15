import { KnowledgeBase } from './KnowledgeBase';
import { BiliResources } from './BiliResources';
import { VisualAnalysis } from './VisualAnalysis';
import './knowledge.css';
import { Study } from './Study';
import './study.css';
import { PptExtract } from './PptExtract';
import { VideoPpt } from './VideoPpt';
import { AppearanceEditor, Wallpaper, chatStyle } from './Appearance';
import {
  defaultAppearanceState,
  resolveAppearance,
  type AppearanceState,
} from '../../shared/appearance';
import { sortCoursesForNavigation } from '../../shared/course-groups';
import { IdentityContext, IdentityEditor } from './Identity';
import { defaultIdentity, type Identity } from '../../shared/identity';
import { StudyIcon } from './StudyIcon';
import { FileManager } from './FileManager';
import { LecturePicker } from './LecturePicker';
import { ZhiyunLogin } from './ZhiyunLogin';
import { ZhiyunImporter } from './ZhiyunImporter';
import { useEffect, useRef, useState } from 'react';
import type {
  ChatSession,
  Course,
  Detail,
  LectureDetail,
  Progress,
  Settings,
} from '../../shared/types';
import { milliseconds } from '../../shared/srt';
import { invoke } from './ipc';
import {
  NewCourse,
  NewLecture,
  AddTranscript,
  AddCourseware,
  Materials,
  SettingsPanel,
} from './CoursePanels';
import { errorMessage } from '../../shared/errors';
import { IconRail } from './IconRail';
import { CourseSidebar } from './CourseSidebar';
import { ChatThread } from './ChatThread';
import { SubtitlesTab } from './SubtitlesTab';
import { NotesTab } from './NotesTab';
import { PracticeTab } from './PracticeTab';
import { Composer } from './Composer';
import { SessionDraftDialog } from './SessionDraftDialog';
import type { AppModal, LectureTab } from './app-state';
export default function App() {
  const [sessionDraft, setSessionDraft] = useState<{
    detail: Detail;
    lectureId: string;
  } | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]),
    [sessionId, setSessionId] = useState('');
  const selectedSessions = useRef<Record<string, string>>({});
  const [appearance, setAppearance] = useState<AppearanceState>(defaultAppearanceState);
  const [identity, setIdentity] = useState<Identity>(defaultIdentity);
  const [courses, setCourses] = useState<Course[]>([]),
    [courseId, setCourseId] = useState(''),
    [detail, setDetail] = useState<Detail | null>(null);
  const [lectureId, setLectureId] = useState(''),
    [lecture, setLecture] = useState<LectureDetail | null>(null),
    [tab, setTab] = useState<LectureTab>('chat');
  const [settings, setSettings] = useState<Settings | null>(null),
    [modal, setModal] = useState<AppModal | null>(null);
  const [resourceUrl, setResourceUrl] = useState<string | undefined>();
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState<Progress | null>(null);
  const [search, setSearch] = useState(''),
    [srtEdit, setSrtEdit] = useState<string | null>(null),
    [input, setInput] = useState(''),
    [chatText, setChatText] = useState(''),
    [pendingChat, setPendingChat] = useState('');
  const [sourceDraft, setSourceDraft] = useState(''),
    [pptDraft, setPptDraft] = useState('');
  const [withSearch, setWithSearch] = useState(false),
    [settingsApi, setSettingsApi] = useState(true),
    [menu, setMenu] = useState(false),
    [activities, setActivities] = useState<
      Array<
        Progress & {
          at: string;
        }
      >
    >([]);
  const threadEnd = useRef<HTMLDivElement>(null),
    importedLecture = useRef(''),
    current = useRef({ courseId: '', lectureId: '', sessionId: '' }),
    request = useRef(''),
    operation = useRef(false);
  current.current = { courseId, lectureId, sessionId };
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
  async function task(fn: () => Promise<unknown>) {
    if (operation.current) return false;
    operation.current = true;
    setBusy(true);
    setError('');
    setProgress(null);
    try {
      await fn();
      setActivities((a) => [
        ...a,
        { stage: '完成', message: '操作已完成', at: new Date().toLocaleTimeString() },
      ]);
      return true;
    } catch (e) {
      const message = errorMessage(e);
      setError(message);
      setActivities((a) => [
        ...a,
        { stage: '失败', message, error: true, at: new Date().toLocaleTimeString() },
      ]);
      return false;
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    void invoke('appearance:get')
      .then(setAppearance)
      .catch((e) => setError(String(e)));
  }, []);
  useEffect(() => {
    void invoke('identity:get')
      .then(setIdentity)
      .catch((e) => setError(String(e)));
  }, []);
  useEffect(() => {
    void Promise.all([invoke('courses'), invoke('settings:get'), invoke('sessions')])
      .then(([c, s, cs]) => {
        setSessions(cs);
        setCourses(c);
        setSettings(s);
        const first = sortCoursesForNavigation(c)[0];
        if (first) setCourseId(first.id);
      })
      .catch((e) => setError(String(e)));
    return window.assistant.onEvent((e) => {
      if (
        e.kind === 'progress' &&
        e.data.stage === '片段完成' &&
        e.data.lectureId === current.current.lectureId
      )
        void reloadLecture(e.data.lectureId).catch(() => {});
      if (
        e.kind === 'progress' &&
        (!e.data.lectureId || e.data.lectureId === current.current.lectureId)
      ) {
        setProgress(e.data);
        setActivities((a) => [...a, { ...e.data, at: new Date().toLocaleTimeString() }]);
      }
      if (e.kind === 'chat' && e.requestId === request.current) setChatText((t) => t + e.text);
    });
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = settings?.theme || 'light';
  }, [settings?.theme]);
  useEffect(() => {
    setDetail(null);
    setSessionId('');
    setLecture(null);
    setLectureId('');
    setProgress(null);
    setSrtEdit(null);
    setChatText('');
    setPendingChat('');
    setActivities([]);
    setSourceDraft('');
    setMenu(false);
    request.current = '';
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
        .catch((e) => setError(String(e)));
  }, [courseId]);
  useEffect(() => {
    threadEnd.current?.scrollIntoView({ block: 'end' });
  }, [pendingChat, chatText, detail?.messages.length, tab]);
  useEffect(() => {
    setLecture(null);
    setSrtEdit(null);
    setProgress(null);
    if (lectureId) void reloadLecture(lectureId).catch((e) => setError(String(e)));
  }, [lectureId]);
  function jump(timestamp: string | number) {
    const stamp = typeof timestamp === 'number' ? timestamp : milliseconds(timestamp);
    setTab('subtitles');
    setSearch('');
    requestAnimationFrame(() => {
      const node = document.querySelector('[data-stamp="' + stamp + '"]');
      node?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }
  const activeProfile =
    settings?.connection === 'deepseek'
      ? settings.profiles.find((p) => p.id === settings.activeProfile)
      : settings?.codex
        ? { model: settings.codex.model }
        : undefined;
  const modelBrand = activeProfile?.model.toLowerCase().startsWith('deepseek')
    ? 'deepseek'
    : /^(gpt|o[134](?:-|$)|chatgpt)/i.test(activeProfile?.model || '')
      ? 'openai'
      : 'custom';
  const exportResult = (kind: string, format: string) =>
    void task(async () => {
      const path = await invoke('export', { id: lectureId, kind, format });
      setProgress({ stage: '已导出', message: path });
    });
  async function generate(
    action: 'subtitles:generate' | 'notes:generate' | 'practice:generate' | 'practice:prepare',
  ) {
    const id = lectureId;
    try {
      await invoke(action, { id, ...(action === 'practice:generate' ? { withSearch } : {}) });
    } finally {
      await reloadLecture(id);
      await reloadCourse();
    }
  }
  function dropped(e: React.DragEvent) {
    e.preventDefault();
    if (busy) return;
    const file = e.dataTransfer.files[0];
    if (file) {
      if (!courseId) {
        setError('请先新建课程，再拖入原文或 PPT');
        return;
      }
      const path = window.assistant.filePath(file);
      if (!path) {
        setError('未获取到本地路径，请从文件资源管理器拖入或使用文件选择');
        return;
      }
      if (/\.(pptx?|pdf)$/i.test(path)) {
        setSourceDraft('');
        setPptDraft(path);
        setModal(lectureId ? 'courseware' : 'lecture');
      } else if (/\.(docx|txt|md|srt)$/i.test(path)) {
        setSourceDraft(path);
        setPptDraft('');
        setModal(lectureId ? 'transcript' : 'lecture');
      } else {
        setError('请拖入 PPT、PPTX、PDF 课件，或 Word、TXT、Markdown、SRT 原文');
        return;
      }
      setTab('chat');
    }
  }
  const activeAppearance = resolveAppearance(appearance, courseId);
  return (
    <IdentityContext.Provider value={identity}>
      <div className="app" data-background={activeAppearance.background}>
        {modal === 'study' && (
          <Study courses={courses} close={() => setModal(null)} refresh={reloadCourse} />
        )}
        <VisualAnalysis visible={modal === 'visual'} close={() => setModal(null)} />
        <KnowledgeBase visible={modal === 'knowledge'} close={() => setModal(null)} />
        <BiliResources
          courseId={courseId}
          courseName={detail?.course.name}
          visible={modal === 'biliResources'}
          close={() => setModal(null)}
          useVideo={(url, kind) => {
            setResourceUrl(url);
            setModal(kind);
          }}
        />
        <VideoPpt
          visible={
            modal === 'videoPpt' ||
            modal === 'videoSubtitles' ||
            modal === 'videoNotes' ||
            modal === 'videoTasks'
          }
          view={
            modal === 'videoSubtitles' || modal === 'videoNotes' || modal === 'videoTasks'
              ? modal
              : 'videoPpt'
          }
          select={setModal}
          close={() => setModal(null)}
          courseId={courseId}
          courseName={detail?.course.name}
          files={() => setModal('files')}
          incomingUrl={resourceUrl}
          consumeUrl={() => setResourceUrl(undefined)}
        />
        <PptExtract
          visible={modal === 'pptExtract'}
          close={() => setModal(null)}
          courseId={courseId}
          courseName={detail?.course.name}
          files={() => setModal('files')}
        />
        {sessionDraft && (
          <SessionDraftDialog
            busy={busy}
            setSessionDraft={setSessionDraft}
            sessionDraft={sessionDraft}
            task={task}
            setSessions={setSessions}
            selectedSessions={selectedSessions}
            setCourseId={setCourseId}
            setSessionId={setSessionId}
            courseId={courseId}
            setLectureId={setLectureId}
            setTab={setTab}
            setInput={setInput}
          />
        )}
        {modal === 'zhiyunLogin' && (
          <ZhiyunLogin
            close={() => setModal('zhiyun')}
            exportResources={() => setModal('zhiyun')}
          />
        )}
        {
          <ZhiyunImporter
            visible={modal === 'zhiyun'}
            localCourseId={courseId}
            close={() => setModal(null)}
            login={() => setModal('zhiyunLogin')}
            imported={async (id, cid) => {
              setCourses(await invoke('courses'));
              if (cid === courseId) {
                await reloadCourse();
                setLectureId(id);
              } else {
                importedLecture.current = id;
                setCourseId(cid);
              }
              setTab('subtitles');
            }}
          />
        }
        {modal === 'modelPicker' && settings && (
          <SettingsPanel
            initial={settings}
            busy={busy}
            error={error}
            close={() => setModal(null)}
            save={async (value) => {
              let ok = false;
              await task(async () => {
                setSettings(await invoke('settings:save', { settings: value }));
                ok = true;
              });
              return ok;
            }}
            onZhiyunLogin={() => setModal('zhiyunLogin')}
            task={task}
            onApiVisible={setSettingsApi}
            rightWidth={0}
          />
        )}
        {busy && (
          <div className="busy-indicator">
            <span className="pulse">●</span>{' '}
            {progress ? `${progress.stage} · ${progress.message}` : '正在处理，请稍等'}{' '}
            <button onClick={() => void invoke('cancel')}>取消任务</button>
          </div>
        )}
        {modal === 'appearance' && (
          <AppearanceEditor
            initial={appearance}
            courseId={courseId}
            courses={courses}
            close={() => setModal(null)}
            saved={setAppearance}
          />
        )}
        {modal === 'identity' && (
          <IdentityEditor
            initial={identity}
            close={() => setModal(null)}
            save={async (value) => setIdentity(await invoke('identity:save', { identity: value }))}
          />
        )}
        <IconRail modal={modal} setModal={setModal} setSettingsApi={setSettingsApi} />
        <CourseSidebar
          setModal={setModal}
          courses={courses}
          courseId={courseId}
          busy={busy}
          sessions={sessions}
          sessionId={sessionId}
          task={task}
          setSessions={setSessions}
          selectedSessions={selectedSessions}
          setSessionId={setSessionId}
          setInput={setInput}
          setChatText={setChatText}
          setPendingChat={setPendingChat}
          request={request}
          reloadCourse={reloadCourse}
          setCourseId={setCourseId}
          setLectureId={setLectureId}
          setTab={setTab}
          setSessionDraft={setSessionDraft}
          lectureId={lectureId}
          setError={setError}
          setCourses={setCourses}
          setDetail={setDetail}
          setLecture={setLecture}
          settings={settings}
          setSettings={setSettings}
        />
        <main
          className={
            'workspace agent-workspace wallpaper-workspace ' + (tab === 'chat' ? 'chat-styled' : '')
          }
          style={chatStyle(activeAppearance)}
          data-names={activeAppearance.showNames}
          data-bubbles={activeAppearance.assistantBubble}
          onDragOver={(e) => e.preventDefault()}
          onDrop={dropped}
        >
          <Wallpaper value={activeAppearance} />
          <header className="workspace-header">
            <div className="agent-heading">
              <h1>{detail?.course.name || '梅酱的听课指南'}</h1>
            </div>
            <div className="row">
              <button
                className="header-icon"
                aria-label="课程资料"
                disabled={!courseId}
                onClick={() => setModal('materials')}
              >
                ▤
              </button>
            </div>
          </header>
          {error && (
            <div className="alert" role="alert">
              {error}
              <button onClick={() => setError('')}>×</button>
            </div>
          )}
          {!courseId ? (
            <div className="welcome">
              <div className="welcome-symbol">▤</div>
              <h2>从一门课程开始</h2>
              <p>
                导入资料和语音识别原文，保留完整字幕，
                <br />
                只提取老师亲口强调的重点。
              </p>
              <button className="primary" onClick={() => setModal('course')}>
                ＋ 新建课程
              </button>
              <div className="steps">
                <span>01 课前资料</span>
                <span>02 原文校订</span>
                <span>03 重点与练习</span>
              </div>
            </div>
          ) : (
            <>
              <LecturePicker
                lectures={detail?.lectures || []}
                value={lectureId}
                busy={busy}
                select={setLectureId}
                create={() => {
                  setSourceDraft('');
                  setModal('lecture');
                }}
                remove={async (id) => {
                  await invoke('lecture:delete', { id, confirmed: true });
                  const next = await reloadCourse();
                  if (id === lectureId) {
                    setLecture(null);
                    setLectureId(next.lectures[0]?.id || '');
                  }
                }}
              />
              <div className="tabs agent-tabs" role="tablist">
                {(
                  [
                    ['chat', '对话'],
                    ['activity', '任务轨迹'],
                    ['subtitles', '完整字幕'],
                    ['notes', '听课笔记'],
                    ['practice', '练习题'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={tab === id}
                    className={tab === id ? 'active' : ''}
                    onClick={() => {
                      setTab(id);
                      setMenu(false);
                    }}
                  >
                    {(id === 'subtitles' || id === 'notes' || id === 'practice') && (
                      <StudyIcon name={id} />
                    )}{' '}
                    {label}
                    {id === 'subtitles' && !!lecture?.segments.length && (
                      <span>{lecture.segments.length}</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="agent-scroll">
                {tab === 'chat' && (
                  <ChatThread
                    detail={detail}
                    sessionId={sessionId}
                    pendingChat={pendingChat}
                    chatText={chatText}
                    lecture={lecture}
                    setInput={setInput}
                    setModal={setModal}
                    setSourceDraft={setSourceDraft}
                    threadEnd={threadEnd}
                  />
                )}
                {tab === 'activity' && (
                  <div className="activity-list">
                    <h3>任务执行记录</h3>
                    {!activities.length && (
                      <div className="agent-empty">
                        <p>还没有任务记录。导入原文或生成笔记后，可在这里查看进度。</p>
                      </div>
                    )}
                    {activities.map((a, i) => (
                      <div className={`activity-item ${a.error ? 'warning' : ''}`} key={i}>
                        <span>●</span>
                        <div>
                          <strong>
                            {a.stage}
                            {a.part ? ` · ${a.part}/${a.total}` : ''}
                          </strong>
                          <p>{a.message}</p>
                        </div>
                        <time>{a.at}</time>
                      </div>
                    ))}
                  </div>
                )}
                {tab !== 'chat' &&
                  tab !== 'activity' &&
                  (!lecture ? (
                    <div className="empty">
                      <h2>添加这一讲的原文</h2>
                      <p>
                        将语音识别原文拖到这里，或点击“新建课次”。
                        <br />
                        课件可使用 PPTX、PDF、DOCX、TXT 或 Markdown。
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="lecture-source-card">
                        <h2>{lecture.lecture.title}</h2>
                        <button disabled={busy} onClick={() => setModal('transcript')}>
                          添加或替换原文
                        </button>
                        <button disabled={busy} onClick={() => setModal('courseware')}>
                          添加或替换课件
                        </button>
                        <details>
                          <summary>查看语音识别原文</summary>
                          <textarea
                            className="srt-editor"
                            readOnly
                            value={lecture.lecture.transcript_text}
                          />
                        </details>
                      </div>
                      {progress && (
                        <div className={`progress ${progress.error ? 'failed' : ''}`}>
                          <span className={busy ? 'pulse' : ''}>●</span>
                          <strong>{progress.stage}</strong>
                          <span>{progress.message}</span>
                          {progress.part && (
                            <small>
                              第 {progress.part}/{progress.total} 段
                            </small>
                          )}
                          {busy && <button onClick={() => void invoke('cancel')}>取消任务</button>}
                        </div>
                      )}
                      <div className="tab-content">
                        {tab === 'subtitles' && (
                          <SubtitlesTab
                            busy={busy}
                            lecture={lecture}
                            task={task}
                            generate={generate}
                            lectureId={lectureId}
                            reloadLecture={reloadLecture}
                            setSrtEdit={setSrtEdit}
                            srtEdit={srtEdit}
                            exportResult={exportResult}
                            search={search}
                            setSearch={setSearch}
                            jump={jump}
                          />
                        )}
                        {tab === 'notes' && (
                          <NotesTab
                            busy={busy}
                            lecture={lecture}
                            task={task}
                            generate={generate}
                            exportResult={exportResult}
                            jump={jump}
                            lectureId={lectureId}
                            reloadLecture={reloadLecture}
                          />
                        )}
                        {tab === 'practice' && (
                          <PracticeTab
                            busy={busy}
                            lecture={lecture}
                            task={task}
                            generate={generate}
                            exportResult={exportResult}
                            withSearch={withSearch}
                            setWithSearch={setWithSearch}
                            lectureId={lectureId}
                            reloadLecture={reloadLecture}
                          />
                        )}
                      </div>
                    </>
                  ))}
              </div>
              <Composer
                pendingChat={pendingChat}
                chatText={chatText}
                sessionId={sessionId}
                input={input}
                courseId={courseId}
                lectureId={lectureId}
                setTab={setTab}
                task={task}
                request={request}
                setChatText={setChatText}
                setPendingChat={setPendingChat}
                setInput={setInput}
                reloadCourse={reloadCourse}
                sourceDraft={sourceDraft}
                busy={busy}
                setModal={setModal}
                setSourceDraft={setSourceDraft}
                menu={menu}
                setMenu={setMenu}
                lecture={lecture}
                generate={generate}
                modal={modal}
                modelBrand={modelBrand}
                activeProfile={activeProfile}
              />
            </>
          )}
        </main>
        {modal === 'files' && (
          <FileManager
            initialCourse={detail?.course.name}
            busy={busy}
            close={() => setModal(null)}
            changed={async () => {
              setCourses(await invoke('courses'));
              if (courseId) await reloadCourse();
              if (lectureId) await reloadLecture();
            }}
          />
        )}
        {modal === 'course' && (
          <NewCourse
            close={() => setModal(null)}
            busy={busy}
            create={(name, senior, exams) =>
              task(async () => {
                const c = await invoke('course:create', { name });
                setCourses(await invoke('courses'));
                setCourseId(c.id);
                if (senior.length)
                  await invoke('files:add', {
                    courseId: c.id,
                    kind: 'senior_notes',
                    paths: senior,
                  });
                if (exams.length)
                  await invoke('files:add', { courseId: c.id, kind: 'past_exam', paths: exams });
                setModal(null);
                await reloadCourse(c.id);
              })
            }
          />
        )}
        {modal === 'lecture' && (
          <NewLecture
            courseId={courseId}
            draft={sourceDraft}
            pptDraft={pptDraft}
            close={() => {
              setPptDraft('');
              setModal(null);
            }}
            busy={busy}
            create={(title, transcriptPath, pptPath) =>
              task(async () => {
                const value = await invoke('lecture:create', {
                  courseId,
                  title,
                  transcriptPath,
                  pptPath,
                });
                await reloadCourse();
                setLectureId(value.id);
                setSourceDraft('');
                setPptDraft('');
                setTab('subtitles');
                setModal(null);
              })
            }
          />
        )}
        {modal === 'transcript' && (
          <AddTranscript
            courseId={courseId}
            draft={sourceDraft}
            close={() => setModal(null)}
            busy={busy}
            save={(path) =>
              task(async () => {
                await invoke('lecture:transcript', { id: lectureId, path });
                await reloadLecture();
                await reloadCourse();
                setSourceDraft('');
                setModal(null);
              })
            }
          />
        )}
        {modal === 'courseware' && (
          <AddCourseware
            courseId={courseId}
            draft={pptDraft}
            close={() => {
              setPptDraft('');
              setModal(null);
            }}
            busy={busy}
            save={(path) =>
              task(async () => {
                await invoke('lecture:courseware', { id: lectureId, path });
                await reloadLecture();
                setPptDraft('');
                setModal(null);
              })
            }
          />
        )}
        {modal === 'settings' && settings && (
          <SettingsPanel
            onZhiyunLogin={() => setModal('zhiyunLogin')}
            rightWidth={0}
            onApiVisible={setSettingsApi}
            initial={settings}
            error={error}
            close={() => setModal(null)}
            busy={busy}
            save={(value) =>
              task(async () => {
                const saved = await invoke('settings:save', { settings: value });
                setSettings(saved);
              })
            }
            task={task}
          />
        )}
        {modal === 'materials' && detail && (
          <Materials
            files={() => setModal('files')}
            detail={detail}
            busy={busy}
            close={() => setModal(null)}
            run={(fn) =>
              task(async () => {
                await fn();
                await reloadCourse();
              })
            }
          />
        )}
      </div>
    </IdentityContext.Provider>
  );
}
