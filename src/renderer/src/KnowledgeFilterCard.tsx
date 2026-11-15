import type { KnowledgeSearch, KnowledgeList, KnowledgeEntry } from '../../shared/knowledge';
import type { Answer } from './knowledge-types';

export function KnowledgeFilterCard({
  facets,
  setFacets,
  setSearch,
  setAnswer,
  data,
}: {
  facets: Record<string, string>;
  setFacets: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setSearch: React.Dispatch<React.SetStateAction<KnowledgeSearch | null>>;
  setAnswer: React.Dispatch<React.SetStateAction<Answer | null>>;
  data: KnowledgeList;
}) {
  return (
    <section className="knowledge-card">
      <h3>按内容筛选</h3>
      <div className="media-options">
        {[
          ['type', '类型'],
          ['topic', '主题'],
          ['difficulty', '难度'],
          ['duration', '时长'],
          ['language', '语言'],
        ].map(([key, label]) => (
          <label key={key}>
            {label}
            <select
              aria-label={`筛选${label}`}
              value={facets[key] || ''}
              onChange={(e) => {
                setFacets({ ...facets, [key]: e.target.value });
                setSearch(null);
                setAnswer(null);
              }}
            >
              <option value="">全部</option>
              {Array.from(
                new Set(
                  data.entries
                    .map(
                      (entry) =>
                        entry.classification?.[
                          key as keyof NonNullable<KnowledgeEntry['classification']>
                        ],
                    )
                    .filter((value): value is string => typeof value === 'string' && !!value),
                ),
              )
                .sort()
                .map((value) => (
                  <option key={value}>{value}</option>
                ))}
            </select>
          </label>
        ))}
      </div>
      <button
        onClick={() => {
          setFacets({});
          setSearch(null);
          setAnswer(null);
        }}
      >
        清除筛选
      </button>
    </section>
  );
}
