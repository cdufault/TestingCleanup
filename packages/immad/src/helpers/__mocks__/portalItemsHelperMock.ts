import { IItem, ISearchResult, IUpdateItemResponse } from '@esri/arcgis-rest-portal';

/**Mock data for IItem */
export const ItemResponse: IItem = {
    id: '4bc',
    owner: 'jeffvader',
    title: 'DS Plans',
    description: 'The plans',
    snippet: 'Yeah these are the ones',
    tags: ['plans', 'star dust'],
    type: 'Web Map',
    typeKeywords: ['Javascript', 'hubSiteApplication'],
    properties: {
        parentId: '3eb',
    },
    created: 123,
    modified: 456,
    size: 123,
    numViews: 1337,
    protected: false,
};

/**Mock data for an ISearchResult */
export const SearchResponse: ISearchResult<IItem> = {
    query: '',
    total: 10795,
    start: 1,
    num: 1,
    nextStart: -1,
    results: [
        {
            id: 'a5b',
            owner: 'dcadminqa',
            created: 1496748288000,
            modified: 1508856526000,
            name: 'survey123_7d7a9fabcb0c44bcaf1d6473cd088a07',
            title: ' Drug Activity Reporter',
            type: 'Feature Service',
            typeKeywords: [
                'ArcGIS Server',
                'Data',
                'Feature Access',
                'Feature Service',
                'OwnerView',
                'Service',
                'Survey123',
                'Survey123 Hub',
                'Hosted Service',
            ],
            description: 'Some Description',
            tags: [],
            snippet: 'Some Snippet',
            thumbnail: 'thumbnail/ago_downloaded.png',
            documentation: 'WAT docs',
            extent: [
                [-180, -90],
                [180, 90],
            ],
            categories: [],
            spatialReference: null,
            accessInformation: null,
            licenseInfo: null,
            culture: null,
            properties: {},
            url: 'https://servicesqa.arcgis.com/97KLIFOSt5CxbiRI/arcgis/rest/services/survey123_7d7a9fabcb0c44bcaf1d6473cd088a07/FeatureServer',
            proxyFilter: null,
            access: 'shared',
            size: -1,
            appCategories: [],
            industries: [],
            languages: [],
            largeThumbnail: null,
            banner: null,
            screenshots: [],
            listed: false,
            numComments: 0,
            numRatings: 0,
            avgRating: 0,
            numViews: 4,
        },
    ],
};

/**Mock async function for doing an update to a Portal web app */
export async function updatePortalWebAppMock(itemId: string, itemParams: string): Promise<IUpdateItemResponse> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            itemId
                ? resolve({
                      id: itemId,
                      success: true,
                  })
                : reject({
                      id: undefined,
                      success: false,
                  });
        }, 3000);
    });
}

/**A async mock fucntion for finding a portal item by id */
export async function findPortalItemByIdMock(itemId: string): Promise<IItem | undefined> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            itemId ? resolve(ItemResponse) : reject(undefined);
        }, 3000);
    });
}

/**A async mock function for finding portal items by type */
export async function findPortalItemsByTypeMock(
    itemType: string,
    searchField = 'owner',
    searchValue = '*',
    num = 1000
): Promise<ISearchResult<IItem> | undefined> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            itemType ? resolve(SearchResponse) : reject(undefined);
        }, 3000);
    });
}

/* export async function getUserSessionMock(){
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('user session');
        }, 3000);
    });
} */

/**A mock async function for getting the URL to a local portal */
export async function getPortalRestUrlMock() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('foobar.com');
        }, 3000);
    });
}
