import type { LearningView } from './LearningNav';

/** Which page or dialog is shown over the course conversation; `null` is the conversation itself. */
export type AppModal =
  | 'course'
  | 'lecture'
  | 'settings'
  | 'materials'
  | 'modelPicker'
  | 'zhiyun'
  | 'zhiyunLogin'
  | 'courseware'
  | 'transcript'
  | 'files'
  | 'identity'
  | 'appearance'
  | 'pptExtract'
  | LearningView
  | 'study'
  | 'knowledge'
  | 'biliResources'
  | 'visual';

/** The tabs of an open lecture. */
export type LectureTab = 'chat' | 'activity' | 'subtitles' | 'notes' | 'practice';

export type SetAppModal = React.Dispatch<React.SetStateAction<AppModal | null>>;
export type SetLectureTab = React.Dispatch<React.SetStateAction<LectureTab>>;
