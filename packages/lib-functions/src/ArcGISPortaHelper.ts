import Portal from '@arcgis/core/portal/Portal';
import {
    createGroup,
    IGroup,
    IGroupAdd,
    IItem,
    IUser,
    searchGroups,
    SearchQueryBuilder,
} from '@esri/arcgis-rest-portal';
import { UserSession } from '@esri/arcgis-rest-auth';
import Request from '@arcgis/core/request';

/**
 * Create group response object.
 */
export interface CreateGroupResponseProp {
    group?: IGroup;
    success: boolean;
    error?: string;
}

/**
 * Search portal group response
 */
interface SearchPortalResponseProp {
    item: IItem[] | IUser[] | IGroup[] | any[];
    success: boolean;
}

/**
 * Get the current portal user.
 * Returns the current portal user's data object or null if not found.
 */
export async function loadPortalUser(): Promise<__esri.PortalUser | null> {
    console.debug('Authenticating');
    const portal = new Portal();

    try {
        await portal.load();
        if (portal.user) {
            return portal.user;
        }
    } catch (error) {
        portal.loadError && console.error(portal.loadError.details);
        portal.loadWarnings &&
            portal.loadWarnings.length > 0 &&
            console.error((portal.loadWarnings as string[]).toString());
        throw new Error('Failed to load Portal. Check proper certificates are installed.');
    }
    return null;
}

/**
 * Create a portal group.
 * @param groupAdd a collection of IGroupAdd properties
 * @param userSession userSession for user making group
 * @param portalUrl portalRestUrl
 */
export async function createPortalGroup(
    groupAdd: IGroupAdd,
    userSession: UserSession,
    portalUrl: string
): Promise<CreateGroupResponseProp> {
    const session = userSession;
    console.debug(portalUrl);
    const result: CreateGroupResponseProp = {
        group: undefined,
        success: false,
        error: undefined,
    };

    await createGroup({
        group: {
            title: groupAdd.title,
            access: groupAdd.access,
            description: groupAdd.description,
            snippet: groupAdd.snippet,
            tags: groupAdd.tags,
            categories: groupAdd.categories,
            isViewOnly: false, //users can add content
            isInvitationOnly: true, //
            sortField: groupAdd.sortField !== undefined ? groupAdd.sortField : 'title',
            sortOrder: groupAdd.sortOrder !== undefined ? groupAdd.sortOrder : 'asc',
            capabilities: groupAdd.capabilities !== undefined ? groupAdd.capabilities : '',
        },
        authentication: session,
        portal: portalUrl,
    })
        .then((res) => {
            result.success = res.success;
            result.group = res.group;
        })
        .catch((error) => {
            console.error('Error making group', 'ERROR');
            result.error = error.response.error.details[0];
        });
    return result;
}

/**
 * Find a portal group that has a certain tag.
 * @param tag portal tag
 * @param session user session for authentication
 */
export async function findPortalGroupsByTag(tag: string, session: UserSession): Promise<SearchPortalResponseProp> {
    let resultObj: SearchPortalResponseProp = {
        item: [],
        success: false,
    };
    const query = new SearchQueryBuilder().match(tag).in('tags');
    await searchGroups({
        num: 100,
        sortField: 'created',
        sortOrder: 'desc',
        q: query,
        authentication: session,
    })
        .then((result) => {
            resultObj = {
                item: result.results,
                success: true,
            };
        })
        .catch((error) => {
            console.error(error);
        });
    return resultObj;
}

/**
 * Checks if a given user is associated with a specified group (as owner, admin, or member).
 *
 * @param groupId - The ID of the group to check.
 * @param userName - The username to look for.
 * @param userSession - The authenticated user session.
 * @param portalUrl - The base URL of the ArcGIS portal.
 * @returns A Promise that resolves to true if the user is in the group, otherwise false.
 */
export const checkIsUserInGroup = async (
    groupId: string,
    userName: string,
    userSession: UserSession,
    portalUrl: string
): Promise<boolean> => {
    if (!groupId || !portalUrl) {
        console.error('checkIsUserInGroup: groupId and portalUrl are required.');
        return false;
    }

    const requestUrl = `${portalUrl}/sharing/rest/community/groups/${groupId}/users`;

    try {
        const response = await Request(requestUrl, {
            query: {
                f: 'json',
                num: 5000, // Max number of users returned; adjust if needed
                start: 1,
            },
            method: 'post',
            authentication: userSession,
        } as __esri.RequestOptions);

        const { owner, admins = [], users = [] } = response.data;

        return owner === userName || admins.includes(userName) || users.includes(userName);
    } catch (error) {
        console.error(`checkIsUserInGroup: Failed to fetch group users for group ${groupId}`, error);
        return false;
    }
};
