import React, { useCallback, useEffect, useState } from 'react';

import BinaryNode = __esri.BinaryNode;
import { FilterDateValue } from './FilterValue';
import { FilterTimeInterval } from './FilterTimeInterval';
import MenuItem from '@mui/material/MenuItem';
import IntervalNode = __esri.IntervalNode;
import DateNode = __esri.DateNode;
import TimeStampNode = __esri.TimeStampNode;
import CurrentTimeNode = __esri.CurrentTimeNode;
import { Select, Stack, ToggleButton } from '@mui/material';
import ClockForwardIcon from 'calcite-ui-icons-react/ClockForwardIcon';
import IntervalPeriodNode = __esri.IntervalPeriodNode;
import StringNode = __esri.StringNode;
import { ErrorBoundary } from '../../../common/ErrorBoundary';

export interface FilterTimeExpressionProps {
    node: BinaryNode | CurrentTimeNode | DateNode | TimeStampNode;
    handleNodeUpdated: (node: BinaryNode | CurrentTimeNode | DateNode | TimeStampNode, level?: number) => void;
}

export const FilterTimeExpression = (props: FilterTimeExpressionProps): JSX.Element => {
    const { node, handleNodeUpdated } = props;

    const [useInterval, setUseInterval] = useState<boolean>(
        node.type === 'binary-expression' && node.right.type === 'interval'
    );

    const [op, setOp] = useState<null | '-' | '+'>(
        node.type === 'binary-expression' && node.right.type === 'interval' ? (node.operator as '-' | '+') : '-'
    );

    useEffect(() => {
        if (useInterval) {
            if (node.type !== 'binary-expression') {
                const newNode = {
                    type: 'binary-expression',
                    left: { ...node },
                    operator: op,
                    right: {
                        type: 'interval',
                        op: '',
                        qualifier: {
                            type: 'interval-period',
                            period: 'day',
                        } as IntervalPeriodNode,
                        value: {
                            type: 'string',
                            value: '1',
                        } as StringNode,
                    } as IntervalNode,
                } as BinaryNode;

                for (const key in node) {
                    if (node.hasOwnProperty(key)) {
                        delete node[key];
                    }
                }

                Object.assign(node, newNode);
                handleNodeUpdated(newNode);
            }
        } else {
            if (node.type === 'binary-expression') {
                const binaryNode = node as BinaryNode;
                const leftNode = binaryNode.left;
                for (const key in node) {
                    if (node.hasOwnProperty(key)) {
                        delete node[key];
                    }
                }
                Object.assign(node, leftNode);
                handleNodeUpdated(leftNode as CurrentTimeNode | DateNode | TimeStampNode);
            }
        }
    }, [useInterval]);

    useEffect(() => {
        if (node.type === 'binary-expression') {
            // @ts-ignore op is a subset of operators so type is safe
            node.operator = op;
            // @ts-ignore op is a subset of operators so type is safe
            handleNodeUpdated({ ...node, operator: op });
        }
    }, [op]);

    const handleTimeNodeUpdated = useCallback(
        (timeNode) => {
            if (node.type === 'binary-expression') {
                node.left = timeNode;
                handleNodeUpdated({ ...node, left: { ...timeNode } });
            } else {
                handleNodeUpdated(timeNode);
            }
        },
        [node]
    );

    const handleTimeIntervalNodeUpdated = useCallback(
        (intervalNode: IntervalNode) => {
            if (node.type === 'binary-expression') {
                node.right = intervalNode;
                handleNodeUpdated({ ...node, right: { ...intervalNode } });
            }
        },
        [node]
    );

    const handleOpChanged = useCallback(
        (event) => {
            setOp(event.target.value as '-' | '+');
        },
        [op]
    );

    return (
        <ErrorBoundary>
            <Stack direction='row'>
                <FilterDateValue
                    node={
                        node.type === 'binary-expression'
                            ? (node.left as DateNode | TimeStampNode | CurrentTimeNode)
                            : (node as DateNode | TimeStampNode | CurrentTimeNode)
                    }
                    handleNodeUpdated={handleTimeNodeUpdated}
                />

                <ToggleButton
                    title={'Time Interval'}
                    value={useInterval}
                    selected={useInterval}
                    onChange={() => setUseInterval((useInterval) => !useInterval)}
                >
                    <ClockForwardIcon size={16} />
                </ToggleButton>
            </Stack>

            {useInterval && node.type === 'binary-expression' && node.right.type === 'interval' && (
                <Stack direction='row'>
                    <Select
                        variant='outlined'
                        size={'small'}
                        color='secondary'
                        // helperText={"Interval"}
                        value={op ?? '-'}
                        onChange={handleOpChanged}
                    >
                        <MenuItem key='-' value='-' title='Minus'>
                            MINUS
                        </MenuItem>
                        <MenuItem key='+' value='+' title='Plus'>
                            PLUS
                        </MenuItem>
                    </Select>
                    <FilterTimeInterval
                        node={node.right as IntervalNode}
                        handleNodeUpdated={handleTimeIntervalNodeUpdated}
                    />
                </Stack>
            )}
        </ErrorBoundary>
    );
};
