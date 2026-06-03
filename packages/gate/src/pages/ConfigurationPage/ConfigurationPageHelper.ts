import Request from '@arcgis/core/request';
import { createPortalGroup, createPortalItem, findPortalGroupsByTag } from '@stratcom/lib-functions';
import { IGroupAdd, IItemAdd } from '@esri/arcgis-rest-portal';
import { UserSession } from '@esri/arcgis-rest-auth';
import { findGateWebMapApp } from '../LandingPage/LandingPageHelper';

/**
 * This interface describes the user role json object
 */
export interface roleJson {
    /** Portal Role ID*/
    id: string;
    /** Portal Role Name*/
    name: string;
    /** Portal Role Description*/
    description: string;
    /** Portal Role Date Created*/
    created: number;
    /** Portal Role Date Modified*/
    modified: number;
}

/**
 * Checks if the user is a GATE admin or Org-admin on the portal
 * @param user the user to check
 * @param portalUrl the portal to see the users status on
 */
export async function checkAdminStatus(user: __esri.PortalUser, portalUrl: string): Promise<boolean> {
    if (user) {
        if (user.role !== 'org_admin') {
            const roleId = user.roleId;
            const result = await getPortalRole(portalUrl, roleId);
            return result?.name.toLowerCase() === 'gate-admin';
        } else if (user.role === 'org_admin') {
            return true;
        }
    }
    return false;
}

/**
 * Gets the role back from portal based on its id
 * @param portalUrl the portal to check
 * @param roleId the id of the role
 */
export async function getPortalRole(portalUrl: string, roleId: string): Promise<roleJson | undefined> {
    const inputParams = {
        f: 'json',
    };

    const requestParams = {
        query: inputParams,
        method: 'post',
        authMode: 'auto',
    } as __esri.RequestOptions;

    const response = await Request(`${portalUrl}/sharing/rest/portals/self/roles/${roleId}`, requestParams);

    return response.data ? response.data : undefined;
}

/**
 * Create GATE admin group or use existing group to send back the Portal Item ID
 * @param userSession current userSession in portal.
 * @param portalRestUrl the portal Rest URL
 * @param iGroupAdd the IGroupAdd field values object
 * @param tags the string of tags to add to the group
 */
export async function createGateAdminGroup(
    userSession: UserSession,
    portalRestUrl: string,
    iGroupAdd: IGroupAdd,
    tags: string
): Promise<string | Error> {
    try {
        let groupID = '';
        const groupExists = await findPortalGroupsByTag(tags, userSession);
        if (groupExists.item.length > 0) {
            groupID = groupExists.item[0].id;
        } else {
            const createGroupResult = await createPortalGroup(iGroupAdd, userSession, portalRestUrl);
            if (createGroupResult.success) {
                groupID = createGroupResult?.group?.id ? createGroupResult?.group?.id : '';
            } else {
                throw createGroupResult;
            }
        }
        return groupID;
    } catch (error) {
        return new Error('An Error occurred: ' + error);
    }
}

/**
 * Create GATE admin group or use existing group to send back the Portal Item ID
 * @param portalRestUrl the portal Rest URL
 * @param requestParams the IGroupAdd field values object
 * @param portalUrl the portal url
 * @param gateApplicationTitle the gate application tile from app config
 * @param oauthAppId
 */
export async function createGateAdminApplication(
    portalRestUrl: string,
    requestParams: IItemAdd,
    portalUrl: string,
    gateApplicationTitle: string,
    oauthAppId: string
): Promise<string | Error> {
    try {
        let applicationID = '';
        if (requestParams?.typeKeywords && requestParams.typeKeywords.length !== 0) {
            const createAppResult = await findGateWebMapApp(
                requestParams.type,
                portalUrl,
                requestParams.typeKeywords.join(' AND '),
                oauthAppId
            );
            if (createAppResult && createAppResult.results.length > 0) {
                const result = createAppResult.results.find((item) => item.title === gateApplicationTitle);
                if (result) {
                    applicationID = result.id;
                } else {
                    const createItemResult = await createPortalItem(requestParams, portalRestUrl, oauthAppId);
                    if (createItemResult?.success) {
                        applicationID = createItemResult.id;
                    } else {
                        throw createItemResult;
                    }
                }
            } else {
                // nothing must create new stuff here
                const createItemResult = await createPortalItem(requestParams, portalRestUrl, oauthAppId);
                if (createItemResult?.success) {
                    applicationID = createItemResult.id;
                } else {
                    throw createItemResult;
                }
            }
        }
        return applicationID;
    } catch (error) {
        return new Error('An Error occurred: ' + error);
    }
}
