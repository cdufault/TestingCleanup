//resource imports
import { GPUserInputParams, TaskParameterDataSource } from '../resources';
import Request from '@arcgis/core/request';
import { getPortalItemById } from '../../../helpers/portalItemsHelper';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';

const addOrUpdateParam = (value: string, inputParams: GPUserInputParams): void => {
    const { inputFormValues, setInputFormValues, param } = inputParams;
    const existing = inputFormValues.find((p) => {
        return p.name === param.name;
    });
    if (existing) {
        existing.value = value;
    } else {
        inputFormValues.push({ name: param.name, value: value });
    }
    //remove any items with a blank value
    const filteredValues = inputFormValues.filter((f) => {
        return f.value;
    });
    setInputFormValues(filteredValues);
};

const getJobResults = async (jobUrl: string, jobId: string, fieldName: string): Promise<any> => {
    const response = await Request(jobUrl + '/jobs/' + jobId + '/results/' + fieldName, {
        query: {
            f: 'json',
        },
        responseType: 'json',
    });
    return response.data;
};

const getDataFromTable = async (dataTable: TaskParameterDataSource): Promise<any[] | undefined> => {
    const portalItem = await getPortalItemById(dataTable.tableItemId);
    if (portalItem) {
        const featureLayer = new FeatureLayer({ portalItem: { id: portalItem.id } });
        const results = await featureLayer.queryFeatures();
        const resultsArray = results.features.map((feat) => {
            return feat.attributes;
        });
        return resultsArray;
    }
};

export { addOrUpdateParam, getJobResults, getDataFromTable };
