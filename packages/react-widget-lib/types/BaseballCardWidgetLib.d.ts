import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";
import CSVLayer from "@arcgis/core/layers/CSVLayer";
import ImageryLayer from "@arcgis/core/layers/ImageryLayer";
import ImageryTileLayer from "@arcgis/core/layers/ImageryTileLayer";
import OGCFeatureLayer from "@arcgis/core/layers/OGCFeatureLayer";
import PointCloudLayer from "@arcgis/core/layers/PointCloudLayer";
import StreamLayer from "@arcgis/core/layers/StreamLayer";
import WFSLayer from "@arcgis/core/layers/WFSLayer";
import SceneLayer from "@arcgis/core/layers/SceneLayer";
/**
 * Props passed in to the Legend widget
 */
export interface BaseballCardWidgetProps {
    /**
     * Controls whether the active view is in 2D or 3D
     */
    activeView: "MAP" | "SCENE";
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
    /**
     * speed of the goto animation
     */
    panningSpeed: number;
    /**
     * default amount of map scale to apply when the zoomTo button is clicked and the
     * current feature has a point geometry type
     */
    zoomScale: number;
    /**
     * array of object ids representing the selected/highlighted features on the map
     */
    selectedFeatures: number[];
    /**
     * the layer that is providing the selected/highlighted features
     */
    selectedLayer: __esri.Layer | undefined;
    /**
     * callback method to clear selected features
     * @returns void
     */
    clearSelectedFeaturesCallback: () => void;
    /**
     * fill color (RGP) values for the flash symbol graphic
     */
    flashGraphicColor: number[];
}
/**
 * Layer types supporting popups
 */
export type PopupSupportedLayer = FeatureLayer | CSVLayer | GeoJSONLayer | ImageryLayer | ImageryTileLayer | OGCFeatureLayer | PointCloudLayer | SceneLayer | StreamLayer | WFSLayer;
/** Baseball card widget - supports custom popup templates and creates default ones when needed */
export declare const BaseballCardWidgetLib: (props: BaseballCardWidgetProps) => JSX.Element;
