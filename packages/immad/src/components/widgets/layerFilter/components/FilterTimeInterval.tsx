import React, { useEffect, useState } from 'react';
import { FilterValue, ValueNode } from './FilterValue';
import MenuItem from '@mui/material/MenuItem';

import IntervalNode = __esri.IntervalNode;
import IntervalPeriodNode = __esri.IntervalPeriodNode;
import IntervalQualifierNode = __esri.IntervalQualifierNode;
import StringNode = __esri.StringNode;
import SQLNode = __esri.SQLNode;
import { Select } from '@mui/material';

type IntervalPeriodType = 'day' | 'hour' | 'second' | 'minute';
const intervalPeriods: IntervalPeriodType[] = ['day', 'hour', 'minute', 'second'];

export interface FilterTimeIntervalPeriodProps {
    node: IntervalPeriodNode | IntervalQualifierNode;
    handleNodeUpdated: (node: IntervalPeriodNode | IntervalQualifierNode) => void;
}

export const FilterTimeIntervalPeriod = (props: FilterTimeIntervalPeriodProps): JSX.Element => {
    const { node, handleNodeUpdated } = props;

    const [period, setPeriod] = useState<IntervalPeriodType>(node.period as IntervalPeriodType);

    useEffect(() => {
        setPeriod(node.period as IntervalPeriodType);
    }, [node]);

    useEffect(() => {
        if (period) {
            // @ts-ignore ListNode has value property
            node.period = period;
            handleNodeUpdated({ ...node, period: period });
        }
    }, [period]);

    return (
        <Select
            fullWidth
            variant='outlined'
            size={'small'}
            color='secondary'
            value={period}
            onChange={(event) => setPeriod(event.target.value as IntervalPeriodType)}
        >
            {intervalPeriods.map((period) => (
                <MenuItem key={period} value={period} title={period}>
                    {period}
                </MenuItem>
            ))}
        </Select>
    );
};

export interface FilterTimeIntervalProps {
    node: IntervalNode;
    handleNodeUpdated: (node: SQLNode) => void;
}

export const FilterTimeInterval = React.memo((props: FilterTimeIntervalProps): JSX.Element => {
    const { node, handleNodeUpdated } = props;

    const [value, setValue] = useState<StringNode>(node.value);
    const [qualifier, setQualifier] = useState<IntervalQualifierNode | IntervalPeriodNode>(node.qualifier);

    useEffect(() => {
        if (value) {
            node.value = value;
            handleNodeUpdated(node);
        }
    }, [value]);

    useEffect(() => {
        if (qualifier) {
            node.qualifier = qualifier;
            handleNodeUpdated(node);
        }
    }, [qualifier]);

    const handleValueNodeUpdated = (valueNode: ValueNode) => {
        setValue(valueNode);
    };

    const handleIntervalNodeUpdated = (intervalPeriodNode: IntervalPeriodNode | IntervalQualifierNode) => {
        setQualifier(intervalPeriodNode);
    };

    return (
        <>
            <FilterValue node={value} valueType={'number'} handleNodeUpdated={handleValueNodeUpdated} />
            {<FilterTimeIntervalPeriod node={qualifier} handleNodeUpdated={handleIntervalNodeUpdated} />}
        </>
    );
});
