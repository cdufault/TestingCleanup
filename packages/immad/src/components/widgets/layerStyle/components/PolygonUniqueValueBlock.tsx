// React imports
import React, { ChangeEvent, useEffect, useState } from 'react';
import { MenuItem, Slider, TableCell, TableRow } from '@mui/material';
import { InputField } from '../../../common';
import UniqueValueInfo from '@arcgis/core/renderers/support/UniqueValueInfo';
import { PolygonStyleEnum } from '../helpers/GraphicsHelper';
import { StyledSliderContainer } from '../styles';
import Color from '@arcgis/core/Color';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';

type UniqueValueBlockProps = {
    onChange: (newUniqueValueInfo: UniqueValueInfo) => void;
    fieldCount: string;
    uniqueValueInfo: UniqueValueInfo;
};
type styleType =
    | 'backward-diagonal'
    | 'cross'
    | 'diagonal-cross'
    | 'forward-diagonal'
    | 'horizontal'
    | 'none'
    | 'solid'
    | 'vertical';

const PolygonUniqueValueBlock = (props: UniqueValueBlockProps): JSX.Element => {
    const { onChange, fieldCount, uniqueValueInfo } = props;

    const [selectedColor, setSelectedColor] = useState<string>(uniqueValueInfo.symbol.color.toHex());
    const [selectedStyle, setSelectedStyle] = useState<styleType>(uniqueValueInfo.symbol.style);
    const [selectedTransparency, setSelectedTransparency] = useState<number>(1);

    useEffect(() => {
        const newUniqueValueInfo = new UniqueValueInfo();
        const newSymbol = new SimpleFillSymbol();
        newSymbol.color = new Color(selectedColor);
        newSymbol.style = selectedStyle;
        newSymbol.color.a = selectedTransparency;
        newUniqueValueInfo.symbol = newSymbol;
        newUniqueValueInfo.value = uniqueValueInfo.value;
        onChange(newUniqueValueInfo);
    }, [selectedColor, selectedStyle, selectedTransparency]);

    const handleTransparencyChange = (event: ChangeEvent<HTMLInputElement>, newValue: number) => {
        setSelectedTransparency(newValue);
    };

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
                    title={'Style'}
                    value={selectedStyle}
                    onChange={(event) => {
                        setSelectedStyle(event.target.value as PolygonStyleEnum);
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
                </InputField>
            </TableCell>
            <TableCell>
                <StyledSliderContainer>
                    <Slider
                        color='secondary'
                        value={selectedTransparency}
                        step={0.1}
                        marks={true}
                        min={0}
                        max={1}
                        valueLabelDisplay='auto'
                        onChange={handleTransparencyChange}
                    />
                </StyledSliderContainer>
            </TableCell>
        </TableRow>
    );
};

export default PolygonUniqueValueBlock;
