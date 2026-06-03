import RasterFunctionTemplate, {
    RasterArgument,
    RasterFunction,
    RasterFunctionArguments,
    RasterFunctionVariable,
} from './RasterFunctionTemplate';
import Extent = __esri.Extent;
import Polygon = __esri.Polygon;

/**
 * The clip type enumeration used by the clip raster function template.
 */
export enum ClipType {
    Inside = 2,
    Outside = 1,
}

/**
 * Clip raster function properties.  These were determined by inspecting the clip raster
 * function template produced by Portal for ArcGIS.
 */
export const ClipFunction = {
    type: 'ClipFunction',
    pixelType: 'UNKNOWN',
    name: 'Clip',
    description: 'Clips a raster using data from another dataset.',
} as RasterFunction;

/**
 * Clip raster function arguments properties.  These properties were determined by inspecting the
 * clip raster function template produced by Portal for ArcGIS.
 */
export interface ClipFunctionArguments extends RasterFunctionArguments {
    Raster: RasterArgument;
    ClippingType: RasterFunctionVariable<ClipType>;
    ClippingRaster: RasterArgument;
    ClippingGeometry: RasterFunctionVariable<Polygon | null>;
    Extent: RasterFunctionVariable<Extent | null>;
    UseInputFeatureGeometry: RasterFunctionVariable<boolean>;
}

/**
 * Defines a Clip Raster Function Template type.
 */
export type ClipRasterFunctionTemplate = Omit<RasterFunctionTemplate, 'arguments'> & {
    arguments: ClipFunctionArguments;
};
