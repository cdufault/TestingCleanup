import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { IItem, ISearchResult } from '@esri/arcgis-rest-portal';

import { findPortalItemsByType, getPortalItemDataById } from './ArcGISPortalItemsHelper';

import { Logger } from './Logger';

import StatisticDefinition from '@arcgis/core/rest/support/StatisticDefinition';

/**Describes if the region display page will auto rotate in presentation mode or be a standard page */
export type RegionDisplayModeType = 'Standard' | 'Presentation';

/** Holds the counts data for a row in the counts widget. All object keys will be a string and the value
 * can be string or number */
export interface ICountsData {
    /**row of data */
    [key: string]: number | string;
}

/**models item props for supporting user defined summary totals*/
interface ICountItem {
    /**row number starting at top to bottom - 1 to n*/
    rowPosition: number;
    /**name of the column */
    columnName: string;
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

/**models an array of item props for supporting user defined summary totals*/
interface ICountColumn {
    /**the column that the item will summarize 1 to n - left to right */
    columnOutputPosition: number;
    /**summarize all these columns to arrive at the total */
    columns: ICountItem[];
    /**custom label for this total column */
    columnLabel: string;
}

/**Describes a column in the counts table widget */
interface IColumnData {
    /**position of the column - from left to right */
    positionInTable: number;

    /**label for the column */
    columnLabel: string;

    /**the WHERE query that generates the count value for the column ie: "deployed = TRUE" */
    query: string;

    /**the flayer field/attribute that holds the data values -  */
    queryField: string;
}

/**interface for the counts widget data structure */
interface ICountWidgetDataDef {
    /**auto refresh interval */
    refreshIntervalInMinutes: number;

    /**label for the category column */
    categoryLabel: string;

    /**region id */
    regionName: string;

    /**name of the last row in the table - defaults to 'Totals' */
    summaryRowLabel: string;

    /**the row data for the table */
    rows: IRowData[];
}

/**interface for the counts widget table row data */
interface IRowData {
    /**the portal id of the feature class holding the data for the row */
    ftrClassPortalItemId: string;

    /**label to add to the table for the row */
    rowLabel: string;

    /**position of the row in the rows array - top to bottom */
    positionInTable: number;

    /** hover text / tool tip for the row */
    hoverText: string;

    /**column data for the row */
    rowColumns: IColumnData[];

    /**field to use for the last updated */
    lastUpdatedFieldName?: string;
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
export async function QueryCount(fLayer: FeatureLayer, where: string): Promise<number> {
    let count = 0; //-1;
    try {
        const query = fLayer.createQuery();
        query.where = where; //ie:"deployed = 'YES'";
        await fLayer.queryFeatureCount(query).then((resultCount) => {
            count = resultCount;
        });
    } catch (error) {
        console.error('Error querying feature count.');
        console.error(error);
    }
    return count;
}

/**
 * Get the most recent updated item's date
 * @param fLayer featurelayer with counts data
 * @param dateFieldName field name for the date
 */
export async function QueryMaxDateUsingStats(
    fLayer: FeatureLayer,
    dateFieldName = 'last_edited_date'
): Promise<string> {
    let maxDate = '';
    try {
        const query = fLayer.createQuery();
        query.outFields = [dateFieldName];
        query.where = `${dateFieldName} IS NOT NULL`;
        query.orderByFields = [`${dateFieldName} DESC`];
        await fLayer.queryFeatures(query).then((result: any) => {
            if (result && result.features.length > 0) {
                maxDate = result.features[0].attributes[`${dateFieldName}`];
            }
        });
    } catch (error) {
        console.error(
            'Error querying feature count. Make sure that Edit Tracking is turned on in Portal for the layer.'
        );
        console.error(error);
        return maxDate;
    }
    return maxDate;
}

/**
 * Get the most recent updated item's date
 * @param fLayer featurelayer with counts data
 * @param dateFieldName field name for the date
 */
export async function QueryMaxDate(fLayer: FeatureLayer, dateFieldName = 'last_edited_date'): Promise<string> {
    let maxDate = '';
    try {
        const query = fLayer.createQuery();
        query.outFields = [dateFieldName];
        query.where = `1=1 AND ${dateFieldName} IS NOT NULL`;
        query.orderByFields = [`${dateFieldName} DESC`];
        await fLayer.queryFeatures(query).then((result: any) => {
            if (result && result.features.length > 0) {
                maxDate = result.features[0].attributes[`${dateFieldName}`];
            }
        });
    } catch (error) {
        console.error('Error querying max date. Make sure that Edit Tracking is turned on in Portal for the layer.');
        console.error(error);
        return maxDate;
    }
    return maxDate;
}

/**
 * A sort for row data or column data to order by designated row/column position
 * @param objA data obj
 * @param objB data obj
 */
function sortTableData(objA: IRowData | IColumnData, objB: IRowData | IColumnData) {
    if (objA.positionInTable > objB.positionInTable) {
        return 1;
    }
    if (objA.positionInTable < objB.positionInTable) {
        return -1;
    }
    return 0;
}

/**
 * Given a row of column data order the columns in the order that is defined in the schema definition
 * @param categoryLabel the label for the category/item column
 * @param rowKey row containing with the defined schema order for the columns
 * @param countCols an object of column keys-value pairs that will comprise a data row ie [{deployed: 5},. . .]
 */
function sortCountsColumns(categoryLabel: string, rowKey: IRowData, countCols: ICountsData): ICountsData {
    const sortedCountCols: ICountsData = { categoryLabel: countCols[categoryLabel] };
    //the columns in the row are sorted in the correct order
    rowKey.rowColumns.forEach((rowColumn) => {
        //sort columns based on the definition in the row
        sortedCountCols[rowColumn.columnLabel] = countCols[rowColumn.columnLabel];
    });
    return sortedCountCols;
}

/**
 * Query for counts data running the queries one after another but waiting for each one to return
 * @param orderedRows data
 * @param categoryLabel label for the row
 * @param cachedFeatureLayerObjs LayerCacheObj[] of cached client side feature layer objects or undefined or any
 * @param dateFieldName field holding the last time the row was updated
 * @returns Promise<{countsDataMap:Map<IRowData, ICountsData>,lastUpdate:string}>
 */
async function runCountQueriesSequentially(
    orderedRows: IRowData[],
    categoryLabel: string,
    cachedFeatureLayerObjs?: LayerCacheObj[],
    dateFieldName = 'last_edited_date'
): Promise<{ countsDataMap: Map<IRowData, ICountsData>; lastUpdate: string }> {
    const rowArrayMap = new Map<IRowData, ICountsData>();
    let maxDateValue = '';
    console.debug('running queries in sequential mode.');
    for (let i = 0; i < orderedRows.length; i++) {
        const row: IRowData = orderedRows[i];
        const lastUpdatedField =
            row.lastUpdatedFieldName && row.lastUpdatedFieldName !== '' ? row.lastUpdatedFieldName : dateFieldName;
        let fLayer;
        let fLayerObj;
        if (cachedFeatureLayerObjs && cachedFeatureLayerObjs.length > 0) {
            console.debug('Querying Cached Client Side Feature Layer Data.');
            fLayerObj = cachedFeatureLayerObjs.find(
                (fLayerObj: any) => fLayerObj.ftrClassId === row.ftrClassPortalItemId
            );
            if (fLayerObj) {
                fLayer = fLayerObj.layerObj;
            }
        }
        if (!fLayerObj) {
            console.debug('Querying Features From Server');
            fLayer = new FeatureLayer({
                portalItem: {
                    id: row.ftrClassPortalItemId,
                },
            });
        }

        const dataRow: ICountsData = {};
        dataRow[categoryLabel] = row.rowLabel;
        const columns = [...row.rowColumns];
        const orderedCols = columns.sort(sortTableData);
        for (let j = 0; j < orderedCols.length; j++) {
            const col = orderedCols[j];
            const count = await QueryCount(fLayer, col.query);
            dataRow[col.columnLabel] = typeof count === 'number' && count > -1 ? count : 0;
        }
        const maxDate = await QueryMaxDate(fLayer, lastUpdatedField);
        if (maxDate && maxDateValue === '') maxDateValue = maxDate;
        else if (maxDate) {
            if (Number(maxDate) > Number(maxDateValue)) maxDateValue = maxDate;
        }
        const sortedCols = sortCountsColumns(categoryLabel, row, dataRow);
        rowArrayMap.set(row, sortedCols);
    }
    return { countsDataMap: rowArrayMap, lastUpdate: maxDateValue };
}

/**
 * Query for counts data using PromiseAll
 * @param orderedRows data
 * @param categoryLabel label for the row
 * @param cachedFeatureLayerObjs LayerCacheObj[] of cached client side feature layer objects or undefined
 * @param dateFieldName field holding the last time the row was updated
 * @returns Promise<{countsDataMap:Map<IRowData, ICountsData>,lastUpdate:string}>
 */
async function batchRunCountQueries(
    orderedRows: IRowData[],
    categoryLabel: string,
    cachedFeatureLayerObjs?: LayerCacheObj[],
    dateFieldName = 'last_edited_date'
): Promise<{ countsDataMap: Map<IRowData, ICountsData>; lastUpdate: string }> {
    const rowArrayMap = new Map<IRowData, ICountsData>();
    let maxDateValue = '';
    console.debug('running count queries in batch mode');
    await Promise.all(
        orderedRows.map(async (row: IRowData) => {
            let fLayer: any;
            let fLayerObj;
            if (cachedFeatureLayerObjs && cachedFeatureLayerObjs.length > 0) {
                console.debug('Querying Cached Client Side Feature Layer Data.');
                fLayerObj = cachedFeatureLayerObjs.find(
                    (fLayerObj: any) => fLayerObj.ftrClassId === row.ftrClassPortalItemId
                );
                if (fLayerObj) {
                    fLayer = fLayerObj.layerObj;
                }
            }
            if (!fLayerObj) {
                console.debug('Querying Features From Server');
                fLayer = new FeatureLayer({
                    portalItem: {
                        id: row.ftrClassPortalItemId,
                    },
                });
            }

            const dataRow: ICountsData = {};
            dataRow[categoryLabel] = row.rowLabel;
            const columns = [...row.rowColumns];
            const orderedCols = columns.sort(sortTableData);

            await Promise.all(
                orderedCols.map(async (col: IColumnData) => {
                    const count = await QueryCount(fLayer, col.query);
                    dataRow[col.columnLabel] = typeof count === 'number' && count > -1 ? count : 0;
                })
            );
            const lastUpdatedField =
                row.lastUpdatedFieldName && row.lastUpdatedFieldName !== '' ? row.lastUpdatedFieldName : dateFieldName;
            const maxDate = await QueryMaxDate(fLayer, lastUpdatedField);
            if (maxDate && maxDateValue === '') maxDateValue = maxDate;
            else if (maxDate) {
                if (Number(maxDate) > Number(maxDateValue)) maxDateValue = maxDate;
            }
            const sortedCols = sortCountsColumns(categoryLabel, row, dataRow);
            rowArrayMap.set(row, sortedCols);
        })
    );
    return { countsDataMap: rowArrayMap, lastUpdate: maxDateValue };
}

/**
 * Query for counts data based on a configuration JSON definition
 * @param sampleDataObj data
 * @param lastUpdatedFieldName field holding the last time the row was updated
 * @param cachedFeatureLayer cached client side feature layer or undefined if retrieving data from network endpoin
 * @param runQueriesSequentially optional flag to indicate if queries should be executed in batch or sequential mode
 * @param outFields fields to return from the query
 */
export async function QueryForCountsLib(
    sampleDataObj: any,
    lastUpdatedFieldName?: string,
    runQueriesSequentially?: boolean,
    cachedFeatureLayer?: LayerCacheObj[],
    outFields?: string[]
): Promise<IQueryCountWidgetTableResults> {
    const rows = [...sampleDataObj.rows];
    const categoryLabel = sampleDataObj.categoryLabel;
    const summaryRowLabel = sampleDataObj.summaryRowLabel;
    const orderedRows: IRowData[] = rows.sort(sortTableData);
    let returnVal: { countsDataMap: Map<IRowData, ICountsData>; lastUpdate: string } = {
        countsDataMap: new Map<IRowData, ICountsData>(),
        lastUpdate: '',
    };
    if (runQueriesSequentially) {
        returnVal = await runCountQueriesSequentially(
            orderedRows,
            categoryLabel,
            cachedFeatureLayer,
            lastUpdatedFieldName
        );
    } else {
        returnVal = await batchRunCountQueries(orderedRows, categoryLabel, cachedFeatureLayer, lastUpdatedFieldName);
    }

    const maxDateValue = returnVal.lastUpdate;
    const rowArrayMap = returnVal.countsDataMap;

    let returnDate = new Date(Number(maxDateValue));
    const rowArrayKeys = Array.from(rowArrayMap.keys());
    const sortedKeys = rowArrayKeys.sort(sortTableData);

    const sortedRows: ICountsData[] = [];
    sortedKeys.map((keyObj) => {
        const row = rowArrayMap.get(keyObj);
        if (row) {
            row.positionInTable = keyObj.positionInTable;
            sortedRows.push(row);
        }
    });

    let totalsArray: ISummaryItem[] = [];
    if (
        sampleDataObj &&
        sampleDataObj.hasOwnProperty('defineColumnTotals') &&
        sampleDataObj.defineColumnTotals.length > 0
    ) {
        const columnCountArray = sampleDataObj.defineColumnTotals;

        const copyRows = [...sampleDataObj.rows];
        //sort rows by the number of rowColumns they define, rows may have varing number of columns
        const rowArray = copyRows.sort((dataA: any, dataB: any) => dataB.rowColumns.length - dataA.rowColumns.length);

        const numberOfColumns = rowArray[0].rowColumns.length; //use the largest value so every column can have a total
        totalsArray = calculateUserDefinedTotals(
            sortedRows,
            numberOfColumns,
            columnCountArray,
            sampleDataObj.defaultTotalColumnName ? sampleDataObj.defaultTotalColumnName : '',
            sampleDataObj.defaultTotalColumnValue ? sampleDataObj.defaultTotalColumnValue : ''
        );
    } else if (
        sampleDataObj && //render grid with defaults when no rows are available
        sampleDataObj.hasOwnProperty('defineColumnTotals') &&
        sampleDataObj.rows.length < 1 &&
        sampleDataObj.defineColumnTotals.length < 1 //no summary definitions
    ) {
        totalsArray = [{ columnLabel: 'Total', tooltipText: 'Not defined', totalCount: 0 }];
        returnDate = new Date(Date.now());
    } else {
        const totalsMap = sumAllRowColumns(sortedRows);
        const countValueArray = Array.from(totalsMap.values());
        countValueArray.forEach((count) => {
            totalsArray.push({
                columnLabel: '',
                totalCount: count,
            });
        });
    }

    const modifiedRows =
        sortedRows.length > 0
            ? sortedRows.map((row) => {
                  //remove positionInTable property
                  delete row.positionInTable;
                  return row;
              })
            : [{ categoryLabel: 'Row', Column: 0 }]; //no rows

    return {
        summaryRowLabel: summaryRowLabel,
        tableData: modifiedRows,
        totals: totalsArray,
        lastUpdatedDate: returnDate ? returnDate.toUTCString() : 'Last Updated Date Not Found',
        userDefinedTotals: sampleDataObj.defineColumnTotals ? true : false,
    };
}

/**
 * Get the item/text data for a portal item
 * @param portalItemId portal item id
 * @param portalUrl portal URL
 * @param oauthAppId
 */
export async function retrieveRegionItemData(portalItemId: any, portalUrl: string, oauthAppId: string): Promise<any> {
    return await getPortalItemDataById(portalItemId, portalUrl, oauthAppId);
}

/**
 * Get the item/text data for a portal item
 * @param portalItemId portal item id
 * @param portalUrl portal URL
 * @param oauthAppId
 */
export async function retrieveRegionAppData(portalItemId: any, portalUrl: string, oauthAppId: string): Promise<any> {
    const itemData = await getPortalItemDataById(portalItemId, portalUrl, oauthAppId);
    return itemData?.appData;
}

/**
 * Sum all columns as listed in the JSON.
 * @param sortedRows data rows
 * @returns a map of columnPosition, columnValue where key is the columnPosition the total will display at
 */
function sumAllRowColumns(sortedRows: ICountsData[]): Map<number, number> {
    const totalsMap = new Map<number, number>();
    sortedRows.forEach((row) => {
        row.positionInTable && delete row.positionInTable; //only used on user defined column counts
        let mapKey = 0;
        for (const propName in row) {
            const value = row[propName];
            if (typeof value === 'number') {
                if (totalsMap.has(mapKey)) {
                    const c = totalsMap.get(mapKey);
                    typeof c === 'number' && totalsMap.set(mapKey, c + value);
                } else {
                    totalsMap.set(mapKey, value);
                }
            }
            mapKey += 1;
        }
    });
    return totalsMap;
}

function calcTooltipText(countColumn: ICountColumn, sortedRows: ICountsData[]): string {
    let ttText = '';
    countColumn.columns.forEach((column, idx) => {
        const matchingRow = sortedRows[column.rowPosition - 1];
        if (idx !== 0 && idx < countColumn.columns.length) {
            ttText += ' + ';
        }
        ttText += `${matchingRow.categoryLabel} | ${column.columnName}`;
    });
    return ttText;
}

/**
 * Based on the user defined row/column pairs calculate the row Total/Summary
 * @param sortedRows rows with count data for each column
 * @param numberOfColumns the number of columns defined
 * @param columnCountArray array of summary definitions - row/column names pairs
 * @returns a map of columnPosition, columnValue where key is the columnPosition the total will display at
 */
function calculateUserDefinedTotals(
    sortedRows: ICountsData[],
    numberOfColumns: number,
    columnCountArray: ICountColumn[],
    defaultTotalsColumnHeader: string,
    defaultTotalsColumnValue = ''
): ISummaryItem[] {
    const totalsMap: Map<number, number> = new Map<number, number>();
    const totalsArray: ISummaryItem[] = [];
    let j = 0;
    for (j; j < numberOfColumns; j++) {
        //iterate once for each defined column - keeps items positioned correctly
        let subTotal = -1;
        let tooltip = 'Not defined.';
        const countColumn = columnCountArray.find((counts) => counts.columnOutputPosition === j + 1);
        let colLabel = defaultTotalsColumnHeader;
        if (countColumn) {
            subTotal = 0;
            tooltip = calcTooltipText(countColumn, sortedRows);
            colLabel = countColumn.columnLabel ? countColumn.columnLabel : 'Total';
            countColumn.columns.forEach((countCol: ICountItem) => {
                const row = sortedRows.find((row) => row.positionInTable === countCol.rowPosition);
                for (const prop in row) {
                    if (prop === countCol.columnName.trim()) {
                        const val = row[prop];
                        if (val && typeof val === 'number') {
                            subTotal += val;
                        }
                    }
                }
            });
        }
        totalsMap.set(j + 1, subTotal);
        const val = subTotal > -1 ? subTotal : defaultTotalsColumnValue;
        totalsArray.push({
            columnLabel: colLabel,
            totalCount: val,
            tooltipText: tooltip,
        });
    }
    return totalsArray;
}

/**
 *
 * @param portalUrl portal URL
 * @param typeKeywords typekeywords to apply to application object
 * @returns Promise<ISearchResult<IItem> | undefined>
 */
export async function findAppByKeywordAndType(
    portalUrl: string,
    typeKeywords: string,
    oauthAppId: string
): Promise<ISearchResult<IItem> | undefined> {
    return await findPortalItemsByType('Application', portalUrl, 'typekeywords', typeKeywords, oauthAppId);
}

/**
 * Class for creating and downloading GATE data to the client
 */
export class CountLayersCache {
    static countConfigs = new Map<string, any>();

    static updateFrequencyInSeconds = 300;
    static lastUpdateFieldName: string;
    static updateFtrLayerDataTimer: NodeJS.Timer;
    static countLayersArray: LayerCacheObj[] = [];

    /**
     * Given a mission name look for cached layer objects and return them if found
     * @param missionName name of the mission
     * @returns LayerCacheObj[]
     */
    static getCountLayerObjs(missionName: string): LayerCacheObj[] {
        const cacheObjs = CountLayersCache.countLayersArray.filter((layerObj) => layerObj.missionName === missionName);
        return cacheObjs;
    }

    /**
     * Add the mission application data into a static map object
     * @param missionName name of the mission
     * @param payload application data for generating GATE counts for this mission
     */
    static addConfig(missionName: string, payload: any) {
        this.countConfigs.set(missionName, payload);
    }

    /**
     * Build client side feature layers by processing all the activity counts configuration objects on the
     * mission application object.
     * @param lastUpdateFieldName name of the field holding the last update timestamp
     * @param updateFrequencyInSeconds frequency to update the cached client side data specified in seconds
     * defaults to 240 if not specified
     */
    static async processAllConfigs(lastUpdateFieldName: string, updateFrequencyInSeconds = 240) {
        console.debug('Processing mission counts configs');
        let tempCountLayersArray: LayerCacheObj[] = [];
        if (updateFrequencyInSeconds) {
            this.updateFrequencyInSeconds = updateFrequencyInSeconds;
        }
        if (lastUpdateFieldName) {
            this.lastUpdateFieldName = lastUpdateFieldName;
        }
        const configArrayKeys = Array.from(this.countConfigs.keys()); //missionNames
        for (let i = 0; i < configArrayKeys.length; i++) {
            const key = configArrayKeys[i];
            const config = this.countConfigs.get(key); //configuration that's saved on the application object

            if (config) {
                //get portalitemid for each row
                let portalItemId = '';
                let hasError = false;
                const tempCacheLayerObjs: LayerCacheObj[] = [];
                for (let j = 0; j < config.rows.length; j++) {
                    const row = config.rows[j]; //table row
                    portalItemId = row.ftrClassPortalItemId;
                    //fields needed from the layer to support the defined queries
                    const outFields: string[] = [lastUpdateFieldName, 'objectid'];
                    let useAllFields = false;
                    for (let k = 0; k < row.rowColumns.length; k++) {
                        const query = row.rowColumns[k].query.toLowerCase();
                        let queryAsArray: string[] = [];
                        if (query.indexOf('and') > 0 || query.indexOf('or') > 0) {
                            useAllFields = true;
                        } else if (query.indexOf('=') > 0 && !useAllFields) {
                            //parse field name from the query
                            queryAsArray = query.split('=');
                        } else if (query.indexOf('in') > 0 && !useAllFields) {
                            //handle an 'in' query
                            queryAsArray = query.split('in');
                        }

                        const fieldVal = queryAsArray.length > 0 ? queryAsArray[0].trim() : undefined;
                        if (fieldVal && fieldVal !== '1') {
                            //1=1 queries have no fields so skip
                            outFields.push(fieldVal);
                        }
                    }
                    let fLayer;
                    if (!useAllFields) {
                        fLayer = await this.createClientSideFeatureLayer(portalItemId, outFields);
                    }

                    fLayer &&
                        tempCacheLayerObjs.push({
                            missionName: config.regionName,
                            ftrClassId: portalItemId,
                            layerObj: fLayer,
                        });
                    if (!fLayer) {
                        hasError = true;
                        console.error(`Error caching service: ${row.ftrClassPortalItemId}`);
                    }
                }
                if (!hasError) {
                    //must be able to cache all grid columns
                    tempCountLayersArray = [...tempCountLayersArray, ...tempCacheLayerObjs];
                }
            }
        }
        this.countLayersArray = [...tempCountLayersArray];
        console.debug('Completed processing cached layer data.');
    }

    /**
     * Currently not supporting complex/compound queries (AND/OR). Save this parsing code for later implementation
     * foo = "bar" | foo in ("a","b","c") | foo = "bar" AND bar = "foo" | foo = "bar" OR bar = "foo"
     * foo = "bar" AND bar = "foo" OR bar = "bar" | foo = "bar" AND bar = "foo" OR bar IN ("foo","bar")
     * @param queries
     */
    static parseQuery(queries: string[]): string[] {
        const fieldNamesSet = new Set<string>();
        for (let i = 0; i < queries.length; i++) {
            let queryPart = queries[0].toLowerCase().trim();
            if (queryPart.startsWith('(')) {
                queryPart = queryPart.slice(1);
            }
            if (queryPart.endsWith(')')) {
                queryPart = queryPart.slice(0, queryPart.length - 1);
            }

            if (queryPart.indexOf(' and ') > 0) {
                //parse field name from the query
                const queryAsArray = queryPart.split(' and ');
                CountLayersCache.parseQuery([...queryAsArray]);
            } else if (queryPart.indexOf(' or ') > 0) {
                //parse field name from the query
                const queryAsArray = queryPart.split(' or ');
                CountLayersCache.parseQuery([...queryAsArray]);
            } else if (queryPart.indexOf(' in ') > 0) {
                //parse field name from the query
                const queryAsArray = queryPart.split(' in ');
                CountLayersCache.parseQuery([...queryAsArray]);
            } else if (queryPart.indexOf('=') > 0) {
                //parse field name from the query
                const queryAsArray = queryPart.split('=');
                fieldNamesSet.add(queryAsArray[0]);
            } else {
                console.error('Error parsing activity counts query: ' + queries);
            }
        }
        const fieldsArray = Array.from(fieldNamesSet);
        console.debug('FIELDS: ');
        console.debug(fieldsArray);
        return fieldsArray;
    }

    /**
     * Generate a client side feature layer for a GATE activity counts row
     * @param portalItemId portal item id for the layer - (row in GATE table)
     * @param outFields output query fields - generated based on the queries defined for the columns
     * @returns a client side feature layer
     */
    static async createClientSideFeatureLayer(portalItemId: string, outFields: string[]): Promise<any> {
        let newFtrLayer;
        try {
            const fLayer = new FeatureLayer({
                portalItem: {
                    id: portalItemId,
                },
            });
            const query = fLayer.createQuery();
            query.outFields = outFields;
            query.where = `1=1`;

            await fLayer.queryFeatures(query).then((result: any) => {
                if (result && result.features.length > 0) {
                    newFtrLayer = new FeatureLayer({
                        source: result.features,
                        fields: [...fLayer.fields],
                        geometryType: fLayer.geometryType,
                        objectIdField: fLayer.objectIdField,
                    });
                }
            });
        } catch (error) {
            console.error('Error querying feature count.');
            console.error(error);
        }
        return newFtrLayer;
    }

    /**
     * Launch the update interval for the cache
     */
    static start(): void {
        this.updateFtrLayerDataTimer = setInterval(() => {
            console.debug('Feature layer cache time interval executing.');
            this.processAllConfigs(this.lastUpdateFieldName);
        }, this.updateFrequencyInSeconds * 1000);
    }

    /**
     * Cleanup the timer interval
     */
    static stop(): void {
        this.updateFtrLayerDataTimer && clearInterval(this.updateFtrLayerDataTimer);
    }
}
