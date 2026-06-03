/**
 * A raster variable is a specific value type for raster function variables used by one or more raster
 * function templates.  These were determined by inspecting a raster function template produced by
 * Portal for ArcGIS.
 */
export interface RasterVariable {
    url: string;
    name: string;
}

/**
 * A raster argument is a union type representing a raster funtion variable of type
 * raster variable or a raster function template.
 */
export type RasterArgument = RasterFunctionVariable<RasterVariable | null> | RasterFunctionTemplate;

/**
 * An argument array is a collection of objects either of type RasterFunctionVariables<RasterVariable>
 * or RasterFunctionTemplate.  The properties of this interface were determined by inspecting a
 * raster function template produced by Portal for ArcGIS.
 */
export interface ArgumentArray {
    elements: Array<RasterArgument>;
    type: string;
}

/**
 * This is the generic interface for defining arguments for a raster function template.
 * The properties for this interface were determined by inspecting a raster function
 * template produced by Portal for ArcGIS.
 */
export interface RasterFunctionVariable<T> {
    name: string;
    value: T;
    isDataset: boolean;
    isPublic: boolean;
    type: string;
}

/**
 * Defines a generic set of properties.
 */
export interface PropertySet {
    type: string;
    [property: string]: any;
}

/**
 * Defines additional Raster function template properties.  These are supplied through
 * a 'properties' property of the raster function template.  These were determined by
 * inspecting a raster function template produced by Portal for ArcGIS.
 */
export interface RasterFunctionTemplatePropertySet extends PropertySet {
    MatchVariable: RasterFunctionVariable<boolean>;
    UnionDimension: RasterFunctionVariable<boolean>;
}

/**
 * Defines raster function arguments properties.  These were determined by inspecting a
 * raster function template produced by Portal for ArcGIS.
 */
export interface RasterFunctionArguments {
    type: string;
    [argument: string]: RasterFunctionVariable<any> | string | number | RasterFunctionTemplate;
}

/**
 * The pixel types supported for raster functions templates.
 */
export type PixelType =
    | 'C128'
    | 'C64'
    | 'F32'
    | 'F64'
    | 'S16'
    | 'S32'
    | 'S8'
    | 'U1'
    | 'U16'
    | 'U2'
    | 'U32'
    | 'U4'
    | 'U8'
    | 'UNKNOWN';

/**
 * Defines raster function properties.  These were determined by inspecting a
 * raster function template produced by Portal for ArcGIS.
 */
export interface RasterFunction {
    type: string;
    pixelType: PixelType;
    name: string;
    description: string;
}

/**
 * Defines raster function template properties.  These were determined by inspecting a
 * raster function template produced by Portal for ArcGIS.
 */
export default interface RasterFunctionTemplate {
    name: string;
    arguments: RasterFunctionArguments;
    description: string;
    function: RasterFunction;
    functionType: number;
    thumbnail: string;
    type: string;
    help: string;
    properties: RasterFunctionTemplatePropertySet;
}
