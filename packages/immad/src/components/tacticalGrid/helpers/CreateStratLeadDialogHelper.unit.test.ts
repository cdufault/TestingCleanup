import { getJSONFromRestEndpointMock } from '../../../helpers/__mocks__/smartHelperMock';

/**
 * Mocking named and/or default module methods
 * Commented code kept for reference
 */
jest.mock('../../../helpers/smartHelper', () => ({
    //these really are smartHelper methods
    __esModule: true,
    //jest.requireActual('../../../helpers/smartHelper'), //can be used on keep implementations of everything not mocked
    //default: jest.fn().mockImplementation(() => 'mock implementation'), //default export
    getJSONFromRestEndpoint: getJSONFromRestEndpointMock,
    /* getJSONFromRestEndpoint: () => {
        return {
            comments:'test',
            record_data_source:'mock_test_data_in_module'
        }
    }, */
}));

import {
    getFieldValueFromSelectedTacticalGridRow,
    configureAllRelatedSystems,
    buildSystemObjsThatWillDisplayInUpdateForm,
    findAllSystemsInGroup,
    getRecordDataFromSMART,
} from './CreateStratLeadDialogHelper';

import {
    mockTGridRowJson,
    mockGroupMembersMap,
    mockGroupMembersMapData,
    mockConfigVals,
} from './__mocks__/CreateStratLeadDialog_MockData';

describe('CreateStratLeadDialogHelper.getRecordDataFromSMART', () => {
    test('Values and size should match JSON return values', async () => {
        const data = await getRecordDataFromSMART(
            'recordId',
            'json',
            'https://cigt-srv21.esri.tech/smart/get_record.json',
            '',
            {}
        );
        expect(data.comments).toBe('test');
        expect(data.record_data_source).toBe('mock-test-data-in-module');
    });
});

describe('CreateStratLeadDialogHelper.getFieldValueFromSelectedTacticalGridRow', () => {
    test('Value should match JSON values', async () => {
        expect(getFieldValueFromSelectedTacticalGridRow('record_id', mockTGridRowJson)).toEqual('group2-recordId');
        expect(getFieldValueFromSelectedTacticalGridRow('system_id', mockTGridRowJson)).toEqual('12345');
        expect(getFieldValueFromSelectedTacticalGridRow('record_version', mockTGridRowJson)).toEqual('23');
    });
    test('Values not found in the JSON should return undefined', async () => {
        expect(getFieldValueFromSelectedTacticalGridRow('foo', mockTGridRowJson)).toBeUndefined();
        expect(getFieldValueFromSelectedTacticalGridRow('bar', mockTGridRowJson)).toBeUndefined();
        expect(getFieldValueFromSelectedTacticalGridRow('jack', mockTGridRowJson)).toBeUndefined();
    });
});

describe('CreateStratLeadDialogHelper.buildSystemObjsThatWillDisplayInUpdateForm', () => {
    const systemsMap = buildSystemObjsThatWillDisplayInUpdateForm(
        mockGroupMembersMap,
        mockGroupMembersMapData[2],
        mockConfigVals
    );
    let key = Array.from(systemsMap.keys());
    let systemVals = systemsMap.get(key[0]); //only one key

    test('Values and size should match JSON values', async () => {
        expect(key.length).toEqual(1);
        expect(systemVals?.length).toEqual(3);
        expect(key[0].recordId).toEqual('group2-recordId');
    });

    test('Record paths should be unique.', async () => {
        let containDuplicatePathName = false;
        if (systemVals) {
            systemVals.reduce((recordPaths, nextSys) => {
                if (recordPaths.includes(nextSys.recordPath)) {
                    containDuplicatePathName = true;
                }
                recordPaths.push(nextSys.recordPath);
                return recordPaths;
            }, []);
        }
        expect(containDuplicatePathName).toBeFalsy();
    });
});

describe('CreateStratLeadDialog_Library.findAllSystemsInGroup', () => {
    const testSystem = mockGroupMembersMapData[2];
    const systemsMap = findAllSystemsInGroup(mockGroupMembersMapData, testSystem.record_id, testSystem, mockConfigVals);
    let systemIds = Array.from(systemsMap.keys());
    let groupMembers = Array.from(systemsMap.values());

    test('Values and size should match JSON input values', async () => {
        expect(systemIds.length).toEqual(3);
        expect(systemIds.find((key) => key === testSystem.record_id)).toBeTruthy();
        expect(groupMembers.length).toEqual(3);
    });
});

describe('CreateStratLeadDialog_Library.configureAllRelatedSystems', () => {
    const testSystem = mockGroupMembersMapData[1];
    const systemsMap = configureAllRelatedSystems(
        testSystem.record_id,
        mockGroupMembersMapData,
        'record_id',
        mockConfigVals
    );
    let systemId = Array.from(systemsMap.keys());
    let groupMembers = systemsMap.get(systemId[0]);

    test('Values and size should match JSON input values', async () => {
        expect(systemId.length).toEqual(1);
        expect(systemId[0].recordId === testSystem.record_id).toBeTruthy();
        if (groupMembers) {
            expect(groupMembers.length).toEqual(3);
        }
    });
});
