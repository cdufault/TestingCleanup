import { MenuProps } from '@mui/material';

/**
 * Type definition for parameters collected from user
 */
export interface InputFormValueType {
    name: string;
    value: string;
}

/**
 * Type definition for user inputs
 */
export interface GPUserInputParams {
    param: InputFormItemType;
    inputFormValues: InputFormValueType[];
    setInputFormValues: React.Dispatch<React.SetStateAction<InputFormValueType[]>>;
    layerType?: string;
    hidden?: boolean;
    dataTable?: any[];
}

/**
 * Represents a geoprocessing string type.
 */
export type GPStringType = string;

/**
 * Represents a geoprocessing linear unit type with a distance and a unit label.
 */
export type GPLinearUnit = {
    distance: number;
    units: string;
};

/**
 * Type definition for generic GP tool input parameters
 */
export interface InputFormItemType {
    category: string;
    choiceList?: GPStringType[] | GPLinearUnit[];
    dataType: string;
    defaultValue: Record<string, unknown>;
    description: string;
    direction: string;
    displayName: string;
    name: string;
    parameterType: string;
    resources?: TaskResourceParameter[];
    baseUrl?: string;
    dataTable?: TaskParameterDataSource;
}

/**
 * Type definition for immad task resources
 */
export interface TaskResources {
    task: string;
    parameters: TaskResourceParameter[];
}

/**
 * Type definition for a task resource parameter
 */
export interface TaskResourceParameter {
    name: string;
    dataTypeOverride?: string;
    resources?: TaskResourceParameterInfo[];
    dataTable?: TaskParameterDataSource;
}

/**
 * Type definition for additional parameter information
 */
export interface TaskResourceParameterInfo {
    url: string;
}

/**
 * Type definition for a data table associated with a parameter
 */
export interface TaskParameterDataSource {
    tableItemId: string;
    displayField: string;
    valueField: string;
    valueParam: string;
    idField: string;
}

/**
 * Multi Select menu properties
 */
export const MenuProp = {
    getContentAnchorEl: null,
    anchorOrigin: {
        vertical: 'bottom',
        horizontal: 'center',
    },
    transformOrigin: {
        vertical: 'top',
        horizontal: 'center',
    },
    variant: 'menu',
} as Partial<MenuProps>;
