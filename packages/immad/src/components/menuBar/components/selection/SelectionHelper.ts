import Layer from '@arcgis/core/layers/Layer';
import ImageryLayer = __esri.ImageryLayer;
import Geometry from '@arcgis/core/geometry/Geometry';
import * as geometryEngineAsync from '@arcgis/core/geometry/geometryEngineAsync';
import FeatureLayer = __esri.FeatureLayer;
import GeoJSONLayer = __esri.GeoJSONLayer;
import CSVLayer = __esri.CSVLayer;
import SceneLayer = __esri.SceneLayer;
import WFSLayer = __esri.WFSLayer;
import Query from '@arcgis/core/rest/support/Query';

/**
 * A Layer that can be selected (includes the queryByIDs function)
 * Imagery Layers can also be selected (with some limitations)
 */
export type SelectableLayer = FeatureLayer | CSVLayer | GeoJSONLayer | ImageryLayer | SceneLayer | WFSLayer;

/**
 * Provides a more detailed check for selectable layers. For imagery layers,
 * only those with attribute tables (fields with length > 0) are supported.
 * @param layer The input Layer
 */
export const isLayerSelectable = (layer: Layer): boolean => {
    const SELECTABLE_LAYER_TYPES = ['feature', 'csv', 'geojson', 'imagery', 'scene', 'wfs'];
    if (SELECTABLE_LAYER_TYPES.indexOf(layer.type) < 0) return false;

    /** Raster imagery must have an attribute table to be selectable **/
    if (layer.type === 'imagery') {
        const imageryLayer = layer as ImageryLayer;
        return imageryLayer.fields && imageryLayer.fields.length > 0;
    }

    return true;
};

/**
 * Represents an ArcGIS spatial relationship operator.
 */
export type SpatialRelationship =
    | 'intersects'
    | 'contains'
    | 'crosses'
    | 'disjoint'
    | 'envelope-intersects'
    | 'index-intersects'
    | 'overlaps'
    | 'touches'
    | 'within'
    | 'relation';

/**
 * The parameters for executing the Select By Location operation
 */
export interface SelectByLocationParams {
    op: SpatialRelationship;
    targetLayer: SelectableLayer;
    spatialLayer: Exclude<SelectableLayer, ImageryLayer>;
}

/**
 * Selects Features by Location asynchronously
 * @param op
 * @param targetLayer
 * @param spatialLayer
 * @param spatialLayerSelectionSet An optional selection set of spatial layer features
 */
export const selectByLocationAsync = async (
    op: SpatialRelationship,
    targetLayer: SelectableLayer,
    spatialLayer: Exclude<SelectableLayer, ImageryLayer>,
    spatialLayerSelectionSet?: number[]
) => {
    // first get geometries
    const query = spatialLayer.createQuery();
    query.outFields = [];
    query.returnGeometry = true;

    // Use existing selection if the bounding layer itself has an active selection set.
    if (spatialLayerSelectionSet) {
        query.objectIds = spatialLayerSelectionSet;
    }

    const result = await spatialLayer.queryFeatures(query);

    const geometries: Geometry[] = result.features
        .filter((graphic) => graphic.geometry!!)
        .map((graphic) => graphic.geometry);

    if (geometries.length > 0) {
        const unionGeometries = await geometryEngineAsync.union(geometries);
        const selectionQuery = targetLayer.type === 'imagery' ? new Query() : targetLayer.createQuery();
        selectionQuery.geometry = unionGeometries;
        selectionQuery.spatialRelationship = op;

        return await targetLayer.queryObjectIds(selectionQuery);
    }
};
