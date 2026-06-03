import { createSlice } from '@reduxjs/toolkit';
import { OpsClockDataSerializable } from '@stratcom/react-widget-lib/types/OpsClockWidgetLib';

/** type to define state for the classification. */
type saveState = {
    /** The clocks from the mission object */
    existingClocksList: OpsClockDataSerializable[];
};
/** the saved base object with only the required values */
const initialState: saveState = {
    existingClocksList: [],
};
/** Holds the data and actions for updating relevant to the save state clocks data. */
export const saveStateSlice = createSlice({
    name: 'saveState',
    initialState: initialState,
    reducers: {
        setExistingClocksList: (state, action) => {
            if (action.payload !== undefined) {
                return {
                    ...state,
                    existingClocksList: action.payload,
                };
            }
        },
    },
});
export const { setExistingClocksList } = saveStateSlice.actions;
export default saveStateSlice.reducer;
