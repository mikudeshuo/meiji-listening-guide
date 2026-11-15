import type { LectureDetail } from '../../shared/types';
import { invoke } from './ipc';
import { PracticePanel } from './PracticePanel';
import { StudyIcon } from './StudyIcon';

export function PracticeTab({
  busy,
  lecture,
  task,
  generate,
  exportResult,
  withSearch,
  setWithSearch,
  lectureId,
  reloadLecture,
}: {
  busy: boolean;
  lecture: LectureDetail;
  task: (fn: () => Promise<unknown>) => Promise<boolean>;
  generate: (
    action: 'subtitles:generate' | 'notes:generate' | 'practice:generate' | 'practice:prepare',
  ) => Promise<void>;
  exportResult: (kind: string, format: string) => undefined;
  withSearch: boolean;
  setWithSearch: React.Dispatch<React.SetStateAction<boolean>>;
  lectureId: string;
  reloadLecture: (id?: string) => Promise<LectureDetail>;
}) {
  return (
    <>
      <div className="toolbar">
        <button
          className="primary"
          disabled={busy || !lecture.segments.length || !!lecture.correction}
          onClick={() => void task(() => generate('practice:generate'))}
        >
          <StudyIcon name="practice" />
          生成课后练习
        </button>
        {lecture.practice &&
          [
            ...lecture.practice.past,
            ...lecture.practice.extended,
            ...(lecture.practice.generated || []),
          ].some((q) => !q.answer || !q.explanation) && (
            <button disabled={busy} onClick={() => void task(() => generate('practice:prepare'))}>
              <StudyIcon name="sparkle" />
              补全已有答案与详解
            </button>
          )}
        {lecture.practice &&
          ['md', 'docx', 'pdf'].map((f) => (
            <button key={f} onClick={() => exportResult('practice', f)}>
              <StudyIcon name="download" />
              {f === 'md' ? 'Markdown' : f === 'docx' ? 'Word' : 'PDF'}
            </button>
          ))}
      </div>
      <label className="practice-options">
        <input
          type="checkbox"
          checked={withSearch}
          disabled={busy}
          onChange={(e) => setWithSearch(e.target.checked)}
        />
        搜索有来源的拓展题（较慢，需配置搜索服务）
      </label>
      {lecture.practice ? (
        <PracticePanel
          key={lectureId}
          data={lecture.practice}
          disabled={busy}
          submit={async (group, index, response) => {
            await invoke('practice:submit', {
              id: lectureId,
              group,
              index,
              response,
            });
            await reloadLecture();
          }}
          answer={async (group, index) => {
            let failure: unknown;
            const ok = await task(async () => {
              try {
                await invoke('practice:answer', {
                  id: lectureId,
                  group,
                  index,
                });
              } catch (e) {
                failure = e;
              } finally {
                await reloadLecture();
              }
            });
            if (failure) throw failure;
            if (!ok) throw new Error('请等待当前任务完成，再补全详解');
          }}
          reset={async (group, index) => {
            await invoke('practice:reset', { id: lectureId, group, index });
            await reloadLecture();
          }}
        />
      ) : (
        <div className="empty">
          <h3>围绕这一讲练习</h3>
          <p>
            完成字幕后即可生成 AI 自测题和参考解析。
            <br />
            导入并拆题后，相关历年真题会单独列出。
          </p>
        </div>
      )}
    </>
  );
}
