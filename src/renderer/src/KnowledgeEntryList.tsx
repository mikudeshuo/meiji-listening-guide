import type { KnowledgeEntry, KnowledgeSearch } from '../../shared/knowledge';
import { invoke } from './ipc';
import type { Answer } from './knowledge-types';
import { KnowledgeIcon } from './KnowledgeIcon';

export function KnowledgeEntryList({
  entries,
  busy,
  run,
  setReading,
  setMoving,
  deleting,
  setDeleting,
  setSearch,
  setAnswer,
  refresh,
  setNotice,
}: {
  entries: KnowledgeEntry[];
  busy: boolean;
  run: (fn: () => Promise<void>) => Promise<void>;
  setReading: React.Dispatch<React.SetStateAction<{ title: string; text: string } | null>>;
  setMoving: React.Dispatch<React.SetStateAction<{ entry: KnowledgeEntry; target: string } | null>>;
  deleting: string;
  setDeleting: React.Dispatch<React.SetStateAction<string>>;
  setSearch: React.Dispatch<React.SetStateAction<KnowledgeSearch | null>>;
  setAnswer: React.Dispatch<React.SetStateAction<Answer | null>>;
  refresh: () => Promise<void>;
  setNotice: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <section>
      <h3>已导入资料 · {entries.length}</h3>
      {!entries.length && (
        <div className="knowledge-empty">
          <KnowledgeIcon />
          <p>导入课程资料后，就能在这里跨资料查找知识点。</p>
        </div>
      )}
      {entries.map((entry) => (
        <article className="knowledge-entry" key={entry.bvid}>
          <KnowledgeIcon />
          <div>
            <strong>{entry.title}</strong>
            <small>
              {entry.folder || '未分类'} · {entry.textLength} 字
              {entry.classification && (
                <span>
                  {' '}
                  · {entry.classification.type} · {entry.classification.topic} ·{' '}
                  {entry.classification.keywords.join('、')}
                </span>
              )}
              {entry.sourceMethod ? ` · ${entry.sourceMethod}` : ''}
            </small>
          </div>
          <button
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const result = await invoke<{ entry: { title: string }; text: string }>(
                  'knowledge:read',
                  { id: entry.bvid },
                );
                setReading({ title: result.entry.title, text: result.text });
              })
            }
          >
            查看原文
          </button>
          <button disabled={busy} onClick={() => setMoving({ entry, target: entry.folder || '' })}>
            移动分类
          </button>
          {deleting === entry.bvid ? (
            <>
              <span>仅删除知识库版本</span>
              <button
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await invoke('knowledge:delete', { id: entry.bvid });
                    setDeleting('');
                    setSearch(null);
                    setAnswer(null);
                    setReading(null);
                    await refresh();
                    setNotice('知识库版本已删除，原文件保留');
                  })
                }
              >
                确认删除
              </button>
              <button onClick={() => setDeleting('')}>取消</button>
            </>
          ) : (
            <button disabled={busy} onClick={() => setDeleting(entry.bvid)}>
              删除
            </button>
          )}
        </article>
      ))}
    </section>
  );
}
