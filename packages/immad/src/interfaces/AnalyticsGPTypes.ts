import { RMTQueryMetadata } from '../components/administrator/components/AdminSettingsSlice';

/* Defines the information needed to display a UI control for a single parameter in an Analytics tool.
 */
export interface AnalyticsGPParameter {
    parameter_name: string;
    tool_name: string;
    label: string;
    data_type: string;
    required: boolean;
    scope: 'global' | 'mission';
    is_sub_parameter: boolean;
    control_type?: string;
    portal_item_type?: string;
    sub_parameter_names?: Array<string>;
    parent_parameter_name?: string;
    pick_list_options?: Array<string>;
}

/* Defines an Analytics tool in the Analytics Settings UI. Consists of name and alias of the tool and an array of its parameter definitions.
 */
export interface AnalyticsGPTool {
    name: string;
    alias: string;
    parameters: AnalyticsGPParameter[];
}

/* Ties the Analytics parameter control to its place in the Analytics Settings tree view.
 */
export interface ParameterView extends AnalyticsGPParameter {
    id: number;
    toolId: string;
    value?: AnalyticsParameterType;
}

/* The dynamic type used to represent an analytics sub-parameter and its value in the Portal app settings.
 */
export type SubParameterValues = {
    [key: string]: string;
};

/* Defines the types of data allowed for analytics parameters.
 */
export type AnalyticsParameterType = SubParameterValues | string | boolean | number | Array<string> | Array<number>;

/* The dynamic type used to represent an analytics parameter and its value in the Portal app settings.
 */
export type AnalyticsToolParameterValues = {
    [key: string]: AnalyticsParameterType;
};

/* The dynamic type used to represent an analytics tool with its parameters and values in the Portal app settings.
 */
export interface AnalyticsToolData {
    [key: string]: AnalyticsToolParameterValues;
}

/* Defines the information contained in the Portal app settings.
 */
export interface PortalAppSettings {
    savedState: { itemId: string };
    analyticsToolData?: AnalyticsToolData;
    rmtData?: RMTQueryMetadata[];
    gateAppPortalItemId: string | undefined;
    rmtMessageTableId?: string;
}
