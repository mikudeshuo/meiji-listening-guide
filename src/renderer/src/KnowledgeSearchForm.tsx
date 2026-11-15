import type { KnowledgeSearch } from '../../shared/knowledge';
import { invoke } from './ipc';
import type { Answer } from './knowledge-types';

export function KnowledgeSearchForm({
  run,
  setAnswer,
  setReading,
  setSearch,
  query,
  ids,
  setQuery,
  busy,
}: {
  run: (fn: () => Promise<void>) => Promise<void>;
  setAnswer: React.Dispatch<React.SetStateAction<Answer | null>>;
  setReading: React.Dispatch<React.SetStateAction<{ title: string; text: string } | null>>;
  setSearch: React.Dispatch<React.SetStateAction<KnowledgeSearch | null>>;
  query: string;
  ids: string[] | undefined;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  busy: boolean;
}) {
  return (
    <form
      className="knowledge-search"
      onSubmit={(event) => {
        event.preventDefault();
        void run(async () => {
          setAnswer(null);
          setReading(null);
          setSearch(await invoke('knowledge:search', { query, ids }));
        });
      }}
    >
      <input
        aria-label="知识库检索词"
        placeholder="输入知识点，查找相关原文…"
        value={query}
        maxLength={2000}
        onChange={(event) => setQuery(event.target.value)}
      />
      <button disabled={busy || !query.trim()} className="primary">
        检索原文
      </button>
      <button
        type="button"
        disabled={busy || !query.trim()}
        onClick={() =>
          void run(async () => {
            setSearch(null);
            setReading(null);
            setAnswer(await invoke('knowledge:ask', { query, ids }));
          })
        }
      >
        根据资料回答
      </button>
    </form>
  );
}
