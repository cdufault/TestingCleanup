import Collection from '@arcgis/core/core/Collection';
import FeatureEffect from '@arcgis/core/layers/support/FeatureEffect';

import {
    FilterColumnType,
    FilterExpression,
    FilterExpressionSet,
    FilterExpressionUpdateProps,
    FilterGroup,
    FilterJoinType,
    FilterType,
} from '../components/widgets/layerFilter/resources';

import {
    FilterOperation,
    FilterOperationKeys,
    FilterOperationKeys_Date,
    FilterOperationKeys_Number,
    FilterOperationKeys_String,
} from '../components/widgets/layerFilter/helpers/filterOperations';
import { FilterableLayer } from '../components/widgets/layerFilter/LayerFilter';
import FeatureLayerView = __esri.FeatureLayerView;
import Field = __esri.Field;
import View = __esri.View;
import FeatureLayer = __esri.FeatureLayer;
import MapImageLayer = __esri.MapImageLayer;
import Layer = __esri.Layer;
import Sublayer = __esri.Sublayer;

const DATE_REGEX = RegExp(/^\d{4}-\d{2}-\d{2}$/);

export function getColumnType(column: Field): FilterColumnType {
    switch (column.type) {
        case 'string':
        case 'blob':
        case 'xml':
            return 'STRING';
        case 'date':
            return 'DATE';
        case 'double':
        case 'integer':
        case 'long':
        case 'single':
        case 'small-integer':
        case 'oid':
            return 'NUMBER';
        default:
            // types: raster, guid, global-id, geometry
            return 'OTHER';
    }
}

export function loadSelectedLayer(
    view: View,
    selectedLayer: FilterableLayer,
    filterType: FilterType,
    updateFilterExpression: (updateProps: FilterExpressionUpdateProps) => void
): FilterGroup {
    const expressionSets = new Collection<FilterExpressionSet>();

    const columns = selectedLayer.fields.filter((field) => {
        return getColumnType(field) !== 'OTHER';
    });

    const filterGroup: FilterGroup = {
        id: '1',
        expressionSets: expressionSets,
        join: 'AND',
        columns: columns,
    };

    // load filter
    if (filterType === 'CLIENT') {
        view.whenLayerView(selectedLayer as Layer).then((fLyrView: FeatureLayerView) => {
            filterGroup.expressionSets = parseLayerFilter(
                fLyrView.featureEffect?.filter?.where || '',
                columns,
                selectedLayer.id,
                updateFilterExpression
            );
        });
    } else if (filterType === 'SERVER') {
        filterGroup.expressionSets = parseLayerFilter(
            selectedLayer.definitionExpression,
            columns,
            selectedLayer.id,
            updateFilterExpression
        );
        if (filterGroup.expressionSets.length > 0) {
            filterGroup.join = filterGroup.expressionSets.getItemAt(0).join;
        }
        return filterGroup;
    }

    return filterGroup;
}

function parseLayerFilter(
    whereClause: string,
    columns: Field[],
    filterLayerId: string,
    updateFilterExpression: (updateProps: FilterExpressionUpdateProps) => void
): Collection<FilterExpressionSet> {
    const expressionSets = new Collection<FilterExpressionSet>();
    const expressions = [];
    let join: FilterJoinType;
    join = 'AND';
    if (whereClause && whereClause.length > 0) {
        if (whereClause.startsWith('(')) {
            whereClause = whereClause.substring(1, whereClause.length - 1);
            let and_index = -1;
            let or_index = -1;
            while (
                (and_index = whereClause.toUpperCase().indexOf(') AND (', and_index + 1)) >= 0 ||
                (or_index = whereClause.toUpperCase().indexOf(') OR (', or_index + 1)) >= 0
            ) {
                let expressionStr = '';

                if (and_index != -1 && (and_index < or_index || or_index === -1)) {
                    join = 'AND';
                    expressionStr = whereClause.substring(0, and_index);
                    whereClause = whereClause.substring(and_index + 7);
                } else {
                    join = 'OR';
                    expressionStr = whereClause.substring(0, or_index);
                    whereClause = whereClause.substring(or_index + 6);
                }
                expressions.push(parseFilterExpression(expressionStr, columns));
            }
        }
        expressions.push(parseFilterExpression(whereClause, columns));
    }

    for (let i = 0; i < expressions.length; i++) {
        const filterExpressions = new Collection<FilterExpression>();
        const filterSetId = filterLayerId + '_FS' + i.toString();
        const filterExpressionId = filterSetId + '_EX0';
        const filterExpression = {
            id: filterExpressionId,
            column: expressions[i].column,
            operation: expressions[i].operation,
            value: expressions[i].value,
            columns: columns,
            expressionSetId: filterSetId,
            onFilterExpressionUpdate: updateFilterExpression,
        };

        filterExpressions.add(filterExpression);
        const filterExpressionSet: FilterExpressionSet = {
            id: filterSetId,
            expressions: filterExpressions,
            join: join,
            filterGroupId: '1',
        };
        expressionSets.add(filterExpressionSet);
    }
    return expressionSets;
}

function parseFilterExpression(
    expression: string,
    columns: Field[]
): { column: Field; operation: string; value: string | string[] } {
    // parse COLUMN
    const parts = expression.split(' ');
    const columnStr = parts[0];
    const column = columns.find((x) => x.name.toLowerCase() === columnStr.toLowerCase());
    if (!column) {
        throw new Error('input column was not found in the list of columns.');
    }
    const colType = getColumnType(column);
    // remove column from expression
    expression = expression.replace(columnStr, '').trim();

    // parse OPERATION
    const filterOpKeys = getFilterOperationKeys(colType);
    const filterOps = filterOpKeys.filter((key) => {
        return expression.startsWith(FilterOperation[key].operation);
    });
    let operationKey = filterOps[0];
    let filterOp = FilterOperation[operationKey];
    // remove operation from expression
    expression = expression.replace(filterOp.operation, '').trim();
    if (filterOps.length > 1) {
        if (FilterOperation[operationKey].operation === 'LIKE') {
            // LIKE operators
            if (expression.startsWith("'%") && expression.endsWith("%'")) {
                operationKey = 'CONTAINS_str';
            } else if (expression.startsWith("'%")) {
                operationKey = 'ENDS_WITH_str';
            } else {
                operationKey = 'STARTS_WITH_str';
            }
            filterOp = FilterOperation[operationKey];
        }
    }

    // parse VALUE
    // DATE queries require numbers to be wrapped with single quotes
    // ex. CURRENT_TIMESTAMP - INTERVAL '30' MINUTE
    let value: string | string[] =
        colType !== 'DATE'
            ? expression.replace(/'%/g, '').replace(/%'/g, '').replace(/'/g, '')
            : expression.replace(/'%/g, '').replace(/%'/g, '');

    if (operationKey === 'IS_BETWEEN' || operationKey === 'IS_NOT_BETWEEN') {
        const values = value.split(/ [Aa][Nn][Dd] /, 2);
        if (values.length == 2) {
            value = [values[0], values[1]];
        }
    } else if (filterOp.numOfValues === 2 || filterOp.numOfValues === 'array') {
        value = value.split(',');
    }
    return {
        column,
        operation: operationKey,
        value,
    };
}

function getFilterOperationKeys(colType: FilterColumnType) {
    switch (colType) {
        case 'STRING':
            return FilterOperationKeys_String;
        case 'NUMBER':
            return FilterOperationKeys_Number;
        case 'DATE':
            return FilterOperationKeys_Date;
        default:
            return [];
    }
}

/**
 * Finds the Sublayer from the parent of a Feature Layer generated by a sublayer.createFeatureLayer() call.
 * This method looks for a custom attribute that refers to the parent of the sublayer.
 * If this layer is not a sublayer-derived Feature Layer, it will return null.
 * @param selectedLayer The Sublayer-derived Feature Layer
 */
export function tryToConvertFeatureLayerToSublayer(selectedLayer: FeatureLayer): Sublayer | null {
    const featureLayer = selectedLayer as FeatureLayer;
    if (featureLayer) {
        const mapImageLayer = featureLayer?.SUBLAYER_PARENT as MapImageLayer;
        if (mapImageLayer) {
            return mapImageLayer.findSublayerById(featureLayer.layerId) as Sublayer;
        }
    }
    return null;
}

/**
 * Updates the filter based on the given expression
 * @param view The view, for client side filters
 * @param selectedLayer The selected layer or sublayer on which to update the filter
 * @param filterType The filter type, either SERVER or CLIENT.
 * @param expression The input expression
 */
export function updateFilter(view: View, selectedLayer: FilterableLayer, filterType: string, expression: string): void {
    const layer = tryToConvertFeatureLayerToSublayer(selectedLayer as FeatureLayer) ?? selectedLayer;
    if (layer) {
        if (filterType === 'CLIENT') {
            //   CLIENT SIDE FILTER QUERY
            const featureLayer = layer as FeatureLayer;
            if (featureLayer) {
                view.whenLayerView(featureLayer).then((featureLayerView: FeatureLayerView) => {
                    if (expression) {
                        featureLayerView.featureEffect = new FeatureEffect({
                            filter: {
                                where: expression,
                            },
                            excludedEffect: 'grayscale(100%) opacity(30%) brightness(50%)',
                        });
                    } else {
                        featureLayerView.featureEffect = new FeatureEffect(); // clear out effect
                    }
                });
            }
        } else if (filterType === 'SERVER') {
            // SERVER SIDE FILTER QUERY
            layer.definitionExpression = expression;
        }
    }
}

export function clearFilter(view: View, selectedLayer: FilterableLayer, filterType: string): void {
    updateFilter(view, selectedLayer, filterType, '');
}

export function getExpressionString(filterGroup: FilterGroup | null): string | undefined {
    return filterGroup
        ? filterGroup.expressionSets
              .map((group, groupIndex) => {
                  // const { expressions, join } = group;
                  const { expressions } = group;
                  const expressionStrings = expressions
                      .map((exp) => {
                          //Need to update this error handling
                          /*
                    const shouldUpdate = checkUpdateQuery(exp);
                    if (!shouldUpdate) {
                        updateQuery = false;
                    }
                    */
                          return formatQuery(exp);
                      })
                      .join(` ${filterGroup.join} `);
                  if (filterGroup.expressionSets.length > 1) {
                      //return groupIndex === 0 ? `(${expressionStrings})` : `${join} (${expressionStrings})`;
                      return groupIndex + 1 < filterGroup.expressionSets.length
                          ? `(${expressionStrings}) ${filterGroup.join}`
                          : `(${expressionStrings})`;
                  } else {
                      return expressionStrings;
                  }
              })
              .join(' ')
        : undefined;
}

/**
 * Applies a filter to the provided MapView or SceneView
 * @param filterGroup The input Filter Group
 * @param view The View on which to apply the filter, if using client side filtering
 * @param filterType The filter type, 'CLIENT' or 'SERVER'
 * @param selectedLayer The selected layer to apply a filter on, if using server side filtering.
 */
export async function applyFilter(
    filterGroup: FilterGroup,
    view: View,
    filterType: FilterType,
    selectedLayer: FilterableLayer
): Promise<void> {
    const expression = getExpressionString(filterGroup);
    if (expression) {
        updateFilter(view, selectedLayer, filterType, expression);
    }
}

/**
 * Formats the query value given a value and column type.
 * @param value Input value for a filter
 * @param colType Column type for the value
 */
export function formatQueryValue(value: string | number, colType: FilterColumnType): string {
    if (colType === 'NUMBER') {
        return `${value}`;
    } else if (colType == 'DATE') {
        // check for timestamp
        const dateValue = value as string;
        if (dateValue) {
            if (dateValue.includes('CURRENT_TIMESTAMP') || dateValue.includes('CURRENT_DATE')) {
                return `${dateValue}`; // CURRENT_TIMESTAMP or CURRENT_DATE queries
            } else if (dateValue.match(DATE_REGEX)) {
                // YYYY-MM-DD
                return `DATE '${dateValue}'`;
            }
            // YYYY-MM-DD HH:MI:SS
            return `TIMESTAMP '${dateValue}'`;
        }
    } else if (colType === 'STRING') {
        let escapedStrValue = value as string;
        if (escapedStrValue) {
            // Escape single quotes with additional single quote
            escapedStrValue = escapedStrValue.replace(/'/g, "''");
        }
        return `'${escapedStrValue}'`;
    }

    // colType is 'OTHER' so leave it as is
    return `${value}`;
}

function formatQuery(exp: FilterExpression) {
    const { column, operation, value } = exp;
    const filterOp: FilterOperation = FilterOperation[operation as FilterOperationKeys];

    if (!filterOp) return;

    const queryStr = filterOp?.format.replace('{COLUMN}', column.name);
    const colType = getColumnType(column);

    if (filterOp.numOfValues === 1) {
        if (operation.endsWith('_str')) {
            return queryStr.replace('{VALUE}', `${value}`);
        }
        return queryStr.replace('{VALUE}', formatQueryValue(value as string | number, colType));
    } else {
        if (filterOp.numOfValues === 2) {
            const valueStrArray = value as string[];
            const value1 = formatQueryValue(valueStrArray[0], colType);
            const value2 = formatQueryValue(valueStrArray[1], colType);
            return queryStr.replace('{VALUE1}', value1).replace('{VALUE2}', value2);
        } else if (filterOp.numOfValues === 'array') {
            const values = Array.isArray(value)
                ? (value as (string | number)[])
                      .map((x) => {
                          return formatQueryValue(x, colType);
                      })
                      .join(',')
                : '';
            return queryStr.replace('{VALUES}', values);
        }
    }
}
