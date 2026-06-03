import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the possible views
export type ActiveViewType = 'MAP' | 'SCENE';

interface WebMapViewState {
    activeView: ActiveViewType;
    is2dOnlyActive: boolean | undefined;
    webGlErrorMessage: string | undefined;
}

const initialState: WebMapViewState = {
    activeView: 'MAP', // Default to the Map view
    is2dOnlyActive: undefined,
    webGlErrorMessage: undefined /* Any WebGL error messages produced by the API when creating a map or scene view */,
};

const webMapViewSlice = createSlice({
    name: 'webMapView',
    initialState,
    reducers: {
        setActiveView: (state, action: PayloadAction<ActiveViewType>) => {
            state.activeView = action.payload;
        },
        setIs2dOnlyActive: (state, action: PayloadAction<boolean | undefined>) => {
            state.is2dOnlyActive = action.payload;
        },
        setWebGlErrorMessage: (state, action: PayloadAction<string | undefined>) => {
            state.webGlErrorMessage = action.payload;
        },
    },
});

export const { setActiveView, setIs2dOnlyActive, setWebGlErrorMessage } = webMapViewSlice.actions;
export default webMapViewSlice.reducer;
