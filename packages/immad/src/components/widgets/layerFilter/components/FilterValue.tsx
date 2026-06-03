/**
 * The component that represents a value of a filter expression.
 * @param props The properties for the component
 */
import { ActionButton, InputField } from '../../../common';
import React, { useEffect, useMemo, useState } from 'react';
import { LogHelper } from '../../../../helpers/logHelper';
import MenuItem from '@mui/material/MenuItem';
import NumberNode = __esri.NumberNode;
import StringNode = __esri.StringNode;
import BoolNode = __esri.BoolNode;
import NullNode = __esri.NullNode;
import ListNode = __esri.ListNode;
import DateNode = __esri.DateNode;
import TimeStampNode = __esri.TimeStampNode;
import CurrentTimeNode = __esri.CurrentTimeNode;
import { FilterTimeExpression } from './FilterTimeExpression';
import {StyledDatePicker, StyledExpressionListDiv, StyledInput, StyledSubclause} from '../styles';
import { convertLocalToUTCDate, convertUTCToLocalDate } from '../../../../helpers/dateTimeHelper';
import BinaryNode = __esri.BinaryNode;
import {IconButton, Paper, Select, Typography} from '@mui/material';
import TrashIcon from 'calcite-ui-icons-react/TrashIcon';
import CodedValueDomain = __esri.CodedValueDomain;
import RangeDomain = __esri.RangeDomain;
import Field = __esri.Field;
import CodedValue = __esri.CodedValue;
import AsyncFeatureValue from "./AsyncFeatureValue";
import Layer from "@arcgis/core/layers/Layer";

export type ValueNode =
    | NumberNode
    | StringNode
    | BoolNode
    | DateNode
    | TimeStampNode
    | CurrentTimeNode
    | NullNode
    | ListNode
    | BinaryNode;

export type NodeOperator =
    | 'AND'
    | 'OR'
    | 'IS'
    | 'ISNOT'
    | 'IN'
    | 'NOT IN'
    | 'BETWEEN'
    | 'NOTBETWEEN'
    | 'LIKE'
    | 'NOT LIKE'
    | '<>'
    | '<'
    | '>'
    | '>='
    | '<='
    | '='
    | '*'
    | '-'
    | '+'
    | '/';

export interface FilterValueProps {
    node: ValueNode;
    handleNodeUpdated: (node: ValueNode) => void;
    valueType?: 'number' | 'string' | 'date';
    layer?: Layer;
    field?: Field | null;
    op?: NodeOperator | null;
}

export interface FilterBetweenValueProps {
    node: ListNode;
    handleNodeUpdated: (node: ListNode) => void;
    valueType: 'number' | 'string' | 'date';
    layer?: Layer;
    field?: Field | null;
    op?: NodeOperator | null;
}

const parseDateValue = (node: DateNode | TimeStampNode | CurrentTimeNode): Date => {
    if (node.type === 'timestamp' || node.type === 'date') {
        try {
            const timestamp = Date.parse(node.type === 'timestamp' ? node.value + 'Z' : node.value);
            if (!isNaN(timestamp)) {
                const date = new Date(timestamp);
                if (date.toString() !== 'Invalid Date') {
                    return date;
                }
            }
        } catch (e) {
            LogHelper.log(e.message, true);
        }
    }
    return new Date();
};

const dateToString = (dateValue: Date, type: 'date' | 'timestamp'): string | undefined => {
    try {
        if (dateValue) {
            const isoString = dateValue.toISOString();
            // yyyy-mm-dd
            const isoDates = isoString.split('T');
            const dateStr = isoDates[0];
            if (type === 'date') {
                return dateStr;
            } else {
                const timeStr = isoDates[1].substr(0, 8);
                return dateStr + ' ' + timeStr;
            }
        }
    } catch (e) {
        LogHelper.log(e.message);
    }
    return undefined;
};

export const FilterBetweenValue = (props: FilterBetweenValueProps): JSX.Element => {
    const { node, handleNodeUpdated, valueType, layer, field, op } = props;

    const getNode = (index: number, node: ListNode, valueType: 'number' | 'string' | 'date') => {
        try {
            if (Array.isArray(node.value)) {
                const value = node.value[index];
                if (value) {
                    return value;
                }
            }
        } catch (e) {
            LogHelper.log(e.message, true);
        }

        switch (valueType) {
            case 'date': {
                const date = new Date();
                return {
                    type: 'date',
                    value: dateToString(date, 'date'),
                };
            }
            case 'number': {
                return {
                    type: 'number',
                    value: '',
                };
            }
            default:
            case 'string': {
                return {
                    type: 'string',
                    value: '',
                };
            }
        }
    };

    const value1 = getNode(0, node, valueType);
    const value2 = getNode(1, node, valueType);

    return (
        <>
            <StyledExpressionListDiv >
                <FilterValue
                    node={value1}
                    valueType={valueType}
                    handleNodeUpdated={(tnode) => {
                        node.value = [tnode, value2];
                        handleNodeUpdated(node);
                    }}
                    layer={layer}
                    field={field}
                    op={op}
                />

                <Paper variant='outlined'>
                    <Typography>AND</Typography>
                </Paper>

                <FilterValue
                    node={value2}
                    valueType={valueType}
                    handleNodeUpdated={(tnode) => {
                        node.value = [value1, tnode];
                        handleNodeUpdated(node);
                    }}
                    layer={layer}
                    field={field}
                    op={op}
                />
            </StyledExpressionListDiv>
        </>
    );
};

const getNodeValue = (node: ValueNode): string | number => {
    if (node.type === 'expression-list') {
        // @ts-ignore
        if (Array.isArray(node.value)) {
            // @ts-ignore value is in ListNode
            return node.value.map((listNodeValue) => listNodeValue.value).join(',') ?? '';
        } else {
            // @ts-ignore value is in ListNode
            return node.value ?? '';
        }
    }

    return node.value ?? '';
};

export const FilterValue = (props: FilterValueProps): JSX.Element => {
    const { layer, node, handleNodeUpdated, valueType, field, op } = props;

    const type = node.type;
    const value = getNodeValue(node);

    const handleSetValue = (event) => {
        const newVal = event.target.value;
        node.value = node.type === 'number' ? Number(newVal) : node.type === 'string' ? String(newVal) : newVal;
        props.handleNodeUpdated({ ...node });
    };

    return useMemo(() => {
        switch (type) {
            case 'null':
                return (
                    <StyledInput
                        variant='outlined'
                        placeholder='Filter Value'
                        InputProps={{
                            readOnly: true,
                        }}
                        size={'small'}
                        color='secondary'
                        title='Enter the value for the filter.'
                        value={'NULL'}
                    />
                );
            case 'string':
                if(layer && field && !field.domain) {
                    return <AsyncFeatureValue
                        fieldName={field.name}
                        layer={layer}
                        value={value as string ?? ''}
                        node={node}
                        handleNodeUpdated={handleNodeUpdated}
                    />;
                }
                // fall through
            case 'number':
                const codedValueDomain = field?.domain as CodedValueDomain;
                // Only use "choice" operators where field either is or isnt equal to the value
                if (codedValueDomain && (op === '=' || op === '<>' || op === 'IN' || op === 'NOT IN')) {
                    return (
                        <InputField
                            fullWidth
                            variant='outlined'
                            size={'small'}
                            color='secondary'
                            value={node.value}
                            select
                            SelectProps={{
                                renderValue: (val: string | number) => codedValueDomain.getName(val)
                            }}
                            onChange={handleSetValue}
                        >
                            {codedValueDomain.codedValues.map((item: CodedValue) => (
                                <MenuItem
                                    key={item.code}
                                    value={item.code}
                                    title={item.name + ' (Code: ' + item.code + ')'}
                                >
                                    {item.name}
                                </MenuItem>
                            ))}
                        </InputField>
                    );
                } else {
                    const rangeDomain = field?.domain as RangeDomain;
                    const inputProps = rangeDomain ? { min: rangeDomain.minValue, max: rangeDomain.maxValue } : {};
                    return (
                        <InputField
                            fullWidth
                            variant='outlined'
                            type={valueType ?? 'string'}
                            InputProps={{ inputProps: inputProps }}
                            placeholder='Empty'
                            color='secondary'
                            size={'small'}
                            value={value}
                            onChange={handleSetValue}
                        />
                    );
                }
            case 'expression-list':
                return (
                    <StyledExpressionListDiv>
                        {
                            node.value.map((value, idx) => (
                                <StyledSubclause style={{display: 'inline-flex', width:'100%'}} key={idx}>
                                    <FilterValue
                                        node={value}
                                        layer={layer}
                                        field={field}
                                        op={op}
                                        valueType={value.type}
                                        handleNodeUpdated={(valueNode) => {
                                            node.value[idx] = valueNode;
                                            handleNodeUpdated(node);
                                        }}
                                    />
                                    <IconButton
                                        onClick={() => {
                                            node.value.splice(idx, 1);
                                            handleNodeUpdated(node);
                                        }}
                                    >
                                        <TrashIcon size={16} />
                                    </IconButton>
                            </StyledSubclause>
                            ))}
                        <StyledSubclause>
                            <ActionButton
                                style={{width: '100%'}}
                                variant='outlined'
                                onClick={() => {
                                    node.value = [
                                        ...node.value,
                                        { type: valueType ?? 'string', value: valueType === 'number' ? 0 : '' },
                                    ];
                                    handleNodeUpdated(node);
                                }}
                            >
                                ADD VALUE
                            </ActionButton>
                        </StyledSubclause>
                    </StyledExpressionListDiv>
                );
            case 'current-time':
            case 'date':
            case 'timestamp':
                return (
                    <FilterTimeExpression
                        node={node as DateNode | TimeStampNode | CurrentTimeNode}
                        handleNodeUpdated={(updatedNode) => {
                            handleNodeUpdated(updatedNode);
                        }}
                    />
                );
            case 'binary-expression':
                const binaryNode = node as BinaryNode;
                if (binaryNode.right.type === 'interval') {
                    return (
                        <FilterTimeExpression
                            node={binaryNode}
                            handleNodeUpdated={(updatedNode) => {
                                handleNodeUpdated(updatedNode);
                            }}
                        />
                    );
                }
                throw new Error('Unsupported right hand node type: ' + binaryNode.right?.type);
            default:
                throw new Error('Unsupported type: ' + node.type);
        }
    }, [node, type, handleNodeUpdated, valueType, field]);
};

export interface FilterDateValueProps {
    node: DateNode | TimeStampNode | CurrentTimeNode;
    handleNodeUpdated: (node: DateNode | TimeStampNode | CurrentTimeNode) => void;
}

interface TimeValueItem {
    id: string;
    label: string;
    node: any;
    format?: string;
}

const TIME_TYPES: TimeValueItem[] = [
    {
        id: 'current-time:timestamp',
        label: 'CURRENT_TIMESTAMP',
        node: {
            type: 'current-time',
            mode: 'timestamp',
        },
    },
    {
        id: 'current-time:date',
        label: 'CURRENT_DATE',
        node: {
            type: 'current-time',
            mode: 'date',
        },
    },
    {
        id: 'timestamp',
        label: 'TIMESTAMP',
        node: {
            type: 'timestamp',
        },
        format: 'yyyy-MM-dd HH:mm:ss',
    },
    {
        id: 'date',
        label: 'DATE',
        node: {
            type: 'date',
        },
        format: 'yyyy-MM-dd',
    },
];

const getItemType = (node: DateNode | TimeStampNode | CurrentTimeNode): TimeValueItem | undefined => {
    try {
        switch (node.type) {
            case 'current-time':
                return TIME_TYPES.find((item) => item.id === `${node.type}:${node.mode}`);
            default:
                return TIME_TYPES.find((item) => item.id === node.type);
        }
    } catch (e) {
        LogHelper.log(e.message, true);
        return TIME_TYPES[0];
    }
};

export const FilterDateValue = (props: FilterDateValueProps): JSX.Element => {
    const { node, handleNodeUpdated } = props;

    const [itemType, setItemType] = useState<TimeValueItem>(getItemType(node) ?? TIME_TYPES[0]);

    const dateValue = parseDateValue(node);

    useEffect(() => {
        const newNode = { ...itemType.node };
        if (newNode.type == 'timestamp' || newNode.type === 'date') {
            if (dateValue) {
                newNode.value = dateToString(dateValue, newNode.type);
            }
            delete node.mode;
        } else {
            delete node.value;
        }
        Object.assign(node, newNode);
        handleNodeUpdated(newNode);
    }, [itemType]);

    return (
        itemType &&
        node && (
            <>
                <Select
                    variant='outlined'
                    fullWidth
                    color='secondary'
                    value={itemType.id}
                    onChange={(event) => {
                        const item = TIME_TYPES.find((item) => item.id === event.target.value);
                        if (item) {
                            setItemType(item);
                        }
                    }}
                >
                    {TIME_TYPES.map((item) => (
                        <MenuItem key={item.id} value={item.id} title={item.label}>
                            {item.label}
                        </MenuItem>
                    ))}
                </Select>
                {
                    // dateTimeControl
                    (itemType === TIME_TYPES[2] || itemType === TIME_TYPES[3]) && dateValue && (
                        <StyledDatePicker
                            selected={convertUTCToLocalDate(dateValue)}
                            onChange={(dateVal) => {
                                const date = dateVal as Date;
                                if (date) {
                                    const utcDate = convertLocalToUTCDate(date);
                                    node.value = dateToString(utcDate, node.type);
                                    handleNodeUpdated({ ...node });
                                }
                            }}
                            dateFormat={itemType.format}
                            openToDate={convertUTCToLocalDate(dateValue)}
                            showTimeSelect={node.type === 'timestamp'}
                            timeFormat={'HH:mm'}
                            timeIntervals={15}
                        />
                    )
                }
            </>
        )
    );
};
