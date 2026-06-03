import { ICreateItemResponse, IGroup, IItem, IItemAdd, ISearchResult, IUpdateItemResponse } from '@esri/arcgis-rest-portal';
import { UserSession } from '@esri/arcgis-rest-auth';
import Portal from '@arcgis/core/portal/Portal';
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
export declare function getPortalItemDataById(portalItemId: string, portalUrl: string, oauthAppId: string): Promise<any>;
/**
 * Get Portal Item Data based on the portal item id
 * @param itemId portal item id
 * @param portalUrl url to the portal
 * Returns properties for the group. See interface CreateGroupResponseProp.
 * @param oauthAppId
 */
export declare function getPortalItemData(itemId: string, portalUrl: string, oauthAppId: string): Promise<CreateGroupResponseProp>;
/**
 *
 * @param itemType
 * @param portalUrl url to the portal
 *  @param oauthAppId
 *  @param searchField the field to search
 * @param searchValue the value to seek out
 * @param num : number The number of items to request for paging.
 */
export declare function findPortalItemsByType(itemType: string, portalUrl: string, searchField: string | undefined, searchValue: string | undefined, oauthAppId: string, num?: number): Promise<ISearchResult<IItem> | undefined>;
/**
 *  Creates a new portal item for the current portal and current signed-in user.
 *  @param itemProps The portal item properties
 *  @param portalUrl the url to the ArcGIS Portal to create the item on.
 * @param oauthAppId
 */
export declare function createPortalItem(itemProps: IItemAdd, portalUrl: string, oauthAppId: string): Promise<ICreateItemResponse | undefined>;
/**
 * Get the portal's rest URL.
 * @param portalUrl URL to the default portal
 * Returns the URL as a string or undefined if not found.
 */
export declare function getThePortalRestUrl(portalUrl: string): Promise<string | undefined>;
/**
 * Get the PortalItem from default portal based on the provided portal item id using the queryItems method.
 * @param itemId - id of portal item
 * @param portalUrl URL to the default portal
 * Returns a PortalItem or undefined if not found.
 * @param oauthAppId
 */
export declare function queryPortalItemById(itemId: string, portalUrl: string, oauthAppId: string): Promise<PortalItem | undefined>;
/**
 * Get the PortalItem from default portal based on the provided portal item id using the getItem method.
 * @param itemId - id of portal item
 * @param portalUrl URL to the default portal
 * @param oauthAppId
 * Returns a PortalItem or undefined if not found.
 */
export declare function findAPortalItemById(itemId: string, portalUrl: string, oauthAppId: string): Promise<IItem | undefined>;
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
export declare function queryPortal(queryString: string, portalUrl: string, maxRecordsToRetrieve: number | undefined, extent: Extent | undefined, oauthAppId: string, start?: number, searchCategories?: string[], signal?: AbortSignal): Promise<any>;
/**
 * shares content from the current user with a group
 * @param portal arcgis Portal object
 * @param itemId id of the item in portal to share
 * @param groupIds group id's to share the item to
 * @param shareWithOrganization allows user to also share item to organization. Default value = false
 */
export declare function shareItemsWithGroup(portal: Portal, itemId: string, groupIds: string[], shareWithOrganization?: boolean): Promise<any>;
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
export declare function updatePortalWebApp(itemId: string, itemParams: string, session: UserSession, portalRestUrl: string): Promise<IUpdateItemResponse>;
/**
 * Get the content belonging to a specific portal group.
 * @param portalUrl the portal url string,
 * @param oauthAppId
 * @param groupId group id
 * @param maxRecordsToReturn  maximum number of records to return defaults to 500 max
 */
export declare function getGroupContentByGroupId(portalUrl: string, oauthAppId: string, groupId: string, maxRecordsToReturn?: number): Promise<IItem[]>;
export {};
