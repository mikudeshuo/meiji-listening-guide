/** A subtitle track fetched or transcribed for one video part. */
export type BiliSubtitle = {
  title: string;
  page: number;
  source: string;
  warning: string;
  srt: string;
  count: number;
  savedPath?: string;
};
export const time = (s: number) =>
  `${Math.floor(s / 3600) ? Math.floor(s / 3600) + ':' : ''}${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(Math.floor(s) % 60).padStart(2, '0')}`;
