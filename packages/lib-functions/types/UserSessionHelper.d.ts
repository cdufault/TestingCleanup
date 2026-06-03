import { UserSession } from '@esri/arcgis-rest-auth';
/**
 * Get a session object for the current user.
 * @param portalUrl URL to the default portal
 * @param oauthAppId
 * Returns the session object or undefined if no user session can be established.
 */
export declare function getPortalUserSession(portalUrl: string, oauthAppId: string): Promise<UserSession | undefined>;
