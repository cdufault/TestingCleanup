import Portal from '@arcgis/core/portal/Portal';
import PortalGroup from '@arcgis/core/portal/PortalGroup';
import { getDefaultMissionMap } from './mapHelper';
import { findPortalItemById, getPortalItemById, getPortalItemData, updatePortalItem } from './portalItemsHelper';
import Point from '@arcgis/core/geometry/Point';
import Extent from '@arcgis/core/geometry/Extent';
import { LogHelper } from './logHelper';
import { getGroupContentByGroupId } from './portalGroupHelper';

/**
 * Interface for the shape of a tactical grid data mapping mapped to a field for supporting the creation of ellipses
 */
export interface ellipseFieldMapping {
    tacticalGridFieldName: string;
    systemFieldName: string;
    role: string;
    units?: string;
}

/**
 * Find the web mapping application and associated data for a mission/group.
 * Method can be leveraged to find metadata attached to the 'data' object on the application object created with every mission.
 * @param groupId mission group id
 * @returns {string| undefined} returns "3D" or "2D" or undefined.
 */
export async function getWebAppAndData(groupId: string): Promise<any> {
    let metadata = undefined;
    const groupContent = await getGroupContentByGroupId(groupId);
    const webApps = groupContent.filter((content) => content.type === 'Application');
    if (webApps && webApps.length > 0) {
        const webApp = webApps[0];
        const result = await getPortalItemData(webApp.id); //json data
        const dataItem = result as any;
        if (dataItem && dataItem.text) {
            metadata = JSON.parse(dataItem.text);
        } else {
            metadata = dataItem;
        }
        metadata.id = webApp.id;
    } else {
        LogHelper.log('Failed to find the web mapping application for group: ' + groupId, true);
    }
    //metadata.gateMissionType contains either '3D' or '2D' for GATE missions otherwise undefined.
    return metadata;
}

/**
 * Get the view type on the application config object.
 * @param missionId the mission Id
 */
export async function getMissionViewMode(missionId: string): Promise<string | undefined> {
    const result = await getWebAppAndData(missionId);
    if (result) {
        return result.viewMode;
    }
    return result;
}

/**
 * Set the view type on the application config object
 * @param missionId the mission Id
 * @param viewMode the type of view - should be either '2D' or '3D'
 */
export async function setMissionViewMode(missionId: string, viewMode: string): Promise<boolean> {
    const result = await getWebAppAndData(missionId);
    if (result) {
        result.viewMode = viewMode;
        const data = {
            id: result.id,
            text: JSON.stringify(result),
        };
        const obj = await updatePortalItem(data);
        return obj.success;
    }
    return false;
}

/**
 * Determine if a mission is a Gate mission by looking at the metadata on the application object.
 * Returns undefined if it is not otherwise it returns '2D' or '3D' for the GATE map item type.
 * Can be used by the ApplicationStateContainer to load GATE missions now that missionHelper.getDefaultMap(id, mapItemType) takes a type param
 * @param missionId group or mission id
 */
export async function isGateMission(missionId: string): Promise<string | undefined> {
    const result = await getWebAppAndData(missionId);
    if (result) {
        let rtype = result.gateMissionType;
        if (rtype === 'Web Scene' || rtype === 'Web Map') {
            return rtype;
        }
        rtype = result.gateMapType;
        if (rtype === '3D' || rtype === '2D') {
            return rtype;
        }
        return undefined;
    }
    return result;
}

/**
 * Get the tactical grid dashboard id for a given mission id
 * @param missionId the mission id
 */
export async function getMissionTacticalGridDashboardId(missionId: string): Promise<string | undefined> {
    const result = await getWebAppAndData(missionId);
    if (result) {
        if (result.widgets) {
            const widgetJsonObj = JSON.parse(result.widgets);
            const currentGrid = widgetJsonObj.widgets.find((obj: any) => obj.component === 'tacticalGrid');
            if (currentGrid) {
                try {
                    const obj = currentGrid.properties.find((prop: any) => prop.name === 'dashboardId');
                    if (obj) {
                        return obj.value;
                    }
                } catch (e: any) {
                    LogHelper.log(
                        'Error trying to access tactical grid stratlead dashboard id from the JSON on the Application object. Specific error:' +
                            e,
                        true
                    );
                }
            }
        }
    }
    return undefined;
}

/**
 * Get the tactical grid id for a given mission id
 * @param missionId the mission id
 */
export async function getMissionTacticalGridLayerId(missionId: string): Promise<string | undefined> {
    const result = await getWebAppAndData(missionId);
    if (result) {
        if (result.widgets) {
            const widgetJsonObj = JSON.parse(result.widgets);
            const currentGrid = widgetJsonObj.widgets.find((obj: any) => obj.component === 'tacticalGrid');
            if (currentGrid) {
                try {
                    const obj = currentGrid.properties.find((prop) => prop.name === 'layer');
                    if (obj && obj.value && obj.value.id) {
                        //id if it's a portal item id
                        return obj.value.id;
                    } else if (obj && obj.value && obj.value.url) {
                        //url if it's a URL to a feature service
                        return obj.value.url;
                    }
                } catch (e: any) {
                    LogHelper.log(
                        'Error trying to access tactical grid property from the JSON on the Application object. Specific error:' +
                            e,
                        true
                    );
                }
            }
        }
    }
    return undefined;
}

/**
 * Get the tactical grid layer portal item for a given mission id
 * @param missionId the mission id
 */
export async function getMissionTacticalGridLayer(missionId: string): Promise<__esri.PortalItem | undefined> {
    const gridLayerId = await getMissionTacticalGridLayerId(missionId);
    if (gridLayerId) {
        return await getPortalItemById(gridLayerId);
    }
    return undefined;
}

/**
 * Get the tactical grid layer name for a given mission id
 * @param missionId the mission id
 */
export async function getMissionTacticalGridLayerName(missionId: string): Promise<string | undefined> {
    const gridLayer = await getMissionTacticalGridLayer(missionId);
    if (gridLayer) {
        return gridLayer.name;
    }
    return undefined;
}

/**
 * Get the stratlead expiration array, if available, that was defined for the mission.
 * @param missionId mission identifier
 */
export async function getMissionStratleadExpirations(missionId: string): Promise<[] | undefined> {
    const result = await getWebAppAndData(missionId);
    if (result) {
        if (result.widgets) {
            const widgetJsonObj = JSON.parse(result.widgets);
            const currentGrid = widgetJsonObj.widgets.find((obj: any) => obj.component === 'tacticalGrid');
            if (currentGrid) {
                try {
                    const obj = currentGrid.properties.find((prop) => prop.name === 'stratleadExpirations');
                    if (obj) {
                        return obj.value;
                    }
                } catch (e: any) {
                    LogHelper.log(
                        'Error trying to access tactical grid stratlead expirationsproperty from the JSON on the Application object. Specific error:' +
                            e,
                        true
                    );
                }
            }
        }
    }
    return undefined;
}

/**
 * @summary Gets the mission id from the name
 * @param title
 * @returns a string containing the mission's portal id
 */
export async function getMissionIdByTitle(title: string): Promise<string | undefined> {
    const portal = new Portal();
    await portal.load();

    const missionGroups = await portal.queryGroups({
        query: `(${title})`,
    });
    if (missionGroups.results && missionGroups.results.length > 0) {
        const currentMissionGroup: PortalGroup = missionGroups.results.find((x: PortalGroup) => x.title === title);
        if (currentMissionGroup) {
            return currentMissionGroup.id;
        }
    }

    return undefined;
}

/*
 * Returns the tactical grid to smart data mappings if it is defined for the mission otherwise undefined or an empty array.
 * @param missionId the mission id
 */
export async function getMissionTacticalGridFieldMap(missionId: string): Promise<any[] | undefined> {
    const result = await getWebAppAndData(missionId);
    if (result) {
        if (result.widgets) {
            const widgetJsonObj = JSON.parse(result.widgets);
            const currentGrid = widgetJsonObj.widgets.find((obj: any) => obj.component === 'tacticalGrid');
            if (currentGrid) {
                try {
                    const obj = currentGrid.properties.find((prop) => prop.name === 'smartFieldMappings');
                    if (obj) {
                        return obj.value;
                    }
                } catch (e: any) {
                    LogHelper.log(
                        'Error trying to access tactical grid smartFieldMappings property from the JSON on the Application object. Specific error:' +
                            e,
                        true
                    );
                }
            }
        }
    }
    return undefined;

    /* //this is a place holder for getting the field mappings from the mission config --kept around for testing only
    return [
        { tacticalGridFieldName: 'status', systemFieldName: 'record_location_name' },
        { tacticalGridFieldName: 'record_id', systemFieldName: 'record_location_benumber' },
        { tacticalGridFieldName: 'description', systemFieldName: 'record_location_osuffix' },
        { tacticalGridFieldName: 'source', systemFieldName: 'record_location_latitude' },
    ]; */
}

/*
 * Returns the tactical grid to smart data mappings related to generating ellipse geometries - if it is defined
 * for the mission otherwise an empty array.
 * @param missionId the mission id
 */
export async function getMissionTacticalGridFieldMappingsRelatedToEllipses(
    missionId: string
): Promise<Map<string, ellipseFieldMapping>> {
    const tgridMappings: any[] | undefined = await getMissionTacticalGridFieldMap(missionId);
    const map: Map<string, ellipseFieldMapping> = new Map<string, ellipseFieldMapping>();

    tgridMappings?.forEach((mapping) => {
        const role = mapping.ellipseRole;
        if (role && role !== '') {
            map.set(mapping.ellipseRole, {
                tacticalGridFieldName: mapping.tacticalGridFieldName,
                systemFieldName: mapping.systemFieldName,
                role: mapping.ellipseRole,
                units: mapping.ellipseUnit,
            });
        }
    });

    return map;
}

/**
 * @summary Gets the map extent associated with the mission.
 * @param title name of the selected mission
 * @returns an esri Extent object in 'map coordinates' and an undefined spatial reference (assumed to be the same as the active view)
 */
export async function getMissionExtentByTitle(title: string): Promise<Extent | undefined> {
    const missionId = await getMissionIdByTitle(title);
    if (missionId) {
        const missionMapId = await getDefaultMissionMap(missionId);
        if (missionMapId) {
            const missionMap = await findPortalItemById(missionMapId);
            if (missionMap && missionMap.extent && missionMap.extent.length > 0) {
                const minPoint = new Point({ x: missionMap.extent[0][0], y: missionMap.extent[0][1] });
                const maxPoint = new Point({ x: missionMap.extent[1][0], y: missionMap.extent[1][1] });
                return new Extent({
                    xmin: minPoint.x,
                    ymin: minPoint.y,
                    xmax: maxPoint.x,
                    ymax: maxPoint.y,
                });
            }
        } else {
            LogHelper.log(`Error getting the default mission map for mission id: ${missionId}`);
        }
    } else {
        LogHelper.log(`Error getting mission id from title : ${title}`);
    }
    return undefined;
}
