import React, { createContext, useEffect, useState } from 'react';

import MapView from '@arcgis/core/views/MapView';
import SceneView from '@arcgis/core/views/SceneView';
import Map = __esri.Map;
import Viewpoint from '@arcgis/core/Viewpoint';
import Layer from '@arcgis/core/layers/Layer';
import { renderReplacementObject } from '../data/map';
import Editor from '@arcgis/core/widgets/Editor';
import { useAppDispatch, useAppSelector } from '../hooks/hooks';
import {
    setActiveView as setActiveViewRedux,
} from '../components/webMap/WebMapViewSlice';

export interface MapProviderProps {
    children: JSX.Element[] | JSX.Element;
}

interface ContextProps {
    loadedViewPoint: Viewpoint | undefined;
    setLoadedViewPoint: (value: Viewpoint | undefined) => void;
    mapViewInitialized: boolean;
    sceneViewInitialized: boolean;
    setMapViewInitialized: (value: boolean) => void;
    setSceneViewInitialized: (value: boolean) => void;
    activeView: 'MAP' | 'SCENE';
    mapView: MapView | undefined;
    sceneView: SceneView | undefined;
    setActiveView: (_value: 'MAP' | 'SCENE') => void;
    setMapView: (view: MapView) => void;
    setMap: (map: Map | null) => void;
    map: Map | null;
    setSceneView: (view: SceneView) => void;
    getMapView: () => MapView | undefined;
    getSceneView: () => SceneView | undefined;
    layersRemovedFor2dDisplay: Layer[];
    setLayersRemovedFor2dDisplay: (value: Layer[]) => void;
    renderReplacementObjects: renderReplacementObject[];
    setRenderReplacementObjects: (value: renderReplacementObject[]) => void;
    activeEditor: Editor | undefined;
    setActiveEditor: (value: Editor | undefined) => void;
}

// map context
export const MapContext = createContext<ContextProps>({
    loadedViewPoint: undefined,
    mapViewInitialized: false,
    sceneViewInitialized: false,
    activeView: 'MAP',
    mapView: undefined,
    sceneView: undefined,
    map: null,
    layersRemovedFor2dDisplay: [],
    renderReplacementObjects: [],
    activeEditor: undefined,
    setActiveView: (_value: 'MAP' | 'SCENE') => {
        return;
    },
    setMap: () => {
        return;
    },
    setLoadedViewPoint: (_value: Viewpoint | undefined) => {
        return;
    },
    setMapView: () => {
        return;
    },
    setMapViewInitialized: (_value: boolean) => {
        return;
    },
    setSceneViewInitialized: (_value: boolean) => {
        return;
    },
    setSceneView: () => {
        return;
    },
    getMapView: () => {
        return undefined;
    },
    getSceneView: () => {
        return undefined;
    },
    setLayersRemovedFor2dDisplay: (_value: Layer[]) => {
        return;
    },
    setRenderReplacementObjects: (_value: renderReplacementObject[]) => {
        return;
    },
    setActiveEditor: () => {
        return;
    },
});

// map provider
export const MapProvider = ({ children }: MapProviderProps): JSX.Element => {
    const [mapViewInitialized, setMapViewInitialized] = useState<boolean>(false);
    const [sceneViewInitialized, setSceneViewInitialized] = useState<boolean>(false);
    const [map, setMap] = useState<Map|null>(null);
    const [mapView, setMapView] = useState<MapView>();
    const [sceneView, setSceneView] = useState<SceneView>();
    const [activeView, setActiveView] = useState<'MAP' | 'SCENE'>('MAP');
    const [loadedViewPoint, setLoadedViewPoint] = useState<Viewpoint | undefined>();
    const [layersRemovedFor2dDisplay, setLayersRemovedFor2dDisplay] = useState<Layer[]>([]);
    const [renderReplacementObjects, setRenderReplacementObjects] = useState<renderReplacementObject[]>([]);
    const [activeEditor, setActiveEditor] = useState<Editor | undefined>();
    const dispatch = useAppDispatch();
    const reduxActiveView = useAppSelector((state) => state.webMapViewSlice.activeView);

    function getMapView() {
        return mapView;
    }

    function getSceneView() {
        return sceneView;
    }

    // synchronize Redux and Context states
    useEffect(() => {
        setActiveView(reduxActiveView);
    }, [reduxActiveView]);

    const handleSetActiveView = (newView: 'MAP' | 'SCENE') => {
        if (activeView !== newView) {
            setActiveView(newView);
        }
        dispatch(setActiveViewRedux(newView));
    };

    const value = {
        loadedViewPoint,
        setLoadedViewPoint,
        mapViewInitialized,
        sceneViewInitialized,
        activeView,
        setActiveView: handleSetActiveView, // updates both slice and context
        setMap,
        map,
        mapView,
        sceneView,
        setMapView,
        setSceneView,
        getMapView,
        getSceneView,
        setSceneViewInitialized,
        setMapViewInitialized,
        layersRemovedFor2dDisplay,
        setLayersRemovedFor2dDisplay,
        renderReplacementObjects,
        setRenderReplacementObjects,
        activeEditor,
        setActiveEditor,
    };

    return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};
