
    /**
     * The helper methods in the this class are used to parse the record_path field in a collection of SMART records,
     * along with some utility methods for filtering the final results.
     * 
     * The record_path field is formatted as : 'foo/bar/foobar/barfoo/itemName'. All values are added into an array:
     *  [
     *      foo/bar/foobar/barfoo/itemName
     *      foo/bar/foobar1/barfoo1/itemName1
     *      foo/bar/fooba2r/barfoo2/itemName2
     *      ...
     *  ]
     * Then parsed into an array of arrays:
     *  [
     *      ['foo', 'foobar','barfoo', 'itemName],
     *      ['foo', 'foobar1','barfoo1', 'itemName1],
     *      ['foo', 'foobar2','barfoo2', 'itemName2]
     *      ...
     *  ]
     * Then converted to a ParsedRecordPath:
     * [{siblings:['itemName','itenName1','itemName2], pathLength:3, parent:'foo'}, ...]
     * 
     * Then converted to a ChildRecord - a heirarchical structure starting from the root node:
     * {id:'root', name:'System', children:[{id:'', name:'', children:[{id:'',name:'',children:[]},...]},...]} 
     *
     * Several data Maps and arrays are created along the way for quick data retrival ie:
     *  [recordsOfTypeGroup]
     *  [idsThatShouldBeExpanded]
     *  Map<recordName, smartRecord>
     *  Map<'parentPath',['childOnePath', 'childTwoPath',...] 
    */

    import {
        StratLead,
    } from '../../widgets/layerEllipse/helpers/ellipseHelpers';

    /**An intermedate data structure for holding TreeItem data*/
    export interface ParsedRecordPath {
        /**names of siblings */
        siblings: string[],
        /**level in the heirarchy */
        pathLength: number,
        /**parent node in the heirarchy */
        parent: string
    } 

    /**Record data formatted in a manner suitable to be used in a Treeview */
    export interface ChildRecord {
        id: string,
        name: string,
        children?: ChildRecord[]
    }

    /**
     * Decribes key attributes of a peer record
     */
    export interface SiblingRecord {
        parent: string,
        name: string,
    }

    interface SystemType {
        systemName: string;
        isGroup: boolean;
        recordId: string;
        recordPath: string;
        recordVersion: string;
        guid?:string;
        stratLead: StratLead;
    }

    /**
     * Given a collection of SMART records parse them into 4 data structures
     * recordPathName is generated from the last value in the record_path 'foo/bar/foobar/recordPathName'
     * @param smartRecords a collection of SMART records
     * @param smartRecordPathFieldName the name of SMART field holding the record path
     * @returns 
     * {
            recordPathNamesOfTypeGroup: string[], - recordPathName of all records where record_type === 'group'
            recordPathNameToRecord_Map: Map<string, any> key:systemPathName value:SMART record
            recordPathArray: any[], - collection of record_path field strings split into an array 
            recordPathNameToRecordPathArray_Map: Map<string, any[]>, key:recordPathName value:recordPath
        } 
     */
    export const parseSmartRecords = (smartRecords: any[], smartRecordPathFieldName: string):{
        recordPathNamesOfTypeGroup: string[],
        recordPathNameToRecord_Map: Map<string, any>,
        recordPathArray: any[],
        recordPathNameToRecordPathArray_Map: Map<string, any[]>,
        } => 
    {
        const recordPathsArray:any = [];
        const recordPathsArrayMap:Map<string, any[]> = new Map<string, any[]>();
        const groupRecordPathNames:string[] = [];
        const recordPathNameToRecord:Map<string, any> = new Map<string, any>();
        smartRecords.map((record:any) => {
            if(record[smartRecordPathFieldName]){
                const recordPath = record.record_path.split('/');
                recordPathsArray.push(recordPath);
                const lastIndex = recordPath.length -1;
                const key = recordPath[lastIndex];
                record.systemName = key;//TODO refactor to recordName
                recordPathNameToRecord.set(key, record);
                recordPathsArrayMap.set(key, recordPath);
                if(record.record_type){
                    record.record_type === 'group' && groupRecordPathNames.push(recordPath[lastIndex]);
                }
            }
            else {
                console.warn("This data is missing the field: " + smartRecordPathFieldName);
            }
        });

        return {
            recordPathNamesOfTypeGroup: groupRecordPathNames, 
            recordPathNameToRecord_Map: recordPathNameToRecord, 
            recordPathArray: recordPathsArray,
            recordPathNameToRecordPathArray_Map: recordPathsArrayMap,
        }
    }

    /**
     * Parse array of record path arrays into a Map of ParsedRecordPath values with the parent name as the key
     * @param arrayOfRecordPathArrays ie:[['fa','sa','me'], ['fa','sa','la], ['fa','sa','do','re']]
     * @returns Map<string, ParsedRecordPath>
     */
    export function parseRecordPathsArrayToHeirarchyData(arrayOfRecordPathArrays:string[][]):Map<string, ParsedRecordPath>{
        let maxArrayLength = 0;//length of the longest array in the collection of arrays
        const lengthOfChildArrays = arrayOfRecordPathArrays.map(array => array.length);
        maxArrayLength = lengthOfChildArrays.reduce((a,b) => Math.max(a,b), -Infinity);

        let columnValueToIndexMap = new Map<string, number>();
        let pathParentToParsedRecordPath_Map = new Map<string, ParsedRecordPath>();

        for(let j = 1; j < maxArrayLength + 1; j++){//0 to longest array in the arrays
            for(let n = 0; n < arrayOfRecordPathArrays.length; n++){ //go thru each array looking at arrayVal[j]
                let nthArrayInRecordPathArrays = arrayOfRecordPathArrays[n];
                if(j <= nthArrayInRecordPathArrays.length){ //only if this array has a value at pos j
                    let subRecordPaths = nthArrayInRecordPathArrays.slice(0, j);//get values 0 to j
                    let newKeyCandidate = subRecordPaths.join('/');//convert array to string with '/' as separator
                    let mapHasThisKey = columnValueToIndexMap.has(`${newKeyCandidate}`)//is this value already a key in the Map
                    if( mapHasThisKey === false){//no it is not a key, so process it or move on to the key exists
                        columnValueToIndexMap.set(`${newKeyCandidate}`, j);//add this string as a key

                        let recordPathParentValue = getFirstValueInDelimitedString(newKeyCandidate);//find the parent
                        let recordPathNameValue = getLastValueInDelimitedString(newKeyCandidate);//find the value
                        let hasKey = pathParentToParsedRecordPath_Map.has(recordPathParentValue);
                        if(hasKey){//parentvalue is a key so add it to the sibling if they exist
                            let parsedRecordPath = pathParentToParsedRecordPath_Map.get(recordPathParentValue);
                            if(parsedRecordPath){
                                parsedRecordPath.siblings.push(recordPathNameValue);
                                //update the parent with the new siblings value
                                pathParentToParsedRecordPath_Map.set(recordPathParentValue, 
                                    {
                                        siblings:parsedRecordPath.siblings, 
                                        pathLength:parsedRecordPath.pathLength, 
                                        parent: recordPathParentValue
                                    });
                            }
                        }
                        else{ //yes this key does exist
                            pathParentToParsedRecordPath_Map.set(recordPathParentValue,
                                 {
                                    siblings: [recordPathNameValue], 
                                    pathLength: j, 
                                    parent: recordPathParentValue
                                });  
                        }
                    }
                } 
            }
        }
        return pathParentToParsedRecordPath_Map;
    }

    /**
     * Convert path Map into ChildRecord struture suitable for construction of TreeNodes
     * @param parsedRecordPath_Map key:parentNode value:ParsedRecordPath
     * @param rootChild a ChildRecord which to append new ChidlRecords to its' children node
     * @returns { rootChild:ChildRecord, expandedIds:string[] }
     */
    export function processSmartRecordPaths(parsedRecordPath_Map:Map<string, ParsedRecordPath>, rootChild:ChildRecord):
        { rootChild:ChildRecord, expandedIds:string[] }
    {
        const expandedIds:string[] = ['root'];
        for(let i = 1; i <= parsedRecordPath_Map.size; i++){
            console.debug('processing i = ' + i);
            let children: SiblingRecord[] = findRecordsByHeirarchyLevel(i, parsedRecordPath_Map);
            children.forEach(child => {
                let parent = child.parent;
                if(parent === ""){//no parent indicates a first level node in the tree
                    let newChild = createNewChildRecord(child, parsedRecordPath_Map, rootChild);
                    newChild && rootChild.children &&  rootChild.children.push(newChild)
                    newChild && expandedIds.push(newChild.id);
                }
                else{ //will be attached to some exising child node
                    const parentNode = recursiveSearchForChildParent(parent, rootChild);//find a suitable parent
                    if(parentNode){
                        const isKeyInParsedRecordPathMap = parsedRecordPath_Map.has(child.name);
                        isKeyInParsedRecordPathMap && parentNode.children && parentNode.children.push({
                            id: child.name,
                            name: child.name,
                            children: []
                        });
                        isKeyInParsedRecordPathMap && expandedIds.push(child.name);
                        !isKeyInParsedRecordPathMap && parentNode.children && parentNode.children.push({
                            id: child.name,
                            name: child.name
                        });
                    }
                    else {
                        console.warn('No parent found for: ' + JSON.stringify(rootChild));
                    }
                }
            });
        }
        return { rootChild, expandedIds };
    }

    /**
     * Given a group GUID find all the SMART records of type system with a group_id that matches the given GUID
     * @param groupGuid GUID on the group record
     * @param smartRecords  records in SMART
     * @param smartRecordIdFieldName name of the SMART record_id field
     * @param smartRecordVersionFieldName  name of the SMART record_path field
     * @returns all the records that belong to the group
     */
    export function findAllSystemsInGroup(
        groupGuid: string, 
        smartRecords:any[], 
        smartRecordIdFieldName:string,
        smartRecordVersionFieldName: string,
        smartGuidFieldName:string,
        smartRecordPathFieldName: string,):any[]
        {
        const systemsInGroupProto = smartRecords.filter((record:any) => record.record_type === 'system' && record.group_id === groupGuid);
        const updatedSystemsInGroup:any[] = [];
        systemsInGroupProto.map( (value:any) => {
            const obj: any = {
                systemName: value.systemName,
                isGroup: false,
                recordId: value[smartRecordIdFieldName],
                recordPath: value[smartRecordPathFieldName],
                recordVersion: value[smartRecordVersionFieldName],
                guid: value[smartGuidFieldName]
            };
            updatedSystemsInGroup.push(obj)
        })
        return updatedSystemsInGroup;
    }

    /**
     * Find all system by the record_status === 'deployed' 
     * TODO: confirm field and values with Tim
     * @param recordPathSegmentToSystemMap 
     * @param pathsArrayMap 
     * @returns {
                dataResult:{ rootChild:ChildRecord, expandedIds:string[] }
                systemNameToSystem: Map<string,any>
            }
     */
    export const filterSystemsByRecordStatus = (
            recordPathSegmentToSystemMap:Map<string,any>, 
            pathsArrayMap:Map<string, string[]>):{
                dataResult:{ rootChild:ChildRecord, expandedIds:string[] }
                systemNameToSystem: Map<string,any>
            } => 
    {
        const systems = Array.from(recordPathSegmentToSystemMap.values())
        const systemNameToSystem_Map = queryDeployedSystems('tracking_id', systems);
        const segmentNamesArray:any[] = Array.from(systemNameToSystem_Map.keys());
        const segmentsArray:any[] = [];
        segmentNamesArray.forEach((name:string) => {
            const itemArray = pathsArrayMap.get(name);
            if(itemArray){
                segmentsArray.push(itemArray);
            }
        });
        const dataResult = createTreeeViewData(segmentsArray);
        return {dataResult: dataResult, systemNameToSystem: systemNameToSystem_Map};
    }

     /**
     * Find all system by the last_updated field
     * @param recordPathSegmentToSystemMap 
     * @param pathsArrayMap 
     * @returns {
                dataResult:{ rootChild:ChildRecord, expandedIds:string[] }
                pathSegmentMap: Map<string,any>
            }
     */
    export const filterSystemsByLastUpdated = (
        recordPathSegmentToSystemMap:Map<string,any>, 
        pathsArrayMap:Map<string, string[]>,
        baseDate: Date,
        smartLastUpdatedDateFieldName: string):{
            dataResult:{ rootChild:ChildRecord, expandedIds:string[] }, 
            pathSegmentMap: Map<string,any>
        } => 
    {
        const systems = Array.from(recordPathSegmentToSystemMap.values())
        const pathSegmentMapToSystemMap = filterSystemsLastUpdated(baseDate, smartLastUpdatedDateFieldName, systems);
        const segmentNamesArray:any[] = Array.from(pathSegmentMapToSystemMap.keys());
        const segmentsArray:any[] = [];
        segmentNamesArray.forEach((name:string) => {
            const itemArray = pathsArrayMap.get(name);
            if(itemArray){
                segmentsArray.push(itemArray);
            }
        });
    
        const dataResult = createTreeeViewData(segmentsArray);
        return {dataResult: dataResult, pathSegmentMap: pathSegmentMapToSystemMap};
    }

    /**
     * Create the hierachical data needed to render a TreeView
     * @param pathsArray array of path data
     * @returns { rootChild:ChildRecord, expandedIds:string[] }
     */
    export const createTreeeViewData = (pathsArray:any[]):{ rootChild:ChildRecord, expandedIds:string[] } => {
        const dataMap :Map<string, ParsedRecordPath> = parseRecordPathsArrayToHeirarchyData(pathsArray);
            let dataResult = processSmartRecordPaths(dataMap, {
                id: 'root',
                name: 'Systems',//Todo: should we config this value
                children:[]
            });
            return dataResult;
    }

    /**
     * Find all the SMART records that were updated after a given time
     * @param queryDate query date
     * @param queryField date field
     * @param smartRecords array of SMART records
     * @returns Map<string,any>
     */
    export const filterSystemsLastUpdated = (
        queryDate: Date, queryField: string, 
        smartRecords: any[]):Map<string,any> => {
        const filteredRecords = smartRecords.filter(smartRecord => {
            const dateVal = smartRecord[queryField];// SMART date format 2024-5-23T03:35:25.812716
            const position = dateVal.lastIndexOf('.');
            if(position !== -1){
                const val = dateVal.substring(0, position);
                const systemDate = new Date(val);
                if(systemDate){
                    return systemDate.getTime() > queryDate.getTime();
                }
                else {
                    console.error('Invalid formatted date.')
                }
            }
            console.error('Missing date or error parsing date value.')
            return false;
        });
        const pathSegmentMapToSystemMap: Map<string,any> = new Map<string, any>();
        filteredRecords.forEach(record => pathSegmentMapToSystemMap.set(record.systemName, record))
        return pathSegmentMapToSystemMap;
    }

    /**
     * Find all the SMART records that satisfies a query
     * @param queryField field to query
     * @param smartRecords array of SMART records 
     * @returns Map<string,any> -key:systemName value:smartRecord
     */
    const queryDeployedSystems = (queryField: string, smartRecords: any[]):Map<string,any> => {
        const filteredRecords = smartRecords.filter(smartRecord => smartRecord[queryField] !== null && smartRecord[queryField] !== '' );
        const systemNameToSystem_Map: Map<string,any> = new Map<string, any>();
        filteredRecords.forEach(record => systemNameToSystem_Map.set(record.systemName, record))
        return systemNameToSystem_Map;
    }

    /**
     * Given a start date subtract the time quantity+time units from this date
     * @param timeQtyVal time quantity 
     * @param timeUnitsVal time units
     * @returns Date object
     */
    export const processTimeValues = (timeQtyVal: string | number, timeUnitsVal:string):Date => {
        const today = new Date(Date.now());
        let qty = Number(timeQtyVal);
        if(qty){;
            if(timeUnitsVal === 'minutes'){
                today.setMinutes(today.getMinutes() - qty); 
            }else if(timeUnitsVal === 'hours'){
                today.setHours(today.getHours() - qty); 
            }else if(timeUnitsVal === 'days'){
                today.setHours(today.getHours() - qty * 24); 
            }else if(timeUnitsVal === 'weeks'){
                today.setHours(today.getHours() - qty * 24 * 7); 
            }
        }
        return today;
    }

    /**
     * Find all the sibling records at a given path length
     * @param lengthOfPath length of the path
     * @param recordPathMap data map
     * @returns SiblingRecord[]
     */
    function findRecordsByHeirarchyLevel(lengthOfPath: number, recordPathMap:Map<string, ParsedRecordPath>):SiblingRecord[]{
        let returnVals:SiblingRecord[] = [];
        recordPathMap.forEach((parsedRecordPath:ParsedRecordPath, key:string) => {
            if(parsedRecordPath.pathLength === lengthOfPath){
                parsedRecordPath.siblings.forEach(name => {
                    returnVals.push({
                        parent: key,
                        name: name
                    })
                })
            }
        })
        return returnVals; 
    }

    /**
     * Find the first value in a '/' delimeted string
     * @param value a string generally formatted as 'foo/bar/foobar/..
     * @returns string - the first value before the separator or the string if there is no separator
     */
    function getFirstValueInDelimitedString(value:string){
        let pos = value.indexOf('/');
        if(pos === undefined){
            return value;
        }
        let valsArray = value.split('/');
        let parent = '';
        if(valsArray.length > 1){
            parent = valsArray[valsArray.length - 2];
        }
    
        return parent;
    }

    /**
     * Given a string with separator '/' get the last value
     * @param value a string formatted like 'foo/bar/foobar/barfoo -- returns 'barfoo'
     * @returns the last value in the string if the separator '/' is found or the string if no separator
     */
    function getLastValueInDelimitedString(value:string){
        let pos = value.indexOf('/');
        if(pos === undefined){
            return value;
        }
        let valsArray = value.split('/');
        let val = valsArray[valsArray.length - 1];
        return val;
    }

    /**
     * Create a new ChildRecord with or without a children node
     * @param child a SiblingRecord
     * @param recordPathMap map of ParsedRecordPath
     * @param rootChild a ChildRecord
     * @returns ChildRecord adding with or without a children attribute or undefined if the child has a parent
     * or the rootChild has no children attribute
     */
    function createNewChildRecord(
        child: SiblingRecord, 
        recordPathMap:Map<string, ParsedRecordPath>,
        rootChild: ChildRecord):ChildRecord | undefined {
        let newChild:ChildRecord | undefined = undefined;
        let parent = child.parent;
        if(parent === ""){
            child.parent = 'root'
            if(rootChild.children){
                let hasChildren = recordPathMap.has(child.name);
                if(hasChildren){
                    newChild = {
                        id: child.name,
                        name: child.name,
                        children: []
                    }
                }
                else {
                    newChild = {
                        id: child.name,
                        name: child.name
                    }
                }
            }
        }
        return newChild;
    }

    /**
     * Given a ChildRecord and an id find the parent in the nested heirarchy
     * @param nodeId id for the node
     * @param record a ChildRecord record nested to nth degree
     *      { id: 'root', name: 'Systems', children:[ChildRecord] }
     * @returns a ChildRecord or undefined
     */
    function recursiveSearchForChildParent(nodeId:string, record:ChildRecord):ChildRecord | undefined{       
        if(record.id === nodeId){
            return record;
        }
        let children = record.children;
        if(children){
            for(let i = 0; i < children.length; i++){
                let child = children[i]
                let result = recursiveSearchForChildParent(nodeId, child);
                if(result){
                    return result;
                }
            }
        }
        return undefined;
    }

 

  
  