import MapView from '@arcgis/core/views/MapView';
import SceneView from '@arcgis/core/views/SceneView';
import { initBasemapGallery, initCompass, initCoordinateConversion, initScaleBar, initViewSwitcher } from './widgets';
import WebScene from '@arcgis/core/WebScene';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import SimpleRenderer from '@arcgis/core/renderers/SimpleRenderer';
import Layer from '@arcgis/core/layers/Layer';
import { ConfigHelper } from '../helpers/configHelper';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import Color from '@arcgis/core/Color';
import { initSearch, searchConfig } from '@stratcom/react-widget-lib';

/**
 * contains the removed renderer and layer to apply it back to.
 */
export interface renderReplacementObject {
    clonedRenderer: SimpleRenderer;
    layerId: string;
    // Added to preserve label information when switching between 3D and 2D views
    labelingInfo?: any[];
    labelsVisible?: boolean;
}

import { store } from './store';

/**
 * Converts 3D label symbols to 2D-compatible TextSymbol objects
 * @param labelingInfo Array of LabelClass objects to convert
 * @returns Array of converted LabelClass objects with 2D-compatible symbols
 */
function convert3DLabelsTo2D(labelingInfo: any[]): any[] {
    return labelingInfo.map((labelClass: any) => {
        if (labelClass.symbol && labelClass.symbol.type === 'label-3d') {
            // Create a new LabelClass with 2D-compatible TextSymbol
            const newLabelClass = labelClass.clone();

            // Extract properties from the 3D symbol
            const original3DSymbol = labelClass.symbol;
            const symbolLayers = original3DSymbol.symbolLayers?.items || [];

            // Create 2D TextSymbol based on 3D symbol properties
            let textColor = '#FFFFFF';
            let haloColor = '#000000';
            let haloSize = 1;
            let fontSize = 10;
            let fontFamily = 'Arial';

            // Extract properties from 3D symbol layers if available
            if (symbolLayers.length > 0) {
                const textLayer = symbolLayers.find((layer: any) => layer.type === 'text');
                if (textLayer) {
                    textColor = textLayer.material?.color?.toHex() || textColor;
                    fontSize = textLayer.size || fontSize;
                    fontFamily = textLayer.font?.family || fontFamily;

                    if (textLayer.halo) {
                        haloColor = textLayer.halo.color?.toHex() || haloColor;
                        haloSize = textLayer.halo.size || haloSize;
                    }
                }
            }

            // Create new 2D TextSymbol
            const newSymbol = {
                type: 'text',
                color: textColor,
                haloColor: haloColor,
                haloSize: haloSize,
                font: {
                    size: fontSize,
                    family: fontFamily,
                    weight: 'bold',
                },
            };

            newLabelClass.symbol = newSymbol;
            return newLabelClass;
        }

        // Return unchanged if not a 3D label
        return labelClass;
    });
}

async function createViews(map: __esri.Map): Promise<{ mapView: MapView; sceneView: SceneView | null }> {
    // zoom and center needed here to fix bug in JSAPI when adding a WebScene object as the map object.
    const mapView = new MapView({
        zoom: 1,
        center: [0, 0],
        map: map,
    });

    const initSearchConfig: searchConfig = {
        includeGeocoder: ConfigHelper.getAppConfig().search.includeGeocoder,
        name: ConfigHelper.getAppConfig().search.name,
        allPlaceholder: ConfigHelper.getAppConfig().search.allPlaceholder,
        geocoderUrl: ConfigHelper.getAppConfig().search.url,
        position: 'top-left',
    };

    const is2dOnlyActive = store.getState().webMapViewSlice.is2dOnlyActive;

    let sceneView: SceneView | null;

    if (!is2dOnlyActive) {
        sceneView = new SceneView({
            map: map,
        });
    } else {
        sceneView = null;
    }

    mapView
        .when(() => {
            // add Compass
            initCompass(mapView);
            // add View Switcher
            if (sceneView) {
                initViewSwitcher(mapView, sceneView);
            }
            // add Coordinates Conversion
            initCoordinateConversion(mapView, false);
            // add basemap gallery
            initBasemapGallery(mapView);
            // add scalebar
            initScaleBar(mapView);
            //add search
            initSearch(mapView, initSearchConfig);
        })
        .then(() => {
            console.debug('MapView Initialized');
        });

    if (sceneView) {
        const view = sceneView;
        view.when(() => {
            // add View Switcher
            initViewSwitcher(view, mapView);
            // add Coordinates Conversion
            initCoordinateConversion(view, true);
            // add basemap gallery
            initBasemapGallery(view);
            //add search
            initSearch(view, initSearchConfig);
        }).then(() => {
            console.debug('SceneView initialized.');
        });
    }

    return {
        mapView,
        sceneView,
    };
}

/**
 * Removes any layers that are not supported it MapView. Updates any 3d point layers to have 2d
 * symbology. Creates list of Layers that were removed for use in switching from 2d to 3d to add
 * in removed layers.
 * @param webScene to be converted to a object that can be used as the map in the MapView
 */
export async function sceneToMap(
    webScene: WebScene
): Promise<{ webScene: WebScene; removedLayers: Layer[]; removedRenderers: renderReplacementObject[] }> {
    const appConfig = ConfigHelper.getAppConfig();
    if (webScene?.loadStatus !== 'loaded') {
        // need all layers loaded before checking
        try {
            await webScene.loadAll().then(() => {
                return;
            });
        } catch (error) {
            throw error;
        }
    }
    const removedLayersList = [];
    const removedLayers = [];
    const removedRenderers = [];
    for (const layer of Array.from(webScene.layers)) {
        const featureLayer = layer as FeatureLayer;
        const renderer = featureLayer.renderer as SimpleRenderer;
        const typedLayer = layer as Layer;

        // Convert 3D labels to 2D-compatible labels for all feature layers
        if (featureLayer.type === 'feature' && featureLayer.labelingInfo && featureLayer.labelingInfo.length > 0) {
            featureLayer.labelingInfo = convert3DLabelsTo2D(featureLayer.labelingInfo);
        }

        if (renderer && typedLayer.visible && renderer.symbol?.type === 'point-3d') {
            // save current renderer and layer to apply it to for switching back.
            const clonedRenderer = renderer.clone();
            const layerId = typedLayer.id;

            // Also preserve label information for restoration when switching back to 3D
            const labelingInfo = featureLayer.labelingInfo
                ? featureLayer.labelingInfo.map((lc: any) => lc.clone())
                : undefined;
            const labelsVisible = featureLayer.labelsVisible;

            removedRenderers.push({
                clonedRenderer,
                layerId,
                labelingInfo,
                labelsVisible,
            });

            if (featureLayer.url && featureLayer.layerId >= 0) {
                // get featureLayer from service endpoint
                const combinedUrl = `${featureLayer.url}/${featureLayer.layerId}`;
                const originalFeatureLayer = new FeatureLayer({
                    url: combinedUrl,
                });
                await originalFeatureLayer.load();
                featureLayer.renderer = originalFeatureLayer.renderer;

                // Preserve labels if they exist on the original layer
                if (originalFeatureLayer.labelingInfo && originalFeatureLayer.labelingInfo.length > 0) {
                    featureLayer.labelingInfo = originalFeatureLayer.labelingInfo;
                    featureLayer.labelsVisible = originalFeatureLayer.labelsVisible || false;
                }
            } else {
                // unable to make url to get default renderer
                const defaultSymbol = new SimpleMarkerSymbol(appConfig.sketch.defaultSymbol);
                // make sure default color is red
                defaultSymbol.color = new Color('#FF0000');
                featureLayer.renderer = new SimpleRenderer({ symbol: defaultSymbol });
            }
        } else if (
            typedLayer.type === 'point-cloud' ||
            typedLayer.type === 'scene' ||
            typedLayer.type === 'integrated-mesh'
        ) {
            removedLayersList.push(typedLayer.title);
            webScene.remove(typedLayer);
            removedLayers.push(typedLayer);
            console.debug('layer not added as it was point cloud layer. ' + typedLayer.title);
        }
    }

    return { webScene, removedLayers, removedRenderers };
}

/**
 * Assigns the container element to the View
 * @param container
 * @param map
 * @param activeView
 */
export const initialize = async (
    container: HTMLDivElement,
    map: __esri.Map,
    activeView: 'MAP' | 'SCENE'
): Promise<{ mapView: MapView; sceneView: SceneView | null }> => {
    const { mapView, sceneView } = await createViews(map);

    if (activeView === 'SCENE') {
        if (sceneView == null) {
            throw new Error('There was an error opening the SceneView. Please check the log for more detail.');
        } else {
            sceneView.container = container;
            sceneView
                .when()
                .then((_) => {
                    console.debug('Map and View are ready');
                })
                .catch((error) => {
                    console.error('An error occurred creating the map:' + error);
                });
        }
        return {
            mapView: mapView,
            sceneView: sceneView,
        };
    }

    mapView.container = container;
    mapView
        .when()
        .then((_) => {
            console.debug('Map and View are ready');
            mapView.goTo(mapView.viewpoint.targetGeometry);
        })
        .catch((error) => {
            console.error('An error occurred creating the map:' + error);
        });

    return {
        mapView,
        sceneView,
    };
};
