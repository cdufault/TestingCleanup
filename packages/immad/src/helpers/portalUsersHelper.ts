import { UserSession } from '@esri/arcgis-rest-auth';
import { ArcGISRequestError, request } from '@esri/arcgis-rest-request';
import {
    addGroupUsers,
    getGroupUsers,
    getUser,
    IGroup,
    IGroupUsersResult,
    IItem,
    ISearchResult,
    IUser,
    removeGroupUsers,
    searchUsers,
} from '@esri/arcgis-rest-portal';
import { getDefaultPortal, getPortalRestUrl } from './defaultPortalHelper';
import { getUserSession } from './userSessionHelper';
import { findPortalGroupByTitle } from './portalGroupHelper';
import { findPortalItemsByTag } from './portalItemsHelper';
import Request from '@arcgis/core/request';
import units from '@arcgis/core/core/units';
import PortalUser = __esri.PortalUser;
import RequestResponse = __esri.RequestResponse;

export interface SearchPortalGroupUsersResponseProp {
    users: string[];
    admins: string[];
    owner: string;
}

interface RemovePortalUsersResponseProp {
    errorArray: ArcGISRequestError[] | ArcGISRequestError | undefined;
    usersNotRemoved: string[] | undefined;
}
export interface FindPortalUsersResponseProp {
    users: [];
    total?: number;
    start?: number;
    num?: number;
    nextStart?: number;
}

export async function currentPortalUser(): Promise<any> {
    const portal = await getDefaultPortal();
    if (portal) {
        return portal.user;
    }
    return {};
}

export interface ImmadDisplaySettings {
    distanceUnit: units.SystemOrLengthUnit;
    areaUnit: units.SystemOrAreaUnit;
    defaultPopupEnabled: boolean;
    lightingEnabled: boolean;
    atmosphereEnabled: boolean;
    listenForConnection: boolean;
    addToLayerList: boolean;
    pollDelay: number;
}

export interface UserProperties {
    immadDisplaySettings: ImmadDisplaySettings;
}

/**
 *
 * @param groupId
 * @param users
 * @param session
 */
export async function removeUsersFromPortalGroup(
    groupId: string,
    users: string[],
    session?: UserSession
): Promise<RemovePortalUsersResponseProp> {
    if (!session) {
        session = await getUserSession();
    }
    const returnResult: RemovePortalUsersResponseProp = {
        errorArray: { message: '', code: '', response: null, url: '', options: {}, name: '', originalMessage: '' },
        usersNotRemoved: undefined,
    };

    await removeGroupUsers({
        authentication: session,
        users: users,
        id: groupId,
    })
        .then((result) => {
            returnResult.usersNotRemoved = result.notRemoved;
            returnResult.errorArray = result.errors;
        })
        .catch((error) => {
            console.error(error);
        });
    return returnResult;
}

/**
 *
 * @param groupTitle
 * @param userNames
 * @param adminNames
 */
export async function addUsersToGroupByTitle(
    groupTitle: string,
    userNames?: string[],
    adminNames?: string[]
): Promise<boolean> {
    const response = await findPortalGroupByTitle(groupTitle);
    if (response.success && response.item && response.item.length > 0) {
        const result = await addUsersToGroupById(response.item[0].id, userNames, adminNames);
        return result.length == 0;
    } else {
        console.error('Error adding users to group: ' + groupTitle);
        return false;
    }
}

/**
 * Add Users to a group based on the group ID.
 * @param groupId The group ID
 * @param userNames User names to be added to the group.
 * @param adminNames User names to be added as administrators to the group.
 * @param session The user session, used for authentication.
 * @returns A string array showing the response of the
 */
export async function addUsersToGroupById(
    groupId: string,
    userNames?: string[],
    adminNames?: string[],
    session?: UserSession
): Promise<string[]> {
    if (!session) {
        session = await getUserSession();
    }
    let result: string[] | undefined = [];
    if ((!userNames && !adminNames) || (userNames && userNames.length == 0 && adminNames && adminNames.length == 0)) {
        return result;
    }
    const portalRestUrl = await getPortalRestUrl();

    await addGroupUsers({
        id: groupId,
        users: userNames ? userNames : [],
        admins: adminNames ? adminNames : [],
        authentication: session,
        portal: portalRestUrl,
    })
        .then((response) => {
            result = response.notAdded;
        })
        .catch((error) => {
            console.error(error);
        });
    return result;
}

/**
 * Lists Portal Users from `start` to `maxCount`.
 * @param start The starting Portal user number.
 * @param maxCount The maximum number of users to return in the response. If maxCount is 0 gets all users.
 * @return `maxCount` Portal users beginning with the `start` number.
 *
 */
export async function findPortalUsers(start = 1, maxCount = 0): Promise<FindPortalUsersResponseProp> {
    const session = await getUserSession();
    let response: FindPortalUsersResponseProp = {
        users: [],
    };
    const portalRestUrl = await getPortalRestUrl();
    await request(portalRestUrl + `/portals/self/users?excludeSystemUsers=true&start=${start}&num=${maxCount}`, {
        authentication: session,
    })
        .then((result) => {
            response = result;
        })
        .catch((error) => {
            console.error(error);
        });
    return response;
}

/**
 * NOTE: there is now a library method in lib-functions portalUserHelper/getPortalGroupMembers that
 * should now be used instead of this method.
 * Gets the Portal Users that are members of a given group.
 * @param groupId The group ID to filter users by
 * @returns A Search Result containing users for the given group.
 */
export async function getPortalGroupUsers(groupId: string): Promise<IGroupUsersResult> {
    let resultObj: IGroupUsersResult = {
        admins: [],
        users: [],
        owner: '',
    };
    const session = await getUserSession();
    const portalRestUrl = await getPortalRestUrl();
    await getGroupUsers(groupId, {
        authentication: session,
        portal: portalRestUrl,
    })
        .then((result) => {
            //admins[], owner string , users[]
            resultObj = {
                users: result.users,
                admins: result.admins,
                owner: result.owner,
            };
        })
        .catch((error) => {
            console.error(error);
        });
    return resultObj;
}

/**
 * Returns Portal users by name.
 * @param userName A Portal user name
 * @returns The Portal User for the given name, or undefined if no user by that name exists.
 */
export async function findPortalUserByName(userName: string): Promise<IUser | undefined> {
    let user: IUser | undefined = undefined;
    const session = await getUserSession();
    const portalRestUrl = await getPortalRestUrl();
    //const query = new SearchQueryBuilder().match(userName).in('username'); //TODO validate this search

    await getUser({
        //q: query,
        username: userName,
        authentication: session,
        portal: portalRestUrl,
    })
        .then((result) => {
            user = result;
        })
        .catch((error) => {
            console.error(error);
        });
    return user;
}

/**
 * Get Missions for a given User
 * @param portalUser
 * @param missionTag
 * @returns An array of Portal Group Items containing the given tag.
 */
export async function getMissionsForUser(portalUser: PortalUser, missionTag: string): Promise<__esri.PortalGroup[]> {
    const groups = await portalUser.fetchGroups();
    // filter groups for list of missions
    return groups.filter(function (group) {
        return group.tags.some((value) => value === missionTag);
    });
}

/**
 * Find Portal Users by a User Tag.
 * @param userTag
 * @returns An array of Portal User Items containing the given tag.
 */
export async function findPortalUsersByTag(userTag: string): Promise<IItem[]> {
    return await findPortalItemsByTag(userTag);
}

/**
 * Set the portal user properties to store IMMAD user settings
 * @param properties
 */
export async function updatePortalUserProperties(properties: string): Promise<string[] | undefined> {
    const user = await currentPortalUser();
    const portalRestUrl = await getPortalRestUrl();
    const inputParams = {
        properties: properties,
        f: 'json',
    };

    const requestParams = {
        query: inputParams,
        method: 'post',
        authMode: 'auto',
    } as __esri.RequestOptions;

    const response = await Request(
        portalRestUrl + '/community/users/' + user.username + '/setProperties',
        requestParams
    );
    if (response && response.data && response.data.success) {
        return response.data;
    } else {
        return undefined;
    }

    //return Request(portalRestUrl + '/community/users/' + user.username + '/setProperties', requestParams);
}

/**
 * Get the user properties from portal for the current portal user
 */
export async function getPortalUserProperties(): Promise<UserProperties> {
    const user = await currentPortalUser();
    const portalRestUrl = await getPortalRestUrl();

    const requestParams = {
        method: 'post',
        authMode: 'auto',
        query: { f: 'json' },
    } as __esri.RequestOptions;

    const result = await Request(portalRestUrl + '/community/users/' + user.username + '/properties', requestParams);
    return result.data.properties;
}
/**
 * Get all Portal roles.
 * @return `roles` All Portal roles.
 *
 */
export async function getAllRoles(): Promise<IItem[]> {
    const session = await getUserSession();
    const portalRestUrl = await getPortalRestUrl();
    if (!session || !portalRestUrl) {
        console.error('Cannot access user session or portal url.');
        throw new Error('Cannot access user session or portal url.');
    }
    return await request(portalRestUrl + `/portals/self/roles`, {
        authentication: session,
    })
        .then((result) => {
            return result.roles;
        })
        .catch((error) => {
            console.error(error);
            throw error;
        });
}

/**
 * Get all Portal Users if no value is passed in. If userName or partial name passed in
 * Return all Portal users with that userName or starts with partial
 * name passed in. Will filter out system users such as esriliving atlas and others.
 * Will return the users in a list sorted by username.
 * Returns an object with nextStart, number of records returned, query used, results array with
 * user IItems in it, start position used in query, total number of portal users.
 * @param userNameSearchValue - any part of a username only 1 username at a time. default * to get all Users
 * @param numberPerPage - optional default 20
 * @param sortOrder - optional default 'asc'
 * @param startIndex - optional where to start in the search. default is 0
 * @param sortField - optional default username
 */
export async function searchPortalUserByPartialUserName(
    userNameSearchValue = '*',
    numberPerPage = 100,
    sortOrder: 'asc' | 'desc' = 'asc',
    startIndex = 0,
    sortField = 'username'
): Promise<ISearchResult<IUser>> {
    {
        const session = await getUserSession();
        if (!session) {
            console.error('Cannot access user session.');
            throw new Error('Cannot access user session.');
        }
        let searchValueToQuery =
            '-username:esri_livingatlas -username:esri_boundaries -username:esri_demographics -username:esri_nav ';
        searchValueToQuery += userNameSearchValue;

        const requestParams = {
            q: searchValueToQuery,
            authentication: session,
            sortField: sortField,
            start: startIndex,
            sortOrder: sortOrder,
            num: numberPerPage,
        };
        return await searchUsers(requestParams);
    }
}

/**
 * Get all Portal Users in batches of 100 if no value is passed in. If userName or partial name passed in
 * Return all Portal users with that userName or starts with partial
 * name passed in. Will filter out system users such as esriliving atlas and others.
 * Will return the users in a list sorted by username.
 * Returns a promise with the search results, accumulated in batches of 100 if there are more than 100 users.
 * @param groupId - portal group ID
 * @param numberPerPage - optional default 20
 * @param sortOrder - optional default 'asc'
 * @param startIndex - optional where to start in the search. default is 0
 * @param sortField - optional default username
 * @param accumulatedResponse - optional for response built from previous requests
 */
export async function getAllGroupUsersByGroupId(
    groupId: string,
    numberPerPage = 100,
    sortOrder: 'asc' | 'desc' = 'asc',
    startIndex = 0,
    sortField = 'username',
    accumulatedResponse?: ISearchResult<IUser>
): Promise<ISearchResult<IUser>> {
    {
        const session = await getUserSession();
        if (!session) {
            console.error('Cannot access user session.');
            throw new Error('Cannot access user session.');
        }

        const requestParams = {
            q: `-username:esri_livingatlas -username:esri_boundaries -username:esri_demographics -username:esri_nav group:${groupId}`,
            authentication: session,
            sortField: sortField,
            start: startIndex,
            sortOrder: sortOrder,
            num: numberPerPage,
        };
        const completeResponse: ISearchResult<IUser> = accumulatedResponse
            ? accumulatedResponse
            : ({
                  query: `-username:esri_livingatlas -username:esri_boundaries -username:esri_demographics -username:esri_nav group:${groupId}`,
                  start: 1,
                  num: 100,
                  nextStart: -1,
                  total: 0,
                  results: [] as IUser[],
              } as ISearchResult<IUser>);
        return new Promise<ISearchResult<IUser>>((resolve, reject) => {
            searchUsers(requestParams).then(
                (response) => {
                    completeResponse.results = completeResponse.results.concat(response.results);
                    completeResponse.num = completeResponse.total = completeResponse.results.length;
                    if (response.nextStart > 0) {
                        // Insert nextStart into next query
                        requestParams.start = response.nextStart;
                        resolve(
                            getAllGroupUsersByGroupId(
                                groupId,
                                numberPerPage,
                                sortOrder,
                                requestParams.start,
                                sortField,
                                completeResponse
                            )
                        );
                    } else {
                        resolve(completeResponse);
                    }
                },
                (e) => reject(e)
            );
        });
    }
}

/**
 * Get all Portal Users if no value is passed in. If userName or partial name passed in
 * Return all Portal users with that userName or starts with partial
 * name passed in. Will filter out system users such as esriliving atlas and others.
 * Will return the users in a list sorted by username.
 * Returns an object with nextStart, number of records returned, query used, results array with
 * user IItems in it, start position used in query, total number of portal users.
 * Only returns 100 users in a call.
 * @param groupId - portal group ID
 * @param numberPerPage - optional default 20
 * @param sortOrder - optional default 'asc'
 * @param startIndex - optional where to start in the search. default is 0
 * @param sortField - optional default username
 */
export async function getGroupUsersByGroupId(
    groupId: string,
    numberPerPage = 1000,
    sortOrder: 'asc' | 'desc' = 'asc',
    startIndex = 0,
    sortField = 'username'
): Promise<ISearchResult<IUser>> {
    {
        const session = await getUserSession();
        if (!session) {
            console.error('Cannot access user session.');
            throw new Error('Cannot access user session.');
        }
        let baseQueryString =
            '-username:esri_livingatlas -username:esri_boundaries -username:esri_demographics -username:esri_nav ';
        if (groupId) {
            baseQueryString += `group:${groupId}`;
        }
        const requestParams = {
            q: baseQueryString,
            authentication: session,
            sortField: sortField,
            start: startIndex,
            sortOrder: sortOrder,
            num: numberPerPage,
        };
        return await searchUsers(requestParams);
    }
}

/**
 * Get all Portal Users if no value is passed in. If userName or partial name passed in
 * Return all Portal users with that userName or starts with partial
 * name passed in. Will filter out system users such as esriliving atlas and others.
 * Will return the users in a list sorted by username.
 * Returns an object with nextStart, number of records returned, query used, results array with
 * user IItems in it, start position used in query, total number of portal users.
 * @param groupIds - List of group id's to remove from query of all users.
 * @param numberPerPage - optional default 20
 * @param sortOrder - optional default 'asc'
 * @param startIndex - optional where to start in the search. default is 0
 * @param sortField - optional default username
 */
export async function getUsersNotInTheseGroups(
    groupIds: string[],
    numberPerPage = 1000,
    sortOrder: 'asc' | 'desc' = 'asc',
    startIndex = 0,
    sortField = 'username'
): Promise<ISearchResult<IUser>> {
    {
        const session = await getUserSession();
        if (!session) {
            console.error('Cannot access user session.');
            throw new Error('Cannot access user session.');
        }
        let stringGroupIds =
            '-username:esri_livingatlas -username:esri_boundaries -username:esri_demographics -username:esri_nav ';
        if (groupIds?.length >= 0) {
            groupIds.forEach((idValue) => {
                stringGroupIds += '-group:' + idValue + ' ';
            });
        }
        const requestParams = {
            q: stringGroupIds,
            authentication: session,
            sortField: sortField,
            start: startIndex,
            sortOrder: sortOrder,
            num: numberPerPage,
        };
        return await searchUsers(requestParams);
    }
}

/**
 * This operation is (POST only) allows administrators of an organization to update the
 * role of a user with in portal.
 * @param userName user name of the user to update.
 * @param userRole The role of the user to be set. Values: org_admin
 * (for organization administrator) | org_publisher (for organiztion publisher)
 * | org_user (for organization user) | <roleId> (for custom roles) ie. iAAAAAAAAAAAAAAA
 */
export async function updatePortalUserRole(userName: string, userRole: string): Promise<RequestResponse> {
    const session = await getUserSession();
    const portalRestUrl = await getPortalRestUrl();
    if (!session || !portalRestUrl) {
        console.error('Cannot access user session or portal url.');
        throw new Error('Cannot access user session or portal url.');
    }
    const formData = new FormData();
    formData.append('f', 'json');
    formData.append('user', userName);
    formData.append('role', userRole);

    const requestParams = {
        method: 'post',
        authentication: session,
        body: formData,
        responseType: 'json',
        authMode: 'no-prompt',
    } as __esri.RequestOptions;

    return await Request(portalRestUrl + `/portals/self/updateUserRole`, requestParams)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * This operation is (POST only) allows administrators of an organization to update the
 * licence type for a user with in portal.
 * @param userName user name of the user to update.
 * @param isUnassigned boolean for if to use viewerUT or creatorUT license.
 * (for organization administrator) | org_publisher (for organiztion publisher)
 * | org_user (for organization user) | <roleId> (for custom roles) ie. iAAAAAAAAAAAAAAA
 */
export async function updatePortalUserLicenceType(userName: string, isUnassigned: boolean): Promise<RequestResponse> {
    const session = await getUserSession();
    const portalRestUrl = await getPortalRestUrl();
    if (!session || !portalRestUrl) {
        console.error('Cannot access user session or portal url.');
        throw new Error('Cannot access user session or portal url.');
    }
    const formData = new FormData();
    formData.append('f', 'json');
    formData.append('users', userName);
    if (isUnassigned) {
        formData.append('userLicenseType', 'viewerUT');
    } else {
        formData.append('userLicenseType', 'creatorUT');
    }

    const requestParams = {
        method: 'post',
        authentication: session,
        body: formData,
        responseType: 'json',
        authMode: 'no-prompt',
    } as __esri.RequestOptions;

    return await Request(portalRestUrl + `/portals/self/updateUserLicenseType`, requestParams)
        .then((result) => {
            return result;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Get the user groups as an array from portal for the username passed in.
 * @param username name of the user to get the group info from.
 * @return IGroup[] or Empty[] if user is undefined.
 */
export async function getPortalUserGroupsByUsername(username: string): Promise<IGroup[]> {
    if (!username) {
        return [];
    }
    const portalRestUrl = await getPortalRestUrl();

    const requestParams = {
        method: 'post',
        authMode: 'auto',
        query: { f: 'json' },
    } as __esri.RequestOptions;

    const result = await Request(portalRestUrl + '/community/users/' + username, requestParams);
    return result.data.groups;
}
