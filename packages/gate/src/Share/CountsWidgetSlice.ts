import { createSlice } from '@reduxjs/toolkit';

/** Holds the counts data for a row in the counts widget. All object keys will be a string and the value
 * can be string or number */
export interface ICountsData {
    /**row of data */
    [key: string]: number | string;
}

/**Interface for the shape of the counts widget data. */
export interface ICountsWidgetSlice {
    /** collection of row data */
    countsDataArray: ICountsData[];

    /**the column label for the last row in the table ie 'Total' */
    totalRowLabel: string;

    /**column headers */
    columnHeaders: string[];
}

/**The initial default counts widget data. */
const initialState: ICountsWidgetSlice = {
    countsDataArray: [{ rowLabel: 'No Data', Category1: 0, Category2: 0, Category3: 0 }],
    totalRowLabel: 'Total',
    columnHeaders: ['Item', 'CatCount1', 'CatCount2', 'CatCount3'],
};

/**Holds the data and actions for updating relevant to top level application state objects. */
export const countsWidgetSlice = createSlice({
    name: 'countsWidgetSlice',
    initialState: initialState,
    reducers: {
        setCountsData: (state, action) => {
            state.countsDataArray = action.payload;
        },
        setTotalRowLabel: (state, action) => {
            state.totalRowLabel = action.payload;
        },
        setColumnHeaders: (state, action) => {
            state.columnHeaders = action.payload;
        },
    },
});

export const { setCountsData } = countsWidgetSlice.actions;
export default countsWidgetSlice.reducer;
