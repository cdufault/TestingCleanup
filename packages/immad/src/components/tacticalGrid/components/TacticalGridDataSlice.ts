import { createSlice } from '@reduxjs/toolkit';

/**types of actions supported by the context menu */
export type Actions =
    | 'clear status'
    | 'no action'
    | 'evaluate'
    | 'update time'
    | 'update location'
    | 'issue'
    | 'update all'
    | 'update source'
    | 'empty';

/**action object with feature oid */
export interface ActionItem {
    action: Actions;
    oid: number;
}

/**
 * Tactical Grid data slice
 */
export interface TacticalGridDataSlice {
    selectedTGridDataSliceAction: ActionItem;
    tgridInDrawEllipseMode: boolean;
    /* oid field name alias if defined otherwise the actual field name */
    tgridFeatureLayerOIDFieldName: string;
    /**data row that is the target of the context menu */
    tgridSelectedRowForAction: any | undefined;
    showEllipseCheckbox: boolean;
}

/**
 * State data for the tactical grid. Note that some data is still being handled by the TacticalGrid context.
 */
const initialState: TacticalGridDataSlice = {
    selectedTGridDataSliceAction: { action: 'empty', oid: -1 },
    tgridInDrawEllipseMode: true,
    tgridFeatureLayerOIDFieldName: '',
    tgridSelectedRowForAction: undefined,
    showEllipseCheckbox: true,
};

/** Tactical grid state reducers*/
export const tacticalGridDataSlice = createSlice({
    name: 'tacticalGridDataSlice',
    initialState: initialState,
    reducers: {
        setSelectedTGridDataSliceAction: (state, action) => {
            state.selectedTGridDataSliceAction = action.payload;
        },
        setTgridInDrawEllipseMode: (state, action) => {
            state.tgridInDrawEllipseMode = action.payload;
        },
        setTgridFeatureLayerOIDFieldName: (state, action) => {
            state.tgridFeatureLayerOIDFieldName = action.payload;
        },
        setTgridSelectedRowForAction: (state, action) => {
            state.tgridSelectedRowForAction = action.payload;
        },
        setShowEllipseCheckbox: (state, action) => {
            state.showEllipseCheckbox = action.payload;
        },
    },
});

export const {
    setSelectedTGridDataSliceAction,
    setTgridInDrawEllipseMode,
    setTgridFeatureLayerOIDFieldName,
    setTgridSelectedRowForAction,
    setShowEllipseCheckbox,
} = tacticalGridDataSlice.actions;

export default tacticalGridDataSlice.reducer;
