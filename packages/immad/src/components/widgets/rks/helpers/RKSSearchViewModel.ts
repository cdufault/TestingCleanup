/**
 * Data structure for saving/archiving records. For example a search found 50 records but the user wants
 * them returned in groups of 20. Extra records are archived until requested.
 */
interface mockResultItem {
    score: number;
    entityId: string;
    entityType: string;
}

/**
 * Helper class for saving and retrieving archived/saved records. Only applicable when testing with mock data.
 */
class mockDataScrollIdSupport {
    static archive: mockResultItem[] = [];
    static saveItem(score: number, entityId: string, entityType: string) {
        this.archive.push({
            score,
            entityId,
            entityType,
        });
    }
    static getItems(numberOfRecordsToReturn: number, scrollId: number): mockResultItem[] {
        if (scrollId > this.archive.length) {
            this.archive = [];
            return this.archive;
        } else {
            if (numberOfRecordsToReturn > this.archive.length - scrollId) {
                const returnValue = this.archive.slice(scrollId);
                this.archive = [];
                return returnValue;
            }
            return this.archive.slice(scrollId, scrollId + numberOfRecordsToReturn);
        }
    }
    static clear() {
        this.archive = [];
    }
    static totalCount() {
        return this.archive.length;
    }
}
import {
    RKSOperatorSearch,
    RKSDetailSearchStructure,
    RKSSearchOptions,
    //RKSAggs,
    resultItem,
    rksPostSearchResult,
    RKSSearchType,
    RKSEntityType,
    preFeatureObj,
    preFeatureObjElement,
    parsedRKSSearchResult,
    resultDetail,
} from './RKSInterfaces';

import { LogHelper } from '../../../../helpers/logHelper';
import { ConfigHelper } from '../../../../helpers/configHelper';
import { getDetails, getEntities } from '../mockData/rksMocks';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { AppConfig } from '../../../../interfaces/AppConfig';
import Color from '@arcgis/core/Color';
import { SimpleRenderer } from '@arcgis/core/renderers';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';

/**
 * Search bject with default values
 */
const rksDefaultSearchOptions: RKSSearchOptions = {
    sort: '_score',
    order: 'desc',
    scrollId: '',
    size: 20,
};

/**
 * Default aggregation values - temporarily suspended use of this variable
 */
/*const rksDefaultAggs: RKSAggs = {
    entityTypes: true,
    nationalities: false,
    datasets: true,
};*/

/**
 * Template for constructing an RKS operator_group_search.
 */
export function rksOperatorGroupStringSearchTemplate(): RKSOperatorSearch {
    return {
        search: {
            _searchType: RKSSearchType.RKS_Operator_Group_Search,
            and: [
                {
                    _searchType: RKSSearchType.RKS_Global_String_Search,
                    search: '',
                },
                {
                    _searchType: RKSSearchType.RKS_Entity_Type_Search,
                    entityTypes: ['vehicle'],
                },
                //{
                //_searchType: RKSSearchType.RKS_Dataset_Search,
                //datasets: ['rkb', 'quellfire', 'midb'],
                //},
            ],
            or: [],
            not: [],
        },
        searchOptions: rksDefaultSearchOptions,
        //aggs: rksDefaultAggs,
    };
}

/**
 * Pulls mock data form the json-server based on the entityId
 * TODO: add classification support
 * @param searchUrl : fake rks rest endpoint
 * @param entityId : fake rks entity id
 */
export async function fakeSearchForEntities(searchUrl: string, entityId: string): Promise<rksPostSearchResult> {
    let resultObj: any = {
        id: '',
        scrollId: '',
        totalCount: 0,
        results: [],
    };

    //removed try catch, let errors be caught by the calling function
    const requestUrl = searchUrl + '/' + entityId;
    resultObj = await makeFakeRestCall(requestUrl);

    return resultObj as rksPostSearchResult;
}

/**
 * Retrieve the entity ids from a search result.
 * @param resultObj - a json object returned from entity search search
 */
export function parseOperatorSearchResult(resultObj: rksPostSearchResult): string[] {
    const entityIdArray: string[] = [];
    if (resultObj.results) {
        resultObj.results.forEach((result) => {
            const item = entityIdArray.find((id) => result.entity.entityId === id);
            if (!item) {
                entityIdArray.push(result.entity.entityId);
            }
        });
    }
    return entityIdArray;
}

/**
 * Fake an entity.
 * @param entityType : type of rks enitity
 * @param seedNumber : number of entity items that were generated in the fake data -- currently 20 but could change
 */
export function generateFakeEntityItemId(entityType: RKSEntityType, seedNumber: number): string {
    const value = Math.floor(Math.random() * seedNumber);
    return `${entityType}-${value}`;
}

/**
 * This query will be replaced by a Post for the real RKS searhc
 * @param restUrl rks fake rest endpoint
 */
export async function makeFakeRestCall(restUrl: string): Promise<rksPostSearchResult> {
    let resultObj: rksPostSearchResult = {
        scrollId: '',
        totalCount: 0,
        results: [],
    };
    const response = await fetch(restUrl, {
        headers: {
            'Content-Type': 'application/json',
        },
    }).catch((error) => {
        LogHelper.log(`Error fetching ${restUrl}. Message: ${error}`);
        throw new Error('Error making request to ' + restUrl);
    });
    if (response && response.status != 200) {
        const message = `Error making get request to ${restUrl}. Status: ${response.status}`;
        LogHelper.log(message, true);
        throw new Error(message);
    }
    resultObj = await response.json();

    return resultObj;
}

/**
 * This query will be replaced with a Post call to the real RKS that takse an array of ids
 * @param entityIds : list of entity ids collected from search results
 * @param restUrl: fake rks rest endoint
 */
export async function getFakeDetailsBasedOnEntityIds(
    entityIds: string[],
    restUrl: string
): Promise<rksPostSearchResult[]> {
    /*const returnObj = {
        totalCount: 0,
        details: undefined
    }*/
    const jsonItemArray: rksPostSearchResult[] = [];
    await Promise.all(
        entityIds.map(async (id) => {
            const resultObj: any = await makeFakeRestCall(restUrl + '/' + id);
            jsonItemArray.push(resultObj as rksPostSearchResult);
        })
    );
    return jsonItemArray;
}

/*rksPostSearchResult*
 *  empty object
 */
export function emptyOperatorSearchResult(): rksPostSearchResult {
    return {
        scrollId: '',
        totalCount: 0,
        results: [],
        details: [],
    };
}

export function validateRKSConfigItems(config: AppConfig): boolean {
    const rksConfig = config.rks;
    if (!rksConfig.operatorGroupSearchUrl || rksConfig.operatorGroupSearchUrl.trim() === '') {
        return false;
    }
    if (!rksConfig.detailSearchUrl || rksConfig.detailSearchUrl.trim() === '') {
        return false;
    }
    if (!rksConfig.entityDetailMetaDataUrl || rksConfig.entityDetailMetaDataUrl.trim() === '') {
        return false;
    }
    if (!rksConfig.entityMetaDataUrl || rksConfig.entityMetaDataUrl.trim() === '') {
        return false;
    }
    if (!rksConfig.testSearchUrl || rksConfig.testSearchUrl.trim() === '') {
        return false;
    }
    if (!rksConfig.operatorGroupSearchUrl || rksConfig.operatorGroupSearchUrl.trim() === '') {
        return false;
    }
    if (!rksConfig.entityDetailsSearch) {
        return false;
    }
    return true;
}

function generateMockScrollId(
    maxRecordCount: number,
    results: resultItem[] | undefined
): { scrollId: number; resultArray: resultItem[] } {
    let scrollId = -1;
    const resultsToReturn: resultItem[] = [];
    results?.forEach((result, index) => {
        mockDataScrollIdSupport.saveItem(result.score, result.entity.entityId, result.entity.entityType);
        if (index < maxRecordCount) {
            resultsToReturn.push(result);
        } else {
            if (scrollId == -1) {
                scrollId = index;
            }
        }
    });
    return {
        scrollId: scrollId,
        resultArray: resultsToReturn,
    };
}

/**
 * Retrive mock data starting at a given record
 * @param count number of records to return
 * @param scrollId id marker indicating the first record to return
 */
function getMockDataUsingScrollId(count: number, scrollId: number): resultItem[] {
    const items: resultItem[] = [];
    const objArray: mockResultItem[] = mockDataScrollIdSupport.getItems(count, scrollId);
    objArray.forEach((obj) => {
        const resultItem = {
            score: obj.score,
            entity: {
                entityId: obj.entityId,
                entityType: obj.entityType,
            },
        };
        items.push(resultItem);
    });
    return items;
}

/**
 * Generate mock search results
 * @param config config.json file object
 * @param maxDetailRecordCount  number of entity/details search results to return
 * @param maxRecordCount  number of entity/discovery search results to return
 * @param scrollId search marker to return the next batch
 * @param seedNumber used for generating mock dta
 * @param totalItemsReturned number of items found by the parent search or first search
 */
async function executeMockRKSSearch(
    config: AppConfig,
    maxDetailRecordCount: number,
    maxRecordCount: number,
    scrollId: string,
    seedNumber: number,
    totalItemsReturned = 0
): Promise<parsedRKSSearchResult> {
    let scrollIdAsNumber = parseInt(scrollId);
    const restUrl = config.rks.testSearchUrl;
    let totalCount = -1;
    let newScrollId = 0;
    let entityIdArray: string[] = [];
    if (totalItemsReturned == 0) {
        mockDataScrollIdSupport.clear();
        scrollIdAsNumber = NaN;
    }
    if (isNaN(scrollIdAsNumber) == false) {
        const items = getMockDataUsingScrollId(maxRecordCount, scrollIdAsNumber);
        items.forEach((item) => {
            entityIdArray.push(item.entity.entityId);
        });
        newScrollId = scrollIdAsNumber + maxRecordCount;
        totalCount = totalItemsReturned;
    } else {
        mockDataScrollIdSupport.clear();
        const baseEntityId = generateFakeEntityItemId(RKSEntityType.VEHICLE, seedNumber);
        const postSearchResult = await fakeSearchForEntities(restUrl, baseEntityId);
        totalCount = postSearchResult.totalCount;
        const mockedScrollId = generateMockScrollId(maxRecordCount, postSearchResult.results);
        postSearchResult.results = mockedScrollId.resultArray;
        newScrollId = mockedScrollId.scrollId;
        entityIdArray = parseOperatorSearchResult(postSearchResult);
    }

    const jsonDetailArray = await getFakeDetailsBasedOnEntityIds(entityIdArray, restUrl);
    const mockResult = parseEntitySearchResults(jsonDetailArray, maxDetailRecordCount);
    mockResult.totalCount = totalCount;
    mockResult.scrollId = newScrollId > 0 ? newScrollId.toString() : '';
    return mockResult;
}

/**
 *
 * @param searchTerm string to search for
 * @param entityType type of rks entity
 * @param searchType type of rks search see RKSSearchType
 * @param seedNumber the number of fake data records created for each type of rks entity
 */
export async function executeRKSSearch(
    searchTerm: string,
    entityDetails: string[],
    entityType: RKSEntityType = RKSEntityType.VEHICLE,
    searchType: RKSSearchType = RKSSearchType.RKS_Field_String_Search,
    maxRecordCount = 100,
    maxDetailsRecordCount = 50,
    scrollId = '',
    totalItemsReturned = 0,
    searchExtent: number[] = [],
    timeExtent: string[] = [],
    seedNumber = 20
): Promise<parsedRKSSearchResult> {
    const config = await ConfigHelper.getAppConfig();
    if (!config.rks) {
        const message = 'Unable to find RKS configuration settings in the app config file. Search was not performed.';
        LogHelper.log('Error getting data. Error: ' + message, true);
        throw new Error(message);
    }

    const searchBody = constructRKSOperatorStringSearch(
        searchTerm,
        entityDetails,
        searchType,
        entityType,
        maxRecordCount,
        scrollId,
        searchExtent,
        timeExtent
    );

    if (searchType == RKSSearchType.TEST && config.rks) {
        const mockResult = await executeMockRKSSearch(
            config,
            maxDetailsRecordCount,
            maxRecordCount,
            scrollId,
            seedNumber,
            totalItemsReturned
        );
        return {
            resultData: mockResult.resultData,
            recordCountPerEntityIdMap: mockResult.recordCountPerEntityIdMap,
            postRequest: searchBody,
            scrollId: mockResult.scrollId,
            totalCount: mockResult.totalCount,
            numberOfDetailsNotProcessed: mockResult.numberOfDetailsNotProcessed,
        };
    }

    const map = new Map<string, preFeatureObj>();
    const count = new Map<string, number>();
    let returnResult: parsedRKSSearchResult = { resultData: map, recordCountPerEntityIdMap: count };
    try {
        const postUrl = config.rks.operatorGroupSearchUrl;

        const operatorGroupResult = await rksPostCall(postUrl, searchBody);

        const entityIdArray = parseOperatorSearchResult(operatorGroupResult);
        const searchBase = config.rks.entityDetailsSearch;
        searchBase.entityId = entityIdArray;
        searchBase.searchOptions.size = config.rks.detailsSearchMaxRecordCount;
        console.log(searchBase); //logging to console to help with onsite debugging

        const detailsPostUrl = config.rks.detailSearchUrl;
        const detailSearchResult = await rksPostCall(detailsPostUrl, searchBase);
        returnResult = parseEntitySearchResults([detailSearchResult], maxDetailsRecordCount);
        return {
            resultData: returnResult.resultData,
            recordCountPerEntityIdMap: returnResult.recordCountPerEntityIdMap,
            scrollId: operatorGroupResult.scrollId,
            totalCount: operatorGroupResult.totalCount,
            postRequest: searchBody,
            numberOfDetailsNotProcessed: returnResult.numberOfDetailsNotProcessed,
        };
    } catch (error) {
        LogHelper.log('Error gettting data. Error: ' + error, true);
        return {
            resultData: returnResult.resultData,
            recordCountPerEntityIdMap: returnResult.recordCountPerEntityIdMap,
            scrollId: '',
            totalCount: 0,
            postRequest: searchBody,
            numberOfDetailsNotProcessed: 0,
        };
    }
}

/**
 * Build the operator group post object with user inputs
 * @param searchTerm  const configHelperRef  = useRef<AppConfig | undefined>(undefined);
 * @param entityDetails an array of field names/details to search as opposed to a global string search
 * @param searchType RKSSearchType
 * @param entity type of the entity to search for
 * @param maxRecordCount max records to return
 */
export function constructRKSOperatorStringSearch(
    searchTerm: string,
    entityDetails: string[],
    searchType: RKSSearchType,
    entity: string,
    maxRecordCount = 100,
    scrollId = '',
    extent: number[] = [],
    timeExtent: string[] = []
): RKSOperatorSearch {
    const searchBase = rksOperatorGroupStringSearchTemplate();
    if (!searchBase.search.and) {
        //linter null check
        searchBase.search.and = [
            {
                _searchType: searchType,
                search: searchTerm,
            },
        ];
    }
    searchBase.search.and[0].search = searchTerm;
    searchBase.search.and[0]._searchType = searchType;
    if (searchType === RKSSearchType.RKS_Field_String_Search) {
        searchBase.search.and[0].detailType = entityDetails;
        searchBase.search.and[0].elementType = [];
    }

    if (extent.length > 0) {
        searchBase.search.and.push({
            _searchType: RKSSearchType.RKS_Geo_Bounding_Box_Search,
            //ymax, ymin, xmin, xmax
            top: extent[0],
            bottom: extent[1],
            left: extent[2],
            right: extent[3],
        });
    }

    if (timeExtent.length === 1) {
        searchBase.search.and.push({
            _searchType: RKSSearchType.RKS_Last_Updated_Search,
            before: timeExtent[0],
        });
    }
    if (timeExtent.length === 2) {
        searchBase.search.and.push({
            _searchType: RKSSearchType.RKS_Last_Updated_Search,
            before: timeExtent[1],
            after: timeExtent[0],
        });
    }
    searchBase.search.and[1].entityTypes = [entity];
    searchBase.searchOptions = rksDefaultSearchOptions;
    searchBase.searchOptions.size = maxRecordCount;

    searchBase.searchOptions.scrollId = scrollId;

    delete searchBase.search['or'];
    delete searchBase.search['not'];
    return searchBase;
}

export async function retrieveRKSMetaData(
    searchUrl: string,
    metaDataItem: string,
    searchType: RKSSearchType = RKSSearchType.RKS_Entity_Type_Search
): Promise<string[]> {
    let items: string[] = [];
    if (searchType == RKSSearchType.TEST) {
        if (metaDataItem == 'details') {
            items = getDetails();
        } else if (metaDataItem == 'entities') {
            items = getEntities();
        }
    } else {
        //For TESTING on Local machine ONLY
        /*if (metaDataItem == 'details') {
            items = getDetails();
        } else if (metaDataItem == 'entities') {
            items = getEntities();
        }
        return items;*/
        const jsonData = await rksGetCall(searchUrl); //returns data stringified
        if (jsonData == '') {
            LogHelper.log('Entity search results did not return any entities.', true);
        } else {
            const enumData = JSON.parse(jsonData);
            items = enumData.enum;
        }
    }
    return items;
}
/**
 * Make an RKS  POST
 * @param restUrl RKS rest URL
 * @param postBody body of the POST
 */
export async function rksPostCall(
    restUrl: string,
    postBody: RKSOperatorSearch | RKSDetailSearchStructure
): Promise<rksPostSearchResult> {
    let responseJson: rksPostSearchResult = emptyOperatorSearchResult();

    const response = await fetch(restUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postBody),
    }).catch((error) => {
        LogHelper.log(`Error making post request to  ${restUrl}. Message: ${error}`);
        throw new Error('Error making post to ' + restUrl);
    });

    if (response && response.status != 200) {
        const message = `Error making post request to ${restUrl}. Status: ${response.status}`;
        LogHelper.log(message, true);
        LogHelper.log(`More error details...Post error calling ${restUrl} with payload: ${JSON.stringify(postBody)}`);
        throw new Error(message);
    }

    responseJson = await response.json();
    return responseJson as rksPostSearchResult;
}

/**
 * Make an RKS GET call
 * @param restUrl RKS rest URL
 */
export async function rksGetCall(restUrl: string): Promise<string> {
    let jsonData = '';

    const response = await fetch(restUrl, {
        headers: {
            'Content-Type': 'application/json',
        },
    }).catch((error) => {
        LogHelper.log(`Error fetching ${restUrl}. Message: ${error}`);
        throw new Error('Error making request to ' + restUrl);
    });
    if (response && response.status != 200) {
        const message = `Error making get request to ${restUrl}. Status: ${response.status}`;
        LogHelper.log(message, true);
        throw new Error(message);
    }
    jsonData = await response.json();

    if (jsonData && jsonData != '') {
        return JSON.stringify(jsonData);
    }
    return jsonData;
}

/**
 * Compare two preFeatureObjElement array elements and keep the one with the most recent lastUpdated value if the same type is found in both arrays
 * @param existingObjElements  elements for the existing object
 * @param newObjElements element fo rthe new object
 */
export function mergeEntityIdElements(
    existingObjElements: preFeatureObjElement[],
    newObjElements: preFeatureObjElement[]
): void {
    existingObjElements.forEach((existingObjElement) => {
        newObjElements.forEach((newElement) => {
            if (newElement.type === existingObjElement.type) {
                const comp = isDate1AfterDate2(newElement.date, existingObjElement.date);
                if (comp === 1) {
                    existingObjElement = newElement; //insert the new value since it has a more recent lastupdated value
                }
            }
        });
    });
}

/**
 * Parse out the element array of a resultDetail when this item's entityId exists in our data store -- ie detailMap
 * Duplicate element types are saved based on the element that was most recently updated.
 * @param detailMap storage for parsed out data item
 * @param newDetail the item to parse
 */
function updateItemInDetailMap(detailMap: Map<string, preFeatureObj>, newDetail: resultDetail) {
    const existingDetail = detailMap.get(newDetail.entityId); //get the detail for existing item
    if (!existingDetail || !existingDetail.elements || existingDetail.elements.length < 1) {
        LogHelper.log('Failed to find a matching set of detail items for entityID: ' + newDetail.entityId);
        return;
    }

    let hasLat = false;
    let hasLong = false;
    //note that existingDetail and newDetail share/belong to the same entityId -- we need to find any common element types between them
    const newDetailLastUpdatedDate = new Date(newDetail.dates.lastUpdated); //last time detail was updated
    newDetail.elements.forEach((newDetailElement) => {
        //go thru each element in the new detail
        //confirm that an existing detail exists and it has an elements array and either update the exising on or create a new one
        //look for element type on the existing detail  that match an element type in the new detail's elements
        const existingDetailElement = existingDetail?.elements?.find(
            (existingEle) => existingEle.type === newDetailElement.type
        ); //any common elements between new and existing detail

        if (existingDetailElement) {
            //does this element already exists in the existing detail element array
            //yes, this element type exists on the existing detal
            const existingDetailElementDate = new Date(existingDetailElement.date);
            const newDetailElementDate_GT_ExistingDetailElementDate = isDate1AfterDate2(
                //was the newDetail element updated after/later than the existing element
                newDetailLastUpdatedDate.toUTCString(),
                existingDetailElementDate.toUTCString()
            ); //find item updated most recently
            if (newDetailElementDate_GT_ExistingDetailElementDate === 1) {
                //newDetail element more recent
                //update existing detail element with the new valuessince it is newer based on the last updated date
                existingDetailElement.value = newDetailElement.value; //update the existing element value to the new value
                existingDetailElement.date = new Date(newDetail.dates.lastUpdated).toUTCString(); //updte the existing element date to the new date value
            }
        } else {
            //no, this element type does not exist in the existing detail element array, so add it
            const obj = {
                type: newDetailElement.type,
                value: newDetailElement.value,
                date: newDetail.dates.lastUpdated ? new Date(newDetail.dates.lastUpdated).toUTCString() : '',
                detailId: newDetail.detailId,
            };
            existingDetail?.elements?.push(obj);
        }

        //check for geometry elements
        if (newDetailElement.type.toLowerCase() === 'latitude') {
            hasLat = true;
        }
        if (newDetailElement.type.toLowerCase() === 'longitude') {
            hasLong = true;
        }
    });

    //do we have a lat and long or a previous tag that shows they were previously found
    existingDetail.hasGeometry = (hasLat && hasLong) || existingDetail.hasGeometry === true;
}

/**
 *
 * @param searchResults raw data from search. Will containe an array of resultDetail shaped item that need to be parsed into useable objects.
 * The method accounts for one entityId that may be shared among any number of resultDetail items.
 */
export function parseEntitySearchResults(
    searchResults: rksPostSearchResult[],
    maxDetailRecordCount: number
): parsedRKSSearchResult {
    const detailMap = new Map<string, preFeatureObj>();
    const countMap = new Map<string, number>();
    let numberOfDetailsNotProcessed = 0;
    if (!searchResults) {
        return { resultData: detailMap, recordCountPerEntityIdMap: countMap };
    }
    searchResults.forEach((searchResult) => {
        if (!searchResult || !searchResult.details) {
            return detailMap;
        }

        //iterate search results and update detail for previously processed entityIds or create new new detail for new entityId
        searchResult.details.forEach((searchResultDetail) => {
            let count: number | undefined;
            if (countMap.has(searchResultDetail.entityId)) {
                count = countMap.get(searchResultDetail.entityId);
            } else {
                count = 0;
            }
            if (count != undefined) {
                countMap.set(searchResultDetail.entityId, ++count);
            }

            if (detailMap.has(searchResultDetail.entityId) === false) {
                //new entityId to process
                addNewItemToDetailMap(detailMap, searchResultDetail);
            }
            if (detailMap.has(searchResultDetail.entityId) === true) {
                //we've process this entityId previously
                if (count && count <= maxDetailRecordCount) {
                    updateItemInDetailMap(detailMap, searchResultDetail);
                } else {
                    numberOfDetailsNotProcessed++;
                    //results were return but we've processed the max # records for an entity
                    //this keeps us from getting bogged down into processing a huge number of records needlessly
                    //items were returned by last updated date, so max should be sufficient
                }
            }
        });
    });
    return {
        resultData: detailMap,
        recordCountPerEntityIdMap: countMap,
        numberOfDetailsNotProcessed: numberOfDetailsNotProcessed,
    };
}

/**
 * A single search result item that has the structure of interface resultDetail. Parse out the element array and create a preFeatureObj
 * @param detailMap parse result and add to Map<string, preFeatureObj>, string will be the entityId
 * @param searchResultDetail search results
 */
function addNewItemToDetailMap(detailMap: Map<string, preFeatureObj>, searchResultDetail: resultDetail): void {
    const elementMap: preFeatureObjElement[] = [];
    let hasLat = false;
    let hasLong = false;
    if (searchResultDetail && searchResultDetail.elements) {
        searchResultDetail.elements.forEach((element) => {
            //process all the elements
            const obj: preFeatureObjElement = {
                //create new element
                type: element.type,
                value: element.value,
                date: searchResultDetail.dates.lastUpdated
                    ? new Date(searchResultDetail.dates.lastUpdated).toUTCString()
                    : '',
                detailId: searchResultDetail.detailId,
            };
            elementMap.push(obj);
            if (element.type.toLowerCase() === 'latitude') {
                hasLat = true;
            }
            if (element.type.toLowerCase() === 'longitude') {
                hasLong = true;
            }
        });
        const newDetail: preFeatureObj = {
            //update base details
            elements: elementMap,
            access: searchResultDetail.access.classification,
            dataset: searchResultDetail.dataset ? searchResultDetail.dataset : 'unknown',
            entityType: searchResultDetail.entityType,
            hasGeometry: hasLat && hasLong,
            entityId: searchResultDetail.entityId,
        };
        detailMap.set(searchResultDetail.entityId, newDetail);
    }
}

/**
 *
 * @param preFtrMap JS Map<string , preFeatureObj>
 * @param layerName name for the new layer
 * @param wkid spatial reference id
 * Returns a featurelayer[spatialDataLayer, nonSpatialDataLayer]
 */
export function createRKSLayers(
    preFtrMap: Map<string, preFeatureObj>,
    layerName: string,
    entityIdCountMap: Map<string, number>,
    integerFields: string[] = [],
    wkid = 4326
): FeatureLayer[] {
    const ftrMap = new Map();
    let counter = 1;
    const keys = Array.from(preFtrMap.keys());
    const featureArray: __esri.GraphicProperties[] = [];
    const nonSpatialFeatureArray: __esri.GraphicProperties[] = [];

    const myFeatureSet = new Set(); //hold attributes for features
    const myTableSet = new Set(); // hold attributes for the table

    keys.forEach((key) => {
        const ftr: preFeatureObj | undefined = preFtrMap.get(key);

        if (ftrMap.has(key)) {
            LogHelper.log('Error. Entity id duplicated: ' + key, true);
        } else {
            const count = entityIdCountMap.get(key);
            if (ftr != null && ftr.elements != null) {
                const attributes: preFeatureObj = {
                    OBJECTID: counter++,
                    entityId: key,
                    entityType: ftr.entityType,
                    access: ftr.access,
                    dataset: ftr.dataset,
                    recordCount: count ? count : 0,
                    lastUpdated: 0, //if this is not updated to a valid date value an error will be thrown
                };

                if (myFeatureSet.size === 0) {
                    //add these basic/core only once given that both feature and data table use them
                    for (const key in attributes) {
                        myFeatureSet.add(key);
                        myTableSet.add(key);
                    }
                }
                const placeHolderDate = 'January 1, 1900';
                let lastUpdatedDate: string = placeHolderDate; //is this back far enough in time???
                try {
                    ftr.elements.forEach((element) => {
                        if (attributes.hasOwnProperty(element.type)) {
                            LogHelper.log('Error. Element type is duplicated: ' + element.type, true);
                        } else {
                            //each element has an update time so the most recent update to the feature will be the time that the last element that was updated
                            const r = isDate1AfterDate2(element.date, lastUpdatedDate);
                            if (r == 1) {
                                lastUpdatedDate = element.date;
                            }
                            if (element.type.toLowerCase().indexOf('date')) {
                                const d = new Date(element.value);
                                if (!isNaN(d.getTime())) {
                                    //can't be 100% certain that everything with 'date' substring is a real date
                                    element.value = d.toUTCString(); //set valid epoch value to a date string
                                }
                            }
                            Object.defineProperty(attributes, element.type, {
                                value: element.value,
                                enumerable: true,
                            });

                            //add this element to the correct set based on presence of geometry
                            ftr.hasGeometry === true ? myFeatureSet.add(element.type) : myTableSet.add(element.type);
                        }
                    });
                    const eDate = new Date(lastUpdatedDate);
                    if (isNaN(eDate.getTime())) {
                        throw new Error(
                            `Unable to find a valid last updated value for entity id: ${attributes.entityId}`
                        );
                    }

                    const comp = isDate1AfterDate2(eDate.toUTCString(), placeHolderDate); //needs to be > 0 meaning eDate is greater/more recent
                    if (comp < 1) {
                        //stuck on placeholder date 0 being equal and -1 being less than
                        throw new Error(`Unable to find a vaild last updated value to replace the placeholder date of ${placeHolderDate}. 
                        EntityId: ${attributes.entityId}`);
                    }
                    attributes.lastUpdated = eDate.getTime(); //Date.toUTCString();

                    const lat = ftr.elements.find((ele) => ele.type.toLowerCase() === 'latitude');
                    const long = ftr.elements.find((ele) => ele.type.toLowerCase() === 'longitude');
                    let feature = {};
                    let geometry = {
                        type: 'point',
                        latitude: 0,
                        longitude: 0,
                    };
                    if (lat && long) {
                        geometry = {
                            type: 'point',
                            latitude: parseFloat(lat.value),
                            longitude: parseFloat(long.value),
                        };
                        feature = {
                            geometry: geometry,
                            attributes: attributes,
                        };
                        featureArray.push(feature);
                    } else {
                        feature = {
                            attributes: attributes,
                        };
                        nonSpatialFeatureArray.push(feature);
                    }
                } catch (error) {
                    LogHelper.log(`${error}`, true);
                }
            }
        }
    });

    const featureAttributes: string[] = Array.from(myFeatureSet) as string[];
    const fields = constructFields(featureAttributes, integerFields);

    const tableAttributes: string[] = Array.from(myTableSet) as string[];
    const tableFields = constructFields(tableAttributes, integerFields);

    //will move to new method -- need to figure out how to build dynamic robust popups
    const popupRKS: __esri.PopupTemplateProperties = {
        title: layerName,
        content:
            '<b>Entity Type:<b> {ENTITYTYPE}<br> <b>Entity Id:<b>  {ENTITYID} <br><b>Data Source: {DATASET}<b><br> OID:<b>  {OBJECTID}',
    };

    //will move to new method where creation can be more dynamic with user selected options for rendering and popups
    const rksLayer = new FeatureLayer({
        source: featureArray as __esri.GraphicProperties[],
        fields: fields as __esri.FieldProperties[],
        objectIdField: 'OBJECTID',
        renderer: createSimplePointRenderer(),
        spatialReference: {
            wkid: wkid,
        },
        timeInfo: {
            startField: 'lastUpdated',
        },
        title: layerName,
        popupTemplate: popupRKS,
    });

    const rksTable = new FeatureLayer({
        source: nonSpatialFeatureArray as __esri.GraphicProperties[],
        fields: tableFields as __esri.FieldProperties[],
        objectIdField: 'OBJECTID',
        title: layerName,
    });

    rksLayer.useViewTime = true;
    return [rksLayer, rksTable];
}

/**
 * Construct the attriubtes for the table or featureclass
 * @param attributes attribute array
 * @param integerFields array of attribute names that will hold integer values
 */
function constructFields(attributes: string[], integerFields: string[]): __esri.FieldProperties[] {
    const fields: __esri.FieldProperties[] = [];
    for (const prop of attributes) {
        let field: __esri.FieldProperties;
        if (prop.toLowerCase() === 'objectid') {
            field = makeField('OBJECTID', 'OBJECTID', 'oid');
        } else if (prop.toLowerCase() === 'lastupdated') {
            //TODO: for now we handle only one field as a date, later add config array for date fields
            field = makeField(prop, prop, 'date');
        } else if (-1 != integerFields.findIndex((val) => prop.toLowerCase() === val.trim().toLowerCase())) {
            //is the field in the config.integerFields array
            field = makeField(prop, prop, 'integer'); //keeps the JS api from posting 'conversion' warnings in the console
        } else {
            field = makeField(prop, prop, 'string'); //default type
        }
        fields.push(field);
    }
    return fields;
}

/**
 * Create a new field
 * @param name field name
 * @param alias field alias
 * @param type field type
 * NOTE: Code Reviewers : any ideas for a better way of passing the type?
 **/
function makeField(name: string, alias: string, type: 'string' | 'oid' | 'integer' | 'date'): __esri.FieldProperties {
    const field: __esri.FieldProperties = {
        name: name,
        alias: alias,
        type: type,
    };
    return field;
}

/**
 *
 * @param color symbol color
 * @param size symbol size
 * Returns simple renderer props obj
 */
export function createSimplePointRenderer(color: number[] = [255, 0, 0, 0.6], size = 16): __esri.SimpleRenderer {
    const colorObj = new Color([color[0], color[1], color[2], color[3]]);
    const symbol = new SimpleMarkerSymbol({
        color: colorObj,
        size: size,
        style: 'circle',
    });
    const rnder = new SimpleRenderer({
        symbol: symbol,
    });

    return rnder;
}

/*
This section to be implement in a later sprint

export function constructPopup(title: string): void{
    //placeholder implementation coming later
}

export function buildFeaturLayer(
    featureArray: __esri.GraphicProperties[], 
    fields: __esri.FieldProperties[], 
    renderer: any = undefined, 
    srWkid: number = 4326,
    oidFieldName: string = "ObjectID"):void{

    let fLayer = new FeatureLayer(
        {
            source: featureArray,
            fields: fields,
            objectIdField: oidFieldName,
            renderer: renderer ?? createSimplePointRenderer(),
            spatialReference: {
                wkid: srWkid
            }
        }
    )
}*/

/**
 * Returns 1 if date1 > date2, 0 if they're equal, otherwise -1
 * @param date1 date to compare as a string
 * @param date2 date to compare as a string
 */
export function isDate1AfterDate2(date1: string, date2: string): number {
    const dateOne = new Date(date1);
    const dateTwo = new Date(date2);
    if (isNaN(dateOne.getTime())) {
        //are both dates valid
        if (isNaN(dateTwo.getTime())) {
            //dateOne is bad
            return 0; //equal but both bad
        } else {
            return -1; //dateOne is bad, dateTwo is valid
        }
    }
    if (dateOne.getTime() > dateTwo.getTime()) return 1;
    if (dateOne.getTime() === dateTwo.getTime()) return 0;
    return -1;
}
