/**
 * This set of tests prototypes test that call the ArcGIS Rest API
 */
import { formatQueryValue } from '../../../../helpers/layerFilterHelper';

describe('layerFilterHelper.formatQueryValue', () => {
    test('NUMBERs should be unchanged', async () => {
        expect(formatQueryValue(1, 'NUMBER')).toEqual('1');
        expect(formatQueryValue(1.12345, 'NUMBER')).toEqual('1.12345');
        expect(formatQueryValue('1.12345', 'NUMBER')).toEqual('1.12345');
    });
    test('OTHERs should be unchanged', async () => {
        expect(formatQueryValue('test', 'OTHER')).toEqual('test');
        expect(formatQueryValue(1, 'OTHER')).toEqual('1');
    });
    test('Unquoted STRINGs should be single quoted', async () => {
        expect(formatQueryValue('test', 'STRING')).toEqual("'test'");
    });
    test('STRINGs with single quotes should be escaped with a single quote', async () => {
        expect(formatQueryValue("te'st", 'STRING')).toEqual("'te''st'");
        expect(formatQueryValue("te''st", 'STRING')).toEqual("'te''''st'");
    });
    test('DATEs with DATE fields should be formatted correctly', async () => {
        // expect(formatQueryValue("'test'", 'STRING')).toEqual("''test''");
        expect(formatQueryValue('2012-01-01', 'DATE')).toEqual("DATE '2012-01-01'");
    });
    test('DATEs with TIMESTAMP fields should be formatted correctly', async () => {
        // expect(formatQueryValue("'test'", 'STRING')).toEqual("''test''");
        expect(formatQueryValue('2012-01-01 10:10:10', 'DATE')).toEqual("TIMESTAMP '2012-01-01 10:10:10'");
    });
    test('DATEs with tCURRENT_TIMESTAMP should be unchanged', async () => {
        expect(formatQueryValue('CURRENT_TIMESTAMP', 'DATE')).toEqual('CURRENT_TIMESTAMP');
        expect(formatQueryValue('CURRENT_TIMESTAMP - 1', 'DATE')).toEqual('CURRENT_TIMESTAMP - 1');
        const value = "CURRENT_TIMESTAMP - INTERVAL '12' HOUR";
        expect(formatQueryValue(value, 'DATE')).toEqual(value);
    });
    test('DATEs with CURRENT_DATE should be unchanged', async () => {
        expect(formatQueryValue('CURRENT_DATE', 'DATE')).toEqual('CURRENT_DATE');
        expect(formatQueryValue('CURRENT_DATE - 1', 'DATE')).toEqual('CURRENT_DATE - 1');
    });
});
