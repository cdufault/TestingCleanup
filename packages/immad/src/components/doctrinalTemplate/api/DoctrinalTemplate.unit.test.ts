/**
 * This set of tests prototypes test that call the ArcGIS Rest API
 */
import DoctrinalTemplate from './DoctrinalTemplate';
import { DataSource } from './DataSources';
//import { getUniqueDataSourcesForRules } from '../helpers/dataSourceHelper';
import 'jest-canvas-mock';

describe('Test Doctrinal Template', () => {
    test('Data sources', async () => {
        const docTemp = new DoctrinalTemplate();
        const ds1 = new DataSource();
        ds1.alias = 'Data Source 1';

        const ds2 = new DataSource();
        ds2.alias = 'Data Source 2';
        const rule = docTemp.createRule(ds1);
        const rule1 = docTemp.createRule(ds2);
        const rule2 = docTemp.createRule(ds2);

        docTemp.rules = [rule, rule1, rule2];

        //const ds = getUniqueDataSourcesForRules(docTemp.rules);

        //expect(ds).not.toEqual([ds2]);
        //expect(ds).toEqual([ds1, ds2]);
    });
});
