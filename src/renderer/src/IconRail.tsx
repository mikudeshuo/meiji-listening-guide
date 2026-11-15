import { ResourceIcon } from './BiliResources';
import { KnowledgeIcon } from './KnowledgeIcon';
import { LearningRail } from './LearningNav';
import { ListeningBuddy } from './ListeningBuddy';
import { FolderNavIcon } from './ManagementIcons';
import {
  MessageNavIcon,
  ModelNavIcon,
  IdentityNavIcon,
  LoginNavIcon,
  CloudExportNavIcon,
  AppearanceNavIcon,
  PptExtractNavIcon,
} from './SidebarIcons';
import { StudyIcon } from './StudyIcon';
import { VisualIcon } from './VisualAnalysis';
import type { SetAppModal } from './app-state';

export function IconRail({
  modal,
  setModal,
  setSettingsApi,
}: {
  modal: string | null;
  setModal: SetAppModal;
  setSettingsApi: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <nav className="app-icon-rail">
      <span className="rail-logo">
        <ListeningBuddy />
      </span>
      <button
        className={modal === null ? 'active' : ''}
        title="课程对话"
        aria-label="课程对话"
        onClick={() => setModal(null)}
      >
        <MessageNavIcon />
      </button>
      <button
        className={modal === 'settings' || modal === 'modelPicker' ? 'active' : ''}
        title="模型库"
        aria-label="模型库"
        onClick={() => {
          setSettingsApi(true);
          setModal('settings');
        }}
      >
        <ModelNavIcon />
      </button>
      <button
        title="角色与头像"
        aria-label="角色与头像"
        className={modal === 'identity' ? 'active' : ''}
        onClick={() => setModal('identity')}
      >
        <IdentityNavIcon />
      </button>
      <button
        title="智云登录"
        aria-label="智云登录"
        className={modal === 'zhiyunLogin' ? 'active' : ''}
        onClick={() => setModal('zhiyunLogin')}
      >
        <LoginNavIcon />
      </button>
      <button
        title="智云搜索与导出"
        aria-label="智云搜索与导出"
        className={modal === 'zhiyun' ? 'active' : ''}
        onClick={() => setModal('zhiyun')}
      >
        <CloudExportNavIcon />
      </button>
      <button
        title="文件管理"
        aria-label="文件管理"
        className={modal === 'files' ? 'active' : ''}
        onClick={() => setModal('files')}
      >
        <FolderNavIcon />
      </button>
      <button
        title="聊天外观"
        aria-label="聊天外观"
        className={modal === 'appearance' ? 'active' : ''}
        onClick={() => setModal('appearance')}
      >
        <AppearanceNavIcon />
      </button>
      <button
        title="截取 PPT"
        aria-label="截取 PPT"
        className={modal === 'pptExtract' ? 'active' : ''}
        onClick={() => setModal('pptExtract')}
      >
        <PptExtractNavIcon />
      </button>
      <LearningRail current={modal} select={setModal} />
      <button
        title="视频资源"
        aria-label="视频资源"
        className={modal === 'biliResources' ? 'active' : ''}
        onClick={() => setModal('biliResources')}
      >
        <ResourceIcon />
      </button>
      <button
        title="画面识别"
        aria-label="画面识别"
        className={modal === 'visual' ? 'active' : ''}
        onClick={() => setModal('visual')}
      >
        <VisualIcon />
      </button>
      <button
        title="知识库"
        aria-label="知识库"
        className={modal === 'knowledge' ? 'active' : ''}
        onClick={() => setModal('knowledge')}
      >
        <KnowledgeIcon />
      </button>
      <button
        title="课表与教材"
        aria-label="课表与教材"
        className={modal === 'study' ? 'active' : ''}
        onClick={() => setModal('study')}
      >
        <StudyIcon name="notes" />
      </button>
      <div className="rail-spacer" />
    </nav>
  );
}
