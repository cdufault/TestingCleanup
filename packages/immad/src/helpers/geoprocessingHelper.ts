import esriConfig from '@arcgis/core/config';
import Request from '@arcgis/core/request';
import PortalItem from '@arcgis/core/portal/PortalItem';
import { LogHelper } from './logHelper';
import { InputFormItemType } from '../components/analyticCatalog/resources';

async function isServiceNameAvailable(name: string, type: string): Promise<boolean> {
    const response = await Request(`${esriConfig.portalUrl}/sharing/rest/portals/self/isServiceNameAvailable?f=json`, {
        query: {
            name,
            type,
        },
        authMode: 'auto',
    });

    return response.data.available;
}
/**
 * @param portal item of type "Geoprocessing Service"
 * @returns list of task names for the input item or undefined
 */
async function getServiceTasks(item: PortalItem): Promise<string[] | undefined> {
    if (item.type != 'Geoprocessing Service') {
        LogHelper.log('Cannot get tasks for service type: ' + item.type, true);
        return undefined;
    }
    //get the gp service description
    const response = await Request(item.url, {
        query: {
            f: 'json',
        },
        responseType: 'json',
    });

    if (response && response.data && response.data.tasks) {
        return response.data.tasks;
    } else {
        return undefined;
    }
}

/**
 *
 * @param url url to task's rest endpoint
 * @returns list of input parameters for the task
 */
async function getTaskParameters(url: string): Promise<InputFormItemType[] | undefined> {
    //validate incoming url
    if (!url) {
        LogHelper.log('Error querying task input parameters, task url is blank or undefined', true);
        return undefined;
    }

    //get the parameters for the service
    const response = await Request(url, {
        query: {
            f: 'json',
        },
        responseType: 'json',
    });

    if (response && response.data && response.data.parameters) {
        return response.data.parameters as InputFormItemType[];
    } else {
        return undefined;
    }
}

export { isServiceNameAvailable, getServiceTasks, getTaskParameters };
