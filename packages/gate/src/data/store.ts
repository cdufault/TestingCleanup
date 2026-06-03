import { configureStore } from '@reduxjs/toolkit';
import LandingPageSlice from '../pages/LandingPage/landingPageSlice';
import RegionDetailsSlice from '../features/RegionCard/regionDetailsSlice';
import RegionSlice from '../pages/RegionPage/RegionSlice';
import MapViewSlice from '../features/Map/MapViewSlice';
import ApplicationSlice from '../ApplicationSlice';
import FormDataSlice from '../pages/ConfigurationPage/FormDataSlice';
import CalendarPageSlice from '../features/Calendar/calendarPageSlice';
import ExerciseBannerSlice from '../features/ExerciseBanner/ExerciseBannerSlice';
import ToolbarSlice from "../pages/RegionPage/ToolbarSlice";

export const store = configureStore({
    reducer: {
        landingPage: LandingPageSlice,
        regionDetails: RegionDetailsSlice,
        regionSlice: RegionSlice,
        mapViewSlice: MapViewSlice,
        applicationSlice: ApplicationSlice,
        formDataSlice: FormDataSlice,
        calendarPageSlice: CalendarPageSlice,
        exerciseBannerSlice: ExerciseBannerSlice,
        toolbarSlice: ToolbarSlice,
    },
    /**
     * this middleware section is here for if in the future we
     * need to make adjustments to the Redux Middle wear based on
     * the projects needs. If we need to put ArcGIS objects into Redux
     * store for any reason we will have to enable the last line that is commented
     * out below.
     * */
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            // this is so we can store ArcGIS Maps SDK for Javascript
            // objects in state without errors coming up in the
            // console for non-serializable objects.
            // Some ArcGIS objects will not allow for time travel debugging,
            // and recording and replaying actions.
            // serializableCheck: false,
        }),
});

// infer the 'RootState' and 'AppDispatch' types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
