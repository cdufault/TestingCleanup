import RasterFunctionTemplate, {
    ArgumentArray,
    RasterFunction,
    RasterFunctionArguments,
    RasterFunctionVariable,
} from './RasterFunctionTemplate';

/**
 * Cell size type enumeration defined by the RasterCalculator raster function.
 * https://developers.arcgis.com/documentation/common-data-types/raster-function-objects.htm
 */
export enum CellSizeType {
    'esriCellsizeFirstOf' = 0,
    'esriCellsizeMinOf' = 1,
    'esriCellsizeMaxOf' = 2,
    'esriCellsizeMeanOf' = 3,
    'esriCellsizeLastOf' = 4,
}

/**
 * Extent type enumeration defined by the RasterCalculator raster function.
 * https://developers.arcgis.com/documentation/common-data-types/raster-function-objects.htm
 */
export enum ExtentType {
    'esriExtentFirstOf' = 0,
    'esriExtentIntersectionOf' = 1,
    'esriExtentUnionOf' = 2,
    'esriExtentLastOf' = 3,
}

/**
 * Raster Calculator function properties.  These were determined by inspecting a raster calculator
 * raster function template produced by Portal for ArcGIS.
 */
export const CalculatorFunction = {
    type: 'RasterCalculatorFunction',
    pixelType: 'UNKNOWN',
    name: 'Calculator',
    description: 'Computes a raster from a raster based mathematical expression.',
} as RasterFunction;

/**
 * Raster Calculator function arguments properties.  These were determined by inspecting a raster
 * calculator raster function template produced by Portal for ArcGIS.
 */
export interface CalculatorFunctionArguments extends RasterFunctionArguments {
    Rasters: RasterFunctionVariable<ArgumentArray>;
    InputNames: RasterFunctionVariable<string[]>;
    Expression: RasterFunctionVariable<string>;
    CellsizeType: RasterFunctionVariable<CellSizeType>;
    ExtentType: RasterFunctionVariable<ExtentType>;
}

/**
 * Defines a Calculator Raster Function Template type.
 */
export type CalculatorRasterFunctionTemplate = Omit<RasterFunctionTemplate, 'arguments'> & {
    arguments: CalculatorFunctionArguments;
};
