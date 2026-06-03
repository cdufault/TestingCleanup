import { ICredential, UserSession } from '@esri/arcgis-rest-auth';
import { getThePortalRestUrl } from './ArcGISPortalItemsHelper';
import IdentityManager from '@arcgis/core/identity/IdentityManager';
import OAuthInfo from '@arcgis/core/identity/OAuthInfo';

/**
 * Get a session object for the current user.
 * @param portalUrl URL to the default portal
 * @param oauthAppId
 * Returns the session object or undefined if no user session can be established.
 */
export async function getPortalUserSession(portalUrl: string, oauthAppId: string): Promise<UserSession | undefined> {
    let userSession: UserSession | undefined = undefined;
    const restUrl = await getThePortalRestUrl(portalUrl);
    if (restUrl) {
        const info = new OAuthInfo({
            appId: oauthAppId,
            portalUrl: portalUrl,
        });
        IdentityManager.registerOAuthInfos([info]);

        const credential = await IdentityManager.getCredential(restUrl).catch((_error) => {
            console.error('Failed to generate a valid user session from IdentityManager. ' + _error);
            return userSession;
        });

        userSession = UserSession.fromCredential(credential as ICredential);
    } else {
        console.error(
            'No portal Url was passed to getPortalUserSession method as a result no user session can be established.'
        );
    }
    return userSession;
}
