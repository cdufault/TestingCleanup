import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { RMTCodeTypeQueryMetadata, RMTQueryMetadata } from '../administrator/components/AdminSettingsSlice';
import { IFtrAttributeValueObj, NewtMessage, NewtMessageEnvelope } from './MissionLogSlice';

/**fields that can be used when building the data row to insert into the message 'value' field */
const AllowedFieldTypes = ['integer', 'single', 'small-integer', 'double', 'long', 'string', 'date', 'oid', 'guid'];

const DefaultQueryFieldLabel = 'Query Field';

/**
 * Run query against RMT data based on a parsed NEWT message data
 * @param rmtQueryMetadataFromSlice query metadata pulled from the RMTSettings on the portal application object
 * @param rmtParsedDataEnvelope parsed RMT envelope derived from data user pasted into the UI
 * @returns the parsed envelope data with the value key updated based on querying the featureclassses
 */
export async function runRMTQuery(
    rmtQueryMetadataFromSlice: RMTQueryMetadata[],
    rmtParsedDataEnvelope: NewtMessageEnvelope
): Promise<NewtMessageEnvelope | undefined> {
    const rmtDataItem = rmtQueryMetadataFromSlice.find(
        (rmtDataItem: RMTQueryMetadata) =>
            rmtDataItem.rmtMessageType.toUpperCase() === rmtParsedDataEnvelope.header.type.toUpperCase()
    );

    if (rmtDataItem) {
        try {
            await parseObjectMessages(rmtParsedDataEnvelope, rmtDataItem.codeTypes);
        } catch (error) {
            console.error('Error querying categories.', error);
        }
    } else {
        // no metadata for this message type: return parsed envleope unchanged
    }
    return rmtParsedDataEnvelope;
}

/**
 * Append the query result into the original parsed message data
 * @param queryResultMappings data rows derived from querying the featureclasses mapped to the RMT message 'origin' key
 * @param newtMessageEnv original parsed NEWT data passed in
 * @param codeType message key defined on the parsed NEWT message envelope
 */
function insertQueryResultIntoMessages(
    queryResultMappings: Map<string | number, IFtrAttributeValueObj[]>,
    newtMessageEnv: NewtMessageEnvelope,
    codeType: string
) {
    const messageData = newtMessageEnv.message[codeType];
    messageData.forEach((message: NewtMessage) => {
        if (queryResultMappings.has(message.origin)) {
            message.value = queryResultMappings.get(message.origin);
        } else {
            console.warn(
                `Message field 'origin' value: ${message.origin} - was not found in the returned query object: ${queryResultMappings}`
            );
        }
    });
}

/**
 * Utility method for sorting NewtMessages
 * @param messageA  a NewtMessage
 * @param messageB a NewtMessage
 * @returns 1 if the A message.order is greater than the B message.order otherwise false
 */
function sortMessageData(messageA: NewtMessage, messageB: NewtMessage) {
    if (messageA.order > messageB.order) {
        return 1;
    } else return -1;
}

/**
 * Run queries on the RMT messages using parameters defined on the metadata object array
 * @param parsedMessageEnv parsed RMT envelope derived from data user pasted into the UI
 * @param rmtCodeTypeQueryMetadata query metadata pulled from the RMTSettings on the portal application object
 */
export async function parseObjectMessages(
    parsedMessageEnv: NewtMessageEnvelope,
    rmtCodeTypeQueryMetadata: RMTCodeTypeQueryMetadata[]
): Promise<void> {
    for (const messageKey in parsedMessageEnv.message) {
        //add try/catch all or none?
        //find the slice data that maps to this messageKey
        const rmtSliceDataCodeType: RMTCodeTypeQueryMetadata | undefined = rmtCodeTypeQueryMetadata.find(
            (rmtCodeType: RMTCodeTypeQueryMetadata) => rmtCodeType.newtCode === messageKey
        );
        const parsedEnvMessageArray = parsedMessageEnv.message[messageKey];
        const parsedEnvOriginsArray: unknown[] = [];
        parsedEnvMessageArray.forEach((messageItem: NewtMessage) => {
            const origin = messageItem.origin;
            if (origin !== null && origin !== undefined) {
                parsedEnvOriginsArray.push(origin);
            }
        });
        if (rmtSliceDataCodeType) {
            const queryField = rmtSliceDataCodeType.queryFields.find((field) => field.label === DefaultQueryFieldLabel);
            const fieldToQuery = queryField ?? rmtSliceDataCodeType.queryFields[0];
            if (fieldToQuery) {
                const result = await queryNewtData(
                    rmtSliceDataCodeType.portalItemId,
                    parsedEnvOriginsArray,
                    fieldToQuery.selectedFieldObj.name,
                    fieldToQuery.selectedFieldObj.fieldType
                );

                insertQueryResultIntoMessages(result, parsedMessageEnv, messageKey);
                parsedMessageEnv.message[messageKey].sort(sortMessageData);
            } else {
                console.error(`A label named queryField was not found in this object: `, rmtSliceDataCodeType);
            }
        } else {
            console.error(`Message code: ${messageKey} was not found in the QueryRMTMetadata.`);
        }
    }
}

/**
 * Format a SQL value string for the items in the origins array
 * @param fieldType RMT field type string | number
 * @param rmtOriginKeysArray array of 'origin' key values for a given message item
 * @returns valid SQL value string
 */
function convertArrayToQueryValue(fieldType: string, rmtOriginKeysArray: any[]): string {
    let stringFromOriginsArray = '';
    const val = rmtOriginKeysArray[0];
    if (fieldType === 'number') {
        //type is defined at the database level
        if (typeof val === 'number') {
            stringFromOriginsArray = rmtOriginKeysArray.map((rmtOriginKey) => rmtOriginKey).join(',');
        } else {
            //number in quotes but the database expects a number
            if (val?.indexOf('.') === -1) {
                //defensive not sure if doubles/floats can be keys
                stringFromOriginsArray = rmtOriginKeysArray.map((rmtOriginKey) => parseFloat(rmtOriginKey)).join(',');
            } else {
                //convert the string to a number
                stringFromOriginsArray = rmtOriginKeysArray.map((rmtOriginKey) => parseInt(rmtOriginKey)).join(',');
            }
        }
    } else {
        //treat the value as a string
        stringFromOriginsArray = rmtOriginKeysArray.map((rmtOriginKey) => `'${rmtOriginKey}'`).join(',');
    }
    return stringFromOriginsArray;
}

/**
 * Query the designated featureclass for RMT data
 * @param layerPortalItemId query featureclass portal item id
 * @param rmtOriginKeysArray array of keys for the message.origins
 * @param queryAttribute featureclass attribute to query
 * @param fieldType data type of the query attribute number | string
 * @returns a map where the key is the origin and the values if one or more data rows
 */
export async function queryNewtData(
    layerPortalItemId: string,
    rmtOriginKeysArray: unknown[],
    queryAttribute: string,
    fieldType: string
): Promise<Map<string | number, IFtrAttributeValueObj[]>> {
    const featureLayer = new FeatureLayer({
        portalItem: {
            id: layerPortalItemId,
        },
    });

    const queryValueString = convertArrayToQueryValue(fieldType, rmtOriginKeysArray as any[]);
    let query;
    const resultMap: Map<string | number, IFtrAttributeValueObj[]> = new Map<
        string | number,
        IFtrAttributeValueObj[]
    >();
    const where = `${queryAttribute} IN (${queryValueString})`;
    try {
        query = featureLayer.createQuery();
        query.outFields = ['*'];
        query.where = where;
        query.returnGeometry = false;
        await featureLayer.queryFeatures(query).then((res) => {
            if (res && res.features.length > 0) {
                res.features.map((feature) => {
                    const codeTypeAttrObjectArray: IFtrAttributeValueObj[] = [];
                    let key = '';
                    const fields = featureLayer.fields;
                    const codeObject: IFtrAttributeValueObj = {};
                    fields.forEach((field) => {
                        if (AllowedFieldTypes.includes(field.type)) {
                            const searchKey = field.name;
                            const value = feature.attributes[searchKey];
                            const key = field.alias ? field.alias : field.name;
                            codeObject[key] = value;
                        }
                    });
                    key = feature.attributes[queryAttribute];
                    codeTypeAttrObjectArray.push(codeObject);
                    const currentArrayVals = resultMap.get(key);
                    if (currentArrayVals) {
                        //key exists
                        //handle multiple 'origin' keys existing in the table
                        resultMap.set(key, [...currentArrayVals, ...codeTypeAttrObjectArray]);
                    } else {
                        resultMap.set(key, codeTypeAttrObjectArray);
                    }
                });
            } else {
                console.warn(`The following query 'Where' returned no data: ${where}`);
            }
        });
        console.debug(resultMap);
    } catch (error) {
        console.error('Error querying categories.', error);
        console.error(`Failed query: ${query}`);
    }
    return resultMap;
}
