import PortalUser from '@arcgis/core/portal/PortalUser';
import { UserRoleStatus } from '../contexts/App';
import PortalGroup from '@arcgis/core/portal/PortalGroup';

export async function getRoleStatus(
    portalUser: PortalUser,
    tag: string,
    privileges: string[]
): Promise<UserRoleStatus> {
    const groups = await portalUser.fetchGroups();

    if (getUserGroup(groups, tag)) {
        if (privileges.every((privilege) => (portalUser as any).privileges.includes(privilege))) {
            return true;
        }
        return 'INSUFFICIENT_PRIVILIGES';
    }
    return false;
}

export function getUserGroup(groups: PortalGroup[], tag: string): PortalGroup | undefined {
    return groups.find((group) => group.tags.includes(tag));
}
