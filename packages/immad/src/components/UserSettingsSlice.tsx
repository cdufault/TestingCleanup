import { createSlice } from '@reduxjs/toolkit';

/** type to define state for the user's settings. */
export type userSettingsItem = {
    /** indicates if the atmosphere is enabled  */
    atmosphereIsEnabled: boolean;
    lightingIsEnabled: boolean;
};

/** the default slice values*/
const initialState: userSettingsItem = {
    atmosphereIsEnabled: false,
    lightingIsEnabled: true,
};

/** Holds the data for user settings. */
export const userSettingsSlice = createSlice({
    name: 'userSettings',
    initialState: initialState,
    reducers: {
        /*
            The workflow appears to go as follows:
            UserSettings context pulls the value from state, gets it from the appConfig JSON, or
            uses a default value (false).
            UserSettings context will then update this slice method.
            The slice value will then be read/set by DisplaySettings when the form is loaded 
            and/or when the value in the form is changed. 
        */
        updateAtmosphereIsEnabled: (state, action) => {
            state.atmosphereIsEnabled = action.payload;
        },
        updateLightingIsEnabled: (state, action) => {
            state.lightingIsEnabled = action.payload;
        },
    },
});

export const { updateAtmosphereIsEnabled, updateLightingIsEnabled } = userSettingsSlice.actions;
export default userSettingsSlice.reducer;
