import { createSlice } from '@reduxjs/toolkit';
import * as FlexLayout from 'flexlayout-react';
import { StaticViewState } from '../../data/StaticViewState';

/**Future placeholder should a region need special tools that may not be applicable to other regions */
export interface CustomTool {
    id: string;
}

/**Future placeholder should a region need tab(s) that may not be applicable to other regions */
export interface CustomTab {
    name: string;
    url: string;
}

/**Properties that relate to the counts widget */
export interface ICountsWidgetProps {
    /**URL to the featureclass holding the data for the count widget for a given region */
    featureClassUrl: string; //may want to make this an array in case multiple featureclasses supply data
}

/**Properties that relate to the trends widget */
export interface TrendsWidgetProps {
    featureClassUrl: string; //may want to make this an array in case multiple featureclasses supply data
}

/**Interface for the shape of the region state data. */
export interface IRegionSlice {
    /**Id/name of the region */
    regionName: string;

    /**region id = group/mission portal item id */
    regionId?: string;

    /**Portal item for 3D webscene */
    portalMapItemId3D: string;

    /**A title for the region - can be ommitted or be the same as the name */
    regionTitle: string;

    /**URL to the regions default map */
    regionDefaultMapUrl: string;

    /**Custom tools defined specifically for this region  */
    customTools: CustomTool[];

    /**Custom tabs defined specifically for this region */
    customTabs: CustomTab[];

    /**Properties for the counts widget*/
    countWidgetProps: ICountsWidgetProps;

    /**Properties for the trends widget */
    trendsWidgetProps: TrendsWidgetProps;

    /**JSON data for the initial flex layout for the region's page */
    regionJsonModel: FlexLayout.Model | undefined;
}

interface IRegionSlices {
    regionSlices: IRegionSlice[];
    regionName: string;
}

/**The initial default data state. */
const initialState: IRegionSlices = {
    regionSlices: [],
    regionName: '',
};

/**Holds the data and actions related to viewing the Regions page. */
export const regionSlices = createSlice({
    name: 'region',
    initialState: initialState,
    reducers: {
        addRegionSlice: (state, action) => {
            const index = state.regionSlices.findIndex((slice) => slice.regionName === action.payload.regionName);
            if (index === -1) {
                state.regionSlices = [state.regionSlices, action.payload];
            } else {
                state.regionSlices[index] = action.payload;
            }
        },
        setRegionName: (state, action) => {
            return { ...state, regionName: action.payload.trim() };
        },
        addRegionSlices: (state, action) => {
            state.regionSlices = action.payload;
        },
    },
});

export const { addRegionSlice, setRegionName, addRegionSlices } = regionSlices.actions;
export default regionSlices.reducer;
