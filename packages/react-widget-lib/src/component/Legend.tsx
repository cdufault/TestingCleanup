import React, { useEffect, useRef } from 'react';
import EsriLegend from '@arcgis/core/widgets/Legend';

/**
 * Props passed in to the Legend widget
 */
export interface LegendProps {
    /** 
     * Controls whether the active view is in 2D or 3D
     */
    activeView: 'MAP' | 'SCENE';

    /**
     * current mapView object
     */
    mapView: __esri.MapView | undefined;

    /**
     * current sceneView Object
     */
    sceneView: __esri.SceneView | undefined;

    /**
     * Callback that returns the map view
     */
    getMapView: () => __esri.MapView | undefined;

    /**
     * Callback that returns the scene view
     */
    getSceneView: () => __esri.SceneView | undefined;
}

/*
 * Re-usable Legend widget.
 * @param props The Legend props pertaining to map view and scene view to provide to the widget.
 */
export const Legend = (props: LegendProps): JSX.Element => {
    const htmlDivLegendRef = useRef<HTMLDivElement>(null);
    const { mapView, sceneView, activeView, getMapView, getSceneView } = props;
    const legendRef = useRef<EsriLegend | undefined>();
 
    useEffect(() => {
        if(mapView && htmlDivLegendRef && activeView === 'MAP'){
            buildLegend(activeView);
        }
    },[mapView, htmlDivLegendRef, activeView])

    useEffect(() => {
        if(sceneView && htmlDivLegendRef && activeView === 'SCENE'){
            buildLegend(activeView);
        }
    },[sceneView, htmlDivLegendRef, activeView])

    /**
     * Display the legend by either updating the view on an existing legend or creating a new legend if
     * no current legend exists.
     * @param viewType 'MAP' or 'SCENE'
     */
    const buildLegend = (viewType: string) => {
        if(viewType === 'MAP' && htmlDivLegendRef.current){
            const view = getMapView();
            if(!legendRef.current){
                legendRef.current = new EsriLegend({
                    view,
                    container: htmlDivLegendRef.current,
                });
            }
            else {
                if(legendRef.current && view){
                    legendRef.current.view = view;
                }
            }
        }
        else if(viewType === 'SCENE' && htmlDivLegendRef.current){
            const view = getSceneView();
            if(!legendRef.current){
                legendRef.current = new EsriLegend({
                    view,
                    container: htmlDivLegendRef.current,
                });
            }
            else{
                if(legendRef.current && view){
                    legendRef.current.view = view;
                }
            }
        }
    }

    return (
        <div>
            <div ref={htmlDivLegendRef}></div>
        </div>
    );
};
