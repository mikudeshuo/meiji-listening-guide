import { useRef, useState } from 'react';

/**
 * The composer and the reply being streamed: the draft question, the question that was just
 * sent, the reply text received so far, and the id that ties stream events to this request.
 */
export function useChatStream() {
  const [input, setInput] = useState(''),
    [chatText, setChatText] = useState(''),
    [pendingChat, setPendingChat] = useState('');
  /** Id of the request whose stream events should be shown; '' when nothing is streaming. */
  const request = useRef('');
  /** Marker at the end of the thread, scrolled into view as the conversation grows. */
  const threadEnd = useRef<HTMLDivElement>(null);
  return {
    input,
    setInput,
    chatText,
    setChatText,
    pendingChat,
    setPendingChat,
    request,
    threadEnd,
  };
}

export type ChatStream = ReturnType<typeof useChatStream>;
