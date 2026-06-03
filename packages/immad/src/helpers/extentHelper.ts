// Component imports
import MapView from '@arcgis/core/views/MapView';
import SceneView from '@arcgis/core/views/SceneView';
import Layer from '@arcgis/core/layers/Layer';
import Extent from '@arcgis/core/geometry/Extent';
import * as webMercatorUtils from '@arcgis/core/geometry/support/webMercatorUtils';
import * as geometryEngine from '@arcgis/core/geometry/geometryEngine';
import GroupLayer from '@arcgis/core/layers/GroupLayer';
import SpatialReference from '@arcgis/core/geometry/SpatialReference';
import { LogHelper } from './logHelper';
import * as projection from '@arcgis/core/geometry/projection';
import GoToOptions2D = __esri.GoToOptions2D;
import GoToOptions3D = __esri.GoToOptions3D;
import View = __esri.View;

/**
 * Zoom to Layer
 * @param layer The layer to zoom to
 * @param view The view (2D or 3D)
 * @param options Object for providing zoom options.
 * @returns A promise from the view's goTo operation.
 */
export async function zoomToLayer(layer: Layer, view: View, options?: GoToOptions2D | GoToOptions3D): Promise<any> {
    await layer.load();
    if (view.type === '2d') {
        const mapView = view as MapView;
        const layerFullExtent = getLayerFullExtent(layer, mapView);
        return mapView.goTo(layerFullExtent.extent, options as GoToOptions2D);
    } /* '3d' */ else {
        const sceneView = view as SceneView;
        const layerFullExtent = getLayerFullExtent(layer, sceneView);
        return sceneView.goTo(layerFullExtent.extent, options as GoToOptions3D);
    }
}

/**
 * Gets the full extent and scale of a layer, if it is available, projecting it to the active view's spatial reference.
 * @param layer The layer to retrieve the full extent.
 * @param view The active view
 */
export function getLayerFullExtent(
    layer: Layer,
    view: MapView | SceneView
): { extent: __esri.Geometry | undefined; scale: number } {
    let extent: Extent | undefined;

    if (layer instanceof GroupLayer && !layer.fullExtent) {
        const groupLayer = layer as GroupLayer;
        extent = groupLayer.layers
            .map((lyr) => lyr.fullExtent)
            .reduce<Extent | undefined>((prevExtent, currentExtent) => {
                if (prevExtent) {
                    const prjPrevExtent = projectExtentToSpatialReference(prevExtent, view.spatialReference) as Extent;
                    if (!currentExtent) {
                        return prjPrevExtent;
                    } else {
                        return currentExtent.union(prjPrevExtent);
                    }
                } else {
                    return projectExtentToSpatialReference(currentExtent, view.spatialReference) as Extent;
                }
            }, undefined);
    } else {
        extent = projectExtent(layer.fullExtent, view);
    }

    let scale = undefined;
    if ((layer as any).minScale) {
        scale = (layer as any).minScale;
        if (view.constraints && (view.constraints as any).effectiveLODs) {
            const lods = (view.constraints as any).effectiveLODs.filter((x: any) => x.scale < (layer as any).minScale);
            if (lods) {
                scale = lods[0].scale;
            }
        }
    }
    return {
        extent,
        scale,
    };
}

/**
 * Projects the input extent based on the input spatial reference.
 * @param extent The extent to be projected.
 * @param spatialRef The target spatial Reference
 */
export function projectExtentToSpatialReference(
    extent: Extent,
    spatialRef: SpatialReference
): __esri.Geometry | undefined {
    const extentSR = extent.spatialReference;

    if (extentSR) {
        if (extentSR.wkid === spatialRef.wkid) {
            return extent;
        }
        if (extentSR.isWebMercator && spatialRef.isWGS84) {
            return webMercatorUtils.webMercatorToGeographic(extent);
        }
        if (extentSR.isWGS84 && spatialRef.isWebMercator) {
            return webMercatorUtils.geographicToWebMercator(extent);
        }
        if (webMercatorUtils.canProject(extentSR, spatialRef)) {
            return webMercatorUtils.project(extent, spatialRef);
        }
    }

    return undefined;
}

/**
 * Projects the input extent based on the view's spatial reference.
 * @param extent The extent to be projected.
 * @param view The view
 */
export function projectExtent(extent: Extent, view: MapView | SceneView): __esri.Extent | undefined {
    if (extent) {
        const extentSR = extent.spatialReference;
        const viewSR = view.spatialReference;

        if (extentSR.wkid === viewSR.wkid) {
            return extent;
        }

        return projection.project(extent, view.spatialReference) as Extent;
    }

    return undefined;
}

/**
 * Calculates the full layer extent for the layer, accounting for group layers which do not implement fullextent.
 * @param layer
 * @param spatialRef
 */
export async function calculateLayerFullExtentAsync(
    layer: Layer,
    spatialRef?: SpatialReference
): Promise<Extent | null> {
    if (layer.fullExtent) {
        return layer.fullExtent;
    }

    let groupLayer = layer as GroupLayer;
    if (groupLayer) {
        groupLayer = await groupLayer.loadAll();
        const allExtents = await groupLayer.layers
            .filter((layer) => Boolean(layer.fullExtent))
            .map((layer) => layer.fullExtent)
            .toArray();

        if (spatialRef) {
            for (let i = 0; i < allExtents.length; i++) {
                try {
                    const extent = projectExtentToSpatialReference(allExtents[i], spatialRef) as Extent;
                    if (extent) {
                        allExtents[i] = extent;
                    }
                } catch (e) {
                    LogHelper.log(e, true);
                }
            }
        }

        return geometryEngine.union(allExtents).extent;
    }
    return null;
}
