import { useState } from 'react';
import type { LectureNotes } from '../../shared/types';
import { StudyIcon } from './StudyIcon';

export function Notes({
  notes,
  jump,
  save,
  disabled,
}: {
  notes: LectureNotes;
  jump: (t: string) => void;
  save: (n: LectureNotes) => Promise<boolean>;
  disabled: boolean;
}) {
  type Note = LectureNotes['keyPoints'][number] | LectureNotes['notTested'][number];
  const [editing, setEditing] = useState<{
    group: 'keyPoints' | 'notTested' | 'uncertain';
    index: number;
    value: Note;
  } | null>(null);
  const groups = [
    ['keyPoints', '教师明确重点'],
    ['notTested', '明确不考'],
    ['uncertain', '表态含糊'],
  ] as const;
  return (
    <div className="notes">
      {groups.map(([group, title]) => (
        <section key={group}>
          <h3>
            {title}
            <span>{notes[group]?.length || 0}</span>
          </h3>
          {!notes[group]?.length && <p className="hint">本课未提取到相关表态</p>}
          {notes[group]?.map((p, i) => (
            <article key={i} className={`note-card ${p.verified ? '' : 'unverified'}`}>
              <div className="row">
                <span className={`level ${'level' in p ? p.level : ''}`}>
                  {'level' in p ? p.level : group === 'notTested' ? '不考' : '待判断'}
                </span>
                <strong>{p.topic}</strong>
                <button className="timestamp" onClick={() => jump(p.timestamp)}>
                  <StudyIcon name="clock" />
                  {p.timestamp}
                </button>
                <button
                  disabled={disabled}
                  onClick={() => setEditing({ group, index: i, value: { ...p } })}
                >
                  <StudyIcon name="edit" />
                  编辑
                </button>
                <button
                  disabled={disabled}
                  onClick={() => {
                    const n = structuredClone(notes);
                    n[group]!.splice(i, 1);
                    void save(n);
                  }}
                >
                  <StudyIcon name="trash" />
                  删除
                </button>
              </div>
              {'detail' in p && <p>{p.detail}</p>}
              <blockquote>{p.quote}</blockquote>
              {'pptRef' in p && p.pptRef && <small>课件：{p.pptRef}</small>}
              {!p.verified && (
                <p className="warning">
                  待核对：原话、时间或字幕疑点未通过校验，不作为教师明确考点。
                </p>
              )}
              {editing?.group === group && editing.index === i && (
                <form
                  className="note-editor"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const n = structuredClone(notes);
                    (n[group] as Note[])[i] = editing.value;
                    void save(n).then((ok) => {
                      if (ok) setEditing(null);
                    });
                  }}
                >
                  <label>
                    知识点
                    <input
                      required
                      value={editing.value.topic}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          value: { ...editing.value, topic: e.target.value },
                        })
                      }
                    />
                  </label>
                  {'level' in editing.value && (
                    <label>
                      重点强度
                      <select
                        value={editing.value.level}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            value: {
                              ...editing.value,
                              level: e.target.value as LectureNotes['keyPoints'][number]['level'],
                            },
                          })
                        }
                      >
                        {['必考', '很可能考', '重要', '要求掌握'].map((level) => (
                          <option key={level}>{level}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  {'detail' in editing.value && (
                    <label>
                      具体内容
                      <textarea
                        value={editing.value.detail}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            value: { ...editing.value, detail: e.target.value },
                          })
                        }
                      />
                    </label>
                  )}
                  <label>
                    老师原话
                    <textarea
                      required
                      value={editing.value.quote}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          value: { ...editing.value, quote: e.target.value },
                        })
                      }
                    />
                  </label>
                  <label>
                    时间戳
                    <input
                      required
                      pattern="[0-9]{2,}:[0-9]{2}:[0-9]{2}"
                      value={editing.value.timestamp}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          value: { ...editing.value, timestamp: e.target.value },
                        })
                      }
                    />
                  </label>
                  {'level' in editing.value && (
                    <label>
                      课件位置（可选）
                      <input
                        value={editing.value.pptRef || ''}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            value: { ...editing.value, pptRef: e.target.value },
                          })
                        }
                      />
                    </label>
                  )}
                  <button className="primary" disabled={disabled}>
                    校验并保存
                  </button>
                  <button type="button" onClick={() => setEditing(null)}>
                    取消
                  </button>
                </form>
              )}
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}
