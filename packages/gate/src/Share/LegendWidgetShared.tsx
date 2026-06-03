import React, { useState, useEffect, useContext } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../data/store';
import MapView from '@arcgis/core/views/MapView';
import SceneView from '@arcgis/core/views/SceneView';
import { Legend } from '@stratcom/react-widget-lib';
import { StaticViewState } from '../data/StaticViewState';

export const LegendWidgetShared = (): JSX.Element => {
    const activeViewType = useSelector((state: RootState) => state.mapViewSlice.activeViewType);
    const legendInitializedId = useSelector((state: RootState) => state.mapViewSlice.legendInitializedId);

    const [mapView, setMapView] = useState<MapView>();
    const [sceneView, setSceneView] = useState<SceneView>();

    function getMapView() {
        return mapView;
    }

    function getSceneView() {
        return sceneView;
    }

    /**
     * After the legendInitialiedId is updated, set the mapView or sceneView for the Legend
     */
    useEffect(() => {
        if (legendInitializedId) {
            let viewState = StaticViewState.getViewState();
            if (activeViewType === 'MAP') {
                setMapView(viewState.currentView as MapView);
            } else {
                setSceneView(viewState.currentView as SceneView);
            }
        }
    }, [legendInitializedId]);

    return (
        <>
            <Legend
                activeView={activeViewType}
                mapView={mapView}
                sceneView={sceneView}
                getMapView={getMapView}
                getSceneView={getSceneView}
            />
        </>
    );
};
