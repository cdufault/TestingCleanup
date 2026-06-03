import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { IItem, ISearchResult } from '@esri/arcgis-rest-portal';
import {
    findAPortalItemById,
    findPortalItemsByType,
    GetAllVisibleRegions,
    IRegionSummary,
    Logger,
    QueryAnalystCommentsForRegionSummaryLib,
    queryGateCategoriesFClassLib,
    regionQueryResult,
} from '@stratcom/lib-functions';
import { IRegionCard, IRegionCardRow } from './landingPageSlice';
import Layer from '@arcgis/core/layers/Layer';

export interface categoryQueryResult {
    /**region guid -- identifier from the associated region feature class */
    region_guid: string;

    /**category name/label */
    category: string;

    /**category level */
    category_level: string;

    /**category confidence/Expectation as defined by analyst */
    category_confidence: string;

    /**analyst comment */
    comment: string;

    /**global id value in the categories that represents the Primary key in Regions - quasi foreign key*/
    guid: string;
}

/**
 * Query the regions Feature Class to get values for the landing page
 * @param portalItemId flayer portal item id to query
 */
export async function queryRegions(portalItemId: string): Promise<regionQueryResult[]> {
    return Layer.fromPortalItem(<__esri.LayerFromPortalItemParams>{
        portalItem: {
            id: portalItemId,
        },
    }).then((layer) => {
        return GetAllVisibleRegions(layer as FeatureLayer);
    });
}

/**
 * Retrieve the region summary data from the Analyst comments flayer
 * @param portalItemId flayer portal item id
 * @param globalId unique identifier for the region data row in the Regions feature class
 */
export async function queryRegionSummary(portalItemId: string, globalId: string): Promise<IRegionSummary | undefined> {
    let response: string | undefined = undefined;
    const fLayer = new FeatureLayer({
        portalItem: {
            id: portalItemId,
        },
    });
    await fLayer
        .load()
        .then(async (r) => {
            response = await QueryAnalystCommentsForRegionSummaryLib(fLayer, globalId);
            return response;
        })
        .catch((error) => {
            Logger.log(
                'Error retrieving region summary from analyst comments ftr layer: ' + portalItemId,
                'ERROR',
                error
            );
            return response;
        });
    return response;
}

/**
 * Find the most recently updated categories entries for a mission/region
 * @param portalItemId categories feature layer portal item id
 * @param region_guid maps to the unique identifier on the regions feature class -- guid
 * @param portalUrl portal URL
 * @param gateTypeKeywords keywords for the mission group
 * @param regionName name of the mission/group
 * @param oauthAppId
 */
export async function queryCategories(
    portalItemId: string,
    region_guid: string,
    portalUrl: string = '',
    gateTypeKeywords: string,
    regionName: string,
    oauthAppId: string
): Promise<categoryQueryResult[]> {
    const fLayer = new FeatureLayer({
        portalItem: {
            id: portalItemId,
        },
    });
    return await queryGateCategoriesFClassLib(fLayer, region_guid, portalUrl, gateTypeKeywords, regionName, oauthAppId);
}

/**
 * Find Gate web app
 * @param itemType type of item to search for ie 'Application'
 * @param portalUrl portal URL
 * @param searchValue value to search for
 * @param oauthAppId
 */
export async function findGateWebMapApp(
    itemType: string,
    portalUrl: string,
    searchValue: string,
    oauthAppId: string
): Promise<ISearchResult<IItem> | undefined> {
    const apps = await findPortalItemsByType(itemType, portalUrl, oauthAppId, 'typekeywords', searchValue);
    Logger.log("Search term 'GATE MOCK WJ_App' returned the following: ", 'INFO', apps);
    return apps;
}

/**
 * Find the Gate web app
 * @param appId GATE portal item application id
 * @param portalUrl portal UR
 * @param oauthAppId oauth id
 */
export async function findGateWebApp(appId: string, portalUrl: string, oauthAppId: string): Promise<IItem | undefined> {
    const item = await findAPortalItemById(appId, portalUrl, oauthAppId);
    console.debug(`Searching for GATE applicaiton using id ${appId} returned the following: `, item);
    return item;
}

/**
 * Compare two region card rows alphabetically by category
 * @param itemA region card A
 * @param itemB region card B
 */
export function sortLandingPageItemRow(itemA: IRegionCardRow, itemB: IRegionCardRow) {
    if (itemA && itemB) {
        if (itemA.category > itemB.category) {
            return 1;
        }
        if (itemA.category < itemB.category) {
            return -1;
        }
    }
    return 0;
}

/**
 * Compare two region cards alphabetically by region name
 * @param itemA region card A
 * @param itemB region card B
 */
export function sortLandingPageItems(itemA: IRegionCard, itemB: IRegionCard) {
    if (itemA && itemB) {
        if (itemA.regionName > itemB.regionName) {
            return 1;
        }
        if (itemA.regionName < itemB.regionName) {
            return -1;
        }
    }
    return 0;
}

/**
 * Compare two activity cards (IRegionCardRow) by amount of content and then alphabetically in case of a tie
 * @param itemA activity card A
 * @param itemB activity card B
 */
export function sortLandingPageItemRowPosition(itemA: IRegionCardRow, itemB: IRegionCardRow) {
    /*  We decided that the attribute positionOnCard is not needed here and we can sort
        in a way to eliminate as much whitespace as possible 
    
        Ended up sorting by the length of catComments because it's the simpliest best solution 
        I could come up with that works pretty well in conjunction with with CSS Columns. 
        Not a perfect solution since comments can have different fonts and sizes but generally
        it seems to work pretty well. It sounds like they generally just use the default font and size
        so this shouldn't really cause any issues
    */

    if (itemA && itemB) {
        let val = 0;
        if (itemA.catComments && itemB.catComments) {
            if (itemA.catComments.length === itemB.catComments.length) {
                return sortLandingPageItemRow(itemA, itemB);
            }
            val = itemA.catComments.length > itemB.catComments.length ? 1 : -1;
            return val;
        } else if (itemA.catComments) {
            return 1;
        } else if (itemB.catComments) {
            return -1;
        } else {
            return sortLandingPageItemRow(itemA, itemB);
        }
    }
    return 0;
}

/**
 * Compare two region cards by position/priority and then alphabetically in case of a tie
 * @param itemA region card A
 * @param itemB region card B
 */
export function sortLandingPageItemPosition(itemA: IRegionCard, itemB: IRegionCard) {
    /*  
        Note: The sort order determined by this function will change the order 
        regions appear in during presentation mode.

        In a future version of IMMAD, users will specify which column (left or right)
        each region card should be in on the landing page. 
        When that happens, this function may need to change
        slightly to account for that as the attribute positionOnPage may be in a different 
        format. (eg. data may come back as strings like '1L','1R','3L','99R', etc 
        instead of pure numbers)
        We may need to sort by priority and then sort by L/R instead of alphabetically depending
        on what order we decided they should appear in presentation mode.
    */
    if (itemA && itemB) {
        let val = 0;
        if (itemA.positionOnPage && itemB.positionOnPage) {
            if (itemA.positionOnPage === itemB.positionOnPage) {
                return sortLandingPageItems(itemA, itemB);
            }
            val = itemA.positionOnPage > itemB.positionOnPage ? 1 : -1;
            return val;
        } else if (itemA.positionOnPage) {
            return 1;
        } else if (itemB.positionOnPage) {
            return -1;
        } else {
            return sortLandingPageItems(itemA, itemB);
        }
    }
    return 0;
}
