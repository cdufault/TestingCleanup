import Extent from '@arcgis/core/geometry/Extent';
import IdentityManager from '@arcgis/core/identity/IdentityManager';
import ImageryLayer from '@arcgis/core/layers/ImageryLayer';
import Polygon from '@arcgis/core/geometry/Polygon';
import SpatialReference from '@arcgis/core/geometry/SpatialReference';
import RasterFunctionTemplate, {
    ArgumentArray,
    RasterFunction,
    RasterFunctionArguments,
    RasterFunctionTemplatePropertySet,
    RasterFunctionVariable,
    RasterVariable,
} from '../api/RasterFunctionTemplate';
import {
    CalculatorFunction,
    CalculatorFunctionArguments,
    CalculatorRasterFunctionTemplate,
    CellSizeType,
    ExtentType,
} from '../api/CalculatorRasterFunctionTemplate';
import {
    ClipFunction,
    ClipFunctionArguments,
    ClipRasterFunctionTemplate,
    ClipType,
} from '../api/ClipRasterFunctionTemplate';
import {
    ConstantFunction,
    ConstantFunctionArguments,
    ConstantRasterFunctionTemplate,
    GeodataXForm,
    RasterInfo,
} from '../api/ConstantRasterFunctionTemplate';
import { ConfigHelper } from '../../../helpers/configHelper';
import rasterRenderHelper from '../../../helpers/rasterRenderHelper';

/**
 * Defines any object that contains a property called 'type'
 */
type TypedObj = { type: string };

/**
 * Generic internal method used to determine if unknown types are a type with a
 * 'type' property.
 * @param obj The object being tested.
 */
function hasTypeProperty(obj: unknown): obj is TypedObj {
    return obj !== null && typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, 'type');
}

/**
 * Creates a RasterFunctionVariable object with a value property of type T.
 * @param name The name of raster function variable.  Usually the same as the key
 * of the object containing the variable.
 * @param value The value defined for the raster function variable.
 * @param isDataset boolean defining if this variable is a raster.
 * @param isPublic boolean defining if this variable should be supplied by a user.
 * Placeholder values should be set to true and pre-populated values should be set to false.
 */
export function createRasterFunctionVariable<T>(
    name: string,
    value: T,
    isDataset?: boolean,
    isPublic?: boolean
): RasterFunctionVariable<T> {
    return {
        name: name,
        value: value,
        isDataset: isDataset ? isDataset : false,
        isPublic: isPublic ? isPublic : false,
        type: 'RasterFunctionVariable',
    } as RasterFunctionVariable<T>;
}

/**
 * Creates an empty CalculatorFunctionArguments object with defaults values.
 */
export function createCalculatorFunctionArguments(): CalculatorFunctionArguments {
    const rasters = {
        elements: [],
        type: 'ArgumentArray',
    } as ArgumentArray;

    return {
        type: 'RasterCalculatorFunctionArguments',
        Rasters: createRasterFunctionVariable<ArgumentArray>('Rasters', rasters),
        InputNames: createRasterFunctionVariable<string[]>('InputNames', []),
        Expression: createRasterFunctionVariable<string>('Expression', ''),
        CellsizeType: createRasterFunctionVariable<CellSizeType>('CellsizeType', CellSizeType.esriCellsizeMinOf),
        ExtentType: createRasterFunctionVariable<ExtentType>('ExtentType', ExtentType.esriExtentUnionOf),
    } as CalculatorFunctionArguments;
}

/**
 * Creates an empty ClipFunctionArguments object with defaults values.
 */
export function createClipFunctionArguments(): ClipFunctionArguments {
    const defaultRasterVariable: RasterVariable = {
        url: '',
        name: '',
    };

    return {
        type: 'ClipFunctionArguments',
        Raster: createRasterFunctionVariable<RasterVariable>('Raster', defaultRasterVariable),
        ClippingType: createRasterFunctionVariable<ClipType>('ClippingType', ClipType.Inside),
        ClippingRaster: createRasterFunctionVariable<RasterVariable | null>('ClippingRaster', null),
        ClippingGeometry: createRasterFunctionVariable<Polygon | null>('ClippingGeometry', null),
        Extent: createRasterFunctionVariable<Extent | null>('Extent', null),
        UseInputFeatureGeometry: createRasterFunctionVariable<boolean>('UseInputFeatureGeometry', false),
    } as ClipFunctionArguments;
}

/**
 * Creates an empty ConstantFunctionArguments object with defaults values.
 */
export function createConstantFunctionArguments(): ConstantFunctionArguments {
    const defaultSR = new SpatialReference({ wkid: 102100 });

    const defaultTransform: GeodataXForm = {
        spatialReference: defaultSR,
        type: 'IdentityXform',
    };

    const defaultExtent = new Extent({
        xmin: -100.0,
        xmax: 100.0,
        ymin: -100.0,
        ymax: 100.0,
        spatialReference: defaultSR,
    });

    const defaultRasterInfo = {
        bandCount: 1,
        blockHeight: 256,
        blockWidth: 256,
        extent: defaultExtent,
        geodataXform: defaultTransform,
        noData: 255,
        pixelSizeX: 30.0,
        pixelSizeY: 30.0,
        pixelType: 'U8',
        type: 'RasterInfo',
    } as RasterInfo;

    return {
        Constant: createRasterFunctionVariable<Array<number>>('Constant', [1]),
        RasterInfo: createRasterFunctionVariable<RasterInfo>('RasterInfo', defaultRasterInfo),
        type: 'ConstantFunctionArguments',
    } as ConstantFunctionArguments;
}

/**
 * Creates a raster function template object.
 */
export function createRFT(args: RasterFunctionArguments, func: RasterFunction): RasterFunctionTemplate {
    return {
        arguments: args,
        description: '',
        function: func,
        functionType: 0,
        help: '',
        name: '',
        properties: {
            MatchVariable: createRasterFunctionVariable<boolean>('MatchVariable', false),
            UnionDimension: createRasterFunctionVariable<boolean>('UnionDimension', false),
            type: 'PropertySet',
        } as RasterFunctionTemplatePropertySet,
        thumbnail: '',
        type: 'RasterFunctionTemplate',
    } as RasterFunctionTemplate;
}

/**
 * Creates an empty raster calculator raster function template object with defaults values.
 */
export function createCalculatorRFT(args?: CalculatorFunctionArguments): CalculatorRasterFunctionTemplate {
    return createRFT(
        args ?? createCalculatorFunctionArguments(),
        CalculatorFunction
    ) as CalculatorRasterFunctionTemplate;
}

/**
 * Creates an empty constant raster function template object with defaults values.
 */
export function createClipRFT(args?: ClipFunctionArguments): ClipRasterFunctionTemplate {
    return createRFT(args ?? createClipFunctionArguments(), ClipFunction) as ClipRasterFunctionTemplate;
}

/**
 * Creates an empty constant raster function template object with defaults values.
 */
export function createConstantRFT(args?: ConstantFunctionArguments): ConstantRasterFunctionTemplate {
    return createRFT(args ?? createConstantFunctionArguments(), ConstantFunction) as ConstantRasterFunctionTemplate;
}

/**
 * Converts a raster function template into a temporary ImageryLayer.
 * @param rft The raster function template being converted.
 */
export async function convertRFTToImageryLayer(rft: RasterFunctionTemplate): Promise<ImageryLayer> {
    const url = await rasterRenderHelper.getRasterRendererURL();

    const layer = new ImageryLayer({
        url: url,
        title: rft.name,
        popupTemplate: {
            title: rft.name,
            content: 'Value: <b>{Raster.ItemPixelValue}</b>',
            actions: [],
        },
    });
    layer.set('isPreviewLayer', true);

    const rasterData = btoa(JSON.stringify(rft));
    layer.set('raster', rasterData);

    return layer;
}

/**
 * Creates a new raster function template with all url parameters modified to contain
 * a token parameter and a remappsed base url.
 * @param rft The raster function template being cloned.
 */
export async function remapAndTokenizeRFT(rft: RasterFunctionTemplate): Promise<RasterFunctionTemplate> {
    return processRFT(rft);
}

/**
 * Internal function that deep clones the raster function template and remaps/tokenizes
 * any raster variables found within the rft arguments.
 * @param rft The Raster function template being cloned.
 */
async function processRFT(rft: RasterFunctionTemplate): Promise<RasterFunctionTemplate> {
    const clonedRFT: RasterFunctionTemplate = {
        ...rft,
        function: { ...rft.function },
    };

    // Nested RFTs might not have properties defined.
    if (rft.properties) {
        clonedRFT.properties = JSON.parse(JSON.stringify(rft.properties));
    }
    clonedRFT.arguments = await processArguments(rft.arguments);

    return clonedRFT;
}

/**
 * Internal function that deep clones the raster function arguments and remaps/tokenizes
 * any raster variables that are part of the argument variables.
 * @param args The Raster function arguments being cloned.
 */
async function processArguments(args: RasterFunctionArguments): Promise<RasterFunctionArguments> {
    const clonedArgs: RasterFunctionArguments = {
        ...args,
    };

    for (const arg in args) {
        if (hasTypeProperty(args[arg])) {
            const typedArg = args[arg] as TypedObj;
            if (typedArg.type === 'RasterFunctionVariable') {
                clonedArgs[arg] = await processArgumentVariable(args[arg] as RasterFunctionVariable<unknown>);
            }
        }
    }

    return clonedArgs;
}

/**
 * Internal function that deep clones the raster function argument variable and remaps/tokenizes
 * any raster variables that are part of the variable value property.
 * @param argumentVariable The Raster function variable being cloned.
 */
async function processArgumentVariable(
    argumentVariable: RasterFunctionVariable<unknown>
): Promise<RasterFunctionVariable<unknown>> {
    // It's assumed that if the value does not meet any of the if conditions below then
    // the spread operator takes care of its cloning.
    const clonedObj: RasterFunctionVariable<unknown> = {
        ...argumentVariable,
    };

    if (argumentVariable.isDataset) {
        clonedObj.value = await processRasterVariable(argumentVariable.value as RasterVariable);
    } else if (argumentVariable.value instanceof Array) {
        clonedObj.value = [...argumentVariable.value];
    } else if (hasTypeProperty(argumentVariable.value)) {
        if (argumentVariable.value.type === 'ArgumentArray') {
            clonedObj.value = await processArgumentArray(argumentVariable.value as ArgumentArray);
        } else if (argumentVariable.value.type === 'RasterFunctionTemplate') {
            clonedObj.value = await processRFT(argumentVariable.value as RasterFunctionTemplate);
        }
    }

    return clonedObj;
}

/**
 * Internal function that deep clones the objects in a argument array and remaps/tokenizes
 * any raster variables that are part of the argument array elements property.  Rather than returning
 * a cloned ArgumentArray object this function returns a native array because this seems to align
 * with how the portal map viewer converts argument arrays that are passed to its preview functionality.
 * @param argArray The argument array being converted.
 */
async function processArgumentArray(
    argArray: ArgumentArray
): Promise<Array<RasterFunctionVariable<unknown> | RasterFunctionTemplate>> {
    const args: Array<RasterFunctionVariable<unknown> | RasterFunctionTemplate> = [];

    for (const index in argArray.elements) {
        if (argArray.elements[index].type === 'RasterFunctionTemplate') {
            args.push(await processRFT(argArray.elements[index] as RasterFunctionTemplate));
        } else if (argArray.elements[index].type === 'RasterFunctionVariable') {
            const rfVariable = argArray.elements[index] as RasterFunctionVariable<unknown>;
            args.push(await processArgumentVariable(rfVariable));
        }
    }

    return args;
}

/**
 * Internal function that clones a raster variable and updates the url property value
 * with a url containing a token parameter and a remapped base url.
 * @param rasterVariable The raster variable being cloned.
 */
async function processRasterVariable(rasterVariable: RasterVariable): Promise<RasterVariable> {
    const clonedObj: RasterVariable = {
        ...rasterVariable,
    };

    // We must get credential before remapping URL
    const credential = await IdentityManager.getCredential(clonedObj.url);

    const appConfig = ConfigHelper.getAppConfig();
    appConfig.urlRemapRules.forEach((remapRule) => {
        if (clonedObj.url.includes(remapRule.url)) {
            clonedObj.url = clonedObj.url.replace(remapRule.url, remapRule.remapUrl);
        }
    });

    if (credential && credential.token) {
        clonedObj.url = clonedObj.url + '?token=' + credential.token;
    }

    return clonedObj;
}
