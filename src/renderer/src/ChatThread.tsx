import type { Detail, LectureDetail } from '../../shared/types';
import { ChatMessage } from './ChatMessage';
import { Markdown } from './UiParts';
import type { SetAppModal } from './app-state';
import type { ChatStream } from './useChatStream';

export function ChatThread({
  detail,
  sessionId,
  lecture,
  setModal,
  setSourceDraft,
  chat,
}: {
  detail: Detail | null;
  sessionId: string;
  lecture: LectureDetail | null;
  setModal: SetAppModal;
  setSourceDraft: React.Dispatch<React.SetStateAction<string>>;
  chat: ChatStream;
}) {
  const { pendingChat, chatText, setInput, threadEnd } = chat;

  return (
    <div className="agent-thread">
      {!detail?.messages.filter((m) => m.session_id === sessionId).length &&
        !pendingChat &&
        !chatText && (
          <div className="agent-empty">
            <h2>{lecture ? '这一讲，想从哪里开始？' : '今天要听哪一门课？'}</h2>
            <p>拖入语音识别原文和 PPT，或直接向听课助手提问。</p>
            <div className="suggestions">
              <button
                onClick={() => {
                  setInput('本节课老师明确强调了哪些重点？');
                }}
              >
                提取教师重点
              </button>
              <button onClick={() => setModal('materials')}>整理课前资料</button>
              <button
                onClick={() => {
                  setSourceDraft('');
                  setModal('lecture');
                }}
              >
                添加语音识别原文
              </button>
            </div>
          </div>
        )}
      {detail?.messages
        .filter((m) => m.session_id === sessionId)
        .map((m) => (
          <ChatMessage key={m.id} role={m.role} content={m.content}>
            <Markdown text={m.content} />
          </ChatMessage>
        ))}
      {pendingChat && (
        <ChatMessage role="user" content={pendingChat} pending>
          <Markdown text={pendingChat} />
        </ChatMessage>
      )}
      {chatText && (
        <ChatMessage role="assistant" content={chatText} pending>
          <Markdown text={chatText} />
        </ChatMessage>
      )}
      <div ref={threadEnd} />
    </div>
  );
}
