import type { MediaCatalog } from '../../shared/media';
import { type Options, labels, sponsorHelp } from './media-download-shared';

export function MediaSourcePanel({
  source,
  busy,
  selected,
  setSelected,
  options,
  set,
  enums,
  run,
  enqueue,
}: {
  source: MediaCatalog;
  busy: boolean;
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
  options: Options;
  set: (key: string, value: string | number | boolean | null) => void;
  enums: Record<string, (string | number)[]>;
  run: (fn: () => Promise<void>) => Promise<void>;
  enqueue: () => Promise<void>;
}) {
  return (
    <div className="media-source">
      <h4>{source.title}</h4>
      {source.playlist ? (
        <>
          <p className="hint">只下载勾选条目。{source.limited ? '目录只列出前 100 项。' : ''}</p>
          <div className="batch-options">
            {source.entries?.map((item) => (
              <label key={item.url}>
                <input
                  type="checkbox"
                  disabled={busy}
                  checked={selected.includes(item.url)}
                  onChange={(e) =>
                    setSelected(
                      e.target.checked
                        ? [...selected, item.url]
                        : selected.filter((link) => link !== item.url),
                    )
                  }
                />
                {item.title}
              </label>
            ))}
          </div>
        </>
      ) : (
        <p className="hint">
          {source.duration && source.duration > 0
            ? '时长 ' + Math.round(source.duration) + ' 秒'
            : '时长未提供'}{' '}
          · 可用字幕 {source.subtitles?.join('、') || '未提供'}
        </p>
      )}
      <div className="media-options">
        {['height', 'audio_only', 'subtitle_only', 'subtitles', 'container', 'audio_format'].map(
          (key) => (
            <label key={key}>
              {labels[key]}
              {typeof options[key] === 'boolean' ? (
                <input
                  type="checkbox"
                  checked={!!options[key]}
                  disabled={busy}
                  onChange={(e) => set(key, e.target.checked)}
                />
              ) : (
                <select
                  disabled={busy}
                  value={String(options[key])}
                  onChange={(e) =>
                    set(key, key === 'height' ? Number(e.target.value) : e.target.value)
                  }
                >
                  {(enums[key] || []).map((value) => (
                    <option key={value} value={value}>
                      {value === 0
                        ? '自动'
                        : value === 'auto'
                          ? '自动'
                          : value === 'best'
                            ? '最高质量'
                            : value}
                    </option>
                  ))}
                </select>
              )}
            </label>
          ),
        )}
      </div>
      <details className="media-advanced">
        <summary>更多下载选项</summary>
        <div className="media-options">
          {Object.keys(labels)
            .filter(
              (key) =>
                ![
                  'height',
                  'audio_only',
                  'subtitle_only',
                  'subtitles',
                  'container',
                  'audio_format',
                ].includes(key),
            )
            .map((key) => (
              <label key={key}>
                {labels[key]}
                {typeof options[key] === 'boolean' ? (
                  <input
                    type="checkbox"
                    checked={!!options[key]}
                    disabled={busy}
                    onChange={(e) => set(key, e.target.checked)}
                  />
                ) : enums[key] ? (
                  <select
                    disabled={busy}
                    value={String(options[key])}
                    onChange={(e) => set(key, e.target.value)}
                  >
                    {enums[key]
                      .filter((value) => value !== 'aria2c')
                      .map((value) => (
                        <option key={value} value={value}>
                          {value === 'auto' ? '自动' : value === 'best' ? '最高质量' : value}
                        </option>
                      ))}
                  </select>
                ) : (
                  <input
                    disabled={busy}
                    type={
                      typeof options[key] === 'number' || ['clip_start', 'clip_end'].includes(key)
                        ? 'number'
                        : 'text'
                    }
                    value={options[key] === null ? '' : String(options[key] ?? '')}
                    onChange={(e) =>
                      set(
                        key,
                        ['clip_start', 'clip_end'].includes(key)
                          ? e.target.value === ''
                            ? null
                            : Number(e.target.value)
                          : typeof options[key] === 'number'
                            ? Number(e.target.value)
                            : e.target.value,
                      )
                    }
                    title={key === 'sponsorblock' ? sponsorHelp : undefined}
                    placeholder={
                      key === 'format_ids'
                        ? '自动选择；可填下方编号'
                        : key === 'sponsorblock'
                          ? '留空不移除；例如 sponsor,intro'
                          : undefined
                    }
                  />
                )}
              </label>
            ))}
        </div>
        {source.formats?.length && (
          <details>
            <summary>查看精确格式编号</summary>
            <div className="media-format-list">
              {source.formats.map((f) => (
                <p key={f.id}>
                  {f.id} · {f.height || '音频'} · {f.extension} · {f.video_codec} / {f.audio_codec}
                </p>
              ))}
            </div>
          </details>
        )}
      </details>
      <button
        className="primary"
        disabled={busy || (source.playlist && !selected.length)}
        onClick={() => void run(enqueue)}
      >
        下载所选媒体（{source.playlist ? selected.length : 1}）
      </button>
    </div>
  );
}
