import { GetAllVisibleRegions, regionQueryResult } from '@stratcom/lib-functions';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';

/**
 * This interface describes the item objects for the calendar
 * the top items are required the rest are optional as marked by a ?
 */
export interface ITimelineItem {
    id: string | number;
    group: string | number;
    title: string;
    start_time: number;
    end_time: number;
    canMove?: boolean;
    canResize?: boolean | 'left' | 'right' | 'both';
    canChangeGroup?: boolean;
    className?: string;
    style?: React.CSSProperties;
    itemProps?: React.HTMLAttributes<HTMLDivElement>;
    selected?: boolean;
    itemContext?: any;
    importantAnniversary: boolean;
}

/**
 * This interface describes the group objects for the calendar
 */

export interface IGroupItem {
    id: string | number;
    title: string;
    rightTitle?: string;
    stackItems?: boolean;
    height?: number;
    bgColor?: string;
    groupRenderer?: () => JSX.Element;
    order?: number;
    nestedGroups?: (string | number)[];
    showNestedItems?: boolean;
    canChangeStacking?: boolean;
    canMove?: boolean;
    canResize?: boolean;
    canSelect?: boolean;
    style?: React.CSSProperties;
}

/** This interface describes the array of IGroupItems */

export interface IGroupItems {
    items: IGroupItem[];
}

/**
 * Query the calendar FeatureClass to get values for the landing page
 * @param portalItemId feature layer portal item id to query
 */
export async function queryCalendar(portalItemId: string): Promise<regionQueryResult[]> {
    const fLayer = new FeatureLayer({
        portalItem: {
            id: portalItemId,
        },
    });
    // next query
    return GetAllVisibleRegions(fLayer);
}
