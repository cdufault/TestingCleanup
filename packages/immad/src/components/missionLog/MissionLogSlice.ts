import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import Geometry from '@arcgis/core/geometry/Geometry';
import { RMTQueryMetadata } from '../administrator/components/AdminSettingsSlice';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { parseMessage } from './MissionLogParser';
import { runRMTQuery } from './QueryRMTFeatures';
import { RootState } from '../../data/store';

/**
 * Fetch features by name from the mission log feature layer.
 * Takes a portal feature layer id and the rmt data to query the feature layer to then push to an array for display in
 * the mission log summary/ mission log tab
 * @param QueryParams as defined by QueryParams interface
 */
export const queryMessageData = createAsyncThunk<number, QueryParams, { state: RootState; rejectValue: string }>(
    'missionLog/queryMessageData',
    async (params, thunkAPI) => {
        const { portalItemId, rmtData, page, pageSize, orderByField, order } = params;
        const { dispatch, getState, signal, requestId, rejectWithValue } = thunkAPI;

        // helper to know if *this* thunk is now stale
        const isStale = () => getState().missionLogSlice.activeRequestId !== requestId;

        // build your ArcGIS query…
        const layer = new FeatureLayer({ portalItem: { id: portalItemId } });
        const query = layer.createQuery();
        query.outFields = ['objectid', 'full_message'];
        query.where = '1=1';
        query.orderByFields = [orderByField + ' ' + order];
        query.returnGeometry = false;
        query.start = (page - 1) * pageSize;
        query.num = pageSize;

        try {
            // fire both data + count in parallel
            const [featureSet, totalCount] = await Promise.all([
                layer.queryFeatures(query),
                layer.queryFeatureCount(query),
            ]);

            dispatch(missionLogSlice.actions.setTotalRecords(totalCount));

            // now parse one‑by‑one, aborting if stale fixes race condition when switching pages while still parsing results.
            for (const feat of featureSet.features) {
                if (signal.aborted || isStale()) break;

                const { objectid, full_message } = feat.attributes as any;
                const result = await parseMessage(full_message, rmtData);
                if (signal.aborted || isStale() || !result) break;

                result.messages[0].header.objectId = objectid;
                const enriched = await runRMTQuery(rmtData, result.messages[0]);
                if (signal.aborted || isStale()) break;

                if (enriched) {
                    dispatch(missionLogSlice.actions.addParsedMessage(enriched));
                }
            }

            // if we made it here, return the count
            return totalCount ?? 0;
        } catch (err) {
            if (signal.aborted || isStale()) {
                return rejectWithValue('Query was cancelled');
            }
            console.error(err);
            return rejectWithValue('Failed to fetch mission log features.');
        }
    }
);

/**describes a RMT feature object */
export interface IFtrAttributeValueObj {
    [key: string]: string | number | Date | Geometry;
}
export interface NewtHeader {
    type: string;
    category: string;
    metadata: string;
    timeStamp: string;
    totalQuantity: number;
    objectId?: number;
}

/**describes the components of a NEWT message item */
export interface NewtMessage {
    codeAlias: string;
    order: number;
    origin: string | number;
    value: IFtrAttributeValueObj[] | string | undefined;
    count: number;
}

/**Describes the parsed NEWT message */
export interface NewtMessageEnvelope {
    header: NewtHeader;
    message: {
        [key: string]: NewtMessage[];
    };
}

export interface MissionLogInfo {
    messages: NewtMessageEnvelope[];
    dataSourceErrors?: string[];
    loading: boolean;
    error: Error | null;
    currentPage: number;
    pageSize: number;
    hasMore: boolean;
    totalRecords: number | null;
    activeRequestId: string | undefined;
}

/** Represents the query params needed to query by name  */
export interface QueryParams {
    /** Names to query */
    portalItemId: string;
    /** Portal Item id of feature class to query from */
    rmtData: RMTQueryMetadata[];
    page: number;
    pageSize: number;
    orderByField: string;
    order: string;
}

const initialState: MissionLogInfo = {
    messages: [],
    dataSourceErrors: [],
    loading: false,
    error: null,
    currentPage: 1,
    pageSize: 10,
    hasMore: true,
    totalRecords: null,
    activeRequestId: undefined,
};

/** to track elements across files used for the mission log widget */
export const missionLogSlice = createSlice({
    name: 'missionLog',
    initialState: initialState,
    reducers: {
        updateMessages: (state, action) => {
            state.messages = action.payload;
        },
        setPage: (state, action: PayloadAction<number>) => {
            state.currentPage = action.payload;
        },
        setPageSize: (state, action: PayloadAction<number>) => {
            state.pageSize = action.payload;
            state.currentPage = 1;
        },
        addParsedMessage: (state, action: PayloadAction<NewtMessageEnvelope>) => {
            state.messages.push(action.payload);
        },
        setTotalRecords: (state, action: PayloadAction<number>) => {
            state.totalRecords = action.payload;
            state.hasMore = state.currentPage * state.pageSize < action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(queryMessageData.pending, (state, action) => {
                state.loading = true;
                state.error = null;
                state.messages = [];
                state.activeRequestId = action.meta.requestId;
            })
            .addCase(queryMessageData.fulfilled, (state, action) => {
                // only accept if still the latest
                if (state.activeRequestId !== action.meta.requestId) return;
                state.loading = false;
                state.totalRecords = action.payload;
                state.hasMore = state.currentPage * state.pageSize < action.payload;
                state.activeRequestId = undefined;
            })
            .addCase(queryMessageData.rejected, (state, action) => {
                if (state.activeRequestId !== action.meta.requestId) return;
                state.loading = false;
                state.error = action.payload ? new Error(action.payload) : new Error(action.error.message);
                state.activeRequestId = undefined;
            });
    },
});

export const { updateMessages, setPage, setPageSize, addParsedMessage, setTotalRecords } = missionLogSlice.actions;
export default missionLogSlice.reducer;
