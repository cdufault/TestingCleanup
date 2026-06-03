import {
    ItemResponse,
    findPortalItemsByTypeMock,
    updatePortalWebAppMock,
    getPortalRestUrlMock,
} from './__mocks__/portalItemsHelperMock';

import { updatePortalWebApp, findPortalItemById, findPortalItems } from './portalItemsHelper';

/**
 * Mocking calls to ArcGIS Rest API
 */
jest.mock('@esri/arcgis-rest-portal', () => ({
    __esModule: true,
    searchItems: () => 'getJSONFromRestEndpoint',
    getItem: () => 'getItemMock',
}));

/**
 * Mocking helper methods with defined outputs being the result of a mock method or specific output
 */
jest.mock('./portalItemsHelper', () => ({
    __esModule: true,
    findPortalItemById: () => ItemResponse,
    findPortalItemByType: findPortalItemsByTypeMock,
    updatePortalWebApp: updatePortalWebAppMock,
    getUserSession: () => 'user session',
    getPortalRestUrl: getPortalRestUrlMock,
    findPortalItems: () => {
        return [
            {
                id: '4bc',
                owner: 'jeffvader',
                title: 'DS Plans',
                description: 'The plans',
                snippet: 'Yeah these are the ones',
            },
        ];
    },
}));

describe('PortalItemsHelper.updatePortalWebApp', () => {
    test('Values and size should match JSON return values', async () => {
        const result = await updatePortalWebApp('fooId', 'bar');
        expect(result).toStrictEqual({
            //from a simple mock -- proof of concept
            id: 'fooId',
            success: true,
        });
        expect(result.id).toBe('fooId');
    });
});

describe('PortalItemsHelper.findPortalItemById', () => {
    test('Value should match JSON return values', async () => {
        const result = await findPortalItemById('id');
        //expect(data).toBe('getJSONFromRestEndpoint');
        expect(result.id).not.toMatch('4bcd');
        expect(result.id).toMatch('4bc');
        expect(result.id).toContain('b');
    });
});

describe('PortalItemsHelper.findPortalItemsByType', () => {
    test('Values and size should match JSON return values', async () => {
        const result = await findPortalItems('searchTerm', 'searchField');
        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].id).toBe('4bc');
    });
});
