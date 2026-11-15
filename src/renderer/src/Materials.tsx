import { useState } from 'react';
import type { Detail, PastQuestion, CourseFile } from '../../shared/types';
import { invoke } from './ipc';
import { StudyIcon } from './StudyIcon';
import { Modal } from './UiParts';

export function Materials({
  detail,
  busy,
  close,
  run,
  files,
}: {
  files: () => void;
  detail: Detail;
  busy: boolean;
  close: () => void;
  run: (fn: () => Promise<unknown>) => Promise<boolean>;
}) {
  const [selected, setSelected] = useState<string[]>([]),
    [edit, setEdit] = useState<PastQuestion | null>(null);
  const add = (kind: CourseFile['kind']) =>
    void run(async () => {
      const paths = await invoke('pick', { kind: 'document' });
      if (paths.length) await invoke('files:add', { courseId: detail.course.id, kind, paths });
    });
  const saveQuestions = (questions: PastQuestion[]) =>
    run(() => invoke('questions:save', { courseId: detail.course.id, questions }));
  return (
    <Modal title="课前资料与历年题库" close={close}>
      <div className="toolbar">
        <button onClick={files}>查看本课程 PDF 与文件</button>
        <button disabled={busy} onClick={() => add('senior_notes')}>
          ＋ 学长学姐笔记
        </button>
        <button disabled={busy} onClick={() => add('past_exam')}>
          ＋ 历年卷
        </button>
      </div>
      {detail.files.map((f) => (
        <article className="material" key={f.id}>
          <div>
            <strong>{f.filename}</strong>
            <small>
              {f.kind === 'senior_notes' ? '学长学姐笔记' : '历年卷'} · {f.text.length} 字 ·{' '}
              {f.chunks.length} 块{f.needs_ocr ? ' · 需 OCR' : ''}
            </small>
          </div>
          {f.kind === 'past_exam' && (
            <button
              disabled={busy || !!f.needs_ocr}
              onClick={() =>
                void run(() => invoke('questions:split', { courseId: detail.course.id, id: f.id }))
              }
            >
              拆成单题
            </button>
          )}
          <button
            disabled={busy}
            onClick={() =>
              void run(() => invoke('files:remove', { courseId: detail.course.id, id: f.id }))
            }
          >
            删除资料
          </button>
        </article>
      ))}
      {!detail.files.length && (
        <p className="hint">尚未导入资料。支持 PDF、DOCX、TXT、MD；扫描件会标记“需 OCR”。</p>
      )}
      <h3>历年题库 · {detail.questions.length} 道</h3>
      <div className="toolbar">
        <button
          disabled={busy || selected.length < 2}
          onClick={() => {
            const chosen = detail.questions.filter((q) => selected.includes(q.id)),
              first = chosen[0];
            const merged = {
              ...first,
              stem: chosen.map((q) => q.stem).join('\n\n'),
              answer:
                chosen
                  .map((q) => q.answer || '')
                  .filter(Boolean)
                  .join('\n') || undefined,
              knowledgePoints: [...new Set(chosen.flatMap((q) => q.knowledgePoints))],
            };
            void saveQuestions(
              detail.questions
                .filter((q) => !selected.includes(q.id) || q.id === first.id)
                .map((q) => (q.id === first.id ? merged : q)),
            ).then(() => setSelected([]));
          }}
        >
          合并选中题目
        </button>
        <button
          disabled={busy || !selected.length}
          onClick={() =>
            void saveQuestions(detail.questions.filter((q) => !selected.includes(q.id))).then(() =>
              setSelected([]),
            )
          }
        >
          删除选中
        </button>
      </div>
      {detail.questions.map((q) => (
        <article key={q.id} className="question-card">
          <div className="row">
            <input
              type="checkbox"
              aria-label="选中题目"
              checked={selected.includes(q.id)}
              onChange={(e) =>
                setSelected(
                  e.target.checked ? [...selected, q.id] : selected.filter((id) => id !== q.id),
                )
              }
            />
            <strong>{q.type}</strong>
            <small>
              {q.year} · {q.sourceFile}
            </small>
            <button disabled={busy} onClick={() => setEdit(q)}>
              <StudyIcon name="edit" />
              编辑
            </button>
          </div>
          <p className="question-stem">{q.stem}</p>
          <small>{q.knowledgePoints.join(' / ')}</small>
          {edit?.id === q.id && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void saveQuestions(detail.questions.map((v) => (v.id === edit.id ? edit : v))).then(
                  () => setEdit(null),
                );
              }}
            >
              <label>
                题型
                <input
                  value={edit.type}
                  onChange={(e) => setEdit({ ...edit, type: e.target.value })}
                />
              </label>
              <label>
                年份
                <input
                  value={edit.year || ''}
                  onChange={(e) => setEdit({ ...edit, year: e.target.value })}
                />
              </label>
              <label>
                题干
                <textarea
                  value={edit.stem}
                  onChange={(e) => setEdit({ ...edit, stem: e.target.value })}
                />
              </label>
              <label>
                答案
                <textarea
                  value={edit.answer || ''}
                  onChange={(e) => setEdit({ ...edit, answer: e.target.value })}
                />
              </label>
              <label>
                知识点（用逗号分隔）
                <input
                  value={edit.knowledgePoints.join(',')}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      knowledgePoints: e.target.value.split(/[,，]/).filter(Boolean),
                    })
                  }
                />
              </label>
              <button className="primary" disabled={busy}>
                保存
              </button>
              <button type="button" onClick={() => setEdit(null)}>
                取消
              </button>
            </form>
          )}
        </article>
      ))}
    </Modal>
  );
}
