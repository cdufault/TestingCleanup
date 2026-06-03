import { createSlice } from '@reduxjs/toolkit';

// the type for the slice state
interface RegionDetailsState {
    regionItems: RegionItem[];
}

// region item structure
interface RegionItem {
    id: string;
    category: string;
    catLevel: string;
    catConfidence: string;
    catComments: string;
}

// this should be set to and empty RegionDetailsState when used for non-demo purposes
const initialState = {
    regionItems: [
        {
            id: '1',
            category: 'Planes',
            catLevel: 'Medium',
            catConfidence: 'Expected',
            catComments: 'Planes activity is as expected',
        },
        {
            id: '2',
            category: 'Trains',
            catLevel: 'Medium',
            catConfidence: 'Expected',
            catComments: 'Trains activity is as expected',
        },
        {
            id: '3',
            category: 'Automobiles',
            catLevel: 'High',
            catConfidence: 'Not Expected',
            catComments: 'Automobiles activity is as higher than expected for this time of year',
        },
        {
            id: '4',
            category: 'Scooters',
            catLevel: 'Medium',
            catConfidence: 'Expected',
            catComments: 'Scooters activity is as expected',
        },
        {
            id: '5',
            category: 'Rickshaws',
            catLevel: 'Medium',
            catConfidence: 'Expected',
            catComments: 'Rickshaws activity is as expected',
        },
    ],
};

export const regionDetailsSlice = createSlice({
    name: 'regionDetails',
    initialState: initialState as RegionDetailsState,
    reducers: {
        addRegionItem: (state, action) => {
            state.regionItems.push(action.payload);
        },
    },
    extraReducers: () => {},
});

export const { addRegionItem } = regionDetailsSlice.actions;
export default regionDetailsSlice.reducer;
