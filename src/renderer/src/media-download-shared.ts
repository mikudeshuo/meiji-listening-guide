import type { MediaJob } from '../../shared/media';

export type Options = Record<string, string | number | boolean | null>;
export type LoginProfile = { id: string; name: string; site: string; count: number };
export const labels: Record<string, string> = {
  height: '最高画质',
  audio_quality: '音频质量',
  audio_only: '只保存音频',
  subtitle_only: '只保存字幕',
  subtitles: '同时下载字幕',
  auto_subtitles: '包含自动字幕',
  translated_subtitles: '包含翻译字幕',
  subtitle_languages: '字幕语言',
  subtitle_format: '字幕格式',
  embed_subtitles: '嵌入字幕',
  keep_subtitles: '保留独立字幕',
  container: '视频格式',
  audio_format: '音频格式',
  audio_bitrate: '音频比特率（0 为自动）',
  video_codec: '视频编码',
  format_ids: '精确格式',
  format_sort: '格式优先顺序',
  merge_audio: '保留多个音轨',
  thumbnail: '下载封面',
  embed_thumbnail: '嵌入封面',
  crop_artwork: '封面裁成方形',
  metadata: '写入媒体信息',
  chapters: '保留章节',
  split_chapters: '按章节拆分',
  clip_start: '片段开始秒数',
  clip_end: '片段结束秒数',
  sponsorblock: '移除片段类型',
  rate_kbps: '速度上限 KB/s（0 不限）',
  concurrent_fragments: '并行片段数',
  retries: '失败重试次数',
  force_ipv4: '使用 IPv4',
  proxy: '代理地址',
  restrict_filenames: '简化文件名',
  skip_existing: '跳过已核验的相同下载',
  filename_template: '文件名格式',
  custom_args: '下载调节参数',
  folder_layout: '目录整理方式',
};
export const active = (job: MediaJob) => ['queued', 'running'].includes(job.state);
export const sponsorHelp =
  'YouTube 可填 sponsor、intro、outro 等，多个分类用逗号分隔；依据 SponsorBlock 社区标注移除，字幕与章节同步调整。与仅字幕、按章节拆分请分别建立任务。';
export const states: Record<string, string> = {
  queued: '排队中',
  running: '下载中',
  completed: '已完成',
  cancelled: '已取消',
  interrupted: '上次中断',
  error: '失败',
};
