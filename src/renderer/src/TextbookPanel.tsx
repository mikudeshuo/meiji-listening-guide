import { type Highlight, highlightLabels, highlightColors } from '../../shared/study';
import { invoke } from './ipc';
import type { Book } from './Study';

export function TextbookPanel({
  book,
  pageNumber,
  setPageNumber,
  source,
  setSource,
  busy,
  start,
  point,
  viewport,
  setRectangle,
  image,
  draft,
  chosen,
  size,
  rectangle,
  evidence,
  setEvidence,
  extension,
  setExtension,
  run,
  setNotice,
  setDraft,
  setChosen,
}: {
  book: Book | null;
  pageNumber: number;
  setPageNumber: React.Dispatch<React.SetStateAction<number>>;
  source: string;
  setSource: React.Dispatch<React.SetStateAction<'teacher' | 'focus' | 'ppt' | 'senior'>>;
  busy: boolean;
  start: React.RefObject<[number, number] | null>;
  point: (event: React.MouseEvent<HTMLDivElement>) => [number, number];
  viewport: React.RefObject<ReturnType<
    import('pdfjs-dist/legacy/build/pdf.mjs').PDFPageProxy['getViewport']
  > | null>;
  setRectangle: React.Dispatch<React.SetStateAction<[number, number, number, number] | null>>;
  image: string;
  draft: { id: string; rows: Highlight[] } | null;
  chosen: string[];
  size: { width: number; height: number };
  rectangle: [number, number, number, number] | null;
  evidence: string;
  setEvidence: React.Dispatch<React.SetStateAction<string>>;
  extension: boolean;
  setExtension: React.Dispatch<React.SetStateAction<boolean>>;
  run: (fn: () => Promise<void>) => Promise<void>;
  setNotice: React.Dispatch<React.SetStateAction<string>>;
  setDraft: React.Dispatch<React.SetStateAction<{ id: string; rows: Highlight[] } | null>>;
  setChosen: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  return (
    <main>
      {book ? (
        <>
          <div className="row">
            <label>
              预览页
              <input
                type="number"
                min={1}
                max={book.pages}
                value={pageNumber}
                onChange={(e) => {
                  const p = Number(e.target.value);
                  if (p >= 1 && p <= book.pages) setPageNumber(p);
                }}
              />
            </label>
            <select
              aria-label="手动划线来源"
              value={source}
              onChange={(e) => setSource(e.target.value as Highlight['source'])}
            >
              {Object.entries(highlightLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <p>在教材页面上拖动框选可添加可编辑划线，扫描教材也可使用。</p>
          <div
            className="textbook-preview"
            onMouseDown={(e) => {
              if (!busy) start.current = point(e);
            }}
            onMouseUp={(e) => {
              if (!start.current || !viewport.current) return;
              const a = viewport.current.convertToPdfPoint(...start.current),
                b = viewport.current.convertToPdfPoint(...point(e));
              start.current = null;
              setRectangle([
                Math.min(a[0], b[0]),
                Math.min(a[1], b[1]),
                Math.abs(a[0] - b[0]),
                Math.abs(a[1] - b[1]),
              ]);
            }}
          >
            <img draggable={false} src={image} />
            {draft?.rows
              .filter((r) => r.page === pageNumber && chosen.includes(r.id))
              .map((row) => {
                if (!viewport.current) return null;
                const v = viewport.current,
                  a = v.convertToViewportPoint(row.rect[0], row.rect[1]),
                  b = v.convertToViewportPoint(
                    row.rect[0] + row.rect[2],
                    row.rect[1] + row.rect[3],
                  );
                return (
                  <span
                    key={row.id}
                    style={{
                      left: (Math.min(a[0], b[0]) / size.width) * 100 + '%',
                      top: (Math.min(a[1], b[1]) / size.height) * 100 + '%',
                      width: (Math.abs(a[0] - b[0]) / size.width) * 100 + '%',
                      height: (Math.abs(a[1] - b[1]) / size.height) * 100 + '%',
                      background: `rgba(${highlightColors[row.source].map((v) => v * 255).join(',')},.35)`,
                    }}
                  />
                );
              })}
            {rectangle &&
              viewport.current &&
              (() => {
                const v = viewport.current!,
                  a = v.convertToViewportPoint(rectangle[0], rectangle[1]),
                  b = v.convertToViewportPoint(
                    rectangle[0] + rectangle[2],
                    rectangle[1] + rectangle[3],
                  );
                return (
                  <span
                    style={{
                      left: (Math.min(a[0], b[0]) / size.width) * 100 + '%',
                      top: (Math.min(a[1], b[1]) / size.height) * 100 + '%',
                      width: (Math.abs(a[0] - b[0]) / size.width) * 100 + '%',
                      height: (Math.abs(a[1] - b[1]) / size.height) * 100 + '%',
                    }}
                  />
                );
              })()}
          </div>
          <label>
            划线依据或说明
            <input value={evidence} onChange={(e) => setEvidence(e.target.value)} />
          </label>
          <label>
            <input
              type="checkbox"
              checked={extension}
              onChange={(e) => setExtension(e.target.checked)}
            />
            属于讲授内容的适当延伸
          </label>
          <button
            className="primary"
            disabled={busy || !rectangle || !evidence.trim()}
            onClick={() =>
              void run(async () => {
                await invoke('textbook:manual', {
                  id: book.id,
                  highlight: {
                    id: crypto.randomUUID(),
                    page: pageNumber,
                    rect: rectangle,
                    source,
                    quote: '手动框选区域',
                    evidence,
                    extension,
                  },
                });
                setNotice('手动划线已保存到原教材 · ' + new Date().toLocaleTimeString());
                setDraft(null);
              })
            }
          >
            保存框选划线
          </button>
        </>
      ) : (
        <div className="study-empty">选择教材后，在这里预览并检查划线。</div>
      )}
      {draft && (
        <div className="highlight-review">
          <h3>划线建议 · {chosen.length} 条选中</h3>
          {draft.rows.map((row) => (
            <label key={row.id}>
              <input
                type="checkbox"
                checked={chosen.includes(row.id)}
                onChange={(e) =>
                  setChosen(
                    e.target.checked ? [...chosen, row.id] : chosen.filter((id) => id !== row.id),
                  )
                }
              />
              <span>
                第 {row.page} 页 · {highlightLabels[row.source]}
                {row.extension ? ' · 适当延伸' : ''}
                <strong>{row.quote}</strong>
                <small>依据：{row.evidence}</small>
                <button onClick={() => setPageNumber(row.page)}>看这一页</button>
              </span>
            </label>
          ))}
          <button
            className="primary"
            disabled={busy || !chosen.length}
            onClick={() =>
              void run(async () => {
                await invoke('textbook:apply', { id: draft.id, ids: chosen });
                setDraft(null);
                setNotice('可编辑划线已保存到原教材 · ' + new Date().toLocaleTimeString());
              })
            }
          >
            保存所选划线到原教材
          </button>
        </div>
      )}
    </main>
  );
}
