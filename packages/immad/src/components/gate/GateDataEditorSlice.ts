import { createSlice } from '@reduxjs/toolkit';
import { ApplicationItem } from './GateDataEditorHelper';
import { GateCalendarEventSerializable } from '@stratcom/lib-functions';

export interface GateCalendarEditorInfo {
    missionIsExercise: boolean;
    applicationItems: ApplicationItem[];
    selectedEventToEdit: GateCalendarEventSerializable;
    isUpdate: boolean;
    deleteFutureEvents: boolean;
    updateFutureEvents: boolean;
    currentMissionName: string;
}

const initialState: GateCalendarEditorInfo = {
    missionIsExercise: false,
    applicationItems: [],
    selectedEventToEdit: {
        region_name: '',
        objectid: '',
        globalid: '',
        event_name: '',
        date_start: 0,
        date_end: 0,
        location: null,
        description: '',
        participants: '',
        recurring: 0,
        initial_date: 0,
        recurrence_type: null,
        recurrence_pattern: null,
        recurrence_end_date: null,
        number_of_occurrences: 0,
        is_child_record: 0,
        is_master_record: 0,
        parent_guid: null,
        number_of_days: 0,
        important_anniversary: 0,
        comments: '',
        classification: 'Unclassified',
        highlight: false,
        alternate_calendar: null,
        icod: undefined,
    },
    isUpdate: false,
    deleteFutureEvents: false,
    updateFutureEvents: false,
    currentMissionName: '',
};

/** to track elements across files used for the calendar widget and gate data editor */
export const gateCalendarEditorSlice = createSlice({
    name: 'gateCalendarEditor',
    initialState: initialState,
    reducers: {
        setMissionIsExercise: (state, action) => {
            state.missionIsExercise = action.payload;
        },
        setApplicationItems: (state, action) => {
            // Sort the applicationItems array by name
            const sortedItems = action.payload.slice().sort((a: ApplicationItem, b: ApplicationItem) => {
                return a.title.localeCompare(b.title);
            });
            // remove any duplicates
            const uniqueMap = new Map();
            sortedItems.forEach((item: ApplicationItem) => {
                uniqueMap.set(item.id, item);
            });
            state.applicationItems = Array.from(uniqueMap.values());
        },
        setSelectedEventToEdit: (state, action) => {
            state.selectedEventToEdit = action.payload;
        },
        setIsUpdate: (state, action) => {
            state.isUpdate = action.payload;
        },
        setDeleteFutureEvents: (state, action) => {
            state.deleteFutureEvents = action.payload;
        },
        setUpdateFutureEvents: (state, action) => {
            state.updateFutureEvents = action.payload;
        },
        setCurrentMissionName: (state, action) => {
            state.currentMissionName = action.payload;
        },
    },
});

export const {
    setApplicationItems,
    setMissionIsExercise,
    setSelectedEventToEdit,
    setIsUpdate,
    setDeleteFutureEvents,
    setUpdateFutureEvents,
    setCurrentMissionName,
} = gateCalendarEditorSlice.actions;

export default gateCalendarEditorSlice.reducer;
