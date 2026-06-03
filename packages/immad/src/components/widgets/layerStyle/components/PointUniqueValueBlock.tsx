// React imports
import React, { useEffect, useState } from 'react';
import { MenuItem, TableCell, TableRow } from '@mui/material';
import { InputField } from '../../../common';

import SymbolChooser from './SymbolChooser';

import UniqueValueInfo from '@arcgis/core/renderers/support/UniqueValueInfo';
import { PointObject3D, PointStyleEnum } from '../helpers/GraphicsHelper';
import PointSymbol3D from '@arcgis/core/symbols/PointSymbol3D';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import SimpleLineSymbol from '@arcgis/core/symbols/SimpleLineSymbol';
import Color from '@arcgis/core/Color';
import ObjectSymbol3DLayerResource = __esri.ObjectSymbol3DLayerResource;
import PointSymbol3DProperties = __esri.PointSymbol3DProperties;
import Symbol3DStyleOrigin = __esri.Symbol3DStyleOrigin;

type PointUniqueValueBlockProps = {
    onChange: (newUniqueValueInfo: UniqueValueInfo) => void;
    fieldCount: string;
    uniqueValueInfo: UniqueValueInfo;
    markerType: string;
};

const PointUniqueValueBlock = (props: PointUniqueValueBlockProps): JSX.Element => {
    const { onChange, fieldCount, uniqueValueInfo, markerType } = props;
    const [selectedColor, setSelectedColor] = useState<string>('#FF0000');
    const [selectedWidth, setSelectedWidth] = useState<number>(10000);
    const [twoDPointStyle, setTwoDPointStyle] = useState<PointStyleEnum>(PointStyleEnum.circle);
    const [threeDPointObject, setThreeDPointObject] = useState<PointObject3D>({
        name: 'sphere',
    } as PointObject3D);

    useEffect(() => {
        if (markerType && UniqueValueInfo) {
            let selectedColorToUse: string;
            let selectedWidthToUse: number;
            if (markerType === '2d') {
                selectedColorToUse = uniqueValueInfo.symbol?.color?.toHex();
                selectedWidthToUse = uniqueValueInfo.symbol?.size;
            } else {
                selectedColorToUse = uniqueValueInfo.symbol?.symbolLayers?.items[0]?.material?.color?.toHex();
                selectedWidthToUse = uniqueValueInfo.symbol?.symbolLayers?.items[0]?.width;
            }
            if (selectedWidthToUse) {
                setSelectedWidth(selectedWidthToUse);
            } else {
                setSelectedWidth(10000);
            }
            if (selectedColorToUse) {
                setSelectedColor(selectedColorToUse);
            } else {
                setSelectedColor('#FF0000');
            }
            if (markerType === '3d') {
                let baseMarkerType = {
                    name: 'sphere',
                } as PointObject3D;
                if (uniqueValueInfo.symbol) {
                    baseMarkerType = {
                        name: uniqueValueInfo.symbol.styleOrigin?.name,
                        href: uniqueValueInfo.symbol.symbolLayers?.items[0]?.resource.href,
                        styleUrl: uniqueValueInfo.symbol.styleOrigin?.styleUrl,
                    };
                }
                setThreeDPointObject(baseMarkerType);
            }
        }
    }, []);

    useEffect(() => {
        if (markerType === '2d') {
            const newSymbol = new SimpleMarkerSymbol();
            newSymbol.style = twoDPointStyle;
            newSymbol.size = selectedWidth;
            const newBorder = new SimpleLineSymbol();
            newBorder.width = 2;
            newSymbol.outline = newBorder;
            newSymbol.color = new Color(selectedColor);
            newBorder.color = new Color(selectedColor);
            const newUniqueValueInfo = new UniqueValueInfo();
            newUniqueValueInfo.symbol = newSymbol;
            newUniqueValueInfo.value = uniqueValueInfo.value;
            onChange(newUniqueValueInfo);
        } else {
            const newResource: ObjectSymbol3DLayerResource = {};

            if (threeDPointObject.href) {
                newResource.href = threeDPointObject.href;
            } else if (threeDPointObject.name) {
                newResource.primitive = threeDPointObject.name;
            }

            const newSymbolLayer = {
                type: 'object',
                resource: newResource,
                width: selectedWidth,
                height: undefined,
                depth: undefined,
                material: { color: new Color(selectedColor) },
            };

            const styleOrigin = {
                styleUrl: threeDPointObject.styleUrl,
                name: threeDPointObject.name,
            } as Symbol3DStyleOrigin;

            const newUniqueValueInfo = new UniqueValueInfo();
            newUniqueValueInfo.symbol = new PointSymbol3D({
                symbolLayers: [newSymbolLayer],
                styleOrigin: styleOrigin,
            } as PointSymbol3DProperties);
            newUniqueValueInfo.value = uniqueValueInfo.value;
            onChange(newUniqueValueInfo);
        }
    }, [selectedColor, selectedWidth, twoDPointStyle, threeDPointObject]);

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
                {markerType === '2d' ? (
                    <InputField
                        variant='outlined'
                        select
                        color='secondary'
                        title={'Point Style'}
                        value={twoDPointStyle}
                        onChange={(event) => {
                            setTwoDPointStyle(event.target.value as PointStyleEnum);
                        }}
                    >
                        <MenuItem key='circle' value='circle'>
                            Circle
                        </MenuItem>
                        <MenuItem key='cross' value='cross'>
                            Cross
                        </MenuItem>
                        <MenuItem key='square' value='square'>
                            Square
                        </MenuItem>
                        <MenuItem key='x' value='x'>
                            X
                        </MenuItem>
                        <MenuItem key='diamond' value='diamond'>
                            Diamond
                        </MenuItem>
                        <MenuItem key='triangle' value='triangle'>
                            Triangle
                        </MenuItem>
                    </InputField>
                ) : (
                    <SymbolChooser
                        onChange={(symbol) => {
                            setThreeDPointObject(symbol);
                        }}
                        selectedSymbol={threeDPointObject}
                    />
                )}
            </TableCell>
            <TableCell>
                <InputField
                    variant='outlined'
                    type='number'
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

export default PointUniqueValueBlock;
