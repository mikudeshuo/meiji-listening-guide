import { useEffect, useRef, useState } from 'react';
import { KnowledgeClassification } from './KnowledgeClassification';
import type {
  KnowledgeEntry,
  KnowledgeList,
  KnowledgeHit,
  KnowledgeSearch,
} from '../../shared/knowledge';
import { invoke } from './ipc';
import { errorMessage } from '../../shared/errors';
import { KnowledgeImportCard } from './KnowledgeImportCard';
import { KnowledgeVectorCard } from './KnowledgeVectorCard';
import { KnowledgeCategoryCard } from './KnowledgeCategoryCard';
import { KnowledgeSearchForm } from './KnowledgeSearchForm';
import { KnowledgeSearchResults } from './KnowledgeSearchResults';
import { KnowledgeAnswer } from './KnowledgeAnswer';
import { KnowledgeFilterCard } from './KnowledgeFilterCard';
import { KnowledgeEntryList } from './KnowledgeEntryList';
import { KnowledgeMoveDialog } from './KnowledgeMoveDialog';
import type { Answer, VectorState } from './knowledge-types';
import { KnowledgeIcon } from './KnowledgeIcon';
export function KnowledgeBase({ visible, close }: { visible: boolean; close: () => void }) {
  const [data, setData] = useState<KnowledgeList>({
    entries: [],
    stats: { totalVideos: 0, totalChunks: 0 },
    retrieval: 'keyword',
  });
  const [category, setCategory] = useState(''),
    [importCategory, setImportCategory] = useState(''),
    [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const [search, setSearch] = useState<KnowledgeSearch | null>(null),
    [answer, setAnswer] = useState<Answer | null>(null);
  const [reading, setReading] = useState<{ title: string; text: string } | null>(null),
    [deleting, setDeleting] = useState('');
  const [vector, setVector] = useState<VectorState | null>(null);
  const [progressText, setProgressText] = useState('');
  const [categoryTarget, setCategoryTarget] = useState('');
  const [moving, setMoving] = useState<{ entry: KnowledgeEntry; target: string } | null>(null);
  const [facets, setFacets] = useState<Record<string, string>>({});
  const working = useRef(false);
  const entries = data.entries.filter(
    (entry) =>
      (!category || entry.folder === category) &&
      Object.entries(facets).every(
        ([key, value]) =>
          !value ||
          entry.classification?.[key as keyof NonNullable<KnowledgeEntry['classification']>] ===
            value,
      ),
  );
  const categories = Array.from(
    new Set(data.entries.map((entry) => entry.folder).filter(Boolean)),
  ).sort();
  async function refresh() {
    setData(await invoke('knowledge:list'));
    setVector(await invoke<VectorState>('knowledge:vector-status'));
  }
  useEffect(() => {
    if (visible) void refresh().catch((reason) => setError(String(reason)));
  }, [visible]);
  useEffect(
    () =>
      window.assistant.onEvent((event) => {
        if (working.current && event.kind === 'progress') setProgressText(event.data.message);
      }),
    [],
  );
  async function run(fn: () => Promise<void>) {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    setProgressText('');
    try {
      await fn();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      working.current = false;
      setBusy(false);
    }
  }
  const ids =
    category || Object.values(facets).some(Boolean)
      ? entries.map((entry) => entry.bvid)
      : undefined;
  async function readCitation(id: string) {
    await run(async () => {
      const source = await invoke<KnowledgeHit>('knowledge:citation', { evidenceId: id });
      setReading({ title: source.title, text: source.content });
    });
  }
  async function organize(selected: KnowledgeEntry[], target: string, wholeCategory = false) {
    const result = await invoke<{
      changed: number;
      unchanged: number;
      failures: { title: string; error: string }[];
    }>('knowledge:organize', {
      target: target.trim(),
      items: selected.map((entry) => ({ id: entry.bvid, generation: entry.generation_id })),
    });
    await refresh();
    setSearch(null);
    setAnswer(null);
    setReading(null);
    setMoving(null);
    setNotice(`已移动 ${result.changed} 份资料，${result.unchanged} 份分类相同；原文件保留。`);
    if (result.failures.length)
      setError(result.failures.map((item) => item.title + '：' + item.error).join('\n'));
    else if (wholeCategory) {
      setCategory(target.trim());
      setCategoryTarget('');
    }
  }
  return (
    <section
      className="learning-window ppt-extract-page knowledge-window"
      aria-label="知识库"
      hidden={!visible}
      style={!visible ? { display: 'none' } : undefined}
    >
      <datalist id="knowledge-categories">
        {categories.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>
      <aside className="learning-menu">
        <h2>知识库</h2>
        <p>集中保存课程资料，检索原文与引用来源。</p>
        <button
          className={!category ? 'active' : ''}
          onClick={() => {
            setCategory('');
            setSearch(null);
            setAnswer(null);
          }}
        >
          <KnowledgeIcon />
          <span>全部资料 · {data.entries.length}</span>
        </button>
        {categories.map((item) => (
          <button
            key={item}
            className={category === item ? 'active' : ''}
            title={item}
            onClick={() => {
              setCategory(item);
              setSearch(null);
              setAnswer(null);
            }}
          >
            <span>{item}</span>
          </button>
        ))}
        <button onClick={close}>
          <span>返回课程对话</span>
        </button>
      </aside>
      <main className="learning-content">
        <header>
          <div>
            <h2>{category || '课程知识库'}</h2>
            <p>
              {data.stats.totalVideos} 份资料 · {data.stats.totalChunks} 个原文片段
            </p>
          </div>
          <span className="learning-course">
            {vector?.index === 'ready' ? '关键词 + 语义检索' : '本地关键词检索'}
          </span>
        </header>
        <KnowledgeImportCard
          importCategory={importCategory}
          setImportCategory={setImportCategory}
          busy={busy}
          run={run}
          refresh={refresh}
          setSearch={setSearch}
          setAnswer={setAnswer}
          setNotice={setNotice}
        />
        <KnowledgeVectorCard
          vector={vector}
          busy={busy}
          run={run}
          setVector={setVector}
          setNotice={setNotice}
          setSearch={setSearch}
          setAnswer={setAnswer}
        />
        {category && (
          <KnowledgeCategoryCard
            category={category}
            categoryTarget={categoryTarget}
            setCategoryTarget={setCategoryTarget}
            busy={busy}
            entries={entries}
            run={run}
            organize={organize}
            categories={categories}
          />
        )}
        <KnowledgeSearchForm
          run={run}
          setAnswer={setAnswer}
          setReading={setReading}
          setSearch={setSearch}
          query={query}
          ids={ids}
          setQuery={setQuery}
          busy={busy}
        />
        <p className="hint">
          检索在本机进行；点击“根据资料回答”会将问题和检索片段交给当前连接的模型。回答附可查看的原文引用。
        </p>
        {busy && (
          <div className="row">
            <p role="status">{progressText || '正在处理知识库资料…'}</p>
            <button onClick={() => void invoke('cancel')}>取消处理</button>
          </div>
        )}
        {error && (
          <div className="alert" role="alert">
            {error}
          </div>
        )}
        {notice && (
          <div className="knowledge-notice" role="status">
            {notice}
          </div>
        )}
        {search && (
          <KnowledgeSearchResults search={search} busy={busy} readCitation={readCitation} />
        )}
        {answer && <KnowledgeAnswer answer={answer} busy={busy} readCitation={readCitation} />}
        {reading && (
          <section className="knowledge-card knowledge-reading">
            <header>
              <h3>{reading.title}</h3>
              <button onClick={() => setReading(null)}>收起原文</button>
            </header>
            <p className="knowledge-text">{reading.text}</p>
          </section>
        )}
        <KnowledgeFilterCard
          facets={facets}
          setFacets={setFacets}
          setSearch={setSearch}
          setAnswer={setAnswer}
          data={data}
        />
        <KnowledgeClassification entries={entries} refresh={refresh} />
        <KnowledgeEntryList
          entries={entries}
          busy={busy}
          run={run}
          setReading={setReading}
          setMoving={setMoving}
          deleting={deleting}
          setDeleting={setDeleting}
          setSearch={setSearch}
          setAnswer={setAnswer}
          refresh={refresh}
          setNotice={setNotice}
        />
        {moving && (
          <KnowledgeMoveDialog
            moving={moving}
            setMoving={setMoving}
            busy={busy}
            run={run}
            organize={organize}
          />
        )}
      </main>
    </section>
  );
}
