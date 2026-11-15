import { SubtitleBatchRecords } from './SubtitleBatchRecords';
import { learningViews, LearningIcon, type LearningView } from './LearningNav';
import type { VideoNoteMode, VideoNoteResult } from '../../shared/video-notes';
import { useEffect, useRef, useState } from 'react';
import {
  defaultVideoPrompt,
  type VideoSource,
  type VideoReview,
  type VideoSeries,
  type VideoBatchItem,
  type PendingVideoTask,
} from '../../shared/video-ppt';
import type { SubtitleSyncTask } from '../../shared/subtitle-sync';
import type { LibraryFile } from '../../shared/types';
import { invoke } from './ipc';
import { errorMessage } from '../../shared/errors';
import { VideoSourceCard } from './VideoSourceCard';
import { VideoSeriesPicker } from './VideoSeriesPicker';
import { VideoSubtitlePanel } from './VideoSubtitlePanel';
import { VideoNotesPanel } from './VideoNotesPanel';
import { VideoRegionPicker } from './VideoRegionPicker';
import { SlideReview } from './SlideReview';
import { PendingVideoTasks } from './PendingVideoTasks';
import type { BiliSubtitle } from './video-ppt-shared';
export function VideoPpt({
  visible,
  view,
  select,
  close,
  courseId,
  courseName,
  files,
  incomingUrl,
  consumeUrl,
}: {
  visible: boolean;
  view: LearningView;
  select: (view: LearningView) => void;
  close: () => void;
  courseId: string;
  courseName?: string;
  files: () => void;
  incomingUrl?: string;
  consumeUrl?: () => void;
}) {
  const [url, setUrl] = useState(''),
    [prompt, setPrompt] = useState(defaultVideoPrompt),
    [source, setSource] = useState<VideoSource | null>(null),
    [review, setReview] = useState<VideoReview | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [progress, setProgress] = useState(''),
    [checked, setChecked] = useState(false),
    [saved, setSaved] = useState<{
      path: string;
      kept: number;
      removed: number;
      cleaned: boolean;
      cleanupWarning: string;
    } | null>(null),
    [pdfs, setPdfs] = useState<LibraryFile[]>([]);
  const working = useRef(false);
  const [series, setSeries] = useState<VideoSeries | null>(null),
    [selected, setSelected] = useState<number[]>([]),
    [batch, setBatch] = useState<VideoBatchItem[]>([]),
    [filter, setFilter] = useState('');
  const [pending, setPending] = useState<PendingVideoTask[]>([]);
  const [subtitle, setSubtitle] = useState<BiliSubtitle | null>(null),
    [subtitlePage, setSubtitlePage] = useState(1),
    [subtitleSaved, setSubtitleSaved] = useState('');
  const [summaryMode, setSummaryMode] = useState<VideoNoteMode>('detailed');
  const [summary, setSummary] = useState<VideoNoteResult | null>(null);
  const [subtitleBatch, setSubtitleBatch] = useState<VideoBatchItem[]>([]);
  const [syncTasks, setSyncTasks] = useState<SubtitleSyncTask[]>([]),
    [syncCategory, setSyncCategory] = useState('');
  const [outputs, setOutputs] = useState<LibraryFile[]>([]);
  useEffect(() => setSummary(null), [subtitle]);
  useEffect(() => {
    if (visible && incomingUrl) {
      setUrl(incomingUrl);
      setSeries(null);
      setSelected([]);
      setBatch([]);
      setSubtitle(null);
      setSubtitleSaved('');
      consumeUrl?.();
    }
  }, [visible, incomingUrl]);
  async function refresh() {
    const files = (await invoke('library:list')).filter(
      (f) => !courseName || !f.course || f.course === courseName,
    );
    setPdfs(files.filter((f) => f.category === 'PPT' && f.name.endsWith('-视频课件.pdf')));
    setOutputs(
      files.filter(
        (f) =>
          (f.category === '语音原文' || f.category === '笔记') &&
          /\.(srt|vtt|txt|md|docx|pdf|svg)$/i.test(f.name),
      ),
    );
    setPending(await invoke('video-ppt:pending'));
    setSyncTasks(await invoke('subtitle-sync:list'));
  }
  useEffect(() => {
    if (visible) void refresh().catch((e) => setError(String(e)));
  }, [visible, courseName]);
  useEffect(
    () =>
      window.assistant.onEvent((e) => {
        if (working.current && e.kind === 'progress') setProgress(e.data.message);
        if (working.current && e.kind === 'video-batch') setBatch(e.items);
      }),
    [],
  );
  async function run(fn: () => Promise<void>) {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      working.current = false;
      setBusy(false);
      void refresh().catch((e) =>
        setError((current) => current || '任务列表刷新失败：' + errorMessage(e)),
      );
    }
  }
  async function load(args: unknown) {
    setReview(null);
    setSource(null);
    setSaved(null);
    setChecked(false);
    setSource(await invoke('video-ppt:source', args));
  }
  async function open(path: string, reveal = false) {
    await run(async () => {
      await invoke(reveal ? 'library:reveal' : 'library:open-file', { path });
    });
  }
  const active = learningViews.find((item) => item.id === view)!;
  const isVideo = view === 'videoPpt',
    isSubtitles = view === 'videoSubtitles',
    isNotes = view === 'videoNotes',
    isTasks = view === 'videoTasks';
  const kept = review?.pages.filter((p) => p.keep).length || 0;
  return (
    <section
      className="ppt-extract-page video-ppt-page learning-window"
      aria-label={active.title}
      hidden={!visible}
      style={!visible ? { display: 'none' } : undefined}
    >
      <aside className="learning-menu" aria-label="视频学习导航">
        <h2>视频学习</h2>
        <p>
          把课程视频整理成
          <br />
          可复习的字幕、课件和笔记
        </p>
        {learningViews.map((item) => (
          <button
            key={item.id}
            className={view === item.id ? 'active' : ''}
            aria-current={view === item.id ? 'page' : undefined}
            onClick={() => select(item.id)}
          >
            <LearningIcon view={item.id} />
            <span>{item.title}</span>
          </button>
        ))}
        <button onClick={close}>
          <span>返回课程对话</span>
        </button>
      </aside>
      <div className="learning-content">
        <header>
          <div>
            <h2>{active.title}</h2>
            <p>{active.description}</p>
          </div>
          <span className="learning-course" title={courseName}>
            {courseName || '未分类资料'}
          </span>
        </header>
        <div className="ppt-extract-form">
          {!isTasks && !isNotes && (
            <VideoSourceCard
              url={url}
              busy={busy}
              setUrl={setUrl}
              setSeries={setSeries}
              setSelected={setSelected}
              setBatch={setBatch}
              setSubtitle={setSubtitle}
              setSubtitleSaved={setSubtitleSaved}
              isVideo={isVideo}
              run={run}
              setSource={setSource}
              setReview={setReview}
              setSaved={setSaved}
              prompt={prompt}
              courseId={courseId}
            />
          )}
          {!isTasks && !isNotes && (
            <VideoSeriesPicker
              busy={busy}
              url={url}
              run={run}
              setSeries={setSeries}
              setSelected={setSelected}
              setBatch={setBatch}
              setFilter={setFilter}
              setSubtitlePage={setSubtitlePage}
              setProgress={setProgress}
              series={series}
              filter={filter}
              selected={selected}
              batch={batch}
              open={open}
              isVideo={isVideo}
              setSaved={setSaved}
              setSource={setSource}
              setReview={setReview}
              prompt={prompt}
              courseId={courseId}
            />
          )}
          {isSubtitles && (
            <VideoSubtitlePanel
              busy={busy}
              run={run}
              courseId={courseId}
              setSubtitle={setSubtitle}
              setSubtitleSaved={setSubtitleSaved}
              series={series}
              subtitlePage={subtitlePage}
              setSubtitlePage={setSubtitlePage}
              url={url}
              subtitle={subtitle}
              setProgress={setProgress}
              select={select}
              subtitleSaved={subtitleSaved}
            />
          )}
          {series && isSubtitles && (
            <section className="video-course-picker" aria-label="批量获取分集字幕">
              <header>
                <div>
                  <h3>批量获取分集字幕</h3>
                  <p className="hint">
                    使用上方勾选的分集；优先保存站内字幕，没有字幕时逐集离线转写。每集单独保存，成功后清理该集临时视频。
                  </p>
                </div>
                <button
                  className="primary"
                  disabled={busy || !selected.length}
                  onClick={() =>
                    void run(async () => {
                      setSubtitleBatch([]);
                      const result = await invoke('video-ppt:batch-subtitles', {
                        url,
                        pages: selected,
                        courseId: courseId || undefined,
                      });
                      setSubtitleBatch(result);
                      setProgress(
                        `字幕处理完成：成功 ${result.filter((i) => i.status === '已完成').length}，失败 ${result.filter((i) => i.status === '失败').length}`,
                      );
                    })
                  }
                >
                  获取所选分集字幕（{selected.length}）
                </button>
              </header>
              {subtitleBatch.map((item) => (
                <div className="video-course-toolbar" key={item.page}>
                  <span>
                    P{item.page} · {item.title} · {item.status}
                  </span>
                  {item.path && (
                    <button disabled={busy} onClick={() => void open(item.path!)}>
                      打开字幕
                    </button>
                  )}
                  {item.error && <span role="alert">{item.error}</span>}
                </div>
              ))}
            </section>
          )}
          {series && isSubtitles && (
            <section className="knowledge-card" aria-label="同步字幕到知识库">
              <header>
                <div>
                  <h3>同步字幕到知识库</h3>
                  <p className="hint">
                    仅同步上方勾选的分集，保留分集网址和字幕版本。相同内容重复同步不新增资料；同时保存课程
                    SRT。没有站内字幕时保留失败记录，可离线转写后为该分集选择已有 SRT。
                  </p>
                </div>
              </header>
              <div className="row">
                <label>
                  知识库分类
                  <input
                    aria-label="字幕知识库分类"
                    placeholder={courseName || '未分类'}
                    disabled={busy}
                    value={syncCategory}
                    onChange={(e) => setSyncCategory(e.target.value)}
                  />
                </label>
                <button
                  className="primary"
                  disabled={busy || !selected.length}
                  onClick={() =>
                    void run(async () => {
                      const task = await invoke('subtitle-sync:start', {
                        url,
                        pages: selected,
                        category: syncCategory.trim() || courseName || '',
                        courseId: courseId || undefined,
                      });
                      setSyncTasks((current) => [
                        task,
                        ...current.filter((item) => item.id !== task.id),
                      ]);
                      setProgress(
                        `同步结束：完成 ${task.items.filter((item) => item.status === '已完成').length}，失败 ${task.items.filter((item) => item.status === '失败').length}`,
                      );
                    })
                  }
                >
                  同步所选字幕（{selected.length}）
                </button>
              </div>
              <p className="hint">笔记、导图和 PDF 沿用对应页面的生成按钮，由你选择是否生成。</p>
            </section>
          )}
          {(isTasks || isSubtitles) && (
            <SubtitleBatchRecords
              visible={visible}
              tasks={syncTasks}
              busy={busy}
              run={run}
              refresh={refresh}
              courseName={courseName}
            />
          )}
          {isNotes && (
            <VideoNotesPanel
              busy={busy}
              run={run}
              courseId={courseId}
              setSubtitle={setSubtitle}
              setSubtitleSaved={setSubtitleSaved}
              summaryMode={summaryMode}
              setSummaryMode={setSummaryMode}
              subtitle={subtitle}
              setSummary={setSummary}
              summary={summary}
              open={open}
              setProgress={setProgress}
            />
          )}
          {isVideo && (
            <div className="video-options">
              <details className="video-option">
                <summary>
                  <span className="video-option-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M4 7h16M4 17h16M8 4v6M16 14v6" />
                    </svg>
                  </span>
                  <span>手动检查与调整</span>
                  <span className="video-option-chevron" aria-hidden="true" />
                </summary>
                <div className="video-option-body">
                  <button
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        const path = await invoke('video-ppt:pick');
                        if (path) await load({ path });
                      })
                    }
                  >
                    手动框选已下载视频
                  </button>
                </div>
              </details>
              <details className="video-option">
                <summary>
                  <span className="video-option-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M8 4h8l4 4v12H4V4h4M15 4v5h5M8 13h8M8 17h5" />
                    </svg>
                  </span>
                  <span>处理提示词</span>
                  <span className="video-option-chevron" aria-hidden="true" />
                </summary>
                <div className="video-option-body">
                  <textarea
                    aria-label="视频处理提示词"
                    value={prompt}
                    disabled={busy}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                  <button disabled={busy} onClick={() => setPrompt(defaultVideoPrompt)}>
                    恢复默认提示词
                  </button>
                </div>
              </details>
            </div>
          )}
          {isVideo && (
            <p className="hint">
              保存到：{courseName || '未分类资料'}。全程后台下载、裁剪和去重，PDF
              检查成功后清理本次视频和临时图片。
            </p>
          )}
        </div>
        {error && (
          <div className="alert" role="alert">
            {error}
          </div>
        )}
        {progress && (
          <div className="learning-status" role="status">
            <span>{progress}</span>
            {busy && <button onClick={() => void invoke('cancel')}>取消任务</button>}
          </div>
        )}
        {isVideo && source && !review && !saved && (
          <VideoRegionPicker
            source={source}
            busy={busy}
            setSource={setSource}
            run={run}
            setChecked={setChecked}
            setReview={setReview}
            prompt={prompt}
          />
        )}
        {isVideo && review && !saved && (
          <SlideReview
            kept={kept}
            review={review}
            checked={checked}
            busy={busy}
            setChecked={setChecked}
            run={run}
            setSaved={setSaved}
            courseId={courseId}
            refresh={refresh}
            setProgress={setProgress}
            setReview={setReview}
          />
        )}
        {isVideo && saved && (
          <footer>
            <strong>
              已保存 {saved.kept} 页 PDF ·{' '}
              {saved.cleaned ? '本次视频和临时文件已清理' : '临时文件已保留'}
            </strong>
            {saved.cleanupWarning && <p role="alert">{saved.cleanupWarning}</p>}
            <input aria-label="视频 PDF 输出路径" readOnly value={saved.path} />
            <button onClick={() => void open(saved.path)}>打开 PDF</button>
            <button onClick={() => void open(saved.path, true)}>在文件夹中查看</button>
          </footer>
        )}
        {isTasks && !!pending.length && (
          <PendingVideoTasks
            pending={pending}
            busy={busy}
            run={run}
            setSubtitle={setSubtitle}
            setSubtitleSaved={setSubtitleSaved}
            setProgress={setProgress}
            select={select}
            setSource={setSource}
            setReview={setReview}
            setSaved={setSaved}
            setChecked={setChecked}
          />
        )}
        {(isVideo || isTasks) && (
          <section className="ppt-export-history" aria-label="视频课件 PDF">
            <header>
              <h3>已保存的 PDF</h3>
              <button onClick={files}>查看课程文件</button>
            </header>
            {pdfs.map((f) => (
              <article key={f.path}>
                <strong>{f.name}</strong>
                <button onClick={() => void open(f.path)}>打开 PDF</button>
                <button onClick={() => void open(f.path, true)}>定位</button>
              </article>
            ))}
          </section>
        )}
        {isTasks && !!outputs.length && (
          <section className="ppt-export-history">
            <header>
              <h3>课程字幕与笔记</h3>
              <button onClick={files}>查看全部文件</button>
            </header>
            {outputs.map((file) => (
              <article key={file.path}>
                <div>
                  <strong>{file.name}</strong>
                  <p className="hint">
                    {file.category} · {file.course || '未分类'}
                  </p>
                </div>
                {!/\.(vtt|svg)$/i.test(file.name) && (
                  <button disabled={busy} onClick={() => void open(file.path)}>
                    打开
                  </button>
                )}
                <button disabled={busy} onClick={() => void open(file.path, true)}>
                  定位
                </button>
              </article>
            ))}
          </section>
        )}
        {isTasks && !pending.length && !pdfs.length && !outputs.length && (
          <div className="learning-empty">
            <LearningIcon view="videoTasks" />
            <h3>暂无视频任务</h3>
            <p>完成的课件和需要继续的任务会显示在这里。</p>
          </div>
        )}
      </div>
    </section>
  );
}
