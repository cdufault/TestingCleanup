import React from 'react';
import {
    Actions,
    gateMissionColumnTemplate,
    MissionAction,
    MissionState,
} from '../../../../../contexts/missionStateReducer';
import {
    createPortalGroup,
    findPortalGroupByTitle,
    getGroupContentByGroupId,
    shareItemsWithGroupLib,
    shareItemWithPortalGroup,
    unshareItemWithPortalGroup,
    updatePortalGroup,
} from '../../../../../helpers/portalGroupHelper';
import { getWebAppAndData } from '../../../../../helpers/missionHelper';
import {
    createPortalItem,
    deletePortalItem,
    findPortalItemById,
    getPortalItemData,
    updatePortalItem,
} from '../../../../../helpers/portalItemsHelper';
import { getDefaultMissionMap } from '../../../../../helpers/mapHelper';
import {
    addUsersToGroupById,
    findPortalUserByName,
    getPortalGroupUsers,
    removeUsersFromPortalGroup,
} from '../../../../../helpers/portalUsersHelper';
import { ConfigHelper } from '../../../../../helpers/configHelper';
import WebScene from '@arcgis/core/WebScene';
import Basemap from '@arcgis/core/Basemap';
import ElevationLayer from '@arcgis/core/layers/ElevationLayer';
import Ground from '@arcgis/core/Ground';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { IGroup, IItem } from '@esri/arcgis-rest-portal';
import { AppConfig } from '../../../../../interfaces/AppConfig';
import Graphic from '@arcgis/core/Graphic';
import { categoryQueryResult } from '@stratcom/lib-functions';
import { Row } from './ActivityCountsFormHelper';
import WebMap from '@arcgis/core/WebMap';
import PortalItem from '@arcgis/core/portal/PortalItem';

interface categoryQueryResultObject {
    categoryResult: categoryQueryResult;
    objectid?: string;
}

export const missionMode = {
    CREATE: 'create',
    UPDATE: 'update',
};

type typeGuidName = 'regionGuid' | 'landingPageGuid';

/**
 * Load a file resource JSON doc
 * @param fileNameWExt name of the json file including the extension
 */
export async function loadJsonFromFile(fileNameWExt: string): Promise<any | undefined> {
    let countsJson: any | undefined = undefined;
    try {
        const appLocation = window.location.pathname;
        const path = appLocation.substring(0, appLocation.lastIndexOf('/'));
        const request = await fetch(`${path}/${fileNameWExt}`);
        countsJson = await request.json();
    } catch (error) {
        console.error('Error loading JSON Config: ' + fileNameWExt);
        console.error(error);
    }
    return countsJson;
}

function getUpdatedTags(mission: MissionState): string[] {
    const newTags = ['immad-mission'];
    if (mission.region) {
        newTags.push(mission.region);
    }
    return newTags;
}

/**
 * Example: find a group content where content type is Feature Services or searchType is Feature Layer
 * @param groupId group id
 * @param contentType type of portal content to search
 * @param searchType type of item
 */
export async function findGroupContent(groupId: string, contentType: string, searchType: string): Promise<IItem[]> {
    const groupContent = await getGroupContentByGroupId(groupId);
    return groupContent.filter((content) => content.type === contentType || content.type === searchType);
}

/**
 * Update the selected mission with the group/mission content that is saved to Portal
 * @param dispatchFunc function used by useReducer to update state
 * @param selectedMission the selected mission
 */
export async function hydrateMissionState(
    dispatchFunc: React.Dispatch<MissionAction>,
    selectedMission: IGroup
): Promise<boolean> {
    const groupContent = await getGroupContentByGroupId(selectedMission.id);
    const result = await getPortalGroupUsers(selectedMission.id);
    const config = await ConfigHelper.getAppConfig();

    dispatchFunc({ type: Actions.UPDATE_ANALYST_NAMES, payload: { item: result.users } });
    result.users.forEach(async (userName) => {
        const userObj = await findPortalUserByName(userName);
        dispatchFunc({ type: Actions.ADD_ANALYST, payload: { item: userObj } });
    });

    const owner = result.owner;
    const mgrs = result.admins;

    const metadata = await getWebAppAndData(selectedMission.id);

    dispatchFunc({
        type: Actions.UPDATE_GROUP_OWNER,
        payload: owner,
    });

    //backwards compatability for older missions that don't support gateMapType
    //gateMissionType used to be 3D, 2D, undefined that is now by gateMapType
    //there is no gateMapType on an IMMAD mission -- will default to undefined
    if (
        metadata.gateMapType === '3D' ||
        metadata.gateMapType === '2D' ||
        metadata.gateMissionType === '3D' ||
        metadata.gateMissionType === '2D'
    ) {
        dispatchFunc({
            type: Actions.UPDATE_GATE_MAP_TYPE,
            payload: metadata.gateMapType ? metadata.gateMapType : metadata.gateMissionType,
        });
    }

    dispatchFunc({
        type: Actions.UPDATE_IS_EXERCISE_WHEN_LOADED,
        payload: metadata.isExercise,
    });
    dispatchFunc({
        type: Actions.UPDATE_VIEW_MODE,
        payload: metadata.viewMode,
    });

    dispatchFunc({
        type: Actions.UPDATE_MISSION_CONFIG_JSON,
        payload: metadata.widgets,
    });
    dispatchFunc({
        type: Actions.UPDATE_MISSION_REGION_COLUMN_JSON,
        payload: metadata.GateRegionCardColumnHeaders,
    });

    const tGridObj = metadata.widgets ? JSON.parse(metadata.widgets) : undefined;
    const tgrid = tGridObj.widgets.find((data: any) => data.component === 'tacticalGrid');
    const hasTGridLayer = !!tgrid?.properties[0]?.value?.id;

    const expObj = tgrid.properties.find((obj: any) => obj.name === 'stratleadExpirations');
    const expObjValue = expObj && expObj.value ? expObj.value : [];

    dispatchFunc({ type: Actions.SUPPORTS_CUSTOM_STRATLEAD_EXPIRATION, payload: expObjValue.length > 0 });

    const dashboardObj = tgrid.properties.find((obj: any) => obj.name === 'dashboardId');
    dispatchFunc({
        type: Actions.UPDATE_DASHBOARD_ID,
        payload: dashboardObj && dashboardObj.value ? dashboardObj.value : '',
    });

    const smartObj = tgrid.properties.find((obj: any) => obj.name === 'smartFieldMappings');
    dispatchFunc({
        type: Actions.UPDATE_SUPPORTS_TGRID_TO_SMART_MAPPING,
        payload: smartObj && smartObj.value && smartObj.value.length > 0 ? true : false,
    });
    dispatchFunc({
        type: Actions.UPDATE_TGRID_TO_SMART_FIELD_MAPPING,
        payload: smartObj && smartObj.value && smartObj.value.length > 0 ? smartObj.value : [],
    });
    dispatchFunc({
        type: Actions.SUPPORT_TACTICAL_GRID,
        payload: hasTGridLayer,
    });

    const layerObj = tgrid.properties.find((obj: any) => obj.name === 'layer');
    dispatchFunc({
        type: Actions.TACTICAL_GRID_LAYER_GUID,
        payload: layerObj && layerObj.value.id ? layerObj.value.id : '',
    });
    dispatchFunc({
        type: Actions.UPDATE_TACTICAL_GRID_LAYER_URL,
        payload: layerObj && layerObj.value.url ? layerObj.value.url : '',
    });

    const countsWidgetObj = metadata.appData ? JSON.stringify(metadata.appData, undefined, 4) : undefined;
    dispatchFunc({
        type: Actions.UPDATE_METADATA,
        payload: {
            name: selectedMission.title,
            description: selectedMission.snippet, //selectedMission.description has been dropped in favor of snippet,
            region: metadata.region ?? '',
            managerNames: mgrs.join(', '),
            selectedCategory: metadata.selectedCategory,
            stratLeadExpirations: expObjValue,
            countsWidgetJson: countsWidgetObj ? countsWidgetObj : undefined,
        },
    });

    console.log('Description from hydrate function: ' + selectedMission.description);

    dispatchFunc({ type: Actions.UPDATE_PORTALGROUPID, payload: { item: selectedMission.id } });
    groupContent.forEach(async (contentItem) => {
        switch (contentItem.type) {
            case config.types.featureService:
                dispatchFunc({ type: Actions.ADD_DATAFEED, payload: { item: contentItem } });
                break;
            case config.types.webScene:
                dispatchFunc({ type: Actions.UPDATE_WEBSCENE, payload: { item: contentItem } });
                break;
            case config.types.webMap:
                dispatchFunc({ type: Actions.UPDATE_WEBSCENE, payload: { item: contentItem } });
                break;
            case config.types.geoprocessingService:
                dispatchFunc({ type: Actions.ADD_TOOL, payload: { item: contentItem } });
                break;
            case config.types.webTool:
                dispatchFunc({ type: Actions.ADD_TOOL, payload: { item: contentItem } });
                break;
            case config.types.webMappingApplication:
            case config.types.application:
                dispatchFunc({ type: Actions.UPDATE_EXTENT, payload: { item: contentItem.extent } });
                break;
            default:
                break;
        }
    });
    return true;
}

/**
 * Get the web mapping application id.
 * @param missionGroupId group/mission portal id
 * @param updateFunc a function taking a string - used to send feedback to the caller
 */
export async function getWebMappingAppId(
    missionGroupId: string,
    updateFunc: (data: string) => void
): Promise<string | undefined> {
    const groupContent = await getGroupContentByGroupId(missionGroupId);
    const config = ConfigHelper.getAppConfig();

    let webMappingAppId = undefined;
    await Promise.all(
        groupContent.map(async (contentItem) => {
            if (
                contentItem.type === config.types.webMappingApplication ||
                contentItem.type === config.types.application
            ) {
                webMappingAppId = contentItem.id;
                updateFunc('Found web mapping application, will try to update it.');
            }
        })
    );
    return webMappingAppId;
}

/**
 *
 * @param dispatchFunc function provided by useReducer that is called to update the state object
 * @param mission mission of interest
 */
export function resetMissionData(dispatchFunc: React.Dispatch<MissionAction>, mission: MissionState): void {
    dispatchFunc({
        type: Actions.UPDATE_METADATA,
        payload: {
            type: {
                name: '',
                description: '',
                region: '',
                categories: [],
                selectedCategory: '',
                expandedCategories: [],
                stratLeadExpirations: [],
            },
        },
    });
    dispatchFunc({ type: Actions.UPDATE_BASEMAP, payload: { type: {} } });
    dispatchFunc({ type: Actions.UPDATE_WEBSCENE, payload: { type: {} } });
    mission.dataFeeds.forEach((feed) => dispatchFunc({ type: Actions.REMOVE_DATAFEED, payload: { item: feed } }));
    mission.analysts.forEach((analyst) => dispatchFunc({ type: Actions.REMOVE_ANALYST, payload: { item: analyst } }));
    mission.webTools.forEach((analytic) => dispatchFunc({ type: Actions.REMOVE_TOOL, payload: { item: analytic } }));
    dispatchFunc({ type: Actions.UPDATE_EXTENT, payload: { type: {} } });
    dispatchFunc({ type: Actions.UPDATE_GLAYER, payload: { type: {} } });
    dispatchFunc({ type: Actions.UPDATE_SKETCH, payload: { type: {} } });
    dispatchFunc({ type: Actions.UPDATE_PORTALGROUPID, payload: { type: undefined } });
    dispatchFunc({ type: Actions.UPDATE_GATE_MAP_TYPE, payload: { type: undefined } });
    dispatchFunc({ type: Actions.UPDATE_MISSION_TYPE, payload: { type: 'IMMAD Mission' } });

    dispatchFunc({ type: Actions.TACTICAL_GRID_LAYER_GUID, payload: undefined });
    dispatchFunc({ type: Actions.SUPPORT_TACTICAL_GRID, payload: false });
    dispatchFunc({ type: Actions.UPDATE_TACTICAL_GRID_LAYER_NAME, payload: undefined });
    dispatchFunc({ type: Actions.UPDATE_MISSION_CONFIG_JSON, payload: JSON.stringify({ widgets: [] }) });
    dispatchFunc({ type: Actions.UPDATE_MISSION_REGION_COLUMN_JSON, payload: gateMissionColumnTemplate });
    dispatchFunc({ type: Actions.SUPPORTS_CUSTOM_STRATLEAD_EXPIRATION, payload: false });
    dispatchFunc({ type: Actions.UPDATE_VIEW_MODE, payload: '3D' });
    dispatchFunc({
        type: Actions.UPDATE_TACTICAL_GRID_LAYER_URL,
        payload: '',
    });
    dispatchFunc({
        type: Actions.UPDATE_SUPPORTS_TGRID_TO_SMART_MAPPING,
        payload: false,
    });
    dispatchFunc({
        type: Actions.UPDATE_TGRID_TO_SMART_FIELD_MAPPING,
        payload: [],
    });
    dispatchFunc({ type: Actions.UPDATE_DASHBOARD_ID, payload: '' });
    dispatchFunc({ type: Actions.UPDATE_IS_EXERCISE, payload: false });
    dispatchFunc({ type: Actions.UPDATE_IS_EXERCISE_WHEN_LOADED, payload: false });
}

/**
 * Get a guid for the ftr class that needs to be updated based on the type of mission - exercise or regular
 * This code executed on for GATE missions
 * @param missionState the state for creating mission that contains all the needed props
 * @param guidName name of the particular guid type
 */
async function extractFClassGuidBasedOnMissionType(
    missionState: MissionState,
    guidName: typeGuidName
): Promise<string> {
    const config = ConfigHelper.getAppConfig();
    if (!config) {
        const message =
            'Error retrieving the app config. Unable to identify the GATE mission type or return a valid FClass guid.';
        console.error(message);
        throw new Error(message);
    }
    if (missionState.isExercise || missionState.isExerciseWhenLoaded) {
        if (guidName === 'regionGuid') {
            return config.gate.exercise.exRegionsFClassGuid;
        } else if (guidName === 'landingPageGuid') {
            return config.gate.exercise.exLandingPageFClassGuid;
        }
    } else {
        if (guidName === 'regionGuid') {
            return config.gate.regionsFClassGuid;
        } else if (guidName === 'landingPageGuid') {
            return config.gate.landingPageFClassGuid;
        }
    }
    return '';
}

/**
 * Allow GATE missions to add items to the Regions and Category ftr classes that should be pre-defined
 * @param mission mission state data
 * @param groupId newly created mission group id
 * @param updatingAMission true if a mission is being updated otherwise false when creating a new mission
 * default value of false
 */
async function addSupportForGateLandingPage(
    mission: MissionState,
    groupId: string,
    updatingAMission = false
): Promise<boolean> {
    try {
        const regionFClassGuid = await extractFClassGuidBasedOnMissionType(mission, 'regionGuid');
        const idField = 'globalid';
        const fLayer = await addRegionFeature(regionFClassGuid, mission.name, groupId, updatingAMission);

        if (fLayer) {
            const guidVal = await queryRegionForGlobalId(fLayer, groupId, idField);
            const landingPageGuid = await extractFClassGuidBasedOnMissionType(mission, 'landingPageGuid');
            if (guidVal) {
                const countsWidgetJson = JSON.parse(mission.countsWidgetJson);
                !updatingAMission && (await addCategoryFeature(countsWidgetJson.rows, guidVal, landingPageGuid));
                updatingAMission && (await updateCategoryFeature(countsWidgetJson.rows, guidVal, landingPageGuid));
            } else {
                const message = 'Failed to find a row in the Regions ftr class with a groupId value of: ' + groupId;
                throw new Error(message);
            }
        } else {
            const message = 'Failed to create and/or query layer with id: ' + regionFClassGuid;
            throw new Error(message);
        }
    } catch (error) {
        console.error(error);
        return false;
    }
    return true;
}

/**
 * After inserting a row in the Regions ftr class get the unique identifier that was assigned to the row
 * @param fLayer region feature layer - derived from app config guid
 * @param groupId group portal item id
 * @param idField field that will be the unique identifier
 */
async function queryRegionForGlobalId(
    fLayer: FeatureLayer,
    groupId: string,
    idField: string
): Promise<string | undefined> {
    let regionGuid: undefined;
    try {
        const query = fLayer.createQuery();
        query.outFields = [idField];
        query.where = `mission_id = '${groupId}'`;

        await fLayer.queryFeatures(query).then((r) => {
            if (r && r.features) {
                regionGuid = r.features[0].attributes[idField];
            }
        });
    } catch (error) {
        console.error(error);
    }
    return regionGuid;
}

/**
 * Retrieve all category data for the rows in the activity counts JSON
 * @param dataRows activity counts JSON  row data
 * @param featureLayer categories feature layer
 * @param regionGuid global id for the region
 * @returns Map with the row label as the key and a category object as the value
 */
async function queryCategoryData(
    dataRows: Row[],
    featureLayer: FeatureLayer,
    regionGuid: string
): Promise<Map<string, categoryQueryResultObject>> {
    const categoryResultMap: Map<string, categoryQueryResultObject> = new Map();
    const oidFieldName = featureLayer.objectIdField;
    await Promise.all(
        dataRows.map(async (row: any) => {
            const where = `region_guid = '${regionGuid}' AND category = '${row.rowLabel}' AND last_edited_date IS NOT NULL`;
            const outFields: string[] = ['*'];
            try {
                const query = featureLayer.createQuery();
                query.outFields = outFields;
                query.where = where;
                query.orderByFields = [`last_edited_date DESC`];
                await featureLayer.queryFeatures(query).then((res) => {
                    if (res && res.features.length > 0) {
                        const feature = res.features[0];
                        const queryResultObj = {
                            categoryResult: {
                                region_guid: feature.attributes['region_guid'],
                                category: feature.attributes['category'],
                                category_level: feature.attributes['category_level'],
                                category_confidence: feature.attributes['category_confidence'],
                                comment: feature.attributes['comments'],
                                guid: feature.attributes['globalid'],
                            },
                            objectid: feature.attributes[oidFieldName],
                        };
                        // @ts-ignore
                        categoryResultMap.set(feature.attributes['category'], queryResultObj);
                    }
                });
            } catch (error) {
                console.error('Error querying categories.');
                console.error(error);
            }
        })
    );
    return categoryResultMap;
}

/**
 * Update the category with the existing data if it exists or default data if it is a new row
 * @param dataRows activity counts JSON  row data
 * @param guidVal global id for the region
 * @param fLayerGuid guid for the category feature class
 * @returns true if the post succeeded otherwise false
 */
async function updateCategoryFeature(dataRows: any[], guidVal: string, fLayerGuid: string): Promise<boolean> {
    try {
        const regionsFLayer = new FeatureLayer({
            portalItem: {
                id: fLayerGuid,
            },
        });
        await regionsFLayer.load().catch((error) => {
            console.error(error);
            return false;
        });

        const existingCategoryRowsMap = await queryCategoryData(dataRows, regionsFLayer, guidVal);
        const newFeatures: any = [];
        await Promise.all(
            dataRows.map(async (row: any) => {
                if (!existingCategoryRowsMap.has(row.rowLabel)) {
                    //don't update an existing row's data
                    const categoryAttributes = {
                        //must be a new row - so set default values
                        region_guid: guidVal,
                        category: row.rowLabel,
                        category_level: 'Low',
                        category_confidence: '',
                        comment: '',
                        analyst_assessment_com: '',
                    };
                    const newFeature = new Graphic({
                        attributes: categoryAttributes,
                    });
                    newFeatures.push(newFeature);
                }
            })
        );
        await regionsFLayer
            .applyEdits({
                addFeatures: newFeatures,
            })
            .catch((error) => {
                console.error('Error adding new category feature: ');
                console.error(error);
                return false;
            });
    } catch (error) {
        console.error(error);
        return false;
    }
    return true;
}

/**
 * Add relevant data from the mission creation process into the categories ftr class
 * @param dataRows rows defined in the counts widget JSON definition
 * @param guidVal unique identifier from the Region table for the associated rows in the categories
 * @param fLayerGuid portal item id for the Catagories ftr class -- defined in the config json
 */
async function addCategoryFeature(dataRows: any[], guidVal: string, fLayerGuid: string): Promise<boolean> {
    let errorCount = 0;
    try {
        const regionsFLayer = new FeatureLayer({
            portalItem: {
                id: fLayerGuid,
            },
        });
        await Promise.all(
            dataRows.map(async (row: any) => {
                const categoryAttributes = {
                    region_guid: guidVal,
                    category: row.rowLabel,
                    category_level: 'Low',
                    category_confidence: '',
                    comment: '',
                    analyst_assessment_com: '',
                };

                //kept around for cleaning up the test data in dev
                /*const deleteFeatures = [{objectId: 12},{objectId: 20},{objectId: 3},
                    {objectId: 4},{objectId: 5},{objectId: 6},{objectId: 7},{objectId: 8},
                    {objectId: 9},{objectId: 10},{objectId: 11},{objectId: 12}] ;*/

                const newFeature = new Graphic({
                    //geometry: new Point({x:50.0,y:50.0}), //may not need this
                    attributes: categoryAttributes,
                });
                await regionsFLayer
                    .applyEdits({
                        addFeatures: [newFeature],
                        //deleteFeatures: deleteFeatures
                    })
                    .catch(() => {
                        console.error('Error updating category: ' + row.label);
                        errorCount++;
                    });
            })
        );
    } catch (error) {
        console.error(error);
        return false;
    }
    return errorCount === 0;
}

/**
 * Update the Region feature class with relevant data gleaned from the mission creation process
 * @param fLayerGuid portal item id for the Regions feature layer -- defined in the app config JSON
 * @param missionName name of the mission
 * @param groupId portal item id for the group
 * @param updatingAMission true if a mission is being updated otherwise false when creating a new mission
 * default value of false
 */
async function addRegionFeature(
    fLayerGuid: string,
    missionName = '',
    groupId: string,
    updatingAMission = false
): Promise<FeatureLayer | undefined> {
    let regionsFLayer;
    try {
        regionsFLayer = new FeatureLayer({
            portalItem: {
                id: fLayerGuid,
            },
        });
        if (!updatingAMission) {
            const regionAttributes = {
                region_name: missionName,
                group_name: missionName,
                mission_id: groupId,
                visible: 1,
            };

            //kept around for cleaning up the test data in dev
            //const deleteFeatures = [{objectId: 1},{objectId: 2},{objectId: 3},{objectId: 4},{objectId: 5}];

            const addFeature = new Graphic({
                attributes: regionAttributes,
            });
            await regionsFLayer.applyEdits({
                addFeatures: [addFeature],
                //deleteFeatures:deleteFeatures
            });
        }
    } catch (error) {
        console.error(error);
        return undefined;
    }
    return regionsFLayer;
}

/**
 * Un-share all mission items
 * @param missionGroupId group/mission portal id
 * @param currentUser current user object
 * @param isImmadAdmin boolean value for admin status
 * @param mission current mission state object
 */
export async function unshareOrDeleteSceneFromGroup(
    mission: MissionState,
    missionGroupId: string,
    currentUser: string | undefined,
    isImmadAdmin: boolean
): Promise<string> {
    const groupContent = await getGroupContentByGroupId(missionGroupId);
    const result = await getPortalGroupUsers(missionGroupId);
    const config = ConfigHelper.getAppConfig();
    const owner = result.owner;
    const mapId = await getDefaultMissionMap(mission.portalGroupId);
    let contentItemRemovedOrUnshared = 'Default scene deleted';
    await Promise.all(
        groupContent.map(async (contentItem) => {
            const theOwner = contentItem.owner ? contentItem.owner : owner;
            if ((currentUser !== theOwner || !isImmadAdmin) && contentItem.type === config.types.webScene) {
                await unshareItemWithPortalGroup(missionGroupId, contentItem.id, theOwner);
                contentItemRemovedOrUnshared = 'Default scene unshared - current user is not the item owner';
            } else {
                await deletePortalItem(mapId);
            }
        })
    );
    return contentItemRemovedOrUnshared;
}

/**
 *
 * @param mission mission of interest
 * @param dispatchFunction function provided by useReducer that is called to update the state object
 * @param feedbackFunc a function taking a string - used to send feedback to the caller
 */
export async function createMission(
    mission: MissionState,
    dispatchFunction: React.Dispatch<MissionAction>,
    feedbackFunc: (data: string) => void
): Promise<IGroup | undefined> {
    try {
        if (mission.webScene === undefined || mission.name === undefined) {
            throw new Error(`Invalid parameter. Verify extentWebScene and mission name are defined`);
        }
        feedbackFunc('Initializing ...');
        const mgrNamesArray = mission.managerNames?.split(',').map((item) => item.trim());

        //are we updating or creating -- updating if we have a portalGroupId
        const mode =
            mission.portalGroupId === '' || mission.portalGroupId === undefined || mission.missionIsCopy
                ? missionMode.CREATE
                : missionMode.UPDATE;
        let newSceneName = '';

        if (mode === missionMode.UPDATE) {
            const result = await getPortalGroupUsers(mission.portalGroupId);
            const users = result.users;
            //this will clear all users/analysts from the group - analysts names currently in the state object
            //will be added to the mission just before the mission application object is created, without this call
            //the users removed via the UI would continue to be a part of the mission
            const removeUsersResult = await removeUsersFromPortalGroup(mission.portalGroupId, users);
            if (
                removeUsersResult &&
                removeUsersResult.usersNotRemoved &&
                removeUsersResult.usersNotRemoved.length > 0
            ) {
                console.warn('Warning. Check the Mission group in Portal to ensure membership validity.'); //all users were not cleared
            }

            const mapId = await getDefaultMissionMap(mission.portalGroupId);
            const mapItem = await findPortalItemById(mapId);
            const prevSceneName = mapItem ? mapItem.title : 'Mission Default Scene';
            // if a new scene was selected when editing the mission
            if (mission.createNewScene) {
                await unshareOrDeleteSceneFromGroup(
                    mission,
                    mission.portalGroupId,
                    mission.currentUser,
                    mission.isImmadAdmin
                );
            }
            newSceneName = deriveNewNameForWebScene(prevSceneName);
            feedbackFunc('Updated mission scene name is: ' + newSceneName);
        }

        const result = await findPortalGroupByTitle(mission.name);
        let group = result.item && result.item.length > 0 ? result.item[0] : undefined;
        const config = ConfigHelper.getAppConfig();
        newSceneName = newSceneName === '' ? mission.name : newSceneName;
        const webScene = mission.webScene;
        let webSceneId = '';
        if (webScene.portalItem) {
            webScene.portalItem.categories = getPortalCategories(mission);
            webSceneId = webScene.portalItem.id;
        }

        if (mode === missionMode.CREATE || (mission.createNewScene && missionMode.UPDATE)) {
            feedbackFunc('Saving the scene');
            webSceneId = await saveWebScene(mission, webScene, newSceneName);
            if (webSceneId === undefined || webSceneId === '') {
                throw new Error(
                    'The returned webscene id was undefined or an empty string. Abandoning the create mission workflow.'
                );
            }
        }
        feedbackFunc('Updating scene extent.');

        const snippet = mission.description;
        if (mode === missionMode.UPDATE) {
            group.tags = getUpdatedTags(mission);
            const updateResult = await updatePortalGroup(
                mission.portalGroupId,
                '',
                group.tags,
                snippet,
                getPortalCategories(mission)
            );
            console.debug(`Updating group:  ${JSON.stringify(updateResult)}`);
        } else {
            if (mission.name && mission.description) {
                feedbackFunc('Creating the mission group.');
                const region = mission.region ?? '';
                const groupTag = config.tags.mission;
                group = await createMissionGroup(
                    mission.name,
                    '',
                    region,
                    [groupTag],
                    snippet,
                    getPortalCategories(mission)
                );
            }
        }
        if (group === undefined) {
            throw new Error('Failed to create or find the mission group. Abandoning the create mission workflow.');
        }
        let sharingResult;
        if (mode === missionMode.CREATE || (mission.createNewScene && missionMode.UPDATE)) {
            feedbackFunc('Sharing scene with the mission group.');

            if (!mission.gateMapType) {
                sharingResult = await shareItemWithPortalGroup(group.id, webSceneId, group.owner); //current user will be owner
            } else {
                sharingResult = await shareItemsWithGroupLib(webSceneId, [group.id], true);
            }
            console.log(`Web Scene name is : ${newSceneName}`);
            console.log(
                `Sharing webSceneId: ${webSceneId} with group: ${group.id} Result: ${JSON.stringify(sharingResult)}`
            );
        }
        feedbackFunc('Evaluating selected analysts.');
        const userNamesArray = mission?.analystNames;

        feedbackFunc('Adding analysts to mission.');
        await addUsersToGroupById(group.id, userNamesArray, mgrNamesArray);

        feedbackFunc('Creating the mission web mapping application');

        const dataObj = createWebMappingApplicationData(mission, webSceneId, config, group.id); //success id
        let webAppCreationResult = undefined;

        if (mode === missionMode.CREATE) {
            webAppCreationResult = await createPortalItem(dataObj);
            feedbackFunc('Sharing remaining items with the group.');
            if (!mission.gateMapType) {
                sharingResult = await shareItemWithPortalGroup(group.id, webAppCreationResult?.id); //current user will be owner
            } else {
                await addSupportForGateLandingPage(mission, group.id);
                await shareItemsWithGroupLib(webAppCreationResult?.id, [group.id], true);
            }
        } else {
            if (mission.gateMapType) {
                await addSupportForGateLandingPage(mission, group.id, true);
            }
            dataObj.id = await getWebMappingAppId(group.id, feedbackFunc);
            dataObj.owner = group.owner;
            webAppCreationResult = await updatePortalItem(dataObj);
        }
        console.log('result:' + JSON.stringify(webAppCreationResult));

        const r = await validate(group ? group.id : '', webSceneId, feedbackFunc, webAppCreationResult.id, mission);
        feedbackFunc(r ? 'Success' : 'Failure');
        resetMissionData(dispatchFunction, mission);
        feedbackFunc('Resetting mission creation form data.');
        feedbackFunc('DONE'); //flag to flip tab and show all output messages
        return group;
    } catch (error) {
        console.error(error);
        feedbackFunc(error);
        feedbackFunc('ERROR');
        return undefined;
    }
}

/**
 * Log out to the console some elements related to a mission for validation
 * @param groupId group/mission id
 * @param webSceneId webscene id
 * @param feedbackFunc func to pass back data to the user that is displayed in the UI
 * @param webAppCreationResultId application object owned by the group that holds mission metadataConfig
 * @param mission mission state object
 */
async function validate(
    groupId: string,
    webSceneId: string,
    feedbackFunc: (data: string) => void,
    webAppCreationResultId: string,
    mission: MissionState
): Promise<boolean> {
    //validate group map and webscene ids are a match
    const defaultMapId = await getDefaultMissionMap(groupId);
    let groupMapAndSceneAreTheSame = false;
    if (defaultMapId && defaultMapId !== webSceneId && mission.createNewScene) {
        const message = `Error: mismatch between default map id: ${defaultMapId} and websceneId: ${webSceneId}`;
        console.error(message);
        feedbackFunc(message);
    } else {
        feedbackFunc('Default group webmap id matches the updated webscene id.');
        groupMapAndSceneAreTheSame = true;
    }

    //log out the item data for review to confirm we have outputs matching the inputs
    const result = await getPortalItemData(webAppCreationResultId);
    console.log(
        result
            ? JSON.stringify(result)
            : "Web mapping application portal item's data was undefined. It should hold the groups metadata."
    );
    return groupMapAndSceneAreTheSame && result.success;
}

/**
 * Derive a new name for a WebScene to update
 * @param sceneName the name of a scene that is going to be saved under a new auto generated name
 */
export function deriveNewNameForWebScene(sceneName: string): string {
    let newSceneName = '';
    let subName = ''; //scene name if formatted as **** Scene
    const pos = sceneName.lastIndexOf(' Scene');
    if (pos === -1) {
        subName = sceneName;
    } else {
        subName = sceneName.substring(0, pos);
    }

    const match = subName.match(/_(\d+)$/);
    if (match) {
        const base = subName.slice(0, match.index);
        const number = parseInt(match[0].replace('_', '')) + 1;
        newSceneName = `${base}_${number}`;
    } else {
        newSceneName = `${subName}_1`;
    }
    return newSceneName;
}

/**
 * Save the missions default scene
 * @param mission mission state holding various parameters
 * @param webScene the scene to save
 * @param sceneName name of the scene
 */
export async function saveWebScene(mission: MissionState, webScene: WebScene, sceneName: string): Promise<string> {
    if (!webScene) {
        const errorMessage = 'Scene was undefined when trying to save the web scene.';
        throw new Error(errorMessage);
    }
    let categoriesDefined = getPortalCategories(mission);
    if (categoriesDefined) {
        console.debug(categoriesDefined);
    } else {
        categoriesDefined = [];
    }
    if (webScene.portalItem) {
        const newScenePortalItem = await webScene
            .saveAs({
                title: sceneName + ' Scene',
                categories: categoriesDefined,
            })
            .catch((error) => {
                throw new Error(`Failed to save scene ${sceneName}: ${error.message}`);
            });
        return newScenePortalItem.id;
    } else {
        webScene.portalItem = new PortalItem({
            title: mission.name,
            type: 'Web Scene',
            typeKeywords: ['WebScene', 'IMMAD'],
            description: mission.description,
        });
        const newScenePortalItem = await webScene.saveAs({
            title: sceneName + ' Scene',
            categories: categoriesDefined,
        });
        return newScenePortalItem.id;
    }
}

/**
 * Create mission group
 * @param groupName mission group name
 * @param description a description for the group portal item
 * @param region region name
 * @param tags array of  tags to add to the portal item
 * @param snippet snippet for the mission
 * @param categories categories to set on the mission group
 * @param accessLevel access level to set on the group
 */
export async function createMissionGroup(
    groupName: string,
    description: string,
    region: string,
    tags: string[],
    snippet = '',
    categories: string[],
    accessLevel: 'private' | 'org' | 'public' = 'private'
): Promise<IGroup | undefined> {
    if (region) {
        tags.push(region);
    }

    const createGroupResult = await createPortalGroup({
        title: groupName,
        access: accessLevel,
        description: description,
        snippet: snippet,
        tags: tags,
        categories: categories,
    });

    if (!createGroupResult.success) {
        return undefined;
    }

    return createGroupResult.group;
}

/**
 *
 * @param mission mission state data
 * @param scenePortalItemId id of the scene portal item
 * @param config reference to the AppConfig data
 * @param groupId the id of the group -- adding to app object because non-group member can't get this
 * value, and it is needed in the IMMAD edit GATE workflows.
 */
export function createWebMappingApplicationData(
    mission: MissionState,
    scenePortalItemId: string,
    config: AppConfig,
    groupId: string
): any {
    //here is the format for the tacticalGrid application JSON
    /* widgets:[
        {
            tacticalGrid: {
                component: 'Tactical Grid',
                properties: {
                    name: mission.tacticalGridLayerName
                    value: mission.tacticalGridLayerGuid
                }
            }
        }
    ] */
    /*const widgets:[ //sample of the data structure
        {
            component: 'tacticalGrid'
            properties: [
                {
                    name: "layer"
                    value: {
                        id: mission.tacticalGridLayerGuid //id or url but not both
                        url: layerURL
                    }
                },
                {
                    name: 'smartFieldMappings'
                    value: [
                        {
                            "tacticalGridFieldName":"comments",
                            "systemFieldName": "valueOne"
                        }
                    ]
                },
                {
                    name: 'stratleadExpirations
                    value: [
                        { "id": "medium", "label": "Medium", "expirationTime": 50, "color": "#FF671F" }
                    ]
                },
                {
                    name: 'dashboardId'
                    value: ''
                }
            ]
        }
    ] */

    const tGridTemplate = {
        component: 'tacticalGrid',
        properties: [
            {
                name: 'layer',
                value: {},
            },
            {
                name: 'smartFieldMappings',
                value: [],
            },
            {
                name: 'stratleadExpirations',
                value: [],
            },
            {
                name: 'dashboardId',
                value: '',
            },
        ],
    };

    const configJsonObj = JSON.parse(mission.missionConfigJson);

    let tGrid = configJsonObj.widgets.find((obj: any) => obj.component === 'tacticalGrid');

    if (!tGrid) {
        //set to blank template
        //no tgrid
        configJsonObj.widgets.push(tGridTemplate); //set up the tgrid template
        tGrid = configJsonObj.widgets.find((obj: any) => obj.component === 'tacticalGrid');
    } else if (tGrid && mission.supportsTacticalGrid === false) {
        //tGrid support is being removed
        const nonTGridWidgets = configJsonObj.widgets.filter((widget: any) => widget.component !== 'tacticalGrid');
        configJsonObj.widgets = nonTGridWidgets;
        configJsonObj.widgets.push(tGridTemplate); //add the blank tgrid template
    }

    if (mission.supportsTacticalGrid && mission.tacticalGridLayerGuid) {
        const currentGridLayer = tGrid.properties.find((obj: any) => obj.name === 'layer');
        if (currentGridLayer) {
            if (mission.tacticalGridLayerGuid && mission.tacticalGridLayerGuid !== '') {
                currentGridLayer.value = {
                    id: mission.tacticalGridLayerGuid,
                };
            } else if (mission.tacticalGridLayerURL && mission.tacticalGridLayerGuid !== '') {
                currentGridLayer.value = {
                    value: mission.tacticalGridLayerURL,
                };
            }
        }
    }
    if (mission.supportsMappedGridFieldsToSMARTFields && mission.supportsTacticalGrid) {
        const currentFieldMappings = tGrid.properties.find((obj: any) => obj.name === 'smartFieldMappings');
        if (currentFieldMappings) {
            currentFieldMappings.value = mission.tacticalGridToSMARTFieldMappings;
        }
    }
    if (mission.stratLeadExpirations && mission.stratLeadExpirations.length > 0 && mission.supportsTacticalGrid) {
        const customExpirations = tGrid.properties.find((obj: any) => obj.name === 'stratleadExpirations');
        if (customExpirations) {
            customExpirations.value = mission.stratLeadExpirations;
        }
    }
    if (mission.dashboardId !== '' && mission.supportsTacticalGrid) {
        const dId = tGrid.properties.find((obj: any) => obj.name === 'dashboardId');
        if (dId) {
            dId.value = mission.dashboardId;
        }
    }
    const configJson = JSON.stringify(configJsonObj);
    const appConfig = ConfigHelper.getAppConfig();

    const text = {
        region: mission.region,
        missionManager: mission.managerNames,
        defaultViewId: scenePortalItemId,
        selectedCategory: mission.selectedCategory,
        gateMapType: mission.gateMapType,
        //missionType: mission.missionType,
        groupId: groupId,
        widgets: configJson,
        viewMode: mission.viewMode,
        immadVersion: appConfig.immadVersion,
        isExercise: mission.isExercise || mission.isExerciseWhenLoaded,
        appData:
            mission.countsWidgetJson && mission.countsWidgetJson !== ''
                ? JSON.parse(mission.countsWidgetJson)
                : undefined,
        GateRegionCardColumnHeaders: mission.gateMissionColumnNames,
    };

    let keyword = '';
    if (mission.isExercise || mission.isExerciseWhenLoaded) {
        if (mission.gateMapType) {
            keyword = config.typekeywords.gateExercise;
        } else {
            keyword = config.typekeywords.immadExercise;
        }
    } else {
        if (mission.gateMapType) {
            keyword = config.typekeywords.gateMission;
        } else {
            keyword = config.typekeywords.immadMission;
        }
    }
    const data = {
        //these values go on the item
        title: mission.name,
        //other supported properties that could be set: categories: [], description: '', documentation: ''
        snippet: mission.description, //adding description as snippet
        typeKeywords: [keyword],
        sortField: 'title',
        sortOrder: 'asc',
        spatialReference: mission.webScene?.basemap?.spatialReference
            ? mission.webScene.basemap.spatialReference.wkid
            : '',
        extent: '',
        type: [config.types.application],
        tags: [config.tags.application],
        text: JSON.stringify(text), //these values go on the 'data' attribute of the item
        categories: getPortalCategories(mission),
    };

    return data;
}

/**
 * Create a scene from basemap id.
 * @param basemapId basemap id to use to make scene
 * @param elevationLayerUrl url to elevation layer to add to the scene
 */
export function createSceneFromBasemapId(basemapId: string, elevationLayerUrl: string): WebScene {
    const basemap = new Basemap({
        portalItem: { id: basemapId },
    });

    let groundLayer = undefined;
    let webScene = undefined;
    if (elevationLayerUrl && elevationLayerUrl.trim() != '') {
        groundLayer = new ElevationLayer({ url: elevationLayerUrl });
        webScene = new WebScene({
            basemap,
            ground: new Ground({ layers: [groundLayer] }),
        });
        return webScene;
    }

    webScene = new WebScene({
        basemap,
    });
    return webScene;
}

/**
 * Create scene from a web scene id
 * @param sceneId id of the scene to use
 */
export function createSceneFromSceneId(sceneId: string): WebScene {
    return new WebScene({
        portalItem: { id: sceneId },
    });
}

/**
 * Ensure key mission data elements and present and that the name is unique
 * @param mission mission data to validate
 * @param missionToUpdate mission to update
 */
export async function validateMissionData(mission: MissionState, missionToUpdate: any = undefined): Promise<string[]> {
    const messageArray = [];
    const config = ConfigHelper.getAppConfig();
    if (!mission.name || mission.name.trim() === '') {
        messageArray.push('Mission Name');
    }
    if (!missionToUpdate || mission.missionIsCopy) {
        const name = mission.name ? mission.name : '';
        let result;
        if (name) {
            result = await findPortalGroupByTitle(name);
        }
        if (result?.success === true && result?.item.length > 0) {
            if (result.item[0].title === mission.name) {
                messageArray.push('Unique mission name.');
            }
        }
    }
    if (!mission.description || mission.description.trim() === '') {
        messageArray.push('Mission Summary');
    }
    if (!mission.managerNames || mission.managerNames.trim() === '') {
        messageArray.push('Mission Manager');
    }
    if (mission.supportsTacticalGrid && mission.dashboardId === '') {
        messageArray.push('Tactical Grid Dashboard ID');
    }
    if (mission.supportsTacticalGrid && mission.tacticalGridLayerLayerName === '') {
        messageArray.push('Tactical Grid Layer');
    }

    if (mission.gateMapType) {
        if (!mission.countsWidgetJson || mission.countsWidgetJson === '') {
            messageArray.push('Counts Widget JSON');
        }
    }
    if (mission.gateMapType && mission.countsWidgetJson !== '') {
        await validateActivityCountsJson(messageArray, mission.countsWidgetJson, mission.isExercise, config.tags);
    }
    // Add Category if required
    return messageArray;
}

/**
 *
 * @param messageArray message to pass back to user
 * @param countsWidgetJson activity counts JSON
 * @param isExercise true if this is an exercise mission
 * @param tags tags defined in the appConfig config.tags
 * @returns array of error messages collected during validation
 */
export async function validateActivityCountsJson(
    messageArray: string[],
    countsWidgetJson: any,
    isExercise: boolean,
    tags: any
): Promise<string[]> {
    try {
        let countsJsonObj: any | undefined = undefined;
        try {
            countsJsonObj = JSON.parse(countsWidgetJson);
        } catch (error) {
            console.error('Error parsing JSON. Message: ' + JSON.stringify(error));
            messageArray.push('A Valid Counts Widget JSON');
        }

        const numberOfRowsInJson = countsJsonObj?.rows.length;
        const row = countsJsonObj?.rows.sort(
            (dataA: any, dataB: any) => dataB.rowColumns.length - dataA.rowColumns.length
        );
        const maxNumberOfRowColumns = row[0].rowColumns.length;
        const rowPositionsInTable: number[] = []; //rows
        await Promise.all(
            countsJsonObj &&
                countsJsonObj.rows.map(async (row: any) => {
                    const numberOfColumnsInARow = row.rowColumns.length;
                    const ftrLayerGuid = row.ftrClassPortalItemId;
                    const item = await findPortalItemById(ftrLayerGuid);
                    if (!item) {
                        messageArray.push(`Can't find 'Selected Feature Layer' for ${row.rowLabel}`);
                    } else {
                        if (isExercise) {
                            const result = item?.tags.find(
                                (tag) => tag.toLowerCase().trim() === tags.exerciseFClass.toLowerCase()
                            );
                            if (!result) {
                                const fcName = item?.title;
                                messageArray.push(`Portal item ${fcName} must have the 'exercise' tag`);
                            }
                        }
                    }
                    if (row.positionInTable < 1) {
                        messageArray.push(
                            `${row.rowLabel} row positionInTable: '${row.positionInTable}'  can't be less than 1.`
                        );
                    }
                    if (row.positionInTable > numberOfRowsInJson) {
                        messageArray.push(
                            `${row.rowLabel} row positionInTable: '${row.positionInTable}' is out of range.`
                        );
                    }
                    const dupRowPos = rowPositionsInTable.find((rowPos: number) => rowPos === row.positionInTable);
                    if (dupRowPos) {
                        messageArray.push(
                            `${row.rowLabel} row positionInTable: '${row.positionInTable}' is a duplicate.`
                        );
                    } else {
                        rowPositionsInTable.push(row.positionInTable);
                    }
                    const definedRowPositions: number[] = [];
                    row.rowColumns.forEach((rowColumn: any) => {
                        if (rowColumn.positionInTable > numberOfColumnsInARow) {
                            messageArray.push(
                                `${row.rowLabel}' row's columnLabel '${rowColumn.columnLabel}' @positionInTable:' ${rowColumn.positionInTable}' is out of range.`
                            );
                        }
                        if (rowColumn.positionInTable < 1) {
                            messageArray.push(
                                `${row.rowLabel}' row's columnLabel '${rowColumn.columnLabel}' @positionInTable: ${rowColumn.positionInTable}' can't be less than 1.`
                            );
                        }
                        //define only one row position in the JSON - duplicate row number not allowed
                        const duplicateRowPosition = definedRowPositions.find(
                            (position: number) => position === rowColumn.positionInTable
                        );
                        if (duplicateRowPosition) {
                            messageArray.push(
                                `${row.rowLabel}' row's columnLabel '${rowColumn.columnLabel}' @positionInTable: '${rowColumn.positionInTable}' is duplicated in another row.`
                            );
                        } else {
                            definedRowPositions.push(rowColumn.positionInTable);
                        }
                    });
                })
        );
        if (countsJsonObj?.defineColumnTotals) {
            if (maxNumberOfRowColumns < countsJsonObj?.defineColumnTotals.length) {
                messageArray.push(
                    `defineColumnTotals[] item count must not exceed the number of columns in a row '${maxNumberOfRowColumns}'`
                );
            }
            const definedColumnOutputPositions: number[] = []; //column position values should not have duplicates
            countsJsonObj?.defineColumnTotals.forEach((countColumn: any) => {
                if (countColumn.columnOutputPosition > maxNumberOfRowColumns) {
                    messageArray.push(
                        `defineColumnTotals.columnOutPosition value :'${countColumn.columnOutputPosition}' is out of range.`
                    );
                }
                if (countColumn.columnOutputPosition < 1) {
                    messageArray.push(
                        `defineColumnTotals.columnOutPosition value: '${countColumn.columnOutputPosition}' can't be less than 1.`
                    );
                }
                //check if a Total/Summary is defined multiple times for the same column
                const foundDuplicateColPos: any = definedColumnOutputPositions.find(
                    (outputPos: number) => outputPos === countColumn.columnOutputPosition
                );
                if (foundDuplicateColPos) {
                    messageArray.push(
                        `defineColumnTotals.columnOutPosition  '${countColumn.columnOutputPosition}' -- is defined more than once.`
                    );
                } else {
                    definedColumnOutputPositions.push(countColumn.columnOutputPosition);
                }

                const errorMessages: string[] = validateDefineColumnTotalsJson(
                    countColumn.columns,
                    countsJsonObj.rows,
                    numberOfRowsInJson
                );
                messageArray.concat(errorMessages);
            });
        }
    } catch (error) {
        console.error(error);
        return ['Error occurred. See cosole log message for details.'];
    }
    return messageArray;
}

/**
 * The purpose of the definedCountColumns section of the JSON is to allow the user to
 * define which row/column combinations should determine the Total/Summary column
 * validate:
 * definedCountColumns JSON does not define a columnName that does not exist in the row array
 * definedCountColumns JSON does not point to a row position beyond the row array length
 * @param definedCountColumns an array of definitions for a single count column [{row:0, columnName:"foo"}]
 * these array values will be summed to generate a count for the column Total/Summary
 * @param rowsArray an array of row items defined in the JSON
 * @param numberOfRowsInJson row count in the row array
 */
function validateDefineColumnTotalsJson(
    definedCountColumns: any[],
    rowsArray: any[],
    numberOfRowsInJson: number
): string[] {
    const errorArray: string[] = [];

    definedCountColumns.forEach((definedCountColumn: any) => {
        const columnName = definedCountColumn.columnName.trim();
        //don't assume that each row has the same label for each column
        const rowObj = rowsArray.find((row) => row.positionInTable === definedCountColumn.rowPosition);
        if (rowObj) {
            const f = rowObj.rowColumns.find((rowColumn: any) => rowColumn.columnLabel.trim() === columnName);
            if (!f) {
                errorArray.push(
                    `defineColumnTotals.columns.columnName: '${columnName}' was not found in the rows array.`
                );
            }
        } else {
            errorArray.push(
                `defineColumnTotals.columns.columnName: '${columnName}' was not found in row number ${definedCountColumn.rowPosition}.`
            );
            return errorArray;
        }

        if (definedCountColumn.rowPosition > numberOfRowsInJson) {
            errorArray.push(
                `defineColumnTotals.columns.columnName: '${columnName}' value for row number: '${definedCountColumn.rowPosition}' colName: '${columnName}' -- is out of range.`
            );
        }
        if (definedCountColumn.rowPosition < 1) {
            errorArray.push(
                `defineColumnTotals.columns.columnName: '${columnName}' value for row number: '${definedCountColumn.rowPosition}' can't be less than 1.`
            );
        }
    });
    return errorArray;
}

/**
 * Validate that the user has selected either a webmap or webscene for the GATE mission.
 * @param mission mission data object
 */
export function validateMissionMapItem(mission: MissionState): string[] {
    const messageArray = [];
    if (mission.gateMapType !== undefined) {
        if (mission.mapItem === undefined) {
            messageArray.push('GATE Map');
        }
    }
    return messageArray;
}

/**
 *
 * @param mission mission data object
 */
export function validateMissionState(mission: MissionState): string[] {
    const messageArray = [];
    if (!mission.name || mission.name.trim() === '') {
        messageArray.push('A mission name needs to be defined.');
    }
    if (!mission.description || mission.description.trim() === '') {
        messageArray.push('A mission description needs to be added.');
    }
    if (!mission.managerNames || mission.managerNames.trim() === '') {
        messageArray.push('A mission manager needs to be added.');
    }
    // Add Category if required
    return messageArray;
}

/**
 *
 * @param mission mission data object
 * @param appConfig
 */
export async function createSceneFromMissionMapItem(
    mission: MissionState,
    appConfig: AppConfig
): Promise<WebScene | any> {
    const mapItem = mission.mapItem;
    const config = ConfigHelper.getAppConfig();
    const elevationUrl = config.elevationUrl;

    if (
        mapItem &&
        mapItem.portalItem &&
        (mapItem.portalItem.type === 'Basemap' || mapItem.portalItem.type === 'Web Map')
    ) {
        return createSceneFromBasemapId(mapItem.portalItem.id, elevationUrl);
    } else if (mapItem && mapItem.type === 'Web Map') {
        return convertWebMapToWebScene(mapItem, appConfig);
    } else if (mapItem && mapItem.type === config.types.webScene) {
        return createSceneFromSceneId(mapItem.id);
    } else {
        console.error('There is no basemap or scene in the current mission state. Using the default webscene.');
        return createSceneFromSceneId(config.defaultWebSceneId);
    }
}

function stripUnsupportedValueExpressions(layer: __esri.Layer) {
    if (layer.type !== 'feature') return;

    const featureLayer = layer as FeatureLayer;
    const renderer = featureLayer.renderer;

    if (!renderer || !('visualVariables' in renderer)) return;

    let changed = false;
    const updatedVisualVariables = renderer.visualVariables?.map((visualVariable) => {
        if ('valueExpression' in visualVariable && visualVariable.valueExpression?.includes('$view')) {
            // Remove only the valueExpression, leave the rest of the object intact
            const { valueExpression, ...rest } = visualVariable;
            changed = true;
            console.warn(`Stripped unsupported valueExpression from visualVariable in layer: ${layer.title}`);
            return rest;
        }
        return visualVariable;
    });

    if (changed) {
        const newRenderer = renderer.clone();
        newRenderer.visualVariables = updatedVisualVariables as any;
        featureLayer.renderer = newRenderer;
    }
    return featureLayer;
}

/**
 * Convert a web map object to a scene for the mission.
 * @param mapItem Mission map item
 * @param appConfig application config for specific data
 */
export const convertWebMapToWebScene = async (mapItem: any, appConfig: AppConfig): Promise<WebScene> => {
    const webMap = new WebMap({
        portalItem: new PortalItem({
            id: mapItem.id,
        }),
    });
    await webMap.load();
    try {
        const newScene = createSceneFromSceneId(appConfig.defaultWebSceneId);
        const layerArray = webMap.layers.toArray();
        // Set elevationInfo to feature layers
        layerArray.forEach((layer: any) => {
            if (layer.type === 'feature') {
                layer.elevationInfo = {
                    mode: 'on-the-ground',
                };
                // remove $view.scale value expression as it will break scene layers.
                stripUnsupportedValueExpressions(layer);
            }
            //add layers to scene
            newScene.add(layer);
        });

        return newScene;
    } catch (err) {
        console.error('Error creating scene:', err);
        throw err;
    }
};

export const getPortalCategories = (mission: MissionState): string[] => {
    const expandedCategories = [];

    if (mission.expandedCategories) {
        for (const category of mission.expandedCategories) {
            expandedCategories.push(category.name);
        }
    }

    const categories = [];

    if (expandedCategories.length) {
        categories.push(`/Categories/${expandedCategories.reverse().join('/')}`);
    }

    return categories;
};
