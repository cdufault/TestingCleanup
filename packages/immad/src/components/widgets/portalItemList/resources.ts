import Layer from '@arcgis/core/layers/Layer';
import PortalItem from '@arcgis/core/portal/PortalItem';

/**
 * Item type for a portal item
 */
export interface DataFeedItem {
    isLoading: boolean;
    isVisible: boolean;
    mapLayer?: Layer;
    sceneLayer?: Layer;
    hasError: boolean;
    portalItem: PortalItem;
    groupName: string;
}

/**
 * Item type for storing portal group ids
 */
export interface PortalGroups {
    admin: string | undefined;
    missionManager: string | undefined;
    analyst: string | undefined;
}

/**
 * Item type for filtering by portal group
 */
export interface FilterGroups {
    admin: boolean;
    missionManager: boolean;
    analyst: boolean;
    [key: string]: boolean;
}

/**
 * sort types
 */
export enum SortType {
    'TITLE',
    'MODIFIED',
    'OWNER',
    'VIEW_COUNT',
}

/**
 * extents can be either for the selected mission or the current view
 */
export enum ExtentType {
    'MISSION',
    'VIEW',
}

/**
 * sort direction, ascending or descending
 */
export type SortDirection = 'ASC' | 'DESC';

/**
 * @param feeds array of portal items
 * @param sortType sort type
 * @param sortDirection sort direction
 * @returns a sorted array of portal items
 */
export function sortDataFeeds(feeds: DataFeedItem[], sortType: SortType, sortDirection: SortDirection): DataFeedItem[] {
    let sortFunc: (a: DataFeedItem, b: DataFeedItem) => number = (a, b) =>
        a.portalItem.modified > b.portalItem.modified ? 1 : -1;

    switch (sortType) {
        case SortType.TITLE:
            if (sortDirection === 'ASC') {
                sortFunc = (a, b) => (a.portalItem.title.toUpperCase() > b.portalItem.title.toUpperCase() ? 1 : -1);
            } else {
                sortFunc = (a, b) => (a.portalItem.title.toUpperCase() < b.portalItem.title.toUpperCase() ? 1 : -1);
            }
            break;
        case SortType.OWNER:
            if (sortDirection === 'ASC') {
                sortFunc = (a, b) => (a.portalItem.owner.toUpperCase() > b.portalItem.owner.toUpperCase() ? 1 : -1);
            } else {
                sortFunc = (a, b) => (a.portalItem.owner.toUpperCase() < b.portalItem.owner.toUpperCase() ? 1 : -1);
            }
            break;
        case SortType.MODIFIED:
            if (sortDirection === 'ASC') {
                sortFunc = (a, b) => (a.portalItem.modified > b.portalItem.modified ? 1 : -1);
            } else {
                sortFunc = (a, b) => (a.portalItem.modified < b.portalItem.modified ? 1 : -1);
            }
            break;
        case SortType.VIEW_COUNT:
            if (sortDirection === 'ASC') {
                sortFunc = (a, b) => (a.portalItem.numViews > b.portalItem.numViews ? 1 : -1);
            } else {
                sortFunc = (a, b) => (a.portalItem.numViews < b.portalItem.numViews ? 1 : -1);
            }
            break;
    }

    return [...feeds].sort(sortFunc);
}
