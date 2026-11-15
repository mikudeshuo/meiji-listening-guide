import type { KnowledgeSearch } from '../../shared/knowledge';
import { invoke } from './ipc';
import type { VectorState, Answer } from './knowledge-types';

export function KnowledgeVectorCard({
  vector,
  busy,
  run,
  setVector,
  setNotice,
  setSearch,
  setAnswer,
}: {
  vector: VectorState | null;
  busy: boolean;
  run: (fn: () => Promise<void>) => Promise<void>;
  setVector: React.Dispatch<React.SetStateAction<VectorState | null>>;
  setNotice: React.Dispatch<React.SetStateAction<string>>;
  setSearch: React.Dispatch<React.SetStateAction<KnowledgeSearch | null>>;
  setAnswer: React.Dispatch<React.SetStateAction<Answer | null>>;
}) {
  return (
    <section className="knowledge-card">
      <header>
        <div>
          <h3>本地语义检索</h3>
          <p className="hint">
            {!vector
              ? '正在检查本地模型…'
              : vector.index === 'ready'
                ? `模型已启用，已建立 ${vector.vector_count} 个向量片段。`
                : vector.active
                  ? '模型已启用；导入或更新资料后，请建立语义索引。'
                  : vector.bundled
                    ? '已附带中文模型，启用后可以建立语义索引。'
                    : '本地模型文件不可用，仍可使用关键词检索。'}
          </p>
        </div>
        <div className="row">
          {!vector?.active && (
            <button
              disabled={busy || !vector?.bundled}
              onClick={() =>
                void run(async () => {
                  setVector(await invoke<VectorState>('knowledge:vector-enable'));
                  setNotice('中文模型已启用，请建立语义索引');
                })
              }
            >
              启用中文模型
            </button>
          )}
          <button
            disabled={busy || !vector?.active}
            onClick={() =>
              void run(async () => {
                const result = await invoke<{ status: VectorState }>('knowledge:vector-rebuild');
                setVector(result.status);
                setSearch(null);
                setAnswer(null);
                setNotice('语义索引已建立');
              })
            }
          >
            建立语义索引
          </button>
        </div>
      </header>
      <p className="hint">模型在本机运行。建索引可能需要数分钟；未建好时检索继续使用关键词。</p>
    </section>
  );
}
