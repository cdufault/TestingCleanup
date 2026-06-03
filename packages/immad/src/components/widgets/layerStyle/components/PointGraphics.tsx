// React imports
import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import {
    Button,
    FormControlLabel,
    MenuItem,
    Radio,
    RadioGroup,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from '@mui/material';

import Box from '@mui/material/Box';
import { FieldGroup, InputField, InputLabel } from '../../../common';
import RotationVariable from '@arcgis/core/renderers/visualVariables/RotationVariable';
import SimpleRenderer from '@arcgis/core/renderers/SimpleRenderer';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import SimpleLineSymbol from '@arcgis/core/symbols/SimpleLineSymbol';
import VisualVariable from '@arcgis/core/renderers/visualVariables/VisualVariable';
import PointSymbol3D from '@arcgis/core/symbols/PointSymbol3D';
import { ObjectSymbol3DLayer } from '@arcgis/core/symbols';
import * as symbolUtils from '@arcgis/core/symbols/support/symbolUtils';
import { PreviewPanel, StyledWidthInputField, StyledBoxMarginTopBottom, StyledRadio } from '../styles';
import {
    getColorRampMenuItems,
    loadOriginalUniqueRenderer,
    PointGraphicsProps,
    PointObject3D,
    PointStyleEnum,
    queryLayerStatistics,
    SelectionType,
    UniqueValueBlockProps,
} from '../helpers/GraphicsHelper';
import UniqueValueRenderer from '@arcgis/core/renderers/UniqueValueRenderer';
import { useSnackbar } from 'notistack';
import UniqueValueInfo from '@arcgis/core/renderers/support/UniqueValueInfo';
import PointUniqueValueBlock from './PointUniqueValueBlock';
import { COLOR_RAMP_TAGS } from '../helpers/SymbolChooserHelper';
import EsriSymbolModal from './EsriSymbolModal';
import ListButtonIcon from 'calcite-ui-icons-react/ListButtonIcon';
import { setSelectedWebStyleObject, setStyleSelectionType } from '../WebStylesSlice';
import { useAppDispatch, useAppSelector } from '../../../../hooks/hooks';
import colorRamps = require('@arcgis/core/smartMapping/symbology/support/colorRamps');
import Field = __esri.Field;
import PointSymbol3DProperties = __esri.PointSymbol3DProperties;
import Symbol3DStyleOrigin = __esri.Symbol3DStyleOrigin;
import ObjectSymbol3DLayerResource = __esri.ObjectSymbol3DLayerResource;

const PointGraphics = (props: PointGraphicsProps): JSX.Element => {
    const { onChange, originalRenderer, layer } = props;
    const dispatch = useAppDispatch();
    const { enqueueSnackbar } = useSnackbar();
    const [markerType, setMarkerType] = useState<string>('3d');
    const selectedWebStyleType = useAppSelector((state) => state.webStylesSlice.selectedWebStyleType);
    const styleSelectionType = useAppSelector((state) => state.webStylesSlice.styleSelectionType);
    const [twoDPointObject, setTwoDPointObject] = useState<any>(PointStyleEnum.circle);
    const [twoDPointSize, setTwoDPointSize] = useState<number>(75);
    const [twoDInnerColor, setTwoDInnerColor] = useState<string>('#FFFFFF');
    const [twoDBorderColor, setTwoDBorderColor] = useState<string>('#000000');
    const [twoDBorderWidth, setTwoDBorderWidth] = useState<number>(1);
    const [selectedFieldId, setSelectedFieldId] = useState<string>('none');
    const [useGeoRotMethod, setUseGeoRotMethod] = useState<boolean>(true);
    const [twoDRenderer, setTwoDRenderer] = useState<SimpleRenderer>();
    const [threeDRenderer, setThreeDRenderer] = useState<SimpleRenderer>();
    const [threeDPointObject, setThreeDPointObject] = useState<PointObject3D>({
        name: '',
        href: '',
        styleUrl: '',
        thumbnailUrl: '',
    });
    const [threeDObjectColor, setThreeDObjectColor] = useState<string>('#FF0000');
    const [threeDObjectWidth, setThreeDObjectWidth] = useState<number>(10000);
    const [visualRotationVariable, setVisualRotationVariable] = useState<RotationVariable>();
    const previewRef = useRef<HTMLDivElement | null>(null);

    const [colorRampMenuItems, setColorRampMenuItems] = useState<JSX.Element[]>();
    const [selectedAttributeId, setSelectedAttributeId] = useState<string | undefined>();
    const [selectedColorRampId, setSelectedColorRampId] = useState<string | undefined>('none');
    const [uniqueValueBlocks, setUniqueValueBlocks] = useState<UniqueValueBlockProps[]>();
    const [rampColorTag, setRampColorTag] = useState<string>('');
    const [rampShade, setRampShade] = useState<string>('');
    const [displayBlocks, setDisplayBlocks] = useState<JSX.Element[]>([]);
    const [uniqueValueRenderer, setUniqueValueRenderer] = useState<UniqueValueRenderer>();
    const [isSymbolSelectorOpen, setIsSymbolSelectorOpen] = useState(false);
    const [selected2dWebStyleType, setSelected2dWebStyleType] = useState<string>('');
    const [selected3dWebStyleType, setSelected3dWebStyleType] = useState<string>('');
    const [showPreview, setShowPreview] = useState<boolean>(false);

    useEffect(() => {
        if (originalRenderer && (originalRenderer as SimpleRenderer).visualVariables) {
            // Find a rotation visual variable, if any exists
            const rotationVariable: RotationVariable = (originalRenderer as SimpleRenderer).visualVariables.find(
                (visualVariable) => visualVariable.type === 'rotation'
            ) as RotationVariable;

            if (rotationVariable) {
                setSelectedFieldId(rotationVariable.field);
                setUseGeoRotMethod(rotationVariable.rotationType === 'geographic');
            }
        }
        if (originalRenderer && originalRenderer.type === 'simple') {
            const oRenderer = originalRenderer as SimpleRenderer;
            if (oRenderer.symbol.type === 'simple-marker') {
                const symbol = oRenderer.symbol as SimpleMarkerSymbol;
                setTwoDPointObject(symbol.style as PointStyleEnum);
                setTwoDInnerColor(symbol.color.toHex());
                setTwoDPointSize(symbol.size);
                if (symbol.outline) {
                    setTwoDBorderWidth(symbol.outline.width);
                    setTwoDBorderColor(symbol.outline.color.toHex());
                }
                setMarkerType('2d');
            } else if (oRenderer && oRenderer.symbol.type === 'point-3d') {
                const symbol = oRenderer.symbol as PointSymbol3D;
                if (symbol.symbolLayers && symbol.symbolLayers.length > 0) {
                    if (symbol.symbolLayers.getItemAt(0).type === 'object') {
                        const symbolLayer = symbol.symbolLayers.getItemAt(0) as ObjectSymbol3DLayer;
                        if (symbolLayer.width) {
                            setThreeDObjectWidth(symbolLayer.width);
                        }
                        if (symbolLayer.material && symbolLayer.material.color) {
                            setThreeDObjectColor(symbolLayer.material.color.toHex());
                        }
                        if (symbolLayer.resource.primitive) {
                            setThreeDPointObject({
                                name: symbolLayer.resource.primitive,
                                styleUrl: symbol.styleOrigin?.styleUrl,
                            });
                        }
                        if (symbolLayer.resource.href) {
                            setThreeDPointObject({
                                name: symbolLayer.resource.href,
                                href: symbolLayer.resource.href,
                                styleUrl: symbol.styleOrigin?.styleUrl,
                            });
                        }
                    }
                }
                setMarkerType('3d');
            }
        }

        if (originalRenderer.type === 'unique-value' && (originalRenderer as UniqueValueRenderer).field) {
            setSelectedAttributeId((originalRenderer as UniqueValueRenderer).field);
            dispatch(setStyleSelectionType('attribute'));
            loadOriginalUniqueRenderer(originalRenderer as UniqueValueRenderer, layer, setUniqueValueBlocks);
        } else if (layer.fields.length > 1) {
            setSelectedAttributeId(layer.fields[1].name);
            setRampShade('light');
            setRampColorTag('reds');
        }
    }, []);

    useEffect(() => {
        if (layer.fields.length > 1) {
            try {
                setSelectedAttributeId(layer.fields[1].name);
            } catch {
                //if the available field isn't in the attribute list set it to undefined
                setSelectedAttributeId(undefined);
            }
        } else {
            setSelectedAttributeId(undefined);
        }
    }, [layer]);

    useEffect(() => {
        if (rampColorTag && rampShade) {
            const colorMenuItems = getColorRampMenuItems(rampColorTag, rampShade);
            setColorRampMenuItems(colorMenuItems);
            setSelectedColorRampId(colorMenuItems[0].props.value);
        }
    }, [rampColorTag, rampShade]);

    useEffect(() => {
        queryFeatures();
    }, [selectedAttributeId, markerType, styleSelectionType, layer]);

    useEffect(() => {
        // this handles setting the correct type when re-opening the dialog after a selection has been made.
        if (markerType === '2d') {
            setSelected2dWebStyleType(selectedWebStyleType);
        } else {
            setSelected3dWebStyleType(selectedWebStyleType);
        }
    }, [selectedWebStyleType]);

    useEffect(() => {
        if (selectedColorRampId && selectedColorRampId !== 'none' && uniqueValueBlocks) {
            const colorRamp = colorRamps.byName(selectedColorRampId).colors;
            const newUniqueValueBlocks: UniqueValueBlockProps[] = [];
            let colorIndex = -1;
            for (let index = 0; index < uniqueValueBlocks.length; index++) {
                const uniqueValueInfo = new UniqueValueInfo();
                colorIndex++;
                if (markerType === '2d') {
                    const newSymbol = new SimpleMarkerSymbol();
                    const oldSymbol = uniqueValueBlocks[index].uniqueValueInfo.symbol as SimpleMarkerSymbol;
                    newSymbol.style = oldSymbol.style;
                    newSymbol.size = oldSymbol.size;
                    newSymbol.outline = oldSymbol.outline;
                    if (colorIndex >= colorRamp.length) {
                        colorIndex = 0;
                    }
                    newSymbol.color = colorRamp[colorIndex];
                    newSymbol.outline.color = colorRamp[colorIndex];

                    uniqueValueInfo.symbol = newSymbol;
                    uniqueValueInfo.value = uniqueValueBlocks[index].uniqueValueInfo.value;
                    const uvProp = {
                        fieldCount: uniqueValueBlocks[index].fieldCount,
                        uniqueValueInfo: uniqueValueInfo,
                    };
                    newUniqueValueBlocks.push(uvProp);
                } else {
                    //3d symbol
                    const newResource: ObjectSymbol3DLayerResource = {};
                    newResource.href =
                        uniqueValueBlocks[index].uniqueValueInfo.symbol.symbolLayers.items[0].resource.href;
                    if (colorIndex >= colorRamp.length) {
                        colorIndex = 0;
                    }
                    const newColor = colorRamp[colorIndex];

                    const newSymbolLayer = {
                        type: 'object',
                        resource: newResource,
                        width: uniqueValueBlocks[index].uniqueValueInfo.symbol.symbolLayers.items[0].width,
                        height: undefined,
                        depth: undefined,
                        material: { color: newColor },
                    };

                    const styleOrigin = {
                        styleUrl: uniqueValueBlocks[index].uniqueValueInfo.symbol.styleOrigin.styleUrl,
                        name: uniqueValueBlocks[index].uniqueValueInfo.symbol.styleOrigin.name,
                    } as Symbol3DStyleOrigin;

                    uniqueValueInfo.symbol = new PointSymbol3D({
                        symbolLayers: [newSymbolLayer],
                        styleOrigin: styleOrigin,
                    } as PointSymbol3DProperties);
                    uniqueValueInfo.value = uniqueValueBlocks[index].uniqueValueInfo.value;
                    const uvProp = {
                        fieldCount: uniqueValueBlocks[index].fieldCount,
                        uniqueValueInfo: uniqueValueInfo,
                    };
                    newUniqueValueBlocks.push(uvProp);
                }
            }
            setUniqueValueBlocks(newUniqueValueBlocks);
        } else if (selectedColorRampId && selectedColorRampId !== 'none') {
            const colorRamp = colorRamps.byName(selectedColorRampId)?.colors;
            if (colorRamp) {
                queryFeatures();
            }
        }
    }, [selectedColorRampId]);

    useEffect(() => {
        const inputElem: JSX.Element[] = [];
        uniqueValueBlocks &&
            uniqueValueBlocks.length > 0 &&
            uniqueValueBlocks.forEach((input) => {
                inputElem.push(
                    <PointUniqueValueBlock
                        key={uniqueValueBlocks.indexOf(input) + Math.random()}
                        fieldCount={input.fieldCount}
                        uniqueValueInfo={input.uniqueValueInfo}
                        markerType={markerType}
                        onChange={(newUniqueValueInfo) => {
                            UpdateUniqueValueBlocks(newUniqueValueInfo);
                        }}
                    />
                );
            });
        setDisplayBlocks(inputElem);
    }, [uniqueValueBlocks]);

    useEffect(() => {
        if (markerType === '2d') {
            setSymbolInTwoDRenderer();
        }
    }, [
        markerType,
        twoDPointSize,
        twoDInnerColor,
        twoDBorderColor,
        twoDBorderWidth,
        selectedFieldId,
        useGeoRotMethod,
        visualRotationVariable,
        twoDPointObject,
    ]);

    useEffect(() => {
        if (markerType === '3d') {
            const newRenderer = new SimpleRenderer();
            const newResource: ObjectSymbol3DLayerResource = {};

            if (threeDPointObject.thumbnailUrl && threeDPointObject.href) {
                newResource.href = threeDPointObject.href;
            } else if (threeDPointObject.name) {
                newResource.primitive = threeDPointObject.name;
            }

            const newSymbolLayer = {
                type: 'object',
                resource: newResource,
                width: threeDObjectWidth,
                height: undefined,
                depth: undefined,
                material: { color: threeDObjectColor },
            };

            const styleOrigin = {
                styleUrl: threeDPointObject.styleUrl,
                name: threeDPointObject.name,
            } as Symbol3DStyleOrigin;

            newRenderer.symbol = new PointSymbol3D({
                symbolLayers: [newSymbolLayer],
                styleOrigin: styleOrigin,
            } as PointSymbol3DProperties);

            if (selectedFieldId !== 'none') {
                newRenderer.visualVariables = [visualRotationVariable] as VisualVariable[];
            }
            setThreeDRenderer(newRenderer);
        }
    }, [markerType, threeDObjectWidth, threeDPointObject, threeDObjectColor]);

    useEffect(() => {
        if (styleSelectionType === 'location') {
            updatePreviewRefOnChange();
        }
        if (styleSelectionType === 'attribute' && uniqueValueRenderer) {
            if (selectedFieldId !== 'none') {
                const rotationVariable = {
                    type: 'rotation',
                    field: selectedFieldId,
                    rotationType: useGeoRotMethod ? 'geographic' : 'arithmetic',
                } as RotationVariable;
                uniqueValueRenderer.visualVariables = [rotationVariable];
            }
            onChange(uniqueValueRenderer);
        }
    }, [twoDRenderer, threeDRenderer, uniqueValueRenderer]);

    useEffect(() => {
        if (selectedFieldId !== 'none') {
            const rotationVariable = {
                type: 'rotation',
                field: selectedFieldId,
                rotationType: useGeoRotMethod ? 'geographic' : 'arithmetic',
            } as RotationVariable;
            setVisualRotationVariable(rotationVariable);
            if (markerType === '2d' && twoDRenderer && styleSelectionType === 'location') {
                const newRenderer = twoDRenderer.clone();
                newRenderer.visualVariables = [rotationVariable];
                setTwoDRenderer(newRenderer);
            } else if (markerType === '3d' && threeDRenderer && styleSelectionType === 'location') {
                const newRenderer = threeDRenderer.clone();
                newRenderer.visualVariables = [rotationVariable];
                setThreeDRenderer(newRenderer);
            } else if (styleSelectionType === 'attribute' && uniqueValueRenderer) {
                const newRenderer = uniqueValueRenderer.clone();
                newRenderer.visualVariables = [rotationVariable];
                setUniqueValueRenderer(newRenderer);
            } else {
                if (originalRenderer.type === 'simple') {
                    const newRenderer = (originalRenderer as SimpleRenderer).clone();
                    newRenderer.visualVariables = [rotationVariable];
                    onChange(newRenderer);
                }
            }
        }
    }, [selectedFieldId, useGeoRotMethod]);

    /**
     * set the symbol in 2D renderer
     */
    const setSymbolInTwoDRenderer = async () => {
        try {
            const newRenderer = new SimpleRenderer();
            newRenderer.symbol = {
                type: 'picture-marker',
                url: twoDPointObject.thumbnailUrl,
                width: twoDPointSize,
                height: twoDPointSize,
            };
            setTwoDRenderer(newRenderer);
        } catch (error) {
            console.error('Error fetching or processing 2d web symbol:', error);
        }
    };

    /**
     * updates the Preview item when symbol changes
     */
    const updatePreviewRefOnChange = () => {
        if (markerType === '2d' && twoDRenderer) {
            if (previewRef.current && twoDPointObject?.thumbnailUrl) {
                previewRef.current.innerHTML = '';
                const image = new Image();
                image.src = `${twoDPointObject.thumbnailUrl}`;
                image.alt = 'Symbol Preview';
                image.style.width = '200px';
                image.style.height = '200px';
                image.style.objectFit = 'cover';
                previewRef.current.appendChild(image);
            }
            onChange(twoDRenderer);
        } else if (markerType === '3d' && threeDRenderer && threeDPointObject.thumbnailUrl) {
            symbolUtils
                .renderPreviewHTML(threeDRenderer.symbol, { size: 75 })
                .then((symbol) => {
                    if (previewRef.current) {
                        previewRef.current.innerHTML = symbol.innerHTML;
                    }
                })
                .catch((error) => {
                    console.error(error.message);
                });
            onChange(threeDRenderer);
        } else if (previewRef.current) {
            previewRef.current?.innerHTML = '';
        }
    };

    const queryFeatures = async () => {
        if (selectedAttributeId && selectedColorRampId && selectedColorRampId !== 'none' && layer.type !== 'stream') {
            const results = await queryLayerStatistics(layer, selectedAttributeId);
            const outStatisticsCountFieldName = `${selectedAttributeId}_count`;
            if (results && results.features) {
                const uniqueValueBlockProps: UniqueValueBlockProps[] = [];
                const colorRamp = colorRamps.byName(selectedColorRampId).colors;
                if (results.features.length > 200) {
                    enqueueSnackbar(
                        'Unique Value Rendering limited to 200 values. Filter the layer to reduce the number of unique values for rendering.',
                        { variant: 'warning' }
                    );
                    setUniqueValueBlocks(undefined);
                } else if (results.features.length > 0) {
                    for (let index = 0; index < results.features.length; index++) {
                        if (markerType === '2d') {
                            const newSymbol = new SimpleMarkerSymbol();

                            newSymbol.style = twoDPointObject;
                            newSymbol.size = twoDPointSize;
                            const newBorder = new SimpleLineSymbol();
                            newBorder.width = 2;
                            newSymbol.outline = newBorder;
                            newSymbol.color = colorRamp[index % colorRamp.length];
                            newBorder.color = colorRamp[index % colorRamp.length];

                            const uniqueValueInfo = new UniqueValueInfo();
                            uniqueValueInfo.symbol = newSymbol;
                            uniqueValueInfo.value = results.features[index].attributes[selectedAttributeId];
                            const uvProp = {
                                fieldCount: results.features[index].attributes[outStatisticsCountFieldName],
                                uniqueValueInfo: uniqueValueInfo,
                            };
                            uniqueValueBlockProps.push(uvProp);
                        } else {
                            //if not 2d then it is 3d
                            const newResource: ObjectSymbol3DLayerResource = {};

                            if (threeDPointObject.href) {
                                newResource.href = threeDPointObject.href;
                            } else if (threeDPointObject.name) {
                                newResource.primitive = threeDPointObject.name;
                            }
                            const newColor = colorRamp[index % colorRamp.length];
                            const newSymbolLayer = {
                                type: 'object',
                                resource: newResource,
                                width: threeDObjectWidth,
                                height: undefined,
                                depth: undefined,
                                material: { color: newColor },
                            };

                            const styleOrigin = {
                                styleUrl: threeDPointObject.styleUrl,
                                name: threeDPointObject.name,
                            } as Symbol3DStyleOrigin;

                            const uniqueValueInfo = new UniqueValueInfo();
                            uniqueValueInfo.symbol = new PointSymbol3D({
                                symbolLayers: [newSymbolLayer],
                                styleOrigin: styleOrigin,
                            } as PointSymbol3DProperties);
                            uniqueValueInfo.value = results.features[index].attributes[selectedAttributeId];
                            const uvProp = {
                                fieldCount: results.features[index].attributes[outStatisticsCountFieldName],
                                uniqueValueInfo: uniqueValueInfo,
                            };
                            uniqueValueBlockProps.push(uvProp);
                        }
                    }
                }
                setUniqueValueBlocks(uniqueValueBlockProps);
            }
        } else setUniqueValueBlocks([]);
    };

    const UpdateUniqueValueBlocks = (newUniqueValuInfo: UniqueValueInfo) => {
        if (uniqueValueBlocks) {
            const newRenderer = new UniqueValueRenderer();
            newRenderer.field = selectedAttributeId ? selectedAttributeId : '';
            const uniqueValueInfos: UniqueValueInfo[] = [];
            for (const uniqueBlock of uniqueValueBlocks) {
                if (uniqueBlock.uniqueValueInfo.value === newUniqueValuInfo.value) {
                    uniqueBlock.uniqueValueInfo = newUniqueValuInfo;
                }
                uniqueValueInfos.push(uniqueBlock.uniqueValueInfo);
            }
            newRenderer.uniqueValueInfos = uniqueValueInfos;
            setUniqueValueRenderer(newRenderer);
        }
    };

    const onRotationMethodChange = (event: ChangeEvent<HTMLInputElement>, value: string) => {
        if (value === 'geographic') {
            setUseGeoRotMethod(true);
        } else {
            setUseGeoRotMethod(false);
        }
    };

    /**
     * Open the symbol selctor modal
     */
    const openSymbolSelectorModal = () => {
        setIsSymbolSelectorOpen(true);
    };

    /**
     * Handle the on close of the symbol selctor modal
     * @param symbol symbol to update with or null.
     */
    const closeSymbolSelectorModal = async (symbol: any | null) => {
        setIsSymbolSelectorOpen(false);
        if (symbol) {
            const minSymbol = {
                href: symbol.href,
                name: symbol.name,
                styleUrl: symbol.styleUrl,
                thumbnailUrl: symbol.thumbnailUrl,
            };
            if (markerType === '2d') {
                if (symbol.styleUrl && symbol.name) {
                    setTwoDPointObject(symbol);
                }
            } else {
                setThreeDPointObject(minSymbol as unknown as PointStyleEnum);
            }
            if (minSymbol.thumbnailUrl) {
                setShowPreview(true);
            } else {
                setShowPreview(false);
            }
            dispatch(setSelectedWebStyleObject(minSymbol));
        }
    };

    /**
     * Marker type changed event handler
     * @param event change event
     */
    const markerTypeChanged = (event: ChangeEvent<HTMLInputElement>) => {
        const selectedType = event.target.value;
        setMarkerType(selectedType);
    };

    return (
        <Box>
            <FieldGroup>
                <RadioGroup
                    row
                    value={styleSelectionType}
                    onChange={(_evt, val) => dispatch(setStyleSelectionType(val as SelectionType))}
                >
                    <FormControlLabel value={'location'} control={<Radio />} label={'Show Location Only'} />
                    <FormControlLabel value={'attribute'} control={<Radio />} label={'Visualize Attribute'} />
                </RadioGroup>
            </FieldGroup>
            {styleSelectionType === 'location' ? (
                <StyledBoxMarginTopBottom>
                    {showPreview ? <PreviewPanel ref={previewRef} /> : ''}
                    <StyledBoxMarginTopBottom>
                        <InputField
                            variant='outlined'
                            select
                            color='secondary'
                            title={'Marker Type'}
                            value={markerType}
                            onChange={markerTypeChanged}
                        >
                            <MenuItem key='2d' value='2d'>
                                2D Marker
                            </MenuItem>
                            <MenuItem key='3d' value='3d'>
                                3D Object
                            </MenuItem>
                        </InputField>
                    </StyledBoxMarginTopBottom>
                    <>
                        {markerType === '2d' ? (
                            <StyledBoxMarginTopBottom>
                                <Button variant={'outlined'} size={'large'} onClick={openSymbolSelectorModal}>
                                    {twoDPointObject.thumbnailUrl ? (
                                        <div>
                                            <img src={twoDPointObject.thumbnailUrl} alt={'Select Style'} />
                                            <div>{twoDPointObject.name} </div>
                                        </div>
                                    ) : (
                                        <>
                                            <ListButtonIcon size={24} />
                                            Select Symbol
                                        </>
                                    )}
                                </Button>
                                <EsriSymbolModal
                                    open={isSymbolSelectorOpen}
                                    onClose={closeSymbolSelectorModal}
                                    markerType={markerType}
                                    selectedWebStyleType={selected2dWebStyleType}
                                    layerGeometryType={layer.geometryType}
                                />
                                <StyledBoxMarginTopBottom>
                                    <InputLabel>Size</InputLabel>
                                    <InputField
                                        variant='outlined'
                                        type='number'
                                        placeholder='Enter a number...'
                                        size='small'
                                        color='secondary'
                                        value={twoDPointSize}
                                        onChange={(event) => {
                                            setTwoDPointSize(parseInt(event.target.value));
                                        }}
                                    />
                                </StyledBoxMarginTopBottom>
                            </StyledBoxMarginTopBottom>
                        ) : (
                            ''
                        )}
                    </>
                    <>
                        {markerType === '3d' ? (
                            <StyledBoxMarginTopBottom>
                                <Button variant={'outlined'} size={'large'} onClick={openSymbolSelectorModal}>
                                    {threeDPointObject.thumbnailUrl ? (
                                        <div>
                                            <img src={threeDPointObject.thumbnailUrl} alt={'Select Style'} />
                                            <div>{threeDPointObject.name} </div>
                                        </div>
                                    ) : (
                                        <>
                                            <ListButtonIcon size={24} />
                                            Select Symbol
                                        </>
                                    )}
                                </Button>
                                <EsriSymbolModal
                                    open={isSymbolSelectorOpen}
                                    onClose={closeSymbolSelectorModal}
                                    markerType={markerType}
                                    selectedWebStyleType={selected3dWebStyleType}
                                    layerGeometryType={layer.geometryType}
                                />
                                <StyledBoxMarginTopBottom>
                                    <InputLabel>Color</InputLabel>
                                    <InputField
                                        variant='outlined'
                                        type='color'
                                        id='innerColor'
                                        size='large'
                                        value={threeDObjectColor}
                                        sx={{ width: '75px' }}
                                        onChange={(event) => {
                                            setThreeDObjectColor(event.target.value);
                                        }}
                                    />
                                </StyledBoxMarginTopBottom>
                                <StyledBoxMarginTopBottom>
                                    <InputLabel>Width (meters)</InputLabel>
                                    <StyledWidthInputField
                                        variant='outlined'
                                        type='number'
                                        placeholder='Enter a number...'
                                        size='small'
                                        color='secondary'
                                        value={String(threeDObjectWidth)}
                                        InputProps={{
                                            inputProps: { min: 0, max: 100000, step: 100 },
                                        }}
                                        onChange={(event) => {
                                            setThreeDObjectWidth(parseInt(event.target.value));
                                        }}
                                    />
                                </StyledBoxMarginTopBottom>
                                <StyledBoxMarginTopBottom>
                                    <InputLabel>Rotation Field</InputLabel>
                                    <InputField
                                        variant='outlined'
                                        select
                                        color='secondary'
                                        helperText='Rotate icons based on this field value'
                                        title='Rotation Field'
                                        value={selectedFieldId}
                                        onChange={(event) => {
                                            setSelectedFieldId(event.target.value);
                                        }}
                                    >
                                        <MenuItem key='none' value='none'>
                                            None
                                        </MenuItem>
                                        {layer.fields
                                            ?.filter((field: Field) => {
                                                return field.type !== 'oid';
                                            })
                                            .map((field) => {
                                                return (
                                                    <MenuItem key={field.name} value={field.name} id={field.name}>
                                                        {field.alias}
                                                    </MenuItem>
                                                );
                                            })}
                                    </InputField>
                                    <Box>
                                        <Box sx={{ marginTop: '10px' }}>
                                            <InputLabel>Rotation Method</InputLabel>
                                        </Box>
                                        <RadioGroup
                                            name='rotationMethodRadioButton'
                                            onChange={onRotationMethodChange}
                                            row
                                        >
                                            <FormControlLabel
                                                control={<StyledRadio />}
                                                label='Geographic'
                                                value='geographic'
                                                title='0 degrees is North'
                                                checked={useGeoRotMethod}
                                            />
                                            <FormControlLabel
                                                control={<StyledRadio />}
                                                label='Arithmetic'
                                                value='arithmetic'
                                                title='0 degrees is East'
                                                checked={!useGeoRotMethod}
                                            />
                                        </RadioGroup>
                                    </Box>
                                </StyledBoxMarginTopBottom>
                            </StyledBoxMarginTopBottom>
                        ) : (
                            ''
                        )}
                    </>
                </StyledBoxMarginTopBottom>
            ) : (
                ''
            )}
            {styleSelectionType === 'attribute' ? (
                <Box>
                    <InputField
                        variant='outlined'
                        select
                        color='secondary'
                        title='Attribute Field'
                        value={selectedAttributeId}
                        onChange={(event) => {
                            setSelectedAttributeId(event.target.value);
                        }}
                    >
                        {layer.fields
                            ?.filter((field: Field) => {
                                return (
                                    field.type !== 'oid' &&
                                    field.type !== 'geometry' &&
                                    field.type !== 'blob' &&
                                    field.type !== 'raster' &&
                                    field.type !== 'xml' //&&
                                    //field.length > -1
                                );
                            })
                            .map((field: Field) => {
                                return (
                                    <MenuItem key={field.name} value={field.name} id={field.name}>
                                        {field.alias}
                                    </MenuItem>
                                );
                            })}
                    </InputField>
                    <FieldGroup>
                        <RadioGroup row value={rampShade} onChange={(_evt, val) => setRampShade(val)}>
                            <FormControlLabel value={'dark'} control={<Radio />} label={'Dark'} />
                            <FormControlLabel value={'light'} control={<Radio />} label={'Light'} />
                        </RadioGroup>
                        <InputField
                            variant='outlined'
                            select
                            color='secondary'
                            title={'Color Ramp Tags'}
                            value={rampColorTag}
                            onChange={(event) => {
                                setRampColorTag(event.target.value);
                            }}
                        >
                            {COLOR_RAMP_TAGS.map((tag) => (
                                <MenuItem key={tag} value={tag}>
                                    {tag}
                                </MenuItem>
                            ))}
                        </InputField>
                        <InputField
                            variant='outlined'
                            select
                            color='secondary'
                            title={'Color Ramps'}
                            value={selectedColorRampId}
                            onChange={(event) => {
                                setSelectedColorRampId(event.target.value);
                            }}
                        >
                            <MenuItem key='none' value='none'>
                                Select a Color Scheme
                            </MenuItem>
                            {colorRampMenuItems}
                        </InputField>
                    </FieldGroup>
                    <FieldGroup>
                        <InputField
                            variant='outlined'
                            select
                            color='secondary'
                            title={'Marker Type'}
                            value={markerType}
                            onChange={(event) => {
                                setMarkerType(event.target.value as '2d' | '3d');
                            }}
                        >
                            <MenuItem key='2d' value='2d'>
                                2D Marker
                            </MenuItem>
                            <MenuItem key='3d' value='3d'>
                                3D Object
                            </MenuItem>
                        </InputField>
                    </FieldGroup>
                    <FieldGroup>
                        <InputLabel>Rotation Field</InputLabel>
                        <InputField
                            variant='outlined'
                            select
                            color='secondary'
                            helperText='Rotate icons based on this field value'
                            title='Rotation Field'
                            value={selectedFieldId}
                            onChange={(event) => {
                                setSelectedFieldId(event.target.value);
                            }}
                        >
                            <MenuItem key='none' value='none'>
                                None
                            </MenuItem>
                            {layer.fields
                                ?.filter((field: Field) => {
                                    return field.type !== 'oid';
                                })
                                .map((field) => {
                                    return (
                                        <MenuItem key={field.name} value={field.name} id={field.name}>
                                            {field.alias}
                                        </MenuItem>
                                    );
                                })}
                        </InputField>
                        <Box>
                            <InputLabel>Rotation Method</InputLabel>
                            <RadioGroup name='rotationMethodRadioButton' onChange={onRotationMethodChange} row>
                                <FormControlLabel
                                    control={<Radio />}
                                    label='Geographic'
                                    value='geographic'
                                    title='0 degrees is North'
                                    checked={useGeoRotMethod}
                                />
                                <FormControlLabel
                                    control={<Radio />}
                                    label='Arithmetic'
                                    value='arithmetic'
                                    title='0 degrees is East'
                                    checked={!useGeoRotMethod}
                                />
                            </RadioGroup>
                        </Box>
                    </FieldGroup>

                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Color</TableCell>
                                <TableCell>Attribute Value</TableCell>
                                <TableCell>Count</TableCell>
                                <TableCell>Style</TableCell>
                                <TableCell>{markerType === '2d' ? 'Size' : 'Width'}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>{displayBlocks ? displayBlocks : ''}</TableBody>
                    </Table>
                </Box>
            ) : (
                ''
            )}
        </Box>
    );
};
export default PointGraphics;
