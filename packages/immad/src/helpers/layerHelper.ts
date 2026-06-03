import FeatureSet from '@arcgis/core/rest/support/FeatureSet';
import WFSLayer from '@arcgis/core/layers/WFSLayer';
import FeatureLayer = __esri.FeatureLayer;
import Field = __esri.Field;
import Graphic = __esri.Graphic;
import LabelClass = __esri.LabelClass;
import Renderer = __esri.Renderer;
import Layer = __esri.Layer;
import { ConfigHelper } from './configHelper';
import WMSLayer = __esri.WMSLayer;
import GeoJSONLayer = __esri.GeoJSONLayer;
import GroupLayer = __esri.GroupLayer;
import { LogHelper } from './logHelper';
import Collection = __esri.Collection;
import Extent from '@arcgis/core/geometry/Extent';
import PointCloudLayer = __esri.PointCloudLayer;
import IntegratedMeshLayer = __esri.IntegratedMeshLayer;
import SceneLayer = __esri.SceneLayer;
import BuildingSceneLayer = __esri.BuildingSceneLayer;
import SubtypeGroupLayer = __esri.SubtypeGroupLayer;
import StreamLayer = __esri.StreamLayer;
import OGCFeatureLayer = __esri.OGCFeatureLayer;
import GraphicsLayer = __esri.GraphicsLayer;
import CSVLayer = __esri.CSVLayer;

/**
 * A subset of the DrawingInfo object defined by the web map specification.
 * https://developers.arcgis.com/web-map-specification/objects/drawingInfo/
 */
export interface DrawingInfo {
    fixedSymbols: boolean;
    labelingInfo: LabelClass[];
    renderer: Renderer;
    scaleSymbols: boolean;
    showLabels: boolean;
    transparency: number;
}

/**
 * Geometry type expected by the geoprocessing tools
 */
export type GpGeomType =
    | 'esriGeometryEnvelope'
    | 'esriGeometryMultipoint'
    | 'esriGeometryPoint'
    | 'esriGeometryPolygon'
    | 'esriGeometryPolyline';

/**
 * A subset of the LayerDefinition object defined by the web map specification.
 * https://developers.arcgis.com/web-map-specification/objects/layerDefinition/
 */
export interface LayerDefinition {
    objectIdField: string;
    type: string;
    drawingInfo: DrawingInfo;
    name: string;
    hasAttachments: boolean;
    capabilities: string;
    geometryType: GpGeomType;
    fields: Field[];
}

/**
 * The FeatureSet object defined by the web map specification.  This is different from the
 * FeatureSet interface defined by the ArcGIS Javascript API.
 * https://developers.arcgis.com/web-map-specification/objects/featureSet/
 */
export interface WebMapFeatureSet {
    features: Graphic[];
    geometryType: GpGeomType;
}

/**
 * A subset of the FeatureCollection layer object defined by the web map specifcation.
 * https://developers.arcgis.com/web-map-specification/objects/featureCollection/
 */
export interface WebMapFeatureCollectionLayer {
    featureSet: WebMapFeatureSet;
    layerDefinition: LayerDefinition;
    nextObjectId?: number;
    showLegend?: boolean;
}

/**
 * The schema defining Feature Service inputs for some Raster Analytics tasks.
 * https://developers.arcgis.com/rest/services-reference/enterprise/feature-input.htm
 */
export interface FeatureServiceUrlParam {
    url: string;
    filter?: string;
}

/**
 * Converts a feature layer object into a feature layer url parameter object for use by
 * Raster Analysis GP Tasks that require a feature input.
 * @param layer The feature layer to convert.
 * @returns an object containing properties used by Raster Analytics tasks requring feature input parameters.
 */
export const convertFeatureLayerToUrlParam = (layer: FeatureLayer): FeatureServiceUrlParam => {
    if (!layer.url) {
        throw Error('Cannot convert client side feature layer into a Url Parameter.');
    }

    const param = {
        url: layer.url + '/' + layer.layerId,
    } as FeatureServiceUrlParam;

    if (layer.definitionExpression) {
        param['filter'] = layer.definitionExpression;
    }

    return param;
};

/**
 * Converts a feature layer object into a feature set for use by GP Tasks that require a
 * GPFeatureRecordSetLayer input parameter.
 * @param layer The feature layer to convert.
 * @returns a feature set object.
 */
export const convertFeatureLayerToFeatureSet = async (layer: FeatureLayer): Promise<FeatureSet> => {
    let results: Promise<FeatureSet>;

    if (layer.url) {
        results = layer.queryFeatures();
    } else {
        results = new Promise<FeatureSet>((resolve, reject) => {
            const featureSet = new FeatureSet({
                displayFieldName: layer.displayField,
                exceededTransferLimit: false,
                fields: layer.fields,
                spatialReference: layer.spatialReference,
            });

            // Feature sets do not support multipatches
            if (layer.geometryType !== 'multipatch') {
                featureSet.features = layer.source.toArray();
                featureSet.set('geometryType', layer.geometryType);
                resolve(featureSet);
            } else {
                reject('Feature sets do not support the multipatch geometry type.');
            }
        });
    }

    return results;
};

/**
 * Converts a feature layer object into a web map feature collection layer for use by
 * Raster Analytics Tasks inputs that can be a raster or feature.
 * @param layer The feature layer to convert.
 * @param featureSelection if layer has selection use those OBJECTID's in the query
 * @param selectionContextLayer the layer in the context that holds the current selection
 * @param currentExtent use View's current Extent.
 * @param includeZValue boolean for 3d items.
 * @returns a web map feature collection layer object.
 */
export const convertFeatureLayerToFeatureCollectionLayer = async (
    layer: FeatureLayer,
    featureSelection: number[],
    selectionContextLayer: Layer | undefined,
    currentExtent: Extent | null,
    includeZValue = true
): Promise<WebMapFeatureCollectionLayer> => {
    return new Promise<WebMapFeatureCollectionLayer>(async (resolve, reject) => {
        if (layer.geometryType === 'multipatch') {
            reject('Feature sets do not support the multipatch geometry type.');
        }
        // used on query to respect filters applied to the layer.
        const query = layer.createQuery();
        if (featureSelection.length > 0) {
            // NOTE: when multiple selection is implemented need to update and check selectionLayers at that point
            if (selectionContextLayer?.id === layer.id) {
                // query for selected feature(s) to pass in
                query.objectIds = featureSelection;
                LogHelper.log('Using selection set to filter input feature set for ' + layer.title, false);
            }
        }
        if (currentExtent) {
            query.geometry = currentExtent;
            query.outSpatialReference = layer.spatialReference;
            LogHelper.log('Using Extent set to filter input feature set for ' + layer.title, false);
        }

        const features: FeatureSet = await layer.queryFeatures(query);

        if (!includeZValue) {
            features.features.forEach(function (item) {
                item.geometry.z = undefined;
            });
        }

        const webMapFeatures = {
            features: features.features,
            geometryType: getGpGeometryTypeFromFeatureLayer(layer),
        } as WebMapFeatureSet;

        const webMapLayerDefinition = {
            objectIdField: layer.objectIdField,
            templates: [],
            type: 'Feature Layer',
            drawingInfo: {} as DrawingInfo,
            name: layer.title,
            hasAttachments: false,
            capabilities: 'Query',
            types: [],
            geometryType: getGpGeometryTypeFromFeatureLayer(layer),
            fields: features.fields,
        } as LayerDefinition;

        resolve({
            featureSet: webMapFeatures,
            layerDefinition: webMapLayerDefinition,
        });
    });
};

/**
 * Converts the default feature layer geometry type to the format expected by the gp tools
 * @param layer
 */
export const getGpGeometryTypeFromFeatureLayer = (layer: FeatureLayer): GpGeomType => {
    let webMapGeometryType: GpGeomType;
    switch (layer.geometryType) {
        case 'mesh':
        case 'multipatch':
        case 'multipoint':
        case 'point':
            webMapGeometryType = 'esriGeometryPoint';
            break;
        case 'polygon':
            webMapGeometryType = 'esriGeometryPolygon';
            break;
        case 'polyline':
            webMapGeometryType = 'esriGeometryPolyline';
            break;
        default:
            webMapGeometryType = 'esriGeometryPoint';
    }
    return webMapGeometryType;
};

/**
 * Converts FeatureLayer to webmap spec json for saving non-owner maps.
 * @param layer to convert to feature layer json
 * @returns a webmap spec json object.
 */
export const getWebMapJsonForFeatureLayer = (layer: Layer): any => {
    const featureLayer = layer as FeatureLayer;
    let jsonUrl = undefined;
    if (featureLayer.url && featureLayer.layerId) {
        jsonUrl = featureLayer.url + '/' + featureLayer.layerId;
    }
    if (featureLayer.portalItem) {
        return {
            id: layer.id,
            layerType: layer.operationalLayerType,
            url: jsonUrl,
            visibility: layer.visible,
            opacity: layer.opacity,
            title: layer.title,
            itemId: featureLayer.portalItem.id,
            refreshInterval: featureLayer.refreshInterval,
        };
    } else if (jsonUrl) {
        // No portalItem but url exists
        return {
            id: layer.id,
            layerType: layer.operationalLayerType,
            url: jsonUrl,
            visibility: layer.visible,
            opacity: layer.opacity,
            title: layer.title,
            refreshInterval: featureLayer.refreshInterval,
        };
    } else {
        // feature collection version needs it's own ticket.
        // return featureLayer.queryFeatures().then((featureSet) => {
        //     console.log(featureSet);
        //     const test = layer as FeatureLayer;
        //     console.log(test);
        //     return {
        //         id: layer.id,
        //         layerType: layer.operationalLayerType,
        //         visibility: layer.visible,
        //         opacity: layer.opacity,
        //         title: layer.title,
        //         featureCollectionType: 'notes',
        //         featureCollection: {
        //             layers: [],
        //             showLegend: false,
        //         },
        //     };
        // });
        return {};
    }
};

/**
 * Converts a WMS layer to webmap spec json for saving non-owner maps.
 * @param layer to convert to WMS layer json
 * @returns a webmap spec json object.
 */
export const getWebMapJsonForWMS = (layer: Layer): JSON => {
    const wmsLayer = layer as WMSLayer;
    const subLayers = wmsLayer.allSublayers;
    const layers = [];
    const visibleLayers = [];
    let subJson = {};
    for (let i = 0; i < subLayers.length; i++) {
        const aLayer = subLayers.items[i];
        if (aLayer) {
            subJson = {
                name: aLayer.name,
                title: aLayer.title,
                legendUrl: aLayer.legendUrl,
                queryable: aLayer.queryable,
            };
            layers.push(subJson);
            visibleLayers.push(aLayer.name);
        }
    }
    return {
        id: layer.id,
        url: layer.url,
        visibility: layer.visible,
        opacity: layer.opacity,
        title: layer.title,
        itemId: layer.portalItem.id,
        version: layer.version,
        mapUrl: layer.mapUrl,
        featureInfoUrl: layer.featureInfoUrl,
        featureInfoFormat: layer.featureInfoFormat,
        visibleLayers,
        layers,
        spatialReferences: [layer.spatialReference.wkid],
        extent: [
            [layer.fullExtent.xmin, layer.fullExtent.ymin],
            [layer.fullExtent.xmax, layer.fullExtent.ymax],
        ],
        maxWidth: layer.imageMaxWidth,
        maxHeight: layer.imageMaxHeight,
        type: layer.type.toUpperCase(),
        layerType: layer.type.toUpperCase(),
    };
};

/**
 * Converts GeoJson Layer to webmap spec json for saving non-owner maps.
 * @param layer to convert to Geo Json layer json
 * @returns a webmap spec json object.
 */
export const getWebMapJsonForGeoJsonLayer = (layer: Layer): JSON => {
    const geoJsonLayer = layer as GeoJSONLayer;
    return {
        id: geoJsonLayer.id,
        layerType: layer.operationalLayerType,
        url: geoJsonLayer.url,
        visibility: geoJsonLayer.visible,
        opacity: geoJsonLayer.opacity,
        title: geoJsonLayer.title,
    };
};

/**
 * Converts Map Image Layer to webmap spec json for saving non-owner maps.
 * @param layer to convert to Map Image layer json
 * @returns a webmap spec json object.
 */
export const getWebMapJsonForMapImageLayer = (layer: Layer): JSON => {
    return {
        id: layer.id,
        layerType: layer.operationalLayerType,
        url: layer.url,
        visibility: layer.visible,
        opacity: layer.opacity,
        title: layer.title,
        itemId: layer.portalItem.id,
        refreshInterval: layer.refreshInterval,
    };
};

/**
 * Converts WFS Layer to webmap spec json for saving non-owner maps.
 * using a 3.x version of the WFS layer spec. May need to make a new function
 * for when 4.x version comes out
 * @param layer to convert to WFS layer json
 * @returns a webmap spec json object.
 */
export const getWebMapJsonForWFSLayer = (layer: Layer): JSON => {
    const wfsLayer = layer as WFSLayer;
    return {
        id: layer.id,
        url: wfsLayer.url,
        visibility: layer.visible,
        layerDefinition: wfsLayer.resourceInfo.layerDefinition,
        popupInfo: wfsLayer.resourceInfo.popupInfo,
        type: wfsLayer.resourceInfo.type,
        layerType: wfsLayer.resourceInfo.layerType,
        mode: wfsLayer.resourceInfo.mode,
        wfsInfo: wfsLayer.resourceInfo.wfsInfo,
    };
};

/**
 * Converts Map Image Layer to webmap spec json for saving non-owner maps.
 * @param layer to convert to Map Image layer json
 * @returns a webmap spec json object.
 */
export const getWebMapJsonForGroupLayer = (layer: Layer): JSON => {
    const groupLayer = layer as GroupLayer;
    const subLayers = groupLayer.layers;
    const layers = getWebMapJsonForGroupSubLayers(subLayers);
    return {
        id: layer.id,
        layerType: layer.operationalLayerType,
        visibilityMode: layer.visible,
        listMode: groupLayer.listMode,
        opacity: layer.opacity,
        maxScale: groupLayer.maxScale,
        minScale: groupLayer.minScale,
        title: layer.title,
        visibility: layer.visible,
        layers,
    };
};

/**
 * Gets the correct WebMap JSON for the sublayers passed in.
 * Returns them in an array that can be added to the group layer layers object.
 * @param subLayers Collection of layers to turn to Web Map json.
 * @return Array of WebMapJsons for each sublayer of the GroupLayer
 */
const getWebMapJsonForGroupSubLayers = (subLayers: Collection<Layer>): Array<any> => {
    const layers = [];
    let subJson = {};
    for (let i = 0; i < subLayers.length; i++) {
        const aLayer = subLayers.items[i];
        switch (aLayer.type) {
            case 'unsupported':
                // figure out type here and call right functions if one exists
                // resourceInfo is a 3.x construct no js 4.0
                if (aLayer.resourceInfo.type === 'WFS') {
                    subJson = getWebMapJsonForWFSLayer(aLayer);
                }
                break;
            case 'geojson':
                subJson = getWebMapJsonForGeoJsonLayer(aLayer);
                break;
            case 'feature':
                subJson = getWebMapJsonForFeatureLayer(aLayer);
                break;
            case 'wms':
                subJson = getWebMapJsonForWMS(aLayer);
                break;
            case 'map-image':
                subJson = getWebMapJsonForMapImageLayer(aLayer);
                break;
            case 'wfs':
                // unsupported and wfs are how geoserver host geoJson. Need to check GeoJson as well?
                // need better data on GeoJSON will get back
                subJson = getWebMapJsonForWFSLayer(aLayer);
                break;
            default:
                subJson = getWebMapJsonForMapImageLayer(aLayer);
                LogHelper.log('Layer is not supported for type??: ' + aLayer.type);
        }
        layers.push(subJson);
    }
    return layers;
};

/**
 *  Represents types that contain the elevationInfo object.
 *  BuildingSceneLayer is excluded since it only supports one mode.
 *  This information is correct of JSAPI 4.23.0.
 *
 */
export type ElevationInfoLayer =
    | FeatureLayer
    | GeoJSONLayer
    | CSVLayer
    | GraphicsLayer
    | OGCFeatureLayer
    | StreamLayer
    | SubtypeGroupLayer
    | BuildingSceneLayer
    | WFSLayer
    | SceneLayer
    | IntegratedMeshLayer
    | PointCloudLayer;

export const checkAndUpdateLayerDefaultElevationStrategy = (layer: Layer): __esri.Layer => {
    const elevationInfoLayer = layer as ElevationInfoLayer;
    const appConfig = ConfigHelper.getAppConfig();
    if (elevationInfoLayer) {
        if (!elevationInfoLayer.elevationInfo) {
            const hasZ: boolean = layer?.hasZ;
            // Use on-the-ground is no Z values are set.
            elevationInfoLayer.elevationInfo = {
                mode: hasZ ? appConfig.defaultElevationMode : 'on-the-ground',
            };
        }
    } else {
        return layer;
    }

    return elevationInfoLayer as Layer;
};
