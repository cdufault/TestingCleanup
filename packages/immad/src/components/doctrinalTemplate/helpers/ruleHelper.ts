import Polygon from '@arcgis/core/geometry/Polygon';
import * as geometryEngineAsync from '@arcgis/core/geometry/geometryEngineAsync';
import { isDataSourceInvalid } from './dataSourceHelper';
import { createCalculatorRFT, createClipRFT, createRasterFunctionVariable } from './rasterFunctionTemplateHelper';
import { ClipRasterFunctionTemplate, ClipType } from '../api/ClipRasterFunctionTemplate';
import { ConstantRasterFunctionTemplate } from '../api/ConstantRasterFunctionTemplate';
import { DataSource } from '../api/DataSources';
import RasterFunctionTemplate, { RasterArgument } from '../api/RasterFunctionTemplate';
import Rule, {
    BufferConstraintType,
    BufferOperationType,
    BufferRule,
    ImageOperationType,
    ImageServiceRule,
    RuleStatus,
    RuleValidationResult,
} from '../api/Rule';
import {
    convertDataSourceToConstantRFT,
    convertDataSourceToRasterVariable,
    repairDataSource,
} from '../helpers/dataSourceHelper';
import Field = __esri.Field;
import Geometry = __esri.Geometry;
import Graphic = __esri.Graphic;
import Map = __esri.Map;
import Layer = __esri.Layer;

export const numberBasedFieldTypes = ['small-integer', 'integer', 'single', 'double', 'long'];

/**
 * Factory method that creates a new rule based on the type of data source supplied.
 * @param dataSource The datasource the rule will be based on.
 * @param id An id to unique identify the rule.
 * @param alias Optional alias name for the rule.
 * @param description Optional description for the rule.
 */
export function createRule(dataSource: DataSource, id: number, alias?: string, description?: string): Rule {
    const rule: Rule = {
        id: id,
        enabled: true,
        alias: alias ? alias : 'Rule ' + id.toString() + ' - ' + dataSource.alias,
        dataSource: dataSource,
        description: description ? description : '',
        type: 'default',
    };

    switch (dataSource.type) {
        case 'FeatureService':
            return createBufferRule(rule);
        case 'ImageService':
            return createImageServiceRule(rule);
        default:
            return rule;
    }
}

/**
 * This function is intended to fix any issues with rules that have been loaded in from a portal item.  This includes
 * resolving any backwards compatability issues and repairing the data source associated with a rule.
 * @param rule The rule being repaired.
 */
export function repairRule(rule: Rule, map?: Map): Rule {
    // IMMAD 2.2 backwards compatability fix.  Image service rules saved prior to version
    // 2.3 did not contain a type property.  This resolves that deficiency.
    if (rule.type === undefined) {
        rule.type = 'image';
    }

    // IMMAD 2.3 backwards compatability fix.  Buffer rules saved prior to IMMAD version 2.4 did
    // contain the constraintMode property.  This fix sets it to an appropriate default
    if (rule.type === 'buffer') {
        const bufferRule = rule as BufferRule;

        if (bufferRule.constraintMode === undefined) {
            bufferRule.constraintMode = BufferConstraintType.Number;
        }
    }

    // Deserialized data sources get disconnected from their actual source(feature layer,
    // imagery layer, etc...) in the map.  This function reconnects the the data sources to the rule.
    repairDataSource(rule.dataSource, map);

    return rule;
}

/**
 * Validates a rule and returns whether the rule is ready to be converted into a raster function template.
 * @param rule The rule being validated.
 */
export function isRuleValid(rule: Rule): RuleValidationResult {
    if (isDataSourceInvalid(rule.dataSource)) {
        return {
            status: RuleStatus.Error,
            message: 'The data source is not available.',
        };
    }

    const layerDataSource = rule.dataSource as DataSource & { layer: Layer };
    if (layerDataSource?.layer?.loadStatus === 'loading') {
        return {
            status: RuleStatus.NotReady,
            message: 'The layer is loading.',
        };
    }

    switch (rule.type) {
        case 'buffer':
            return isBufferRuleValid(rule as BufferRule);
        case 'image':
            return isImageServiceRuleValid(rule as ImageServiceRule);
        default:
            return {
                status: RuleStatus.NotReady,
                message: 'Unsupported rule type.',
            };
    }
}

/**
 * Factory method that creates a new  image service rule.
 * @param rule The base rule that the image service rule is extended from.
 */
function createImageServiceRule(rule: Rule): ImageServiceRule {
    return {
        ...rule,
        operation: ImageOperationType.None,
        type: 'image',
    } as ImageServiceRule;
}

/**
 * Factory method that creates a new  buffer rule.
 * @param rule The base rule that the buffer rule is extended from.
 */
function createBufferRule(rule: Rule): BufferRule {
    return {
        ...rule,
        constraintMode: BufferConstraintType.Number,
        operation: BufferOperationType.None,
        type: 'buffer',
    } as BufferRule;
}

/**
 * Validates a buffer rule to determine if it is ready to be converted into a raster
 * function template.
 * @param rule The rule being validated.
 */
function isBufferRuleValid(rule: BufferRule): RuleValidationResult {
    const result = {
        status: RuleStatus.NotReady,
        message: '',
    } as RuleValidationResult;

    const isOperationEmpty = rule.operation === BufferOperationType.None;
    const isConstraintEmpty = rule.constraint === undefined;
    const isNegativeConstraint = Boolean(
        rule.constraintMode === BufferConstraintType.Number && rule.constraint !== undefined && rule.constraint < 0
    );

    let isFieldInDataSource = true;
    if (rule.constraintMode === BufferConstraintType.Field && rule.constraint !== undefined) {
        const constraintField = rule.constraint as Field;
        const field = rule.dataSource.layer.fields.find((field) => field.name === constraintField.name);
        isFieldInDataSource = Boolean(field !== undefined);
    }

    // Set the final status and result message.
    if (isOperationEmpty) {
        result.message = 'Must select a rule operation.';
    } else if (isConstraintEmpty) {
        result.message = 'Must enter constraint value.';
    } else if (isNegativeConstraint) {
        result.message = 'Buffer distances cannot be negative.';
        result.status = RuleStatus.Error;
    } else if (!isFieldInDataSource) {
        result.message = 'The buffer field does not exist in the data source.';
        result.status = RuleStatus.Error;
    } else {
        result.message = 'The rule is ready to be previewed.';
        result.status = RuleStatus.Ready;
    }

    return result;
}

/**
 * Validates an image service rule to determine if it is ready to be converted into a
 * raster function template.
 * @param rule The rule being validated.
 */
function isImageServiceRuleValid(rule: ImageServiceRule): RuleValidationResult {
    const result = {
        status: RuleStatus.NotReady,
        message: '',
    } as RuleValidationResult;

    // Validate the rule has an operation and a constraint within range of the data
    // source statistics.
    const hasOperationError = rule.operation === ImageOperationType.None;
    const hasConstraintError = rule.constraint === undefined;

    let hasConstraintMinError = false;
    let hasConstraintMaxError = false;
    if (rule.dataSource.layer.serviceRasterInfo?.statistics?.length > 0) {
        hasConstraintMinError = Boolean(
            rule.constraint !== undefined && rule.constraint < rule.dataSource.layer.serviceRasterInfo.statistics[0].min
        );

        hasConstraintMaxError = Boolean(
            rule.constraint !== undefined && rule.constraint > rule.dataSource.layer.serviceRasterInfo.statistics[0].max
        );
    }

    // Set the final status and result message.
    if (hasOperationError) {
        result.message = 'Must select a rule operation.';
    } else if (hasConstraintError) {
        result.message = 'Must enter constraint value.';
    } else if (hasConstraintMinError) {
        result.message = 'The constraint value is less than the data available in the rule data source.';
        result.status = RuleStatus.Warning;
    } else if (hasConstraintMaxError) {
        result.message = 'The constraint value is greater than the data available in the rule data source.';
        result.status = RuleStatus.Warning;
    } else {
        result.message = 'The rule is ready to be previewed.';
        result.status = RuleStatus.Ready;
    }

    return result;
}

/**
 * Creates a raster argument for a specified doctrinal template rule.  Raster arguments are
 * used for the calculator RFT that drives how the doctrinal template combines rules together.
 * @param rule
 * @param remapUrl If the raster argument uses a url this flag indicates if the url is remapped
 * based on the immad remapping rules.
 * @param appendToken If the raster argument uses an ArcGIS Service url this flag indicates if the
 * url should append its access token with the url parameter.
 */
export async function createRasterArgument(
    rule: Rule,
    remapUrl: boolean,
    appendToken: boolean
): Promise<RasterArgument> {
    switch (rule.type) {
        case 'image':
            const imageServiceRule = rule as ImageServiceRule;
            return createImageServiceRuleRasterArgument(imageServiceRule, remapUrl, appendToken);
        case 'buffer':
            const bufferRule = rule as BufferRule;
            return createBufferRuleRasterArgument(bufferRule);
        default:
            throw new Error('This rule type cannot be converted to a RasterArgument: ' + rule.type);
    }
}

/**
 * Converts an image service rule into a raster argument.
 * @param imageServiceRule The rule being converted.
 * @param remapUrl Boolean flag to indicate if the url should be remapped using immad remapping rules.
 * @param appendToken Boolean flag to indicate if a token parameter should be appended to the url string.
 */
async function createImageServiceRuleRasterArgument(
    imageServiceRule: ImageServiceRule,
    remapUrl: boolean,
    appendToken: boolean
): Promise<RasterArgument> {
    const rasterVariable = await convertDataSourceToRasterVariable(imageServiceRule.dataSource, remapUrl, appendToken);
    const rasterFunctionVariable = createRasterFunctionVariable('Raster', rasterVariable, true);
    rasterFunctionVariable.value.name += '_rule' + imageServiceRule.id.toString();
    return rasterFunctionVariable;
}

/**
 * Converts a buffer rule into a raster argument.  A buffer rule is converted into the following raster function
 * template: constant raster -> clip -> calculator
 * @param bufferRule The rule being converted.
 */
async function createBufferRuleRasterArgument(bufferRule: BufferRule): Promise<RasterArgument> {
    // Generate a constant RFT to use as the source of the buffer rule.
    const constRFT = convertDataSourceToConstantRFT(bufferRule.dataSource);
    constRFT.name += '_constant_rule' + bufferRule.id.toString();

    // No buffer features RFT exists.  Instead this function creates an in-memory buffer of the features then uses
    // those features with the clip RFT to create a similar effect.
    const clipRFT = await clipConstantRFT(constRFT, bufferRule);

    // Remap no data pixels to 0 so they appear as false rather than transparent
    const calcRFT = createCalculatorRFT();
    calcRFT.name = bufferRule.dataSource.id + '_clip_calc_rule' + bufferRule.id.toString();
    calcRFT.arguments.InputNames.value.push(clipRFT.name);
    calcRFT.arguments.Rasters.value.elements.push(clipRFT);
    calcRFT.arguments.Expression.value = `Con(IsNull(${clipRFT.name}),0,${clipRFT.name})`;

    // Apply an extra clip based on the original constant function extent as a work around to a limitation
    // of the preview service (SI-1694).
    const extentClipRFT = createClipRFT();
    extentClipRFT.name = bufferRule.dataSource.id + '_clip_calc_clip_rule' + bufferRule.id.toString();
    extentClipRFT.arguments.Raster = calcRFT;
    extentClipRFT.arguments.ClippingGeometry.value = Polygon.fromExtent(constRFT.arguments.RasterInfo.value.extent);
    extentClipRFT.arguments.ClippingType.value = ClipType.Outside;

    return extentClipRFT as RasterFunctionTemplate;
}

/**
 * Clips a constant RFT using a buffer of the features defined in the buffer rule's data source.
 * @param constRFT The constant RFT being clipped.
 * @param bufferRule The buffer rule defining the features and buffer distance.
 */
async function clipConstantRFT(
    constRFT: ConstantRasterFunctionTemplate,
    bufferRule: BufferRule
): Promise<ClipRasterFunctionTemplate> {
    // Expand the constant RFT extent based on the max buffer distance.
    const clipGeometry = await generatePolygonClippingGeometry(bufferRule);
    if (clipGeometry && bufferRule.constraint && typeof bufferRule.constraint === 'number') {
        constRFT.arguments.RasterInfo.value.extent.xmin -= bufferRule.constraint;
        constRFT.arguments.RasterInfo.value.extent.xmax += bufferRule.constraint;
        constRFT.arguments.RasterInfo.value.extent.ymin -= bufferRule.constraint;
        constRFT.arguments.RasterInfo.value.extent.ymax += bufferRule.constraint;
    } else {
        // Skipping this case for now, it's much more difficult to determine how much to extend the extent
        // when features are buffered by a field vs. a static distance.  There is already a static 200k
        // buffer on the full extent so that should be sufficient for now.
    }

    // Clip the constant RFT based on the buffered clipping geometry
    const clipRFT = createClipRFT();
    clipRFT.name = bufferRule.dataSource.id + '_clip_rule' + bufferRule.id.toString();
    clipRFT.arguments.Raster = constRFT;
    clipRFT.arguments.ClippingGeometry.value = clipGeometry;

    if (bufferRule.operation === BufferOperationType.Inside) {
        clipRFT.arguments.ClippingType.value = ClipType.Outside;
    } else if (bufferRule.operation === BufferOperationType.Outside) {
        clipRFT.arguments.ClippingType.value = ClipType.Inside;
    } else {
        throw new Error('Unsupported BufferRule opration: ' + bufferRule.operation);
    }

    return clipRFT;
}

/**
 * Generates a single clipping polygon based on the features and buffer amount specified
 * within a buffer rule.
 * @param rule The buffer rule data used to generate the clipping geometry.
 */
async function generatePolygonClippingGeometry(rule: BufferRule): Promise<Polygon | null> {
    let resultPolygon: Polygon | null = null;
    let features: Graphic[] = [];

    if (rule.dataSource.layer.url) {
        const featureSet = await rule.dataSource.layer.queryFeatures();
        features = featureSet.features;
    } else if (rule.dataSource.layer.source) {
        features = rule.dataSource.layer.source.toArray();
    } else {
        throw new Error('Invalid data source: The feature layer must have the url or source property defined.');
    }

    if (rule.constraint) {
        if (rule.constraintMode === BufferConstraintType.Number && typeof rule.constraint === 'number') {
            resultPolygon = await bufferFeaturesByValue(features, rule.constraint);
        } else if (rule.constraintMode === BufferConstraintType.Field && typeof rule.constraint !== 'number') {
            resultPolygon = await bufferFeaturesByField(features, rule.constraint);
        }
    }

    return resultPolygon;
}

/**
 * Buffers features by a static distance and returns a single polygon with the aggregated results.
 * @param featureSet The features being buffered
 * @param bufferDistance The distance, in meters, the features are being buffered by
 */
async function bufferFeaturesByValue(features: Graphic[], bufferDistance: number): Promise<Polygon> {
    if (bufferDistance <= 0) {
        throw new Error('Buffer distance must be greater than 0.');
    }

    const geometries = features.map((feature) => {
        return feature.geometry;
    });

    const bufferResults = (await geometryEngineAsync.geodesicBuffer(
        geometries,
        [bufferDistance],
        'meters',
        true
    )) as Polygon[];

    return bufferResults[0];
}

/**
 * Buffers features by a variable distance based on a field and returns a single polygon with the aggregated results.
 * @param featureSet The features being buffered
 * @param field A numeric field containing the buffer value for each feature.  Features with negative values will be
 * skipped.  If the feature value is null and a default value is defined in the field properties then the default value
 * will be used.
 */
async function bufferFeaturesByField(features: Graphic[], field: Field): Promise<Polygon> {
    const bufferResults: Geometry[] = [];

    if (numberBasedFieldTypes.indexOf(field.type) === -1) {
        throw new Error('The buffer field must be a numeric type.');
    }

    for (const feature of features) {
        const bufferDistance = feature.attributes[field.name];

        if (bufferDistance && bufferDistance > 0) {
            bufferResults.push(
                (await geometryEngineAsync.geodesicBuffer(feature.geometry, bufferDistance, 'meters', true)) as Geometry
            );
        }
    }

    return (await geometryEngineAsync.union(bufferResults)) as Polygon;
}

/**
 * Converts a doctrinal template rule into a raster calculator expression.
 * @param rule The rule expression should derived from.
 */
export function generateCalculatorExpression(rule: Rule, inputName: string): string {
    switch (rule.type) {
        case 'image':
            const imageRule = rule as ImageServiceRule;
            return `(${inputName} ${imageRule.operation} (${imageRule.constraint}))`;
        case 'buffer':
            return `(${inputName} == (1))`;
        default:
            throw new Error('Rule type not supported: ' + rule.type);
    }
}
