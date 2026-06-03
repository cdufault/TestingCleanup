// React imports
import React, { useEffect, useState } from 'react';
import MenuItem from '@mui/material/MenuItem';
import { FieldGroup, InputField, InputLabel } from '../../../common';
import { FormControlLabel, Radio, RadioGroup, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import SimpleRenderer from '@arcgis/core/renderers/SimpleRenderer';
import SimpleLineSymbol from '@arcgis/core/symbols/SimpleLineSymbol';
import UniqueValueRenderer from '@arcgis/core/renderers/UniqueValueRenderer';
import UniqueValueInfo from '@arcgis/core/renderers/support/UniqueValueInfo';
import {
    GraphicsProps,
    LineStyleEnum,
    SelectionType,
    UniqueValueBlockProps,
    getColorRampMenuItems,
    queryLayerStatistics,
    loadOriginalUniqueRenderer,
} from '../helpers/GraphicsHelper';
import LineUniqueValueBlock from './LineUniqueValueBlock';
import Color from '@arcgis/core/Color';
import * as colorRamps from '@arcgis/core/smartMapping/symbology/support/colorRamps';
import { useSnackbar } from 'notistack';
import Field from '@arcgis/core/layers/support/Field';
import { COLOR_RAMP_TAGS } from '../helpers/SymbolChooserHelper';

const LineGraphics = (props: GraphicsProps): JSX.Element => {
    const { onChange, originalRenderer, layer } = props;

    const { enqueueSnackbar } = useSnackbar();

    const [selectedStyle, setSelectedStyle] = useState<LineStyleEnum>(LineStyleEnum.solid);
    const [selectedColor, setSelectedColor] = useState<string>('#FF0000');
    const [selectedWidth, setSelectedWidth] = useState<number>(1);
    const [colorRampMenuItems, setColorRampMenuItems] = useState<JSX.Element[]>();
    const [styleSelection, setStyleSelection] = useState<SelectionType>('location');
    const [selectedAttributeId, setSelectedAttributeId] = useState<string | undefined>();
    const [selectedColorRampId, setSelectedColorRampId] = useState<string | undefined>();
    const [uniqueValueBlocks, setUniqueValueBlocks] = useState<UniqueValueBlockProps[]>();
    const [rampColorTag, setRampColorTag] = useState<string>();
    const [rampShade, setRampShade] = useState<string>();
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
        if (styleSelection === 'location') {
            const newRenderer = new SimpleRenderer();
            const newSymbol = new SimpleLineSymbol();
            newSymbol.style = selectedStyle as LineStyleEnum;
            // get rgba value from hex
            const color = Color.fromHex(selectedColor);
            newSymbol.color = new Color(color);
            newSymbol.width = selectedWidth;
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
    }, [selectedStyle, selectedColor, selectedWidth, uniqueValueBlocks, styleSelection]);

    useEffect(() => {
        queryFeatures();
    }, [selectedAttributeId, styleSelection, layer]);

    useEffect(() => {
        if (selectedColorRampId && selectedColorRampId !== 'none' && uniqueValueBlocks) {
            const colorRamp = colorRamps.byName(selectedColorRampId).colors;
            const newUniqueValueBlocks: UniqueValueBlockProps[] = [];
            for (let index = 0; index < uniqueValueBlocks.length; index++) {
                const uniqueValueInfo = new UniqueValueInfo();
                const newSymbol = new SimpleLineSymbol();
                const oldSymbol = uniqueValueBlocks[index].uniqueValueInfo.symbol as SimpleLineSymbol;
                newSymbol.style = oldSymbol.style;
                newSymbol.width = oldSymbol.width;
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
                    <LineUniqueValueBlock
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
            const symbol = oRenderer.symbol as SimpleLineSymbol;
            setSelectedStyle(symbol.style as LineStyleEnum);
            setSelectedColor(symbol.color.toHex());
            setSelectedWidth(symbol.width);
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
                        const newSymbol = new SimpleLineSymbol();
                        newSymbol.style = selectedStyle ? selectedStyle : 'solid';
                        newSymbol.width = selectedWidth ? selectedWidth : 1;
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
                    <div hidden={true}>
                        <InputField
                            variant='outlined'
                            select
                            fullWidth
                            color='secondary'
                            title={'Point Style'}
                            value={selectedStyle}
                            onChange={(event) => {
                                setSelectedStyle(event.target.value as LineStyleEnum);
                            }}
                        >
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
                        <InputLabel>Color</InputLabel>
                        <InputField
                            style={{ width: 75 }}
                            variant='outlined'
                            type='color'
                            id='innerColor'
                            size='medium'
                            value={selectedColor}
                            onChange={(event) => {
                                setSelectedColor(event.target.value);
                            }}
                        />
                    </div>
                    <div>
                        <InputLabel>Line Width</InputLabel>
                        <InputField
                            variant='outlined'
                            type='number'
                            helperText='Optional'
                            fullWidth
                            size='small'
                            color='secondary'
                            value={selectedWidth}
                            onChange={(event) => {
                                setSelectedWidth(parseInt(event.target.value));
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

                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Color</TableCell>
                                <TableCell>Attribute Value</TableCell>
                                <TableCell>Count</TableCell>
                                <TableCell>Style</TableCell>
                                <TableCell>Width</TableCell>
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
export default LineGraphics;
