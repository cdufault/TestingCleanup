/// <reference types="node" />
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { IItem, ISearchResult } from '@esri/arcgis-rest-portal';
/**Describes if the region display page will auto rotate in presentation mode or be a standard page */
export type RegionDisplayModeType = 'Standard' | 'Presentation';
/** Holds the counts data for a row in the counts widget. All object keys will be a string and the value
 * can be string or number */
export interface ICountsData {
    /**row of data */
    [key: string]: number | string;
}
/**models item props for supporting user defined summary totals*/
export interface ISummaryItem {
    /**row number starting at top to bottom - 1 to n*/
    totalCount: number | string;
    /**name of the column */
    columnLabel: string;
    /**tooltip for user defined summaries */
    tooltipText?: string;
}
/**structure of the data returned to the UI for construction of the counts table */
export interface IQueryCountWidgetTableResults {
    /**label for the summary row */
    summaryRowLabel: string;
    /**counts data */
    tableData: ICountsData[];
    /**last time the data was updated */
    lastUpdatedDate: string;
    /**summary row totals for the counts table */
    totals: ISummaryItem[];
    /**indicate if the totals/summary has been defined by the user */
    userDefinedTotals: boolean;
    /**number of minutes to wait before making a call to refresh the data */
    refreshIntervalInMinutes?: number;
}
/**
 * Represents the relevant data associated with a client side cached feature layer that is used to
 * generate activity counts
 */
export interface LayerCacheObj {
    /**name of the mission */
    missionName: string;
    /**portal item id for the feature class */
    ftrClassId: string;
    /**cached feature layer */
    layerObj: any;
}
/**
 * Execute a query for counting rows that satifies the query
 * @param fLayer the feature layer to query
 * @param where the where clause
 */
export declare function QueryCount(fLayer: FeatureLayer, where: string): Promise<number>;
/**
 * Get the most recent updated item's date
 * @param fLayer featurelayer with counts data
 * @param dateFieldName field name for the date
 */
export declare function QueryMaxDateUsingStats(fLayer: FeatureLayer, dateFieldName?: string): Promise<string>;
/**
 * Get the most recent updated item's date
 * @param fLayer featurelayer with counts data
 * @param dateFieldName field name for the date
 */
export declare function QueryMaxDate(fLayer: FeatureLayer, dateFieldName?: string): Promise<string>;
/**
 * Query for counts data based on a configuration JSON definition
 * @param sampleDataObj data
 * @param lastUpdatedFieldName field holding the last time the row was updated
 * @param cachedFeatureLayer cached client side feature layer or undefined if retrieving data from network endpoin
 * @param runQueriesSequentially optional flag to indicate if queries should be executed in batch or sequential mode
 * @param outFields fields to return from the query
 */
export declare function QueryForCountsLib(sampleDataObj: any, lastUpdatedFieldName?: string, runQueriesSequentially?: boolean, cachedFeatureLayer?: LayerCacheObj[], outFields?: string[]): Promise<IQueryCountWidgetTableResults>;
/**
 * Get the item/text data for a portal item
 * @param portalItemId portal item id
 * @param portalUrl portal URL
 * @param oauthAppId
 */
export declare function retrieveRegionItemData(portalItemId: any, portalUrl: string, oauthAppId: string): Promise<any>;
/**
 * Get the item/text data for a portal item
 * @param portalItemId portal item id
 * @param portalUrl portal URL
 * @param oauthAppId
 */
export declare function retrieveRegionAppData(portalItemId: any, portalUrl: string, oauthAppId: string): Promise<any>;
/**
 *
 * @param portalUrl portal URL
 * @param typeKeywords typekeywords to apply to application object
 * @returns Promise<ISearchResult<IItem> | undefined>
 */
export declare function findAppByKeywordAndType(portalUrl: string, typeKeywords: string, oauthAppId: string): Promise<ISearchResult<IItem> | undefined>;
/**
 * Class for creating and downloading GATE data to the client
 */
export declare class CountLayersCache {
    static countConfigs: Map<string, any>;
    static updateFrequencyInSeconds: number;
    static lastUpdateFieldName: string;
    static updateFtrLayerDataTimer: NodeJS.Timer;
    static countLayersArray: LayerCacheObj[];
    /**
     * Given a mission name look for cached layer objects and return them if found
     * @param missionName name of the mission
     * @returns LayerCacheObj[]
     */
    static getCountLayerObjs(missionName: string): LayerCacheObj[];
    /**
     * Add the mission application data into a static map object
     * @param missionName name of the mission
     * @param payload application data for generating GATE counts for this mission
     */
    static addConfig(missionName: string, payload: any): void;
    /**
     * Build client side feature layers by processing all the activity counts configuration objects on the
     * mission application object.
     * @param lastUpdateFieldName name of the field holding the last update timestamp
     * @param updateFrequencyInSeconds frequency to update the cached client side data specified in seconds
     * defaults to 240 if not specified
     */
    static processAllConfigs(lastUpdateFieldName: string, updateFrequencyInSeconds?: number): Promise<void>;
    /**
     * Currently not supporting complex/compound queries (AND/OR). Save this parsing code for later implementation
     * foo = "bar" | foo in ("a","b","c") | foo = "bar" AND bar = "foo" | foo = "bar" OR bar = "foo"
     * foo = "bar" AND bar = "foo" OR bar = "bar" | foo = "bar" AND bar = "foo" OR bar IN ("foo","bar")
     * @param queries
     */
    static parseQuery(queries: string[]): string[];
    /**
     * Generate a client side feature layer for a GATE activity counts row
     * @param portalItemId portal item id for the layer - (row in GATE table)
     * @param outFields output query fields - generated based on the queries defined for the columns
     * @returns a client side feature layer
     */
    static createClientSideFeatureLayer(portalItemId: string, outFields: string[]): Promise<any>;
    /**
     * Launch the update interval for the cache
     */
    static start(): void;
    /**
     * Cleanup the timer interval
     */
    static stop(): void;
}
