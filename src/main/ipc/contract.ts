// The renderer-facing contract, derived from the handler tables themselves so it cannot drift:
// an action exists exactly when a handler defines it, and its result type is what that
// function returns. Import this file with `import type` only — it must not pull main-process
// code into the renderer bundle.
import type { IpcHandler } from './handler';
import type { createCoursesHandler } from './courses';
import type { createCoursewareHandler } from './courseware';
import type { createDesktopHandler } from './desktop';
import type { createKnowledgeHandler } from './knowledge';
import type { createLearningHandler } from './learning';
import type { createResourcesHandler } from './resources';
import type { createStudyHandler } from './study';

type TableOf<Factory extends (...args: never[]) => unknown> =
  ReturnType<Factory> extends IpcHandler<infer Table> ? Table : never;

export type IpcTable = TableOf<typeof createCoursesHandler> &
  TableOf<typeof createCoursewareHandler> &
  TableOf<typeof createDesktopHandler> &
  TableOf<typeof createKnowledgeHandler> &
  TableOf<typeof createLearningHandler> &
  TableOf<typeof createResourcesHandler> &
  TableOf<typeof createStudyHandler>;

/** Every action name the main process answers. */
export type IpcAction = keyof IpcTable & string;

/** What the main process returns for an action, as the handler's code produces it. */
export type IpcResult<Action extends IpcAction> = Awaited<ReturnType<IpcTable[Action]>>;
