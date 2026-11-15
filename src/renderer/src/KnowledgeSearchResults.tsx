import type { KnowledgeSearch } from '../../shared/knowledge';

export function KnowledgeSearchResults({
  search,
  busy,
  readCitation,
}: {
  search: KnowledgeSearch;
  busy: boolean;
  readCitation: (id: string) => Promise<void>;
}) {
  return (
    <section>
      <h3>相关原文 · {search.hits.length}</h3>
      <p className="hint">
        {search.trace.vector?.note || '本次使用关键词检索。'}
        {!search.hits.length && '未命中不代表资料没有相关内容，可以换关键词。'}
      </p>
      {search.hits.map((hit) => (
        <article className="knowledge-card" key={hit.evidence_id}>
          <header>
            <strong>{hit.title}</strong>
            <button disabled={busy} onClick={() => void readCitation(hit.evidence_id)}>
              核验引用来源
            </button>
          </header>
          <p className="knowledge-text">{hit.content}</p>
          <small>原文片段 {hit.chunkIndex + 1}</small>
        </article>
      ))}
    </section>
  );
}
