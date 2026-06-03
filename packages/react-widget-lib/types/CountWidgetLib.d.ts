import { IQueryCountWidgetTableResults, RegionDisplayModeType } from "@stratcom/lib-functions";
/**CountWidget props */
interface CountsWidgetProps {
    /** URL to the default portal */
    portalUrl: string;
    /** oauth application id from portal */
    oauthAppId: string;
    /** GATE Application typekeywords */
    gateTypeKeywords: string;
    /** Describes if the region display page will auto rotate in presentation mode or be a standard page */
    currentDisplayMode: RegionDisplayModeType;
    /** Alternating colors for the Count Widget categories. */
    categoryRowColors: string[];
    /** regionName should map to the name of the region and the regionName param in the JSON def that is
     * stored on the group/mission application object
     */
    regionName: string;
    /**pass a function to the widget that it can call to get the data */
    retrieveDataFunc?: () => Promise<IQueryCountWidgetTableResults>;
    /**pass the required data directly into the widget */
    activityCountsData?: IQueryCountWidgetTableResults;
    /**a function to callback when the counts are done calculating */
    countsCallbackFunc?: () => void;
    /**the application data object attached to the mission/group that holds the count configuration data */
    appData?: any;
    /**feature class field name holding the last time the row was updated */
    lastUpdatedFieldName?: string;
    /**if true run the queries one at a time waiting for each one to return before sending the next */
    executeCountQueriesSequentially?: boolean;
    cachedFeatureLayer?: any | undefined;
}
/**Counts widget initial template, will likely need props to support this widget as a shared library item */
export declare const CountWidgetLib: (props: CountsWidgetProps) => JSX.Element;
export {};
