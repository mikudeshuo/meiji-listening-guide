import { useState, useEffect } from 'react';
import type { Settings } from '../../shared/types';
import { CodexSettings } from './CodexSettings';
import { DeepSeekSettings } from './DeepSeekSettings';
import { RuntimePanel } from './RuntimePanel';
import { Modal } from './UiParts';

export function SettingsPanel({
  onZhiyunLogin,
  initial,
  error,
  close,
  save,
  busy,
  task,
  rightWidth,
  onApiVisible,
}: {
  onZhiyunLogin: () => void;
  rightWidth: number;
  onApiVisible: (visible: boolean) => void;
  initial: Settings;
  error: string;
  close: () => void;
  save: (s: Settings) => Promise<boolean>;
  busy: boolean;
  task: (fn: () => Promise<unknown>) => Promise<boolean>;
}) {
  const [value, setValue] = useState(initial),
    [prompt, setPrompt] = useState('correction'),
    [section, setSection] = useState(initial.connection === 'deepseek' ? 'deepseek' : 'api'),
    [saved, setSaved] = useState(false);
  const update = (patch: Partial<Settings>) => {
    setValue((v) => ({ ...v, ...patch }));
    setSaved(false);
  };
  useEffect(() => {
    setValue(initial);
  }, [initial]);
  useEffect(
    () => onApiVisible(section === 'api' || section === 'deepseek'),
    [section, onApiVisible],
  );
  const navigation = (
    <>
      {[
        ['api', 'ChatGPT 账号'],
        ['deepseek', 'DeepSeek API'],
        ['search', '搜索与主题'],
        ['prompts', '提示词'],
        ['runtime', '运行组件'],
      ].map(([id, name]) => (
        <button className={section === id ? 'active' : ''} key={id} onClick={() => setSection(id)}>
          {name}
        </button>
      ))}
    </>
  );
  if (section === 'api' || section === 'deepseek')
    return (
      <div
        className="model-settings-window"
        style={{ right: rightWidth }}
        role="dialog"
        aria-modal="true"
        aria-label="设置"
      >
        {section === 'deepseek' ? (
          <DeepSeekSettings
            value={value}
            update={update}
            busy={busy}
            close={close}
            save={() =>
              void save({
                ...value,
                connection: 'deepseek',
                activeProfile:
                  (
                    value.profiles.find(
                      (p) => p.id === value.activeProfile && p.provider === 'deepseek',
                    ) || value.profiles.find((p) => p.provider === 'deepseek')
                  )?.id || '',
              }).then((ok) => setSaved(ok))
            }
            navigation={navigation}
          />
        ) : (
          <CodexSettings
            value={value}
            update={update}
            busy={busy}
            close={close}
            save={() => void save({ ...value, connection: 'codex' }).then((ok) => setSaved(ok))}
            navigation={navigation}
          />
        )}{' '}
        {error && <p className="alert">{error}</p>}
        {saved && <p role="status">已保存</p>}
      </div>
    );
  return (
    <Modal title="设置" close={close}>
      <div className="tabs">
        {[
          ['api', 'Codex 账号'],
          ['deepseek', 'DeepSeek API'],
          ['search', '搜索与主题'],
          ['prompts', '提示词'],
          ['runtime', '运行组件'],
        ].map(([id, name]) => (
          <button
            key={id}
            className={section === id ? 'active' : ''}
            onClick={() => setSection(id)}
          >
            {name}
          </button>
        ))}
      </div>
      {section === 'search' && (
        <>
          <label>
            Tavily 搜索 API Key
            <input
              type="password"
              autoComplete="off"
              value={value.searchKey || ''}
              placeholder={
                value.hasSearchKey ? '已加密保存；留空保持原密钥' : '未配置时显示拓展题差额'
              }
              onChange={(e) => update({ searchKey: e.target.value || undefined })}
            />
          </label>
          <label>
            主题
            <select
              value={value.theme}
              onChange={(e) => update({ theme: e.target.value as Settings['theme'] })}
            >
              <option value="light">浅色</option>
              <option value="dark">深色</option>
            </select>
          </label>
        </>
      )}
      {section === 'prompts' && (
        <>
          <select value={prompt} onChange={(e) => setPrompt(e.target.value)}>
            {Object.keys(value.prompts)
              .filter((p) => p !== 'subtitles')
              .map((p) => (
                <option key={p} value={p}>
                  {(
                    {
                      subtitles: '旧字幕提示词',
                      correction: '原文与 PPT 校订',
                      notes: '教师重点',
                      'past-exam': '历年卷拆题',
                      match: '真题匹配',
                      search: '网上题抽取',
                      answer: '参考解析',
                      chat: '课程追问',
                    } as Record<string, string>
                  )[p] || p}
                </option>
              ))}
          </select>
          <textarea
            className="prompt-editor"
            value={value.prompts[prompt]}
            onChange={(e) => update({ prompts: { ...value.prompts, [prompt]: e.target.value } })}
          />
        </>
      )}
      {section === 'runtime' && <RuntimePanel />}
      <footer>
        {error && (
          <div className="alert" role="alert">
            {error}
          </div>
        )}
        <span className="hint" role="status">
          {saved ? '已保存' : ''}
        </span>
        <button
          className="primary"
          disabled={busy}
          onClick={() => void save(value).then((ok) => setSaved(ok))}
        >
          保存设置
        </button>
      </footer>
    </Modal>
  );
}
