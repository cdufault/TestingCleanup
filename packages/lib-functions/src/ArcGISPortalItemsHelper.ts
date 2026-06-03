import {
    createItem,
    getGroupContent,
    getItem,
    getItemData,
    ICreateItemResponse,
    IGroup,
    IItem,
    IItemAdd,
    ISearchResult,
    IUpdateItemOptions,
    IUpdateItemResponse,
    searchItems,
    SearchQueryBuilder,
    updateItem,
} from '@esri/arcgis-rest-portal';
import { UserSession } from '@esri/arcgis-rest-auth';
import { getPortalUserSession } from './UserSessionHelper';
import Portal from '@arcgis/core/portal/Portal';
import { DefaultPortal } from './DefaultPortal';
import Request from '@arcgis/core/request';
import { Extent } from '@arcgis/core/geometry';
import PortalItem from '@arcgis/core/portal/PortalItem';

/**
 * Represents the response when a group is created.
 */
interface CreateGroupResponseProp {
    /**The newly created group if the method succeeded */
    group?: IGroup;

    /**will return true or false depending on whether the method call succeeded or failed */
    success: boolean;

    /**items that belong to the group */
    items?: [];

    /**widget that the group owns */
    widgets?: any;
}

/**
 * Get Portal Item Data based on the portal item id
 * @param portalItemId portal item id
 * @param portalUrl URL to the default portal
 * Returns the item's data or undefined if not found.
 * @param oauthAppId
 */
export async function getPortalItemDataById(portalItemId: string, portalUrl: string, oauthAppId: string): Promise<any> {
    const session = await getPortalUserSession(portalUrl, oauthAppId);
    const portalRestUrl = await getThePortalRestUrl(portalUrl);
    let result: any = {
        id: undefined,
        success: false,
    };
    await getItemData(portalItemId, {
        authentication: session,
        portal: portalRestUrl,
    })
        .then((res) => {
            result = res; //returns data object or undefined
            if (res) {
                result.success = true;
            }
        })
        .catch((error) => {
            console.error(error, true);
        });
    return result;
}

/**
 * Get Portal Item Data based on the portal item id
 * @param itemId portal item id
 * @param portalUrl url to the portal
 * Returns properties for the group. See interface CreateGroupResponseProp.
 * @param oauthAppId
 */
export async function getPortalItemData(
    itemId: string,
    portalUrl: string,
    oauthAppId: string
): Promise<CreateGroupResponseProp> {
    return getPortalItemDataById(itemId, portalUrl, oauthAppId);
}

/**
 *
 * @param itemType
 * @param portalUrl url to the portal
 *  @param oauthAppId
 *  @param searchField the field to search
 * @param searchValue the value to seek out
 * @param num : number The number of items to request for paging.
 */
export async function findPortalItemsByType(
    itemType: string,
    portalUrl: string,
    searchField = 'owner',
    searchValue = '*',
    oauthAppId: string,
    num = 1000
): Promise<ISearchResult<IItem> | undefined> {
    let searchResult;
    const query = new SearchQueryBuilder().match(itemType).in('type').and().match(searchValue).in(searchField);
    if (query['q'].includes('typekeywords')) {
        query['q'] = query['q'].replace(/"/g, "'");
    }
    const session = await getPortalUserSession(portalUrl, oauthAppId);
    const portalRestUrl = await getThePortalRestUrl(portalUrl);
    try {
        searchResult = await searchItems({
            num: num,
            q: query,
            sortField: 'created',
            sortOrder: 'desc',
            authentication: session,
            portal: portalRestUrl,
        });
    } catch (error) {
        console.error('Error executing query: ' + query ? query.toParam() : '');
    }
    return searchResult;
}

/**
 *  Creates a new portal item for the current portal and current signed-in user.
 *  @param itemProps The portal item properties
 *  @param portalUrl the url to the ArcGIS Portal to create the item on.
 * @param oauthAppId
 */

export async function createPortalItem(
    itemProps: IItemAdd,
    portalUrl: string,
    oauthAppId: string
): Promise<ICreateItemResponse | undefined> {
    const session = await getPortalUserSession(portalUrl, oauthAppId);
    const portalRestUrl = await getThePortalRestUrl(portalUrl);
    if (session) {
        return await createItem({
            authentication: session,
            item: itemProps,
            overwrite: true,
            portal: portalRestUrl,
        });
    }
    return undefined;
}

/**
 * Get the portal's rest URL.
 * @param portalUrl URL to the default portal
 * Returns the URL as a string or undefined if not found.
 */
export async function getThePortalRestUrl(portalUrl: string): Promise<string | undefined> {
    const portal: Portal | undefined = await DefaultPortal.getTheDefaultPortal(portalUrl);
    return portal?.restUrl;
}

/**
 * Get the PortalItem from default portal based on the provided portal item id using the queryItems method.
 * @param itemId - id of portal item
 * @param portalUrl URL to the default portal
 * Returns a PortalItem or undefined if not found.
 * @param oauthAppId
 */
export async function queryPortalItemById(
    itemId: string,
    portalUrl: string,
    oauthAppId: string
): Promise<PortalItem | undefined> {
    let item = undefined;
    const portal = await DefaultPortal.getTheDefaultPortal(portalUrl);
    const session = await getPortalUserSession(portalUrl, oauthAppId);
    const queryParams = {
        query: 'id:' + itemId,
        authentication: session,
    };
    await portal
        ?.queryItems(queryParams)
        .then((result) => {
            if (result.total > 0) {
                item = result.results[0];
            }
        })
        .catch((error) => {
            console.error(error);
        });
    return item;
}

/**
 * Get the PortalItem from default portal based on the provided portal item id using the getItem method.
 * @param itemId - id of portal item
 * @param portalUrl URL to the default portal
 * @param oauthAppId
 * Returns a PortalItem or undefined if not found.
 */
export async function findAPortalItemById(
    itemId: string,
    portalUrl: string,
    oauthAppId: string
): Promise<IItem | undefined> {
    let item = undefined;
    const portalRestUrl = await getThePortalRestUrl(portalUrl);
    const session = await getPortalUserSession(portalUrl, oauthAppId);
    await getItem(itemId, {
        authentication: session,
        portal: portalRestUrl,
    })
        .then((result) => {
            item = result;
        })
        .catch((error) => {
            console.error(error);
        });
    return item;
}

/**
 * Query the portal 'search' rest endpoint with a custom query.
 * @param queryString query to portal
 * @param portalUrl url to the portal
 * @param maxRecordsToRetrieve total number of records to get back. default is 1000
 * @param extent limit results by extent
 * @param oauthAppId
 * @param start the index to start returning item - generally used when subsequent calls are made to get additional
 * results after the initial call has been filled
 * @param searchCategories portal categories defined on an item to be used as query criteria
 * @param signal abort signal for query chain
 */
export async function queryPortal(
    queryString: string,
    portalUrl: string,
    maxRecordsToRetrieve = 1000,
    extent: Extent | undefined,
    oauthAppId: string,
    start?: number,
    searchCategories?: string[],
    signal?: AbortSignal
): Promise<any> {
    const session = await getPortalUserSession(portalUrl, oauthAppId);

    if (!session) {
        console.error('User session could not be established.');
        return null;
    }

    const portalQueryParams = {
        q: queryString.trim(),
        num: maxRecordsToRetrieve,
        extent: extent,
        start: start || 1,
        categories: searchCategories || [''],
        f: 'json',
    };

    const requestParams = {
        query: portalQueryParams,
        method: 'post',
        authentication: session, // Ensures the request is authenticated
        signal: signal,
    } as __esri.RequestOptions;

    try {
        const response = await Request(`${portalUrl}/sharing/rest/search`, requestParams);
        const portalItems = response.data.results.map((item: any) => new PortalItem({ id: item.id }));
        await Promise.all(portalItems.map((item: any) => item.load()));
        response.data.results = portalItems;
        return response;
    } catch (error: any) {
        if (error) {
            if (error.name === 'AbortError') {
                // ignore result when it is aborted
                console.debug('Aborted query to the portal', error);
                return error;
            } else {
                console.error('Error querying the portal:', error);
            }
        }
        return null;
    }
}

/**
 * shares content from the current user with a group
 * @param portal arcgis Portal object
 * @param itemId id of the item in portal to share
 * @param groupIds group id's to share the item to
 * @param shareWithOrganization allows user to also share item to organization. Default value = false
 */
export async function shareItemsWithGroup(
    portal: Portal,
    itemId: string,
    groupIds: string[],
    shareWithOrganization?: boolean
): Promise<any> {
    return new Promise((resolve, reject) => {
        const shareOrg = shareWithOrganization ?? false;
        const user = portal.user;
        const inputParams = {
            items: itemId,
            everyone: false, //share with everyone
            org: shareOrg, //share with everyone in organization
            groups: groupIds.toString(),
            confirmItemControl: true, //groups with update ability can edit this layer
        };

        const requestParams = {
            query: inputParams,
            method: 'post',
            authMode: 'auto',
        } as __esri.RequestOptions;

        Request(portal.restUrl + '/content/users/' + user.username + '/shareItems?f=json', requestParams).then(
            (response) => {
                resolve(response.data.results[0].success);
            },
            (err) => {
                reject(err);
            }
        );
    });
}

/**
 * Current only supporting updates to a Web Mapping Application. Parameters need updating to handle other update types.
 * Created to update the JSON value stored in the text property of a Web Mapping Application
 * @param itemId : string Portal item ID
 * @param itemParams : string The result of calling JSON.stringify on an object of name value pairs. Example object: {
 *  description: "my description text"
 *  text: {
 *      key: "value"
 *      key2: "value2"
 *      ...
 *  }
 * }
 * @param session the UserSession object for security credentials
 * @param portalRestUrl the rest url of the Portal
 */
export async function updatePortalWebApp(
    itemId: string,
    itemParams: string,
    session: UserSession,
    portalRestUrl: string
): Promise<IUpdateItemResponse> {
    const item = await getItem(itemId, {
        authentication: session,
        portal: portalRestUrl,
    });

    item.text = itemParams;

    return await updateItem({
        item: item,
        authentication: session,
        portal: portalRestUrl,
    } as IUpdateItemOptions);
}

/**
 * Get the content belonging to a specific portal group.
 * @param portalUrl the portal url string,
 * @param oauthAppId
 * @param groupId group id
 * @param maxRecordsToReturn  maximum number of records to return defaults to 500 max
 */
export async function getGroupContentByGroupId(
    portalUrl: string,
    oauthAppId: string,
    groupId: string,
    maxRecordsToReturn = 500
): Promise<IItem[]> {
    let portalItemsArray: any[] = [];
    const portal = await DefaultPortal.getTheDefaultPortal(portalUrl);
    const session = await getPortalUserSession(portalUrl, oauthAppId);
    await getGroupContent(groupId, {
        paging: {
            num: maxRecordsToReturn,
        },
        authentication: session,
        portal: portal?.restUrl,
    })
        .then((result) => {
            portalItemsArray = result.items;
        })
        .catch((error) => {
            console.error('Error getting group content.' + error);
        });
    return portalItemsArray;
}
