import RasterFunction from '@arcgis/core/layers/support/RasterFunction';

/**
 * Represents an Image Service URL variable with name and URL properties.
 */
export type ImageServiceURLVariable = { url: string; name: string };

/**
 * Represents a variable in a Raster Function. Can be a string, number, Image Service JSON or another
 * Raster Function.
 */
export type RasterFunctionVariable = RasterFunction | string | number | ImageServiceURLVariable;
