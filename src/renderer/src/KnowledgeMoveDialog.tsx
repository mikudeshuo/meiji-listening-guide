import type { KnowledgeEntry } from '../../shared/knowledge';

export function KnowledgeMoveDialog({
  moving,
  setMoving,
  busy,
  run,
  organize,
}: {
  moving: { entry: KnowledgeEntry; target: string };
  setMoving: React.Dispatch<React.SetStateAction<{ entry: KnowledgeEntry; target: string } | null>>;
  busy: boolean;
  run: (fn: () => Promise<void>) => Promise<void>;
  organize: (selected: KnowledgeEntry[], target: string, wholeCategory?: boolean) => Promise<void>;
}) {
  return (
    <section className="knowledge-card" aria-label="移动资料分类">
      <h3>移动 · {moving.entry.title}</h3>
      <div className="row">
        <label>
          目标分类
          <input
            aria-label="目标分类"
            list="knowledge-categories"
            maxLength={100}
            placeholder="留空移到未分类"
            value={moving.target}
            onChange={(event) => setMoving({ ...moving, target: event.target.value })}
          />
        </label>
        <button
          disabled={busy}
          onClick={() => void run(() => organize([moving.entry], moving.target))}
        >
          保存分类
        </button>
        <button disabled={busy} onClick={() => setMoving(null)}>
          取消移动
        </button>
      </div>
      <p className="hint">可以选择已有分类或输入新的名称；留空归入未分类。</p>
    </section>
  );
}
