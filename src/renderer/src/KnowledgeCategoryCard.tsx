import type { KnowledgeEntry } from '../../shared/knowledge';

export function KnowledgeCategoryCard({
  category,
  categoryTarget,
  setCategoryTarget,
  busy,
  entries,
  run,
  organize,
  categories,
}: {
  category: string;
  categoryTarget: string;
  setCategoryTarget: React.Dispatch<React.SetStateAction<string>>;
  busy: boolean;
  entries: KnowledgeEntry[];
  run: (fn: () => Promise<void>) => Promise<void>;
  organize: (selected: KnowledgeEntry[], target: string, wholeCategory?: boolean) => Promise<void>;
  categories: string[];
}) {
  return (
    <section className="knowledge-card">
      <h3>管理分类 · {category}</h3>
      <div className="row">
        <label>
          分类新名称
          <input
            aria-label="分类新名称"
            list="knowledge-categories"
            value={categoryTarget}
            maxLength={100}
            placeholder="输入新名称或选择现有分类"
            onChange={(event) => setCategoryTarget(event.target.value)}
          />
        </label>
        <button
          disabled={
            busy || !categoryTarget.trim() || categoryTarget.trim() === category || !entries.length
          }
          onClick={() => void run(() => organize(entries, categoryTarget, true))}
        >
          {categories.includes(categoryTarget.trim()) ? '合并分类' : '重命名分类'}
        </button>
      </div>
      <p className="hint">
        将本分类的 {entries.length} 份资料移到新名称；选择已有分类会合并资料，移空的分类自动消失。
      </p>
    </section>
  );
}
