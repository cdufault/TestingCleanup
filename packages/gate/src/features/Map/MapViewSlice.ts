import { createSlice } from '@reduxjs/toolkit';

/**describes a mapping between portal webscene ids and mission names */
export interface SceneMapping {
    /**name of the mission */
    missionName: string;
    /**portal item id for the mission scene */
    scenePortalItemId: string;
}

/**Interface for the shape of the map and scene view data. */
export interface IMapViewSlice {
    /**Indicates if the view is hydrated */
    mapViewInitialized: boolean;

    /***Indicates if the webscene is hydrated */
    sceneViewInitialized: boolean;

    /**Indicates if the view is supporting a MapView or a SceneView */
    activeViewType: 'MAP' | 'SCENE';

    /**Portal item id for the region's webscene */
    viewObjPortalItemId: string;

    /** holds items mapping mission name to webscene item id*/
    websceneMappings: SceneMapping[];

    /**flag indicating if the counts widget has initialized */
    countsWidgetInitialzied: boolean;

    /**name of the current mission in the region page view */
    viewItemObjMissionName: string;

    /**Portal item id and type (2d or 3d) for the region's webscene whose Legend has been initialized. */
    legendInitializedId: string;
}

/**The initial default map view state. */
const initialState: IMapViewSlice = {
    mapViewInitialized: false,
    sceneViewInitialized: false,
    activeViewType: 'SCENE',
    viewObjPortalItemId: '',
    websceneMappings: [],
    countsWidgetInitialzied: false,
    viewItemObjMissionName: '',
    legendInitializedId: '',
};

/**Holds the data and actions related to viewing the map page. */
export const mapViewSlice = createSlice({
    name: 'mapview',
    initialState: initialState,
    reducers: {
        /**Update MapViewSlice viewObjPortalItemId */
        setViewObjPortalItemId: (state, action) => {
            state.viewObjPortalItemId = action.payload.id;
            state.viewItemObjMissionName = action.payload.name;
        },

        /**update the view type 'MAP' or 'SCENE' */
        setActiveViewType: (state, action) => {
            return { ...state, activeViewType: action.payload };
        },

        /**Set the map view initialized */
        setMapViewInitialized: (state, action) => {
            return { ...state, mapViewInitialized: action.payload };
        },

        setWebsceneMappings: (state, action) => {
            state.websceneMappings = action.payload;
        },

        /**Set the scene initialized */
        setSceneViewInitialized: (state, action) => {
            return { ...state, sceneViewInitialized: action.payload };
        },

        setCountWidgetInitialized: (state, action) => {
            state.countsWidgetInitialzied = action.payload;
        },

        /**Set the Legend initialized for the Region webscene's Portal id being passed in */
        setLegendInitializedId: (state, action) => {
            state.legendInitializedId = action.payload;
        },
    },
});

export const {
    setWebsceneMappings,
    setViewObjPortalItemId,
    setActiveViewType: setActiveViewType,
    setMapViewInitialized,
    setSceneViewInitialized,
    setCountWidgetInitialized,
    setLegendInitializedId,
} = mapViewSlice.actions;
export default mapViewSlice.reducer;
