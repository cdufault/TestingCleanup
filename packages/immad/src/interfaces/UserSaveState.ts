import { OpsClockDataSerializable } from '@stratcom/react-widget-lib/types/OpsClockWidgetLib';
import {IJsonModel} from "flexlayout-react";

/**
 * User Save Object Json
 * Used for storing user saved state information
 */
export interface IUserSaveState {
    defaultWebSceneId: string;
    defaultWebMapId: string;
    workspaces: WorkSpaceItem[];
    lastSavedMission: string;
    currentWorkspace: string;
    lastSavedPortalItemId: string;
    viewType: string;
    tacticalGridState?: TacticalGridState[];
    layout?: IJsonModel;
    manualClassifications?: ManualClassificationInfo[];
}

/**
 * User Save Work Space item Json
 * Used for storing user work space saved state information
 */
export type WorkSpaceItem = {
    lastSaved: string; // time stamp
    viewType: string;
    missionValue: string;
    viewNameValue: string; // current release default/workspace
    workspaceId: string; // regionValue_missionValue_viewNameValue or guid
    portalItemId: string; // portalItemId is the Scene or Map PortalItemID
    mapView: { extent: string; center: string; scale: number; zoom: number; viewpoint: string }; // may move to workspace item
    sceneView: {
        camera: {
            fov: number;
            heading: number;
            position: {
                spatialReference: {
                    wkid: number;
                };
                x: number;
                y: number;
                z: number;
            };
            tilt: number;
        };
    }; // may move to workspace item
    gpTaskList?: string[]; // do these need to be here or are we keeping a overall total of them store just id's to another table with the actual data
    bookmarks?: string; // not implemented yet
    title?: string; // optional
    id?: string; // optional
    manualClassifications?: ManualClassificationInfo[];
    opsClocks: OpsClockDataSerializable[];
};

export interface TacticalGridState {
    missionId: string;
    properties: TacticalGridProperties;
}

/**Setting for the tactical grid */
export interface ITacticalGridSettings {
    rowHeight: string;
    visibleRowCount: string;
}

/**
 * Tactical grid user settings object
 */
export interface TacticalGridProperties {
    columnState?: string;
    filterState?: string;
    refreshRate?: string;
    highlightTimeout?: string;
    tacticalGridSettings?: ITacticalGridSettings;
}

/**
 * Saves manual classification sets per workspace
 */
export interface ManualClassificationInfo {
    layerId: string;
    licenseInfo: string;
}
