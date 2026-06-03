import React, { ChangeEvent, useContext, useEffect, useRef, useState } from 'react';

//context imports
import { MapContext } from '../../../contexts/Map';
import { useFeatureSelectionContext } from '../../../contexts/FeatureSelectionContext';

//material ui imports
import { Box, Checkbox, FormControlLabel, MenuItem, Radio, RadioGroup, Select } from '@mui/material';

//arcgis imports
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import Layer from '@arcgis/core/layers/Layer';
import Field from '@arcgis/core/layers/support/Field';
import View = __esri.View;

//shared component imports
import LayerSelect from '../../common/layerSelect';
import {
    ActionButton,
    FieldGroup,
    InputGroup,
    WidgetActions,
    WidgetContainer,
    WidgetContent,
    WidgetHeader,
} from '../../common';

//helper imports
import { helperCreateEllipseLayer, helperDrawFeatures, SelectionType } from './helpers/ellipseHelpers';

//custom styles/types imports
import { EllipseInfo, FieldNameSelectProps } from './resources';
import { StyledInputLabel } from './styles';
import { ZoomToContext } from '../../../contexts/ZoomToLayerContext';

const LayerEllipse = (): JSX.Element => {
    const { map, activeView, getMapView, getSceneView } = useContext(MapContext);
    const featureSelectionContext = useFeatureSelectionContext();
    const { turnOnPairingPointsAndEllipses } = featureSelectionContext;
    const [selectedInputLayer, setSelectedInputLayer] = useState<FeatureLayer | undefined>();
    const [ellipseLayer, setEllipseLayer] = useState<FeatureLayer | undefined>();
    const [drawEllipses, setDrawEllipses] = useState<boolean>(true);
    const [semiMajorAxisField, setSemiMajorAxisField] = useState<string>('');
    const [semiMajorAxisUnit, setSemiMajorAxisUnit] = useState<string>('nauticalmiles');
    const [semiMinorAxisField, setSemiMinorAxisField] = useState<string>('');
    const [semiMinorAxisUnit, setSemiMinorAxisUnit] = useState<string>('nauticalmiles');
    const [azimuthField, setAzimuthField] = useState<string>('');
    const [ellipseInfo, setEllipseInfo] = useState<EllipseInfo>();
    const [fieldNames, setFieldNames] = useState<string[]>([]);
    const [view, setView] = useState<View | undefined>();
    const [radioValue, setRadioValue] = useState<SelectionType>('all');

    const { addLayerToMapWithZoomAction } = useContext(ZoomToContext);

    const destroyHandleRef = useRef<IHandle>();

    useEffect(() => {
        switch (activeView) {
            case 'MAP':
                setView(getMapView());
                break;
            case 'SCENE':
                setView(getSceneView());
                break;
            default:
                setView(undefined);
                break;
        }
        return () => {
            destroyHandleRef.current && destroyHandleRef.current.remove();
        };
    }, [activeView]);

    useEffect(() => {
        if (fieldNames) {
            fieldNames.forEach((fieldName) => {
                const fieldNameLower = fieldName.toLowerCase();
                if (fieldNameLower.includes('semimajor') || fieldNameLower.includes('semi_major')) {
                    setSemiMajorAxisField(fieldName);
                } else if (fieldNameLower.includes('semiminor') || fieldNameLower.includes('semi_minor')) {
                    setSemiMinorAxisField(fieldName);
                } else if (fieldNameLower.includes('azimuth')) {
                    setAzimuthField(fieldName);
                }
            });
        }
    }, [fieldNames]);

    useEffect(() => {
        //collect fields for dropdowns
        //only return fields containing numbers
        const numberFields = selectedInputLayer?.fields.filter((field) => {
            return ['small-integer', 'integer', 'single', 'double', 'long'].includes(field.type);
        });
        const fieldNames: string[] = [];
        numberFields?.forEach((fld: Field) => {
            fieldNames.push(fld.name);
        });
        setFieldNames(fieldNames);
    }, [selectedInputLayer]);

    useEffect(() => {
        if (drawEllipses && ellipseLayer) {
            turnOnPairingPointsAndEllipses(true);
        } else {
            turnOnPairingPointsAndEllipses(false);
        }
    }, [drawEllipses, ellipseLayer]);

    useEffect(() => {
        const { featureSelection } = featureSelectionContext;
        if (ellipseLayer && selectedInputLayer) {
            //if draw checkbox is checked, draw features on layer
            drawEllipses &&
                helperDrawFeatures(
                    semiMajorAxisField,
                    semiMinorAxisField,
                    azimuthField,
                    selectedInputLayer,
                    radioValue,
                    semiMajorAxisUnit,
                    semiMinorAxisUnit,
                    view,
                    ellipseLayer,
                    featureSelection
                );

            //update stored ellipse info
            setEllipseInfo({
                enabled: true,
                semiMajorField: semiMajorAxisField,
                semiMinorField: semiMinorAxisField,
                azimuthField: azimuthField,
                mode: radioValue,
                ellipseLayerId: ellipseLayer.id,
                pointLayerId: selectedInputLayer.id,
            });
        }
    }, [ellipseLayer]);

    useEffect(() => {
        //add ellipse info to point and ellipse layers - this does not persist between sessions (ie not stored in portal)
        selectedInputLayer?.set('ellipseInfo', JSON.stringify(ellipseInfo));
        ellipseLayer?.set('ellipseInfo', JSON.stringify(ellipseInfo));
    }, [ellipseInfo]);

    useEffect(() => {
        //unbind point layer and ellipse when widget closes
        return () => {
            turnOnPairingPointsAndEllipses(false);
        };
    }, []);

    //filter used by layer select
    const isLayerValid = (layer: Layer) => {
        let isValid = false;
        if (layer.type === 'feature') {
            const fLayer = layer as FeatureLayer;
            //layer must be a point feature layer
            isValid = fLayer.geometryType === 'point';
        }
        return isValid;
    };

    const onDrawButtonClicked = () => {
        if (selectedInputLayer) {
            const newLayer = helperCreateEllipseLayer(selectedInputLayer, view);
            newLayer.when(() => {
                setEllipseLayer(newLayer);
            });
            destroyHandleRef.current = newLayer.on('layerview-destroy', () => {
                setEllipseLayer(undefined);
            });

            if (view) {
                addLayerToMapWithZoomAction(view, newLayer); //
            }
        }
    };

    const onRadioChange = (event: ChangeEvent<HTMLInputElement>) => {
        setRadioValue(event.target.value as SelectionType);
    };

    //custom components
    const FieldNameSelect = (props: FieldNameSelectProps) => {
        const { value, onChange, label, name, title } = props;
        return (
            <Select
                color={'secondary'}
                variant={'outlined'}
                onChange={onChange}
                label={label}
                name={name}
                title={title}
                value={value ? value : 'none'}
            >
                <MenuItem key={'select'} value={'none'}>
                    {'Select a Field'}
                </MenuItem>
                {fieldNames.map((fld, index) => {
                    return (
                        <MenuItem key={`${name}_${index}`} value={fld}>
                            {fld}
                        </MenuItem>
                    );
                })}
            </Select>
        );
    };

    interface LinearUnitSelectProps {
        value?: string;
        onChange: (event: React.ChangeEvent<{ name?: string; value: string }>, child: React.ReactNode) => void;
    }

    //TODO currently hard coded to meters
    const LinearUnitSelect = (props: LinearUnitSelectProps): JSX.Element => {
        return (
            <Select
                defaultValue={'nauticalmiles'}
                color='secondary'
                variant='outlined'
                value={props.value}
                onChange={props.onChange}
            >
                <MenuItem value={'nauticalmiles'}>Nautical Miles</MenuItem>
                <MenuItem value={'kilometers'}>Kilometers</MenuItem>
                <MenuItem value={'miles'}>Miles</MenuItem>
                <MenuItem value={'feet'}>Feet</MenuItem>
                <MenuItem value={'meters'}>Meters</MenuItem>
            </Select>
        );
    };

    return (
        <WidgetContainer>
            <WidgetHeader position='static'>
                <InputGroup>
                    <LayerSelect
                        map={map}
                        title={'Select Layer'}
                        required={false}
                        selectedLayer={selectedInputLayer}
                        onChange={(layer) => {
                            if (layer) {
                                setSelectedInputLayer(layer as FeatureLayer);
                            } else {
                                setSelectedInputLayer(undefined);
                            }
                        }}
                        layerTypeFilter={(lyr): boolean => {
                            return isLayerValid(lyr);
                        }}
                        includeSublayersAsFeatureLayers={true}
                    />
                </InputGroup>
            </WidgetHeader>
            <WidgetContent elevation={0}>
                {selectedInputLayer && (
                    <Box>
                        <FieldGroup>
                            <FormControlLabel
                                title={'Draw Ellipses'}
                                label={'Draw Ellipses'}
                                control={
                                    <Checkbox
                                        checked={drawEllipses}
                                        onChange={(evt) => {
                                            setDrawEllipses(evt.target.checked);
                                        }}
                                    />
                                }
                            />
                        </FieldGroup>
                        <FieldGroup>
                            <StyledInputLabel>{'Semi-Major Axis Field'}</StyledInputLabel>
                            <InputGroup>
                                <FieldNameSelect
                                    value={semiMajorAxisField}
                                    onChange={(evt: ChangeEvent<HTMLInputElement>) => {
                                        setSemiMajorAxisField(evt.target.value);
                                    }}
                                    label='Semi-Major Axis Field'
                                    name='semiMajor'
                                    title='Enter the semi major axis here.'
                                />
                                <LinearUnitSelect
                                    value={semiMajorAxisUnit}
                                    onChange={(event) => {
                                        setSemiMajorAxisUnit(event.target.value as string);
                                    }}
                                />
                            </InputGroup>
                        </FieldGroup>

                        <FieldGroup>
                            <StyledInputLabel>{'Semi-Minor Axis Field'}</StyledInputLabel>
                            <InputGroup>
                                <FieldNameSelect
                                    value={semiMinorAxisField}
                                    onChange={(evt: ChangeEvent<HTMLInputElement>) => {
                                        setSemiMinorAxisField(evt.target.value);
                                    }}
                                    label='Semi-Minor Axis Field'
                                    name='semiMinor'
                                    title='Enter the semi minor axis here.'
                                />
                                <LinearUnitSelect
                                    value={semiMinorAxisUnit}
                                    onChange={(event) => {
                                        setSemiMinorAxisUnit(event.target.value as string);
                                    }}
                                />
                            </InputGroup>
                        </FieldGroup>
                        <FieldGroup>
                            <StyledInputLabel>{'Azimuth'}</StyledInputLabel>
                            <InputGroup>
                                <FieldNameSelect
                                    value={azimuthField}
                                    onChange={(evt: ChangeEvent<HTMLInputElement>) => {
                                        setAzimuthField(evt.target.value);
                                    }}
                                    label='Azimuth'
                                    name='azimuth'
                                    title='Enter the azimuth here.'
                                />
                            </InputGroup>
                        </FieldGroup>
                        <FieldGroup>
                            <RadioGroup value={radioValue} onChange={onRadioChange}>
                                <FormControlLabel value={'all'} control={<Radio />} label={'All Features'} />
                                <FormControlLabel value={'selected'} control={<Radio />} label={'Selected Features'} />
                            </RadioGroup>
                        </FieldGroup>
                    </Box>
                )}
            </WidgetContent>
            <WidgetActions elevation={0}>
                <ActionButton
                    variant='contained'
                    color='secondary'
                    type='button'
                    title='Draw Ellipses'
                    disabled={!(selectedInputLayer && semiMajorAxisField && semiMinorAxisField && azimuthField)}
                    onClick={onDrawButtonClicked}
                >
                    Draw Ellipses
                </ActionButton>
            </WidgetActions>
        </WidgetContainer>
    );
};

export default LayerEllipse;
