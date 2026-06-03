// webStylesSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import esriRequest from '@arcgis/core/request';
import { getPortalRestUrl } from '../../../helpers/defaultPortalHelper';
import RequestOptions = __esri.RequestOptions;
import { SelectionType } from './helpers/GraphicsHelper';

interface WebStylesState {
    stylesGroupDataGuid: string;
    twoDStylesGroupDataGuid: string;
    portalStyleItems2d: any[];
    portalStyleItems3d: any[];
    selectedWebStyleObject: string;
    selectedWebStyleType: string;
    styleSelectionType: SelectionType;
    loading: boolean;
    error: string | null;
}

const initialState: WebStylesState = {
    stylesGroupDataGuid: '',
    twoDStylesGroupDataGuid: '',
    portalStyleItems2d: [],
    portalStyleItems3d: [],
    selectedWebStyleObject: '',
    selectedWebStyleType: '',
    styleSelectionType: 'location',
    loading: false,
    error: null,
};

// An async thunk to fetch webstyles data
// in the JSON look for these 2 items
// stylesGroupQuery - 3d webstyles group
// 2DStylesGroupQuery - 2d webstyles group sometimes identical
// get JSON from here or similar path.
// https://cigt-srv19.esri.tech/portal/sharing/rest/portals/self/webstyles?f=json
const fetchStylesData = createAsyncThunk('webStyles/fetchStylesData', async () => {
    try {
        const portalUrl = await getPortalRestUrl();
        const webStylesUrl = portalUrl + '/portals/self/webstyles';
        const options = {
            query: {
                f: 'json',
            },
            responseType: 'json',
        } as RequestOptions;
        // Use esriRequest to fetch data from the web styles REST URL
        const stylesResponse = await esriRequest(webStylesUrl, options);
        let threeDStylesGuid = '';
        let twoDStylesGuid = '';
        const { data } = stylesResponse;
        const stylesGroupQuery = data.stylesGroupQuery;
        const twoDStylesGroupData = data['2DStylesGroupQuery'];
        if (stylesGroupQuery) {
            const parts = stylesGroupQuery.split(':');
            threeDStylesGuid = parts.length === 2 ? parts[1].trim() : '';
        }
        if (twoDStylesGroupData) {
            const twoDParts = twoDStylesGroupData.split(':');
            twoDStylesGuid = twoDParts.length === 2 ? twoDParts[1].trim() : '';
        }

        // Extract the relevant data and return it
        return {
            stylesGroupDataGuid: threeDStylesGuid, // adjust this based on the actual structure of the response
            twoDStylesGroupDataGuid: twoDStylesGuid, // adjust this based on the actual structure of the response
        };
    } catch (error) {
        // Handle errors
        console.error('Error fetching web styles data');
        console.error(error);
        throw new Error('Error fetching web styles group guids');
    }
}); // Create a slice
const webStylesSlice = createSlice({
    name: 'webStyles',
    initialState,
    reducers: {
        setPortalStyleItems2d: (state, action) => {
            state.portalStyleItems2d = action.payload;
        },
        setPortalStyleItems3d: (state, action) => {
            state.portalStyleItems3d = action.payload;
        },
        setSelectedWebStyleObject: (state, action) => {
            state.selectedWebStyleObject = action.payload;
        },
        setSelectedWebStyleType: (state, action) => {
            state.selectedWebStyleType = action.payload;
        },
        setStyleSelectionType: (state, action) => {
            state.styleSelectionType = action.payload;
        },
    },
    extraReducers: (builder) => {
        // Handle the result of the async thunk
        builder
            .addCase(fetchStylesData.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchStylesData.fulfilled, (state, action) => {
                state.loading = false;
                state.stylesGroupDataGuid = action.payload?.stylesGroupDataGuid;
                state.twoDStylesGroupDataGuid = action.payload?.twoDStylesGroupDataGuid;
            })
            .addCase(fetchStylesData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error?.message ?? 'An error occurred';
            });
    },
}); // Export the async thunk for use in components
export { fetchStylesData };
export const {
    setPortalStyleItems2d,
    setPortalStyleItems3d,
    setSelectedWebStyleObject,
    setSelectedWebStyleType,
    setStyleSelectionType,
} = webStylesSlice.actions; // Export the reducer for use in the store
export default webStylesSlice.reducer;
