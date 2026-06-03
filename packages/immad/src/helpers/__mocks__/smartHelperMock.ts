/**A mock SMART record */
const json = {
    record_data_source: 'mock-test-data-in-module',
    audit_date: '2021-10-25T13:35:25.727847',
    comments: 'test',
    comments_classification: 'UNCLASSIFIED',
    dashboard_cycle: 'winter',
    dashboard_grouping_code: 'BM',
    dashboard_id: 'Booms 1.0-import-import_6f9782f6-9044-430f-bf9e-55df482ec181',
    exercise: 'false',
    group_id: '02aef14b4fc249459f04a10e99504bb1d42547ed95f447be8170a3020cdbe266',
    guid: '8f868a9c0b3a467eadc6f74cf708303eb3e22a9a953546ffb1a5faf2963b509c',
    last_updated_by: 'NOT SSL USER',
    record_active: 'yes',
    record_active_classification: 'UNCLASSIFIED',
    record_activity: 'patrol',
    record_activity_classification: 'UNCLASSIFIED',
    record_armed: 'no',
    record_armed_classification: 'UNCLASSIFIED',
    record_delivery_system: 'no',
    record_delivery_system_classification: 'UNCLASSIFIED',
    record_event_date: '2021-10-19T13:34:51.864000+00:00',
    record_event_date_classification: 'UNCLASSIFIED',
    record_found: 'no',
    record_found_classification: 'UNCLASSIFIED',
    record_id: '0321BM_f508f66a-ba35-4e8e-b9d9-871996910b74',
    record_location_benumber: 1,
    record_location_benumber_classification: 'UNCLASSIFIED',
    record_location_catcode: '86753',
    record_location_catcode_classification: 'UNCLASSIFIED',
    record_location_category: '',
    record_location_elevation: 0,
    record_location_elevation_classification: 'UNCLASSIFIED',
    record_location_latitude: '000000N',
    record_location_latitude_classification: 'UNCLASSIFIED',
    record_location_latitude_degrees: 0.0,
    record_location_longitude: '0000000E',
    record_location_longitude_classification: 'UNCLASSIFIED',
    record_location_longitude_degrees: 0.0,
    record_location_name: 'loc1',
    record_location_name_classification: 'UNCLASSIFIED',
    record_location_orient: 1,
    record_location_orient_classification: 'UNCLASSIFIED',
    record_location_osuffix: 'DD001',
    record_location_osuffix_classification: 'UNCLASSIFIED',
    record_location_radius: 1,
    record_location_radius_classification: 'UNCLASSIFIED',
    record_location_semi_major: 0.05,
    record_location_semi_major_classification: 'UNCLASSIFIED',
    record_location_semi_minor: 0.02,
    record_location_semi_minor_classification: 'UNCLASSIFIED',
    record_maintenance: 'helicopter',
    record_maintenance_classification: 'UNCLASSIFIED',
    record_operational: 'yes',
    record_operational_classification: 'UNCLASSIFIED',
    record_path: 'Reg 1/Div 1/Holster 1/Gun/.45',
    record_series: '0321BM',
    record_source_date: '2021-10-19T13:34:51.873000+00:00',
    record_source_date_classification: 'UNCLASSIFIED',
    record_state: 'update',
    record_static_id: 'AAAde7e128a8e7049bfadcc79efc632a2c4',
    record_status: 'on-duty',
    record_status_classification: 'UNCLASSIFIED',
    record_status_from: 'observation',
    record_status_from_classification: 'UNCLASSIFIED',
    record_type: 'system',
    record_version: 31,
    system_id: 'bfdfb92b-2992-4b87-b517-d9915334d3ef',
    timeout_level: 0,
    tracking_id: '0321BM0014',
    update_date: '2021-10-25T13:35:25.812716',
};

/**Mock async function to simulate getting data from a rest endpoint using a fetch call */
export async function fetchFromRestEndpoint1(workingUrl: string): Promise<any | undefined> {
    const jsonData: any = undefined;
    try {
        return await 'harry';
    } catch (e) {
        return undefined;
    }
}

/**Mock async function to simulate getting data from a rest endpoint using a fetch call */
export async function getJSONFromRestEndpointMock(workingUrl: string, fetchGetBody: any): Promise<any | undefined> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            json
                ? resolve(json)
                : reject({
                      error: 'Failed to retrieve JSON data from rest endpoint',
                  });
        }, 3000);
    });
}
