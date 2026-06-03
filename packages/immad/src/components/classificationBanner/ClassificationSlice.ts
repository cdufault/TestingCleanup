import { createSlice } from '@reduxjs/toolkit';
import { ClassificationMarking, ClassificationItem } from '@stratcom/lib-functions/types/interfaces/Classification';

/** type to define state for the classification. */
type classificationItem = {
    /** The overall system classification   */
    classificationMarking: ClassificationMarking;
    /** Set to true if the list has at least one unknown classification, disabling the dynamic banner.   */
    hasUnknownClassification: boolean;
    /** Set to true to enable dynamic classification, or false to disable it and show the static system high message.  */
    isDynamicClassificationEnabled: boolean;
    /** The items whose classifications are used to determine the overall application classification. */
    classificationItems: ClassificationItem[];
};
/** the classification base object with only the required values */
const initialState: classificationItem = {
    classificationMarking: {
        classification: '',
        banner: '',
    },
    hasUnknownClassification: false,
    isDynamicClassificationEnabled: true,
    classificationItems: [],
};
/** Holds the data and actions for updating relevant to the classification data. */
export const classificationSlice = createSlice({
    name: 'classification',
    initialState: initialState,
    reducers: {
        resetClassification: (state) => {
            state.classificationItems = [];
            state.classificationMarking = {
                classification: '',
                banner: '',
            };
        },
        setClassificationMarking: (state, action) => {
            state.classificationMarking = action.payload;
        },
        setHasUnknownClassification: (state, action) => {
            state.hasUnknownClassification = action.payload;
        },
        setIsDynamicClassificationEnabled: (state, action) => {
            state.isDynamicClassificationEnabled = action.payload;
        },
        setClassificationItems: (state, action) => {
            // Replace the entire array with the new array
            if (action.payload !== undefined) {
                state.classificationItems = action.payload;
            }
        },
        addClassificationItem: (state, action) => {
            // Add a new item to the classificationItems array
            const existing = state.classificationItems.find((classItem) => classItem.id === action.payload.id);
            if (!existing) {
                state.classificationItems.push(action.payload);
            }
        },
        removeClassificationItem: (state, action) => {
            // Remove an item from the classificationItems array by filtering it out
            state.classificationItems = state.classificationItems.filter((item) => item.id !== action.payload.id);
        },
    },
});
export const {
    resetClassification,
    setClassificationMarking,
    setHasUnknownClassification,
    setIsDynamicClassificationEnabled,
    setClassificationItems,
    addClassificationItem,
    removeClassificationItem,
} = classificationSlice.actions;
export default classificationSlice.reducer;
