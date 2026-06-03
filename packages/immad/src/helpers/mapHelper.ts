import { IGroup, IItem, IUpdateItemResponse, IUser, updateItem } from '@esri/arcgis-rest-portal';

import { getUserSession } from './userSessionHelper';
import { LogHelper } from './logHelper';
import { getDefaultPortal, getPortalRestUrl } from './defaultPortalHelper';
import { getGroupContentByGroupId } from './portalGroupHelper';

import ImageryLayer from '@arcgis/core/layers/ImageryLayer';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import MapView from '@arcgis/core/views/MapView';
import SceneView from '@arcgis/core/views/SceneView';
import Collection from '@arcgis/core/core/Collection';
import Layer from '@arcgis/core/layers/Layer';
import { MapLayerInfo } from '../interfaces/MapLayerTypes';
import LayerView from '@arcgis/core/views/layers/LayerView';
import MapImageLayer from '@arcgis/core/layers/MapImageLayer';
import FieldInfo from '@arcgis/core/popup/FieldInfo';
import PopupTemplate from '@arcgis/core/PopupTemplate';
import { SelectionMode } from '../contexts/FeatureSelectionContext';
import View = __esri.View;
import HitTestResult = __esri.HitTestResult;
import SceneViewHitTestResult = __esri.SceneViewHitTestResult;
import GraphicHit = __esri.GraphicHit;
import SceneViewGraphicHit = __esri.SceneViewGraphicHit;
import ViewClickEvent = __esri.ViewClickEvent;
import ViewKeyUpEvent = __esri.ViewKeyUpEvent;
import ViewKeyDownEvent = __esri.ViewKeyDownEvent;

export interface SearchPortalResponseProp {
    item: IItem[] | IUser[] | IGroup[] | any[];
    success: boolean;
}

export async function getPortalBasemaps(): Promise<SearchPortalResponseProp> {
    const resultObj: SearchPortalResponseProp = {
        item: [],
        success: false,
    };

    const portal = await getDefaultPortal();
    if (portal) {
        await portal.fetchBasemaps().then((basemaps) => {
            resultObj.success = true;
            resultObj.item = basemaps;
        });
    }
    return resultObj;
}

export async function updatePortalMapExtent(itemId: string, extent: string): Promise<any> {
    let data: IUpdateItemResponse = { success: false, id: '' };
    const session = await getUserSession();

    if (session) {
        const portalRestUrl = await getPortalRestUrl();
        await updateItem({
            item: {
                id: itemId,
                extent: extent,
            },
            authentication: session,
            portal: portalRestUrl,
        })
            .then((result) => {
                data = result;
            })
            .catch((error) => {
                LogHelper.log(error, true);
                return data;
            });
    }

    return data;
}

/**
 *
 * @param missionId mission id
 * @param mapItemType map item type which will be either '3D' or '2D'
 */
export async function getDefaultMissionMap(missionId: string, mapItemType = 'Web Scene'): Promise<any> {
    const result: IItem[] = await getGroupContentByGroupId(missionId);
    if (result && result.length > 0) {
        const scene = result.find((scene) => {
            return scene.type === mapItemType; //expecting at most one scene
        });
        const webMap = result.find((item) => {
            return item.type === 'Web Map'; // expecting at most one map
        });
        if (scene) {
            return scene.id;
        } else if (webMap) {
            return webMap.id;
        } else {
            return undefined;
        }
    } else {
        return undefined;
    }
}

export const getFeatureLayersFromMap = (view: View): FeatureLayer[] => {
    const featureLayers: FeatureLayer[] = [];

    if (view) {
        view.map.layers.forEach((layer) => {
            if (layer.type === 'feature') {
                featureLayers.push(layer as FeatureLayer);
            }
        });
    }

    return featureLayers;
};

export function getLayersFromMap(view: MapView | SceneView | undefined, type: string): MapLayerInfo[] {
    //valid values for type are feature and imagery
    if (!view) {
        console.error('View not defined');
        return [];
    }
    const { layers } = view.map;
    if (layers && layers.length > 0) {
        const fLayers = layers
            .filter((lyr: FeatureLayer | ImageryLayer) => {
                return lyr.type === type;
            })
            .map((lyr: FeatureLayer | ImageryLayer) => {
                const { id, title, url, spatialReference } = lyr;
                let itemId = id;
                if (lyr.portalItem && type === 'imagery') {
                    itemId = lyr.portalItem.id;
                }
                let layerId = '';
                if (lyr.type === 'feature') {
                    if (lyr.layerId >= 0) {
                        layerId = '/' + lyr.layerId.toString();
                    }
                }
                return { name: title, url: url + layerId, itemId: itemId, source: 'map', sr: spatialReference };
            });
        return fLayers.toArray();
    } else {
        return [];
    }
}

export function removeLayersFromMap(view: MapView | SceneView, layerNamesToRemove: string[]): void {
    const layersToRemove = new Collection<Layer>();
    layerNamesToRemove.forEach((name) => {
        const layerCollection = view.map.layers.filter((lyr) => lyr.title === name);
        if (layerCollection.length > 0) {
            layersToRemove.addMany(layerCollection.toArray());
        }
    });

    if (layersToRemove.length > 0) {
        view.map.removeMany(layersToRemove.toArray());
    }
}

export function addPopupsToGroupLayer(gLayer: LayerView): void {
    const parentLayer = gLayer.layer as MapImageLayer;
    parentLayer &&
        parentLayer.sublayers &&
        parentLayer.sublayers.forEach((subLayer) => {
            subLayer.load().then(() => {
                //if sublayer has the popup enabled but does not have a defined template
                if (subLayer.popupEnabled && !subLayer.popupTemplate) {
                    const fieldInfos = subLayer.fields.map((lyr) => {
                        return new FieldInfo({
                            fieldName: lyr.name,
                            label: lyr.alias ? lyr.alias : lyr.name,
                        });
                    });
                    subLayer.popupTemplate = new PopupTemplate({
                        title: subLayer.title,
                        content: [
                            {
                                type: 'fields',
                                fieldInfos: fieldInfos,
                            },
                        ],
                    });
                }
            });
        });
}

/**
 * Adds selection handling code to the MapView or SceneView. This includes map click and shift/control key events.
 * @param view
 * @param getSelectionMode Callback to get the current selection mode
 * @param setSelectionMode Callback method for storing the selection Mode
 * @param selectFeatures Callback for setting the selection data
 * @param clearSelection Callback for clearing the current selection
 * @returns A cleanup method to remove the event handlers.
 */
export function addSelectionHandlersToView(
    view: __esri.MapView | __esri.SceneView,
    getSelectionMode: () => SelectionMode | undefined,
    setSelectionMode: (value: ((prevState: SelectionMode) => SelectionMode) | SelectionMode) => void,
    selectFeatures: (
        view: __esri.MapView | __esri.SceneView,
        layer: __esri.Layer,
        ids: number[],
        selectionMode?: SelectionMode
    ) => void,
    clearSelection: () => void
) {
    if (view) {
        const clickHandle = view.on('click', (event: ViewClickEvent) => {
            const selectionMode = getSelectionMode();

            if (selectionMode !== SelectionMode.NewSelectionSet) {
                event.stopPropagation();
            }

            view.hitTest(event).then((response: HitTestResult | SceneViewHitTestResult) => {
                const graphicHitTests = response.results.filter((result) => result.type === 'graphic') as
                    | GraphicHit[]
                    | SceneViewGraphicHit[];

                if (graphicHitTests.length > 0) {
                    // The first graphic hit defines the selection layer.
                    // In the future we can provide this through selection context / selection widget.
                    const selectionLayer = graphicHitTests[0].layer;

                    // Get all the IDs under the hit test result for the first layer.
                    const ids: number[] = graphicHitTests
                        .filter((graphicHitTest) => graphicHitTest.layer === selectionLayer)
                        .map((graphicHitTest) => graphicHitTest.graphic.getObjectId());

                    selectFeatures(view, selectionLayer, ids, selectionMode);
                } else {
                    if (selectionMode === SelectionMode.NewSelectionSet) {
                        clearSelection();
                    }
                }
            });
        });

        const keyUpHandle = view.on('key-up', (event: ViewKeyUpEvent) => {
            switch (event.key) {
                case 'Control':
                    setSelectionMode((selectionMode) => selectionMode & ~SelectionMode.RemoveFromSelectionSet);
                    break;
                case 'Shift':
                    setSelectionMode((selectionMode) => selectionMode & ~SelectionMode.AddToSelectionSet);
                    break;
            }
        });

        const keyDownHandle = view.on('key-down', (event: ViewKeyDownEvent) => {
            switch (event.key) {
                case 'Control':
                    setSelectionMode((selectionMode) => selectionMode | SelectionMode.RemoveFromSelectionSet);
                    break;
                case 'Shift':
                    setSelectionMode((selectionMode) => selectionMode | SelectionMode.AddToSelectionSet);
                    break;
            }
        });

        return () => {
            clickHandle.remove();
            keyUpHandle.remove();
            keyDownHandle.remove();
        };
    }

    throw new Error('View must be defined');
}
