/**
 * Data represents SMART system/group entities that are displayed in the update SMART UI data form
 */
export const mockGroupMembersMapData = [
    {
        //is group
        tracking_id: 'group1-trackingId',
        record_id: 'group1-recordId',
        guid: 'group1Guid',
        record_path: 'group1-texas.to.kansas.234',
        system_id: '12345',
        record_version: '23',
        record_type: 'group',
    },
    {
        group_id: 'group1Guid',
        tracking_id: 'group3-trackingId',
        record_id: 'group3-recordId',
        guid: 'group3Guid',
        record_path: 'group3-texas.to.kansas.234',
        system_id: '12345',
        record_version: '23',
        record_type: 'system',
    },
    {
        group_id: 'group1Guid',
        tracking_id: 'group2-trackingId',
        record_id: 'group2-recordId',
        guid: 'group2Guid',
        record_path: 'group2-texas.to.kansas.234',
        system_id: '12345',
        record_version: '23',
        record_type: 'system',
    },

    {
        group_id: 'group4Guid',
        tracking_id: 'group4-trackingId',
        record_id: 'group4-recordId',
        guid: 'group4Guid',
        record_path: 'group4-texas.to.kansas.234',
        system_id: '12345',
        record_version: '23',
        record_type: 'system',
    },
    {
        group_id: 'group4Guid',
        tracking_id: 'group5-trackingId',
        record_id: 'group6-recordId',
        guid: 'group5Guid',
        record_path: 'group5-texas.to.kansas.234',
        system_id: '12345',
        record_version: '23',
        record_type: 'system',
    },
];

/**A partial mocking of a tGrid data row. Only listing those attributes that are relied upon for syncing with SMART */
export const mockTGridRowJson = {
    system_id: '12345',
    record_id: 'group2-recordId',
    record_version: '23',
    record_path: 'group1-texas.to.kansas.234',
    group_id: 'group1Guid',
};

/**A mock of values that come from the app config json file */
export const mockConfigVals = {
    smartFormSystemCheckboxLabelFieldName: 'record_id',
    smartRecordTypeFieldName: 'record_type',
    smartRecordPathFieldName: 'record_path',
    smartRecordVersionFieldName: 'record_version',
    smartGUID: 'guid',
    smartSystemRecordType: 'system',
    smartGroupRecordType: 'group',
    smartGroupIdFieldName: 'group_id',
    smartRecordIdFieldName: 'record_id',
};

/**A mock of system/group data as the value and a sytemId as the key */
export const mockGroupMembersMap: Map<string, any> = new Map<string, any>();
mockGroupMembersMap.set('group1', mockGroupMembersMapData[0]);
mockGroupMembersMap.set('group3Guid', mockGroupMembersMapData[1]);
mockGroupMembersMap.set('currentSystem_recordId', mockGroupMembersMapData[2]);
