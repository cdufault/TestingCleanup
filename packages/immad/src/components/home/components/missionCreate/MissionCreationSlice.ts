import { createSlice } from '@reduxjs/toolkit';

/** type to define state for the classification. */
type missionCreationItem = {
    /** immad admin group users  */
    immadAdminUserNames: string[];

    /** immad mission manager group users */
    immadMissionMgrUserNames: string[];

    /**users currently in the mission as analysts */
    analystsInTheMission: string[] | undefined;

    isEditSession: boolean;
};
/** the default slice values*/
const initialState: missionCreationItem = {
    immadAdminUserNames: [],
    immadMissionMgrUserNames: [],
    analystsInTheMission: undefined,
    isEditSession: false,
};

/** Holds the data and actions for updating relevant to the mission creation data. */
export const missionCreationSlice = createSlice({
    name: 'classification',
    initialState: initialState,
    reducers: {
        updateImmadAdminUserNames: (state, action) => {
            state.immadAdminUserNames = [...action.payload];
        },
        updateImmadMMgrsUserNames: (state, action) => {
            state.immadMissionMgrUserNames = [...action.payload];
        },
        updateAnalystsInTheMission: (state, action) => {
            if (action.payload) {
                state.analystsInTheMission = [...action.payload];
            } else {
                state.analystsInTheMission = undefined;
            }
        },
        updateIsEditSession: (state, action) => {
            state.isEditSession = action.payload;
        },
    },
});

export const { updateImmadAdminUserNames, updateImmadMMgrsUserNames, updateAnalystsInTheMission, updateIsEditSession } =
    missionCreationSlice.actions;
export default missionCreationSlice.reducer;
