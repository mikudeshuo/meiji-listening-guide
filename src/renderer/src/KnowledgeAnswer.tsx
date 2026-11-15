import type { Answer } from './knowledge-types';

export function KnowledgeAnswer({
  answer,
  busy,
  readCitation,
}: {
  answer: Answer;
  busy: boolean;
  readCitation: (id: string) => Promise<void>;
}) {
  return (
    <section className="knowledge-card">
      <h3>资料回答</h3>
      {answer.answer.paragraphs.map((paragraph, index) => (
        <div key={index}>
          <p>{paragraph.text}</p>
          {paragraph.citations.map((citation, i) => (
            <button
              key={i}
              className="knowledge-citation"
              disabled={busy}
              onClick={() => void readCitation(citation.id)}
            >
              {answer.sources.find((source) => source.evidence_id === citation.id)?.title ||
                '原文来源'}{' '}
              · 查看引用
            </button>
          ))}
        </div>
      ))}
      {answer.answer.limitation && <p className="hint">{answer.answer.limitation}</p>}
    </section>
  );
}
