import { app } from 'electron';
import { join } from 'node:path';

/** Folder holding bundled runtime components (models, FFmpeg, Codex): next to the exe when packaged, `resources/` in development. */
export const resourcesDirectory = () =>
  app.isPackaged ? process.resourcesPath : join(app.getAppPath(), 'resources');
