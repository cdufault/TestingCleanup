import FeatureLayer = __esri.FeatureLayer;
import ImageryLayer = __esri.ImageryLayer;

/**
 * Base class representing a doctrinal template data source.
 */
class DataSource {
    id: string;
    alias: string;
    type: 'FeatureService' | 'ImageService' | 'Template';
}

/**
 * Defines the method of how a feature based data source is converted to a raster
 * based data source.
 */
enum FeatureServiceConversionType {
    Buffer = 'Buffer',
    FeatureToRaster = 'Feature To Raster',
    Interpolate = 'Interpolate',
}

/**
 * Data source based on a feature service layer.
 */
class FeatureServiceDataSource extends DataSource {
    layer: FeatureLayer;
    conversionType: FeatureServiceConversionType;

    constructor(layer: FeatureLayer) {
        super();
        this.type = 'FeatureService';
        this.alias = layer.title;
        this.layer = layer;
        this.conversionType = FeatureServiceConversionType.Buffer;

        // This format is being used to make the id property compatible with being
        // used as an input name property in the raster calculator raster function.
        this.id = 'FeatureServiceDataSource_' + layer.id.split('-').join('_');
    }
}

/**
 * Data source based on an image service layer.
 */
class ImageServiceDataSource extends DataSource {
    layer: ImageryLayer;

    constructor(layer: ImageryLayer) {
        super();
        this.type = 'ImageService';
        this.alias = layer.title;
        this.layer = layer;

        // This format is being used to make the id property compatible with being
        // used as an input name property in the raster calculator raster function.
        this.id = 'ImageServiceDataSource_' + layer.id.split('-').join('_');
    }
}

export { DataSource, FeatureServiceDataSource, ImageServiceDataSource };
