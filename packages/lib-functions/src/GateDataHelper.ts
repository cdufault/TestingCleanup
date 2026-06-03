import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { findPortalItemsByType, getPortalItemDataById } from './ArcGISPortalItemsHelper';
import { IItem, ISearchResult } from '@esri/arcgis-rest-portal';
import Graphic from '@arcgis/core/Graphic';

/**Collection of constant values for currently defined feature attributes across sever
 * GATE required feature layers that are used to construct queries and updates to GATE data.
 */
const TOPIC_ATTRIBUTE_FOR_SUMMARY = 'Summary';
const MISSION_ID = 'mission_id';
const GLOBAL_ID = 'globalid';
const REGION_GUID = 'region_guid';
const LAST_EDITED_DATE = 'last_edited_date';
const TOPIC = 'topic';
const CATEGORY = 'category';

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
export type AnalystCommentProps = Pick<
    GateUpdatePayload,
    'human_readable_class' | 'topic' | 'region_guid' | 'comments' | 'region_name' | 'icod'
>;

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
export async function RetrieveGateColumnHeaders(
    portalItemId: any,
    portalUrl: string,
    oauthAppId: string
): Promise<any> {
    const itemData = await getPortalItemDataById(portalItemId, portalUrl, oauthAppId);
    return itemData?.GateRegionCardColumnHeaders;
}

/**
 * Get the global id value for the current region
 * @param fLayer layer for the regions feature class
 * @param regionId region/group/mission id value for the current region
 * @param outFieldsArray fields to return from query - defaults to all
 */
export async function queryGateRegionFClassForGlobalIdLib(
    fLayer: FeatureLayer,
    regionId: string,
    outFieldsArray: string[] = ['globalid']
): Promise<string | undefined> {
    let globalId;
    try {
        const query = fLayer.createQuery();
        query.outFields = outFieldsArray;
        query.where = `${MISSION_ID} = '${regionId}'`;

        await fLayer.queryFeatures(query).then((r) => {
            if (r && r.features) {
                globalId = r.features[0].attributes[`${GLOBAL_ID}`];
            } else {
                globalId = undefined;
            }
        });
    } catch (error) {
        console.error('Error getting globalid', error);
    }
    return globalId;
}

/**
 * Find object based on type keywords and object type
 * @param portalUrl URL to default portal
 * @param typeKeywords typekeywords used when the app was created
 */
export async function findAppByKeywordAndTypeLib(
    portalUrl: string,
    typeKeywords: string,
    oauthAppId: string
): Promise<ISearchResult<IItem> | undefined> {
    return await findPortalItemsByType('Application', portalUrl, 'typekeywords', typeKeywords, oauthAppId);
}

/**
 * Get the item/text data for a portal item
 * @param portalItemId portal item id
 * @param portalUrl portal URL
 * @param oauthAppId
 */
export async function retrieveRegionAppDataLib(portalItemId: any, portalUrl: string, oauthAppId: string): Promise<any> {
    const itemData = await getPortalItemDataById(portalItemId, portalUrl, oauthAppId);
    return itemData?.appData;
}

/**
 * Find the most recently updated categories entries for a mission/region
 * @param fLayer categories feature layer
 * @param region_guid maps to the unique identifier on the regions feature class -- guid
 * @param portalUrl portal URL
 * @param gateTypeKeywords keywords for the mission group
 * @param regionName name of the mission/group
 * @param oauthAppId
 */
export async function queryGateCategoriesFClassLib(
    fLayer: FeatureLayer,
    region_guid: string,
    portalUrl = '',
    gateTypeKeywords: string,
    regionName: string,
    oauthAppId: string
): Promise<categoryQueryResult[]> {
    const idField = `${GLOBAL_ID}`;

    const resultsFind = await findAppByKeywordAndTypeLib(portalUrl, gateTypeKeywords, oauthAppId);
    const selectedRegion = resultsFind?.results.find((result: any) => result.title === regionName);
    const regionAppData = await retrieveRegionAppDataLib(selectedRegion?.id, portalUrl, oauthAppId);
    const result: categoryQueryResult[] = [];

    await Promise.all(
        regionAppData.rows.map(async (row: any) => {
            const where = `${REGION_GUID} = '${region_guid}' AND category = '${row.rowLabel}' AND ${LAST_EDITED_DATE} IS NOT NULL`;
            const outFields: string[] = ['*'];
            try {
                const query = fLayer.createQuery();
                query.outFields = outFields;
                query.where = where;
                query.orderByFields = [`${LAST_EDITED_DATE} DESC`];
                await fLayer.queryFeatures(query).then((res) => {
                    if (res && res.features.length > 0) {
                        const feature = res.features[0];
                        result.push({
                            region_guid: feature.attributes['region_guid'],
                            category: feature.attributes['category'],
                            category_level: feature.attributes['category_level'],
                            category_confidence: feature.attributes['category_confidence'],
                            comment: feature.attributes['comments'],
                            guid: feature.attributes[idField],
                            icod: feature.attributes['icod'],
                        });
                    }
                });
            } catch (error) {
                console.error('Error querying categories.', error);
            }
        })
    );
    return result;
}

/**
 * Query the trends feature class accounting for the category and region guid - the query will
 * execute once for each category item defined on the region
 * @param selectedRegionAppData data structure for holding landing page info example: category, comments, id etc
 * @param fLayer layer for the analyst comments feature class
 * @param globalId global id on the region that we use as a quasi foreign key on the comments - no relationships defined yet
 */
export async function queryTrendsDataLib(
    selectedRegionAppData: IItem,
    fLayer: FeatureLayer,
    globalId: string
): Promise<AnalystCommentsQueryResult[] | undefined> {
    if (selectedRegionAppData && selectedRegionAppData.rows.length > 0) {
        const queryResults: AnalystCommentsQueryResult[] = [];

        await Promise.all(
            selectedRegionAppData?.rows.map(async (row: any) => {
                const query = `${TOPIC} = '${row.rowLabel.trim()}' AND ${REGION_GUID} = '${globalId.trim()}' AND ${LAST_EDITED_DATE} IS NOT NULL`;
                const ftrResult: AnalystCommentsQueryResult | undefined = await QueryTrendsLib(fLayer, query);
                ftrResult &&
                    queryResults.push({
                        comment: ftrResult.comment,
                        date: ftrResult.date,
                        category: row.rowLabel,
                        human_readable_class: ftrResult.human_readable_class,
                    });
            })
        );
        return queryResults;
    }
}

/**
 * Query trends/analystComments feature layer, if this method is called add 'AND last_edited_date IS NOT NULL' to
 * the query - ArcGIS returns nulls first when ordering by Date DESC
 * @param fLayer the feature layer holding the trends data
 * @param where the query where
 * @param outFields fields to return from the query - defaults to all
 */
export async function QueryTrendsLib(
    fLayer: FeatureLayer,
    where: string,
    outFields: string[] = ['*']
): Promise<AnalystCommentsQueryResult | undefined> {
    let featureResult: AnalystCommentsQueryResult | undefined = undefined;

    try {
        const query = fLayer.createQuery();
        query.outFields = outFields;
        query.where = where;
        query.orderByFields = [`${LAST_EDITED_DATE} DESC`];
        await fLayer.queryFeatures(query).then((r: any) => {
            if (r && r.features.length > 0) {
                const feature = r.features[0];
                featureResult = {
                    comment: feature.attributes['analyst_comments'],
                    date: feature.attributes['last_edited_date'],
                    human_readable_class: feature.attributes['human_readable_class'],
                    icod: feature.attributes['icod'],
                };
            }
        });
    } catch (error) {
        console.error('Error querying Trends feature comments.', error);
    }
    return featureResult;
}

/**
 * Query trends/analystComments feature layer for the region summary
 * @param fLayer the feature layer holding the trends data
 * @param globalId the region's globalId
 * @param outFields fields to return from the query - defaults to all
 */
export async function QueryAnalystCommentsForRegionSummaryLib(
    fLayer: FeatureLayer,
    globalId: string,
    outFields: string[] = ['*']
): Promise<string | undefined> {
    let featureResult: IRegionSummary | undefined = undefined;

    try {
        const query = fLayer.createQuery();
        query.outFields = outFields;
        query.where = `${TOPIC} = 'Summary' AND ${REGION_GUID} = '${globalId.trim()}' AND ${LAST_EDITED_DATE} IS NOT NULL`;
        query.orderByFields = [`${LAST_EDITED_DATE} DESC`];
        await fLayer.queryFeatures(query).then((r: any) => {
            if (r && r.features.length > 0) {
                const feature = r.features[0];
                featureResult = {
                    summary: feature.attributes['region_summary'],
                    icod: feature.attributes['icod'],
                };
            }
        });
    } catch (error) {
        console.error('Error querying Trends feature comments.', error);
    }
    return featureResult;
}

/**
 * Test only method -- not USED
 * @param fLayer the feature layer holding the trends data
 * @param regionGuid
 * @param category
 * @param outFields fields to return from the query - defaults to all
 */
export async function QueryTrendsByTopicLib(
    fLayer: FeatureLayer,
    regionGuid: string,
    category: string,
    outFields: string[] = ['*']
): Promise<AnalystCommentsQueryResult | undefined> {
    let featureResult: AnalystCommentsQueryResult | undefined = undefined;

    try {
        const query = fLayer.createQuery();
        query.outFields = outFields;
        query.where = `${REGION_GUID} = '${regionGuid.trim()}' AND ${TOPIC} = '${category}' AND ${LAST_EDITED_DATE} IS NOT NULL`;
        query.orderByFields = [`${LAST_EDITED_DATE} DESC`];
        await fLayer.queryFeatures(query).then((r: any) => {
            if (r && r.features.length > 0) {
                const feature = r.features[0];
                featureResult = {
                    comment: feature.attributes['analyst_comments'],
                    date: feature.attributes['last_edited_date'],
                    human_readable_class: feature.attributes['human_readable_class'],
                };
            }
        });
    } catch (error) {
        console.error('Error querying Trends feature comments.', error);
    }
    return featureResult;
}

/**
 * Query the J2Assessment feature class for the latest summary for the current region
 * @param fLayer layer for the J2Assessment/Summary feature class
 * @param globalId global id identifier for the current region
 * @param outFields fields to return from the query - defaults to all
 */
export async function QueryJ2AssessmentLib(
    fLayer: FeatureLayer,
    globalId: string,
    outFields: string[] = ['*']
): Promise<textDateVal | undefined> {
    let returnVal: textDateVal | undefined;
    try {
        const query = fLayer.createQuery();
        query.outFields = outFields;
        query.where = `${REGION_GUID} = '${globalId.trim()}' AND ${LAST_EDITED_DATE} IS NOT NULL`;
        query.orderByFields = [`${LAST_EDITED_DATE} DESC`];
        await fLayer.queryFeatures(query).then((r: any) => {
            if (r && r.features.length > 0) {
                returnVal = {
                    textVal: r.features[0].attributes['j2_summary'] ?? '',
                    dateVal: r.features[0].attributes['icod'],
                };
            }
        });
    } catch (error) {
        console.error('Error querying J2Assessment feature comments.', error);
    }
    return returnVal;
}

/**
 * NOT READY
 * @param fLayer layer for the J2Assessment/Summary feature class
 * @param globalId global id identifier for the current region
 * @param outFields fields to return from the query - defaults to all
 */
export async function QueryRegionSummaryLib(
    fLayer: FeatureLayer,
    globalId: string,
    outFields: string[] = ['*']
): Promise<textDateVal | undefined> {
    let returnVal: textDateVal | undefined;

    try {
        const query = fLayer.createQuery();
        query.outFields = outFields;
        query.where = `${REGION_GUID} = '${globalId.trim()}' AND ${TOPIC} = '${TOPIC_ATTRIBUTE_FOR_SUMMARY}' AND ${LAST_EDITED_DATE} IS NOT NULL`;
        query.orderByFields = [`${LAST_EDITED_DATE} DESC`];
        await fLayer.queryFeatures(query).then((r: any) => {
            if (r && r.features.length > 0) {
                returnVal = {
                    textVal: r.features[0].attributes['region_summary'] ?? '',
                    dateVal: r.features[0].attributes['icod'],
                };
            }
        });
    } catch (error) {
        console.error('Error querying Region Summary feature comments in the Analyst Comments fLayer.', error);
    }
    return returnVal;
}

/**
 * Find Gate web app
 * @param itemType type of item to search for ie 'Application'
 * @param portalUrl portal URL
 * @param searchValue value to search for
 * @param oauthAppId
 */
export async function findGateWebMapAppLib(
    itemType: string,
    portalUrl: string,
    searchValue: string,
    oauthAppId: string
): Promise<ISearchResult<IItem> | undefined> {
    const apps = await findPortalItemsByType(itemType, portalUrl, 'typekeywords', searchValue, oauthAppId);
    console.debug(
        `ItemType ${itemType}, searchField: 'typekeywords', searchValue: ${searchValue} returned the following: `,
        apps
    );

    return apps;
}

/**
 * Query the regions feature class to get values for the landing page
 * @param fLayer feature layer portal item id to query
 */
export async function GetAllVisibleRegions(fLayer: FeatureLayer): Promise<regionQueryResult[]> {
    const idField = `${GLOBAL_ID}`;

    const where = "visible = '1'";
    const outFields: string[] = ['mission_id', 'region_name', idField];
    const result: regionQueryResult[] = [];
    try {
        const query = fLayer.createQuery();
        query.outFields = outFields;
        query.where = where;

        await fLayer.queryFeatures(query).then((r) => {
            if (r) {
                r.features.forEach((feature) => {
                    result.push({
                        region_name: feature.attributes['region_name'],
                        mission_id: feature.attributes['mission_id'],
                        guid: feature.attributes[idField],
                    });
                });
            }
        });
    } catch (error) {
        console.error('Error querying regions.', error);
    }
    return result;
}

/**
 * Add data into the landing page categories feature class
 * @param dataRow set of attributes for a landing page feature
 * @param fLayer fLayer for landing page data
 */
export async function addCategoryFeature(dataRow: categoryQueryResult, fLayer: FeatureLayer): Promise<boolean> {
    const categoryAttributes = {
        region_guid: dataRow.region_guid,
        category: dataRow.category,
        category_level: dataRow.category_level,
        category_confidence: dataRow.category_confidence,
        comments: dataRow.comment,
        icod: dataRow.icod?.getTime(),
    };

    const newFeature = new Graphic({
        attributes: categoryAttributes,
    });
    const result = await fLayer
        .applyEdits({
            addFeatures: [newFeature],
        })
        .catch((error) => {
            console.error('Error applying edits to Category layer.', error);
        });
    if (result && result.addFeatureResults.length > 0) {
        result.addFeatureResults[0].error && console.error('Error adding Category feature.', result);
        return !result.addFeatureResults[0].error;
    }
    return false;
}

/**
 * Add data into the J2 Assessments feature class
 * @param dataRow set of attributes for a J2 Assessments feature
 * @param fLayer fLayer for J2 Assessments data
 */
export async function addJ2AssessmentFeature(dataRow: J2AssessmentProps, fLayer: FeatureLayer): Promise<boolean> {
    const categoryAttributes = {
        region_guid: dataRow.region_guid,
        j2_summary: dataRow.j2_summary,
        icod: dataRow.icod?.getTime() ?? undefined,
    };

    const newFeature = new Graphic({
        attributes: categoryAttributes,
    });
    const result = await fLayer
        .applyEdits({
            addFeatures: [newFeature],
        })
        .catch((error) => {
            console.error('Error applying edits to J2Assessment layer.', error);
        });
    if (result && result.addFeatureResults.length > 0) {
        result.addFeatureResults[0].error && console.error('Error adding J2 Assessment feature.', result);
        return !result.addFeatureResults[0].error;
    }
    return false;
}

/**
 * Add data into the Analyst Comments/Trends feature class
 * @param dataRow set of attributes for an Analyst Comments/Trends feature
 * @param fLayer fLayer for Analyst Comments/Trends data
 */
export async function addAnalystCommentFeatureLib(
    dataRow: AnalystCommentProps,
    fLayer: FeatureLayer
): Promise<boolean> {
    const categoryAttributes = {
        region_guid: dataRow.region_guid,
        analyst_comments: dataRow.comments,
        topic: dataRow.topic,
        human_readable_class: dataRow.human_readable_class,
        icod: dataRow.icod?.getTime() ?? undefined,
    };

    const newFeature = new Graphic({
        attributes: categoryAttributes,
    });
    const result = await fLayer
        .applyEdits({
            addFeatures: [newFeature],
        })
        .catch((error) => {
            console.error('Error applying edits to Category layer.', error);
        });
    if (result && result.addFeatureResults.length > 0) {
        result.addFeatureResults[0].error && console.error('Error adding Analyst Comment feature.', result);
        return !result.addFeatureResults[0].error;
    }
    return false;
}

/**
 * NOTE: there is a need to update the schema before this method can be applied
 * @param dataRow set of attributes for a Region Summary feature
 * @param fLayer fLayer for Region Summary data
 */
export async function addRegionSummaryFeature(dataRow: RegionSummaryProps, fLayer: FeatureLayer): Promise<boolean> {
    const categoryAttributes = {
        region_guid: dataRow.region_guid,
        region_summary: dataRow.region_summary,
        topic: TOPIC_ATTRIBUTE_FOR_SUMMARY,
        icod: dataRow.icod?.getTime() ?? undefined,
    };

    const newFeature = new Graphic({
        attributes: categoryAttributes,
    });
    const result = await fLayer
        .applyEdits({
            addFeatures: [newFeature],
        })
        .catch((error) => {
            console.error('Error applying edits to Category layer.', error);
        });

    if (result && result.addFeatureResults.length > 0) {
        result.addFeatureResults[0].error && console.error('Error adding Region Summary feature.', result);
        return !result.addFeatureResults[0].error;
    }
    return false;
}

/**
 * Update the visibility on the region data
 * @param fLayer region summary feature layer - derived from app config guid
 * @param isVisible a number value to determine visibility
 * @param regionGuid foreign key - globalId in region feature class
 * @param outFields field that will be the unique identifier - defaults to all
 */
export async function updateRegionVisibilityFeature(
    fLayer: FeatureLayer,
    isVisible: number,
    regionGuid: string,
    outFields: string[] = ['*']
): Promise<boolean> {
    let editFeature;
    let success = false;
    try {
        const query = fLayer.createQuery();
        query.outFields = outFields;
        query.where = `${GLOBAL_ID} = '${regionGuid}'`;

        await fLayer.queryFeatures(query).then(async (r) => {
            if (r && r.features && r.features.length > 0) {
                editFeature = r.features[0];
                editFeature.attributes['visible'] = isVisible;

                const edits = {
                    updateFeatures: [editFeature],
                };
                const result: __esri.EditsResult = await fLayer.applyEdits(edits);

                if (result && result.updateFeatureResults.length > 0) {
                    result.updateFeatureResults[0].error &&
                        console.error('Error updating Region IsVisible feature.', result);
                    success = result.updateFeatureResults[0].objectId > -1;
                }
            }
        });
    } catch (error) {
        console.error('Error querying region', error);
        return false;
    }
    return success;
}

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
export async function queryGateCategoryFClassLib(
    fLayer: FeatureLayer,
    region_guid: string,
    categoryLabel: string,
    portalUrl = '',
    gateTypeKeywords: string,
    regionName: string,
    oauthAppId: string
): Promise<categoryQueryResult[]> {
    const idField = `${GLOBAL_ID}`;
    const resultsFind = await findAppByKeywordAndTypeLib(portalUrl, gateTypeKeywords, oauthAppId);
    const selectedRegion = resultsFind?.results.find((result: any) => result.title === regionName);
    const regionAppData = await retrieveRegionAppDataLib(selectedRegion?.id, portalUrl, oauthAppId);
    console.debug(regionAppData); // used to avoid linting error
    const result: categoryQueryResult[] = [];

    const where = `${REGION_GUID} = '${region_guid}' AND ${CATEGORY} = '${categoryLabel}' AND ${LAST_EDITED_DATE} IS NOT NULL`;
    const outFields: string[] = ['*'];
    try {
        const query = fLayer.createQuery();
        query.outFields = outFields;
        query.where = where;
        query.orderByFields = [`${LAST_EDITED_DATE} DESC`];
        await fLayer.queryFeatures(query).then((res) => {
            if (res && res.features.length > 0) {
                const feature = res.features[0];
                result.push({
                    region_guid: feature.attributes['region_guid'],
                    category: feature.attributes['category'],
                    category_level: feature.attributes['category_level'],
                    category_confidence: feature.attributes['category_confidence'],
                    comment: feature.attributes['comments'],
                    guid: feature.attributes[idField],
                    icod: feature.attributes['icod'],
                });
            }
        });
    } catch (error) {
        console.error('Error querying categories.', error);
    }
    return result;
}

/**
 * Add data into the GATE calendar  feature class
 * @param dataRow set of attributes for a calendar feature
 * @param featureLayer featureLayer for calendar page data
 */
export async function AddCalendarFeature(
    dataRow: GateCalendarEvent,
    featureLayer: FeatureLayer
): Promise<__esri.EditsResult | void> {
    const highLight = dataRow.highlight ? 'yes' : 'no';
    const recurringValue = dataRow.recurring ? 1 : 0;
    const importAnniversaryValue = dataRow.importantAnniversary ? 1 : 0;
    const calendarAttributes = {
        region_guid: dataRow.regionGUID,
        region_name: dataRow.region,
        group_name: dataRow.region,
        classification: dataRow.classification,
        event_name: dataRow.eventName,
        date_start: dataRow.startDate.getTime(),
        date_end: dataRow.endDate.getTime(),
        location: dataRow.location,
        comments: dataRow.comments,
        description: dataRow.description,
        participants: dataRow.participants.toString(),
        recurring: recurringValue,
        initial_date: dataRow.initialDate.getTime(),
        recurrence_type: dataRow.recurrenceType,
        recurrence_pattern: dataRow.recurrencePattern,
        recurrence_end_date: dataRow.recurrenceEndDate?.getTime(),
        number_of_occurrences: dataRow.numberOfOccurrences,
        is_child_record: dataRow.isChildRecord ? 1 : 0,
        is_master_record: dataRow.isMasterRecord ? 1 : 0,
        parent_guid: dataRow.parentGUID,
        number_of_days: dataRow.lengthInDays,
        important_anniversary: importAnniversaryValue,
        highlight: highLight,
        alternate_calendar: dataRow.alternateCalendar,
        icod: dataRow.icod?.getTime(),
    };
    const newFeature = new Graphic({
        attributes: calendarAttributes,
    });
    return await featureLayer
        .applyEdits({
            addFeatures: [newFeature],
        })
        .catch((error: Error) => {
            console.error('Error applying edits to Calendar layer.', error);
        });
}

/**
 * Update a selected event in the GATE calendar feature class
 * @param dataRow set of attributes for a calendar feature
 * @param featureLayer featureLayer for calendar page data
 * @param childFromFeatureLayer pass in an optional child record returned from query to grab objectid
 */
export async function UpdateCalendarFeature(
    dataRow: GateCalendarEvent,
    featureLayer: FeatureLayer,
    childFromFeatureLayer?: Graphic
): Promise<__esri.EditsResult | void> {
    const highLight = dataRow.highlight ? 'yes' : 'no';
    const recurringValue = dataRow.recurring ? 1 : 0;
    const importAnniversaryValue = dataRow.importantAnniversary ? 1 : 0;
    const numberToIncrement = Number(dataRow.recurrencePattern);
    let calendarAttributes = {
        objectid: dataRow.regionGUID,
        region_name: dataRow.region,
        group_name: dataRow.region,
        classification: dataRow.classification,
        event_name: dataRow.eventName,
        date_start: dataRow.startDate.getTime(),
        date_end: dataRow.endDate.getTime(),
        location: dataRow.location,
        comments: dataRow.comments,
        description: dataRow.description,
        participants: dataRow.participants.toString(),
        recurring: recurringValue,
        initial_date: dataRow.initialDate.getTime(),
        recurrence_type: dataRow.recurrenceType,
        recurrence_pattern: dataRow.recurrencePattern,
        recurrence_end_date: dataRow.recurrenceEndDate?.getTime(),
        number_of_occurrences: dataRow.numberOfOccurrences,
        is_child_record: dataRow.isChildRecord ? 1 : 0,
        is_master_record: dataRow.isMasterRecord ? 1 : 0,
        parent_guid: dataRow.parentGUID,
        number_of_days: dataRow.lengthInDays,
        important_anniversary: importAnniversaryValue,
        highlight: highLight,
        alternate_calendar: dataRow.alternateCalendar,
        icod: dataRow.icod?.getTime(),
    };
    if (childFromFeatureLayer) {
        // this section fixes a bug for when an existing recurring events series is being updated with or without the
        // start and end dates being changed. if there is no change to the dates, the dates are maintained. if there is
        // a change, the adjustments are made to keep dates consistent
        let startDateAdjustment = dataRow.startDate.getTime();
        let endDateAdjustment = dataRow.endDate.getTime();
        if (dataRow.startDate !== childFromFeatureLayer.attributes.date_start) {
            if (dataRow.recurrenceType === 'yearly') {
                startDateAdjustment = dataRow.startDate.setFullYear(
                    dataRow.startDate.getFullYear() + numberToIncrement
                );
            } else if (dataRow.recurrenceType === 'monthly') {
                startDateAdjustment = dataRow.startDate.setMonth(dataRow.startDate.getMonth() + numberToIncrement);
            } else {
                const numberOfWeeks = numberToIncrement * 7;
                startDateAdjustment = dataRow.startDate.setDate(dataRow.startDate.getDate() + numberOfWeeks);
            }
        }
        if (dataRow.endDate !== childFromFeatureLayer.attributes.date_end) {
            if (dataRow.recurrenceType === 'yearly') {
                endDateAdjustment = dataRow.endDate.setFullYear(dataRow.endDate.getFullYear() + numberToIncrement);
            } else if (dataRow.recurrenceType === 'monthly') {
                endDateAdjustment = dataRow.endDate.setMonth(dataRow.endDate.getMonth() + numberToIncrement);
            } else {
                const numberOfWeeks = numberToIncrement * 7;
                endDateAdjustment = dataRow.endDate.setDate(dataRow.endDate.getDate() + numberOfWeeks);
            }
        }
        calendarAttributes = {
            objectid: childFromFeatureLayer.attributes.objectid,
            region_name: dataRow.region,
            group_name: dataRow.region,
            classification: dataRow.classification,
            event_name: dataRow.eventName,
            date_start: startDateAdjustment,
            date_end: endDateAdjustment,
            location: dataRow.location,
            comments: dataRow.comments,
            description: dataRow.description,
            participants: dataRow.participants.toString(),
            recurring: recurringValue,
            initial_date: dataRow.initialDate.getTime(),
            recurrence_type: dataRow.recurrenceType,
            recurrence_pattern: dataRow.recurrencePattern,
            recurrence_end_date: dataRow.recurrenceEndDate?.getTime(),
            number_of_occurrences: dataRow.numberOfOccurrences,
            is_child_record: childFromFeatureLayer.attributes.is_child_record,
            is_master_record: childFromFeatureLayer.attributes.is_master_record,
            parent_guid: childFromFeatureLayer.attributes.parent_guid,
            number_of_days: dataRow.lengthInDays,
            important_anniversary: importAnniversaryValue,
            highlight: highLight,
            alternate_calendar: dataRow.alternateCalendar,
            icod: dataRow.icod?.getTime(),
        };
    }
    const existingFeature = new Graphic({
        attributes: calendarAttributes,
    });
    return await featureLayer
        .applyEdits({
            updateFeatures: [existingFeature],
        })
        .catch((error: Error) => {
            console.error('Error updating the Calendar layer.', error);
        });
}

/**
 * Delete a selected event in the GATE calendar feature class
 * @param dataRow set of attributes for a calendar feature
 * @param featureLayer featureLayer for calendar page data
 */
export async function DeleteCalendarFeature(
    dataRow: GateCalendarEvent,
    featureLayer: FeatureLayer
): Promise<__esri.EditsResult | void> {
    const highLight = dataRow.highlight ? 'yes' : 'no';
    const recurringValue = dataRow.recurring ? 1 : 0;
    const importAnniversaryValue = dataRow.importantAnniversary ? 1 : 0;
    const calendarAttributes = {
        objectid: dataRow.regionGUID,
        region_name: dataRow.region,
        group_name: dataRow.region,
        classification: dataRow.classification,
        event_name: dataRow.eventName,
        date_start: dataRow.startDate.getTime(),
        date_end: dataRow.endDate.getTime(),
        location: dataRow.location,
        comments: dataRow.comments,
        description: dataRow.description,
        participants: dataRow.participants.toString(),
        recurring: recurringValue,
        initial_date: dataRow.initialDate.getTime(),
        recurrence_type: dataRow.recurrenceType,
        recurrence_pattern: dataRow.recurrencePattern,
        recurrence_end_date: dataRow.recurrenceEndDate?.getTime(),
        number_of_occurrences: dataRow.numberOfOccurrences,
        is_child_record: dataRow.isChildRecord ? 1 : 0,
        is_master_record: dataRow.isMasterRecord ? 1 : 0,
        parent_guid: dataRow.parentGUID,
        number_of_days: dataRow.lengthInDays,
        important_anniversary: importAnniversaryValue,
        highlight: highLight,
        alternate_calendar: dataRow.alternateCalendar,
        icod: dataRow.icod?.getTime(),
    };
    const existingFeature = new Graphic({
        attributes: calendarAttributes,
    });
    return await featureLayer
        .applyEdits({
            deleteFeatures: [existingFeature],
        })
        .catch((error: Error) => {
            console.error('Error deleting the selected feature in the Calendar layer.', error);
        });
}
export function formatDateToICODString(timestamp: Date): string {
    const date = new Date(timestamp);
    const days = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    return `${days}${hours}${minutes}Z${month}${year}`;
}
