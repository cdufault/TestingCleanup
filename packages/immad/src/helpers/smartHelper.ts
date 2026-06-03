import { LogHelper } from './logHelper';

/**
 * Final rollover fetch with a specific set of fetch params derived from a fetch outlined in
 * the configuration file.
 * @param workingUrl URL endpoint
 * @param fetchGetBody set of fetch params defined in the config file
 */
async function fetchFromRestEndpointBasedOnConfig(workingUrl: string, fetchGetBody: any): Promise<any | undefined> {
    let jsonData: any = undefined;
    try {
        LogHelper.log('Get body: ' + fetchGetBody ? JSON.stringify(fetchGetBody) : '');
        const response = await fetch(workingUrl, fetchGetBody).catch((error) => {
            LogHelper.log(`Fetch using app config settings. Error fetching ${workingUrl}. Message: ${error}`);
            return jsonData;
        });
        if (response && response.status != 200) {
            const message = `Fetch using app config settings. Error making get request to ${workingUrl}. Status: ${response.status}`;
            LogHelper.log(message, true);
            return undefined;
        }
        jsonData = await response.json();

        return jsonData;
    } catch (e) {
        LogHelper.log('Fetch three. ' + e);
        return undefined;
    }
}

/**
 * Rollover fetch 3 with a specific set of fetch params to try.
 * @param workingUrl URL endpoint
 */
async function fetchFromRestEndpoint3(workingUrl: string): Promise<any | undefined> {
    let jsonData: any = undefined;
    try {
        const response = await fetch(workingUrl, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
        }).catch((error) => {
            LogHelper.log(`Fetch three. Error fetching ${workingUrl}. Message: ${error}`);
            return jsonData;
        });
        if (response && response.status != 200) {
            const message = `Fetch three. Error making get request to ${workingUrl}. Status: ${response.status}`;
            LogHelper.log(message, true);
            return undefined;
        }
        jsonData = await response.json();

        return jsonData;
    } catch (e) {
        LogHelper.log('Fetch three. ' + e);
        return undefined;
    }
}

/**
 * Rollover fetch 2 with a specific set of fetch params to try.
 * @param workingUrl URL endpoint
 */
async function fetchFromRestEndpoint2(workingUrl: string): Promise<any | undefined> {
    let jsonData: any = undefined;
    try {
        const response = await fetch(workingUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        }).catch((error) => {
            LogHelper.log(`Fetch two. Error fetching ${workingUrl}. Message: ${error}`);
            return jsonData;
        });
        if (response && response.status != 200) {
            const message = `Fetch two. Error making get request to ${workingUrl}. Status: ${response.status}`;
            LogHelper.log(message, true);
            return undefined;
        }
        jsonData = await response.json();

        return jsonData;
    } catch (e) {
        LogHelper.log('Fetch two. ' + e);
        return undefined;
    }
}

/**
 * Rollover fetch 1 with a specific set of fetch params to try.
 * @param workingUrl URL endpoint
 */
async function fetchFromRestEndpoint1(workingUrl: string): Promise<any | undefined> {
    let jsonData: any = undefined;
    try {
        const response = await fetch(workingUrl).catch((error) => {
            LogHelper.log(`Fetch one. Error fetching ${workingUrl}. Message: ${error}`);
            return jsonData;
        });
        if (response && response.status != 200) {
            const message = `Fetch one. Error making get request to ${workingUrl}. Status: ${response.status}`;
            LogHelper.log(message, true);
            return undefined;
        }
        jsonData = await response.json();

        return jsonData;
    } catch (e) {
        LogHelper.log('Fetch one. ' + e);
        return undefined;
    }
}

/**
 * This method does a fetch GET. It is stacked to try a variety of different fetch parameters including
 * a custom GET defined in the config file. If one call fails it rolls over to another call ... and so on
 * util all options are exhausted.
 * @param workingUrl URL to rest endpoint
 * @param fetchGetBody values from the config for a GET using misc fetch allowed parameters
 */
export async function getJSONFromRestEndpoint(workingUrl: string, fetchGetBody: any): Promise<any | undefined> {
    let jsonData: any = undefined;
    const getParamsIsEmpty = fetchGetBody ? Object.keys(fetchGetBody).length === 0 : true;
    try {
        jsonData = await fetchFromRestEndpoint1(workingUrl);
        if (!jsonData) {
            jsonData = await fetchFromRestEndpoint2(workingUrl);
        }
        if (!jsonData) {
            jsonData = await fetchFromRestEndpoint3(workingUrl);
        }
        if (!jsonData && getParamsIsEmpty === false) {
            jsonData = await fetchFromRestEndpointBasedOnConfig(workingUrl, fetchGetBody);
        }
        return jsonData;
    } catch (e) {
        LogHelper.log(e);
        return undefined;
    }
}

/**
 * Get values for record attributes that do not get displayed in the update Stratlead data forms
 * @param workingUrl getRecordById url value
 * @param fieldNames names of fields to extract data
 * @param queryParams optional query params to add to the GET fetch
 */
export async function getRecordValuesNotInUi(
    workingUrl: string,
    fieldNames: string[],
    queryParams: any
): Promise<Map<string, string>> {
    const dataMap: Map<string, string> = new Map<string, string>();
    let jsonData: any = undefined;
    const getParamsIsEmpty = queryParams ? Object.keys(queryParams).length === 0 : true;
    try {
        jsonData = await fetchFromRestEndpoint1(workingUrl);
        if (!jsonData) {
            jsonData = await fetchFromRestEndpoint2(workingUrl);
        }
        if (!jsonData) {
            jsonData = await fetchFromRestEndpoint3(workingUrl);
        }
        if (!jsonData && getParamsIsEmpty === false) {
            jsonData = await fetchFromRestEndpointBasedOnConfig(workingUrl, queryParams);
        }
        if (jsonData) {
            fieldNames.forEach((field) => {
                dataMap.set(field, jsonData[field]);
            });
        }
        return dataMap;
    } catch (e) {
        LogHelper.log(e);
        return dataMap;
    }
}

/**
 * Use this method to get a system schema based on a dashboard id. This method is used when we don't have a
 * valid system id to use.
 * @param getSystemsUrl ULR endpoint
 * @param dashboardIdFieldName dashboard id field name
 * @param dashboardId dashboard id
 * @param queryParams fetch GET body from config
 */
export async function findSystemSchemasFromDashboardId(
    getSystemsUrl: string,
    dashboardIdFieldName = '',
    dashboardId = '',
    queryParams: any
): Promise<any | undefined> {
    let jsonSystemSchemaData: any;
    try {
        const pos = getSystemsUrl.indexOf('?');
        let workingUrl = getSystemsUrl;
        if (pos === -1 && dashboardId !== '' && dashboardIdFieldName !== '') {
            workingUrl = `${getSystemsUrl}?${dashboardIdFieldName}=${dashboardId}`;
        }
        jsonSystemSchemaData = await getJSONFromRestEndpoint(workingUrl, queryParams);
        return jsonSystemSchemaData;
    } catch (e) {
        LogHelper.log(e);
        return undefined;
    }
}

/**
 * Get the system schema from SMART. System schema is used to build the update StratLead forms.
 * @param getSystemsUrl URL endpoint
 * @param systemId system id
 * @param systemIdFieldName system id field name
 * @param dashboardIdFieldName dashboard id field name
 * @param dashboardId dashboard id
 * @param queryParams the fetch body parameters
 */
export async function findSystemSchemasFromSystemId(
    getSystemsUrl: string,
    systemId: string,
    systemIdFieldName: string,
    dashboardIdFieldName = '',
    dashboardId = '',
    queryParams: any
): Promise<any | undefined> {
    let foundSysSchema: any;
    try {
        const systemSchemas = await findSystemSchemasFromDashboardId(
            getSystemsUrl,
            dashboardIdFieldName,
            dashboardId,
            queryParams
        );
        if (systemSchemas && systemSchemas.results) {
            systemSchemas.results.forEach((systemSchema: any) => {
                if (systemId === systemSchema[systemIdFieldName]) {
                    foundSysSchema = systemSchema;
                }
            });
        } else if (systemSchemas && Array.isArray(systemSchemas)) {
            systemSchemas.forEach((systemSchema) => {
                if (systemId === systemSchema[systemIdFieldName]) {
                    foundSysSchema = systemSchema;
                }
            });
        }
        return foundSysSchema;
    } catch (e) {
        LogHelper.log(e);
        return undefined;
    }
}

/**
 * Get the record data from SMART for the given record id
 * @param workingUrl URL endpoint
 * @param dashboardId dashboard id
 * @param recordIdFieldName field name for record_id
 * @param recordId the id of the record
 * @params queryParams fetch GET body from config
 */
export async function getRecordDataFromDashboardData(
    workingUrl: string,
    dashboardId: string,
    recordIdFieldName: string,
    recordId: string,
    queryParams: any
): Promise<string[] | undefined> {
    try {
        const dashboardMaps = await getSmartDashboardSystemMap(workingUrl, queryParams);
        if (dashboardMaps && dashboardMaps.has(dashboardId)) {
            const systemsArray = dashboardMaps.get(dashboardId);

            if (systemsArray && systemsArray.length > 0) {
                //try to find a data set that belongs to the group or is the group
                const system = systemsArray.find((data) => data[recordIdFieldName] === recordId);
                if (system) {
                    return system;
                }
            }
        }
        return undefined;
    } catch (e) {
        LogHelper.log(e);
        return undefined;
    }
}

/**
 * Assemble a JS Map<string, any[]> from  parsing smart_search results
 * @param workingUrl URL endpoint
 * @param queryParam fetch GET body from config
 */
export async function getSmartDashboardSystemMap(
    workingUrl: string,
    queryParams: any
): Promise<Map<string, any[]> | undefined> {
    let smartMap: Map<string, any[]> | undefined = undefined;
    try {
        const jsonData = await getJSONFromRestEndpoint(workingUrl, queryParams);

        if (jsonData) {
            smartMap = parseSmartJson(jsonData);
        }
        return smartMap;
    } catch (e) {
        LogHelper.log(e);
        return smartMap;
    }
}

/**
 *
 * @param groupId id of the group
 * @param existingDashboardMap JS Map<string, any[]>, see getSmartDashboardSystemMap(...)
 * @param getPostBody fetch GET body from config
 * @param workingUrl URL endpoint
 */
export async function findAllSystemsInGroup(
    groupId: string,
    fetchGetBody: any,
    existingDashboardMap?: Map<string, any[]>,
    workingUrl = ''
): Promise<any[] | undefined> {
    const systems: any[] = [];
    let smartMap: Map<string, any[]> | undefined = existingDashboardMap;
    try {
        if (!smartMap && workingUrl && workingUrl.trim() !== '') {
            smartMap = await getSmartDashboardSystemMap(workingUrl, fetchGetBody);
        }
        if (smartMap) {
            smartMap.forEach((value, key) => {
                LogHelper.log(`key: ${key}`);
                value.forEach((system) => {
                    if (system.group_id && system.group_id.trim() === groupId.trim()) {
                        systems.push(system); //system in the group
                    } else if (system.guid && system.guid.trim() === groupId.trim()) {
                        systems.push(system); //group
                    }
                });
            });
        } else {
            throw new Error('Invalid data passed to function. Method requires either a URL.');
        }
    } catch (e) {
        LogHelper.log(e);
        return undefined;
    }
}

/**
 *
 * @param urlToSmartSearch URL endpoint
 * @param dashboardId dashboard id
 * @param groupId group or system id
 * @param groupIdFieldName field name for group_id
 * @param systemIdFieldName field name for system_id
 * @param queryParams the fetch body parameters
 */
export async function getSystemIdFromDashboardData(
    urlToSmartSearch: string,
    dashboardId: string,
    groupId: string,
    groupIdFieldName: string,
    systemIdFieldName: string,
    queryParams: any
): Promise<string | undefined> {
    let systemId = '';
    try {
        const jsonObj = await getJSONFromRestEndpoint(urlToSmartSearch, queryParams);
        const dashboardMaps = parseSmartJson(jsonObj);
        if (dashboardMaps && dashboardMaps.has(dashboardId)) {
            const systemsArray = dashboardMaps.get(dashboardId);

            if (systemsArray && systemsArray.length > 0) {
                //try to find a data set that belongs to the group or is the group
                let system = systemsArray.find(
                    (data) => data[groupIdFieldName] === groupId || data['guid'] === groupId
                );
                if (!system) {
                    system = systemsArray[0]; //no match to group id so take the first item in the dashboard
                }
                for (const val in system) {
                    if (val === systemIdFieldName) {
                        systemId = system[val]; //return the value for the system_id field
                        break;
                    }
                }
            }
        }
        return systemId;
    } catch (e) {
        LogHelper.log(e);
        return undefined;
    }
}

/**
 * Get all the system objects in a given dashboard
 * @param smartToSearchUrl URL endpoint
 * @param dashboardId dashboard id
 * @param dashboardIdFieldName name of the SMART field containing the dashboard id
 * @param recordActive is this record active - all sample queries in SMART set this to false
 * @param recordActiveFieldName a config.json value for the SMART field name for record active
 * @param queryParams the fetch body parameters - a custom fetch GET defined in the config json - used for
 * cases where a standard fetch GET is failing because of some missing needed parameter.
 */
export async function getAllSystemsFromDashboardData(
    urlToSmartSearch: string,
    dashboardId: string | undefined,
    dashboardIdFieldName: string,
    recordActive: boolean,
    recordActiveFieldName: string,
    queryParams: any
): Promise<any[]> {
    const items: any[] = [];
    const pos = urlToSmartSearch.indexOf('?');
    let workingUrl = urlToSmartSearch;
    if (pos === -1 && dashboardId) {
        workingUrl = `${urlToSmartSearch}?${dashboardIdFieldName}=${dashboardId}&${recordActiveFieldName}=${recordActive}`;
    }
    try {
        const jsonObj = await getJSONFromRestEndpoint(workingUrl, queryParams);
        if (jsonObj) {
            const systemsMap = parseSmartJson(jsonObj);
            const sysKeys = Array.from(systemsMap.keys());
            sysKeys.forEach((key) => {
                if (key !== dashboardId) {
                    return;
                }
                const vals = systemsMap.get(key);
                vals?.forEach((val) => {
                    items.push(val);
                });
            });
            return items;
        }
        LogHelper.log('No dashboards were found at: ' + workingUrl);
        return items;
    } catch (e) {
        LogHelper.log(e);
        return [];
    }
}

/**
 * Get all the dashboard ids returned in the GET call to smart_search
 * @param smartSearchUrl URL endpoint
 * @param fetchGetBody fetch GET body from config
 */
export async function getAllDashboardIds(smartSearchUrl: string, fetchGetBody: any): Promise<string[]> {
    let smartDashboardIds: string[] = [];
    try {
        const jsonObj = await getJSONFromRestEndpoint(smartSearchUrl, fetchGetBody);
        if (jsonObj) {
            const systemsMap = parseSmartJson(jsonObj);
            if (systemsMap) {
                smartDashboardIds = Array.from(systemsMap.keys());
            }
        }
        return smartDashboardIds;
    } catch (e) {
        LogHelper.log(e);
        return []; //all or empty
    }
}

/**
 * Get all the SMART fields listed in the system section of the dashboard data
 * @param smartSearchUrl url endpoint
 * @param dashboardId dashboard id
 * @param queryParams the fetch body parameters
 */
export async function getDashboardSmartFields(
    smartSearchUrl: string,
    dashboardId: string,
    queryParams: any
): Promise<string[]> {
    const smartFields: string[] = [];
    try {
        const jsonObj = await getJSONFromRestEndpoint(smartSearchUrl, queryParams);
        if (jsonObj) {
            const systemsMap = parseSmartJson(jsonObj);
            if (systemsMap && systemsMap.has(dashboardId)) {
                //dashboardId -> sytems[]
                const systemsArray = systemsMap.get(dashboardId);
                if (systemsArray && systemsArray.length > 0) {
                    const system = systemsArray[0];
                    for (const field in system) {
                        smartFields.push(field);
                    }
                }
            }
        }
        return smartFields;
    } catch (e) {
        LogHelper.log(e);
        return []; //all or empty
    }
}

/**
 * Parse the json returned from doing a GET on smart_search.
 * @param jsonObj json that we obtained from a GET to ...smart_search endpoint
 */
export function parseSmartJson(jsonObj: any): Map<string, any[]> {
    const dashboardMappings = new Map<string, any[]>();
    try {
        for (const result in jsonObj) {
            const resultObj = jsonObj[result];
            console.log(resultObj);

            for (const dashboardKey in resultObj) {
                console.log(dashboardKey);
                const dashboardObj = resultObj[dashboardKey];
                console.log(dashboardObj);
                for (const id in dashboardObj) {
                    const systems: any[] = dashboardObj[id];
                    dashboardMappings.set(id, systems);
                }
            }
        }
        return dashboardMappings;
    } catch (e) {
        LogHelper.log('No data was returned due to the following error: ' + e);
        return new Map<string, any[]>(); //all or nothing
    }
}

/**
 * This allow post based on config value settings. If we need to try various options to get the fetch to work
 * we can set them in the config and get them executed at runtime.
 * @param postUrl url endpoint
 * @param urlEncodedBodyParams body key-value pairs for the post URL encoded
 * @param postParams additional values like content-type and whatever fetch params may be needed
 */
export async function fetchPost(
    postUrl: string,
    urlEncodedBodyParams: any,
    postParams: any
): Promise<{ response: Response | any; success: boolean } | undefined> {
    const postParamsIsEmpty = postParams ? Object.keys(postParams).length === 0 : true;
    console.debug('postParams ' + postParams ? JSON.stringify(postParams) : '');
    try {
        const postResponse = await fetch(postUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8;' },
            body: urlEncodedBodyParams,
        }).catch((error) => {
            LogHelper.log(`Error making post request to  ${postUrl}. Message: ${error}`);
            if (postParamsIsEmpty) {
                throw new Error('Error making post to ' + postUrl);
            }
        });

        if (postResponse && postResponse.status !== 200 && postParamsIsEmpty) {
            const message = `Error making post request to ${postUrl}. Status: ${postResponse.status}`;
            LogHelper.log(message, true);
            LogHelper.log(`More error details...Post error calling ${postUrl} with payload: ${urlEncodedBodyParams}`);
            throw new Error('SMART update response status ' + postResponse.status);
        }

        if (postResponse && postResponse.ok) {
            const response = await postResponse.json(); //TBD what is the shape of the return object if any
            return {
                response: response,
                success: true,
            };
        } else if(postParams && postParams.method === "POST") {
            const postResponse2 = await fetch(postUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8;' },
                mode:'cors',
                body: urlEncodedBodyParams,
            }).catch((error) => {
                LogHelper.log(`Error making post request to  ${postUrl}. Message: ${error}`);
                if (postParamsIsEmpty) {
                    throw new Error('Error making post to ' + postUrl);
                }
            });
            if (postResponse2 && postResponse2.ok) {
                const response = await postResponse2.json(); //TBD what is the shape of the return object if any
                return {
                    response: response,
                    success: true,
                }
            }else{
                throw new Error('SMART post using config failed');
            }
        }
    } catch (e) {
        LogHelper.log(e);
        return undefined;
    }
}

/**
 * This allow post based on config value settings. If we need to try various options to get the fetch to work
 * we can set them in the config and get them executed at runtime.
 * @param postUrl url endpoint
 * @param bodyParams body key-value pairs for the post
 * @param postParams additional values like content-type and whatever fetch params may be needed
 */
async function getJsonViaPostWithConfigParams(
    postUrl: any,
    bodyParams: any,
    postParams: any
): Promise<{ response: Response; success: boolean } | undefined> {
    try {
        postParams.body = bodyParams;
        LogHelper.log('postParams: ' + postParams ? JSON.stringify(postParams) : '');
        const postResponse = await fetch(postUrl, postParams).catch((error) => {
            LogHelper.log(`Error making post request to  ${postUrl}. Message: ${error}`);
            throw new Error('Error making post to ' + postUrl);
        });

        if (postResponse && postResponse.status !== 200) {
            const message = `Error making post request to ${postUrl}. Status: ${postResponse.status}`;
            LogHelper.log(message, true);
            LogHelper.log(
                `More error details...Post error calling ${postUrl} with payload: ${JSON.stringify(bodyParams)}`
            );
            throw new Error('SMART update response status ' + postResponse.status);
        }

        if (postResponse && postResponse.ok) {
            const response = await postResponse.json(); //TBD what is the shape of the return object if any
            return {
                response: response,
                success: true,
            };
        } else {
            throw new Error('Post to SMART using config failed.');
        }
    } catch (e) {
        LogHelper.log(e);
        return undefined;
    }
}
