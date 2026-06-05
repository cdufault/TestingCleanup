import { ConfigHelper } from '../helpers/configHelper';

const DEFAULT_MISSION = `${ConfigHelper.getAppConfig()?.appLabel ?? ''} Default`.trim();
const DEFAULT_VIEW = 'viewDefault';

const DEFAULT_WORKSPACE = 'viewWorkspace';

export { DEFAULT_MISSION, DEFAULT_VIEW, DEFAULT_WORKSPACE };
