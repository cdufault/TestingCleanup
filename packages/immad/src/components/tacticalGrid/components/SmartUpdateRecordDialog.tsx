import React, { useEffect, useRef, useState } from 'react';
import { useSnackbar } from 'notistack';
import { DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material';
import { ActionButton } from '../../common';
import { StyledBackdrop, StyledStratLeadDialog } from '../styles';
import { WidgetContent, InputLabelInline } from '../../common/styles';
import { LogHelper } from '../../../helpers/logHelper';
import { formatDatePart } from '../helpers/gridHelper';
import ShowRelatedSystems from './ShowRelatedSystems';
import {
    findSystemSchemasFromSystemId,
    getJSONFromRestEndpoint,
    fetchPost,
    getSystemIdFromDashboardData,
} from '../../../helpers/smartHelper';
import {
    StratLeadFormSelectElement,
    StratLeadFormDateElement,
    StratLeadFormRadioElement,
    StratLeadFormTextElement,
    StratLeadFormTextAreaElement,
    elementSetStateObj,
    JsonFieldItemProp,
    StratLeadFormSectionTitle,
    htmlElementType,
    FieldMapType,
    StratLeadFormLabelElement,
    fieldMappingParams,
    SystemType,
    stratLeadDialogResult,
} from './StratLeadFormElements';
import { ConfigHelper } from '../../../helpers/configHelper';

import {
    getFieldValueFromSelectedTacticalGridRow,
} from '../helpers/CreateStratLeadDialogHelper';

export interface SmartUpdateRecordDialogProps {
    onClose: (result: stratLeadDialogResult) => void;
    open: boolean;
    container?: HTMLElement | null;
    dialogTitle?: string;

    additonalFieldsToAdd: any[];
    //arrayOfLimitedFieldNamesToAddToForm: any[];
    tacticalGridDashboardId: string | undefined;
    semiMajorFieldName: string;
    semiMinorFieldName: string;
    radiusFieldName: string;
    selectedSystem: any;
    systemsInGroup: any[];
    allSystemsInMissionDashboard: any[];
}

/**
 * Dialog that will hold HTML elements for the StratLead form.
 * @param props properties passed to the dialog
 */
const SmartUpdateRecordDialog = (props: SmartUpdateRecordDialogProps): JSX.Element => {
    const {
        onClose,
        open,
        dialogTitle,
        container,
        additonalFieldsToAdd,
        tacticalGridDashboardId,
        semiMajorFieldName,
        semiMinorFieldName,
        radiusFieldName,
        selectedSystem,
        systemsInGroup,
        allSystemsInMissionDashboard,
    } = props;

    const appConfig = ConfigHelper.getAppConfig();
    const allHtmlChildElementValuesMap = useRef<Map<string, string>>(new Map<string, string>());
    const [objsFromSystemJson, setObjsFromSystemJson] = useState<JsonFieldItemProp[]>([]);
    const allHtmlChildElementObjsMap = useRef<Map<string, elementSetStateObj>>(new Map<string, elementSetStateObj>());

    /**
     * Used to track when all values in the system JSON have been used to create form elements
     */
    const [numberOfHtmlElementsCreated, setNumberOfHtmlElementsCreated] = useState<number>(0);

    const [invalidFieldValuesArray, setInvalidFieldValuesArray] = useState<string[]>([]);
    const [semiMinor, setSemiMinor] = useState<string | undefined>();
    const [semiMajor, setSemiMajor] = useState<string | undefined>();
    const [selectedSystems, setSelectedSystems] = useState<SystemType[]>([]);
    const [systemTypesInGroup, setSystemTypesInGroup] = useState<SystemType[]>([]);
    const [additionalKeyValuesToIncludeInPost, setAdditionalKeyValuesToIncludeInPost] = useState<Map<string, string>>(
        new Map<string, string>()
    );
    const [showError, setShowError] = useState<boolean>(false);
    const [selectedSmartRecord, setSelectedSmartRecord] = useState<any | undefined>();
    const [selectedSystemRecordId, setSelectedSystemRecordId] = useState<string | undefined>();
    const jsonFileExt = 'json';

    const {
        getDashboardDataUrl, //url/smart/smartSearch?dashboard_id=did&record_active=false
        smartDashboardFieldName,
        getRecordByIdUrl, //url/smart/getRecordById&record_id=rid
        testDashboardId,
        smartGroupIdFieldName,
        useLiveDashboards,
        smartSystemIdFieldName,
        smartRecordIdFieldName,
        fetchPostParamsFromConfig,
        fetchGetParamsFromConfig,
        getSystemsJsonUrl, // url/smart/getSystems&dashboard_id=did
        recordUploadUrl, //post
        smartFormSystemCheckboxLabelFieldName,
        smartRecordTypeFieldName,
        smartUpdatePostParams,
        smartFieldsToNotUpdateWhenUpdatingTheGroup,
        smartRecordPathFieldName,
        smartRecordVersionFieldName,
        runningInCIGT,
        smartGUID,
        smartSystemRecordType,
        smartGroupRecordType,
        fieldsWithNumericValues,
        smartLastUpdatedByFieldName,
        smartLastUpdatedDateFieldName,
        useXMLHttpPost,
        useEncodeURIComponent,
        updateOnVersionConflict,
        errorOnVersionConflict,
        showErrorOnRadiusCalcFailure,
        nullableFields,
    } = appConfig.smart;
    /**
     * Pass this object to the helper functions
     */
    const configVals = {
        smartFormSystemCheckboxLabelFieldName,
        smartRecordTypeFieldName,
        smartRecordPathFieldName,
        smartRecordVersionFieldName,
        smartGUID,
        smartSystemRecordType,
        smartGroupIdFieldName,
        smartGroupRecordType,
        smartRecordIdFieldName,
    };
  
    const [systemSchemaDef, setSystemSchemaDef] = useState<any | undefined>(undefined);
    const [selectedSystemIsGroup, setSelectedSystemIsGroup] = useState<boolean>(false);
    const [schemaIsReadyForParsing, setSchemaIsReadyForParsing] = useState<boolean>(false);
    const [errorText, setErrorText] = useState<string>('');
    const [recordLastUpdatedDate, setRecordLastUpdatedDate] = useState<string>('');
    const [recordLastUpdatedBy, setRecordLastUpdatedBy] = useState<string>('');
    const [selectedRecordVersion, setSelectedRecordVersion] = useState<number>(-1);
    const { enqueueSnackbar } = useSnackbar();
    const [versionsMisMatch, setVersionsMisMatch] = useState<boolean>(false);

    useEffect(() => {
        //allHtmlChildElementObjsMap is populated on a callback method that is passed when an html element is created
        //initialize it here so that it will be ready for use
        allHtmlChildElementObjsMap.current = new Map<string, elementSetStateObj>();
    }, []);

    useEffect(() => {
        errorText === '' ? setShowError(false) : setShowError(true);
    }, [errorText]);

    useEffect(() => {
        //pass in recordId as a prop
        if (allSystemsInMissionDashboard) {
            setSelectedSmartRecord(selectedSystem);
        }
    }, [allSystemsInMissionDashboard]);

    const [flag, setFlag] = useState(false);
    useEffect(() => {
        if (selectedSmartRecord) {
            const lastUpdatedBy = selectedSmartRecord[smartLastUpdatedByFieldName];
            const userName = parseUserId(lastUpdatedBy);
            lastUpdatedBy && setRecordLastUpdatedBy(userName);
            const lastUpdatedDate = selectedSmartRecord[smartLastUpdatedDateFieldName];
            const useableDatePart = parseLastUpdateDate(lastUpdatedDate);
            setRecordLastUpdatedDate(useableDatePart);
            const recordVersion = selectedSmartRecord[smartRecordVersionFieldName];
            setSelectedRecordVersion(recordVersion);
        
            if(!systemSchemaDef){
                getSystemSchemaDef( )
                .then((schemaDef) => {
                    setSystemSchemaDef(schemaDef);
                })
                .catch((error) => {
                    console.error(error); //log out error object for on-site debugging
                    setErrorText('Error retrieving schema definition. See log for more details.');
                });
            }
        }
    }, [selectedSmartRecord]);

    useEffect(() => {
        if (systemSchemaDef && allSystemsInMissionDashboard) {        
            setSystemTypesInGroup(systemsInGroup);
            const isGroup = selectedSmartRecord[smartRecordTypeFieldName] === 'group' ? true : false;
            setSelectedSystemIsGroup(isGroup);
            setSchemaIsReadyForParsing(true);
        }
    }, [systemSchemaDef]);

    useEffect(() => {
        if (schemaIsReadyForParsing) {
            //excution of the parse method should trigger the useEffect for numberOfHtmlElementsCreated
            try {
                parseSystemJsonSchema(systemSchemaDef, [], selectedSystemIsGroup);
            } catch (error) {
                console.error(error);
                setErrorText('Error generating UI elements. See lof for more info.');
            }
        }
    }, [schemaIsReadyForParsing]);

    useEffect(() => {
        if (
            //waiting for all the form elements to get generated in the UI
            objsFromSystemJson &&
            objsFromSystemJson.length > 0 &&
            numberOfHtmlElementsCreated === objsFromSystemJson.length
            //selectedSystemRecordId
        ) {
            addRecordJSONDataIntoForm(selectedSmartRecord);
        }
    }, [numberOfHtmlElementsCreated]);

    useEffect(() => {
        if (semiMinor && semiMajor) {
            updateRadius(semiMinor, semiMajor);
        }
    }, [semiMinor, semiMajor]);

    useEffect(() => {
        if(versionsMisMatch){
            repostFormData(versionsMisMatch, updateOnVersionConflict);
        }
    },[versionsMisMatch])

    /**
     * Parse out the CN name portion of the string "CN=Adams John H,OU=Foo,OU=Bar,OU=FooBar,C=US",
     * @param userId user id string from SMART
     * @returns User name portion
     */
    function parseUserId(userId: string):string{
        if(!userId){
            return "";
        }
        const start = userId.indexOf("CN=");
        const end = userId.indexOf(",", start);
        const name = userId.slice(start + 3, end);
        return name;
    }

    /**
     * Removes the seconds from the the data string
     * @param dateString SMART formatted date string
     * @returns 
     */
    function parseLastUpdateDate(dateString: string):string{
        if(!dateString){
            console.error(`No value was provided for last update string.`);
            return "";
        }
        const endPos = dateString.lastIndexOf('.');//format *.2345
        const usableDataPortion = dateString.slice(0, endPos);
        return usableDataPortion;
    }
    /**
     * Check if the version number on the record has been updated after the record was initially loaded
     * into the update form.
     * @returns true if the version number match otherwise false
     */
    async function confirmRecordVersionMatch(recordId: string):Promise<boolean>{
        let result = false;
        await getRecordDataFromSMART(
            recordId, //selectedSystemRecordId,
            jsonFileExt,
            getRecordByIdUrl,
            smartRecordIdFieldName,
            fetchGetParamsFromConfig
        )
            .then((recordJsonObj: any) => {
                if (recordJsonObj) {
                    const currentRecordVersion = recordJsonObj[smartRecordVersionFieldName];
                    if(currentRecordVersion === selectedRecordVersion){
                        result = true;
                    }
                    else{
                        const lastUpdatedBy = recordJsonObj[smartLastUpdatedByFieldName];
                        const userName = parseUserId(lastUpdatedBy);
                        lastUpdatedBy && setRecordLastUpdatedBy(userName);
                        const lastUpdatedDate = recordJsonObj[smartLastUpdatedDateFieldName];
                        lastUpdatedDate && setRecordLastUpdatedDate(lastUpdatedDate);
                        const useableDatePart = parseLastUpdateDate(lastUpdatedDate);
                        setRecordLastUpdatedDate(useableDatePart);
                        setSelectedSmartRecord(recordJsonObj);
                        const recordVersion = recordJsonObj[smartRecordVersionFieldName];
                        setSelectedRecordVersion(recordVersion);
                    }
                }
            })
            .catch((error) => {
                console.error(error); //log out error object for on-site debugging
            });
            return result;
    }

    /**
     * Get the SMART data for the selected tgrid row record_id
     * @param recordId selected row's record id
     * @param fileExt post url file extension - looking for *.json
     * @param restUrl URL to retrieve SMART data saved in config.json file
     * @param recordFName name of the SMART record_id field
     * @param getParams when the basic GET fails as a last resort try a call adding these params to the GET body
     * Returns a JSON data object representing a SMART data record/system
     */
    async function getRecordDataFromSMART(
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

    /**
     * Given a system id find a corresponding schema in the dashboard data
     * @param systemId system id corresponding to the selected row in the tgrid
     * Returns undefined or a JSON schema definition for a system
     */
    async function findSystemSchemaForId(systemId: string): Promise<any | undefined> {
        LogHelper.log('Trying to find system data using systemId: ' + systemId.toString());
        let systemSchemaDef: any = undefined;
        if (getSystemsJsonUrl && getSystemsJsonUrl.trim().endsWith(jsonFileExt)) {
            //*.json file
            systemSchemaDef = await findSystemSchemasFromSystemId(
                getSystemsJsonUrl,
                systemId,
                smartSystemIdFieldName,
                '',
                '',
                fetchGetParamsFromConfig
            );
        } else {
            systemSchemaDef = await findSystemSchemasFromSystemId(
                getSystemsJsonUrl,
                systemId,
                smartSystemIdFieldName,
                smartDashboardFieldName,
                tacticalGridDashboardId,
                fetchGetParamsFromConfig
            );
        }
        return systemSchemaDef;
    }

    /**
     * Get a schema for the current system/selected row or for a stratlead issue
     * @param groupIdFieldName group id field name in SMART
     * @param systemIdFieldName system id field name in SMART
     * @param systemsInMissionDashboard all the systems in the mission dashboard
     * @param tGridSelectedRowJson JSON for the selected tgrid row, can be undefined when doing an issue stratlead
     * Returns a JSON schema for the system/row selected or for an issue stratlead or undefined if no schema is found
     */
    async function getSystemSchemaDef(
    ) {
        let systemSchemaDef = undefined;
        systemSchemaDef = await findSystemSchemaForId(selectedSmartRecord[smartSystemIdFieldName]);
        
        return systemSchemaDef;
    }

    /**
     * Given the JSON representation for a system break it down into a structure that can be used
     * to generate a UI.
     * @param systemJsonObj  JSON for a system
     * @param fieldNamesToAddToForm if present then only use these fields for the form, if it is empty then
     * use all the fields in the system
     * @param isGroup true if this system is a group (a group is a system but not all systems are a group)
     */
    function parseSystemJsonSchema(systemJsonObj: any, fieldNamesToAddToForm: string[], isGroup: boolean) {
        const data: JsonFieldItemProp[] = [];
        if (systemJsonObj) {
            systemJsonObj.sections.forEach((section: any) => {
                //currently only one item in the 'hits' array, but if it changes we're good
                //relevant data stored in 'sections' fields portion of the JSON
                const array = section.fields;
                for (let i = 0; i < array.length; i++) {
                    if (i === 0) {
                        //new section -- source JSON is divided into sections -- those sections headings are displayed in the data form
                        data.push({
                            //store the title for this section
                            classification: '',
                            default: false,
                            name: section.title,
                            order: 0,
                            type: 'section_title',
                        });
                    }
                    if (isGroup) {
                        const omitField = smartFieldsToNotUpdateWhenUpdatingTheGroup.find((val) => val === array[i]);
                        if (omitField === undefined) {
                            data.push(array[i]); //collect all the field objects except those prohibited from group updates
                        }
                    } else {
                        data.push(array[i]); //collect all the field objects
                    }
                }
            });

            //if we are working with just a sub-set of the system json objects we need to filter them out here
            //const fields = filterOutAllUnusedJsonFields(data, fieldNamesToAddToForm);
            additonalFieldsToAdd.forEach((addedField) => {
                data.push(addedField);
            });
            setObjsFromSystemJson([...data]);
        }
    }

    /**
     * Method is passed to the child and the child will use the method to provide the parent the setState func for the child value object.
     * Parent will use this setState to auto populate the data form.
     * @param funcVal child element's setState method for it's value for it's textfield, radio, textarea, or select.
     * @param id -- the element's id which is mapped to the data value name property
     * @param validValues --  allowable values returned as an array of values - radio and select, an empty or undefined array for all other elements,
     * @param type -- the type of HTML element ie: radio, date, textbox, textarea, or select
     * @param updateHint -- method pass back from the child HTML element that this parent can call to update text value
     *  in the child that represents the current value in the SMART record when the field is mapped.
     *  Currenlty onl implemented for textbox controls.
     */
    function callbackFuncToUpdateChildHtmlElement(
        funcVal: React.Dispatch<React.SetStateAction<string>>,
        id: string,
        validValues: string[] | undefined,
        type: htmlElementType,
        updateHint: (foo: string) => void
    ): void {
        if (type !== 'section') {
            if (allHtmlChildElementObjsMap.current.has(id) === false) {
                allHtmlChildElementObjsMap.current.set(id, {
                    func: funcVal,
                    validVals: validValues,
                    type: type,
                    updateHintText: updateHint,
                });
            } else {
                LogHelper.log('Duplicate StratLead field was found: ' + id, true);
            }
        }
        setNumberOfHtmlElementsCreated((count) => count + 1);
    }

    /**
     * After the UI is build inject the SMART and tgrid row data into the form fields.
     * @param smartRowJson the json data from SMART for the seleced grid row record_id
     * @param tGridRowJson selected tgrid json row data
     * @param fieldMappings mappings between the tgrid field names and SMART attribute field names
     * Returns void
     */
    async function addRecordJSONDataIntoForm(
        smartRowJson: any
    ): Promise<void> {
        //only get record data if a tactical grid row is selected
        //will use the callback passed from the child html element 'updateFormElementWithNewValue' to update
        //all elements to the record json value

        if (smartRowJson) {
            updateFormWithSMARTRecordData(smartRowJson); //set applicable data values into the form
        } else {
            LogHelper.log('Failed to get a JSON object for the record data. There was no SMART JSON data', true);
        }
    }

    /**
     * After the input form UI is created add the SMART record data values into the form.
     * @param recordJsonObj json object for a record
     */
    function updateFormWithSMARTRecordData(recordJsonObj: any) {
        allHtmlChildElementObjsMap.current.forEach((value, key) => {
            const func = value.func; //setState function for this JSX HTML object
            const type = value.type;
            const recordVal = recordJsonObj[key];
            if (recordVal) {
                updateFormElementWithNewValue(type, recordVal, value.validVals, func);
            }
        });
    }

    /**
     * Set the data value in an HTML JSX form element
     * @param type the HTML element type
     * @param recordVal the value to pass to the HTML element
     * @param validVals list of valid values supported if it's a radio or select element otherwise undefined
     * @param func the setState function for the HTML JSX element.
     */
    function updateFormElementWithNewValue(
        type: string,
        recordVal: any,
        validVals: string[] | undefined,
        func: React.Dispatch<React.SetStateAction<string>>
    ) {
        if (type === 'date') {
            const d = new Date(recordVal);
            if (d) {
                const v = `${d.getUTCFullYear()}-${formatDatePart('month', recordVal)}-${formatDatePart(
                    'day',
                    recordVal
                )}T${formatDatePart('hour', recordVal)}:${formatDatePart('minute', recordVal)}:${formatDatePart(
                    'second',
                    recordVal
                )}`;
                func(v);
            } else {
                LogHelper.log('Error parsing date value: ' + recordVal, true);
            }
        } else if (type === 'textbox' || type === 'textarea') {
            func(recordVal);
        } else if (type === 'select' || type === 'radio') {
            if (validVals) {
                const val = validVals.find((val) => val === recordVal);
                if (val) {
                    func(recordVal);
                } else {
                    LogHelper.log(
                        `StratLead form erred trying to add an invalid value. Found: '${recordVal}'. Allowed: ${validVals} `,
                        true
                    );
                }
            }
        }
    }

    /**
     * Check for a version differnce between when the record was retrieved and the form was displayed
     * and when the submit button is clicked on the form
     * @param versionsMisMatch true if the versions value has been updated since the record was retrived
     * @param updateOnVersionConflict config json values indicates whether to update the record on version mismatch
     */
    function repostFormData(versionsMisMatch: boolean, updateOnVersionConflict: boolean){
        if(updateOnVersionConflict && versionsMisMatch){
            if (selectedSmartRecord) {
                
                addRecordJSONDataIntoForm(selectedSmartRecord);
            }
            setVersionsMisMatch(!versionsMisMatch);
        }
    }

    /**
     * Handle dialog closing due to cancel button being clicked. Generic for now.
     */
    const handleCancel = () => {
        onClose({ message: 'Action was cancelled by the user.', success: false, status: 'warning' });
    };

    /**
     *
     * Handle the submit button click by posting data to SMART
     */
    const handleSubmit = async () => {
        try {
            if(errorOnVersionConflict){//can choose to ignore by setting config value to false
                const versionNumbersMatch = await confirmRecordVersionMatch(
                    selectedSmartRecord[smartRecordIdFieldName]);
                if(versionNumbersMatch === false){
                    enqueueSnackbar('Record version mis-match. Updated record contents have been reloaded.', {
                        variant: 'warning',
                    });
                    setVersionsMisMatch(true);
                    return;
                }
            }
            
            const idsOfSystemsToUpdate: any[] = [];
            //updating multiple systems
            allHtmlChildElementValuesMap.current.set(smartDashboardFieldName, tacticalGridDashboardId as string);
            const selectedRowRecordId: string | undefined =
                selectedSmartRecord && selectedSmartRecord.smartRecordIdFieldName;
            if (selectedSystems && selectedSystems.length > 0) {
                selectedSystems.map(async (systemUIObj) => {
                    //when doing an issue there currently is no record id -- currently not supporting issue
                    //this will be an update of some variant so don't add the selected tgrid row's record id to systems to update
                    systemUIObj.guid && systemUIObj.recordId &&
                        systemUIObj.recordId !== selectedRowRecordId &&
                        idsOfSystemsToUpdate.push(systemUIObj.guid);
                });
            } 

            await genericPost(
                recordUploadUrl,
                allHtmlChildElementValuesMap.current,
                idsOfSystemsToUpdate
            );
        } catch (error) {
            console.error(error);
            onClose({ success: false, message: 'Error posting data to SMART. See log for details' });
        }
    };

    /**
     * Build a URL encoded body payload for the post request that update SMART
     * @param dataMap a map of key/value pairs of attributes and attribute values
     * @param action the type of update ie: update w/wo tracking id, final, back to group
     * @param idsOfSystemsToUpdate associated system ids to also update - limited to tracking ids, back to group, final
     * @returns encodedURL string
     */
    function buildURLEncodedPostBody(
        dataMap: Map<string, string | number | null>,
        action: string,
        idsOfSystemsToUpdate: string[]
    ): string {
        let createTrackingId = 'no';
        if(action === 'issue'){
            action = 'update'; //on TGrid issue action SMART action is update with create_tracking_id: 'yes'
            createTrackingId = 'yes';
        }
        if(action === 'final'){
            createTrackingId = 'clear';
        }
        let postString = '';
        
        let guidsOfSystemsToUpdate = '';
        if(idsOfSystemsToUpdate && idsOfSystemsToUpdate.length > 0){
            idsOfSystemsToUpdate.forEach((guid, index) => {
                if(index < idsOfSystemsToUpdate.length - 1){
                    guidsOfSystemsToUpdate += `"${guid}",`
                }
                else {
                    guidsOfSystemsToUpdate += `"${guid}"`
                }
            })
        }
        postString += `action=${action}&create_tracking_id=${createTrackingId}&set_default=false&update_group=[${guidsOfSystemsToUpdate}]&record={`;
        let record = ``;
        const keys = Array.from(dataMap.keys());
        keys.forEach((key: string, idx: number) => {
            const numberField = fieldsWithNumericValues.find(field => field === key);
            let fieldValue = dataMap.get(key);
            if(numberField){ //use for onsite debugging
                console.debug(`Number field: ${numberField} Value: ${fieldValue}`);
            }
            //must not be undefined or null, and if it is a number field it must have a value
            if(numberField && fieldValue?.toString().trim() === ''){
                console.error(`Numeric fields must contain a value when updating SMART. Field name: ${key}`);
                return; //move to the next item
            }
            let formattedValue: string | number | null | undefined = '';
            if(nullableFields.find(nullableField => nullableField === key)){
                let val = fieldValue?.toString()?.trim();
                if(val === undefined || val === ""){//if value is missing set to null
                    formattedValue = null;
                }
                else {
                    formattedValue = `"${val}"`;
                }
            }
            else{ //value format can be: "6", 6, 6.6, "six", null, "", "   "
                const isNumber = typeof(fieldValue) === 'number';
                const nullOrStringValue = fieldValue ? fieldValue?.toString().trim() : fieldValue;
                
                formattedValue = isNumber && numberField ? fieldValue : `"${nullOrStringValue}"`;
                if(formattedValue === ""){//empty or with blank spaces
                    formattedValue = '""';
                }
            }  
            if (idx === 0) {
                record += record += `"${key}":${formattedValue}`;
            } else {
                record += `,"${key}":${formattedValue}`;
            }
        });
        const finalString = postString + record + `}`;
        console.debug(finalString);

        let uriEncoded = '';
        if(useEncodeURIComponent){
            uriEncoded = encodeURIComponent(finalString);
        }
        else{
            uriEncoded = encodeURI(finalString);
        }
    
        console.debug(uriEncoded);
        return uriEncoded;
    }
  
    /**
     * Package data into a SMART POST compatible format
     * @param postUrl POST URL
     * @param formDataKeyValueMap key/value pairs of data from the seleted tgrid row
     * @param idsOfSystemsToUpdate ids of affiliated systems to update (systems in the same group)
     */
    async function genericPost(
        postUrl: string,
        formDataKeyValueMap: Map<string, string>,
        idsOfSystemsToUpdate: any[]
    ) {
        const postBodyKeyValueMap = new Map<string, string | number | null>();
        formDataKeyValueMap.forEach((value, key) => {           
            postBodyKeyValueMap.set(key, value);
        });

        //values defined in the config that should be included in a post, must be defined with a non-empty string value
        additionalKeyValuesToIncludeInPost.forEach((value, key) => {
            if (value !== '') {
                postBodyKeyValueMap.set(key, value);
            }
        });

        //return all SMART fields in the POST body irrespective of whether they were visible in the update form
        for (const key in selectedSmartRecord) {
            //add all fields in SMART record
            const keyIsInMap = postBodyKeyValueMap.has(key); //
            if (!keyIsInMap && key !== 'acm' && key !== 'default_values') {
                const value = selectedSmartRecord[key];
                postBodyKeyValueMap.set(key, value); //add field/value to post body
            }
        }
  
        const actionValue = postBodyKeyValueMap.get('action');
        smartFieldsToNotUpdateWhenUpdatingTheGroup.forEach(fieldNameKey => {
            const keyIsInMap = postBodyKeyValueMap.has(fieldNameKey);
            if(keyIsInMap){
                postBodyKeyValueMap.delete(fieldNameKey);
            }
        })
        
        if (postUrl.trim().endsWith(jsonFileExt)) { 
            //test data
            const data = await getJSONFromRestEndpoint(postUrl, {}); //we don't have POST support in CIGT
            return data;
        }

        //action is undefined with an issue action from the TGrid UI
        const action = actionValue !== undefined  && actionValue !== null ? actionValue.toString() : 'issue';
        console.debug(postBodyKeyValueMap);
        const smartPostBodyURLEncoded = buildURLEncodedPostBody(postBodyKeyValueMap, action, idsOfSystemsToUpdate);

        let postResponse;
        if(useXMLHttpPost){
            await useXMLHttp(postUrl, smartPostBodyURLEncoded);
        }
        else{
            postResponse = await fetchPost(postUrl, smartPostBodyURLEncoded, fetchPostParamsFromConfig);
            const resp = postResponse?.success ? true : false;
            if(resp){
                if (postResponse?.response) {
                    const json = await postResponse?.response?.json();
                    console.debug(json);
                }
            }
            onClose({
                success: resp,
                message: resp ? 'Record was updated.' : 'Failed to update record. See log for more info.',
                status: resp ? 'info' : 'error',
            });
        }
    }

   /**
    * Use the native XMLHttpRequest post method
    * @param url POST URL
    * @param postData data for the post body
    */
    const useXMLHttp = (url: string ,postData:string) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
        xhr.setRequestHeader("Accept", "application/json, text/html,application/xhtml+xml");
        xhr.onreadystatechange = function() {
            if(xhr.readyState === 4){
                if(xhr.status === 200){
                    console.log("Data was updated.");
                    onClose({
                        success: true,
                        message: 'Update action was successful.',
                        status: 'info',
                    });
                }
                else{
                    console.error("Error occured updating data.");
                    onClose({
                        success: true,
                        message: `Update record failed. Status: ${xhr.statusText}`,
                        status: 'info',
                    });
                }
            }
        }
        xhr.onload = function(e){
            console.debug("xhr Http loaded.")
        }
        xhr.onerror = function(e){
            console.error(e);
            onClose({
                success: false,
                message: 'Error occurred.',
                status: 'error',
            });
        }
        xhr.send(postData);
    }
    
    /**
     * Child HTML element uses this callback function (passed when element is created) to allow the parent to track its'
     * current value.
     * @param id data item id
     * @param value HTML element's current value
     * @param isValid boolean value indicating if the field value passes Regex validation if a regex has been defined
     * for the field otherwise it will be undefined and not evaluated
     */
    function callbackFuncWhenChildElementDataChanged(
        value: string,
        id: string,
        isValid: boolean | undefined = undefined
    ) {
        //only fields that do validation on their data will send a boolean value for isValid
        const copyArray = [...invalidFieldValuesArray];
        if (isValid === false) {
            //add it to the error array if it is not present
            const index = copyArray.findIndex((val) => val === id);
            if (index === -1) {
                copyArray.push(id);
                setInvalidFieldValuesArray([...copyArray]);
            }
        } else if (isValid === true) {
            //remove from error array if it was previously added
            const index = copyArray.findIndex((val) => val === id);
            if (index !== -1) {
                copyArray.splice(index, 1);
                setInvalidFieldValuesArray([...copyArray]);
            }
        }
        if (id === semiMinorFieldName) {
            setSemiMinor(value);
        }
        if (id === semiMajorFieldName) {
            setSemiMajor(value);
        }
        allHtmlChildElementValuesMap.current.set(id, value);
    }

    /**
     * This function came from the client and is implemented as provided
     * @param semiMinor semi minor value
     * @param semiMajor semi major value
     */
    function updateRadius(semiMinor: string, semiMajor: string) {
        const sMajor = Number(semiMajor) * 1852;
        const sMinor = Number(semiMinor) * 1852;
        const radString = ((sMajor / 2.2 + sMinor / 9.7) / 1852).toFixed(3);
        let radius = Number(radString);
        if(isNaN(radius)){ //true is radius is not a number
            const errorText = `Error calculating radius from semiMinor: ${semiMinor} and semiMajor: ${semiMajor}`;
            console.error(errorText);
            if(showErrorOnRadiusCalcFailure){ //config setting that will bypass radius error
                setErrorText(errorText);
            }
        }
        const formElem = allHtmlChildElementObjsMap.current.get(radiusFieldName);
        if (formElem) {
            updateFormElementWithNewValue(formElem.type, radius, formElem.validVals, formElem.func);
        }
    }

    /**
     * Create the HTML elements based on the 'type' listed in the JSON data.
     * @param data object holding the JSON data used for rendering a child HTML element that was retrived from the server.
     * sample:{
                "classification": "Unclassified",
                "default": true,
                "default_value": "",
                "name": "record_maintenance",
                "order": 8,
                "required": true,
                "title": "Maintenance",
                "type": "select",
                "values": "truck,atv,boat,helicopter"
            },
     */
    function buildStratLeadForm(data: JsonFieldItemProp) {
        switch (data.type) {
            case 'section_title':
                return (
                    <StratLeadFormSectionTitle
                        key={data.name}
                        dataObj={data}
                        updateData={callbackFuncWhenChildElementDataChanged}
                        funcToUpdateChildElement={callbackFuncToUpdateChildHtmlElement}
                    />
                );
            case 'select':
                return (
                    <StratLeadFormSelectElement
                        key={data.name}
                        dataObj={data}
                        updateData={callbackFuncWhenChildElementDataChanged}
                        funcToUpdateChildElement={callbackFuncToUpdateChildHtmlElement}
                    />
                );
            case 'text':
                return (
                    <StratLeadFormTextElement
                        key={data.name}
                        dataObj={data}
                        updateData={callbackFuncWhenChildElementDataChanged}
                        funcToUpdateChildElement={callbackFuncToUpdateChildHtmlElement}
                    />
                );
            case 'date':
                return (
                    <StratLeadFormDateElement
                        key={data.name}
                        dataObj={data}
                        updateData={callbackFuncWhenChildElementDataChanged}
                        funcToUpdateChildElement={callbackFuncToUpdateChildHtmlElement}
                    />
                );
            case 'radio':
                return (
                    <StratLeadFormRadioElement
                        key={data.name}
                        dataObj={data}
                        updateData={callbackFuncWhenChildElementDataChanged}
                        funcToUpdateChildElement={callbackFuncToUpdateChildHtmlElement}
                    />
                );
            case 'textarea':
                return (
                    <StratLeadFormTextAreaElement
                        key={data.name}
                        dataObj={data}
                        updateData={callbackFuncWhenChildElementDataChanged}
                        funcToUpdateChildElement={callbackFuncToUpdateChildHtmlElement}
                    />
                );
            case 'label':
                return (
                    <StratLeadFormLabelElement
                        key={data.name}
                        dataObj={data}
                        updateData={callbackFuncWhenChildElementDataChanged}
                        funcToUpdateChildElement={callbackFuncToUpdateChildHtmlElement}
                    />
                );
        }
    }

    /**
     * Render the section of the UI that lists the group and systems that are associated with the current record
     */
    function renderSystemsSectionOfUI() {
        if (objsFromSystemJson && objsFromSystemJson.length > 0) {
            return (
                <ShowRelatedSystems
                    selectedSystems={selectedSystems}
                    setSelectedSystems={setSelectedSystems}
                    systemsInGroup={systemTypesInGroup}
                />
            );
        }
    }

    return (
        <StyledStratLeadDialog
            open={open}
            container={container}
            BackdropComponent={StyledBackdrop}
            fullWidth={true}
            maxWidth={'md'}
        >
            {dialogTitle && <DialogTitle>{dialogTitle}</DialogTitle>}
            <DialogContent>
                {renderSystemsSectionOfUI()}
                {!showError && objsFromSystemJson && objsFromSystemJson.length > 0 ? (
                    <WidgetContent>{objsFromSystemJson.map((data) => buildStratLeadForm(data))}</WidgetContent>
                ) : ''}
                {showError && (
                    <Typography variant='h5' color='error'>
                        {errorText}
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <InputLabelInline> 
                    <Typography variant='caption'>{`Last Updated: ${recordLastUpdatedDate} by ${recordLastUpdatedBy}`}</Typography>
                </InputLabelInline>
              
                <ActionButton
                    color='secondary'
                    variant='contained'
                    onClick={handleSubmit}
                    disabled={!objsFromSystemJson || objsFromSystemJson.length < 1}
                >
                    Submit
                </ActionButton>
                <ActionButton color='secondary' variant='contained' onClick={handleCancel}>
                    Cancel
                </ActionButton>
            </DialogActions>
        </StyledStratLeadDialog>
    );
};
export default SmartUpdateRecordDialog;
