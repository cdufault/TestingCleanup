import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import IdentityManager from '@arcgis/core/identity/IdentityManager';
import ImageryLayer from '@arcgis/core/layers/ImageryLayer';
import SpatialReference from '@arcgis/core/geometry/SpatialReference';
import * as webMercatorUtils from '@arcgis/core/geometry/support/webMercatorUtils';
import { ConstantRasterFunctionTemplate } from '../api/ConstantRasterFunctionTemplate';
import { DataSource, FeatureServiceDataSource, ImageServiceDataSource } from '../api/DataSources';
import { createConstantFunctionArguments, createConstantRFT } from './rasterFunctionTemplateHelper';
import { RasterVariable } from '../api/RasterFunctionTemplate';
import { ConfigHelper } from '../../../helpers/configHelper';
import Extent = __esri.Extent;
import Layer = __esri.Layer;
import Map = __esri.Map;

/**
 * Converts a layer into a data source or returns undefined if the layer is not convertable.
 * @param layer The layer the datasource is derived from.
 */
export function createDataSourceFromLayer(layer: Layer): DataSource | undefined {
    switch (layer.type) {
        case 'imagery':
            return new ImageServiceDataSource(layer as ImageryLayer);
        case 'feature':
            return new FeatureServiceDataSource(layer as FeatureLayer);
        default:
            return undefined;
    }
}

/**
 * Converts a doctrinal template data source into a raster function variable.
 * @param dataSource The data source being converted.
 * @param remapUrl Should url in the raster variable be remapped based on immad
 * remapping rules.
 * @param appendToken Should the urls in the raster variables include a token parameter.
 */
export async function convertDataSourceToRasterVariable(
    dataSource: ImageServiceDataSource,
    remapUrl: boolean,
    appendToken: boolean
): Promise<RasterVariable> {
    let url = dataSource.layer.url;

    // Workaround for PKI issue.  Remap the url of the data source to a non-pki secured url.
    if (remapUrl) {
        const appConfig = ConfigHelper.getAppConfig();
        appConfig.urlRemapRules.forEach((remapRule) => {
            if (url.includes(remapRule.url)) {
                url = url.replace(remapRule.url, remapRule.remapUrl);
            }
        });
    }

    try {
        // Append the token to the end of the url per ArcGIS documentation
        // https://developers.arcgis.com/rest/services-reference/enterprise/raster-input.htm
        if (appendToken) {
            const credential = await IdentityManager.getCredential(dataSource.layer.url);
            if (credential && credential.token) {
                url = url + '?token=' + credential.token;
            }
        }
    } catch (err) {
        // Unable to get the token.  This can be okay if the service is not secured so continue
        // without a token appended.  If a token is required then Preview/Export will ultimately
        // fail and return an error back to the user.
    }

    return {
        url: url,
        name: dataSource.id,
    } as RasterVariable;
}

/**
 * Converts a doctrinal template data source into a constant raster function template.
 * @param dataSource The data source being converted.
 */
export function convertDataSourceToConstantRFT(dataSource: FeatureServiceDataSource): ConstantRasterFunctionTemplate {
    // Create the extent for the contstant raster as the full extent of the feature layer + the analysis area distance.
    // Staticially defining the analysis area to 200km for now.  In the future, the analysis area will be
    // specified by the user in a UI or could be calculated as an intersection of the extent of all
    // the data sources in a template.
    let constRFTExtent = dataSource.layer.fullExtent.clone();
    const analysisArea = 200000;

    if (dataSource.layer.spatialReference.wkid !== 102100) {
        const sr = new SpatialReference({ wkid: 102100 });

        if (!webMercatorUtils.canProject(dataSource.layer.spatialReference, sr)) {
            throw new Error(
                'The spatial reference of this feature layer is not supported: ' +
                    dataSource.layer.spatialReference.wkid
            );
        }

        constRFTExtent = webMercatorUtils.project(dataSource.layer.fullExtent, sr) as Extent;
    }

    constRFTExtent.xmin -= analysisArea;
    constRFTExtent.xmax += analysisArea;
    constRFTExtent.ymin -= analysisArea;
    constRFTExtent.ymax += analysisArea;

    const constantArgs = createConstantFunctionArguments();
    constantArgs.RasterInfo.value.extent = constRFTExtent;
    constantArgs.RasterInfo.value.geodataXform.spatialReference = constRFTExtent.spatialReference;

    const constantRFT = createConstantRFT(constantArgs);
    constantRFT.name = dataSource.id;
    return constantRFT;
}

/**
 * Deserialized DataSource objects get disconnected from their actual source(feature layer,
 * imagery layer, etc...) This function reconnects the DataSource source or creates a new source
 * based on the metadata present in the properties of the DataSource object.
 * @param dataSource The data source being repaired.
 * @param map Optional.  The current sources available.
 */
export function repairDataSource(dataSource: DataSource, map?: Map): DataSource {
    if (map) {
        switch (dataSource.type) {
            case 'ImageService':
                const imageServiceDataSource = dataSource as ImageServiceDataSource;
                let imageryLayer = map.findLayerById(imageServiceDataSource.layer.id) as ImageryLayer;
                if (!imageryLayer) {
                    imageryLayer = new ImageryLayer(imageServiceDataSource.layer);
                    imageryLayer.load();
                }
                imageServiceDataSource.layer = imageryLayer;
                break;
            case 'FeatureService':
                const featureServiceDataSource = dataSource as FeatureServiceDataSource;
                let featureLayer = map.findLayerById(featureServiceDataSource.layer.id) as FeatureLayer;
                if (!featureLayer) {
                    featureLayer = new FeatureLayer(featureServiceDataSource.layer);
                    featureLayer.load();
                }
                featureServiceDataSource.layer = featureLayer;
                break;
            default:
                break;
        }
    }

    return dataSource;
}

/**
 * Determines if a data source is Invalid.
 * @param dataSource The data source being validated.
 */
export function isDataSourceInvalid(dataSource: DataSource): boolean {
    switch (dataSource.type) {
        case 'FeatureService':
            const fsDataSource = dataSource as FeatureServiceDataSource;
            return fsDataSource.layer.loadStatus === 'failed';
        case 'ImageService':
            const isDataSource = dataSource as ImageServiceDataSource;
            return isDataSource.layer.loadStatus === 'failed';
        default:
            return false;
    }
}
