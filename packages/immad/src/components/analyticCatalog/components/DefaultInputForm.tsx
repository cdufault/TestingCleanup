import React, { ChangeEvent, useContext, useEffect, useRef, useState } from 'react';

//component imports
import PortalItem from '@arcgis/core/portal/PortalItem';
import {
    GPBoolean,
    GPChoiceList,
    GPDataSelect,
    GPDate,
    GPJsonInput,
    GPLinearUnit,
    GPMultiValue,
    GPNumber,
    GPString,
    SelectMapLayer,
} from './GPFormItems';
import { WidgetContent, WidgetContainer, WidgetActions, ActionButton, FieldGroup } from '../../common';
import { useSnackbar } from 'notistack';
import { Box, Typography, Divider, TextField, FormControlLabel, Checkbox } from '@mui/material';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import * as geoprocessor from '@arcgis/core/rest/geoprocessor';

//helper imports
import { LogHelper } from '../../../helpers/logHelper';
import {
    createPortalItemFromDataURLAsync,
    getPortalItemById,
    getPortalItemIdFromUrl,
    publishItemAsync,
} from '../../../helpers/portalItemsHelper';

//resource imports
import { InputFormItemType, InputFormValueType, TaskResources } from '../resources';

//context imports
import { SubmittedJobsContext, SubmittedJobType } from '../../../contexts/SubmittedJobs';
import { MapContext } from '../../../contexts/Map';
import { ZoomToContext } from '../../../contexts/ZoomToLayerContext';

import { getServiceTasks, getTaskParameters, isServiceNameAvailable } from '../../../helpers/geoprocessingHelper';
import { Autocomplete } from '@mui/lab';
import SceneLayer from '@arcgis/core/layers/SceneLayer';
import { IItemAdd } from '@esri/arcgis-rest-portal';
import { ConfigHelper } from '../../../helpers/configHelper';

import { convertFeatureLayerToFeatureCollectionLayer } from '../../../helpers/layerHelper';
import Layer from '@arcgis/core/layers/Layer';
import { addArcGisService } from '../../../helpers/AddLayerByUrlHelper';

import { ApplicationStateHelper } from '../../../helpers/ApplicationStateHelper';
import { FeatureSelectionContext } from '../../../contexts/FeatureSelectionContext';
import JobInfoWaitForJobCompletionOptions = __esri.JobInfoWaitForJobCompletionOptions;
import FeatureLayerProperties = __esri.FeatureLayerProperties;
import FeatureSet = __esri.FeatureSet;
import MapView from '@arcgis/core/views/MapView';
import Extent from '@arcgis/core/geometry/Extent';
import SceneView from '@arcgis/core/views/SceneView';
import MapImageLayer from '@arcgis/core/layers/MapImageLayer';
interface DefaultInputFormProps {
    item: PortalItem | undefined;
    setTab: React.Dispatch<React.SetStateAction<number>>;
}

interface OutputFieldType {
    name: string;
    type: string;
}

function DefaultInputForm(props: DefaultInputFormProps): JSX.Element {
    const { item, setTab } = props;
    const appConfig = ConfigHelper.getAppConfig();
    const [itemResources, setItemResources] = useState<TaskResources[]>([]);
    const [inputFormItems, setInputFormItems] = useState<InputFormItemType[]>();
    const [inputFormValues, setInputFormValues] = useState<InputFormValueType[]>([]);
    const [showLoadingErrorMessage, setShowLoadingErrorMessage] = useState<boolean>(false);
    const [taskList, setTaskList] = useState<string[]>([]);
    const [selectedTaskName, setSelectedTaskName] = useState<string>();
    const [outputFields, setOutputFields] = useState<OutputFieldType[]>([]);
    const [extentIsChecked, setExtentIsChecked] = useState<boolean>(false);
    const [selectionIsChecked, setSelectionIsChecked] = useState<boolean>(true);
    const [isExecuteDisabled, setIsExecuteDisabled] = useState(false);
    const [hiddenParameters, setHiddenParameters] = useState<string[]>();

    const { submittedJobs, setSubmittedJobs, lastUsedFeatureClassNames, setLastUsedFeatureClassNames } =
        useContext(SubmittedJobsContext);
    const { activeView, getMapView, getSceneView } = useContext(MapContext);
    const { addLayerToMapWithZoomAction } = useContext(ZoomToContext);
    const featureSelectionContext = useContext(FeatureSelectionContext);

    const { enqueueSnackbar } = useSnackbar();

    const currentView = useRef<__esri.View>();
    const localLastUsedFeatureClassNames = useRef(lastUsedFeatureClassNames ?? []);

    useEffect(() => {
        if (activeView === 'MAP') {
            currentView.current = getMapView();
        } else {
            currentView.current = getSceneView();
        }

        if (item) {
            getServiceTasks(item).then((taskNames: string[] | undefined) => {
                if (taskNames && taskNames.length == 1) {
                    setSelectedTaskName(taskNames[0]);
                } else if (taskNames && taskNames.length > 1) {
                    setTaskList(taskNames);
                } else {
                    enqueueSnackbar('No tasks found for the selected service.', {
                        variant: 'error',
                    });
                    setTab(0);
                }
            });
            setHiddenParameters(getHiddenParameters());
        }
    }, [activeView]);

    useEffect(() => {
        if (!selectedTaskName) return;
        const infoUrl = `${item && item.url}/${selectedTaskName}`;
        getTaskParameters(infoUrl).then((allParams: InputFormItemType[] | undefined) => {
            if (allParams) {
                //token fields are not shown as parameters
                //output/calculated fields are not shown as parameters
                //there is a special case for 'esri_out_feature_service_name' which is always shown/required EXCEPT for the visibility threat dome
                const filteredParams = allParams.filter((p) => {
                    return (
                        (p.name.toUpperCase() !== 'RATOKEN' &&
                            p.name.toUpperCase() !== 'TOKEN' &&
                            p.direction != 'esriGPParameterDirectionOutput' &&
                            p.name != 'esri_out_feature_service_name') ||
                        (p.name === 'esri_out_feature_service_name' &&
                            item?.title.toUpperCase() !== 'VISIBILITYTHREATDOME') //TODO we need a better way to identify the incoming tool
                    );
                });
                setInputFormItems(filteredParams);

                //locate output parameter name
                //this will be the name of the field used to get the data
                const derivedOutputParams = allParams.filter((p) => {
                    return p.direction === 'esriGPParameterDirectionOutput';
                });

                derivedOutputParams.forEach((param) => {
                    const { name, defaultValue, dataType } = param;
                    const outputType =
                        defaultValue && defaultValue.geometryType ? (defaultValue.geometryType as string) : dataType;
                    setOutputFields((outputFields) => [...outputFields, { name: name, type: outputType }]);
                });
            } else {
                setShowLoadingErrorMessage(true);
                enqueueSnackbar('No parameters found for the selected task.', {
                    variant: 'error',
                });
                setTab(0);
            }
        });

        //get task resources from properties json
        if (item && item.sourceJSON) {
            const portalItemObject = item.sourceJSON;
            if (portalItemObject && portalItemObject.properties && portalItemObject.properties.immadProperties) {
                const resources = portalItemObject.properties.immadProperties as TaskResources[];
                if (resources) {
                    const filteredResources = resources.filter((resource: TaskResources) => {
                        return resource.task === selectedTaskName;
                    });
                    filteredResources && setItemResources(filteredResources);
                }
            }
        }
    }, [selectedTaskName]);

    const getHiddenParameters = () => {
        const hiddenParams: string[] = [];
        if (item && item.sourceJSON.properties && item.sourceJSON.properties.immadProperties) {
            const immadParams = item.sourceJSON.properties.immadProperties[0].parameters;
            immadParams.forEach((param: any) => {
                if (param.hidden) {
                    hiddenParams.push(param.name);
                }
            });
        }
        return hiddenParams;
    };

    const getInputItem = (param: InputFormItemType): JSX.Element | undefined => {
        param.resources = [];
        param.baseUrl = item?.itemUrl;
        itemResources.forEach((itemResource) => {
            if (itemResource.parameters) {
                const thisParamProperties = itemResource.parameters.filter((resourceParam) => {
                    return resourceParam.name === param.name;
                });
                //handles case for multiple images per parameter
                param.resources = param.resources?.concat(thisParamProperties);
                param.dataTable = thisParamProperties[0]?.dataTable ?? undefined;
            }
        });

        const isHidden = hiddenParameters?.includes(param.name);

        //handle data type override
        if (param.resources) {
            const customProps = param.resources.find((resource) => {
                return resource.name === param.name;
            });
            if (customProps && customProps.dataTypeOverride) {
                param.dataType = customProps.dataTypeOverride;
            }
        }

        //derived parameters are not currently being shown in the ui so this should never be true
        if (param.parameterType === 'esriGPParameterTypeDerived') {
            return (
                <GPJsonInput
                    key={param.name}
                    param={param}
                    inputFormValues={inputFormValues}
                    setInputFormValues={setInputFormValues}
                />
            );
        } else {
            //data table currently only supports simple parameter types
            if (
                param.dataTable &&
                (param.dataType === 'GPString' || param.dataType === 'GPDouble' || param.dataType === 'GPLong')
            ) {
                return (
                    <GPDataSelect
                        key={param.name}
                        param={param}
                        inputFormValues={inputFormValues}
                        setInputFormValues={setInputFormValues}
                        hidden={isHidden}
                    />
                );
            } else {
                switch (param.dataType) {
                    //multi value currently only supports GPString otherwise will fall through to generic json input
                    case 'GPMultiValue:GPString':
                        return (
                            <GPMultiValue
                                key={param.name}
                                param={param}
                                inputFormValues={inputFormValues}
                                setInputFormValues={setInputFormValues}
                                hidden={isHidden}
                            />
                        );
                    case 'GPString':
                        if (param.choiceList) {
                            return (
                                <GPChoiceList
                                    key={param.name}
                                    param={param}
                                    inputFormValues={inputFormValues}
                                    setInputFormValues={setInputFormValues}
                                    hidden={isHidden}
                                />
                            );
                        } else {
                            return (
                                <GPString
                                    key={param.name}
                                    param={param}
                                    inputFormValues={inputFormValues}
                                    setInputFormValues={setInputFormValues}
                                    hidden={isHidden}
                                />
                            );
                        }
                    case 'GPBoolean':
                        return (
                            <GPBoolean
                                key={param.name}
                                param={param}
                                inputFormValues={inputFormValues}
                                setInputFormValues={setInputFormValues}
                                hidden={isHidden}
                            />
                        );
                    case 'GPLong':
                    case 'GPDouble':
                        return (
                            <GPNumber
                                key={param.name}
                                param={param}
                                inputFormValues={inputFormValues}
                                setInputFormValues={setInputFormValues}
                                hidden={isHidden}
                            />
                        );
                    case 'GPDate':
                        return (
                            <GPDate
                                key={param.name}
                                param={param}
                                inputFormValues={inputFormValues}
                                setInputFormValues={setInputFormValues}
                                hidden={isHidden}
                            />
                        );
                    case 'GPLinearUnit':
                        return (
                            <GPLinearUnit
                                key={param.name}
                                param={param}
                                inputFormValues={inputFormValues}
                                setInputFormValues={setInputFormValues}
                                hidden={isHidden}
                            />
                        );
                    case 'GPFeatureRecordSetLayer':
                        return (
                            <SelectMapLayer
                                key={param.name}
                                param={param}
                                layerType='feature'
                                inputFormValues={inputFormValues}
                                setInputFormValues={setInputFormValues}
                            />
                        );
                    case 'GPRasterDataLayer':
                        return (
                            <SelectMapLayer
                                key={param.name}
                                param={param}
                                layerType='imagery'
                                inputFormValues={inputFormValues}
                                setInputFormValues={setInputFormValues}
                            />
                        );
                    default:
                        return (
                            <GPJsonInput
                                key={param.name}
                                param={param}
                                inputFormValues={inputFormValues}
                                setInputFormValues={setInputFormValues}
                            />
                        );
                }
            }
        }
    };

    const paramsAreValid = async (): Promise<boolean> => {
        let isValid = false;

        if (inputFormItems) {
            for (const p of inputFormItems) {
                if (p.name === 'esri_out_feature_service_name' || p.name === 'immad_out_service_name') {
                    const outputNameItem = inputFormValues.find((v) => {
                        return v.name === 'esri_out_feature_service_name' || v.name === 'immad_out_service_name';
                    });
                    //this is the default auto-generated name for the output service
                    //TODO give the user the option to overwrite existing layers
                    //this ensures that a layer with the same name has not been created since the form was populated
                    if (outputNameItem) {
                        const outputNameItemValue = outputNameItem.value;
                        const isAvailable = await isServiceNameAvailable(
                            outputNameItemValue,
                            p.name === 'esri_out_feature_service_name' ? 'Feature Service' : 'Image Service'
                        );
                        if (!isAvailable) {
                            enqueueSnackbar('An output layer with that name already exists.', {
                                variant: 'error',
                            });
                            // FeatureClass from earlier run has been created no longer need to store the value in the
                            // useRef array.
                            if (localLastUsedFeatureClassNames.current.includes(outputNameItemValue)) {
                                const index = localLastUsedFeatureClassNames.current.indexOf(outputNameItemValue);
                                if (index > -1) {
                                    localLastUsedFeatureClassNames.current.splice(index, 1);
                                    setLastUsedFeatureClassNames(localLastUsedFeatureClassNames.current);
                                }
                            }
                            return false;
                        }
                        if (localLastUsedFeatureClassNames.current.includes(outputNameItemValue)) {
                            enqueueSnackbar('Invalid output name please update and try again.', {
                                variant: 'error',
                            });
                            return false;
                        } else {
                            localLastUsedFeatureClassNames.current.push(outputNameItemValue);
                            setLastUsedFeatureClassNames(localLastUsedFeatureClassNames.current);
                        }
                    }
                } else if (p.parameterType === 'esriGPParameterTypeRequired') {
                    const val = inputFormValues.find((v) => {
                        return v.name === p.name && v.value && v.value != 'none';
                    });
                    if (!val) {
                        enqueueSnackbar(`Please enter a value for the required field: ${p.displayName}`, {
                            variant: 'error',
                        });
                    } else {
                        isValid = true;
                    }
                }
            }
        }
        return isValid;
    };

    const updateSubmittedJobsList = (jobInfo: __esri.JobInfo, title: string): void => {
        let tempJobs: SubmittedJobType[] = [];
        if (submittedJobs) {
            tempJobs = [...submittedJobs];
            tempJobs.unshift({
                jobId: jobInfo.jobId,
                jobUrl: jobInfo.sourceUrl,
                jobTitle: title,
                jobTimestamp: new Date().toLocaleString(),
            });
        } else {
            tempJobs.push({
                jobId: jobInfo.jobId,
                jobUrl: jobInfo.sourceUrl,
                jobTitle: title,
                jobTimestamp: new Date().toLocaleString(),
            });
        }
        //update the submitted jobs in the context
        setSubmittedJobs(tempJobs);
    };

    const submitJob = async () => {
        // disable execute
        setIsExecuteDisabled(true);
        if (!item) {
            LogHelper.log('Invalid input, portal item not found.', true);
            return;
        }

        const gpServerUrl = new URL(`${item.url}/${selectedTaskName}`);

        //formatted object type used to create a JSON string with named indexes
        interface IDictionary {
            [index: string]: any;
        }
        const input = {} as IDictionary;
        inputFormValues.forEach((inputVal) => {
            if (item.title.includes('VisibilityThreatDome') && inputVal.value.includes('ImageServer')) {
                try {
                    const inputUrl = JSON.parse(inputVal.value);
                    appConfig.urlRemapRules.forEach((remapRule) => {
                        if (inputUrl.url.includes(remapRule.url)) {
                            inputUrl.url = inputUrl.url.replace(remapRule.url, remapRule.remapUrl);
                            return;
                        }
                    });
                    input[inputVal.name] = JSON.stringify(inputUrl);
                } catch (error: any) {
                    LogHelper.log('Error Parsing Input Variable for Visibility Threat Dome.', true);
                    LogHelper.log(error, true);
                }
            } else {
                input[inputVal.name] = inputVal.value;
            }
        });

        //limit processing to current extent
        let currentExtent: Extent | null = null;
        if (extentIsChecked && currentView.current) {
            const theView =
                activeView === 'MAP' ? (currentView.current as MapView) : (currentView.current as SceneView);
            currentExtent = theView.extent;
        }

        //replace feature layer id with feature collection
        const featureLayerInputs = inputFormItems?.filter((item) => {
            return item.dataType === 'GPFeatureRecordSetLayer';
        });
        if (featureLayerInputs) {
            for (const featureLayerInput of featureLayerInputs) {
                const inputFormValue = inputFormValues.find((formValue) => {
                    return formValue.name === featureLayerInput.name;
                });
                if (inputFormValue && currentView.current) {
                    //the input value is currently a json string, turn it back to an object
                    if (!ApplicationStateHelper.isJSON(inputFormValue.value)) {
                        if (inputFormValue.value.includes('undefined')) {
                            inputFormValue.value = inputFormValue.value.replace('undefined', 'null');
                        } else {
                            enqueueSnackbar(
                                'Invalid JSON and it is not an undefined error. Check error message for more info.',
                                { variant: 'error' }
                            );
                            return;
                        }
                    }
                    const valueObject = JSON.parse(inputFormValue.value);

                    let selectedLayer: Layer | undefined = undefined;
                    if (valueObject.parentId) {
                        //get sub layer parent from map
                        const parentLayer = currentView.current.map.allLayers.find((layer) => {
                            return layer.id === valueObject.parentId;
                        }) as MapImageLayer;
                        if (parentLayer) {
                            //get sub layer from parent
                            const subLayer = parentLayer.findSublayerById(valueObject.layerId);
                            //convert to queryable layer
                            selectedLayer = await subLayer.createFeatureLayer();
                        }
                    } else {
                        //get feature layer or group layer
                        selectedLayer = currentView.current.map.allLayers.find((layer) => {
                            return layer.id === valueObject.itemid;
                        });
                    }

                    if (selectedLayer) {
                        let featureCollection;
                        if (
                            selectionIsChecked &&
                            featureSelectionContext.selectionLayer &&
                            selectedLayer === featureSelectionContext.selectionLayer
                        ) {
                            featureCollection = await convertFeatureLayerToFeatureCollectionLayer(
                                selectedLayer as FeatureLayer,
                                featureSelectionContext.featureSelection,
                                featureSelectionContext.selectionLayer,
                                currentExtent,
                                true
                            );
                        } else {
                            featureCollection = await convertFeatureLayerToFeatureCollectionLayer(
                                selectedLayer as FeatureLayer,
                                [],
                                undefined,
                                currentExtent,
                                true
                            );
                        }

                        input[inputFormValue.name] = featureCollection;
                    } else {
                        enqueueSnackbar('Selected layer not found.', { variant: 'error' });
                    }
                }
            }
        }
        const gpServerURL = gpServerUrl.toString();
        try {
            // @ts-ignore GPOptions does not have all properties typed as optional as they should be
            const jobInfo = await geoprocessor.submitJob(gpServerURL, input, {
                processExtent: currentExtent as Extent,
                returnZ: true,
            });

            updateSubmittedJobsList(jobInfo, item.title);
            setIsExecuteDisabled(false);

            //display the results tab
            setTab(1);

            //this pings the server every interval/1000 seconds to check for completion
            //the submitted jobs list does this as well to display the status
            //TODO find a way to only check the status from one place or the other
            const jobInfoCompleted = await jobInfo.waitForJobCompletion({
                interval: 10000,
            } as JobInfoWaitForJobCompletionOptions);

            //output field name has to exist to retrieve results
            if (outputFields) {
                let parentItemId = '';
                for (const field of outputFields) {
                    if (field.type === 'esriGeometryMultiPatch') {
                        //multipatch is not supported by gp.getResultData so get it directly using the rest api
                        //     const results = await getJobResults(jobInfo.sourceUrl, jobInfo.jobId, field.name);
                        //     const newLayer = new FeatureLayer({
                        //         title: field.name + '_' + Date.now(),
                        //         source: results.value.features,
                        //         geometryType: 'multipatch',
                        //         //fields: results.value.fields,
                        //         objectIdField: 'OBJECTID',
                        //         spatialReference: results.value.spatialReference,
                        //     });
                        //     if (newLayer) {
                        //         currentView.current && currentView.current.map.add(newLayer);
                        //     }
                    } else {
                        // check name

                        try {
                            const gpResult = await jobInfoCompleted.fetchResultData(field.name);
                            let gpResultUrl = undefined;
                            if (gpResult?.value?.url) {
                                gpResultUrl = gpResult?.value?.url;
                            }
                            // NOTE: URL may be present for feature-record-set-layer types if esri_out_feature_service_name is set.
                            if (!gpResultUrl && gpResult?.dataType === 'feature-record-set-layer') {
                                const featureSet = gpResult.value as FeatureSet;
                                if (featureSet && featureSet.features.length > 0) {
                                    const featureLayer = new FeatureLayer({
                                        title: selectedTaskName + ' Layer',
                                        fields: featureSet.fields,
                                        geometryType: featureSet.geometryType,
                                        spatialReference: featureSet.spatialReference,
                                        source: featureSet.features,
                                    } as FeatureLayerProperties);
                                    if (currentView.current && currentView.current.map) {
                                        addLayerToMapWithZoomAction(currentView.current, featureLayer);
                                    }
                                }
                            } else if (gpResultUrl && gpResultUrl.toLowerCase().endsWith('.slpk')) {
                                // The GP Result file is a URL-based scene package, so we will publish it as a layer
                                // if the web tool contains a special layerName value with an output name.

                                const outputSceneLayerNameItem = inputFormValues.find((inputFormValue) => {
                                    return (
                                        inputFormValue.name === 'immad_out_scene_service_name' ||
                                        inputFormValue.name === 'outputName' // TODO: remove this entry, it is for temporary compatibility only
                                    );
                                });

                                const layerName = outputSceneLayerNameItem?.value;

                                if (layerName) {
                                    await publishSceneLayerPackageResults(gpResultUrl, layerName);
                                } else {
                                    const message =
                                        'The web tool is not configured properly for publishing scene layers.';
                                    LogHelper.log(message, true);
                                    enqueueSnackbar(message, { variant: 'error' });
                                }
                            } else if (field.type !== 'GPDataFile') {
                                // Handle results from services that do not return a slpk, ignore data files
                                if (gpResultUrl) {
                                    const itemId = await getPortalItemIdFromUrl(gpResultUrl);
                                    if (itemId) {
                                        //if the portal item id has already been added then this is a sublayer and can be skipped
                                        if (itemId === parentItemId) {
                                            continue;
                                        } else {
                                            parentItemId = itemId;
                                        }
                                        const portalItem = await getPortalItemById(itemId);
                                        if (portalItem) {
                                            const newLayer = await Layer.fromPortalItem({ portalItem: portalItem });
                                            if (newLayer) {
                                                if (currentView.current && currentView.current.map) {
                                                    addLayerToMapWithZoomAction(currentView.current, newLayer);
                                                }
                                            } else {
                                                enqueueSnackbar('Error getting layer from portal.', {
                                                    variant: 'error',
                                                });
                                            }
                                        } else {
                                            enqueueSnackbar('Error getting portal item by id.', {
                                                variant: 'error',
                                            });
                                        }
                                    } else {
                                        // added this in so addArcGisService will work
                                        // it doesn't like the useRef
                                        // probably need to revisit later
                                        let currentView;
                                        if (activeView === 'MAP') {
                                            currentView = getMapView();
                                        } else {
                                            currentView = getSceneView();
                                        }

                                        if (currentView && currentView.map) {
                                            addArcGisService({
                                                urlDialogValue: gpResultUrl,
                                                currentView,
                                                addLayerToMapWithZoomAction,
                                                enqueueSnackbar,
                                            });
                                        }
                                    }
                                }
                            }
                        } catch (e) {
                            const message = `Error: ${e.message}`;
                            LogHelper.log(message, true);
                            enqueueSnackbar(message, { variant: 'error' });
                        }
                    }
                }
            } else {
                // No output fields
                LogHelper.log('GP Service Error: output field(s) not defined.', true);
                enqueueSnackbar('GP Service Error: output field(s) not defined.', {
                    variant: 'error',
                });
            }
        } catch (e) {
            LogHelper.log('An error occurred in submitting the job.', true);
            enqueueSnackbar(
                'An error occurred in submitting the job. Try putting a filter, selection or limit by extent, since your input(s) are to large.',
                { variant: 'error' }
            );
            LogHelper.log(e, true);
        } finally {
            setIsExecuteDisabled(false);
        }
    };

    const publishSceneLayerPackageResults = async (url: string, title: string): Promise<void> => {
        try {
            let dataUrl = '';
            appConfig.urlRemapRules.forEach((remapRule) => {
                if (url.includes(remapRule.url)) {
                    dataUrl = url.replace(remapRule.url, remapRule.remapUrl);
                }
            });

            //add item to portal
            const requestParams = {
                title: title,
                type: 'Scene Package',
                tags: ['3D'],
                typeKeywords: ['3D', 'ArcGIS Pro', 'ArcGIS Server', 'Scene', 'Scene Package', 'slpk'],
            } as IItemAdd;

            enqueueSnackbar(`Publishing Scene Layer service '${title}' ...`, {
                variant: 'info',
            });

            const itemResponse = await createPortalItemFromDataURLAsync(requestParams, dataUrl);

            const service = await publishItemAsync(itemResponse.id, 'scenePackage', 'sceneService', title);

            const sceneLayer = new SceneLayer({
                url: service.serviceurl,
            });
            if (currentView.current && currentView.current.map) {
                addLayerToMapWithZoomAction(currentView.current, sceneLayer);
            }
        } catch (e) {
            LogHelper.log('Error: ' + e.message, true);
            enqueueSnackbar('Error: ' + e.message, {
                variant: 'error',
            });
        }
    };

    const selectedTaskChange = (evt: ChangeEvent, value: { title: string }) => {
        if (value && value.title) {
            setSelectedTaskName(value.title);
        } else {
            setSelectedTaskName(undefined);
        }
    };

    return (
        <WidgetContainer>
            <WidgetContent>
                <Box hidden={!showLoadingErrorMessage}>
                    <h2>Error loading parameters, this tool is not supported</h2>
                </Box>
                {taskList && taskList.length > 1 ? (
                    <FieldGroup>
                        <Autocomplete
                            options={taskList.map((name) => {
                                return { title: name };
                            })}
                            getOptionLabel={(option: { title: string }) => (option ? option.title : '')}
                            renderInput={(params) => (
                                <TextField {...params} variant='outlined' label='Select the desired task or Search' />
                            )}
                            onChange={selectedTaskChange}
                            value={{ title: selectedTaskName }}
                        />
                        <Divider />
                    </FieldGroup>
                ) : undefined}
                {selectedTaskName && inputFormItems && (
                    <FieldGroup>
                        <Typography variant='h5' component='p' align='center'>
                            {selectedTaskName}
                        </Typography>
                        <Divider />
                        {inputFormItems.map((param: InputFormItemType) => {
                            return getInputItem(param);
                        })}
                    </FieldGroup>
                )}
            </WidgetContent>
            {selectedTaskName && inputFormItems && (
                <WidgetActions>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={selectionIsChecked}
                                title={'Limit inputs by current selections'}
                                onChange={(evt) => {
                                    setSelectionIsChecked(evt.target.checked);
                                }}
                            />
                        }
                        label={'Limit inputs by current selections'}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={extentIsChecked}
                                title={'Limit inputs by current visible extent'}
                                onChange={(evt) => {
                                    setExtentIsChecked(evt.target.checked);
                                }}
                            />
                        }
                        label={'Limit inputs by current visible extent'}
                    />
                    <ActionButton
                        disabled={isExecuteDisabled}
                        variant='contained'
                        color='secondary'
                        type='button'
                        title='Submit Job'
                        onClick={async () => {
                            if (await paramsAreValid()) {
                                await submitJob();
                            }
                        }}
                    >
                        Execute
                    </ActionButton>
                </WidgetActions>
            )}
        </WidgetContainer>
    );
}

export default DefaultInputForm;
