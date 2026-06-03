import React, { ChangeEvent, useEffect, useState } from 'react';
import { Box, MenuItem, Select, Slider, Switch } from '@mui/material';
import ImageryLayer from '@arcgis/core/layers/ImageryLayer';
import { InputField, InputGroup } from '../common';
import LayerView from '@arcgis/core/views/layers/LayerView';

/**
 * Imagery Layer variable to use as input for the Raster Query Builder
 * @param props
 * @constructor
 */
const ImageryLayerFactor = (props: {
    layerView: LayerView;
    onRangeChange: (
        layerView: LayerView,
        range: number[],
        title: string,
        enabled: boolean,
        logicalOperator: string
    ) => void;
}): JSX.Element => {
    const onRangeChange = props.onRangeChange;

    // Config
    const logicalOperators = ['AND', 'OR'];

    const [logicalOperator] = useState(logicalOperators[0]);

    const [min, setMin] = useState<number>(0);
    const [max, setMax] = useState<number>(100);

    const [rangeMin, setRangeMin] = useState<number>(0);
    const [rangeMax, setRangeMax] = useState<number>(100);

    //const [step, setStep] = useState<number>(1);
    const [marks, setMarks] = useState<any[]>([]);

    const [title, setTitle] = useState<string>((props.layerView as any).title);

    const [enabled, setEnabled] = useState<boolean>(false);

    useEffect(() => {
        onRangeChange(props.layerView, [rangeMin, rangeMax], title, enabled, logicalOperator);
    }, [enabled, rangeMin, rangeMax, title, logicalOperator, props.layerView]);

    useEffect(() => {
        if (props.layerView.layer) {
            setTitle(props.layerView.layer.title);
            const layer = props.layerView.layer as ImageryLayer;

            const rasterInfo = layer.serviceRasterInfo;
            if (rasterInfo && rasterInfo.statistics && rasterInfo.statistics.length > 0) {
                const stats = rasterInfo.statistics[0];

                setMax(stats.max);
                setMin(stats.min);
                //setStep(Math.ceil((stats.max - stats.min) / 10));

                const marks = [
                    {
                        value: stats.min,
                        label: stats.min,
                    },
                    {
                        value: stats.avg,
                        label: 'x̄',
                    },
                    {
                        value: stats.max,
                        label: stats.max,
                    },
                ];
                setMarks(marks);
                setRangeMin(stats.min);
                setRangeMax(stats.max);
            }
        }
    }, [props.layerView]);

    const handleMinChange = (event: ChangeEvent<HTMLInputElement>) => {
        setRangeMin(event.target.value === '' ? 0 : Number(event.target.value));
    };

    const handleMaxChange = (event: ChangeEvent<HTMLInputElement>) => {
        setRangeMax(event.target.value === '' ? 100 : Number(event.target.value));
    };

    const handleRangeChange = (event: ChangeEvent<HTMLInputElement>, newValue: number | number[]) => {
        const newRange = newValue as number[];
        if (newRange) {
            setRangeMin(newRange[0]);
            setRangeMax(newRange[1]);
        }
    };

    const handleSwitchChanged = (event: ChangeEvent<HTMLInputElement>) => {
        setEnabled(event.target.checked);
    };

    function onTitleChange(event: ChangeEvent<HTMLInputElement>) {
        setTitle(event.target.value);
    }

    return (
        <React.Fragment>
            <InputGroup>
                <Switch checked={enabled} onChange={handleSwitchChanged} />

                <InputField variant='outlined' value={title} size='small' fullWidth onChange={onTitleChange} />

                <Select defaultValue={'bt'} disabled color='secondary' variant='outlined'>
                    <option value={'bt'}>Between</option>
                    <option value={'nbt'}>Not Between</option>
                    <option value={'lt'}>Less Than</option>
                    <option value={'gt'}>Greater Than</option>
                </Select>

                <InputField
                    value={rangeMin}
                    variant='outlined'
                    size='small'
                    color='secondary'
                    onChange={handleMinChange}
                />

                <Select variant='outlined' color='secondary' disabled value={'AND'}>
                    {
                        <MenuItem key='AND' value='AND'>
                            And
                        </MenuItem>
                    }
                </Select>

                <InputField
                    value={rangeMax}
                    color='secondary'
                    variant='outlined'
                    size='small'
                    onChange={handleMaxChange}
                />
            </InputGroup>

            <Box m={1}>
                <Slider
                    color='secondary'
                    disabled={!enabled}
                    value={[rangeMin, rangeMax]}
                    min={min}
                    max={max}
                    marks={marks}
                    onChange={handleRangeChange}
                    valueLabelDisplay='off'
                />
            </Box>
        </React.Fragment>
    );
};

export default ImageryLayerFactor;
