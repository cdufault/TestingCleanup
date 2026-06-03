import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { sortLandingPageItemPosition, sortLandingPageItemRowPosition } from './LandingPageHelper';
import { ConfidenceType } from '@stratcom/lib-functions';

//interface to define state for the landing page card.
interface LandingPageItems {
    regionsNames: string[]; //used for prototyping landing page layout only
    /**Data for the cards on the landing page */
    landingPageItems: ILandingPageItems;
    /**The Error object if landing page data can't be retrieved from portal */
    error?: Error;
    /**The data for the regions tht is used for calculating counts, tabs, etc. */
    appData?: any[];
    /**The current index value of the landing page carousel region card */
    currentIndex: number;
    /**The total number of region cards for carousel */
    totalCards: number;
    /**Value to determine if carousel is paused */
    isPaused: boolean;
    /**Value to determine if carousel is closed */
    isRunning: boolean;
}

/**Region card activity level for specific categories */
enum LevelType {
    LOW,
    MODERATE,
    HIGH,
}

/**Confidence type string wrapper for a category confidence/Expectation level */
export type LevelTypeStrings = keyof typeof LevelType;

/**Data representing a row in a region card */
export interface IRegionCardRow {
    /**identifier for the category */
    id: string;

    /**ie bus, truck, taxi, etc */
    category: string;

    /**leve high, medium, or low */
    catLevel: LevelTypeStrings;

    /**expected or not expected */
    catConfidence: ConfidenceType;

    /**comments regarding the level and/or confidence values for the category */
    catComments: string;

    /**information cut off date value for the region */
    icodDate: Date;

    /**the row on the card that this item will reside on */
    positionOnCard?: number;
}

/**Represents a collection of RegionCardRows*/
export interface IRegionCard {
    /**Name of the region - same as the mission group name */
    regionName: string;

    /**Array of data objects representing an array region cards row data */
    regionCardRows: IRegionCardRow[];

    /**Mission portal item id */
    mission_id?: string | null | undefined;

    /**summary statement for the region */
    summaryStatement: string;

    /**this cards location on the page 1 to n - starting at the top and moving left to right*/
    positionOnPage?: number;

    /** Information Cut Off Date value for the region */
    summaryIcod: Date;
}

/**Data structure for a landing page summary row*/
export interface ILandingPageSummaryRow {
    /**Name of the region - same as the mission group name */
    regionName: string;

    /**summary statement for the region */
    summaryStatement: string;

    /** Information Cut Off Date value for the region summary */
    icodValue: Date;
}

/**Represents a collection of landing page cards and a summary section*/
export interface ILandingPageItems {
    /**array of region card data objects */
    regionCards: IRegionCard[];
}

/**Base store state on app startup */
const initialState: LandingPageItems = {
    regionsNames: [],
    landingPageItems: {
        regionCards: [],
    },
    error: undefined,
    appData: undefined,
    currentIndex: 0,
    totalCards: 0,
    isPaused: false,
    isRunning: false,
};

export const landingPageSlice = createSlice({
    name: 'landingPage',
    initialState: initialState as LandingPageItems,
    reducers: {
        addRegionName: (state, action) => {
            state.regionsNames.push(action.payload);
        },
        setLandingPageItems: (state, action) => {
            const { regionCards } = action.payload || {};
            const sorted = regionCards?.sort(sortLandingPageItemPosition).map((row: any) => ({
                ...row,
                regionCards: row.regionCardRows.sort(sortLandingPageItemRowPosition),
            }));
            state.landingPageItems.regionCards = sorted || [];
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        setLandingPageApps: (state, action) => {
            state.appData = action.payload;
        },
        setCurrentIndex: (state, action) => {
            state.currentIndex = action.payload;
        },
        nextCard: (state) => {
            state.currentIndex = (state.currentIndex + 1) % state.totalCards;
        },
        prevCard: (state) => {
            state.currentIndex = (state.currentIndex - 1 + state.totalCards) % state.totalCards;
        },
        setTotalCards: (state, action: PayloadAction<number>) => {
            state.totalCards = action.payload;
        },
        goToCard: (state, action: PayloadAction<number>) => {
            state.currentIndex = action.payload;
        },
        pauseCarousel: (state) => {
            state.isPaused = true;
        },
        resumeCarousel: (state) => {
            state.isPaused = false;
            state.isRunning = true;
        },
        stopCarousel: (state) => {
            state.isRunning = false;
            state.isPaused = false;
            state.currentIndex = 0;
        },
    },
    extraReducers: () => {},
});

export const {
    setLandingPageItems,
    addRegionName,
    setError,
    setLandingPageApps,
    setCurrentIndex,
    nextCard,
    prevCard,
    setTotalCards,
    goToCard,
    pauseCarousel,
    resumeCarousel,
    stopCarousel,
} = landingPageSlice.actions;
export default landingPageSlice.reducer;
