import type { LectureDetail, Profile } from '../../shared/types';
import { DshPlusIcon, DshChevronDownIcon, DshStopIcon, DshSendIcon } from './ChatIcons';
import { ChatWaitingReply } from './ChatMessage';
import { invoke } from './ipc';
import { ModelNavIcon } from './SidebarIcons';
import { StudyIcon } from './StudyIcon';
import { basename } from './UiParts';
import type { SetAppModal, SetLectureTab } from './app-state';
import type { ChatStream } from './useChatStream';
import type { CourseWorkspace } from './useCourseWorkspace';
import type { TaskRunner } from './useTaskRunner';

export function Composer({
  setTab,
  sourceDraft,
  setModal,
  setSourceDraft,
  menu,
  setMenu,
  lecture,
  generate,
  modal,
  modelBrand,
  activeProfile,
  chat,
  workspace,
  tasks,
}: {
  setTab: SetLectureTab;
  sourceDraft: string;
  setModal: SetAppModal;
  setSourceDraft: React.Dispatch<React.SetStateAction<string>>;
  menu: boolean;
  setMenu: React.Dispatch<React.SetStateAction<boolean>>;
  lecture: LectureDetail | null;
  generate: (
    action: 'subtitles:generate' | 'notes:generate' | 'practice:generate' | 'practice:prepare',
  ) => Promise<void>;
  modal: string | null;
  modelBrand: string;
  activeProfile: Profile | { model: string } | undefined;
  chat: ChatStream;
  workspace: CourseWorkspace;
  tasks: TaskRunner;
}) {
  const { pendingChat, chatText, input, request, setChatText, setPendingChat, setInput } = chat;
  const { sessionId, courseId, lectureId, reloadCourse } = workspace;
  const { task, busy } = tasks;

  return (
    <section className="agent-composer">
      {pendingChat && <ChatWaitingReply streaming={!!chatText} />}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!sessionId || !input.trim()) return;
          const id = courseId,
            lid = lectureId,
            sid = sessionId,
            content = input;
          setTab('chat');
          void task(async () => {
            request.current = crypto.randomUUID();
            setChatText('');
            setPendingChat(content);
            setInput('');
            try {
              await invoke('chat', {
                courseId: id,
                lectureId: lid || undefined,
                sessionId: sid,
                content,
                requestId: request.current,
              });
            } finally {
              try {
                await reloadCourse(id);
              } finally {
                setChatText('');
                setPendingChat('');
              }
            }
          });
        }}
      >
        {sourceDraft && (
          <div className="draft-attachment">
            <span>▤</span>
            <div>
              <strong>{basename(sourceDraft)}</strong>
              <input
                aria-label="拖入文件完整路径"
                readOnly
                value={sourceDraft}
                title={sourceDraft}
              />
            </div>
            <button type="button" disabled={busy} onClick={() => setModal('lecture')}>
              建立课次
            </button>
            <button type="button" aria-label="移除待导入文件" onClick={() => setSourceDraft('')}>
              ×
            </button>
          </div>
        )}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入消息，或拖入语音原文、PPT…"
          aria-label="追问内容"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (input.trim() && !busy) e.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <div className="composer-controls">
          <div className="attachment-menu-anchor">
            <button
              type="button"
              className="round-button"
              aria-label="附件与工具"
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              <DshPlusIcon size={20} />
            </button>
            {menu && (
              <div className="attachment-menu" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  disabled={busy}
                  onClick={() => {
                    setMenu(false);
                    setModal(lectureId ? 'transcript' : 'lecture');
                  }}
                >
                  <span>⌕</span>添加语音识别原文
                </button>
                <button
                  type="button"
                  role="menuitem"
                  disabled={busy}
                  onClick={() => {
                    setMenu(false);
                    setModal(lectureId ? 'courseware' : 'lecture');
                  }}
                >
                  <span>▤</span>添加 PPT/课件
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenu(false);
                    setModal('zhiyun');
                  }}
                >
                  <span aria-hidden="true">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M7 17H6a4 4 0 0 1-.5-8 6.5 6.5 0 0 1 12.4-1A4.5 4.5 0 0 1 18 17h-1M12 12v9m-3-3 3 3 3-3" />
                    </svg>
                  </span>
                  智云课堂 · 搜索与导出
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenu(false);
                    setModal('materials');
                  }}
                >
                  <span>▤</span>课前资料
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenu(false);
                    setTab('chat');
                  }}
                >
                  <span>☷</span>聊天记录
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenu(false);
                    void task(() => invoke('library:open'));
                  }}
                >
                  <span>▱</span>资料文件夹
                </button>
                <div className="menu-divider" />
                <button
                  type="button"
                  role="menuitem"
                  disabled={!lecture || busy}
                  onClick={() => {
                    setMenu(false);
                    setTab('subtitles');
                    void task(() => generate('subtitles:generate'));
                  }}
                >
                  <span>▶</span>校订完整字幕
                </button>
                <button
                  type="button"
                  role="menuitem"
                  disabled={!lecture?.segments.length || !!lecture?.correction || busy}
                  onClick={() => {
                    setMenu(false);
                    setTab('notes');
                    void task(() => generate('notes:generate'));
                  }}
                >
                  <span>✎</span>
                  <StudyIcon name="sparkle" />
                  提取重点笔记
                </button>
                <button
                  type="button"
                  role="menuitem"
                  disabled={!lecture?.segments.length || !!lecture?.correction || busy}
                  onClick={() => {
                    setMenu(false);
                    setTab('practice');
                    void task(() => generate('practice:generate'));
                  }}
                >
                  <span>▦</span>
                  <StudyIcon name="practice" />
                  生成课后练习
                </button>
                <div className="menu-divider" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenu(false);
                    setTab('activity');
                  }}
                >
                  <span>↗</span>任务轨迹
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            className="composer-model-trigger"
            aria-label="选择对话模型"
            aria-haspopup="dialog"
            aria-expanded={modal === 'modelPicker'}
            disabled={busy}
            onClick={() => setModal('modelPicker')}
          >
            <span className={`composer-brand ${modelBrand}`} aria-hidden="true">
              {modelBrand === 'custom' && <ModelNavIcon />}
            </span>
            <span className="composer-model-name">{activeProfile?.model || 'Codex · 自动'}</span>
            <DshChevronDownIcon />
          </button>
          {busy ? (
            <button
              type="button"
              className="send-round"
              aria-label="停止任务"
              onClick={() => void invoke('cancel')}
            >
              <DshStopIcon size={20} />
            </button>
          ) : (
            <button className="send-round" aria-label="发送消息" disabled={!input.trim()}>
              <DshSendIcon size={20} />
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
