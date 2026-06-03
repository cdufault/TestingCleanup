import PortalUser from '@arcgis/core/portal/PortalUser';
import PortalGroup from '@arcgis/core/portal/PortalGroup';
import { UserSession } from '@esri/arcgis-rest-auth';
import { IGroupUsersResult } from '@esri/arcgis-rest-portal';
/**The status type that can be associated between a user and a role */
export type UserRoleStatus = true | 'INSUFFICIENT_PRIVILEGES' | false;
/**
 * Get the status for a given portal user.
 * @param portalUser the portal user
 * @param tag a valid portal tag
 * @param privileges an array of privileges
 * Returns a UserRoleStatus type: true | 'INSUFFICIENT_PRIVILEGES' | false
 */
export declare function getRoleStatus(portalUser: PortalUser, tag: string, privileges: string[]): Promise<UserRoleStatus>;
/**
 * Find the first group with the matching tag.
 * @param groups an array of portal group objects
 * @param tag the tag to search for on the group
 * Returns the matching group or undefined if no group in the array had the tag
 */
export declare function getUserGroup(groups: PortalGroup[], tag: string): PortalGroup | undefined;
/**
 * Gets the members for a given group.
 * @param groupId The group ID to filter users by
 * @returns IGroupUsersResult
 */
export declare function getPortalGroupMembers(portalRestUrl: string, session: UserSession, groupId: string): Promise<IGroupUsersResult>;
