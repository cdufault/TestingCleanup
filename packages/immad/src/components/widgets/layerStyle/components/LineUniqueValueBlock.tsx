// React imports
import React, { useEffect, useState } from 'react';
import { MenuItem, TableCell, TableRow } from '@mui/material';
import { InputField } from '../../../common';
import UniqueValueInfo from '@arcgis/core/renderers/support/UniqueValueInfo';
import { LineStyleEnum } from '../helpers/GraphicsHelper';
import Color from '@arcgis/core/Color';
import SimpleLineSymbol from '@arcgis/core/symbols/SimpleLineSymbol';

type UniqueValueBlockProps = {
    onChange: (newUniqueValueInfo: UniqueValueInfo) => void;
    fieldCount: string;
    uniqueValueInfo: UniqueValueInfo;
};

const LineUniqueValueBlock = (props: UniqueValueBlockProps): JSX.Element => {
    const { onChange, fieldCount, uniqueValueInfo } = props;

    const [selectedColor, setSelectedColor] = useState<string>(uniqueValueInfo.symbol?.color?.toHex());
    const [selectedStyle, setSelectedStyle] = useState<string>(uniqueValueInfo.symbol?.style);
    const [selectedWidth, setSelectedWidth] = useState<number>(uniqueValueInfo.symbol?.width);

    useEffect(() => {
        const newUniqueValueInfo = new UniqueValueInfo();
        const newSymbol = new SimpleLineSymbol();
        newSymbol.color = new Color(selectedColor);
        newSymbol.style = selectedStyle as LineStyleEnum;
        newSymbol.width = selectedWidth;
        newUniqueValueInfo.symbol = newSymbol;
        newUniqueValueInfo.value = uniqueValueInfo.value;
        onChange(newUniqueValueInfo);
    }, [selectedColor, selectedStyle, selectedWidth]);

    return (
        <TableRow>
            <TableCell>
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
            </TableCell>
            <TableCell>{uniqueValueInfo.value}</TableCell>
            <TableCell>{fieldCount}</TableCell>
            <TableCell>
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
            </TableCell>
            <TableCell>
                <InputField
                    variant='outlined'
                    type='number'
                    fullWidth
                    size='small'
                    color='secondary'
                    value={selectedWidth}
                    onChange={(event) => {
                        setSelectedWidth(parseInt(event.target.value));
                    }}
                />
            </TableCell>
        </TableRow>
    );
};

export default LineUniqueValueBlock;
