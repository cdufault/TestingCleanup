import { createSlice } from '@reduxjs/toolkit';
import { OpsClockDataSerializable } from '@stratcom/react-widget-lib/types/OpsClockWidgetLib';

/**Describes if the region display page will auto rotate in presentation mode or be a standard page */
export type RegionDisplayModeType = 'Standard' | 'Presentation';

export interface ColorType {
    level1: string;
    level2: string;
    level3: string;
    level4: string;
}

/** Holds the appConfig values for the rest of the application to use */
export type appConfig = {
    /**URL to the default portal */
    portalUrl: string;
    /**Application Id for Gate in Portal */
    oauthAppId: string;
    /** the GATE application current version number*/
    version: string;
    /** the GATE application current folder path*/
    basename: string;
    /**Symbol to use when replacing WebScene symbology to support a mapview */
    defaultSymbol: any;

    /**Alternating colors for the Count Widget categories. */
    countWidgetRowColors: string[];

    /**Indicates of default lighting for scenes is on */
    lightingIsEnabled: boolean;

    /**field name holding the last edited date for the feature class */
    lastUpdatedFieldName: string;

    /** flag that determines if count queries execute in batch mode or one at a time (sequentially) */
    executeCountQueriesSequentially: boolean;

    /** flag to indicate if GATE activity counts data should be queried from client side data */
    useClientSideFeatures: boolean;

    /** frequency in seconds to update client side cache */
    clientSideDataCacheUpdateFrequencyInSeconds: number;

    /** colors for supporting watchcon levels */
    watchConColorPalette: ColorType;

    /**Color for important anniversaries on the calendar */
    importantAnniversaryColor: string;

    /** Config settings for the geocoder search tool*/
    search: {
        includeGeocoder: boolean;
        name: string;
        allPlaceholder: string;
        url: string;
    };

    /** GATE application id */
    appPortalId: string;

    /** true if the application is an exercise application */
    appIsExercise: boolean;

    /** application slice GATE Admin Group ID value */
    gateAdminGroupId: string;
};

/**
 * Holds the structure that is needed to make a GATE Admin Group
 */

/**
 * This is the Interface for current GATE configuration values to store in the application object.
 */
export interface GateDynamicConfig {
    /** region Feature Class Portal ID */
    regionFeatureClassId: string;
    /** landing page categories Feature Class Portal ID */
    landingPageCategoriesFeatureClassId: string;
    /** Gate calendar Feature Class Portal ID */
    gateCalendarFeatureClassId: string;
    /** J2 Summary Feature Class Portal ID */
    j2SummaryFeatureClassId: string;
    /** sources Feature Class Portal ID */
    sourcesFeatureClassId: string;
    /** analyst Comments Feature Class Portal ID */
    analystCommentsFeatureClassId: string;
    /** alias for j2Assessment */
    j2AssessmentAlias: string;
    /**  alias for analyst comments */
    analystCommentsAlias: string;
    /** alias for branding title on landing page */
    brandingTitleAlias: string;
    /** alias for branding subtitle on landing page */
    brandingSubtitleAlias: string;
    /** Gate logo for display on landing page */
    brandingLogo: string;
    /**  value for the title of the high interest event card */
    highInterestEventCardTitle: string;
    /** Gate dynamic layer service poll interval, in minutes */
    dynamicLayerServicePollIntervalMins: number;
    /** Gate dynamic layer service default expiration time in hours */
    dynamicLayerServiceDefaultExpirationTimeHrs: number;
    /** Gate dynamic layer service Portal Item ID */
    dynamicLayerServiceId?: {
        itemId: string;
    };
    /** highest classification for Gate system display */
    systemHighClassification: string;
    /** Presentation Mode Update Interval in Minutes*/
    presentationModeUpdateIntervalMinutes: number | string;
    /** Carousel Paging Update Interval in Minutes*/
    carouselPagingUpdateIntervalMinutes: number | string;
    /** Landing Page Update Interval in Minutes*/
    landingPageUpdateIntervalInMinutes: number | string;
    /** Update Frequency forAnalyst Comments categories in Minutes*/
    updateFrequencyForAnalystCommentCategoryInMinutes: number | string;
    /** List of ops clocks for the Gate landing page */
    opsClockList: OpsClockDataSerializable[];
    /** Hex Color Code for Low Actvity Category */
    lowActivitySnapshotCategoryColor: string;
    /** Hex Color Code for Moderate Actvity Category */
    moderateActivitySnapshotCategoryColor: string;
    /** Hex Color Code for High Actvity Category */
    highActivitySnapshotCategoryColor: string;
}

/**Interface for the GATE Application store */
export interface IApplicationSlice {
    /**display mode - Standard or Presentation */
    regionDisplayMode: RegionDisplayModeType;
    /** tells the application if GATE has a Group and Application already */
    gateConfigured: boolean;
    /**app config object read from file system */
    applicationConfig: appConfig;
    /**typekeywords to find GATE region app */
    gateRegionAppTypeKeywords: string;
    /** application slice GATE dynamic config values */
    gateDynamicConfig: GateDynamicConfig;
    /**show the j2 summary when in presentation mode */
    showJ2SummaryWhenInPresentationMode: boolean;
    /**text from the version.txt file in the app root */
    versionText: string;
    /**url from the app */
    basenameText: string;
    /** Is the application loading value*/
    applicationLoading: boolean;
    /**Value to determine if displaying 2d maps and 3d scenes */
    is2dOnlyActive: boolean;
}

/**The initial GATE application State */
const initialState: IApplicationSlice = {
    /**display mode - Standard or Presentation */
    regionDisplayMode: 'Standard',
    /**typekeywords to find GATE region app */
    gateRegionAppTypeKeywords: 'GATE',
    /** tells the application if GATE has a Group and Application already */
    gateConfigured: false,
    /**show the j2 summary when in presentation mode */
    showJ2SummaryWhenInPresentationMode: false,
    /**text from the version.txt file in the app root */
    versionText: '',
    /**url for the app */
    basenameText: '',
    /** Is the application loading value*/
    applicationLoading: true,
    /** 3D and 2D maps */
    is2dOnlyActive: false,

    /**app config object read from file system */
    applicationConfig: {
        portalUrl: '',
        oauthAppId: '',
        version: '',
        basename: '',
        countWidgetRowColors: ['silver', 'darkgray'],
        lastUpdatedFieldName: '',
        executeCountQueriesSequentially: true,
        lightingIsEnabled: false,
        defaultSymbol: {
            size: 10,
            color: [255, 255, 255],
            outline: {
                color: [0, 0, 0],
                width: 1,
            },
        },
        watchConColorPalette: {
            level1: '',
            level2: '',
            level3: '',
            level4: '',
        },
        clientSideDataCacheUpdateFrequencyInSeconds: 0,
        useClientSideFeatures: false,
        importantAnniversaryColor: '#f50707',
        search: {
            includeGeocoder: true,
            name: 'Internal Test Geocoder',
            allPlaceholder: 'example: 100 Main St',
            url: '',
        },
        appPortalId: '',
        appIsExercise: false,
        gateAdminGroupId: '',
    },
    /** the GATE Dynamic Configuration values for storing in the GATE Application */
    gateDynamicConfig: {
        regionFeatureClassId: '',
        landingPageCategoriesFeatureClassId: '',
        gateCalendarFeatureClassId: '',
        j2SummaryFeatureClassId: '',
        sourcesFeatureClassId: '',
        analystCommentsFeatureClassId: '',
        j2AssessmentAlias: '',
        analystCommentsAlias: '',
        brandingTitleAlias: '',
        brandingSubtitleAlias: '',
        brandingLogo: '',
        highInterestEventCardTitle: '',
        dynamicLayerServicePollIntervalMins: 0,
        dynamicLayerServiceDefaultExpirationTimeHrs: 0,
        dynamicLayerServiceId: undefined,
        systemHighClassification: '',
        opsClockList: [],
        presentationModeUpdateIntervalMinutes: '',
        carouselPagingUpdateIntervalMinutes: '',
        landingPageUpdateIntervalInMinutes: '',
        updateFrequencyForAnalystCommentCategoryInMinutes: '',
        lowActivitySnapshotCategoryColor: '#000000',
        moderateActivitySnapshotCategoryColor: '#000000',
        highActivitySnapshotCategoryColor: '#000000',
    } as GateDynamicConfig,
};

/**Holds the data and actions for updating relevant to top level application state objects. */
export const applicationSlice = createSlice({
    name: 'applicationSlice',
    initialState: initialState,
    reducers: {
        setRegionDisplayMode: (state, action) => {
            state.regionDisplayMode = action.payload;
        },
        setGateConfigured: (state, action) => {
            state.gateConfigured = action.payload;
        },
        setApplicationConfig: (state, action) => {
            state.applicationConfig = action.payload;
        },
        setGateDynamicConfig: (state, action) => {
            state.gateDynamicConfig = {
                ...state.gateDynamicConfig,
                ...action.payload,
            };
        },
        setShowJ2SummaryWhenInPresentationMode: (state, action) => {
            state.showJ2SummaryWhenInPresentationMode = action.payload;
        },
        setLightingIsEnabled: (state, action) => {
            state.applicationConfig.lightingIsEnabled = action.payload;
        },
        setVersionText: (state, action) => {
            state.versionText = action.payload;
        },
        setBasenameText: (state, action) => {
            state.basenameText = action.payload;
        },
        setApplicationLoading: (state, action) => {
            state.applicationLoading = action.payload;
        },
        setIs2dOnlyActive: (state, action) => {
            state.is2dOnlyActive = action.payload;
        },
    },
});

export const {
    setRegionDisplayMode,
    setApplicationConfig,
    setGateConfigured,
    setGateDynamicConfig,
    setShowJ2SummaryWhenInPresentationMode,
    setLightingIsEnabled,
    setVersionText,
    setBasenameText,
    setApplicationLoading,
    setIs2dOnlyActive,
} = applicationSlice.actions;
export default applicationSlice.reducer;
