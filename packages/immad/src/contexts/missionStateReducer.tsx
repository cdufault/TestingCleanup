import WebScene from '@arcgis/core/WebScene';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Sketch from '@arcgis/core/widgets/Sketch';
import Basemap from '@arcgis/core/Basemap';
import { IItem, IUser } from '@esri/arcgis-rest-portal';
import Extent from '@arcgis/core/geometry/Extent';
import { GateMapType, MissionType } from '../hooks/missionHooks';
import WebMap from '@arcgis/core/WebMap';
import { StratLeadExpiration } from '../components/tacticalGrid/interfaces/StratLead';
import { RenderTree } from '../components/recursiveTreeView/RecursiveTreeView';
import { gateColumnHeaderObject } from '@stratcom/lib-functions';

/**
 * Interface that represents an object that holds the values needed to map a Tactical Grid layer attribute to a SMART data attribute.
 */
export interface TGridToSmartMapping {
    id: string;
    systemFieldName: string;
    tacticalGridFieldName: string;
    mapped: string | undefined;
    ellipseRole?: string;
    ellipseUnit?: string;
}

/**
 * Interface describing this reducer.
 */
export interface MissionState {
    supportsMappedGridFieldsToSMARTFields: boolean;
    tacticalGridToSMARTFieldMappings: TGridToSmartMapping[];
    tacticalGridLayerURL: string;
    name?: string;
    managerNames?: string;
    groupOwner?: string;
    currentUser?: string;
    isImmadAdmin: boolean;
    region?: string;
    description?: string;
    countsWidgetJson: string;
    categories?: RenderTree[];
    selectedCategory: string;
    expandedCategories: RenderTree[];
    mapItem?: WebScene | Basemap | WebMap | undefined | any; //basemap or scene
    webTools: IItem[];
    analystNames?: string[];
    analysts: IUser[];
    extent?: Extent;
    webScene?: WebScene; //saving
    gLayer?: GraphicsLayer;
    sketchWidget?: Sketch;
    dataFeeds: IItem[];
    portalGroupId: string;
    missionType: MissionType;
    gateMapType: GateMapType;
    supportsTacticalGrid: boolean;
    tacticalGridLayerGuid: string;
    missionConfigJson: string;
    tacticalGridLayerLayerName: string;
    stratLeadExpirations: StratLeadExpiration[];
    supportsCustomStratLeadExpiration: boolean;
    viewMode: string;
    dashboardId: string;
    isExercise: boolean;
    isExerciseWhenLoaded: boolean;
    missionIsCopy: boolean;
    gateMissionColumnNames?: gateColumnHeaderObject;
    createNewScene: boolean;
}

/**
 * Action that can be performed on this reducer.
 */
export const Actions = {
    UPDATE_SUPPORTS_TGRID_TO_SMART_MAPPING: 'update_supports_tgrid_to_smart_mapping',
    UPDATE_TGRID_TO_SMART_FIELD_MAPPING: 'update_tgrid_to_smart_field_mapping',
    UPDATE_TACTICAL_GRID_LAYER_URL: 'update_tactical_grid_layer_url',
    UPDATE_STRATLEAD_EXPIRATIONS: 'update_stratlead_expirations',
    NONE: 'none',
    UPDATE_BASEMAP: 'update_basemap',
    UPDATE_WEBSCENE: 'update_webscene',
    UPDATE_METADATA: 'update_metadata',
    ADD_TOOL: 'add_tool',
    REMOVE_TOOL: 'remove_tool',
    ADD_ANALYST: 'add_analyst',
    REMOVE_ANALYST: 'remove_analyst',
    UPDATE_EXTENT: 'update_extent',
    ADD_DATAFEED: 'add_datafeed',
    REMOVE_DATAFEED: 'remove_datafeed',
    CLEAR_DATAFEEDS: 'clear_datafeeds',
    UPDATE_SKETCH: 'update_sketch',
    UPDATE_GLAYER: 'update_glayer',
    UPDATE_EXTENT_WEBSCENE: 'update_extent_webscene',
    UPDATE_MGRNAMES: 'update_mgrnames',
    UPDATE_PORTALGROUPID: 'update_portal_groupid',
    UPDATE_GROUP_OWNER: 'update_group_owner',
    UPDATE_CURRENT_USER: 'update_current_user',
    UPDATE_IS_IMMAD_ADMIN: 'update_is_immad_admin',
    UPDATE_ANALYST_NAMES: 'update_analyst_names',
    UPDATE_MISSION_TYPE: 'update_mission_type',
    UPDATE_GATE_MAP_TYPE: 'update_gate_map_type',
    SUPPORT_TACTICAL_GRID: 'support_tactical_grid',
    TACTICAL_GRID_LAYER_GUID: 'tactical_grid_layer_guid',
    UPDATE_MISSION_CONFIG_JSON: 'update_mission_config_json',
    UPDATE_MISSION_REGION_COLUMN_JSON: 'update_mission_region_column_json',
    UPDATE_TACTICAL_GRID_LAYER_NAME: 'updated_tactical_grid_layer_name',
    SUPPORTS_CUSTOM_STRATLEAD_EXPIRATION: 'supports_custom_stratlead_expiration',
    UPDATE_VIEW_MODE: 'update_view_mode',
    UPDATE_DASHBOARD_ID: 'update_dashboard_id',
    UPDATE_IS_EXERCISE: 'update_is_exercise',
    UPDATE_IS_EXERCISE_WHEN_LOADED: 'update_is_exercise_when_loaded',
    UPDATE_MISSION_IS_COPY: 'mission_is_copy',
    UPDATE_CREATE_NEW_SCENE: 'create_new_scene',
};

/**
 * Empty placeholder for the tactical grid JSON data.
 */
const missionConfigTemplate = {
    widgets: [],
};

/**
 * Template for GATE Missions columns for summary landing page cards.
 */
export const gateMissionColumnTemplate: gateColumnHeaderObject = {
    column1: 'Categories',
    column2: 'Levels',
    column3: 'Expectations',
    column4: 'Comments',
};

/**
 * Reducer action's data structure.
 */
export interface MissionAction {
    type: string;
    payload: any | any[];
}

/**
 * Component that comprises the data for creating and/or updating a mission.
 */
export const initMissionState: MissionState = {
    supportsMappedGridFieldsToSMARTFields: false,
    tacticalGridToSMARTFieldMappings: [],
    tacticalGridLayerURL: '',
    name: '',
    managerNames: '',
    groupOwner: '',
    currentUser: '',
    isImmadAdmin: false,
    region: '',
    description: '',
    countsWidgetJson: '',
    categories: [],
    expandedCategories: [],
    selectedCategory: '',
    webScene: undefined,
    gLayer: undefined,
    sketchWidget: undefined,
    mapItem: undefined,
    dataFeeds: [],
    webTools: [],
    analystNames: [],
    analysts: [],
    extent: undefined,
    portalGroupId: '',
    missionType: 'IMMAD Mission',
    gateMapType: undefined,
    supportsTacticalGrid: false,
    tacticalGridLayerGuid: '',
    missionConfigJson: JSON.stringify(missionConfigTemplate),
    tacticalGridLayerLayerName: '',
    stratLeadExpirations: [],
    supportsCustomStratLeadExpiration: false,
    viewMode: '3D',
    dashboardId: '',
    isExercise: false,
    isExerciseWhenLoaded: false,
    missionIsCopy: false,
    gateMissionColumnNames: gateMissionColumnTemplate,
    createNewScene: false,
};

/**
 * The main function used when support the Reducer pattern. All interested code is passed a dispatch method that calls this method to modify state.
 * @param state the current state
 * @param action the action to take on the current state ie: update, change, or delete some data value -- plus optionally a data payload
 */
export function missionStateReducer(state: MissionState, action: MissionAction): MissionState {
    switch (action.type) {
        case Actions.SUPPORTS_CUSTOM_STRATLEAD_EXPIRATION:
            return { ...state, supportsCustomStratLeadExpiration: action.payload };
        case Actions.UPDATE_BASEMAP:
            return { ...state, mapItem: action.payload.item };
        case Actions.UPDATE_WEBSCENE:
            return { ...state, mapItem: action.payload.item };
        case Actions.UPDATE_METADATA: {
            const metadata = {
                name: action.payload.name ? action.payload.name : '',
                region: action.payload.region ? action.payload.region : '',
                description: action.payload.description ? action.payload.description : '',
                countsWidgetJson: action.payload.countsWidgetJson ? action.payload.countsWidgetJson : '',
                managerNames: action.payload.managerNames ? action.payload.managerNames : '',
                categories: action.payload.categories,
                selectedCategory: action.payload.selectedCategory,
                expandedCategories: action.payload.expandedCategories,
                hasCustomStratLeadExpiration: action.payload.hasCustomStratLeadExpiration,
                stratLeadExpirations: action.payload.stratLeadExpirations,
            };

            return {
                ...state,
                name: metadata.name,
                region: metadata.region,
                description: metadata.description,
                countsWidgetJson: metadata.countsWidgetJson,
                managerNames: metadata.managerNames,
                categories: metadata.categories,
                selectedCategory: metadata.selectedCategory,
                expandedCategories: metadata.expandedCategories,
                stratLeadExpirations: metadata.stratLeadExpirations,
            };
        }
        case Actions.ADD_ANALYST: {
            const allAnalysts = [...state.analysts];
            allAnalysts.push(action.payload.item);
            return { ...state, analysts: allAnalysts };
        }
        case Actions.REMOVE_ANALYST: {
            const allAnalysts = state.analysts.filter((analyst) => {
                return analyst.id != action.payload.item.id;
            });
            return { ...state, analysts: allAnalysts };
        }
        case Actions.REMOVE_DATAFEED: {
            const filteredFeeds = state.dataFeeds.filter((feed) => feed.id != action.payload.item.id);
            return { ...state, dataFeeds: filteredFeeds };
        }
        case Actions.UPDATE_ANALYST_NAMES: {
            return { ...state, analystNames: action.payload.item };
        }
        case Actions.UPDATE_MGRNAMES: {
            return { ...state, managerNames: action.payload.item };
        }
        case Actions.ADD_DATAFEED: {
            const allFeeds = [...state.dataFeeds];
            allFeeds.push(action.payload.item);
            return { ...state, dataFeeds: allFeeds, extent: undefined }; //clear extent if a new layer is added
        }
        case Actions.CLEAR_DATAFEEDS: {
            return { ...state, dataFeeds: action.payload.item }; //pass empty array to clear
        }
        case Actions.REMOVE_TOOL: {
            const filteredTools = state.webTools.filter((tool) => tool.id != action.payload.item.id);
            return { ...state, webTools: filteredTools };
        }
        case Actions.ADD_TOOL: {
            const allTools = [...state.webTools];
            allTools.push(action.payload.item);
            return { ...state, webTools: allTools };
        }
        case Actions.UPDATE_GLAYER: {
            return { ...state, gLayer: action.payload.item };
        }
        case Actions.UPDATE_SKETCH: {
            return { ...state, sketchWidget: action.payload.item };
        }
        case Actions.UPDATE_EXTENT_WEBSCENE: {
            return { ...state, webScene: action.payload.item };
        }
        case Actions.UPDATE_PORTALGROUPID: {
            return { ...state, portalGroupId: action.payload.item };
        }
        case Actions.UPDATE_EXTENT: {
            return { ...state, extent: action.payload.item };
        }
        case Actions.UPDATE_GROUP_OWNER: {
            return { ...state, groupOwner: action.payload };
        }
        case Actions.UPDATE_CURRENT_USER: {
            return { ...state, currentUser: action.payload };
        }
        case Actions.UPDATE_IS_IMMAD_ADMIN: {
            return { ...state, isImmadAdmin: action.payload };
        }
        case Actions.UPDATE_GATE_MAP_TYPE: {
            return { ...state, gateMapType: action.payload };
        }
        case Actions.SUPPORT_TACTICAL_GRID:
            return { ...state, supportsTacticalGrid: action.payload };
        case Actions.TACTICAL_GRID_LAYER_GUID:
            return { ...state, tacticalGridLayerGuid: action.payload };
        case Actions.UPDATE_MISSION_CONFIG_JSON:
            return { ...state, missionConfigJson: action.payload };
        case Actions.UPDATE_MISSION_REGION_COLUMN_JSON:
            return { ...state, gateMissionColumnNames: action.payload };
        case Actions.UPDATE_TACTICAL_GRID_LAYER_NAME:
            return { ...state, tacticalGridLayerLayerName: action.payload };
        case Actions.UPDATE_TACTICAL_GRID_LAYER_URL:
            return { ...state, tacticalGridLayerURL: action.payload };
        case Actions.UPDATE_SUPPORTS_TGRID_TO_SMART_MAPPING:
            return { ...state, supportsMappedGridFieldsToSMARTFields: action.payload };
        case Actions.UPDATE_TGRID_TO_SMART_FIELD_MAPPING:
            return { ...state, tacticalGridToSMARTFieldMappings: action.payload };
        case Actions.UPDATE_STRATLEAD_EXPIRATIONS:
            return { ...state, stratLeadExpirations: action.payload };
        case Actions.UPDATE_VIEW_MODE:
            return { ...state, viewMode: action.payload };
        case Actions.UPDATE_DASHBOARD_ID: {
            return { ...state, dashboardId: action.payload };
        }
        case Actions.UPDATE_IS_EXERCISE: {
            return { ...state, isExercise: action.payload };
        }
        case Actions.UPDATE_IS_EXERCISE_WHEN_LOADED: {
            return { ...state, isExerciseWhenLoaded: action.payload };
        }
        case Actions.UPDATE_MISSION_IS_COPY: {
            return { ...state, missionIsCopy: action.payload };
        }
        case Actions.UPDATE_CREATE_NEW_SCENE: {
            return { ...state, createNewScene: action.payload };
        }
        default:
            return state;
    }
}
