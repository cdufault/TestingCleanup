import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';

//interface to define state for the landing page card.
interface CalendarPageItems {
    /**The Error object if landing page data can't be retrieved from portal */
    error: Error | null;
    /** features from the calendar feature layer */
    calendarFeatures: any[];
    /** loading indicator */
    loading: boolean;
}

/** Represents the query params needed to query by name  */
export interface QueryParams {
    /** Names to query */
    names: string[];
    /** Portal Item id of feature class to query from */
    portalItemId: string;
}

/**Base store state on app startup */
const initialState: CalendarPageItems = {
    calendarFeatures: [],
    loading: false,
    error: null,
};
/**
 * Fetch features by name from a feature layer.
 * Takes an array of names and a portal feature layer id to query that feature layer
 * for only the features that have the name(s) from the array passed in.
 * @param QueryParams as defined by QueryParams interface
 */
export const fetchFeaturesByNames = createAsyncThunk<any[], QueryParams, { rejectValue: string }>(
    'landingPageSlice/fetchFeaturesByNames',
    async (params, { rejectWithValue }) => {
        try {
            const { names, portalItemId } = params;
            const calendarLayer = new FeatureLayer({
                portalItem: {
                    id: portalItemId,
                },
            });
            const where = `region_name IN ('${names.join("','")}')`;
            const outFields: string[] = ['*'];
            const query = calendarLayer.createQuery();
            query.outFields = outFields;
            query.where = where;
            query.returnGeometry = false;

            return await calendarLayer.queryFeatures(query).then((result) => {
                return result.features.map((feature) => {
                    // need to remove _attributesConstructor from each item as it is dynamic object and not needed.
                    const { _attributesConstructor, ...rest } = feature.attributes;
                    return rest;
                });
            });
        } catch (err) {
            return rejectWithValue('Failed to fetch calendar features.');
        }
    }
);

export const calendarPageSlice = createSlice({
    name: 'calendarPage',
    initialState: initialState as CalendarPageItems,
    reducers: {
        setError: (state, action) => {
            state.error = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchFeaturesByNames.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchFeaturesByNames.fulfilled, (state, action: PayloadAction<any[]>) => {
                state.loading = false;
                state.error = null;
                state.calendarFeatures = action.payload;
            })
            .addCase(fetchFeaturesByNames.rejected, (state, action) => {
                state.loading = false;
                state.error = new Error(action.payload as string);
                state.calendarFeatures = [];
            });
    },
});

export const { setError } = calendarPageSlice.actions;
export default calendarPageSlice.reducer;
