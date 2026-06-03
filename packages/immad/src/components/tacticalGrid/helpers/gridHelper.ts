import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { RowStatusEnum } from '../resources';
import FilterModelToQueryString from './filterHelper';
import { IGetRowsParams } from 'ag-grid-community/dist/lib/interfaces/iDatasource';
import { ValueFormatterParams } from 'ag-grid-community/dist/lib/entities/colDef';
import { LogHelper } from '../../../helpers/logHelper';

/***
 * @description Checks if status locks the row
 */
export function isLockingStatus(status: string): boolean {
    const lockingStatuses = [
        RowStatusEnum.UPDATING_STRATLEAD.valueOf(),
        RowStatusEnum.UPDATED_STRATLEAD.valueOf(),
        RowStatusEnum.ISSUING_STRATLEAD.valueOf(),
        RowStatusEnum.ISSUED_STRATLEAD.valueOf(),
        RowStatusEnum.NO_ACTION.valueOf(),
    ];
    return lockingStatuses.includes(status);
}

/**Type for handling an object of key/value pairs */
export type FieldAliasType = {
    [key:string]: any;
}

/**
 * Modify the AGGrid IGetRowsParams by replacing the field alias name with the actual field name.
 * This is required because the grid columns are using alias names but filter and sort methods fallback to the field names.
 * @param params AGGrid IGetRowsParams which change on every new/update to sort and/or filter values
 * @param gridLayerFields Fields in the tactical grid feature layer
 * @returns IGetRowsParams 
 */
function convertAliasNamesToFieldNames(params: IGetRowsParams, gridLayerFields: any[]):IGetRowsParams{
    if(!params || Object.keys(params.filterModel).length === 0){//no filter defined
        return params;
    }
    
    for(const filterModelFieldName in params.filterModel){ //each field with a filter definition
        let filteredField = gridLayerFields.find(field => field.alias.toLowerCase() === filterModelFieldName);//look for a matching alias name
        if(filteredField && filteredField.name !== filterModelFieldName){ //if filter is on an alias name
            params.filterModel[filteredField.name] = params.filterModel[filterModelFieldName];//update param attribute to point to the field name
            delete params.filterModel[filterModelFieldName]; //delete the param attribute with the alias name
        }       
    }
    return params;
}

/**
 * @description Handles get row calls from the ag grid paging controller
 * @param params
 * @param gridLayer
 * @returns an object containing an array of data rows, the number of rows, and a mapping object of fieldNames to fieldNameAlias OR undefined
 */
export async function queryData(
    params: IGetRowsParams,
    gridLayer: FeatureLayer
): Promise<{ rows: any[]; totalRows: number; aliasNameToFieldNameMap: Map<string, string> } | undefined> {
    const query = gridLayer.createQuery(); // NOTE: This sets query.where to 1=1

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
            const selectedField = gridLayer.fields.find(field => field.alias.toLowerCase() === param.colId);
            selectedField && orderByFieldNames.push(`${selectedField.name} ${param.sort}`); //swap out the alias name for the field name
        });

        query.orderByFields = orderByFieldNames;
        query.start = params.startRow;
        query.num = params.endRow - params.startRow;

        //query features
        const queryResults = await gridLayer.queryFeatures(query);
        
        const localFieldToAliasNameMaps: Map<string, string> = new Map<string, string>();
        const aliasNameToFieldNameMap: Map<string, string> = new Map<string, string>();
        queryResults.fields.map(field => {
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
        LogHelper.log(e.message, true);
    }
}

/**
 * Replace an object's key with a JSMap's value. For example, given:
 * object={{name:'john'},...} and Map=key=>'name' ==> value=>'my_name'
 * return = {{my_name: 'john'}, ...}
 * @param sourceObject object of key/value objects ie: {{foo:'bar'},...}
 * @param frsourceMapomMap JS Map<string, string>
 * @returns object of key/value pair objects ie: {{bar:'foo'}, ...}
 */
export function fromJSMapToKeyValueObject(sourceObject: FieldAliasType, sourceMap: Map<string, string>):FieldAliasType {
    let outObject:FieldAliasType = {};
    for(const objectKey in sourceObject){
        const objectValue = sourceObject[objectKey];
        const mapValue = sourceMap.get(objectKey);
        if(mapValue){
            outObject[mapValue] = objectValue;
        }
    }
    return outObject;
}

/**
 * Convert a month index to threr character month
 * @param val number representing a month 0-11
 * @returns a three character representation of the month index
 */
function numToThreeCharMonth(val: number): string | undefined {
    switch (val) {
        case 0:
            return 'JAN';
        case 1:
            return 'FEB';
        case 2:
            return 'MAR';
        case 3:
            return 'APR';
        case 4:
            return 'MAY';
        case 5:
            return 'JUN';
        case 6:
            return 'JUL';
        case 7:
            return 'AUG';
        case 8:
            return 'SEP';
        case 9:
            return 'OCT';
        case 10:
            return 'NOV';
        case 11:
            return 'DEC';
        default:
            console.error('Value for month must be between 0-11. Value passed in was ' + val);
            return undefined;
    }
}

/**
 * Given a UTC date and a date part ie date, hour, minute - return a numeric value for the date part
 * @param type a time increment ie: date, hour, minute
 * @param date UTC date
 * @returns string representing a number value for the date type part
 */
function getDateValue(type: string, date: Date): string {
    if (!date) {
        console.error('Error converting string to a valid date. No date provided');
        return '';
    }
    let formatValue = 0;
    switch (type) {
        case 'date': {
            formatValue = date.getUTCDate(); //day of month
            break;
        }
        case 'hour': {
            formatValue = date.getUTCHours();
            break;
        }
        case 'minute': {
            formatValue = date.getUTCMinutes();
            break;
        }
        default:
            console.error('only date, hour, and minute are supported. Invalid value: ' + type);
            return '';
    }
    //should be two places/digits
    if (formatValue < 10) {
        return `0${formatValue}`;
    }
    return formatValue.toString();
}

/**
 * @description Custom AGGrid date formmatter that formats date strings - date coming in from Portal currently is an epoch
 * @param params AGGrid value in the cell for the date column
 */
export function dateFormatter(params: ValueFormatterParams): string | undefined {
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
        const month = dateVal.getUTCMonth();
        const monthValue = numToThreeCharMonth(month);
        //client requested format DDHHMMZMMMYYYY
        const customDateValue = `${getDateValue('date', dateVal)}${getDateValue('hour', dateVal)}${getDateValue(
            'minute',
            dateVal
        )}Z${monthValue}${dateVal.getUTCFullYear()}`;


        //dateTimeHelper.convertUTCToLocalDate can be used to convert back
        //we don't want to export out this format it is for internal presentation only
        return customDateValue;
    } else {
        return undefined;
    }
}

/**
 * Helper function to help format date string elements into YYYY-MM-DDTmm:ss for use by the HTML date/time element
 * @param type time unit ie month, day,hour, etc
 * @param dateString a date string
 */
export function formatDatePart(type: string, dateString: string): string {
    const date = new Date(dateString);
    if (!date) {
        LogHelper.log('Error converting string to a valid date: ' + dateString, true);
        return '';
    }
    let m = 0;
    switch (type) {
        case 'month': {
            m = date.getMonth() + 1; //add one
            break;
        }
        case 'day': {
            m = date.getDate();
            break;
        }
        case 'hour': {
            m = date.getHours();
            break;
        }
        case 'minute': {
            m = date.getMinutes();
            break;
        }
        case 'second': {
            m = date.getSeconds();
            break;
        }
    }
    if (m < 10) {
        return `0${m}`;
    }
    return m.toString();
}
