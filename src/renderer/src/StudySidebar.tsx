import {
  type StudyEntry,
  type Highlight,
  checkAt,
  highlightLabels,
  highlightColors,
} from '../../shared/study';
import type { Course, Detail } from '../../shared/types';
import { invoke } from './ipc';
import type { Book } from './Study';

export function StudySidebar({
  text,
  setText,
  timezone,
  setTimezone,
  busy,
  run,
  setEntries,
  setSelected,
  setNotice,
  courses,
  entries,
  selected,
  entry,
  update,
  detail,
  refresh,
  setBook,
  setPageNumber,
  setDraft,
  setLast,
  book,
  first,
  setFirst,
  last,
  analyzeBook,
}: {
  text: string;
  setText: React.Dispatch<React.SetStateAction<string>>;
  timezone: string;
  setTimezone: React.Dispatch<React.SetStateAction<string>>;
  busy: boolean;
  run: (fn: () => Promise<void>) => Promise<void>;
  setEntries: React.Dispatch<
    React.SetStateAction<
      {
        id: string;
        courseId: string;
        title: string;
        chapter: string;
        endsAt: string;
        lectureId?: string | undefined;
        zhiyunCourseId?: string | undefined;
        subId?: string | undefined;
      }[]
    >
  >;
  setSelected: React.Dispatch<React.SetStateAction<string>>;
  setNotice: React.Dispatch<React.SetStateAction<string>>;
  courses: Course[];
  entries: {
    id: string;
    courseId: string;
    title: string;
    chapter: string;
    endsAt: string;
    lectureId?: string | undefined;
    zhiyunCourseId?: string | undefined;
    subId?: string | undefined;
  }[];
  selected: string;
  entry:
    | {
        id: string;
        courseId: string;
        title: string;
        chapter: string;
        endsAt: string;
        lectureId?: string | undefined;
        zhiyunCourseId?: string | undefined;
        subId?: string | undefined;
      }
    | undefined;
  update: (value: Partial<StudyEntry>) => void;
  detail: Detail | null;
  refresh: () => Promise<unknown>;
  setBook: React.Dispatch<React.SetStateAction<Book | null>>;
  setPageNumber: React.Dispatch<React.SetStateAction<number>>;
  setDraft: React.Dispatch<React.SetStateAction<{ id: string; rows: Highlight[] } | null>>;
  setLast: React.Dispatch<React.SetStateAction<number>>;
  book: Book | null;
  first: number;
  setFirst: React.Dispatch<React.SetStateAction<number>>;
  last: number;
  analyzeBook: () => Promise<void>;
}) {
  return (
    <aside>
      <h3>课表</h3>
      <label>
        粘贴课表
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="请包含日期、课程、章节和结束时间"
        />
      </label>
      <label>
        课表时区
        <input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
      </label>
      <div className="row">
        <button
          disabled={busy || !text.trim()}
          onClick={() =>
            void run(async () => {
              const rows = await invoke('study:parse', { text, timezone });
              if (!rows.length)
                throw new Error('课表缺少明确的日期、结束时间或章节，或课程无法匹配，请补充后重试');
              setEntries(rows);
              setSelected(rows[0].id);
              setNotice('已识别，请核对后保存课表');
            })
          }
        >
          识别课表
        </button>
        <button
          disabled={busy || !courses.length}
          onClick={() => {
            const row: StudyEntry = {
              id: crypto.randomUUID(),
              courseId: courses[0].id,
              title: '',
              chapter: '',
              endsAt: new Date().toISOString(),
            };
            setEntries([...entries, row]);
            setSelected(row.id);
          }}
        >
          手动添加
        </button>
      </div>
      <label>
        课表条目
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">请选择</option>
          {entries.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title || '待填写课次'}
            </option>
          ))}
        </select>
      </label>
      {entry && (
        <>
          <label>
            课程
            <select
              value={entry.courseId}
              onChange={(e) => update({ courseId: e.target.value, lectureId: undefined })}
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            课次名称
            <input value={entry.title} onChange={(e) => update({ title: e.target.value })} />
          </label>
          <label>
            教材章节
            <input value={entry.chapter} onChange={(e) => update({ chapter: e.target.value })} />
          </label>
          <label>
            <input
              type="checkbox"
              checked={!entry.endsAt}
              onChange={(e) => update({ endsAt: e.target.checked ? '' : new Date().toISOString() })}
            />
            时间待定
          </label>
          <label>
            课程结束时间（含时区）
            <input
              value={entry.endsAt}
              onChange={(e) => update({ endsAt: e.target.value })}
              placeholder="2026-10-08T12:00:00+08:00"
            />
          </label>
          <small>
            核验时间：
            {Number.isFinite(Date.parse(entry.endsAt))
              ? new Date(checkAt(entry.endsAt)).toLocaleString()
              : entry.endsAt
                ? '请填写有效时间'
                : '补课时间待定，不安排核验'}
            （结束后 4 小时）
          </small>
          <label>
            关联已有课次
            <select
              value={entry.lectureId || ''}
              onChange={(e) => update({ lectureId: e.target.value || undefined })}
            >
              <option value="">暂不关联</option>
              {detail?.lectures.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            智云课程编号
            <input
              value={entry.zhiyunCourseId || ''}
              onChange={(e) => update({ zhiyunCourseId: e.target.value || undefined })}
            />
          </label>
          <label>
            智云课次编号
            <input
              value={entry.subId || ''}
              onChange={(e) => update({ subId: e.target.value || undefined })}
            />
          </label>
          <button
            disabled={busy}
            onClick={() => {
              setEntries(entries.filter((e) => e.id !== selected));
              setSelected('');
            }}
          >
            删除此条目
          </button>
        </>
      )}
      <button
        className="primary"
        disabled={busy}
        onClick={() =>
          void run(async () => {
            setEntries(await invoke('study:save', { entries }));
            await refresh();
            setNotice(
              '课表已保存，关联课次已按课表改名。核验时间已计算；自动运行通过 Codex 定时任务设置，教材不会自动划线。',
            );
          })
        }
      >
        保存课表与课次名称
      </button>
      <h3>教材划线</h3>
      <p>只有点击保存划线，才会修改原教材。分析和预览不会添加批注。</p>
      <small>重复区域优先级：老师重点 → 学长学姐重点 → 老师讲授内容 → PPT 内容</small>
      <div className="study-legend">
        {Object.entries(highlightLabels).map(([key, label]) => (
          <span key={key}>
            <i
              style={{
                background: `rgb(${highlightColors[key as Highlight['source']].map((v) => v * 255).join(',')})`,
              }}
            />
            {label}
          </span>
        ))}
      </div>
      <button
        disabled={busy}
        onClick={() =>
          void run(async () => {
            const result = await invoke('textbook:pick');
            if (result) {
              setBook(result);
              setPageNumber(1);
              setDraft(null);
              setLast(1);
            }
          })
        }
      >
        选择原教材 PDF
      </button>
      {book && (
        <>
          <small>
            {book.path} · {book.pages} 页
          </small>
          <div className="row">
            <label>
              章节起始页
              <input
                type="number"
                min={1}
                max={book.pages}
                value={first}
                onChange={(e) => setFirst(Number(e.target.value))}
              />
            </label>
            <label>
              结束页
              <input
                type="number"
                min={first}
                max={book.pages}
                value={last}
                onChange={(e) => setLast(Number(e.target.value))}
              />
            </label>
          </div>
          <button
            disabled={busy || !entry?.lectureId}
            onClick={() =>
              void run(async () => {
                await analyzeBook();
              })
            }
          >
            按课堂资料生成划线建议
          </button>
          <button
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await invoke('textbook:open', { id: book.id });
              })
            }
          >
            打开原教材
          </button>
          <button
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await invoke('textbook:clear', { id: book.id });
                setDraft(null);
                setNotice(
                  '已撤销本软件添加的划线，原有批注保留 · ' + new Date().toLocaleTimeString(),
                );
              })
            }
          >
            撤销本软件的划线
          </button>
        </>
      )}
      {busy && <button onClick={() => void invoke('cancel')}>取消处理</button>}
    </aside>
  );
}
