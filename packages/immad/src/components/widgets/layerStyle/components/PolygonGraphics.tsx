// React imports
import React, { ChangeEvent, useEffect, useState } from 'react';
import MenuItem from '@mui/material/MenuItem';
import { FieldGroup, InputField, InputLabel } from '../../../common';
import {
    FormControlLabel,
    Radio,
    RadioGroup,
    Slider,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from '@mui/material';

import { StyledSliderContainer } from '../styles';
import {
    GraphicsProps,
    OutlineStyleEnum,
    PolygonStyleEnum,
    SelectionType,
    UniqueValueBlockProps,
    getColorRampMenuItems,
    queryLayerStatistics,
    loadOriginalUniqueRenderer,
} from '../helpers/GraphicsHelper';
import PolygonUniqueValueBlock from './PolygonUniqueValueBlock';
import * as colorRamps from '@arcgis/core/smartMapping/symbology/support/colorRamps';
import Field from '@arcgis/core/layers/support/Field';
import SimpleRenderer from '@arcgis/core/renderers/SimpleRenderer';
import UniqueValueRenderer from '@arcgis/core/renderers/UniqueValueRenderer';
import UniqueValueInfo from '@arcgis/core/renderers/support/UniqueValueInfo';
import Color from '@arcgis/core/Color';
import { SimpleFillSymbol } from '@arcgis/core/symbols';
import SimpleLineSymbol from '@arcgis/core/symbols/SimpleLineSymbol';
import { useSnackbar } from 'notistack';
import { COLOR_RAMP_TAGS } from '../helpers/SymbolChooserHelper';

const PolygonGraphics = (props: GraphicsProps): JSX.Element => {
    const { onChange, originalRenderer, layer } = props;

    const { enqueueSnackbar } = useSnackbar();

    const [selectedStyle, setSelectedStyle] = useState<string>('solid');
    const [selectedColor, setSelectedColor] = useState<string>('#FF0000');
    const [isColorPickerDisabled, setIsColorPickerDisabled] = useState<boolean>(false);
    const [selectedOutlineStyle, setSelectedOutlineStyle] = useState<OutlineStyleEnum>(OutlineStyleEnum.solid);
    const [selectedOutlineColor, setSelectedOutlineColor] = useState<string>('#000000');
    const [selectedOutlineWidth, setSelectedOutlineWidth] = useState<number>(1);
    const [selectedFillTransparency, setSelectedFillTransparency] = useState<number>(1);
    const [colorRampMenuItems, setColorRampMenuItems] = useState<JSX.Element[]>();
    const [styleSelection, setStyleSelection] = useState<SelectionType>('location');
    const [selectedAttributeId, setSelectedAttributeId] = useState<string | undefined>();
    const [selectedColorRampId, setSelectedColorRampId] = useState<string | undefined>();
    const [uniqueValueBlocks, setUniqueValueBlocks] = useState<UniqueValueBlockProps[]>();
    const [rampColorTag, setRampColorTag] = useState<string>('blues');
    const [rampShade, setRampShade] = useState<string>('dark');
    const [displayBlocks, setDisplayBlocks] = useState<JSX.Element[]>([]);

    useEffect(() => {
        if (originalRenderer.type === 'unique-value' && (originalRenderer as UniqueValueRenderer).field) {
            setStyleSelection('attribute');
            setSelectedAttributeId((originalRenderer as UniqueValueRenderer).field);
            setSelectedColorRampId('none');
            loadOriginalRenderer();
        } else if (layer.fields.length > 1) {
            setSelectedAttributeId(layer.fields[1].name);
            setRampShade('light');
            setRampColorTag('blues');
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
        if (styleSelection === 'location') {
            const newRenderer = new SimpleRenderer();
            const newSymbol = new SimpleFillSymbol();
            newSymbol.style = selectedStyle as PolygonStyleEnum;

            // get rgba value from hex
            const color = Color.fromHex(selectedColor);
            // apply transparency
            color.a = selectedFillTransparency;
            newSymbol.color = new Color(color);

            const newOutline = new SimpleLineSymbol();
            newOutline.width = selectedOutlineWidth;
            newOutline.color = new Color(selectedOutlineColor);
            newOutline.style = selectedOutlineStyle;
            newSymbol.outline = newOutline;
            newRenderer.symbol = newSymbol;
            onChange(newRenderer);
        } else if (styleSelection === 'attribute' && uniqueValueBlocks) {
            const newRenderer = new UniqueValueRenderer();
            newRenderer.field = selectedAttributeId ? selectedAttributeId : '';
            const uniqueValueInfos: UniqueValueInfo[] = [];
            for (const uniqueBlock of uniqueValueBlocks) {
                uniqueValueInfos.push(uniqueBlock.uniqueValueInfo);
            }
            newRenderer.uniqueValueInfos = uniqueValueInfos;
            onChange(newRenderer);
        }
    }, [
        selectedStyle,
        selectedColor,
        selectedOutlineStyle,
        selectedOutlineColor,
        selectedOutlineWidth,
        selectedFillTransparency,
        uniqueValueBlocks,
        styleSelection,
    ]);

    useEffect(() => {
        queryFeatures();
    }, [selectedAttributeId, styleSelection, layer]);

    useEffect(() => {
        if (selectedColorRampId && selectedColorRampId !== 'none' && uniqueValueBlocks) {
            const colorRamp = colorRamps.byName(selectedColorRampId).colors;
            const newUniqueValueBlocks: UniqueValueBlockProps[] = [];

            for (let index = 0; index < uniqueValueBlocks.length; index++) {
                const uniqueValueInfo = new UniqueValueInfo();
                const newSymbol = new SimpleFillSymbol();
                const oldSymbol = uniqueValueBlocks[index].uniqueValueInfo.symbol as SimpleFillSymbol;

                newSymbol.style = oldSymbol.style;
                newSymbol.color = colorRamp[index % colorRamp.length];

                uniqueValueInfo.symbol = newSymbol;
                uniqueValueInfo.value = uniqueValueBlocks[index].uniqueValueInfo.value;
                const uvProp = {
                    fieldCount: uniqueValueBlocks[index].fieldCount,
                    uniqueValueInfo: uniqueValueInfo,
                };
                newUniqueValueBlocks.push(uvProp);
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
                    <PolygonUniqueValueBlock
                        key={uniqueValueBlocks.indexOf(input) + Math.random()}
                        fieldCount={input.fieldCount}
                        uniqueValueInfo={input.uniqueValueInfo}
                        onChange={(newUniqueValueInfo) => {
                            UpdateUniqueValueBlocks(newUniqueValueInfo);
                        }}
                    />
                );
            });
        setDisplayBlocks(inputElem);
    }, [uniqueValueBlocks]);

    const loadOriginalRenderer = async () => {
        if (originalRenderer.type === 'simple') {
            const oRenderer = originalRenderer as SimpleRenderer;
            const symbol = oRenderer.symbol as SimpleFillSymbol;
            setSelectedStyle(symbol.style);
            setSelectedColor(symbol.color.toHex());
            setSelectedOutlineColor(symbol.outline.color.toHex());
            setSelectedOutlineWidth(symbol.outline.width);
        } else if (originalRenderer.type === 'unique-value') {
            loadOriginalUniqueRenderer(originalRenderer as UniqueValueRenderer, layer, setUniqueValueBlocks);
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
                        const newSymbol = new SimpleFillSymbol();
                        newSymbol.style = 'solid';
                        newSymbol.color = colorRamp[index % colorRamp.length];

                        const uniqueValueInfo = new UniqueValueInfo();
                        uniqueValueInfo.symbol = newSymbol;
                        uniqueValueInfo.value = results.features[index].attributes[selectedAttributeId];
                        const uvProp = {
                            fieldCount: results.features[index].attributes[outStatisticsCountFieldName],
                            uniqueValueInfo: uniqueValueInfo,
                        };
                        uniqueValueBlockProps.push(uvProp);
                    }
                }
                setUniqueValueBlocks(uniqueValueBlockProps);
            }
        } else setUniqueValueBlocks([]);
    };

    const handleTransparencyChange = (event: ChangeEvent<HTMLInputElement>, newValue: number) => {
        setSelectedFillTransparency(newValue);
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
            onChange(newRenderer);
        }
    };

    return (
        <div>
            <FieldGroup>
                <RadioGroup
                    row
                    value={styleSelection}
                    onChange={(_evt, val) => setStyleSelection(val as SelectionType)}
                >
                    <FormControlLabel value={'location'} control={<Radio />} label={'Show Location Only'} />
                    <FormControlLabel value={'attribute'} control={<Radio />} label={'Visualize Attribute'} />
                </RadioGroup>
            </FieldGroup>
            {styleSelection === 'location' ? (
                <div>
                    <div>
                        <InputLabel>Style</InputLabel>
                        <InputField
                            variant='outlined'
                            select
                            fullWidth
                            color='secondary'
                            title={'Style'}
                            value={selectedStyle}
                            onChange={(event) => {
                                const newStyle = event.target.value as PolygonStyleEnum;
                                setSelectedStyle(newStyle);
                                if (newStyle === 'none') {
                                    setSelectedColor('#000000');
                                    setIsColorPickerDisabled(true);
                                } else {
                                    setIsColorPickerDisabled(false);
                                }
                            }}
                        >
                            <MenuItem key='backward-diagonal' value='backward-diagonal'>
                                Backward-Diagonal
                            </MenuItem>
                            <MenuItem key='cross' value='cross'>
                                Cross
                            </MenuItem>
                            <MenuItem key='diagonal-cross' value='diagonal-cross'>
                                Diagonal-Cross
                            </MenuItem>
                            <MenuItem key='forward-diagonal' value='forward-diagonal'>
                                Forward-Diagonal
                            </MenuItem>
                            <MenuItem key='horizontal' value='horizontal'>
                                Horizontal
                            </MenuItem>
                            <MenuItem key='vertical' value='vertical'>
                                Vertical
                            </MenuItem>
                            <MenuItem key='solid' value='solid'>
                                Solid
                            </MenuItem>
                            <MenuItem key='none' value='none'>
                                None
                            </MenuItem>
                        </InputField>
                    </div>
                    <div>
                        <InputLabel>Color</InputLabel>
                        <InputField
                            style={{ width: 75 }}
                            variant='outlined'
                            type='color'
                            id='innerColor'
                            size='medium'
                            value={selectedColor}
                            disabled={isColorPickerDisabled}
                            onChange={(event) => {
                                setSelectedColor(event.target.value);
                            }}
                        />
                    </div>
                    <div>
                        <InputLabel>Transparency</InputLabel>
                        <StyledSliderContainer>
                            <Slider
                                color='secondary'
                                value={selectedFillTransparency}
                                step={0.1}
                                marks={true}
                                min={0}
                                max={1}
                                valueLabelDisplay='auto'
                                onChange={handleTransparencyChange}
                            />
                        </StyledSliderContainer>
                    </div>
                    <div hidden={true}>
                        <InputLabel>Outline Style</InputLabel>
                        <InputField
                            variant='outlined'
                            select
                            fullWidth
                            color='secondary'
                            title={'Point Style'}
                            value={selectedOutlineStyle}
                            onChange={(event) => {
                                setSelectedOutlineStyle(event.target.value as OutlineStyleEnum);
                            }}
                        >
                            <MenuItem key='none' value='none'>
                                Select Line Type
                            </MenuItem>
                            <MenuItem key='dash' value='dash'>
                                Dash
                            </MenuItem>
                            <MenuItem key='dash-dot' value='dash-dot'>
                                Dash-Dot
                            </MenuItem>
                            <MenuItem key='dot' value='dot'>
                                Dot
                            </MenuItem>
                            <MenuItem key='long-dash' value='long-dash'>
                                Long-Dash
                            </MenuItem>
                            <MenuItem key='long-dash-dot' value='long-dash-dot'>
                                Long-Dash-Dot
                            </MenuItem>
                            <MenuItem key='long-dash-dot-dot' value='long-dash-dot-dot'>
                                Long-Dash-Dot-Dot
                            </MenuItem>
                            <MenuItem key='short-dash' value='short-dash'>
                                Short-Dash
                            </MenuItem>
                            <MenuItem key='short-dash-dot' value='short-dash-dot'>
                                Short-Dash-Dot
                            </MenuItem>
                            <MenuItem key='short-dash-dot-dot' value='short-dash-dot-dot'>
                                Short-Dash-Dot-Dot
                            </MenuItem>
                            <MenuItem key='short-dot' value='short-dot'>
                                Short-Dot
                            </MenuItem>
                            <MenuItem key='solid' value='solid'>
                                Solid
                            </MenuItem>
                        </InputField>
                    </div>
                    <div>
                        <InputLabel>Outline Color</InputLabel>
                        <InputField
                            style={{ width: 75 }}
                            variant='outlined'
                            type='color'
                            id='innerColor'
                            size='medium'
                            value={selectedOutlineColor}
                            onChange={(event) => {
                                setSelectedOutlineColor(event.target.value);
                            }}
                        />
                    </div>
                    <div>
                        <InputLabel>Outline Width</InputLabel>
                        <InputField
                            variant='outlined'
                            type='number'
                            helperText='Optional'
                            fullWidth
                            size='small'
                            color='secondary'
                            value={selectedOutlineWidth}
                            onChange={(event) => {
                                setSelectedOutlineWidth(parseInt(event.target.value));
                            }}
                        />
                    </div>
                </div>
            ) : (
                ''
            )}
            {styleSelection === 'attribute' ? (
                <div>
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
                                    field.type !== 'xml' &&
                                    field.name !== 'SHAPE__Area' &&
                                    field.name !== 'SHAPE__Length'
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
                            value={rampColorTag ?? ''}
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

                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Color</TableCell>
                                <TableCell>Attribute Value</TableCell>
                                <TableCell>Count</TableCell>
                                <TableCell>Style</TableCell>
                                <TableCell>Transparency</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>{displayBlocks ? displayBlocks : ''}</TableBody>
                    </Table>
                </div>
            ) : (
                ''
            )}
        </div>
    );
};
export default PolygonGraphics;
