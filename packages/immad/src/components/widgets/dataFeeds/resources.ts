import Layer from '@arcgis/core/layers/Layer';
import PortalItem from '@arcgis/core/portal/PortalItem';

export interface DataFeedItem {
    isLoading: boolean;
    isVisible: boolean;
    layer?: Layer;
    hasError: boolean;
    portalItem: PortalItem;
    groupName: string;
}

export interface PortalGroups {
    admin: string | undefined;
    missionManager: string | undefined;
    analyst: string | undefined;
}

export interface FilterGroups {
    admin: boolean;
    missionManager: boolean;
    analyst: boolean;
    [key: string]: boolean;
}

export enum SortType {
    'TITLE',
    'MODIFIED',
    'OWNER',
    'VIEW_COUNT',
}

export enum ExtentType {
    'MISSION',
    'VIEW',
}

export type SortDirection = 'ASC' | 'DESC';

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
