import React, { useEffect, useState, useMemo } from 'react';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import RecursiveTreeView, { RenderTree, ShowHighlight } from '../../recursiveTreeView/RecursiveTreeView';
import { StyledRightButton } from '../styles';
import { useSnackbar } from 'notistack';
import { ConfigHelper } from '../../../helpers/configHelper';
import { updatePortalWebApp } from '../../../helpers/portalItemsHelper';
import AnalyticToolParamControls from './AnalyticToolParamControls';
import {
    AnalyticsGPTool,
    AnalyticsGPParameter,
    ParameterView,
    AnalyticsToolParameterValues,
    PortalAppSettings,
    AnalyticsParameterType,
    SubParameterValues,
} from '../../../interfaces/AnalyticsGPTypes';
import { updateAnalyticToolSettings } from './AdminSettingsSlice';
import { useAppDispatch } from '../../../hooks/hooks';
import { AppConfig } from 'src/interfaces/AppConfig';

export default function A3MLSettingsPage(): JSX.Element {
    const dispatch = useAppDispatch();
    const { enqueueSnackbar } = useSnackbar();
    const expandedNodeIds = ['0'];
    const MemoizedAnalyticToolParamControls = React.memo(AnalyticToolParamControls);

    /**
     * Handle when a parameter value has been updated from one of the child AnalyticToolParamControls.
     * @param new_value
     * @param param
     */
    const parameterValueChanged = function (new_value: AnalyticsParameterType, param: ParameterView) {
        const currentParam = toolParameters.find(
            (tool_param) => tool_param.toolId === param.toolId && tool_param.parameter_name === param.parameter_name
        );

        if (currentParam && new_value !== currentParam.value) {
            // get tool name from given toolId, then update the given parameter value inside gpToolSettings[tool.name][parameter_name]
            const analyticsTools = appConfig ? appConfig.analyticsSettings : null;
            if (analyticsTools && gpToolsSettings) {
                const toolName = param.tool_name;
                // deep copy of PortalAppSettings
                const updatedGPToolsSettings = JSON.parse(JSON.stringify(gpToolsSettings));
                if (param.is_sub_parameter && param.parent_parameter_name) {
                    updatedGPToolsSettings.analyticsToolData[toolName][param.parent_parameter_name][
                        param.parameter_name
                    ] = new_value;
                } else {
                    updatedGPToolsSettings.analyticsToolData[toolName][param.parameter_name] = new_value;
                }

                dispatch(updateAnalyticToolSettings(updatedGPToolsSettings.analyticsToolData));
                setGpToolsSettings(updatedGPToolsSettings);

                // instead of rebuilding the entire toolParameters list, just update the one param
                setToolParameters((prev) =>
                    prev.map((parameterView) => {
                        if (
                            parameterView.toolId === param.toolId &&
                            parameterView.parameter_name === param.parameter_name
                        ) {
                            return { ...parameterView, value: new_value };
                        }
                        return parameterView;
                    })
                );
                console.debug('A3MLSettingsPage parameterValueChanged completed');
            }
        } else {
            console.debug('A3MLSettingsPage parameterValueChanged skipped - no change or param not found');
        }
    };

    const [appConfig, setAppConfig] = useState<AppConfig>();
    const [analyticsTreeData, setAnalyticsTreeData] = useState<RenderTree>({
        id: '0',
        name: 'Analytics Tools',
        children: [],
    });

    const [gpToolsSettings, setGpToolsSettings] = useState<PortalAppSettings>();
    const [toolParameters, setToolParameters] = useState<Array<ParameterView>>([]);
    const [selectedToolId, setSelectedToolId] = useState<string>('');
    const [isSaveDisabled, setIsSaveDisabled] = useState<boolean>(true);
    const [showHighlight, setShowHighlight] = useState<ShowHighlight>({ show: false });

    useEffect(() => {
        initializeGPToolsSettings();
    }, []);

    /**
     * Update the Analytics Tools tree view with tools from the app config and parameter values from current Portal item data.
     * @param gpSettings Current Portal item data, including any analytics tool parameter values.
     * @param analyticsTools Display information for all Analytics Tools.
     */
    const updateToolParameterUI = (gpSettings: PortalAppSettings, analyticsTools: AnalyticsGPTool[]): void => {
        let tool: AnalyticsGPTool;
        let toolId = 1;
        let paramId = 0;
        let subId = 101;
        const toolParams: Array<ParameterView> = [];
        const gpToolData = gpSettings.analyticsToolData;
        for (tool of analyticsTools) {
            for (let i = 0; i < tool.parameters.length; i++) {
                const currentParamName = tool.parameters[i].parameter_name;
                let paramValue: AnalyticsParameterType;
                if (gpToolData && gpToolData[tool.name] && gpToolData[tool.name][currentParamName]) {
                    paramValue = gpToolData[tool.name][currentParamName];
                } else {
                    paramValue = '';
                }
                const currentToolParam: ParameterView = {
                    id: paramId,
                    toolId: toolId.toString(),
                    parameter_name: currentParamName,
                    tool_name: tool.name,
                    required: tool.parameters[i].required,
                    scope: tool.parameters[i].scope,
                    label: tool.parameters[i].label,
                    data_type: tool.parameters[i].data_type,
                    is_sub_parameter: false,
                    control_type: tool.parameters[i].control_type ?? '',
                    portal_item_type: tool.parameters[i].portal_item_type ?? '',
                    pick_list_options: tool.parameters[i].pick_list_options ?? [],
                    value: paramValue,
                };
                toolParams.push(currentToolParam);
                paramId++;
                // create ParameterViews for sub-parameters
                // if control_type is group, add ParameterViews for each sub-parameter name
                if (tool.parameters[i].control_type === 'group') {
                    tool.parameters[i].sub_parameter_names?.forEach((subParam) => {
                        let subParameterValue = '';
                        if (typeof paramValue === 'object' && !Array.isArray(paramValue)) {
                            subParameterValue = paramValue[subParam];
                        }

                        const subParameter: ParameterView = {
                            id: paramId,
                            toolId: subId.toString(),
                            parameter_name: subParam,
                            tool_name: tool.name,
                            required: tool.parameters[i].required,
                            scope: tool.parameters[i].scope,
                            label: tool.parameters[i].label,
                            data_type: tool.parameters[i].data_type,
                            is_sub_parameter: true,
                            parent_parameter_name: tool.parameters[i].parameter_name,
                            value: subParameterValue,
                        };
                        toolParams.push(subParameter);
                        paramId++;
                        subId++;
                    });
                }
            }
            toolId++;
        }
        setToolParameters(toolParams);
    };

    /**
     * Add default parameter information for any parameters missing from the Portal item data.
     * @param parameter Display information for a single Analytics Tool parameter.
     * @param analyticsToolData An Analytics Tool parameter and its current value in the Portal app settings.
     * @returns Updated parameter name / value pairing for the current parameter.
     */
    const initializeMissingToolParameter = (
        parameter: AnalyticsGPParameter,
        analyticsToolData: AnalyticsToolParameterValues
    ): AnalyticsToolParameterValues => {
        if (parameter.data_type === 'string' && parameter.control_type === 'list') {
            analyticsToolData[parameter.parameter_name] = [];
        } else if (parameter.data_type == 'boolean') {
            analyticsToolData[parameter.parameter_name] = false;
        } else if (parameter.data_type === 'string' && parameter.control_type === 'group') {
            const subParamObject: SubParameterValues = {};
            if (parameter.sub_parameter_names) {
                parameter.sub_parameter_names.forEach((sub_param) => {
                    subParamObject[sub_param] = '';
                });
            }
            analyticsToolData[parameter.parameter_name] = subParamObject;
        } else if (parameter.data_type === 'string' || parameter.data_type === 'number') {
            analyticsToolData[parameter.parameter_name] = '';
        }

        return analyticsToolData;
    };

    /**
     * Initialize Analytics Tool settings from current Portal item data.
     */
    const initializeGPToolsSettings = async (): Promise<void> => {
        const appConfigPortal = await ConfigHelper.loadAppConfigFromPortal();
        const config = ConfigHelper.getAppConfig();
        setAppConfig(config);

        const a3mlTools: AnalyticsGPTool[] = config.analyticsSettings;
        const treeData: RenderTree = {
            id: '0',
            name: 'Analytics Tools',
            children: [],
        };
        if (treeData.children) {
            let tool: AnalyticsGPTool;
            let toolId = 1;
            const toolData = appConfigPortal;

            if (!('analyticsToolData' in toolData)) {
                toolData.analyticsToolData = {};
            }
            for (tool of a3mlTools) {
                const toolNode: RenderTree = { id: toolId.toString(), name: tool.alias, children: [] };
                treeData.children.push(toolNode);
                tool.parameters.forEach((parameter) => {
                    if (parameter.control_type === 'group') {
                        if (parameter.sub_parameter_names && parameter.sub_parameter_names.length > 0) {
                            let subId = 101;
                            parameter.sub_parameter_names.forEach((sub_param) => {
                                // add sub-parameters to render tree
                                const innerNode = { id: subId.toString(), name: sub_param };
                                if (toolNode.children) {
                                    toolNode.children.push(innerNode);
                                    subId++;
                                }
                            });
                        }
                    }
                });
                if (toolData.analyticsToolData) {
                    // add parameters for tools not already in the Portal item data
                    if (!(tool.name in toolData.analyticsToolData)) {
                        toolData.analyticsToolData[tool.name] = {};
                        const toolObject = toolData.analyticsToolData[tool.name];
                        tool.parameters.forEach((param) => {
                            if (toolData.analyticsToolData) {
                                toolData.analyticsToolData[tool.name] = initializeMissingToolParameter(
                                    param,
                                    toolObject
                                );
                            }
                        });
                    }
                    // handle if tool was already present, but a parameter was added
                    else {
                        const existingToolObject = toolData.analyticsToolData[tool.name];
                        tool.parameters.forEach((param) => {
                            if (!(param.parameter_name in existingToolObject)) {
                                if (toolData.analyticsToolData) {
                                    toolData.analyticsToolData[tool.name] = initializeMissingToolParameter(
                                        param,
                                        existingToolObject
                                    );
                                }
                            }
                        });
                    }
                }
                toolId++;
            }
            dispatch(updateAnalyticToolSettings(toolData.analyticsToolData));
            updateToolParameterUI(toolData, a3mlTools);
            setGpToolsSettings(toolData);
            setAnalyticsTreeData(treeData);
        }
    };

    // dynamically return array of parameter controls based on which tool is selected
    const paramControls = useMemo(() => {
        const matchingToolParams = toolParameters.filter(
            (param) => param.toolId === selectedToolId && param.scope === 'global'
        );
        return (
            <MemoizedAnalyticToolParamControls
                toolParameters={matchingToolParams}
                isSaveDisabled={isSaveDisabled}
                onParameterValueChanged={parameterValueChanged}
            ></MemoizedAnalyticToolParamControls>
        );
    }, [selectedToolId, isSaveDisabled, toolParameters]);

    /**
     * Handle selection change on the tools treeview.
     * @param event Selection change event on treeview node.
     * @param nodeId Selected node id.
     */
    const nodeSelected = (event: React.SyntheticEvent, nodeId: string) => {
        setShowHighlight({ show: true });
        setSelectedToolId(nodeId);
    };
    /**
     * Handle Save button clicked.
     */
    const saveButtonClicked = async function () {
        setIsSaveDisabled(true);
        const result = await updatePortalWebApp(
            appConfig ? appConfig.portalConfigItemId : '',
            JSON.stringify(gpToolsSettings)
        );
        if (result.success) {
            enqueueSnackbar('Analytics Settings have been saved!', { variant: 'success' });
        } else {
            console.error('Update item response was unsuccessful.');
            enqueueSnackbar('Error occurred updating Analytics Settings. See console logs for more details.', {
                variant: 'error',
            });
        }
    };
    /**
     * Handle Edit button clicked.
     */
    const editButtonClicked = function () {
        setIsSaveDisabled(false);
    };
    /**
     * Handle Cancel button clicked.
     */
    const cancelButtonClicked = async function () {
        setIsSaveDisabled(true);
        const currentAppConfig = ConfigHelper.getAppConfig();
        const portalConfig = await ConfigHelper.loadAppConfigFromPortal();
        if (portalConfig && currentAppConfig) {
            // reset all UI elements to show original values from the portal config
            updateToolParameterUI(portalConfig, currentAppConfig.analyticsSettings);
        }
    };

    return (
        <form>
            <Typography variant='h4' gutterBottom={true}>
                Analytics Settings
                {isSaveDisabled ? (
                    <StyledRightButton variant='contained' color='secondary' onClick={editButtonClicked}>
                        Edit
                    </StyledRightButton>
                ) : (
                    <>
                        <StyledRightButton
                            variant='contained'
                            color='secondary'
                            type='submit'
                            onClick={saveButtonClicked}
                        >
                            Save
                        </StyledRightButton>
                        <StyledRightButton
                            variant='contained'
                            color='primary'
                            onClick={cancelButtonClicked}
                            title={'Cancel edits.'}
                        >
                            Cancel
                        </StyledRightButton>
                    </>
                )}
            </Typography>
            <Stack direction='row' divider={<Divider orientation='vertical' flexItem />} spacing={2}>
                <RecursiveTreeView
                    nodes={analyticsTreeData}
                    expandedNodes={expandedNodeIds}
                    handleSelect={nodeSelected}
                    showHighlightOnCategoryItem={showHighlight}
                />
                <>{paramControls}</>
            </Stack>
        </form>
    );
}
