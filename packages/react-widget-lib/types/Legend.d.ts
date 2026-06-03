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
export declare const Legend: (props: LegendProps) => JSX.Element;
