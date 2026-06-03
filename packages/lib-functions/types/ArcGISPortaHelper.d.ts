import { IGroup, IGroupAdd, IItem, IUser } from '@esri/arcgis-rest-portal';
import { UserSession } from '@esri/arcgis-rest-auth';
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
export declare function loadPortalUser(): Promise<__esri.PortalUser | null>;
/**
 * Create a portal group.
 * @param groupAdd a collection of IGroupAdd properties
 * @param userSession userSession for user making group
 * @param portalUrl portalRestUrl
 */
export declare function createPortalGroup(groupAdd: IGroupAdd, userSession: UserSession, portalUrl: string): Promise<CreateGroupResponseProp>;
/**
 * Find a portal group that has a certain tag.
 * @param tag portal tag
 * @param session user session for authentication
 */
export declare function findPortalGroupsByTag(tag: string, session: UserSession): Promise<SearchPortalResponseProp>;
/**
 * Checks if a given user is associated with a specified group (as owner, admin, or member).
 *
 * @param groupId - The ID of the group to check.
 * @param userName - The username to look for.
 * @param userSession - The authenticated user session.
 * @param portalUrl - The base URL of the ArcGIS portal.
 * @returns A Promise that resolves to true if the user is in the group, otherwise false.
 */
export declare const checkIsUserInGroup: (groupId: string, userName: string, userSession: UserSession, portalUrl: string) => Promise<boolean>;
export {};
