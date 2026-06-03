import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { LogHelper } from '../../helpers/logHelper';
import { DeleteCalendarFeature, GateCalendarEvent, UpdateCalendarFeature } from '@stratcom/lib-functions';
import { IItem } from '@esri/arcgis-rest-portal';
import { IGetRowsParams } from 'ag-grid-community/dist/lib/interfaces/iDatasource';
import { ValueFormatterParams } from 'ag-grid-community/dist/lib/entities/colDef';
import FilterModelToQueryString from '../tacticalGrid/helpers/filterHelper';
import Graphic from '@arcgis/core/Graphic';
import { getMissionList } from '../../helpers/portalItemsHelper';

/**shape of the data pulled from the application object to be used in swapping out regions to edit */
export interface ApplicationItem {
    /**application object title */
    title: string;
    /**portal item id */
    id: string;
    /**type keywords that id mission as GATE Exercise or GATE Production */
    typeKeywords: string[];
    /**defined access level - should be 'org' */
    access?: string;
}

/**Type for handling an object of key/value pairs */
export type FieldAliasType = {
    [key: string]: any;
};

/**
 * Get the global id value for the current region
 * @param fLayer portal item id of the regions ftr class
 * @param regionId region/group/mission id value for the current region
 */
export async function queryRegionForGlobalId(
    fLayer: FeatureLayer,
    regionId: string
): Promise<{ globalId: string | undefined; isVisible: number }> {
    let globalId;
    let isVisible = -1;
    try {
        const query = fLayer.createQuery();
        query.outFields = ['globalid', 'visible'];
        query.where = `mission_id = '${regionId}'`;

        await fLayer.queryFeatures(query).then((r) => {
            if (r && r.features) {
                globalId = r.features[0].attributes['globalid'];
                isVisible = r.features[0].attributes['visible'];
            } else {
                globalId = undefined;
            }
        });
    } catch (error) {
        LogHelper.log('Error getting globalid.' + JSON.stringify(error));
    }
    return { globalId, isVisible };
}

/**
 * Find all GATE apps by type and keyword
 * @param portalUrl portal URL
 * @param gateExerciseKeyword app config GATE Exercise keyword
 * @param gateMissionKeyword app config GATE Mission keyword
 * @returns an array of ApplicationItems
 */
export async function getAllGATEApps(
    portalUrl: string,
    gateExerciseKeyword: string,
    gateMissionKeyword: string,
    oauthAppId: string
): Promise<ApplicationItem[]> {
    const appItems: ApplicationItem[] = [];
    const resultsFindProduction = await getMissionList('', 'title', 'ASC', true, gateMissionKeyword);
    const resultsFindExercise = await getMissionList('', 'title', 'ASC', true, gateExerciseKeyword);

    let resultsFind: IItem[] = [];
    let temp: IItem[] = [];
    if (resultsFindProduction) {
        temp = [...resultsFindProduction];
    }
    if (resultsFindExercise) {
        resultsFind = [...temp, ...resultsFindExercise];
    }

    resultsFind.map((item: IItem) => {
        appItems.push({
            title: item.title,
            access: item.access,
            id: item.id,
            typeKeywords: item.typeKeywords ?? [],
        });
    });
    return appItems;
}

/**
 * Query the calendar FeatureClass to get values for the landing page
 * @param portalItemId feature layer portal item id to query
 */
export async function queryCalendar(portalItemId: string): Promise<FeatureLayer> {
    const calendarLayer = new FeatureLayer({
        portalItem: {
            id: portalItemId,
        },
    });
    return new Promise((resolve, reject) => {
        calendarLayer
            .load()
            .then(() => {
                if (calendarLayer.fields.length > 0) {
                    resolve(calendarLayer);
                } else {
                    reject('Failed to load all fields from the calendar feature layer.');
                }
            })
            .catch((error) => {
                reject(error);
            });
    });
}

/**
 * Modify the AGGrid IGetRowsParams by replacing the field alias name with the actual field name.
 * This is required because the grid columns are using alias names but filter and sort methods fallback to the field names.
 * @param params AGGrid IGetRowsParams which change on every new/update to sort and/or filter values
 * @param gridLayerFields Fields in the tactical grid feature layer
 * @returns IGetRowsParams
 */
function convertAliasNamesToFieldNames(params: IGetRowsParams, gridLayerFields: any[]): IGetRowsParams {
    if (!params || Object.keys(params.filterModel).length === 0) {
        //no filter defined
        return params;
    }

    for (const filterModelFieldName in params.filterModel) {
        //each field with a filter definition
        const filteredField = gridLayerFields.find((field) => field.alias.toLowerCase() === filterModelFieldName); //look for a matching alias name
        if (filteredField && filteredField.name !== filterModelFieldName) {
            //if filter is on an alias name
            params.filterModel[filteredField.name] = params.filterModel[filterModelFieldName]; //update param attribute to point to the field name
            delete params.filterModel[filterModelFieldName]; //delete the param attribute with the alias name
        }
    }
    return params;
}

/**
 * @description Handles get row calls from the ag grid paging controller
 * @param params
 * @param gridLayer
 * @param missionNameFilter name of the currently selected mission in the calendar widget
 * @returns an object containing an array of data rows, the number of rows, and a mapping object of fieldNames to fieldNameAlias OR undefined
 */
export async function queryCalendarData(
    params: IGetRowsParams,
    gridLayer: FeatureLayer,
    missionNameFilter: string
): Promise<{ rows: any[]; totalRows: number; aliasNameToFieldNameMap: Map<string, string> } | undefined> {
    const query = gridLayer.createQuery(); // NOTE: This sets query.where to 1=1
    query.where = `region_name = '${missionNameFilter}' AND (is_master_record = 1 OR recurring = 0)`;
    query.outFields = [
        'region_name',
        'objectid',
        'globalid',
        'event_name',
        'date_start',
        'date_end',
        'location',
        'description',
        'participants',
        'recurring',
        'initial_date',
        'recurrence_type',
        'recurrence_pattern',
        'recurrence_end_date',
        'number_of_occurrences',
        'is_child_record',
        'is_master_record',
        'parent_guid',
        'number_of_days',
        'important_anniversary',
        'comments',
        'classification',
        'highlight',
        'alternate_calendar',
        'icod',
    ];
    //set filtering
    const updatedParams = convertAliasNamesToFieldNames(params, gridLayer.fields);
    const whereClause = FilterModelToQueryString(updatedParams.filterModel);
    if (whereClause) {
        query.where += ` AND ${whereClause}`;
    }
    try {
        //get total row count
        const totalRows = await gridLayer.queryFeatureCount(query);

        //set sorting
        const orderByFieldNames: string[] = [];
        params.sortModel.forEach((param: any) => {
            const selectedField = gridLayer.fields.find((field) => field.alias.toLowerCase() === param.colId);
            selectedField && orderByFieldNames.push(`${selectedField.name} ${param.sort}`); //swap out the alias name for the field name
        });

        query.orderByFields = orderByFieldNames;
        query.start = params.startRow;
        query.num = params.endRow - params.startRow;

        //query features
        const queryResults = await gridLayer.queryFeatures(query);

        const localFieldToAliasNameMaps: Map<string, string> = new Map<string, string>();
        const aliasNameToFieldNameMap: Map<string, string> = new Map<string, string>();
        queryResults.fields.map((field) => {
            const aliasName = field.alias ? field.alias.toLowerCase() : field.name;
            localFieldToAliasNameMaps.set(field.name, aliasName);
            aliasNameToFieldNameMap.set(aliasName, field.name);
        });
        if (queryResults) {
            const rows = queryResults.features?.map((feature) => {
                const aliasAttributePairings = fromJSMapToKeyValueObject(feature.attributes, localFieldToAliasNameMaps);
                return aliasAttributePairings;
            });
            return { rows, totalRows, aliasNameToFieldNameMap };
        } else {
            return undefined;
        }
    } catch (e) {
        console.error(e.message, true);
    }
}

/**
 * Replace an object's key with a JSMap's value. For example, given:
 * object={{name:'john'},...} and Map=key=>'name' ==> value=>'my_name'
 * return = {{my_name: 'john'}, ...}
 * @param sourceObject object of key/value objects ie: {{foo:'bar'},...}
 * @param sourceMap JS Map<string, string>
 * @returns object of key/value pair objects ie: {{bar:'foo'}, ...}
 */
export function fromJSMapToKeyValueObject(
    sourceObject: FieldAliasType,
    sourceMap: Map<string, string>
): FieldAliasType {
    const outObject: FieldAliasType = {};
    for (const objectKey in sourceObject) {
        const objectValue = sourceObject[objectKey];
        const mapValue = sourceMap.get(objectKey);
        if (mapValue) {
            outObject[mapValue] = objectValue;
        }
    }
    return outObject;
}

/**
 * @description Custom AGGrid date formatter that formats date strings - date coming in from Portal currently is an epoch
 * @param params AGGrid value in the cell for the date column
 */
export function dateFormatter(params: ValueFormatterParams): Date | undefined {
    if (params && params.value) {
        //previous format [toLocaleString('en-US', options)] depended on this - keep for reference and possible re-use
        /* const options = {
            month: '2-digit',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            //can add utc value here
        }; */
        //last eight chars are :ss.sssZ
        const utcDateString = new Date(params.value).toISOString().slice(0, -8) + 'Z';
        const dateVal = new Date(utcDateString);
        return dateVal;
    } else {
        return undefined;
    }
}

/**
 * Search for recurring events in the GATE calendar feature class
 * @param calendarFeatureLayer The GATE Calendar Feature Layer to search
 * @param eventParentGuid The identifier to search for child records
 */
export async function queryRecurringCalendarEvents(calendarFeatureLayer: FeatureLayer, eventParentGuid: string | null) {
    const query = calendarFeatureLayer.createQuery(); // NOTE: This sets query.where to 1=1
    query.where = `parent_guid = '${eventParentGuid}'`;
    try {
        const queryResults = await calendarFeatureLayer.queryFeatures(query);
        if (queryResults) {
            return queryResults;
        } else {
            return undefined;
        }
    } catch (e) {
        console.error(e.message, true);
    }
}

/**
 * Delete all recurring events in a series in the GATE calendar feature class if a master record is selected
 * @param event The Calendar Event to base the search for child features
 * @param featureLayer The Calendar Feature Layer to remove records from
 */
export async function DeleteAllRecurringCalendarFeatures(
    event: GateCalendarEvent,
    featureLayer: FeatureLayer
): Promise<__esri.EditsResult | void> {
    let featuresToDelete = {};
    // globalid is required to find child events
    queryRecurringCalendarEvents(featureLayer, event.globalid).then(async (result) => {
        if (result) {
            featuresToDelete = {
                deleteFeatures: result.features,
            };
            await DeleteCalendarFeature(event, featureLayer);
        }
        return await featureLayer.applyEdits(featuresToDelete).catch((error: Error) => {
            console.error('Error deleting all associated recurring features in the Calendar layer.', error);
        });
    });
}

/**
 * Delete all future recurring events in a series in the GATE calendar feature class
 * @param event The Calendar Event to base the search for child features
 * @param featureLayer The Calendar Feature Layer to remove records from
 */
export async function DeleteFutureRecurringCalendarFeatures(
    event: GateCalendarEvent,
    featureLayer: FeatureLayer
): Promise<boolean> {
    let featuresToDelete = {};
    let success = true;
    // globalid is required to find child events
    queryRecurringCalendarEvents(featureLayer, event.globalid).then(async (result) => {
        if (result) {
            const futureEvents: Graphic[] = [];
            const featuresFound = result.features;
            for (let i = 0; i < featuresFound.length; i++) {
                if (featuresFound[i].attributes.date_start > event.startDate) {
                    futureEvents.push(featuresFound[i]);
                }
            }
            featuresToDelete = {
                deleteFeatures: futureEvents,
            };
            await featureLayer.applyEdits(featuresToDelete).catch((error: Error) => {
                console.error('Error deleting all associated future recurring features in the Calendar layer.', error);
            });
        } else {
            success = false;
        }
    });
    return success;
}

/**
 * Update all recurring events in a series in the GATE calendar feature class when a master record is selected
 * @param event The Calendar Event to base the search for child features
 * @param featureLayer The Calendar Feature Layer to update records
 */
export async function UpdateRecurringCalendarFeatures(
    event: GateCalendarEvent,
    featureLayer: FeatureLayer
): Promise<boolean> {
    let success = true;
    // globalid is required to find child events
    queryRecurringCalendarEvents(featureLayer, event.globalid).then(async (result) => {
        if (result) {
            // if related records are found in recurring series, update master record first
            await UpdateCalendarFeature(event, featureLayer);
            const featuresFound = result.features;
            for (let i = 0; i < featuresFound.length; i++) {
                await UpdateCalendarFeature(event, featureLayer, featuresFound[i]);
            }
        } else {
            success = false;
        }
    });
    return success;
}

/**
 * Update all future recurring events in a series in the GATE calendar feature class when a child record is selected
 * @param event The Calendar Event to base the search for child features
 * @param featureLayer The Calendar Feature Layer to update records
 */
export async function UpdateFutureRecurringCalendarFeatures(
    event: GateCalendarEvent,
    featureLayer: FeatureLayer
): Promise<boolean> {
    let success = true;
    // globalid is required to find child events
    queryRecurringCalendarEvents(featureLayer, event.globalid).then(async (result) => {
        if (result) {
            const futureEvents: Graphic[] = [];
            const featuresFound = result.features;
            for (let i = 0; i < featuresFound.length; i++) {
                if (featuresFound[i].attributes.date_start > event.startDate) {
                    futureEvents.push(featuresFound[i]);
                }
            }
            for (let i = 0; i < futureEvents.length; i++) {
                await UpdateCalendarFeature(event, featureLayer, futureEvents[i]);
            }
        } else {
            success = false;
        }
    });
    return success;
}

/**
 * Checks the start date of the event to see if it is the last day of the month to account for different month lengths
 * @param selectedDate selected start date
 */
export function isLastDayOfMonth(selectedDate: Date): boolean {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(selectedDate.getDate() + 1);
    return nextDay.getMonth() !== selectedDate.getMonth();
}

/**
 * Checks the start date of the event to see if it is the last day of the month to account for different month lengths
 * @param selectedDate selected start date
 */
export function lastDayOfCurrentMonth(selectedDate: Date): number {
    const currentMonth = selectedDate.getMonth();
    const nextMonth = currentMonth + 1;
    const nextMonthFirstDay = new Date(selectedDate.getFullYear(), nextMonth, 1);
    const lastDayOfMonth = new Date(nextMonthFirstDay.getTime() - 1);
    return lastDayOfMonth.getDate();
}

/**
 * Checks the start date of the event to see if it is the last day of the month to account for different month lengths
 * @param event gate calendar event
 */
export function calculateNumberOfOccurrencesFromEnd(event: GateCalendarEvent): number | undefined {
    const start = event.startDate;
    const end = event.recurrenceEndDate;
    if (end !== null && event.recurrencePattern) {
        const timeBetweenOccurrences = parseInt(event.recurrencePattern);
        if (event.recurrenceType === 'yearly') {
            const yearlyDifference = end.getFullYear() + 1 - start.getFullYear();
            return Math.floor(yearlyDifference / timeBetweenOccurrences);
        } else if (event.recurrenceType === 'monthly') {
            const yearDifference = (end.getFullYear() - start.getFullYear()) * 12;
            const monthlyDifference = end.getMonth() + 1 - start.getMonth();
            const overallDifference = yearDifference + monthlyDifference;
            return Math.floor(overallDifference / timeBetweenOccurrences);
        } else if (event.recurrenceType === 'weekly') {
            const weekDifference = end.getTime() - start.getTime();
            const numberOfWeeks = Math.round(weekDifference / (1000 * 60 * 60 * 24 * 7));
            return Math.floor(numberOfWeeks / timeBetweenOccurrences);
        }
    } else {
        console.log('Could not calculate number of occurrences. Recurrence end date may be undefined.');
        return undefined;
    }
}
