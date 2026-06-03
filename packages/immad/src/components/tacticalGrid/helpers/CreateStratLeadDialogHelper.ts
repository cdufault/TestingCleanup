import { LogHelper } from '../../../helpers/logHelper';
import { getJSONFromRestEndpoint } from '../../../helpers/smartHelper';
import { SystemType } from '../components/StratLeadFormElements';

/**
 * Represents essential data from the configuration file that is needed for the helper functions.
 */
export interface requiredConfigVals {
    /**label for the system checkbox in the update form UI*/
    smartFormSystemCheckboxLabelFieldName: string;
    /**record type field name - usually 'record_type' */
    smartRecordTypeFieldName: string;
    /**record path field name - usually 'record_path' */
    smartRecordPathFieldName: string;
    /**record version field name - usually 'record_version' */
    smartRecordVersionFieldName: string;
    /**guid field name - usually 'guid' */
    smartGUID: string;
    /**record type - usually 'record' */
    smartSystemRecordType: string;
    /**group record type - usually 'record' */
    smartGroupRecordType: string;
    /**group id field name - usually 'group_id' */
    smartGroupIdFieldName: string;
    /**record id field name - usually 'record_id*/
    smartRecordIdFieldName: string;
}

/**
 * Get the value from a tactical grid row for a given attribute name
 * If passing a SMART field name the caller must have accounted for any field mappings
 * @param fieldNameToFind name of the field to search for
 * @param tacticalGridRowJson a JSON data structure for a tactical grid row - {field:value, field:value, ...}
 * Returns the field's value or undefined
 */
export function getFieldValueFromSelectedTacticalGridRow(
    fieldNameToFind: string | undefined,
    tacticalGridRowJson: any | undefined
): string | undefined {
    let fieldValue = undefined;
    if (fieldNameToFind && tacticalGridRowJson) {
        //find the system_id value in the tactical grid selected row
        for (const [key, value] of Object.entries(tacticalGridRowJson)) {
            if (key === fieldNameToFind) {
                fieldValue = value as string;
                break;
            }
        }
    }
    return fieldValue;
}

/**
 * Find all the related systems that belong to the same group as the currently selected system
 * @param tGridRowRecordId currently selected record_id
 * @param systemsInMissionDashboard all the systems in the mission dashboard
 * @param smartRecordIdFieldName record_id field name in SMART
 * @param configVals values from the config.json file for selected elements
 * Returns Map<SystemType, SystemType[]> map key is current system and value array are systems in the same group
 */
export function configureAllRelatedSystems(
    tGridRowRecordId: string | undefined,
    systemsInMissionDashboard: any[],
    smartRecordIdFieldName: string,
    configVals: requiredConfigVals
): Map<SystemType, SystemType[]> {
    let currentSystem: any;
    systemsInMissionDashboard.forEach((item) => {
        //find the system that the currently selected grid row record belongs
        if (tGridRowRecordId && item[smartRecordIdFieldName] === tGridRowRecordId) {
            currentSystem = item;
        }
    });

    let systemsObjs: Map<SystemType, SystemType[]> = new Map<SystemType, SystemType[]>();
    if (currentSystem) {
        const systemsMap: Map<string, any[]> = findAllSystemsInGroup(
            systemsInMissionDashboard,
            tGridRowRecordId,
            currentSystem,
            configVals
        );

        systemsObjs = buildSystemObjsThatWillDisplayInUpdateForm(systemsMap, currentSystem, configVals);
    }
    return systemsObjs;
}

/**
 * Find all the systems that belong to the same group as the selected row in the TGrid
 * @param systems sytems in the current dashboard
 * @param recordId id of the selected row if it exists
 * @param currentSystem the system that maps to the selected tgrid row's record_id
 * @configVals values from the config.json for key elements used in module
 * Returns a Map<string, any> where the key is the record id and each value object is a system
 *  in the group inclusive of the group
 */
export function findAllSystemsInGroup(
    systems: any[],
    recordId: string | undefined,
    currentSystem: any,
    configVals: requiredConfigVals
): Map<string, any> {
    const {
        smartGroupIdFieldName,
        smartRecordIdFieldName,
        smartRecordTypeFieldName,
        smartGroupRecordType,
        smartGUID,
        smartSystemRecordType,
    } = configVals;
    //find the system that represents the tgrid's selected row
    const groupMembersMap = new Map<string, any[]>();
    if (!recordId) {
        return groupMembersMap;
    }

    let groupGuidValue: any = undefined;
    //find the guid for the group or the group that the system belongs to
    //a system will have a groupId attribute value that maps to a group guid attribute value
    if (currentSystem) {
        //is this 'system' a group (which can contain other systems) or system -- this naming
        //follows the client's naming pattern
        const recordType = currentSystem[smartRecordTypeFieldName];
        if (recordType === smartGroupRecordType) {
            //'group'
            //a group type has no group id only a guid
            groupGuidValue = currentSystem[smartGUID];
            //isGroup = true;
        } else if (recordType === smartSystemRecordType) {
            //'system'
            //system types have a group id that matches the group guid
            groupGuidValue = currentSystem[smartGroupIdFieldName];
        }
    } else {
        LogHelper.log("Trying to locate all the systems in the group but was unable to find a 'current' system.");
    }

    if (groupGuidValue) {
        //now we have the group guid - find all systems whose groupId matches that guid
        LogHelper.log('Found the group guid.' + groupGuidValue + ' Looking for group members.');
        systems.forEach((system) => {
            if (
                (groupGuidValue && system[smartGroupIdFieldName] === groupGuidValue) ||
                system[smartGUID] === groupGuidValue
            ) {
                groupMembersMap.set(system[smartRecordIdFieldName], system); //it's a member system
            }
        });
    } else {
        LogHelper.log('Failed to find a guid for a group. Will not be able to get group members.');
    }
    return groupMembersMap;
}

/**
 * Build a mapping from all the systems that belong to the same group as the selected tgrid row adding only the
 * attributes needed to display in the UI update form
 * @param groupMembersMap JS Map with the record id as the key and record data is the value
 * @param currentSystem JSON obj for the system data corresponding to the selected tgrid row
 * @param configVals values from the config.json for key elements used in module
 * Returns a Map<SystemType, SystemType[]> where the key is the current system and the value array are all the
 * systems that belong to the same group as the current system.
 */
export function buildSystemObjsThatWillDisplayInUpdateForm(
    groupMembersMap: Map<string, any>,
    currentSystem: any,
    configVals: requiredConfigVals
): Map<SystemType, SystemType[]> {
    const {
        smartRecordPathFieldName,
        smartGroupIdFieldName,
        smartRecordIdFieldName,
        smartFormSystemCheckboxLabelFieldName,
        smartRecordVersionFieldName,
        smartGUID,
    } = configVals;
    //now lets create UI objects to display in the form
    const systemsTypeMap: Map<SystemType, SystemType[]> = new Map<SystemType, SystemType[]>();
    let selectedSystem: SystemType | undefined = undefined;
    const systemTypeObjArray: SystemType[] = []; //will update in the forEach loop that follows
    const currentSystemGUID = currentSystem[smartGUID];
    groupMembersMap.forEach((value: any, key) => {
        //value is a system /or group object
        LogHelper.log(`key: ${key}`);
        const groupId: string | undefined = value[smartGroupIdFieldName];

        let pathValue = value[smartRecordPathFieldName];
        const addedNameToObjs = systemTypeObjArray.find((obj) => obj.recordPath?.trim() === pathValue?.trim());
        if (addedNameToObjs || !pathValue) {
            //path value must be unique
            pathValue = value[smartRecordIdFieldName]; //set it to record_id
        }

        const obj: SystemType = {
            systemName: value[smartFormSystemCheckboxLabelFieldName],
            isGroup: groupId ? false : true,
            recordId: value[smartRecordIdFieldName],
            recordPath: pathValue,
            recordVersion: value[smartRecordVersionFieldName],
            guid: value[smartGUID]
        };
        systemTypeObjArray.push(obj);
        if (currentSystem && currentSystemGUID === value[smartGUID]) {
            selectedSystem = obj;
        }
    });

    if (selectedSystem) {
        systemsTypeMap.set(selectedSystem, [...systemTypeObjArray]);
    } else {
        console.log(systemTypeObjArray); // output Map object to console of debugging
        LogHelper.log('Error occurred. No current system was found.', true);
    }
    return systemsTypeMap;
}

/**
 * Get the SMART data for the selected tgrid row record_id
 * @param recordId selected row's record id
 * @param fileExt post url file extension - looking for *.json
 * @param restUrl URL to retrieve SMART data saved in config.json file
 * @param recordIdFName name of the SMART record_id field
 * @param getParams when the basic GET fails as a last resort try a call adding these params to the GET body
 * Returns a JSON data object representing a SMART data record/system
 */
export async function getRecordDataFromSMART(
    recordId: string | undefined,
    fileExt: string,
    restUrl: string,
    recordIdFName: string,
    getParams: any
): Promise<any | undefined> {
    let recordJsonObj: any = undefined;
    if (recordId) {
        const workingUrl = restUrl.trim().endsWith(fileExt) ? restUrl : `${restUrl}?${recordIdFName}=${recordId}`;
        recordJsonObj = await getJSONFromRestEndpoint(workingUrl, getParams);
        if (!recordJsonObj) {
            LogHelper.log(
                `Failed to find a record for record_id: ${recordId} @ ${restUrl}. Id field name: ${recordIdFName}`
            );
        }
    }
    return recordJsonObj;
}
