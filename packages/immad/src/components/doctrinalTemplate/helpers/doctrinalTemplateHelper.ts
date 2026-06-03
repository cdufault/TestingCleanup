import {
    createCalculatorFunctionArguments,
    createCalculatorRFT,
    createRasterFunctionVariable,
    convertRFTToImageryLayer,
} from './rasterFunctionTemplateHelper';
import { createRasterArgument, generateCalculatorExpression } from './ruleHelper';
import DoctrinalTemplate, {
    DoctrinalTemplateAnalysisMode,
    DoctrinalTemplatePropertySet,
} from '../api/DoctrinalTemplate';
import RasterFunctionTemplate, { RasterFunctionVariable, RasterVariable } from '../api/RasterFunctionTemplate';
import { createPortalItem, updatePortalItem } from '../../../helpers/portalItemsHelper';
import RasterFunction from '@arcgis/core/layers/support/RasterFunction';
import PortalItem from '@arcgis/core/portal/PortalItem';
import RasterColormapRenderer from '@arcgis/core/renderers/RasterColormapRenderer';
import { IItemAdd, IItemUpdate } from '@esri/arcgis-rest-portal';
import ImageryLayer = __esri.ImageryLayer;
import EsriMap = __esri.Map;
import UniqueValueRenderer from '@arcgis/core/renderers/UniqueValueRenderer';
import Color from '@arcgis/core/Color';

export const defaultUniqueValueRenderer = new UniqueValueRenderer({
    field: 'value',
    uniqueValueInfos: [
        {
            label: 'Met',
            value: 1,
            symbol: {
                type: 'simple-fill',
                color: new Color([0, 224, 0]),
            } as __esri.SymbolProperties,
        },
        {
            label: 'Not Met',
            value: 0,
            symbol: {
                type: 'simple-fill',
                color: new Color([64, 0, 0]),
            } as __esri.SymbolProperties,
        },
    ],
});

/**
 * Internal helper method that creates a new property set containing a serialized
 * doctrinal template and the properties defined for its raster function template.
 * @param template The template being added to the property set.
 * @param rft The raster function template properties being added to the property set.
 */
function createDoctrinalTemplatePropertySet(
    template: DoctrinalTemplate,
    rft: RasterFunctionTemplate
): DoctrinalTemplatePropertySet {
    let templateProps = template.toJson();

    // Portal item properties do not allow '<' or '>' characters.
    let templatePropsStr = JSON.stringify(templateProps);
    templatePropsStr = templatePropsStr.replaceAll('<', '&lt');
    templatePropsStr = templatePropsStr.replaceAll('>', '&gt');

    templateProps = JSON.parse(templatePropsStr);
    const templateVariable = createRasterFunctionVariable('Template', templateProps);

    return {
        ...rft.properties,
        Template: templateVariable,
    } as DoctrinalTemplatePropertySet;
}

/**
 * Internal helper method that converts a raster function template into a file.
 * @param rft The input raster function template.
 * @param fileName The output file name.
 */
function convertRFTToFile(rft: RasterFunctionTemplate, fileName: string): File {
    const rftStr = JSON.stringify(rft);
    const rftBlob = new Blob([rftStr], { type: 'application/json' });
    const fullFileName = fileName + '.rft.json';
    return new File([rftBlob], fullFileName);
}

/**
 * Converts a Doctrinal Template into an imagery layer.
 * @param template The input Doctrinal Template
 * @param renderer The renderer, if any. If a renderer is not present, a default one will be used.
 */
export async function convertToImageryLayer(
    template: DoctrinalTemplate,
    renderer?: UniqueValueRenderer | RasterColormapRenderer
): Promise<ImageryLayer> {
    const rft = await convertToRFT(template, true, true);

    const imageryLayer = (await convertRFTToImageryLayer(rft)) as ImageryLayer;
    await imageryLayer.load();
    imageryLayer.renderer = renderer ?? defaultUniqueValueRenderer;

    applyDoctrinalTemplateLayerStyling(imageryLayer);

    return imageryLayer;
}

/**
 * Update the renderer and renderingUrl property on the supplied layer to display
 * ImageryLayer in the doctrinal template styling.
 * @param layer The layer being updated.
 */
export function applyDoctrinalTemplateLayerStyling(layer: ImageryLayer): void {
    const renderingRule = new RasterFunction({
        functionName: 'Identity',
        functionArguments: {
            Raster: '$$',
        },
    });
    layer.renderer = layer.renderer ?? defaultUniqueValueRenderer;
    layer.renderingRule = renderingRule;
    layer.interpolation = 'nearest';
    layer.opacity = 0.6;
}

/**
 * Saves or updates a doctrinal template as a raster function template portal item.
 * @param template The template data being applied to the portal item.
 * @param portalItem optional.  Update this portal item instead of creating a new
 * portal item.
 * @param saveCopy boolean Saves this template as a copy of the template portal item, instead of overwriting it.
 */
export async function saveTemplate(
    template: DoctrinalTemplate,
    portalItem?: PortalItem,
    saveCopy?: boolean
): Promise<PortalItem> {
    const rft = await convertToRFT(template, false, false);
    const portalItemProps = createDoctrinalTemplatePropertySet(template, rft);
    const fileName = template.title + '_' + Date.now().toString();
    const rftFile = convertRFTToFile(rft, fileName);

    let portalItemId = '';
    if (portalItem && portalItem.itemControl !== null && !saveCopy) {
        const itemMetadata = {
            data: rftFile,
            description: template.description,
            id: portalItem.id,
            properties: portalItemProps,
            snippet: template.summary,
            title: template.title,
        } as IItemUpdate;

        const updateResult = await updatePortalItem(itemMetadata);
        if (updateResult.success) {
            portalItemId = updateResult.id;
        }
    } else {
        const itemMetadata = {
            categories: [],
            culture: 'en-us',
            data: rftFile,
            description: template.description,
            extent: [],
            owner: template.createdBy,
            properties: portalItemProps,
            snippet: template.summary,
            tags: ['IMMAD', 'Doctrinal Template'],
            title: template.title,
            type: 'Raster function template',
            typeKeywords: ['Function Template', 'Functions', 'Processing', 'Raster', 'rft', 'Templates'],
        } as IItemAdd;

        const createResult = await createPortalItem(itemMetadata);
        if (createResult.success) {
            portalItemId = createResult.id;
        }
    }

    if (!portalItemId) {
        throw new Error('An error occurred while creating/updating the portal item.');
    }

    const updatedPortalItem = new PortalItem({ id: portalItemId });
    await updatedPortalItem.load();
    return updatedPortalItem;
}

/**
 * Creates a doctrinal template object from a portal item.  This function assumes
 * the portal was created using the saveTemplate helper method.
 * @param portalItem The portal item being converted.
 * @param map Optional.  The map component is used to synchronize data sources back to map layers.
 * If a map object is not supplied then new layer objects will be created for datasources that require
 * layer objects.
 */
export function loadTemplate(portalItem: PortalItem, map?: EsriMap): DoctrinalTemplate {
    if (!portalItem.sourceJSON.properties.Template) {
        throw Error('No doctrinal template property detected.');
    }

    // Remap '<' or '>' characters back to their original form.
    let templatePropsStr = JSON.stringify(portalItem.sourceJSON.properties.Template.value);
    templatePropsStr = templatePropsStr.replaceAll('&lt', '<');
    templatePropsStr = templatePropsStr.replaceAll('&gt', '>');
    const templateProps = JSON.parse(templatePropsStr);

    return DoctrinalTemplate.fromJson(templateProps, map);
}

/**
 * Converts a doctrinal template object into a raster function template.
 * @param template The template being converted.
 * @param remapUrls boolean indicating if urls should be remapped for PKI workaround.
 * @param appendTokens boolean indicating if urls should have their token appended to the url.
 */
export async function convertToRFT(
    template: DoctrinalTemplate,
    remapUrls: boolean,
    appendTokens: boolean
): Promise<RasterFunctionTemplate> {
    const calcArgs = createCalculatorFunctionArguments();
    const ruleLinkOperator = getRuleConcatenationOperator(template);

    for (const rule of template.rules) {
        if (rule.enabled) {
            const rasterArgument = await createRasterArgument(rule, remapUrls, appendTokens);
            let inputName = '';

            if (rasterArgument.type === 'RasterFunctionVariable') {
                inputName = (rasterArgument as RasterFunctionVariable<RasterVariable>).value.name;
            } else {
                inputName = rasterArgument.name;
            }
            calcArgs.InputNames.value.push(inputName);
            calcArgs.Rasters.value.elements.push(rasterArgument);

            // Add a concatenation operation to the calculator expression if the rule is not the
            // first rule being added to the expression.
            if (calcArgs.Expression.value.length > 0) {
                calcArgs.Expression.value += ` ${ruleLinkOperator} `;
            }

            // Add the rule to the calculator expression.
            calcArgs.Expression.value += generateCalculatorExpression(rule, inputName);
        }
    }

    const rft = createCalculatorRFT(calcArgs);
    rft.name = template.title;
    return rft as RasterFunctionTemplate;
}

/**
 *
 * @param template
 */
function getRuleConcatenationOperator(template: DoctrinalTemplate): string {
    switch (template.mode) {
        case DoctrinalTemplateAnalysisMode.All:
            return '&';
        case DoctrinalTemplateAnalysisMode.Any:
            return '|';
        case DoctrinalTemplateAnalysisMode.WeightedSum:
            return '+';
        default:
            return '&';
    }
}
