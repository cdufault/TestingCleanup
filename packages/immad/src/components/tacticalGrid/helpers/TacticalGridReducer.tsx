/** describes the UI settings for the tactical grid */
export interface TacticalGridSettings {
    rowHeight: string;
    visibleRowCount: string;
    isDirty: boolean;
}

/**
 * Reducer action's data structure.
 */
export interface TGridAction {
    type: string;
    payload: any | any[];
}

/**
 * Interface decribing this reducer.
 */
export interface TacticalGridSettingsState {
    tacticalGridSettings: TacticalGridSettings;
}

/**
 * Action that can be performed on this reducer.
 */
export const Actions = {
    UPDATE_TACTCIAL_GRID_SETTINGS: 'update_tactical_grid_settings',
};

/**
 * Component that comprise the data for creating and/or updating a mission.
 */
export const initTacticalGridState: TacticalGridSettingsState = {
    tacticalGridSettings: {
        rowHeight: '35',
        visibleRowCount: '25',
        isDirty: true,
    },
};

export function missionStateReducer(state: TacticalGridSettingsState, action: TGridAction): TacticalGridSettingsState {
    switch (action.type) {
        case Actions.UPDATE_TACTCIAL_GRID_SETTINGS:
            return { ...state, tacticalGridSettings: action.payload };
        default:
            return state;
    }
}
