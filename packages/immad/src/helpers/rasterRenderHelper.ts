import ImageryLayer from '@arcgis/core/layers/ImageryLayer';
import PortalItem from '@arcgis/core/portal/PortalItem';
import { ColorRampType, LayerDefinitionType } from '../interfaces/RasterRenderTypes';
import Portal from '@arcgis/core/portal/Portal';
import RasterFunction from '@arcgis/core/layers/support/RasterFunction';
import RasterStretchRenderer from '@arcgis/core/renderers/RasterStretchRenderer';
import RasterShadedReliefRenderer from '@arcgis/core/renderers/RasterShadedReliefRenderer';
import RasterColormapRenderer from '@arcgis/core/renderers/RasterColormapRenderer';

export default class RasterRenderHelper {
    /**
     * Apply stretch renderer fix to items. This is to fix a bug found in 10.8.1 Image Server outputs.
     * @param layer The input layer
     */
    static applyRasterStretchRendererFix(layer: ImageryLayer): void {
        const renderer = layer.renderer;
        if (renderer && renderer.type === 'raster-stretch' && renderer.outputMin === 0 && renderer.outputMax === 0) {
            console.log('Warning, renderer had min and max set to 0');
            renderer.outputMax = 255;
        }
    }

    /**
     * Updates the rendering rule for a Portal Item.
     * This is used to apply a stretch renderer fix for incorrect items.
     * @param itemId The portal item ID to update
     * @param renderingRule The rendering rule to update
     */
    static async updatePortalItemRenderer(itemId: string, renderingRule: LayerDefinitionType): Promise<void> {
        const portalItem = new PortalItem({ id: itemId });
        await portalItem.load().then((lyr) => {
            return lyr.update({ data: renderingRule });
        });
    }

    /**
     * Gets the Raster Rendering URL for the current Portal. This is necessary because the url is not fully
     * specified in the Helper Services utility class.
     */
    static async getRasterRendererURL(): Promise<string> {
        const portal = new Portal();

        return await portal
            .load()
            .then(() => {
                let url = portal.helperServices.rasterAnalytics.url;
                url = url.substring(0, url.lastIndexOf('/RasterAnalysisTools')) + '/RasterRendering/ImageServer';
                return url;
            })
            .catch((reason) => {
                throw new Error(reason);
            });
    }

    /**
     * Create a dynamic RasterRendering layer from an input Raster Function.
     * @param rasterFunction The input raster function to apply as a dynamic raster function layer.
     * @param title The title of the layer. If set to default, it will be "RasterRendering"
     * @param renderer An optional renderer for transforming the raster function layer.
     * @param renderingRule An optional rendering rule for styling.
     */
    static async createRasterRendererLayer(
        rasterFunction: RasterFunction,
        title = 'RasterRendering',
        renderer?: RasterStretchRenderer | RasterShadedReliefRenderer | RasterColormapRenderer,
        renderingRule?: RasterFunction
    ): Promise<ImageryLayer> {
        return await RasterRenderHelper.getRasterRendererURL()
            .then((rasterRenderingURL) => {
                const rasterData = btoa(JSON.stringify(rasterFunction)); // base64 encode
                const imageryLayer = new ImageryLayer({
                    url: rasterRenderingURL,
                    renderer: renderer,
                    renderingRule: renderingRule,
                    interpolation: 'nearest',
                    opacity: 1,
                    title: title,
                    popupTemplate: {
                        title: title,
                        content: 'Value: <b>{Raster.ItemPixelValue}</b>',
                        actions: [],
                    },
                });
                imageryLayer.set('raster', rasterData); // undocumented feature
                return imageryLayer;
            })
            .catch((reason) => {
                throw new Error(reason);
            });
    }

    //defaults to use the Temperature color ramp, can also be set to 'Surface' or 'Red Bright'
    static getRasterLayerDefinition(colorRampName: string): LayerDefinitionType {
        let colorRamp: ColorRampType;
        switch (colorRampName) {
            case 'Surface':
                colorRamp = this.getSurfaceColorRamp();
                break;
            case 'Red Bright':
                colorRamp = this.getRedBrightColorRamp();
                break;
            default:
                colorRamp = this.getTemperatureColorRamp();
        }
        return {
            layerDefinition: {
                drawingInfo: {
                    renderer: {
                        type: 'rasterStretch',
                        stretchType: 'minMax',
                        colorRamp: colorRamp,
                    },
                },
            },
        };
    }

    static getSurfaceColorRamp(): ColorRampType {
        return {
            type: 'multipart',
            colorRamps: [
                {
                    type: 'algorithmic',
                    algorithm: 'esriHSVAlgorithm',
                    fromColor: [112, 153, 89, 255],
                    toColor: [242, 238, 162, 255],
                },
                {
                    type: 'algorithmic',
                    algorithm: 'esriHSVAlgorithm',
                    fromColor: [242, 238, 162, 255],
                    toColor: [242, 206, 133, 255],
                },
                {
                    type: 'algorithmic',
                    algorithm: 'esriHSVAlgorithm',
                    fromColor: [242, 206, 133, 255],
                    toColor: [194, 140, 124, 255],
                },
                {
                    type: 'algorithmic',
                    algorithm: 'esriHSVAlgorithm',
                    fromColor: [194, 140, 124, 255],
                    toColor: [255, 242, 255, 255],
                },
            ],
        };
    }

    static getTemperatureColorRamp(): ColorRampType {
        return {
            type: 'multipart',
            colorRamps: [
                {
                    type: 'algorithmic',
                    algorithm: 'esriHSVAlgorithm',
                    fromColor: [255, 252, 255, 255],
                    toColor: [255, 0, 255, 255],
                },
                {
                    type: 'algorithmic',
                    algorithm: 'esriHSVAlgorithm',
                    fromColor: [255, 0, 255, 255],
                    toColor: [0, 0, 255, 255],
                },
                {
                    type: 'algorithmic',
                    algorithm: 'esriHSVAlgorithm',
                    fromColor: [0, 0, 255, 255],
                    toColor: [0, 255, 255, 255],
                },
                {
                    type: 'algorithmic',
                    algorithm: 'esriHSVAlgorithm',
                    fromColor: [0, 255, 255, 255],
                    toColor: [0, 255, 0, 255],
                },
                {
                    type: 'algorithmic',
                    algorithm: 'esriHSVAlgorithm',
                    fromColor: [0, 255, 0, 255],
                    toColor: [255, 255, 0, 255],
                },
                {
                    type: 'algorithmic',
                    algorithm: 'esriHSVAlgorithm',
                    fromColor: [255, 255, 0, 255],
                    toColor: [255, 128, 0, 255],
                },
                {
                    type: 'algorithmic',
                    algorithm: 'esriHSVAlgorithm',
                    fromColor: [255, 128, 0, 255],
                    toColor: [128, 0, 0, 255],
                },
            ],
        };
    }
    static getRedBrightColorRamp(): ColorRampType {
        return {
            type: 'multipart',
            colorRamps: [
                {
                    type: 'algorithmic',
                    algorithm: 'esriHSVAlgorithm',
                    fromColor: [255, 235, 214, 255],
                    toColor: [196, 10, 10, 255],
                },
            ],
        };
    }
}
