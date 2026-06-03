import Portal from '@arcgis/core/portal/Portal';
import { getThePortalRestUrl, DefaultPortal } from '@stratcom/lib-functions';
import { ConfigHelper } from './configHelper';

/**
 * Get the portal at the URL defined in the JSON configuration file.
 * TODO: move the current config to an action JSON file on the hosting server
 */
export async function getDefaultPortal(): Promise<Portal | undefined> {
    const appConfig = await ConfigHelper.loadAppConfig();
    const defaultPortal = await DefaultPortal.getTheDefaultPortal(appConfig ? appConfig.portalUrl : '');
    return defaultPortal;
}

/**
 * Gets the portal rest URL.
 */
export async function getPortalRestUrl(): Promise<string | undefined> {
    const appConfig = await ConfigHelper.loadAppConfig();
    return getThePortalRestUrl(appConfig ? appConfig.portalUrl : '');
}
