import { configureStore } from '@reduxjs/toolkit';
import ApplicationSlice from '../ApplicationSlice';
import ClassificationSlice from '../components/classificationBanner/ClassificationSlice';
import WebStylesSlice from '../components/widgets/layerStyle/WebStylesSlice';
import GateDataEditorSlice from '../components/gate/GateDataEditorSlice';
import MissionCreationSlice from '../components/home/components/missionCreate/MissionCreationSlice';
import TacticalGridDataSlice from '../components/tacticalGrid/components/TacticalGridDataSlice';
import UserSettingsSlice from '../components/UserSettingsSlice';
import SaveStateSlice from '../components/menuBar/components/saveState/SaveStateSlice';
import AdminSettingsSlice from '../components/administrator/components/AdminSettingsSlice';
import MissionLogSlice from '../components/missionLog/MissionLogSlice';
import WebMapViewSlice from '../components/webMap/WebMapViewSlice';

export const store = configureStore({
    reducer: {
        applicationSlice: ApplicationSlice,
        classificationSlice: ClassificationSlice,
        webStylesSlice: WebStylesSlice,
        gateCalendarEditorSlice: GateDataEditorSlice,
        missionCreationSlice: MissionCreationSlice,
        tacticalGridDataSlice: TacticalGridDataSlice,
        userSettingsSlice: UserSettingsSlice,
        saveStateSlice: SaveStateSlice,
        adminSettingsSlice: AdminSettingsSlice,
        missionLogSlice: MissionLogSlice,
        webMapViewSlice: WebMapViewSlice,
    },
});

// infer the 'RootState' and 'AppDispatch' types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
