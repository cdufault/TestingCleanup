import { UserSession } from '@esri/arcgis-rest-auth';
import { getPortalUserSession } from '@stratcom/lib-functions';
import { ConfigHelper } from './configHelper';

/**
 * Get a session object for the current user.
 * Return the session object or undefined if not found.
 */
export async function getUserSession(): Promise<UserSession | undefined> {
    const appConfig = await ConfigHelper.loadAppConfig();
    return await getPortalUserSession(appConfig ? appConfig.portalUrl : '', appConfig ? appConfig.oauthAppId : '');
}
