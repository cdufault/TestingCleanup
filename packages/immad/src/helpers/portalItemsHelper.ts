import {
    addItemData,
    createItem,
    getItem,
    getUniqueServiceName,
    ICreateItemResponse,
    IGroup,
    IItem,
    IItemAdd,
    IItemUpdate,
    ISearchResult,
    IUpdateItemOptions,
    IUpdateItemResponse,
    removeItem,
    searchItems,
    SearchQueryBuilder,
    updateItem,
} from '@esri/arcgis-rest-portal';
import {
    findAPortalItemById,
    getPortalItemDataById,
    getPortalUserSession,
    queryPortalItemById,
} from '@stratcom/lib-functions';
import Portal from '@arcgis/core/portal/Portal';
import Request from '@arcgis/core/request';
import EsriConfig from '@arcgis/core/config';

import { getUserSession } from './userSessionHelper';
import { LogHelper } from './logHelper';
import { getDefaultPortal, getPortalRestUrl } from './defaultPortalHelper';
import RasterAnalysisHelper from '../helpers/rasterAnalysisHelper';
import { UserSession } from '@esri/arcgis-rest-auth';
import IdentityManager from '@arcgis/core/identity/IdentityManager';
import { ConfigHelper } from './configHelper';
import { getGroupContentByGroupId } from './portalGroupHelper';
import esriRequest from '@arcgis/core/request';
import PortalItem from '@arcgis/core/portal/PortalItem';

/**
 * Portal Item Status enumeration representing the status of published services and uploaded content.
 */
export enum PortalItemStatus {
    processing = 'processing',
    partial = 'partial',
    completed = 'completed',
    failed = 'failed',
    statusNotSupported = '',
}

/**
 * The WebMapJson contains the lists of basemap, operational layers, to be used in the updating of the Webmap.
 * The minimum required fields are:
 * authoringApp - String value indicating the application that last authored the Webmap
 * authoringAppVersion - String value indicating the version number of the application that last authored the Webmap
 * baseMap - Basemaps give the web map a geographic context
 * spatialReference - An object used to specify the spatial reference of the given geometery
 * version - Root element in the web map specifying a string value indicating the web map version. Valid values of the property is 2.22
 */
export interface WebMapJson {
    initialState: {
        viewpoint: {
            rotation: number;
            scale: number;
            targetGeometry: {
                ymin: number;
                xmin: number;
                ymax: number;
                xmax: number;
                spatialReference: { wkid: number };
            };
        };
    };
    operationalLayers: {
        layerType: string;
        itemId: string;
        visibility: boolean;
        refreshInterval: number;
        id: string;
        opacity: number;
        title: string;
        url: string;
    }[];
    authoringAppVersion: string;
    baseMap: {
        baseMapLayers: {
            layerType: string;
            itemId: string;
            visibility: boolean;
            id: string;
            opacity: number;
            title: string;
            url: string;
        }[];
        title: string;
    };
    authoringApp: string;
    spatialReference: { latestWkid: number; wkid: number };
    version: string;
}

interface CreateGroupResponseProp {
    group?: IGroup;
    success: boolean;
    items?: [];
    widgets?: any;
}

/**
 * Internal helper method that can invoke a generic portal request using the
 * current session and portal url.  This method reduces the boiler plate
 * code needed for each helper function making a one or more portal item requests.
 * @param requestFunction A function representing the portal request being made.
 */
async function makePortalRequest(
    requestFunction: (session: UserSession, portalUrl: string) => Promise<any>
): Promise<any> {
    const session = await getUserSession();
    const portalRestUrl = await getPortalRestUrl();

    if (!session || !portalRestUrl) {
        LogHelper.log('Cannot access user session or portal url.', true);
        throw new Error('Cannot access user session or portal url.');
    }

    try {
        return requestFunction(session, portalRestUrl);
    } catch (error) {
        LogHelper.log('Error making portal request: ' + error, true);
        throw error;
    }
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
 */
export async function updatePortalWebApp(itemId: string, itemParams: string): Promise<IUpdateItemResponse> {
    const session = await getUserSession();
    const portalRestUrl = await getPortalRestUrl();

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
 * Get the PortalItem from default portal based on the provided portal item id using the getItem method.
 * @param itemId - id of portal item
 * Returns a PortalItem or undefined if not found.
 */
export async function findPortalItemById(itemId: string): Promise<IItem | undefined> {
    const appConfig = ConfigHelper.getAppConfig();
    return await findAPortalItemById(itemId, appConfig.portalUrl, appConfig.oauthAppId);
}

/**
 *
 * @param itemType string The item type, e.g. Web Map, Web Scene, Feature Service, Web Mapping Application, Geoprocessing Service
 * @param searchField the field to search
 * @param searchValue the value to seek out
 * @param num : number The number of items to request for paging.
 */
export async function findPortalItemsByType(
    itemType: string,
    searchField = 'owner',
    searchValue = '*',
    num = 1000
): Promise<ISearchResult<IItem> | undefined> {
    let searchResult;
    const query = new SearchQueryBuilder().match(itemType).in('type').and().match(searchValue).in(searchField);
    const session = await getUserSession();
    const portalRestUrl = await getPortalRestUrl();
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
        LogHelper.log(error, true);
    }
    return searchResult;
}

/**
 *
 * @param searchTerm  string The search term keyword
 * @param fieldToSearch : string The fields to search e.g. title, tags, snippet, description, type, owner
 */
export async function findPortalItems(searchTerm: string, fieldToSearch: string): Promise<IItem[]> {
    let items: IItem[] = [];
    const query = new SearchQueryBuilder().match(searchTerm).in(fieldToSearch); //title, owner
    const session = await getUserSession();
    const portalRestUrl = await getPortalRestUrl();
    await searchItems({
        q: query,
        sortField: 'created',
        sortOrder: 'desc',
        authentication: session,
        portal: portalRestUrl,
    })
        .then((result) => {
            items = result.results;
        })
        .catch((error) => {
            LogHelper.log(error, true);
        });
    return items;
}

/**
 * Previously named searchPortalItems
 * example: "foo", "title", "Web Mapping Application" ,"type"
 * @param searchTerm : string
 * @param fieldToSearch : string
 *  title, tags, snippet, description, type, owner
 * @param portalItemType : string
 *  Web Map, Web Scene, Feature Service, Web Mapping Application, Geoprocessing Service ...
 */
export async function searchPortalItemType(
    searchTerm: string,
    fieldToSearch: string,
    portalItemType: string
): Promise<IItem[]> {
    let items: IItem[] = [];
    const query = new SearchQueryBuilder().match(searchTerm).in(fieldToSearch).and().match(portalItemType).in('type');
    const session = await getUserSession();
    const portalRestUrl = await getPortalRestUrl();
    await searchItems({
        q: query,
        sortField: 'created',
        sortOrder: 'desc',
        authentication: session,
        portal: portalRestUrl,
    })
        .then((result) => {
            items = result.results;
        })
        .catch((error) => {
            LogHelper.log(error, true);
        });
    return items;
}

/**
 * Find Portal Items by Tag value.
 * @param itemTag
 * @param maxNumber
 */
export async function findPortalItemsByTag(itemTag: string, maxNumber = 100): Promise<IItem[]> {
    let item: IItem[] = [];
    const query = new SearchQueryBuilder().match(itemTag).in('tags');
    const session = await getUserSession();
    const portalRestUrl = await getPortalRestUrl();
    await searchItems({
        num: maxNumber,
        q: query,
        sortField: 'created',
        sortOrder: 'desc',
        authentication: session,
        portal: portalRestUrl,
    })
        .then((result) => {
            item = result.results;
        })
        .catch((error) => {
            LogHelper.log(error, true);
        });
    return item;
}

export async function deletePortalItem(itemId: string): Promise<boolean> {
    let resultState = false;
    const session = await getUserSession();
    const portalRestUrl = await getPortalRestUrl();
    await removeItem({
        id: itemId,
        authentication: session as UserSession,
        portal: portalRestUrl,
    })
        .then((result) => {
            resultState = result.success;
        })
        .catch((error) => {
            LogHelper.log(error, true);
        });
    return resultState;
}

/**
 * Creates a new portal item for the current portal and current signed in user.
 * @param itemProps The portal item properties
 */
export async function createPortalItem(itemProps: IItemAdd): Promise<ICreateItemResponse> {
    return makePortalRequest((session, portalUrl) => {
        return createItem({
            authentication: session,
            item: itemProps,
            overwrite: true,
            portal: portalUrl,
        });
    });
}

/**
 * Creates a new portal item for the current portal and current signed in user.
 * @param itemProps The portal item properties
 * @param dataUrl The data URL which Portal uses to load the data directly.
 */
export async function createPortalItemFromDataURLAsync(
    itemProps: IItemAdd,
    dataUrl: string
): Promise<ICreateItemResponse> {
    return makePortalRequest(async (session: UserSession, portalUrl: string) => {
        const createResponse = await createItem({
            authentication: session,
            item: itemProps,
            overwrite: true,
            portal: portalUrl,
            dataUrl: dataUrl,
        });

        //TODO set the delay and max timeout in the config
        //TODO make sure this doesn't interfere with other users of this method
        let errorCount = 0;
        return await new Promise((resolve, reject) => {
            //check for completed status before returning a response
            const interval = setInterval(async () => {
                try {
                    const status: PortalItemStatus = await getItemStatusAsync(session.username, createResponse.id);

                    if (
                        status === PortalItemStatus.completed ||
                        status === PortalItemStatus.failed ||
                        status === PortalItemStatus.statusNotSupported
                    ) {
                        clearInterval(interval);
                        resolve(createResponse);
                    }
                } catch (e) {
                    LogHelper.log(e, true);
                    errorCount++;
                    if (errorCount > 10) {
                        //times out after 10 iterations or approx. 30 seconds of error state
                        clearInterval(interval);
                        reject();
                    }
                }
            }, 3000); //every 3 seconds
        });
    });
}

export type PublishItemResponse = {
    services: {
        type: string;
        serviceURL: string;
        size: number;
        jobId: string;
        serviceItemId: string;
    }[];
};

export type FeatureLayerPublishParameters = {
    name: string;
    description: string;
    maxRecordCount: number;
    copyrightText: string;
    targetSR: { wkid: number };
};

/**
 * Creates a feature service. Exceptions are thrown from this method
 * @param title The title of the Feature Service
 * @param description A description of the Feature Service
 * @param featureDefJson
 * @param layerDefJson The layer definition JSON
 */
export async function createFeatureService(
    title: string,
    description: string,
    featureDefJson: any,
    layerDefJson: any
): Promise<PortalItem | undefined> {
    const portal = await getDefaultPortal();
    const appConfig = ConfigHelper.getAppConfig();
    const featureServiceParams = JSON.parse(JSON.stringify(featureDefJson));

    if (portal) {
        const userSession = await getPortalUserSession(portal.url, appConfig.oauthAppId);

        if (!userSession) return;

        featureServiceParams.name = await getUniqueServiceName(title, 'Feature Service', userSession, 0);

        const result = await publishFeatureService(featureServiceParams);

        if (result) {
            const resultData = result.data as {
                serviceurl: string;
                itemId: string;
                type: string;
                success: boolean;
            };
            if (resultData && resultData.success) {
                const serviceUrl = resultData.serviceurl;
                const addToDefUrl = serviceUrl?.replace('rest/services', 'rest/admin/services') + '/addToDefinition';
                const credential = await IdentityManager.getCredential(addToDefUrl);

                const addToDefinitionParams = {
                    token: credential.token,
                    addToDefinition: JSON.stringify(layerDefJson),
                    f: 'json',
                };

                const addToDefinitionResponse = await esriRequest(addToDefUrl, {
                    method: 'post',
                    query: addToDefinitionParams,
                    timeout: 60000 * 5, // 5 minutes
                });

                if (!addToDefinitionResponse.data?.success) {
                    console.error(
                        'addToDefinition call failed! Response: ' + JSON.stringify(addToDefinitionResponse, null, 2)
                    );
                    return;
                }

                const itemId = resultData.itemId;

                return new PortalItem({ id: itemId }).load();
            }
        }
    }
}

/**
 * Asynchronously publishes a Feature Service given a FeatureLayerPublishParameters object.
 * @param parameters FeatureLayerPublishParameters the parameters to the service
 */
export async function publishFeatureService(parameters: FeatureLayerPublishParameters): Promise<any> {
    try {
        const portal = Portal.getDefault();
        await portal.load();
        const user = portal.user;
        const paramStr = JSON.stringify(parameters);
        const credential = await IdentityManager.getCredential(portal.url);
        const inputParams = {
            token: credential.token,
            targetType: 'featureService',
            createParameters: paramStr,
            f: 'json',
        };
        const requestParams = {
            query: inputParams,
            method: 'post',
            authMode: 'immediate',
            timeout: 60000 * 5, // 5 minutes
        } as __esri.RequestOptions;

        return esriRequest(`${portal.url}/sharing/rest/content/users/${user.username}/createService`, requestParams);
    } catch (e) {
        console.error(e.message, e);
    }
}

/**
 * Publishes an existing portal item
 * @param itemId
 * @param fileType
 * @param outputType
 * @param serviceName
 */
export async function publishItemAsync(
    itemId: string,
    fileType: string,
    outputType: string,
    serviceName: string
): Promise<any> {
    const portal = new Portal();
    await portal.load();
    const user = portal.user;

    const appConfig = await ConfigHelper.loadAppConfig();
    //TODO token is not coming back with the credential
    //tool still completes without it but need to verify
    const credential = await IdentityManager.getCredential(appConfig.portalUrl);

    const inputParams = {
        itemId: itemId,
        filetype: fileType,
        publishParameters: JSON.stringify({ name: serviceName, maxRecordCount: 2000 }),
        buildInitialCache: false,
        outputType: outputType,
        f: 'json',
        token: credential.token,
    };

    const requestParams = {
        query: inputParams,
        method: 'post',
        authMode: 'auto',
    } as __esri.RequestOptions;

    //TODO also need to check status here before returning, the publish may still be in progress
    const response = await Request(
        `${EsriConfig.portalUrl}/sharing/rest/content/users/${user.username}/publish`,
        requestParams
    );

    const service = response?.data?.services[0]; // TODO: Revisit this hack. Should probably account for multiple services?

    let errorCount = 0;
    return await new Promise((resolve, reject) => {
        //check for completed status before returning a response
        const interval = setInterval(async () => {
            try {
                const status: PortalItemStatus = await getItemStatusAsync(user.username, service.serviceItemId);

                if (
                    status === PortalItemStatus.completed ||
                    status === PortalItemStatus.failed ||
                    status === PortalItemStatus.statusNotSupported
                ) {
                    clearInterval(interval);
                    resolve(service);
                }
            } catch (e) {
                LogHelper.log(e, true);
                errorCount++;
                if (errorCount > 10) {
                    // Times out after 10 errors or approximately 30 seconds of error states
                    clearInterval(interval);
                    reject('Timed out');
                }
            }
        }, 3000); //every 3 seconds
    });
}

/**
 * ensure that add item is done processing
 * @param username
 * @param itemId
 * @returns PortalItemStatus representing the latest status of the Portal Item.
 */
export async function getItemStatusAsync(username: string, itemId: string): Promise<PortalItemStatus> {
    const requestParams = {
        query: { f: 'json' },
        authMode: 'auto',
    } as __esri.RequestOptions;

    const url = EsriConfig.portalUrl + '/sharing/rest/content/users/' + username + '/items/' + itemId + '/status';
    const response = await Request(url, requestParams);

    const status: string = response?.data?.status;

    return (status as PortalItemStatus) ?? PortalItemStatus.statusNotSupported;
}

/**
 * Adds/Updates the item data associated with a portal item.  This function assumes the item id
 * is in the current portal and that the current user has the ability to add data to the portal
 * item.
 * @param itemId The portal item id being updated
 * @param data The data being added to the portal item
 */
export async function addItemDataToPortalItem(itemId: string, data: File): Promise<IUpdateItemResponse> {
    return makePortalRequest((session, portalUrl) => {
        return addItemData({
            authentication: session,
            data: data,
            id: itemId,
            portal: portalUrl,
        });
    });
}

/**
 * Updates an existing portal item.
 * @param updateInfo The portal item properties being updated
 */
export async function updatePortalItem(updateInfo: IItemUpdate): Promise<IUpdateItemResponse> {
    return makePortalRequest((session, portalUrl) => {
        const requestProps = {
            authentication: session,
            item: updateInfo,
            portal: portalUrl,
        } as IUpdateItemOptions;

        return updateItem(requestProps);
    });
}

/**
 * Updates an existing portal item that the user is not an owner of. Note
 *  must use an admin or Mission Mangers to do this option.
 * @param itemId : string Portal item ID
 * @param itemParams : WebMapJson
 * @param cleanLicenseInfo : string the JSON.stringify of the items License Info object
 */
export async function updateNonOwnerPortalItem(
    itemId: string,
    itemParams: WebMapJson,
    cleanLicenseInfo: string
): Promise<IUpdateItemResponse> {
    const session = await getUserSession();
    const portalRestUrl = await getPortalRestUrl();

    const item = await getItem(itemId, {
        authentication: session,
        portal: portalRestUrl,
    });

    item.text = itemParams;
    item.overwrite = true;
    item.licenseInfo = cleanLicenseInfo.replace(/"/gi, '&quot;');

    return await updateItem({
        item: item,
        authentication: session,
        portal: portalRestUrl,
    } as IUpdateItemOptions);
}

/**
 * Get Portal Item Data based on the portal item id
 * @param itemId portal item id
 * Returns properties for the group. See interface CreateGroupResponseProp.
 */
export async function getPortalItemData(itemId: string): Promise<CreateGroupResponseProp> {
    const appConfig = await ConfigHelper.loadAppConfig();
    return getPortalItemDataById(itemId, appConfig.portalUrl, appConfig.oauthAppId);
}

/**
 * Remove a layer from portal
 * @param layerToRemove layer item name to remove
 * Returns Promise<any>
 */
export async function removeLayerFromPortalByName(layerToRemove: string): Promise<any> {
    return new Promise((resolve, reject) => {
        RasterAnalysisHelper.getItemIdByName(layerToRemove).then(
            (getItemIdResponse) => {
                if (getItemIdResponse.success) {
                    //delete layer from portal
                    RasterAnalysisHelper.getCurrentUser().then(
                        (user) => {
                            deleteItemById(getItemIdResponse.itemId, user.username).then(
                                (deleteResponse) => {
                                    if (deleteResponse.data.success === true) {
                                        resolve({ success: true, message: 'Item deleted: ' + layerToRemove });
                                    } else {
                                        //could not delete item
                                        reject({
                                            success: false,
                                            message: 'Error deleting item: ' + layerToRemove,
                                        });
                                    }
                                },
                                () => {
                                    reject({ success: false, message: 'Error deleting item: ' + layerToRemove });
                                }
                            );
                        },
                        () => {
                            reject({ success: false, message: 'Error getting current user.' });
                        }
                    );
                } else {
                    reject({ success: false, message: 'Error getting layer id for: ' + layerToRemove });
                }
            },
            () => {
                reject({ success: false, message: 'Error getting layer id for: ' + layerToRemove });
            }
        );
    });
}

/**
 * Get the PortalItem from Portal by ID.
 * @param itemId - id of Portal Item to return.
 */
export async function getPortalItemById(itemId: string): Promise<PortalItem | undefined> {
    const appConfig = await ConfigHelper.loadAppConfig(); ///////
    return await queryPortalItemById(
        itemId,
        appConfig ? appConfig.portalUrl : '',
        appConfig ? appConfig.oauthAppId : ''
    );
}

/**
 * get a portal item by the portal item id from an url string.
 * @param url : string Get the portal item id for a service url
 */
export async function getPortalItemIdFromUrl(url: string): Promise<string | undefined> {
    const requestParams = {
        query: { f: 'json' },
        authMode: 'auto',
    } as __esri.RequestOptions;
    const response = await Request(url, requestParams);
    return response.data?.serviceItemId;
}

/**
 * Filter portal items by different criteria
 * @param searchCategories : string categories to search items by
 * @param sortField : string the field to sort on if necessary
 * @param sortOrder : string how to sort the values 'asc' or 'desc'
 * @param gateMissionsOnly : boolean set to true to only get GATE missions
 * @param typeKeywords : string the typeKeyword to search for
 */
export async function getMissionList(
    searchCategories: string,
    sortField: string,
    sortOrder: string,
    gateMissionsOnly: boolean,
    typeKeywords: string
): Promise<IItem[]> {
    const appConfig = ConfigHelper.getAppConfig();
    const portal = await getDefaultPortal();
    const startIndex = 0; // change back to let if more items than 100 needed?

    let missions: IItem[] = [];
    if (portal) {
        let query = '';
        if (gateMissionsOnly) {
            query = `(
                (
                    type:"${appConfig.types.webMappingApplication}" typekeywords:"${typeKeywords}"
                )
            OR (
                    type:"${appConfig.types.application}" typekeywords:"${typeKeywords}"
                )
            )`;
        } else if (typeKeywords && typeKeywords.trim() === appConfig.typekeywords.immadExercise) {
            query = `(  
                (
                        type:"${appConfig.types.application}" typekeywords:"${typeKeywords}"
                )
                OR (
                    type:"${appConfig.types.application}" typekeywords:"${appConfig.typekeywords.gateExercise}"
                )
            )`;
        } else {
            query = `(
                (
                    type:"${appConfig.types.webMappingApplication}" tags:"${appConfig.tags.application}"
                )
                OR (
                        type:"${appConfig.types.application}" typekeywords:"${appConfig.typekeywords.immadMission}"
                )
                OR (
                    type:"${appConfig.types.application}" typekeywords:"${appConfig.typekeywords.gateMission}"
                )
            )`;
        }
        await portal.load().then(async () => {
            const queryParams = {
                query: query,
                sortField: sortField,
                sortOrder: sortOrder.toLowerCase(),
                num: 100,
                start: startIndex,
            } as __esri.PortalQueryParams;

            if (searchCategories !== '') {
                queryParams.categories = [searchCategories];
            }

            await portal.queryItems(queryParams).then((result) => {
                if (result.results.length) {
                    missions = [...(result.results as IItem[])];
                }
            });
        });
    }

    return missions;
}

/**
 * Find item the meet the following criteria, a more generic type of getMissionList()
 * @param itemType ie Web Scene | Web Map | Group
 * @param searchValue containers this string
 * @param tags has these tags
 * @param searchCategories matches these categories
 * @param sortField field to sort on
 * @param sortOrder sort order ASC | DESC
 * @param owner : string owner name but defaults to '*'
 */
export async function getPortalItems(
    itemType: string,
    searchValue: string,
    tags: string[],
    searchCategories: string,
    sortField: string,
    sortOrder: string,
    owner = '*'
): Promise<IItem[]> {
    const portal = await getDefaultPortal();
    const startIndex = 0; // change back to let if more items than 100 needed?

    let items: IItem[] = [];

    if (portal) {
        await portal.load().then(async () => {
            const query = `${searchValue} type:"${itemType}" tags:"${tags}" owner:"${owner}"`;

            const queryParams = {
                query: query,
                sortField: sortField,
                sortOrder: sortOrder.toLowerCase(),
                num: 100,
                start: startIndex,
            } as __esri.PortalQueryParams;

            if (searchCategories !== '') {
                queryParams.categories = [searchCategories];
            }

            await portal.queryItems(queryParams).then((result) => {
                if (result.results.length) {
                    items = [...(result.results as IItem[])];
                }
            });
        });
    }

    return items;
}

/**
 * Checks if itemId passed in is a group.
 * If item id is a group it will return true else return false
 * @param itemId : string Portal Item id
 */
export async function checkIfItemIdIsGroup(itemId: string): Promise<boolean | undefined> {
    const session = await getUserSession();
    const portalRestUrl = await getPortalRestUrl();
    return searchItems({
        q: itemId,
        sortField: 'created',
        sortOrder: 'desc',
        authentication: session,
        portal: portalRestUrl,
    })
        .then((result) => {
            return !result.results.length;
        })
        .catch((error) => {
            LogHelper.log(error, true);
            return true;
        });
}

/**
 * Take the group id and get the webScene id back or the itemId sent in
 * @param itemID : string group id or webScene id.
 */
export async function updateGroupToScene(itemID: string): Promise<string> {
    let returnObject = itemID;
    const groupContent = await getGroupContentByGroupId(itemID);
    if (groupContent) {
        const webScene = groupContent.find((element) => element.type === 'Web Scene');
        if (webScene) {
            returnObject = webScene.id;
        }
    }
    return returnObject;
}

/**
 * This function will delete any portal items in the array of id's passed in.
 * @param itemIds : string[] array of portal item id's to delete from the portal
 */
export async function deletePortalItems(itemIds: string[]): Promise<boolean> {
    let allSuccessful = true; // Assume all deletions are successful initially
    try {
        for (const itemId of itemIds) {
            const item = new PortalItem({
                id: `${itemId}`,
            });
            await item.load();
            const owner = item.owner;
            const deleteResponse = await deleteItemById(itemId, owner);
            if (deleteResponse.data.success === true) {
                console.debug(`Item ${itemId} deleted successfully`);
            } else {
                console.error(`Failed to delete item ${itemId}: ${deleteResponse}`);
                allSuccessful = false; // Update status to indicate failure
            }
        }
    } catch (error) {
        console.error('Error deleting items:', error);
        allSuccessful = false; // Update status to indicate failure
    }
    return allSuccessful;
}

/**
 * Delete item by portal item ID
 * @param itemId : string portal item ID
 * @param ownerName : owner of the item to delete
 */
export async function deleteItemById(itemId: string, ownerName: string): Promise<__esri.RequestResponse> {
    return Request(
        EsriConfig.portalUrl + '/sharing/rest/content/users/' + ownerName + '/items/' + itemId + '/delete?f=json',
        { method: 'post', authMode: 'auto' }
    );
}
