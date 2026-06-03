import { DataFeedItem, FilterGroups, PortalGroups } from '../resources';
import PortalItem from '@arcgis/core/portal/PortalItem';
import { getMissionIdByTitle } from '../../../../helpers/missionHelper';
import Extent from '@arcgis/core/geometry/Extent';
import { queryPortal } from '@stratcom/lib-functions';

/**
 * @param AppConfig AppConfig object from application slice as it can't be called here.
 * @param searchText text to search for
 * @param filterGroups filter by group
 * @param userGroups available groups
 * @param itemTypes portal query item types, valid values listed at https://developers.arcgis.com/rest/users-groups-and-items/items-and-item-types.htm
 * @param tags filter results by tag
 * @param portalUsername filter by user
 * @param myOrganization filter to include all layers in organization
 * @param currentMission filter by mission
 * @param extent limit results by extent
 * @param signal optional AbortSignal
 * @param searchCategories portal categories defined on an item to be used as query criteria
 * @param start the index to start returning item - generally used when subsequent calls are made to get additional
 * results after the initial call has been filled
 * @param orgId options string value for Organization ID
 * @returns datafeeds:DataFeedItem[], stats:{ nextStart:number, recordCount: number }
 */
async function loadDataFeeds(
    AppConfig: any,
    searchText: string,
    filterGroups: FilterGroups,
    userGroups: PortalGroups,
    itemTypes: string[],
    tags: string[] | undefined,
    portalUsername: string | undefined,
    myOrganization: boolean,
    currentMission: string | undefined,
    extent: Extent | undefined,
    signal?: AbortSignal,
    searchCategories?: string,
    start?: number,
    orgId?: string
): Promise<{ datafeeds: DataFeedItem[]; stats: { nextStart: number; recordCount: number } }> {
    const groups = [];
    if (userGroups.admin) {
        filterGroups.admin && groups.push(userGroups.admin);
    }
    if (userGroups.missionManager) {
        filterGroups.missionManager && groups.push(userGroups.missionManager);
    }
    if (userGroups.analyst) {
        filterGroups.analyst && groups.push(userGroups.analyst);
    }

    const textStr = searchText ? `(${searchText})` : '';

    let groupStr = '';
    if (groups.length > 0) {
        groupStr = `group:(${groups.join(' OR ')})`;
    }

    if (currentMission) {
        const currentMissionId = await getMissionIdByTitle(currentMission);
        if (currentMissionId && groups.length > 0) {
            groupStr = `group:((${groups.join(' OR ')}) AND ${currentMissionId})`;
        } else if (currentMissionId) {
            groupStr = `group:(${currentMissionId})`;
        }
    }

    let orgOwnerStr = '';
    if (myOrganization) {
        orgOwnerStr = orgId ? `orgid:(${orgId})` : 'orgid:(0123456789ABCDEF)';
    }
    if (portalUsername) {
        orgOwnerStr = orgOwnerStr ? `(${orgOwnerStr}  OR owner:("${portalUsername}"))` : `owner:("${portalUsername}")`;
    }

    const layersStr = `type:(${itemTypes.map((type) => `"${type}"`).join(' OR ')})`;

    let tagStr = '';
    if (tags && tags.length > 0) {
        tagStr = `tags:(${tags.map((tag) => `"${tag}"`).join(' OR ')})`;
    }

    const queryString = `${textStr} ${groupStr} ${orgOwnerStr} ${layersStr} ${tagStr}`;
    const maxRecordsToRetrieve = 100;
    const oauthAppId = AppConfig ? AppConfig.oauthAppId : '';
    const filteredItems = await queryPortal(
        queryString,
        AppConfig.portalUrl,
        maxRecordsToRetrieve,
        extent,
        oauthAppId,
        start ? start : 1,
        searchCategories ? [searchCategories] : [''],
        signal
    );
    if (!filteredItems || filteredItems.type === 'error') {
        //Return from here as there is no data and send up error or null
        return filteredItems;
    }
    const nextStart = filteredItems.data.nextStart;
    const recordCount = filteredItems.data.total;
    const datafeeds = filteredItems.data.results.map((portalItem: PortalItem) => {
        return {
            isLoading: false,
            isVisible: false,
            hasError: false,
            groupName: '',
            portalItem: portalItem,
        } as DataFeedItem;
    });
    return { datafeeds, stats: { nextStart, recordCount } };
}

export { loadDataFeeds };
