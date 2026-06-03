import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { IItem, ISearchResult } from '@esri/arcgis-rest-portal';
import Graphic from '@arcgis/core/Graphic';
/** structure for the return data after querying categories feature class */
export interface categoryQueryResult {
    /**region guid -- identifier from the associated region feature class */
    region_guid: string;
    /**category name/label */
    category: string;
    /**category level */
    category_level: string;
    /**category confidence/Expectation as defined by analyst */
    category_confidence: string;
    /**analyst comment */
    comment: string;
    /**global id value in the categories that represents the Primary key in Regions - quasi foreign key*/
    guid: string;
    /**icod : information cut off date - indicating how long this data should be considered valid */
    icod: Date | undefined;
}
/** structure for a general purpose input output data for updating/querying most GATE feature class    */
export interface GateUpdatePayload {
    /**region guid -- identifier from the associated region feature class */
    region_guid: string;
    /**category name/label */
    category: string;
    /**category level */
    category_level: string;
    /**category confidence/Expectation as defined by analyst */
    category_confidence: string;
    /**analyst comment */
    comments: string;
    /**global id value in the categories that represents the Primary key in Regions - quasi foreign key*/
    guid: string;
    /**j2 assessment text that displays on the Region page */
    j2_assessment: string;
    /**region summary that shows up on the landing page summary card */
    region_summary: string;
    /**name of the region */
    region_name: string;
    /**legacy term used for category */
    topic: string;
    j2_summary: string;
    /**human-readable classification */
    human_readable_class: string;
    /**record data is valid until this date*/
    icod: Date | undefined;
}
/**type for data to pass when updating J2Assessment features */
export type J2AssessmentProps = Pick<GateUpdatePayload, 'region_guid' | 'j2_summary' | 'region_name' | 'icod'>;
/**type for data to pass when updating Region Summary features */
export type RegionSummaryProps = Pick<GateUpdatePayload, 'region_guid' | 'region_summary' | 'icod'>;
/**type for data to pass when updating AnalystComment features */
export type AnalystCommentProps = Pick<GateUpdatePayload, 'human_readable_class' | 'topic' | 'region_guid' | 'comments' | 'region_name' | 'icod'>;
/**Confidence for a category */
export type ConfidenceType = 'expected' | 'not expected';
/**structure of the return data for a query to the trends feature class */
export interface AnalystCommentsQueryResult {
    /**text of the comment */
    comment: string;
    /**date of the comment */
    date: Date;
    /**optionally the category the trends comment applies to ie: Trucks, Boats, etc */
    category?: string | undefined;
    /**human-readable classification */
    human_readable_class?: string;
    /**record data is valid until this date*/
    icod?: Date | undefined;
}
/**Describes the data returned when querying the Regions feature class*/
export interface regionQueryResult {
    /**group/mission class id*/
    mission_id: string;
    /**region name/group name */
    region_name: string;
    /**id field in regions that is a quasi foreign key in categories*/
    guid: string;
}
/** Describes the Gate Calendar Event interface
 * to be expanded in future tickets*/
export interface GateCalendarEvent {
    /** The name of the region */
    region: string;
    /** The unique identifier for the region */
    regionGUID: string;
    /** The global identifier for the region */
    globalid: string;
    /** The name of the event */
    eventName: string;
    /** The start date and time of the event */
    startDate: Date;
    /** The end date and time of the event */
    endDate: Date;
    /** The location of the event, or null if not specified */
    location: string | null;
    /** A description of the event */
    description: string | null;
    /** An array of participant names */
    participants: string[];
    /** Indicates whether the event is recurring */
    recurring: boolean;
    /** The initial date when the event was created */
    initialDate: Date;
    /** The type of recurrence, or null if not recurring */
    recurrenceType: string | null;
    /** The pattern of recurrence, or null if not recurring */
    recurrencePattern: string | null;
    /** The end date of recurrence, or null if not recurring */
    recurrenceEndDate: Date | null;
    /** The number of occurrences, or null if not recurring */
    numberOfOccurrences: number;
    /** Indicates if the event is a follow-on of a master event */
    isChildRecord: boolean;
    /** Indicates if the event is the master event for recurrence */
    isMasterRecord: boolean;
    /** Parent identifier for the child records */
    parentGUID: string | null;
    /** The length of the event in days */
    lengthInDays: number;
    /** Indicates whether the event is an important anniversary */
    importantAnniversary: boolean;
    /** Additional comments or notes about the event */
    comments: string | null;
    /** The classification level of the event */
    classification: string;
    /** Indicates whether the event is highlighted */
    highlight: boolean;
    /** The event is using an alternate calendar   */
    alternateCalendar: string | null;
    /** If number of occurrences will be used or if a calculation needs to happen */
    isEndAfterOccurrencesChecked?: boolean;
    /**icod : information cut off date - indicating how long this data should be considered valid */
    icod: Date | undefined;
}
/** Describes the Gate Calendar Event interface but serializable for the slice */
export interface GateCalendarEventSerializable {
    /** The name of the region */
    region_name: string;
    /** The unique identifier for the region */
    objectid: string;
    /** The global identifier for the event */
    globalid: string;
    /** The name of the event */
    event_name: string;
    /** The start date and time of the event */
    date_start: number;
    /** The end date and time of the event */
    date_end: number;
    /** The location of the event, or null if not specified */
    location: string | null;
    /** A description of the event */
    description: string | null;
    /** An array of participant names */
    participants: string;
    /** Indicates whether the event is recurring */
    recurring: number;
    /** The initial date when the event was created */
    initial_date: number;
    /** The type of recurrence, or null if not recurring */
    recurrence_type: string | null;
    /** The pattern of recurrence, or null if not recurring */
    recurrence_pattern: string | null;
    /** The end date of recurrence, or null if not recurring */
    recurrence_end_date: number | null;
    /** The number of occurrences, or null if not recurring */
    number_of_occurrences: number;
    /** Indicates if the event is a follow-on of a master event */
    is_child_record: number;
    /** Indicates if the event is the master event for recurrence */
    is_master_record: number;
    /** Parent identifier for the child records */
    parent_guid: string | null;
    /** The length of the event in days */
    number_of_days: number;
    /** Indicates whether the event is an important anniversary */
    important_anniversary: number;
    /** Additional comments or notes about the event */
    comments: string | null;
    /** The classification level of the event */
    classification: string;
    /** Indicates whether the event is highlighted */
    highlight: boolean;
    /** The event is using an alternate calendar   */
    alternate_calendar: string | null;
    /**icod : information cut off date - indicating how long this data should be considered valid */
    icod: Date | undefined;
}
/**
 * The configurable headers for the GATE Region Cards on the GATE Landing page.
 */
export interface gateColumnHeaderObject {
    column1: string;
    column2: string;
    column3: string;
    column4: string;
}
/**
 * Describes a type consisting of a string value and an optional date value
 */
export interface textDateVal {
    textVal: string;
    dateVal?: Date | undefined;
}
/**
 * Describes an interface consisting of a string value and an optional date value for the RegionSummry items
 */
export interface IRegionSummary {
    summary: string;
    icod: Date | undefined;
}
/**
 * Get the GATE column header data for a portal item
 * @param portalItemId portal item id
 * @param portalUrl portal URL
 * @param oauthAppId
 */
export declare function RetrieveGateColumnHeaders(portalItemId: any, portalUrl: string, oauthAppId: string): Promise<any>;
/**
 * Get the global id value for the current region
 * @param fLayer layer for the regions feature class
 * @param regionId region/group/mission id value for the current region
 * @param outFieldsArray fields to return from query - defaults to all
 */
export declare function queryGateRegionFClassForGlobalIdLib(fLayer: FeatureLayer, regionId: string, outFieldsArray?: string[]): Promise<string | undefined>;
/**
 * Find object based on type keywords and object type
 * @param portalUrl URL to default portal
 * @param typeKeywords typekeywords used when the app was created
 */
export declare function findAppByKeywordAndTypeLib(portalUrl: string, typeKeywords: string, oauthAppId: string): Promise<ISearchResult<IItem> | undefined>;
/**
 * Get the item/text data for a portal item
 * @param portalItemId portal item id
 * @param portalUrl portal URL
 * @param oauthAppId
 */
export declare function retrieveRegionAppDataLib(portalItemId: any, portalUrl: string, oauthAppId: string): Promise<any>;
/**
 * Find the most recently updated categories entries for a mission/region
 * @param fLayer categories feature layer
 * @param region_guid maps to the unique identifier on the regions feature class -- guid
 * @param portalUrl portal URL
 * @param gateTypeKeywords keywords for the mission group
 * @param regionName name of the mission/group
 * @param oauthAppId
 */
export declare function queryGateCategoriesFClassLib(fLayer: FeatureLayer, region_guid: string, portalUrl: string | undefined, gateTypeKeywords: string, regionName: string, oauthAppId: string): Promise<categoryQueryResult[]>;
/**
 * Query the trends feature class accounting for the category and region guid - the query will
 * execute once for each category item defined on the region
 * @param selectedRegionAppData data structure for holding landing page info example: category, comments, id etc
 * @param fLayer layer for the analyst comments feature class
 * @param globalId global id on the region that we use as a quasi foreign key on the comments - no relationships defined yet
 */
export declare function queryTrendsDataLib(selectedRegionAppData: IItem, fLayer: FeatureLayer, globalId: string): Promise<AnalystCommentsQueryResult[] | undefined>;
/**
 * Query trends/analystComments feature layer, if this method is called add 'AND last_edited_date IS NOT NULL' to
 * the query - ArcGIS returns nulls first when ordering by Date DESC
 * @param fLayer the feature layer holding the trends data
 * @param where the query where
 * @param outFields fields to return from the query - defaults to all
 */
export declare function QueryTrendsLib(fLayer: FeatureLayer, where: string, outFields?: string[]): Promise<AnalystCommentsQueryResult | undefined>;
/**
 * Query trends/analystComments feature layer for the region summary
 * @param fLayer the feature layer holding the trends data
 * @param globalId the region's globalId
 * @param outFields fields to return from the query - defaults to all
 */
export declare function QueryAnalystCommentsForRegionSummaryLib(fLayer: FeatureLayer, globalId: string, outFields?: string[]): Promise<string | undefined>;
/**
 * Test only method -- not USED
 * @param fLayer the feature layer holding the trends data
 * @param regionGuid
 * @param category
 * @param outFields fields to return from the query - defaults to all
 */
export declare function QueryTrendsByTopicLib(fLayer: FeatureLayer, regionGuid: string, category: string, outFields?: string[]): Promise<AnalystCommentsQueryResult | undefined>;
/**
 * Query the J2Assessment feature class for the latest summary for the current region
 * @param fLayer layer for the J2Assessment/Summary feature class
 * @param globalId global id identifier for the current region
 * @param outFields fields to return from the query - defaults to all
 */
export declare function QueryJ2AssessmentLib(fLayer: FeatureLayer, globalId: string, outFields?: string[]): Promise<textDateVal | undefined>;
/**
 * NOT READY
 * @param fLayer layer for the J2Assessment/Summary feature class
 * @param globalId global id identifier for the current region
 * @param outFields fields to return from the query - defaults to all
 */
export declare function QueryRegionSummaryLib(fLayer: FeatureLayer, globalId: string, outFields?: string[]): Promise<textDateVal | undefined>;
/**
 * Find Gate web app
 * @param itemType type of item to search for ie 'Application'
 * @param portalUrl portal URL
 * @param searchValue value to search for
 * @param oauthAppId
 */
export declare function findGateWebMapAppLib(itemType: string, portalUrl: string, searchValue: string, oauthAppId: string): Promise<ISearchResult<IItem> | undefined>;
/**
 * Query the regions feature class to get values for the landing page
 * @param fLayer feature layer portal item id to query
 */
export declare function GetAllVisibleRegions(fLayer: FeatureLayer): Promise<regionQueryResult[]>;
/**
 * Add data into the landing page categories feature class
 * @param dataRow set of attributes for a landing page feature
 * @param fLayer fLayer for landing page data
 */
export declare function addCategoryFeature(dataRow: categoryQueryResult, fLayer: FeatureLayer): Promise<boolean>;
/**
 * Add data into the J2 Assessments feature class
 * @param dataRow set of attributes for a J2 Assessments feature
 * @param fLayer fLayer for J2 Assessments data
 */
export declare function addJ2AssessmentFeature(dataRow: J2AssessmentProps, fLayer: FeatureLayer): Promise<boolean>;
/**
 * Add data into the Analyst Comments/Trends feature class
 * @param dataRow set of attributes for an Analyst Comments/Trends feature
 * @param fLayer fLayer for Analyst Comments/Trends data
 */
export declare function addAnalystCommentFeatureLib(dataRow: AnalystCommentProps, fLayer: FeatureLayer): Promise<boolean>;
/**
 * NOTE: there is a need to update the schema before this method can be applied
 * @param dataRow set of attributes for a Region Summary feature
 * @param fLayer fLayer for Region Summary data
 */
export declare function addRegionSummaryFeature(dataRow: RegionSummaryProps, fLayer: FeatureLayer): Promise<boolean>;
/**
 * Update the visibility on the region data
 * @param fLayer region summary feature layer - derived from app config guid
 * @param isVisible a number value to determine visibility
 * @param regionGuid foreign key - globalId in region feature class
 * @param outFields field that will be the unique identifier - defaults to all
 */
export declare function updateRegionVisibilityFeature(fLayer: FeatureLayer, isVisible: number, regionGuid: string, outFields?: string[]): Promise<boolean>;
/**
 * NOT READY - TEMP PLACEHOLDER
 * @param fLayer categories feature layer
 * @param region_guid maps to the unique identifier on the regions feature class -- guid
 * @param categoryLabel the label value for the category
 * @param portalUrl portal URL
 * @param gateTypeKeywords keywords for the  mission group
 * @param regionName name of the mission/group
 * @param oauthAppId
 */
export declare function queryGateCategoryFClassLib(fLayer: FeatureLayer, region_guid: string, categoryLabel: string, portalUrl: string | undefined, gateTypeKeywords: string, regionName: string, oauthAppId: string): Promise<categoryQueryResult[]>;
/**
 * Add data into the GATE calendar  feature class
 * @param dataRow set of attributes for a calendar feature
 * @param featureLayer featureLayer for calendar page data
 */
export declare function AddCalendarFeature(dataRow: GateCalendarEvent, featureLayer: FeatureLayer): Promise<__esri.EditsResult | void>;
/**
 * Update a selected event in the GATE calendar feature class
 * @param dataRow set of attributes for a calendar feature
 * @param featureLayer featureLayer for calendar page data
 * @param childFromFeatureLayer pass in an optional child record returned from query to grab objectid
 */
export declare function UpdateCalendarFeature(dataRow: GateCalendarEvent, featureLayer: FeatureLayer, childFromFeatureLayer?: Graphic): Promise<__esri.EditsResult | void>;
/**
 * Delete a selected event in the GATE calendar feature class
 * @param dataRow set of attributes for a calendar feature
 * @param featureLayer featureLayer for calendar page data
 */
export declare function DeleteCalendarFeature(dataRow: GateCalendarEvent, featureLayer: FeatureLayer): Promise<__esri.EditsResult | void>;
export declare function formatDateToICODString(timestamp: Date): string;
