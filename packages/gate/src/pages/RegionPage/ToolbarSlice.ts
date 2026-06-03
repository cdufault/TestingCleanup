import { createSlice } from '@reduxjs/toolkit';
import { ToolbarItem } from './RegionToolsHelper';
import * as FlexLayout from 'flexlayout-react';
import { Model } from 'flexlayout-react';
import { flexLayoutJson } from './FlexLayoutJson';

/**Interface for the shape of the map and scene view data. */
export interface IToolbarSlice {
    /**Indicates if the view is hydrated */
    toolbarItems: ToolbarItem[];
    selectedToolbarItemIds: string[];
    saveLayoutClicked: boolean;
    layoutModel: Model;
    layoutModelJson: string;
    resetLayoutClicked: boolean;
}

/**The initial default map view state. */
const initialState: IToolbarSlice = {
    toolbarItems: [],
    selectedToolbarItemIds: [],
    saveLayoutClicked: false,
    // @ts-ignore
    layoutModel: FlexLayout.Model.fromJson(flexLayoutJson),
    layoutModelJson: '',
    resetLayoutClicked: false,
};

/**Holds the data and actions related to viewing the region page. */
export const toolbarSlice = createSlice({
    name: 'mapview',
    initialState: initialState,
    reducers: {
        /**Update MapViewSlice viewObjPortalItemId */
        setToolbarItems: (state, action) => {
            state.toolbarItems = action.payload;
        },
        setSelectedToolbarItemIds: (state, action) => {
            state.selectedToolbarItemIds = action.payload;
        },
        setSaveLayoutClicked: (state, action) => {
            state.saveLayoutClicked = action.payload;
        },
        setLayoutModel: (state, action) => {
            state.layoutModel = action.payload;
        },
        setLayoutModelJson: (state, action) => {
            state.layoutModelJson = action.payload;
        },
        setResetLayoutClicked: (state, action) => {
            state.resetLayoutClicked = action.payload;
        },
    },
});

export const {
    setToolbarItems,
    setSelectedToolbarItemIds,
    setSaveLayoutClicked,
    setLayoutModelJson,
    setLayoutModel,
    setResetLayoutClicked,
} = toolbarSlice.actions;
export default toolbarSlice.reducer;
