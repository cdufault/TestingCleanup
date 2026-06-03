import MapView from '@arcgis/core/views/MapView';
import SceneView from '@arcgis/core/views/SceneView';
import WebScene from '@arcgis/core/WebScene';
import { ViewState } from '../../data/StaticViewState';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import SimpleRenderer from '@arcgis/core/renderers/SimpleRenderer';
import { getTargetGeometry } from '@stratcom/lib-functions';
import SunLighting from '@arcgis/core/views/3d/environment/SunLighting';
import PortalItem from '@arcgis/core/portal/PortalItem';
import { initSearch, searchConfig } from '@stratcom/react-widget-lib';
import { Point } from '@arcgis/core/geometry';

/**
 * Load the view from a saved state object.
 * @param viewState saved view state object
 * @param div DOM node to place the map
 * @param viewType 2d or 3d view
 */
function cachedViewState(viewState: ViewState, div: HTMLDivElement, viewType: string) {
    console.debug('Using cached view state.');
    let view = viewType === '2d' ? new MapView() : new SceneView();
    if (viewState.currentWebScene) {
        view.map = viewState.currentWebScene;
        view.viewpoint = viewState.currentView.viewpoint;
    }
    view.container = div;
    viewState.currentView = view;

    return viewState;
}

/**
 * Load the WebScene and add it to a MapView or SceneView
 * @param activeViewType 2d or 3d view
 * @param newPortalItemIdToLoad WebScene portal item id
 * @param div dom node to place the map
 * @param hiddenDiv hidden dom node to load the map
 * @param getCachedView function on the useViewState hook for getting a cached copy of the view given a portal item id
 * @param defaultSymbol feature symbol to use when converting from a SceneView to a mapview
 * @param lightingIsEnabled true if scene lighting is enabled - defaults to false
 * @param searchConfiguration config for the search geocoder tool
 */
export async function loadView(
    activeViewType: string,
    newPortalItemIdToLoad: string,
    div: HTMLDivElement,
    hiddenDiv: HTMLDivElement,
    getCachedView: (arg: string, arg2: string) => any,
    defaultSymbol: any,
    lightingIsEnabled: boolean,
    searchConfiguration: searchConfig
): Promise<ViewState | undefined> {
    //disabling cache for now but keeping code in place for the time being
    /*
    const viewType = activeViewType === 'MAP' ? '2d' : '3d';
    const  vstate = getCachedView(newPortalItemIdToLoad, viewType);
    if(vstate && vstate.portalItemId === newPortalItemIdToLoad){ //get the correct view state object
        return cachedViewState(vstate, div, viewType);
    }  */
    //nothing in saved view state, start by creating a new scene from the newPortalItemIdToLoad
    const webScene = new WebScene({
        portalItem: {
            id: newPortalItemIdToLoad,
        },
    });
    await webScene.loadAll();

    let view: MapView | SceneView | undefined;
    if (activeViewType === 'MAP') {
        await prepSceneForDisplayInMapView(webScene, defaultSymbol);
        view = await init2DMapView(newPortalItemIdToLoad, webScene, div, hiddenDiv);
    } else {
        view = init3DSceneView(webScene, div, lightingIsEnabled);
    }

    if (view) {
        await initSearch(view, searchConfiguration);
        return { currentView: view, portalItemId: newPortalItemIdToLoad, currentWebScene: webScene } as ViewState;
    }
    return undefined; //view creation failed, caller will log message and handle accordingly
}

/**
 * It appears that in order to set a mapview's extent based on a SceneView we need the SceneView to be rendered into a map.
 * This method will render the SceneView into a hidden div and then get its extent viewpoint
 * @param webSceneToLoadID the Portal Item ID of the WebScene load
 * @param webScene default scene for the region
 * @param viewContainer DOM node to place a hidden map
 * @param hiddenDiv DOM node to load a SceneView in order to get a viewpoint for the mapview
 */
async function init2DMapView(
    webSceneToLoadID: string,
    webScene: WebScene,
    viewContainer: HTMLDivElement,
    hiddenDiv: HTMLDivElement
): Promise<MapView | undefined> {
    // this is needed not sure why
    const sceneView = new SceneView({
        map: webScene,
        container: hiddenDiv,
        constraints: {
            tilt: {
                max: 0,
            },
        },
    });
    let view = new MapView({
        map: webScene,
        zoom: 3,
        center: [0, 0],
    });
    const sceneAsPortalItem = new PortalItem({
        id: webSceneToLoadID,
    });
    await sceneAsPortalItem.load();
    await sceneAsPortalItem.fetchData().then((data) => {
        if (data && data.viewingMode === 'global') {
            // manually create center point for view center based on x and y - for when viewpoint.camera does not exist
            // on webmap or is undefined
            if (data.initialState.viewpoint.camera === undefined) {
                view.center = new Point({
                    x: data.initialState.viewpoint.targetGeometry.x,
                    y: data.initialState.viewpoint.targetGeometry.y,
                    spatialReference: {
                        wkid: data.initialState.viewpoint.targetGeometry.spatialReference.wkid,
                    },
                });
            } else {
                // builds center point for view based on camera angle of scene
                view.center = getTargetGeometry(data.initialState.viewpoint.camera);
            }
        }
    });

    view.container = viewContainer;

    return view;
}

/**
 * Returns date object for noon at the specified longitude
 * Assumes 15 degrees of longitude per time zone to calculate rough UTC offset
 * @param longitude
 */
export function getMidDayAtLongitude(longitude: number): Date {
    const timeZone = Math.round((longitude * 24) / 360);
    const plusMinus = timeZone >= 0 ? '+' : '';
    return new Date(`${new Date().toDateString()} 12:00:00 UTC${plusMinus}${timeZone}`);
}

/**
 * Create a new scene view object
 * @param scene region webScene
 * @param div dom node to attach the map
 * @param lightingIsEnabled indicates is lighting is being supported on the scene
 */
function init3DSceneView(scene: WebScene, div: HTMLDivElement, lightingIsEnabled: boolean): MapView | SceneView {
    let view: SceneView = new SceneView({
        map: scene,
    });
    if (!lightingIsEnabled) {
        view = new SceneView({
            map: scene,
            environment: {
                atmosphereEnabled: false,
                lighting: {
                    type: 'virtual',
                    directShadowsEnabled: false,
                },
            },
        });
    } else {
        view = new SceneView({
            map: scene,
            environment: {
                atmosphereEnabled: false,
                lighting: {
                    type: 'sun',
                    directShadowsEnabled: false,
                    //set daylight to follow viewpoint
                    cameraTrackingEnabled: true,
                },
            },
        });
    }

    view.when(() => {
        if (lightingIsEnabled && view.environment.lighting) {
            const mapDate = getMidDayAtLongitude(view.camera.position.longitude);
            const sunLighting = view.environment.lighting as SunLighting;
            sunLighting.date = mapDate;
        }
    }).catch((error: any) => {
        console.error('Unable to load scene: ', error);
    });

    view.container = div;
    return view;
}

/**
 * Enable a WebScene to be loaded into a SceneView by removing certain layer types and renderers
 * @param webScene default region webScene
 * @param defaultSymbol the default symbol for the view
 */
async function prepSceneForDisplayInMapView(webScene: WebScene, defaultSymbol: any): Promise<WebScene> {
    const sceneForMapView = webScene;
    for (const layer of Array.from(sceneForMapView.layers)) {
        const featureLayer = layer as FeatureLayer;
        const renderer = featureLayer.renderer as SimpleRenderer;
        if (renderer && layer.visible && renderer.symbol?.type === 'point-3d') {
            const defaultMarkerSymbol = new SimpleMarkerSymbol(defaultSymbol);
            featureLayer.renderer = new SimpleRenderer({ symbol: defaultMarkerSymbol });
        } else if (layer.type === 'point-cloud' || layer.type === 'scene' || layer.type === 'integrated-mesh') {
            sceneForMapView.remove(layer);
        }
    }
    return sceneForMapView;
}
