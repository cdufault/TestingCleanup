import { IItem, IGroup, IUser } from '@esri/arcgis-rest-portal';

export interface ISearchResult<T extends IItem | IGroup | IUser> {
    query: string; // matches the api's form param
    total: number;
    start: number;
    num: number;
    nextStart: number;
    results: T[];
    nextPage?: () => Promise<ISearchResult<T>>;
    /**
     * Aggregations will only be present on item searches when [`fieldCounts`](https://developers.arcgis.com/rest/users-groups-and-items/search.htm#GUID-1C625F8A-4A12-45BB-B537-74C82315759A) are requested.
     */
    aggregations?: {
        counts: Array<{
            fieldName: string;
            fieldValues: Array<{
                value: any;
                count: number;
            }>;
        }>;
    };
}

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

export const fakeItem = {
    id: '5bc',
    numViews: 38,
    size: 38983,
    created: 99876543,
    modified: 8876543,
    owner: 'dbouwman',
    title: 'my fake item',
    description: 'yep its fake',
    snipped: 'so very fake',
    type: 'Web Mapping Application',
    typeKeywords: ['fake', 'kwds'],
    tags: ['fakey', 'mcfakepants'],
    success: true,
    properties: {
        key: 'somevalue',
    },
    data: {
        values: {
            key: 'value',
        },
    },
};
