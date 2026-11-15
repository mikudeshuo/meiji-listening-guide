import { useEffect, useState } from 'react';
import type { MediaCatalog, MediaJob } from '../../shared/media';
import { invoke } from './ipc';
import { errorMessage } from '../../shared/errors';
import { MediaSourcePanel } from './MediaSourcePanel';
import { MediaJobList } from './MediaJobList';
import { type LoginProfile, type Options, active } from './media-download-shared';
export function MediaDownloads({ visible }: { visible: boolean }) {
  const [profiles, setProfiles] = useState<LoginProfile[]>([]),
    [profileName, setProfileName] = useState(''),
    [profileSite, setProfileSite] = useState('');
  const [url, setUrl] = useState(''),
    [playlist, setPlaylist] = useState(false),
    [source, setSource] = useState<MediaCatalog | null>(null),
    [selected, setSelected] = useState<string[]>([]);
  const [options, setOptions] = useState<Options>({}),
    [enums, setEnums] = useState<Record<string, (string | number)[]>>({}),
    [jobs, setJobs] = useState<MediaJob[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  async function refresh() {
    setJobs(await invoke('media:list'));
  }
  async function refreshProfiles() {
    setProfiles(await invoke('media:auth-list'));
  }
  useEffect(() => {
    if (visible) void refreshProfiles().catch((reason) => setError(String(reason)));
  }, [visible]);
  useEffect(() => {
    if (!visible) return;
    let stopped = false;
    void invoke<{ defaults: Options; enums: Record<string, string[]>; heights: number[] }>(
      'media:options',
    )
      .then((value) => {
        if (!stopped) {
          setOptions((current) => (Object.keys(current).length ? current : value.defaults));
          setEnums({ ...value.enums, height: value.heights });
        }
      })
      .catch((reason) => !stopped && setError(String(reason)));
    void refresh().catch((reason) => !stopped && setError(String(reason)));
    return () => {
      stopped = true;
    };
  }, [visible]);
  useEffect(() => {
    if (!visible || !jobs.some(active)) return;
    const timer = setTimeout(
      () => void refresh().catch((reason) => setError(String(reason))),
      2000,
    );
    return () => clearTimeout(timer);
  }, [visible, jobs]);
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await fn();
      await refresh();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }
  const set = (key: string, value: string | number | boolean | null) =>
    setOptions((current) => ({ ...current, [key]: value }));
  async function enqueue() {
    if (!source) return;
    const urls = source.playlist ? selected : [source.url];
    let count = 0;
    const failed: string[] = [];
    for (const link of urls) {
      try {
        const item = source.playlist
          ? await invoke<MediaCatalog>('media:catalog', { url: link, options })
          : source;
        await invoke('media:create', { token: item.token, options });
        count++;
      } catch (reason) {
        failed.push(`${link}：${errorMessage(reason)}`);
      }
    }
    setNotice(`已加入 ${count} 个所选下载任务`);
    if (failed.length) setError(failed.join('\n'));
  }
  return (
    <section className="knowledge-card" aria-label="媒体下载">
      <header>
        <div>
          <h3>媒体下载</h3>
          <p className="hint">
            输入公开的视频网址，选择格式后保存到本地。需登录或受限的视频会显示站点错误，不打开网页。
          </p>
        </div>
        <button disabled={busy} onClick={() => void run(refresh)}>
          刷新下载记录
        </button>
      </header>
      <details className="media-advanced">
        <summary>站点登录档案</summary>
        <p className="hint">
          只读取你主动选择的 Netscape cookies.txt，不扫描浏览器。档案由 Windows
          当前用户加密保存；仅发往所填站点域名，不发送给视频 CDN 或其它站点。这里不会显示凭据正文。
        </p>
        <div className="media-options">
          <label>
            档案名称
            <input
              aria-label="登录档案名称"
              value={profileName}
              maxLength={80}
              onChange={(event) => setProfileName(event.target.value)}
            />
          </label>
          <label>
            站点域名
            <input
              aria-label="登录档案站点域名"
              placeholder="例如 youtube.com"
              value={profileSite}
              onChange={(event) => setProfileSite(event.target.value)}
            />
          </label>
          <button
            disabled={busy || !profileName.trim() || !profileSite.trim()}
            onClick={() =>
              void run(async () => {
                const result = await invoke<LoginProfile | null>('media:auth-import', {
                  name: profileName.trim(),
                  site: profileSite.trim(),
                });
                if (result) {
                  await refreshProfiles();
                  setProfileName('');
                  setProfileSite('');
                  setNotice('登录档案已在本机加密保存，使用前请在下方明确选择');
                }
              })
            }
          >
            选择文件并导入
          </button>
          <label>
            下载使用的登录档案
            <select
              aria-label="下载登录档案"
              disabled={busy}
              value={String(options.cookie_profile || '')}
              onChange={(event) =>
                setOptions((current) => ({
                  ...current,
                  cookie_profile: event.target.value,
                  use_cookies: !!event.target.value,
                }))
              }
            >
              <option value="">应用内 B 站会话 / 其它站点公开访问</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} · {profile.site} · {profile.count} 项
                </option>
              ))}
            </select>
          </label>
          <label className="media-check">
            <input
              type="checkbox"
              disabled={busy}
              checked={!!options.privacy}
              onChange={(event) => set('privacy', event.target.checked)}
            />
            加密下载任务记录（媒体文件本身不加密）
          </label>
        </div>
        {profiles.map((profile) => (
          <div className="row" key={profile.id}>
            <span>
              {profile.name} · {profile.site}
            </span>
            <button
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  if (!window.confirm('删除本机保存的此登录档案？原导入文件不会删除。')) return;
                  await invoke('media:auth-remove', { id: profile.id, confirmed: true });
                  if (options.cookie_profile === profile.id)
                    setOptions((current) => ({
                      ...current,
                      cookie_profile: '',
                      use_cookies: false,
                    }));
                  await refreshProfiles();
                })
              }
            >
              删除此档案
            </button>
          </div>
        ))}
      </details>
      <div className="row">
        <input
          aria-label="媒体网址"
          placeholder="视频网址"
          value={url}
          disabled={busy}
          onChange={(e) => {
            setUrl(e.target.value);
            setSource(null);
            setSelected([]);
          }}
        />
        <label className="media-switch">
          <input
            type="checkbox"
            checked={playlist}
            disabled={busy}
            onChange={(e) => {
              setPlaylist(e.target.checked);
              setSource(null);
              setSelected([]);
            }}
          />
          读取播放列表
        </label>
        <button
          disabled={busy || !url.trim()}
          onClick={() =>
            void run(async () => {
              setSource(null);
              setSelected([]);
              setSource(await invoke('media:catalog', { url: url.trim(), playlist, options }));
            })
          }
        >
          读取可用格式
        </button>
      </div>
      {source && (
        <MediaSourcePanel
          source={source}
          busy={busy}
          selected={selected}
          setSelected={setSelected}
          options={options}
          set={set}
          enums={enums}
          run={run}
          enqueue={enqueue}
        />
      )}
      {notice && (
        <p className="learning-status" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
      <MediaJobList jobs={jobs} busy={busy} run={run} />
    </section>
  );
}
