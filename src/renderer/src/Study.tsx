import { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url';
import { type Highlight, type StudyEntry } from '../../shared/study';
import type { Course, Detail } from '../../shared/types';
import { invoke } from './ipc';
import { errorMessage } from '../../shared/errors';
import { StudySidebar } from './StudySidebar';
import { TextbookPanel } from './TextbookPanel';
GlobalWorkerOptions.workerSrc = workerUrl;
export type Book = { id: string; path: string; pages: number };
export function Study({
  courses,
  close,
  refresh,
}: {
  courses: Course[];
  close: () => void;
  refresh: () => Promise<unknown>;
}) {
  const [entries, setEntries] = useState<StudyEntry[]>([]),
    [text, setText] = useState(''),
    [timezone, setTimezone] = useState('Asia/Shanghai'),
    [detail, setDetail] = useState<Detail | null>(null),
    [selected, setSelected] = useState(''),
    [book, setBook] = useState<Book | null>(null),
    [first, setFirst] = useState(1),
    [last, setLast] = useState(1),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [draft, setDraft] = useState<{ id: string; rows: Highlight[] } | null>(null),
    [chosen, setChosen] = useState<string[]>([]),
    [pageNumber, setPageNumber] = useState(1),
    [source, setSource] = useState<Highlight['source']>('teacher'),
    [evidence, setEvidence] = useState(''),
    [extension, setExtension] = useState(false),
    [rectangle, setRectangle] = useState<Highlight['rect'] | null>(null),
    [image, setImage] = useState(''),
    [size, setSize] = useState({ width: 1, height: 1 });
  const viewport = useRef<ReturnType<
      import('pdfjs-dist/legacy/build/pdf.mjs').PDFPageProxy['getViewport']
    > | null>(null),
    start = useRef<[number, number] | null>(null);
  const entry = entries.find((e) => e.id === selected);
  async function run(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void invoke('study:get')
      .then((rows) => {
        setEntries(rows);
        setSelected(rows[0]?.id || '');
      })
      .catch((e) => setError(String(e)));
  }, []);
  useEffect(() => {
    if (entry)
      void invoke('course:detail', { id: entry.courseId })
        .then(setDetail)
        .catch((e) => setError(String(e)));
    else setDetail(null);
  }, [entry?.courseId]);
  useEffect(() => {
    let active = true;
    const task = (async () => {
      if (!book) return;
      const data = await invoke('textbook:bytes', { id: book.id }),
        pdfTask = getDocument({
          url: data,
          disableAutoFetch: true,
          disableStream: true,
          rangeChunkSize: 1048576,
          canvasMaxAreaInBytes: 32000000,
        });
      try {
        const pdf = await pdfTask.promise,
          page = await pdf.getPage(pageNumber),
          v = page.getViewport({
            scale: Math.min(1.25, 1000 / page.getViewport({ scale: 1 }).width),
          }),
          canvas = document.createElement('canvas');
        canvas.width = v.width;
        canvas.height = v.height;
        await page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport: v }).promise;
        if (active) {
          viewport.current = v;
          setImage(canvas.toDataURL());
          setSize({ width: v.width, height: v.height });
          setRectangle(null);
        }
      } finally {
        await pdfTask.destroy();
      }
    })();
    void task.catch((e) => {
      if (active) setError(String(e));
    });
    return () => {
      active = false;
    };
  }, [book, pageNumber, notice]);
  async function analyzeBook() {
    if (!book) return;
    let result: { id: string; rows: Highlight[] };
    const ppt = await invoke('textbook:ppt-source', {
      entryId: selected,
    });
    if (ppt) {
      setNotice('正在识别本节课图片型 PPT 的文字，供浅蓝色划线使用');
      const task = getDocument({ data: Uint8Array.from(atob(ppt.data), (c) => c.charCodeAt(0)) }),
        images: string[] = [];
      try {
        const pdf = await task.promise;
        if (pdf.numPages > 500) throw new Error('请选择本节课 PPT，不能使用全课程合并课件');
        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n),
            v = page.getViewport({ scale: 900 / page.getViewport({ scale: 1 }).width }),
            canvas = document.createElement('canvas');
          canvas.width = v.width;
          canvas.height = v.height;
          await page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport: v })
            .promise;
          images.push(canvas.toDataURL('image/jpeg', 0.8));
        }
      } finally {
        await task.destroy();
      }
      await invoke('textbook:ppt-ocr', { entryId: selected, hash: ppt.hash, images });
    }

    try {
      result = await invoke('textbook:analyze', { id: book.id, entryId: selected, first, last });
    } catch (error) {
      if (!String(error).includes('扫描图片')) throw error;
      if (last < first || last - first > 99 || last > book.pages)
        throw new Error('请选择不超过 100 页的章节范围');
      setNotice('正在识别扫描教材；请逐条核对文字和位置后保存');
      const data = await invoke('textbook:bytes', { id: book.id }),
        task = getDocument({
          url: data,
          disableAutoFetch: true,
          disableStream: true,
          rangeChunkSize: 1048576,
          canvasMaxAreaInBytes: 32000000,
        }),
        images: string[] = [];
      try {
        const pdf = await task.promise;
        for (let n = first; n <= last; n++) {
          const page = await pdf.getPage(n),
            v = page.getViewport({
              scale: Math.min(1.5, 1200 / page.getViewport({ scale: 1 }).width),
            }),
            canvas = document.createElement('canvas');
          canvas.width = v.width;
          canvas.height = v.height;
          await page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport: v })
            .promise;
          images.push(canvas.toDataURL('image/jpeg', 0.85));
        }
      } finally {
        await task.destroy();
      }
      result = await invoke('textbook:analyze-images', {
        id: book.id,
        entryId: selected,
        first,
        last,
        images,
      });
    }
    setDraft(result);
    setChosen(result.rows.map((r) => r.id));
    setNotice(
      result.rows.length
        ? '请核对划线内容、位置与依据，再保存到原教材'
        : '此范围没有找到依据充分的内容，原教材未修改',
    );
  }
  function update(value: Partial<StudyEntry>) {
    setEntries((rows) => rows.map((row) => (row.id === selected ? { ...row, ...value } : row)));
    setDraft(null);
  }
  function point(event: React.MouseEvent<HTMLDivElement>) {
    const r = event.currentTarget.getBoundingClientRect();
    return [
      ((event.clientX - r.left) / r.width) * size.width,
      ((event.clientY - r.top) / r.height) * size.height,
    ] as [number, number];
  }
  return (
    <section className="study-page" aria-label="课表与教材">
      <header>
        <div>
          <h2>课表与教材</h2>
          <p>选择章节、预览建议，再保存可编辑划线</p>
        </div>
        <button disabled={busy} onClick={close}>
          返回课程对话
        </button>
      </header>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      <div className="study-layout">
        <StudySidebar
          text={text}
          setText={setText}
          timezone={timezone}
          setTimezone={setTimezone}
          busy={busy}
          run={run}
          setEntries={setEntries}
          setSelected={setSelected}
          setNotice={setNotice}
          courses={courses}
          entries={entries}
          selected={selected}
          entry={entry}
          update={update}
          detail={detail}
          refresh={refresh}
          setBook={setBook}
          setPageNumber={setPageNumber}
          setDraft={setDraft}
          setLast={setLast}
          book={book}
          first={first}
          setFirst={setFirst}
          last={last}
          analyzeBook={analyzeBook}
        />
        <TextbookPanel
          book={book}
          pageNumber={pageNumber}
          setPageNumber={setPageNumber}
          source={source}
          setSource={setSource}
          busy={busy}
          start={start}
          point={point}
          viewport={viewport}
          setRectangle={setRectangle}
          image={image}
          draft={draft}
          chosen={chosen}
          size={size}
          rectangle={rectangle}
          evidence={evidence}
          setEvidence={setEvidence}
          extension={extension}
          setExtension={setExtension}
          run={run}
          setNotice={setNotice}
          setDraft={setDraft}
          setChosen={setChosen}
        />
      </div>
    </section>
  );
}
