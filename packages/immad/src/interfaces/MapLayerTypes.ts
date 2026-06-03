import SpatialReference from '@arcgis/core/geometry/SpatialReference';

export interface MapLayerInfo {
    name: string;
    url: string;
    itemId: string;
    source: string;
    sr: SpatialReference;
}
