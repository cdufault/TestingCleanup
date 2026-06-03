import React, { useState, useEffect, useRef, useContext, ChangeEvent } from 'react';

//component imports
import { InputField, FieldGroup, InputLabel, InlineSelect, ActionButton } from '../../common';
import {
    FormControlLabel,
    Checkbox,
    MenuItem,
    TextField,
    Select,
    ListItemIcon,
    ListItemText,
    FormHelperText,
    Typography,
} from '@mui/material';
import MapView from '@arcgis/core/views/MapView';
import SceneView from '@arcgis/core/views/SceneView';
import InfoPopover from './InfoPopover';
import SketchInput from '../../widgets/sketchInput/sketchInput';

import { InputAdornment } from '@mui/material';

//styled component imports
import {
    StyledAutocomplete,
    StyledEndJustifiedBox,
    StyledInputField,
    FlexContainer,
    useStyles,
    StyledDatePicker,
    StyledInlineSelect,
} from '../styles';

//context imports
import { MapContext } from '../../../contexts/Map';
import { SubmittedJobsContext } from '../../../contexts/SubmittedJobs';

//resource imports
import { GPUserInputParams, MenuProp, TaskParameterDataSource } from '../resources';
import CheckIcon from 'calcite-ui-icons-react/CheckIcon';
import XIcon from 'calcite-ui-icons-react/XIcon';
import RefreshIcon from 'calcite-ui-icons-react/RefreshIcon';

//helper imports
import { addOrUpdateParam, getDataFromTable } from '../helpers/AnalyticCatalogHelper';
import { Sanitizer } from '@esri/arcgis-html-sanitizer';
import LayerSelect from '../../common/layerSelect';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import Layer from '@arcgis/core/layers/Layer';
import ImageryLayer from '@arcgis/core/layers/ImageryLayer';
import GeoJSONLayer = __esri.GeoJSONLayer;
import CSVLayer = __esri.CSVLayer;
import GeoRSSLayer = __esri.GeoRSSLayer;
import { isServiceNameAvailable } from '../../../helpers/geoprocessingHelper';
import MapImageLayer from '@arcgis/core/layers/MapImageLayer';

type FeatureGPLayer = FeatureLayer | GeoJSONLayer | CSVLayer | GeoRSSLayer;

const supportedFeatureTypes: string[] = ['feature', 'wfs', 'geojson', 'csv', 'georss'];

const GPTextItemHandler = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, props: GPUserInputParams) => {
    const val = event.target.value;
    addOrUpdateParam(val, props);
};

const GPCheckboxItemHandler = (event: ChangeEvent<HTMLInputElement>, props: GPUserInputParams) => {
    const val = event.target.checked;
    addOrUpdateParam(val.toString(), props);
};

const GPDateHandler = (dateTime: Date, props: GPUserInputParams) => {
    const val = dateTime.getTime().toString();
    addOrUpdateParam(val, props);
};

const GPLinearUnitHandler = (distance: string | undefined, units: string | undefined, props: GPUserInputParams) => {
    const val = distance && units ? `{"distance": ${distance}, "units": "${units}"}` : '';
    addOrUpdateParam(val, props);
};

const GPLayerSelectHandler = async (layer: Layer | undefined, props: GPUserInputParams) => {
    const lyr = layer?.type === 'imagery' ? (layer as ImageryLayer) : (layer as FeatureLayer);

    let val = '';
    if (lyr) {
        switch (props.param.dataType) {
            case 'GPFeatureRecordSetLayer':
                if (lyr.type === 'feature') {
                    //the sublayer_parent attribute is added to all sublayers in the LayerSelect component
                    const parentLayer = lyr?.sublayer_parent as MapImageLayer;
                    let parentId = '';
                    if (parentLayer) {
                        parentId = parentLayer.id;
                    }
                    val = lyr.id ? `{"itemid": "${lyr.id}", "layerId": ${lyr.layerId}, "parentId": "${parentId}"}` : '';
                } else {
                    val = lyr.id ? `{"itemid": "${lyr.id}"}` : '';
                }
                break;
            case 'GPRasterDataLayer':
                val = lyr.url ? `{"url": "${lyr.url}"}` : '';
                break;
        }
    }
    addOrUpdateParam(val, props);
};

const GPAutoSelectItemHandler = (
    value: any,
    props: GPUserInputParams,
    setUserMessage: React.Dispatch<React.SetStateAction<string | undefined>>
) => {
    //get additional ui param associated with select dropdown if it exists (ex. weaponRange)
    const formItem = props.param.dataTable?.valueParam
        ? (document.getElementById(props.param.dataTable.valueParam) as HTMLInputElement)
        : undefined;
    setUserMessage(undefined);
    if (value) {
        if (props.param.dataTable?.valueField && props.param.dataTable?.valueParam) {
            //store selected dropdown selection (ex. weaponSystem)
            addOrUpdateParam(value[props.param.dataTable?.displayField], props);

            if (value[props.param.dataTable?.valueField]) {
                //create a new parameter object with the name of the associated param (ex weaponRange)
                const valueParam = { ...props, param: { ...props.param, name: props.param.dataTable?.valueParam } };
                //store value for associated param
                addOrUpdateParam(value[props.param.dataTable?.valueField], valueParam);

                if (formItem) {
                    //hide associated param ui object as it is already set and user cannot change
                    formItem.hidden = true;
                    //display associated param value to user
                    setUserMessage(`${formItem.innerText} set to ${value[props.param.dataTable?.valueField]}`);
                }
            }
        } else if (props.param.dataTable?.valueField) {
            //store just selected dropdown selection if no associated param defined (ex. weaponSystem)
            addOrUpdateParam(value[props.param.dataTable?.valueField], props);
        }
    } else {
        if (formItem) {
            //show associated param so the user can set it manually
            formItem.hidden = false;
            addOrUpdateParam('', props);
        }
    }
};

export const GPChoiceList = (props: GPUserInputParams): JSX.Element => {
    const { param, hidden } = props;
    const [value, setValue] = useState<string>();

    const sanitizer: Sanitizer = new Sanitizer();

    useEffect(() => {
        if (value || value === '') {
            addOrUpdateParam(value, props);
        }
    }, [value]);

    return (
        <FieldGroup hidden={hidden} id={param.name}>
            <StyledEndJustifiedBox>
                <InputLabel>{param.displayName}</InputLabel>
                <InfoPopover description={param.description} baseUrl={param.baseUrl} resources={param.resources} />
            </StyledEndJustifiedBox>
            <StyledInlineSelect
                variant='outlined'
                color='secondary'
                title={param.description}
                fullWidth
                value={value ? value : ''}
                onChange={(evt) => {
                    setValue(evt.target.value as string);
                }}
                displayEmpty
            >
                <MenuItem key={'none'} value={''}>
                    Select Value
                </MenuItem>
                {(param.choiceList as string[]).map((choice) => {
                    return (
                        <MenuItem key={choice} value={choice}>
                            <div dangerouslySetInnerHTML={{ __html: sanitizer.sanitize(choice) }} />
                        </MenuItem>
                    );
                })}
            </StyledInlineSelect>
            <FormHelperText className={'MuiFormHelperText-root MuiFormHelperText-contained MuiFormHelperText-filled'}>
                {param.parameterType === 'esriGPParameterTypeRequired' ? 'Required' : ' '}
            </FormHelperText>
        </FieldGroup>
    );
};

export const GPString = (props: GPUserInputParams): JSX.Element => {
    const { param, hidden, inputFormValues } = props;
    const [value, setValue] = useState<string>('');
    const [isNameAvailable, setIsNameAvailable] = useState(false);
    const [spin, setSpin] = useState(false);
    const classes = useStyles();
    const { lastUsedFeatureClassNames, tabValue } = useContext(SubmittedJobsContext);

    useEffect(() => {
        // this use effect will auto-populate the output name
        // for the Threat Dome tool selected in analytic catalog.
        if (param.name === 'immad_out_scene_service_name' || param.name === 'immad_out_service_name') {
            // set a unique default output name
            setValue('OutputLayer_' + Date.now());
        }
    }, []);

    useEffect(() => {
        // tabValue will be either 0 for tools tab or 1 for
        // the results tab. this only needs to run when on tool tab.
        if (value && tabValue === 0) {
            addOrUpdateParam(value, props);

            if (
                param.name === 'immad_out_scene_service_name' ||
                param.name === 'immad_out_service_name' ||
                param.name === 'esri_out_feature_service_name'
            ) {
                value !== '' ? setSpin(true) : setSpin(false);

                checkName(value, props.layerType).finally(() => {
                    setSpin(false);
                });

                return;
            }
        }
    }, [value, tabValue]);

    useEffect(() => {
        //if the stored values are updated by anohter component, sync with ui
        if (inputFormValues) {
            const currentParamVal = inputFormValues.find((val) => val.name === param.name && val.value !== value);
            if (currentParamVal) {
                setValue(currentParamVal.value);
            }
        }
    }, [inputFormValues]);

    const checkName = async (name: string, layerType?: string) => {
        // blank names should be allowed if a feature service is not being created
        if (param.name === 'esri_out_feature_service_name' && name === '') {
            return true;
        }

        let isAvailable: boolean;

        if (param.name === 'immad_out_scene_service_name') {
            isAvailable = await isServiceNameAvailable(name, 'Scene Service');
        } else {
            isAvailable = await isServiceNameAvailable(
                name,
                layerType === 'feature' ? 'Feature Service' : 'Image Service'
            );
        }
        const localLastUsedFeatureClassNames = lastUsedFeatureClassNames ?? [];
        if (!isAvailable) {
            isAvailable = false;
        } else isAvailable = !(localLastUsedFeatureClassNames.includes(name) && isAvailable);
        setIsNameAvailable(isAvailable);
    };

    return (
        <FieldGroup hidden={hidden} id={param.name}>
            <StyledEndJustifiedBox>
                <InputLabel>{param.displayName}</InputLabel>
                <InfoPopover description={param.description} baseUrl={param.baseUrl} resources={param.resources} />
            </StyledEndJustifiedBox>
            <FlexContainer>
                <StyledInputField
                    variant='outlined'
                    fullWidth
                    size='small'
                    color='secondary'
                    placeholder={param.dataType}
                    InputProps={{
                        endAdornment: (param.name === 'immad_out_scene_service_name' ||
                            param.name === 'immad_out_service_name' ||
                            param.name === 'esri_out_feature_service_name') && (
                            <InputAdornment position={'end'}>
                                {spin ? (
                                    <RefreshIcon className={spin ? classes.spin : classes.refresh} />
                                ) : (
                                    <>
                                        {isNameAvailable && value !== '' ? (
                                            <div title='This service name is available'>
                                                <CheckIcon color='#4CBB17' />
                                            </div>
                                        ) : value === '' ? (
                                            <></>
                                        ) : (
                                            <div title='This service name is not available'>
                                                <XIcon color='#E53935' />
                                            </div>
                                        )}
                                    </>
                                )}
                            </InputAdornment>
                        ),
                    }}
                    helperText={param.parameterType === 'esriGPParameterTypeRequired' ? 'Required' : ''}
                    title={param.description}
                    onChange={(event) => {
                        setValue(event.target.value as string);
                    }}
                    value={value}
                />
            </FlexContainer>
        </FieldGroup>
    );
};

export const GPDataSelect = (props: GPUserInputParams): JSX.Element => {
    const { param, hidden } = props;
    const [dataTable, setDataTable] = useState<any[]>();
    const [userMessage, setUserMessage] = useState<string>();

    let isHidden = false;

    useEffect(() => {
        getData();
    }, []);

    const getData = async () => {
        const dataTableResults = await getDataFromTable(param.dataTable as TaskParameterDataSource);
        dataTableResults && setDataTable(dataTableResults);
    };

    if (hidden) {
        isHidden = true;
    }
    return (
        <FieldGroup hidden={isHidden}>
            <StyledEndJustifiedBox>
                <InputLabel>{param.displayName}</InputLabel>
                <InfoPopover description={param.description} baseUrl={param.baseUrl} resources={param.resources} />
            </StyledEndJustifiedBox>
            {param.dataTable && dataTable && (
                <StyledAutocomplete
                    options={dataTable}
                    getOptionLabel={(option: any) =>
                        param.dataTable?.displayField && option ? option[param.dataTable?.displayField as string] : ''
                    }
                    getOptionSelected={(option: any, value: any) => option.value === value.value}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            variant='outlined'
                            placeholder={'Type to search'}
                            inputProps={{ ...params.inputProps }}
                            helperText={
                                param.parameterType === 'esriGPParameterTypeRequired' ||
                                param.name === 'esri_out_feature_service_name'
                                    ? 'Required'
                                    : ''
                            }
                            title={param.description}
                        />
                    )}
                    onChange={(event, value) => {
                        GPAutoSelectItemHandler(value, props, setUserMessage);
                    }}
                />
            )}
            {userMessage && <Typography>{userMessage}</Typography>}
        </FieldGroup>
    );
};

export const GPBoolean = (props: GPUserInputParams): JSX.Element => {
    const { param, hidden } = props;
    const [value, setValue] = useState<boolean>();
    let isHidden = false;

    if (hidden) {
        isHidden = true;
    }
    return (
        <FieldGroup hidden={isHidden}>
            <StyledEndJustifiedBox>
                <FormControlLabel
                    control={
                        <Checkbox
                            onChange={(event) => {
                                setValue(event.target.checked);
                                GPCheckboxItemHandler(event, props);
                            }}
                            value={value ? 'checked' : ''}
                        />
                    }
                    label={param.displayName}
                />
                <InfoPopover description={param.description} baseUrl={param.baseUrl} resources={param.resources} />
            </StyledEndJustifiedBox>
        </FieldGroup>
    );
};

export const GPDate = (props: GPUserInputParams): JSX.Element => {
    const { param, hidden } = props;
    const [selectedDate, setSelectedDate] = useState<Date>();

    let isHidden = false;
    if (hidden) {
        isHidden = true;
    }
    return (
        <FieldGroup hidden={isHidden}>
            <StyledEndJustifiedBox>
                <InputLabel>{param.displayName}</InputLabel>
                <InfoPopover description={param.description} baseUrl={param.baseUrl} resources={param.resources} />
            </StyledEndJustifiedBox>
            <StyledDatePicker
                id={param.name}
                selected={selectedDate}
                onChange={(date) => {
                    if (date) {
                        setSelectedDate(date as Date);
                        GPDateHandler(date as Date, props);
                    }
                }}
                className={
                    'MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputMarginDense MuiOutlinedInput-inputMarginDense'
                }
                dateFormat={"yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"}
                showTimeSelect
                timeFormat={'HH:mm'}
                openToDate={new Date()}
                timeIntervals={15}
                placeholderText={'Select a Date/Time'}
                title={param.description}
            />
            <FormHelperText className={'MuiFormHelperText-root MuiFormHelperText-contained MuiFormHelperText-filled'}>
                {param.parameterType === 'esriGPParameterTypeRequired' ? 'Required' : ''}
            </FormHelperText>
        </FieldGroup>
    );
};

export const GPNumber = (props: GPUserInputParams): JSX.Element => {
    const { param, hidden, inputFormValues } = props;
    const [value, setValue] = useState<string>();

    useEffect(() => {
        //if the stored values are changed by another component, sync with ui
        if (inputFormValues) {
            const currentParamVal = inputFormValues.find((val) => val.name === param.name && val.value !== value);
            if (currentParamVal) {
                setValue(currentParamVal.value);
            }
        }
    }, [inputFormValues]);

    let isHidden = false;

    if (hidden) {
        isHidden = true;
    }

    return (
        <FieldGroup hidden={isHidden} id={param.name}>
            <StyledEndJustifiedBox>
                <InputLabel>{param.displayName}</InputLabel>
                <InfoPopover description={param.description} baseUrl={param.baseUrl} resources={param.resources} />
            </StyledEndJustifiedBox>
            <InputField
                variant='outlined'
                fullWidth
                size='small'
                color='secondary'
                type='number'
                placeholder={param.dataType}
                helperText={param.parameterType === 'esriGPParameterTypeRequired' ? 'Required' : ''}
                title={param.description}
                onChange={(event) => {
                    setValue(event.target.value);
                    GPTextItemHandler(event, props);
                }}
                value={value ? value : ''}
            />
        </FieldGroup>
    );
};

export const GPLinearUnit = (props: GPUserInputParams): JSX.Element => {
    const { param, hidden } = props;
    const [units, setUnits] = useState<string>();
    const [distance, setDistance] = useState<string>();

    let isHidden = false;

    if (hidden) {
        isHidden = true;
    }

    useEffect(() => {
        //set default units
        setUnits('meters');
    }, []);

    return (
        <FieldGroup hidden={isHidden}>
            <StyledEndJustifiedBox>
                <InputLabel>{param.displayName}</InputLabel>
                <InfoPopover description={param.description} baseUrl={param.baseUrl} resources={param.resources} />
            </StyledEndJustifiedBox>
            <InputField
                variant='outlined'
                size='small'
                color='secondary'
                type='number'
                placeholder={param.dataType}
                helperText={param.parameterType === 'esriGPParameterTypeRequired' ? 'Required' : ''}
                title={param.description}
                onChange={(event) => {
                    setDistance(event.target.value);
                    GPLinearUnitHandler(event.target.value, units, props);
                }}
                value={distance ? distance : ''}
            />
            <InlineSelect
                variant='outlined'
                color='secondary'
                onChange={(evt: ChangeEvent<{ name?: string; value: string }>) => {
                    setUnits(evt.target.value as string);
                    GPLinearUnitHandler(distance, evt.target.value, props);
                }}
                value={units ? units : 'meters'}
            >
                <MenuItem value='feet'>Feet</MenuItem>
                <MenuItem value='meters'>Meters</MenuItem>
                <MenuItem value='miles'>Miles</MenuItem>
                <MenuItem value='kilometers'>Kilometers</MenuItem>
            </InlineSelect>
        </FieldGroup>
    );
};

export const GPMultiValue = (props: GPUserInputParams): JSX.Element => {
    const { param, hidden } = props;
    const [value, setValue] = useState<string[]>([]);
    const isAllSelected = param.choiceList && param.choiceList.length && value.length === param.choiceList.length;
    const isHidden = !!hidden;

    useEffect(() => {
        if (value) {
            addOrUpdateParam(JSON.stringify(value), props);
        } else {
            addOrUpdateParam('', props);
        }
    }, [value]);

    const selectionChangeHandler = (event: any) => {
        const value = event.target.value;
        if (value[value.length - 1] === 'all') {
            setValue(value.length - 1 === param.choiceList?.length ? [] : (param.choiceList as string[]));
            return;
        }
        setValue(value);
    };

    return (
        <FieldGroup hidden={isHidden}>
            <StyledEndJustifiedBox>
                <InputLabel>{param.displayName}</InputLabel>
                <InfoPopover description={param.description} baseUrl={param.baseUrl} resources={param.resources} />
            </StyledEndJustifiedBox>

            {param.choiceList ? (
                <>
                    <Select
                        variant='outlined'
                        color='secondary'
                        title={param.description}
                        fullWidth
                        multiple
                        onChange={selectionChangeHandler}
                        renderValue={(value) => (value as string[]).join(',') as string}
                        value={value}
                        MenuProps={MenuProp}
                    >
                        <MenuItem key={'all'} value={'all'}>
                            <ListItemIcon>
                                <Checkbox
                                    checked={isAllSelected as boolean}
                                    indeterminate={
                                        param.choiceList && value.length > 0 && value.length < param.choiceList.length
                                    }
                                />
                            </ListItemIcon>
                            <ListItemText primary={'Select All'} />
                        </MenuItem>
                        {(param.choiceList as string[]).map((choice) => {
                            return (
                                <MenuItem key={choice} value={choice}>
                                    <ListItemIcon>
                                        <Checkbox checked={value.indexOf(choice) > -1} />
                                    </ListItemIcon>
                                    <ListItemText primary={choice} />
                                </MenuItem>
                            );
                        })}
                    </Select>
                    <FormHelperText
                        className={'MuiFormHelperText-root MuiFormHelperText-contained MuiFormHelperText-filled'}
                    >
                        {param.parameterType === 'esriGPParameterTypeRequired' ? 'Required' : ''}
                    </FormHelperText>
                </>
            ) : (
                <InputField
                    variant='outlined'
                    fullWidth
                    size='small'
                    color='secondary'
                    placeholder={param.dataType}
                    helperText={param.parameterType === 'esriGPParameterTypeRequired' ? 'Required' : ''}
                    title={param.description}
                    onChange={(event) => {
                        const array = event.target.value.split(',');
                        setValue(array);
                    }}
                    value={value ? [value] : []}
                />
            )}
        </FieldGroup>
    );
};

export const SelectMapLayer = (props: GPUserInputParams): JSX.Element => {
    const { param, layerType } = props;

    const [selectedInputLayer, setSelectedInputLayer] = useState<FeatureGPLayer | ImageryLayer | undefined>();

    const { map, activeView, getMapView, getSceneView } = useContext(MapContext);
    const viewRef = useRef<MapView | SceneView>();

    const [showSketchWidget, setShowSketchWidget] = useState<boolean>(false);
    const [showDrawButton, setShowDrawButton] = useState<boolean>(false);
    const [sketchFeatureLayerId] = useState<string>(param.name + '_SketchInputs');
    const [sketchWidgetIsActive, setSketchWidgetIsActive] = useState(false);

    useEffect(() => {
        if (activeView === 'MAP') {
            viewRef.current = getMapView();
        } else {
            viewRef.current = getSceneView();
        }
        if (layerType) {
            layerType === 'feature' ? setShowDrawButton(true) : setShowDrawButton(false);
        }
    }, [activeView]);

    const addPointsButtonClicked = () => {
        setShowSketchWidget(!showSketchWidget);
        setSketchWidgetIsActive(true);
    };

    const doneButtonCallback = () => {
        setShowSketchWidget(!showSketchWidget);
        const selectedLayer = viewRef.current?.map.findLayerById(sketchFeatureLayerId) as FeatureLayer;
        setSelectedInputLayer(selectedLayer);
        setSketchWidgetIsActive(false);
        GPLayerSelectHandler(selectedLayer, props);
    };

    const cancelButtonCallback = () => {
        setShowSketchWidget(!showSketchWidget);
        setSelectedInputLayer(undefined);
        setSketchWidgetIsActive(false);
    };

    return (
        <FieldGroup>
            <FieldGroup $bottomgutter hidden={showSketchWidget}>
                <StyledEndJustifiedBox>
                    <InputLabel>{param.displayName}</InputLabel>
                    <InfoPopover description={param.description} baseUrl={param.baseUrl} resources={param.resources} />
                </StyledEndJustifiedBox>
                <LayerSelect
                    map={map}
                    title={param.description}
                    required={true}
                    selectedLayer={selectedInputLayer}
                    onChange={(layer) => {
                        if (layer) {
                            setSelectedInputLayer(layer as FeatureGPLayer | ImageryLayer);
                            GPLayerSelectHandler(layer, props);
                        } else {
                            setSelectedInputLayer(undefined);
                            GPLayerSelectHandler(undefined, props);
                        }
                    }}
                    layerTypeFilter={(lyr): boolean => {
                        if (layerType === 'feature') {
                            // Support additional feature-like types if input supports feature
                            return supportedFeatureTypes.includes(lyr.type);
                        } else return lyr.type === layerType;
                    }}
                    includeSublayersAsFeatureLayers={true}
                />
                <FieldGroup hidden={!showDrawButton}>
                    <ActionButton
                        variant='contained'
                        color='secondary'
                        type='button'
                        title='Draw points'
                        onClick={addPointsButtonClicked}
                    >
                        Draw Points
                    </ActionButton>
                </FieldGroup>
            </FieldGroup>
            <FieldGroup $bottomgutter hidden={!showSketchWidget}>
                <SketchInput
                    featureLayerId={sketchFeatureLayerId}
                    graphicType={'point'}
                    hasZ={false}
                    sketchWidgetIsActive={sketchWidgetIsActive}
                    onDoneButtonCallback={doneButtonCallback}
                    onCancelButtonCallback={cancelButtonCallback}
                />
            </FieldGroup>
        </FieldGroup>
    );
};

export const GPJsonInput = (props: GPUserInputParams): JSX.Element => {
    const { param } = props;
    return (
        <FieldGroup>
            <StyledEndJustifiedBox>
                <InputLabel>{param.displayName}</InputLabel>
                <InfoPopover description={param.description} baseUrl={param.baseUrl} resources={param.resources} />
            </StyledEndJustifiedBox>
            <InputField
                variant='outlined'
                fullWidth
                size='small'
                color='secondary'
                placeholder={param.dataType}
                multiline={true}
                rows={4}
                helperText={param.parameterType === 'esriGPParameterTypeRequired' ? 'Required' : ''}
                title={param.description}
                onChange={(event) => {
                    GPTextItemHandler(event, props);
                }}
            />
        </FieldGroup>
    );
};
