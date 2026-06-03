import MapView from '@arcgis/core/views/MapView';
import SceneView from '@arcgis/core/views/SceneView';
import WebScene from '@arcgis/core/WebScene';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from './store';
import { StaticViewState, ViewState } from './StaticViewState';
import { RootState } from './store';
import { setLegendInitializedId } from '../features/Map/MapViewSlice';

/**Hook that wraps a TS static class that managers map and scene view state. */
export function useViewState() {
    const dispatch: AppDispatch = useDispatch();
    const [viewState, setViewState] = useState<ViewState>();
    const [view, setView] = useState<MapView | SceneView | undefined>();
    const [webScene, setWebScene] = useState<WebScene | undefined>();

    const mapViewSlicePortalItemId = useSelector((state: RootState) => state.mapViewSlice.viewObjPortalItemId);

    /**
     * Get a cached view object from a JS Map where the key is the portal item webscene
     * @param portalItemId portal item id for the region webscene
     */
    function getCachedView(portalItemId: string, viewType: string) {
        const state = StaticViewState.getCachedView(portalItemId, viewType);
        return state;
    }

    /**
     * Once the view has been updated for the viewState matching the Portal item id of the current webscene in the MapViewSlice,
     * set the Legend to initialized for that id and type (2d or 3d). This is to ensure that the MapView or SceneView is updated
     * properly when switching between opening the GATE Region page for the same mission in 2d, then 3d (or vice versa).
     */
    useEffect(() => {
        if (view && viewState && mapViewSlicePortalItemId && viewState.portalItemId === mapViewSlicePortalItemId) {
            let type = viewState.currentView.type;
            dispatch(setLegendInitializedId(mapViewSlicePortalItemId + type));
        }
    }, [view]);

    useEffect(() => {
        if (!viewState) {
            const viewState = StaticViewState.getViewState();
            setViewState(viewState);
        } else {
            setView(viewState.currentView);
            setWebScene(viewState.currentWebScene);
            StaticViewState.updateViewState(viewState, viewState.currentView.type);
        }
    }, [viewState]);

    return { savedView: view, savedWebScene: webScene, getCachedView: getCachedView, setViewState: setViewState };
}
