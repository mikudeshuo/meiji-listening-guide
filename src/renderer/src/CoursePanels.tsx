import { useState } from 'react';
import { Modal, FilePicker } from './UiParts';
export function NewCourse({
  close,
  create,
  busy,
}: {
  close: () => void;
  create: (name: string, senior: string[], exams: string[]) => Promise<boolean>;
  busy: boolean;
}) {
  const [name, setName] = useState(''),
    [senior, setSenior] = useState<string[]>([]),
    [exams, setExams] = useState<string[]>([]);
  return (
    <Modal title="新建课程" close={close}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void create(name, senior, exams);
        }}
      >
        <label>
          课程名称
          <input
            autoFocus
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：我的课程"
          />
        </label>
        <FilePicker label="学长学姐笔记（可选）" paths={senior} set={setSenior} />
        <FilePicker label="历年卷（可选）" paths={exams} set={setExams} />
        <p className="hint">
          支持 PDF、DOCX、TXT、MD；可以以后继续补充。历年卷导入后在“课前资料”中拆题并校对。
        </p>
        <footer>
          <button type="button" onClick={close}>
            取消
          </button>
          <button className="primary" disabled={busy || !name.trim()}>
            创建课程
          </button>
        </footer>
      </form>
    </Modal>
  );
}
export function NewLecture({
  draft,
  pptDraft,
  close,
  create,
  busy,
  courseId,
}: {
  courseId: string;
  draft: string;
  pptDraft: string;
  close: () => void;
  create: (title: string, source: string, ppt: string) => Promise<boolean>;
  busy: boolean;
}) {
  const [title, setTitle] = useState(''),
    [original, setOriginal] = useState(draft ? [draft] : []),
    [ppt, setPpt] = useState<string[]>(pptDraft ? [pptDraft] : []);
  return (
    <Modal title="新建课次" close={close}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void create(title, original[0], ppt[0] || '');
        }}
      >
        <label>
          课次标题
          <input
            autoFocus
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="第 1 讲"
          />
        </label>
        <FilePicker
          courseId={courseId}
          transcript
          label="语音识别原文（必选）"
          paths={original}
          set={(p) => setOriginal(p.slice(-1))}
        />
        <FilePicker
          courseId={courseId}
          courseware
          label="PPT/课件"
          paths={ppt}
          set={(p) => setPpt(p.slice(-1))}
        />
        <p className="hint">
          支持智云原文 Word、TXT、Markdown、SRT。导入 PPTX 后，由 Codex
          按需读取页面文字与原始图片，结合语音原文校订，无需单独逐页识别。
        </p>
        <footer>
          <button type="button" onClick={close}>
            取消
          </button>
          <button className="primary" disabled={busy || !title.trim() || !original.length}>
            添加课次
          </button>
        </footer>
      </form>
    </Modal>
  );
}
export function AddTranscript({
  courseId,
  draft,
  close,
  save,
  busy,
}: {
  courseId: string;
  draft: string;
  close: () => void;
  save: (path: string) => Promise<boolean>;
  busy: boolean;
}) {
  const [paths, setPaths] = useState<string[]>(draft ? [draft] : []);
  return (
    <Modal title="添加语音识别原文" close={close}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save(paths[0]);
        }}
      >
        <FilePicker
          courseId={courseId}
          transcript
          label="选择或拖入智云原文"
          paths={paths}
          set={(p) => setPaths(p.slice(-1))}
        />
        <p className="hint">替换原文后需要重新校订字幕，旧笔记与练习也需重新生成。</p>
        <footer>
          <button type="button" onClick={close}>
            取消
          </button>
          <button className="primary" disabled={busy || !paths.length}>
            保存原文
          </button>
        </footer>
      </form>
    </Modal>
  );
}
export function AddCourseware({
  draft,
  close,
  busy,
  save,
  courseId,
}: {
  courseId: string;
  draft: string;
  close: () => void;
  busy: boolean;
  save: (path: string) => Promise<boolean>;
}) {
  const [paths, setPaths] = useState<string[]>(draft ? [draft] : []);
  return (
    <Modal title="添加 PPT/课件" close={close}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save(paths[0]);
        }}
      >
        <FilePicker
          courseId={courseId}
          courseware
          label="选择或拖入 PPT/课件"
          paths={paths}
          set={(p) => setPaths(p.slice(-1))}
        />
        <p className="hint">
          课件保存到 PPT
          文件夹并关联当前课次。每个课次保留一份当前课件，新添加会替换关联，旧文件仍保留。Codex
          按需读取 PPTX 的页面文字和原始图片，与语音原文一起校订。旧 PPT 请另存为 PPTX；PDF
          目前读取文字内容。
        </p>
        <footer>
          <button type="button" onClick={close}>
            取消
          </button>
          <button className="primary" disabled={busy || !paths.length}>
            添加课件
          </button>
        </footer>
      </form>
    </Modal>
  );
}
