import Request from '@arcgis/core/request';
import EsriConfig from '@arcgis/core/config';
import { ConfigHelper } from './configHelper';

export interface ContentCategories {
    categorySchema: any[];
}

export interface ContentCategory {
    title: string;
    categories: ContentCategory[];
}

export interface CategoryAggregations {
    count: number;
    value: string;
}

export interface SymbolGroups {
    groupName: string;
    groupId: number;
}

/**
 * Gets the list of category content from portal.
 */
export async function getCategoryContent(): Promise<ContentCategories | undefined> {
    const appConfig = await ConfigHelper.loadAppConfig();

    const inputParams = {
        f: 'json',
    };

    const requestParams = {
        query: inputParams,
        method: 'post',
        authMode: 'auto',
    } as __esri.RequestOptions;

    const response = await Request(
        `${EsriConfig.portalUrl}/sharing/rest/portals/${appConfig.portalConfigItemId}/categorySchema`,
        requestParams
    );

    return response.data ? response.data : undefined;
}

/**
 * Get the category counts
 * @param showOnlyGateMissions set to true to only view GATE missions
 * @param typeKeywords app config typekeyword to search for
 * @param isScenes is optional that defaults to false will return categories that apply to scenes not missions
 * @param isMaps is optional that defaults to false will return categories that apply to maps not missions
 */
export async function getCategoryCounts(
    showOnlyGateMissions = false,
    typeKeywords = '',
    isScenes = false,
    isMaps = false
): Promise<CategoryAggregations[]> {
    const appConfig = ConfigHelper.getAppConfig();
    let aggregations: CategoryAggregations[] = [];

    let query = '';
    if (showOnlyGateMissions) {
        query = `(
            (
                type:"${appConfig.types.webMappingApplication}" typekeywords:"${typeKeywords}"
            )
        OR (
                type:"${appConfig.types.application}" typekeywords:"${typeKeywords}"
            )
        )`;
    } else if (typeKeywords && typeKeywords.trim() === appConfig.typekeywords.immadExercise) {
        query = `(  
            (
                    type:"${appConfig.types.application}" typekeywords:"${typeKeywords}"
            )
        )`;
    } else if (isScenes) {
        query = `(type:"Web Scene")`;
    } else if (isMaps) {
        query = `(type:"Web Map")`;
    } else {
        query = `(
            (
                type:"${appConfig.types.webMappingApplication}" tags:"${appConfig.tags.application}"
            )
            OR (
                    type:"${appConfig.types.application}" typekeywords:"${appConfig.typekeywords.immadMission}"
            )
            OR (
                type:"${appConfig.types.application}" typekeywords:"${appConfig.typekeywords.gateMission}"
            )
        )`;
    }

    const inputParams = {
        q: query,
        countFields: 'categories',
        f: 'json',
        countSize: 200,
    };

    const requestParams = {
        query: inputParams,
        method: 'post',
        authMode: 'auto',
        num: 100,
    } as __esri.RequestOptions;

    const response = await Request(`${EsriConfig.portalUrl}/sharing/rest/search`, requestParams);

    if (response.data.aggregations.counts.length) {
        aggregations = [...response.data.aggregations.counts[0].fieldValues];
    }

    return aggregations;
}
