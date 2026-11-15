import type { KnowledgeSearch } from '../../shared/knowledge';
import { invoke } from './ipc';
import type { Answer } from './knowledge-types';

export function KnowledgeImportCard({
  importCategory,
  setImportCategory,
  busy,
  run,
  refresh,
  setSearch,
  setAnswer,
  setNotice,
}: {
  importCategory: string;
  setImportCategory: React.Dispatch<React.SetStateAction<string>>;
  busy: boolean;
  run: (fn: () => Promise<void>) => Promise<void>;
  refresh: () => Promise<void>;
  setSearch: React.Dispatch<React.SetStateAction<KnowledgeSearch | null>>;
  setAnswer: React.Dispatch<React.SetStateAction<Answer | null>>;
  setNotice: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <section className="knowledge-card">
      <div className="row">
        <label>
          导入分类
          <input
            aria-label="导入分类"
            placeholder="例如：牙体牙髓病学"
            value={importCategory}
            maxLength={100}
            onChange={(event) => setImportCategory(event.target.value)}
          />
        </label>
        <button
          className="primary"
          disabled={busy}
          onClick={() =>
            void run(async () => {
              const results = await invoke<
                { name: string; ok: boolean; error?: string; result?: { unchanged: boolean } }[]
              >('knowledge:import', { category: importCategory.trim() });
              if (results.length) {
                await refresh();
                setSearch(null);
                setAnswer(null);
                setNotice(
                  results
                    .map((item) =>
                      item.ok
                        ? item.name + (item.result?.unchanged ? '：已有相同版本' : '：已导入')
                        : item.name + '：' + item.error,
                    )
                    .join('\n'),
                );
              }
            })
          }
        >
          导入资料
        </button>
        <button
          disabled={busy}
          onClick={() =>
            void run(async () => {
              await invoke('knowledge:rebuild');
              await refresh();
              setNotice('关键词索引已重建');
            })
          }
        >
          重建索引
        </button>
      </div>
      <p className="hint">
        支持有文字的 PDF、Word、TXT、Markdown 和
        SRT。原文件保留，知识库单独保存文字版本；更新资料请再次导入。图片型 PDF 需先识别文字。
      </p>
    </section>
  );
}
