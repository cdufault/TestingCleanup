import {
    createGroup,
    getGroupContent,
    getItemGroups,
    IGroup,
    IGroupAdd,
    IItem,
    ISharingResponse,
    isItemSharedWithGroup,
    IUser,
    removeGroup,
    searchGroups,
    SearchQueryBuilder,
    shareItemWithGroup,
    unshareItemWithGroup,
    updateGroup,
} from '@esri/arcgis-rest-portal';
import { getDefaultPortal, getPortalRestUrl } from './defaultPortalHelper';
import { getUserSession } from './userSessionHelper';
import Portal from '@arcgis/core/portal/Portal';
import { MapLayerInfo } from '../interfaces/MapLayerTypes';
import { shareItemsWithGroup } from '@stratcom/lib-functions';

/**
 * Create group response object.
 */
interface CreateGroupResponseProp {
    group?: IGroup;
    success: boolean;
}

/**
 * Search portal group response
 */
interface SearchPortalResponseProp {
    item: IItem[] | IUser[] | IGroup[] | any[];
    success: boolean;
}

/**
 * Update group description response
 */
interface UpdateGroupDescrProp {
    groupId: string;
    success: boolean;
}

/**
 * Find the groups that an item is shared to.
 * @param itemId item id
 */
export async function getPortalGroupsItemIsSharedTo(itemId: string): Promise<SearchPortalResponseProp> {
    const resultObj: SearchPortalResponseProp = {
        item: [],
        success: false,
    };
    const portalRestUrl = await getPortalRestUrl();
    const session = await getUserSession();

    await getItemGroups(itemId, {
        authentication: session,
        portal: portalRestUrl,
    })
        .then((response) => {
            let item1: IGroup[] = [];
            let item2: IGroup[] = [];
            if (response && response.admin) item1 = [...response.admin];
            if (response && response.member) item2 = [...response.member];
            resultObj.item = item1.concat(item2);
            resultObj.success = true;
        })
        .catch((error) => {
            console.error(error);
        });
    return resultObj;
}

/**
 * Limited functionality for now, this can be revisited later to add updating other relevant group properties.
 * @param groupId group id
 * @param description group description
 * @param tags  group tags
 * @param snippet short description shown in cards
 * @param categories category keywords for the group
 */
export async function updatePortalGroup(
    groupId: string,
    description: string,
    tags: string[],
    snippet = '',
    categories: string[]
): Promise<UpdateGroupDescrProp> {
    let resultObj: UpdateGroupDescrProp = {
        groupId: '',
        success: false,
    };
    const portalRestUrl = await getPortalRestUrl();
    const session = await getUserSession();

    await updateGroup({
        authentication: session,
        portal: portalRestUrl,
        group: {
            id: groupId,
            description,
            snippet: snippet,
            tags,
            categories,
        },
    })
        .then((response) => {
            resultObj = response;
        })
        .catch((error) => {
            console.error(error.message, error);
        });
    return resultObj;
}

/**
 * Determine if an item is shared to a specific portal group.
 * @param groupId group id
 * @param itemId item id
 */
export async function isItemSharedWithPortalGroup(groupId: string, itemId: string): Promise<boolean> {
    let resultState = false;
    const session = await getUserSession();
    const portalRestUrl = await getPortalRestUrl();
    if (session) {
        await isItemSharedWithGroup({
            id: itemId,
            groupId: groupId,
            authentication: session,
            portal: portalRestUrl,
        })
            .then((result) => {
                resultState = result; //TODO test this result object
            })
            .catch((error) => {
                console.error(error);
            });
    }
    return resultState;
}

/**
 * Unshare item with a portal group
 * @param groupId portal group id
 * @param itemId item id
 * @param itemOwner item owner
 */
export async function unshareItemWithPortalGroup(
    groupId: string,
    itemId: string,
    itemOwner?: string
): Promise<string[] | string> {
    let resultState: string | string[] = 'Failed';
    const session = await getUserSession();
    if (!session) {
        console.debug('User session returned was undefined');
        return resultState;
    }
    const portalRestUrl = await getPortalRestUrl();
    await unshareItemWithGroup({
        id: itemId,
        groupId: groupId,
        authentication: session,
        portal: portalRestUrl,
        owner: itemOwner ? itemOwner : session ? session.username : '',
    })
        .then((result) => {
            resultState = result.notUnsharedFrom ? result.notUnsharedFrom : 'Failed';
        })
        .catch((error) => {
            console.error(error);
        });
    return resultState;
}

/**
 * shares content from the current user with a group
 * @param itemId id of the item in portal to share
 * @param groupIds group id's to share the item to
 * @param shareWithOrganization allows user to also share item to organization. Default value = false
 */
export async function shareItemsWithGroupLib(
    itemId: string,
    groupIds: string[],
    shareWithOrganization?: boolean
): Promise<any> {
    const portal = await getDefaultPortal();
    return portal && (await shareItemsWithGroup(portal, itemId, groupIds, shareWithOrganization));
}

/**
 *
 * @param groupId
 * @param itemId
 * @param itemOwnerUserName : optional, will default to the current user
 * @param confirmItemControl : optional, is item controlled
 */
export async function shareItemWithPortalGroup(
    groupId: string,
    itemId: string,
    itemOwnerUserName?: string,
    confirmItemControl?: boolean
): Promise<ISharingResponse> {
    //let resultState = false;
    let result: ISharingResponse = {
        notSharedWith: [groupId],
        notUnsharedFrom: [],
        itemId: itemId,
    };
    const session = await getUserSession();
    const portalRestUrl = await getPortalRestUrl();
    if (session) {
        await shareItemWithGroup({
            id: itemId,
            groupId: groupId,
            authentication: session,
            portal: portalRestUrl,
            owner: itemOwnerUserName ? itemOwnerUserName : session.username,
            confirmItemControl: confirmItemControl,
        })
            .then((_result) => {
                //resultState = true; //TODO can we make this assumption
                result = _result;
            })
            //.then((_result) => {
            //resultState = true; //TODO can we make this assumption

            //})
            .catch((error) => {
                console.error(error);
            });
    }

    return result;
}

/**
 * Find a portal group by id.
 * @param groupId portal group id
 */
export async function deletePortalGroup(groupId: string): Promise<boolean> {
    let resultState = false;
    const portalRestUrl = await getPortalRestUrl();
    const session = await getUserSession();
    if (session) {
        await removeGroup({
            id: groupId,
            authentication: session,
            portal: portalRestUrl,
        })
            .then((result) => {
                resultState = result.success;
                console.debug(`Group ${groupId} deleted successfully`);
            })
            .catch((error) => {
                console.error(error);
            });
    }
    return resultState;
}

/**
 * Find a portal group that has a certain tag.
 * @param tag portal tag
 */
export async function findPortalGroupsByTag(tag: string): Promise<SearchPortalResponseProp> {
    let resultObj: SearchPortalResponseProp = {
        item: [],
        success: false,
    };
    const query = new SearchQueryBuilder().match(tag).in('tags');
    const session = await getUserSession();
    await searchGroups({
        num: 100,
        sortField: 'created',
        sortOrder: 'desc',
        q: query,
        authentication: session,
    })
        .then((result) => {
            resultObj = {
                item: result.results,
                success: true,
            };
        })
        .catch((error) => {
            console.error(error);
        });
    return resultObj;
}

/**
 * Find a portal group that has a certain typeKeyword.
 * Typekeywords are safer than tags for searching because they cannot be set or removed in the main Portal UI.
 * @param typeKeyword portal typeKeyword
 */
export async function findPortalGroupsByTypekeyword(typeKeyword: string): Promise<SearchPortalResponseProp> {
    let resultObj: SearchPortalResponseProp = {
        item: [],
        success: false,
    };
    const query = new SearchQueryBuilder().match(typeKeyword).in('typekeywords');
    const portalRestUrl = await getPortalRestUrl();
    const session = await getUserSession();
    await searchGroups({
        num: 100,
        sortField: 'created',
        sortOrder: 'desc',
        q: query,
        authentication: session,
        portal: portalRestUrl,
    })
        .then((result) => {
            resultObj = {
                item: result.results,
                success: true,
            };
        })
        .catch((error) => {
            console.error(error);
        });
    return resultObj;
}

/**
 * This is a fuzzy search that finds terms within the name. So Foo will match MyFooBar. If you need to compare a specific name then do this:
 * To get an exact match if the result.success === true then get the result.item[0].title and do an exact comparison.
 * Example if(result.success && result.item.length > 0){ return result.item[0].title === someMissionName; }
 * @param groupTitle name of the group/mission
 */
export async function findPortalGroupByTitle(groupTitle: string): Promise<SearchPortalResponseProp> {
    let resultObj: SearchPortalResponseProp = {
        item: [],
        success: false,
    };
    const query = new SearchQueryBuilder().match(groupTitle).in('title');
    const session = await getUserSession();
    const portalRestUrl = await getPortalRestUrl();
    await searchGroups({
        q: query,
        authentication: session,
        portal: portalRestUrl,
    })
        .then((result) => {
            let group: IGroup[] = [];

            //this will filter results to try and find an exact match
            //if groups have the same title, this will not work
            if (result.results.length > 1) {
                const regex = new RegExp(`^${groupTitle}$`);
                group = result.results.filter((item) => regex.test(item.title));
            }

            resultObj = {
                item: group.length ? group : result.results,
                success: true,
            };
        })
        .catch((error) => {
            console.error(error);
        });
    return resultObj;
}

/**
 * Create a portal group.
 * @param props a collection of IGroupAdd properties
 */
export async function createPortalGroup(props: IGroupAdd): Promise<CreateGroupResponseProp> {
    const session = await getUserSession();
    const portalRestUrl = await getPortalRestUrl();
    let result: CreateGroupResponseProp = {
        group: undefined,
        success: false,
    };
    await createGroup({
        group: {
            title: props.title,
            access: props.access,
            description: props.description,
            snippet: props.snippet,
            tags: props.tags,
            categories: props.categories,
            isViewOnly: false, //users can add content
            isInvitationOnly: true, //
            sortField: props.sortField != undefined ? props.sortField : 'title',
            sortOrder: props.sortOrder != undefined ? props.sortOrder : 'asc',
        },
        authentication: session,
        portal: portalRestUrl,
    })
        .then((res) => {
            result = res;
        })
        .catch((error) => {
            console.error(error);
        });
    return result;
}

/**
 * Get the content belonging to a specific portal group.
 * @param groupId group id
 * @param maxRecordsToReturn  maximum number of records to return
 */
export async function getGroupContentByGroupId(groupId: string, maxRecordsToReturn = 500): Promise<IItem[]> {
    let portalItemsArray: any[] = [];
    const portalRestUrl = await getPortalRestUrl();
    const session = await getUserSession();
    await getGroupContent(groupId, {
        paging: {
            num: maxRecordsToReturn,
        },
        authentication: session,
        portal: portalRestUrl,
    })
        .then((result) => {
            portalItemsArray = result.items;
        })
        .catch((error) => {
            console.error(error);
        });
    return portalItemsArray;
}

/**
 * Get the imager layers based on portal groups and tags.
 * @param groupNames names of the portal group
 * @param tags array of tags
 */
export function getImageryLayersFromPortalByGroupAndTag(groupNames: string[], tags: string): Promise<MapLayerInfo[]> {
    return new Promise(async (resolve) => {
        const portal = new Portal();
        await portal.load();
        const portalUser = portal.user;
        const userGroups = await portalUser.fetchGroups();

        if (userGroups) {
            const analystGroups = userGroups.filter((group) => groupNames.includes(group.title));
            if (analystGroups) {
                const layerNames: MapLayerInfo[] = [];
                for (const group of analystGroups) {
                    await group
                        .queryItems({
                            query: "type: 'image service' AND tags: '" + tags + "'",
                        })
                        .then((response) => {
                            response.results.forEach((layer) => {
                                if (!layerNames.some((storedLayer) => storedLayer.itemId === layer.id)) {
                                    layerNames.push({
                                        name: layer.title,
                                        url: layer.url,
                                        itemId: layer.id,
                                        source: 'group',
                                        sr: layer.spatialReference,
                                    });
                                }
                            });
                        });
                }
                resolve(layerNames);
            }
        }
    });
}
