import Field from '@arcgis/core/layers/support/Field';

export const CSS = {
    layerFilterWidget: 'layer-filter-widget',
};

export interface LayerFilterProps extends __esri.WidgetProperties {
    view: __esri.MapView | __esri.SceneView;
}

export interface FilterLayerInfo {
    id: string;
    title: string;
}

export interface FilterGroup {
    id: string;
    expressionSets: __esri.Collection<FilterExpressionSet>;
    join: FilterJoinType;
    columns: Field[];
}

export interface FilterExpressionSet {
    id: string;
    expressions: __esri.Collection<FilterExpression>;
    join: FilterJoinType;
    filterGroupId: string;
}

export interface FilterExpressionUpdateProps {
    id: string;
    columnName: string;
    operation: string;
    value: string | number | string[] | number[];
    expressionSetId: string;
}

export interface FilterExpression {
    id: string;
    column: __esri.Field;
    operation: string;
    value: string | number | string[] | number[];
    columns: Field[];
    expressionSetId: string;
    onFilterExpressionUpdate: (updateProps: FilterExpressionUpdateProps) => void;
}

export type FilterColumnType = 'STRING' | 'NUMBER' | 'DATE' | 'OTHER';

export type FilterJoinType = 'AND' | 'OR';

export type FilterType = 'SERVER' | 'CLIENT';
