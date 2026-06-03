import RasterFunctionTemplate, {
    PixelType,
    RasterFunction,
    RasterFunctionArguments,
    RasterFunctionVariable,
} from './RasterFunctionTemplate';
import Extent = __esri.Extent;
import SpatialReference = __esri.SpatialReference;

/**
 * Describes the spatial transform properties of a dataset.  Currently only the
 * IdentityXform type is supported.
 */
export interface GeodataXForm {
    spatialReference: SpatialReference;
    type: string;
}

/**
 * Properties describing the structure of a raster.
 */
export interface RasterInfo {
    bandCount: number;
    blockHeight: number;
    blockWidth: number;
    extent: Extent;
    geodataXform: GeodataXForm;
    noData: number;
    pixelSizeX: number;
    pixelSizeY: number;
    pixelType: PixelType;
    type: string;
}

/**
 * Constant raster function properties.  These were determined by inspecting the
 * constant raster function template produced by Portal for ArcGIS.
 */
export const ConstantFunction = {
    type: 'ConstantFunction',
    pixelType: 'UNKNOWN',
    name: 'Constant',
    description: 'Creates a virtual raster with a single pixel value.',
} as RasterFunction;

/**
 * Constant raster function arguments properties.  These properties were determined
 * by inspecting the constant raster function template produced by Portal for ArcGIS.
 */
export interface ConstantFunctionArguments extends RasterFunctionArguments {
    Constant: RasterFunctionVariable<Array<number>>;
    RasterInfo: RasterFunctionVariable<RasterInfo>;
}

/**
 * Defines a Constant Raster Function Template type.
 */
export type ConstantRasterFunctionTemplate = Omit<RasterFunctionTemplate, 'arguments'> & {
    arguments: ConstantFunctionArguments;
};
