import type { VideoSource, VideoReview } from '../../shared/video-ppt';
import { invoke } from './ipc';
import { time } from './video-ppt-shared';

export function VideoRegionPicker({
  source,
  busy,
  setSource,
  run,
  setChecked,
  setReview,
  prompt,
}: {
  source: VideoSource;
  busy: boolean;
  setSource: React.Dispatch<React.SetStateAction<VideoSource | null>>;
  run: (fn: () => Promise<void>) => Promise<void>;
  setChecked: React.Dispatch<React.SetStateAction<boolean>>;
  setReview: React.Dispatch<React.SetStateAction<VideoReview | null>>;
  prompt: string;
}) {
  return (
    <section className="video-region">
      <h3>确认 PPT 区域 · {time(source.duration)}</h3>
      {source.warning && <p role="alert">{source.warning}</p>}
      <div className="video-region-image">
        <img alt="完整视频画面，确认 PPT 区域" src={source.preview} />
        <div
          style={{
            left: source.crop.left * 100 + '%',
            top: source.crop.top * 100 + '%',
            width: (source.crop.right - source.crop.left) * 100 + '%',
            height: (source.crop.bottom - source.crop.top) * 100 + '%',
          }}
        />
      </div>
      <div className="ppt-crop-inputs">
        {(['left', 'right', 'top', 'bottom'] as const).map((key, i) => (
          <label key={key}>
            {['左边界', '右边界', '上边界', '下边界'][i]} %
            <input
              type="number"
              min="0"
              max="100"
              step=".1"
              aria-label={`PPT ${key}`}
              value={Number((source.crop[key] * 100).toFixed(1))}
              disabled={busy}
              onChange={(e) =>
                setSource({
                  ...source,
                  crop: { ...source.crop, [key]: Number(e.target.value) / 100 },
                })
              }
            />
          </label>
        ))}
      </div>
      <button
        className="primary"
        disabled={busy}
        onClick={() =>
          void run(async () => {
            setChecked(false);
            setReview(
              await invoke('video-ppt:extract', {
                id: source.id,
                crop: source.crop,
                prompt,
              }),
            );
          })
        }
      >
        确认区域，提取整段视频
      </button>
    </section>
  );
}
