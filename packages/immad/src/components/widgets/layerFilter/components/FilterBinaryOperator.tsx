/**
 * The component that represents a value of a filter expression.
 * @param props The properties for the component
 */
import {ActionButton} from '../../../common';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import MenuItem from '@mui/material/MenuItem';
import { FilterColumn } from './FilterColumn';
import { FilterBetweenValue, FilterValue, NodeOperator } from './FilterValue';
import XIcon from 'calcite-ui-icons-react/XIcon';
import { FilterableLayer } from '../LayerFilter';
import { FilterTimeInterval } from './FilterTimeInterval';
import { FilterTimeExpression } from './FilterTimeExpression';
import { ErrorBoundary } from '../../../common/ErrorBoundary';
import {
    StyledGroupActions,
    StyledGroupContent,
    StyledSquareIconButton,
    StyledSubclause
} from '../styles';
import {Select, SelectChangeEvent} from '@mui/material';
import GroupItemsIcon from 'calcite-ui-icons-react/GroupItemsIcon';
import UngroupItemsIcon from 'calcite-ui-icons-react/UngroupItemsIcon';
import FilterIcon from 'calcite-ui-icons-react/FilterIcon';
import BinaryNode = __esri.BinaryNode;
import SQLNode = __esri.SQLNode;
import FieldsIndex = __esri.FieldsIndex;
import ColumnNode = __esri.ColumnNode;
import Field = __esri.Field;
import StringNode = __esri.StringNode;
import NumberNode = __esri.NumberNode;
import DateNode = __esri.DateNode;
import NullNode = __esri.NullNode;
import ListNode = __esri.ListNode;
import TimeStampNode = __esri.TimeStampNode;
import CurrentTimeNode = __esri.CurrentTimeNode;

type CorrectedBinaryNode = Partial<BinaryNode> & { paren: boolean };
type CorrectedListNode = Partial<ListNode> & { value: { type: string, value: string | number }[] };

export interface FilterBinaryOperatorProps {
    node: BinaryNode;
    parent: BinaryNode;
    layer: FilterableLayer;
    handleAddNode: (root: SQLNode, child: SQLNode, operator: 'AND' | 'OR') => void;
    handleRemoveNode: (node: SQLNode) => void;
    handleGroupNodes: (node1: SQLNode, node2: SQLNode) => void;
    handleNodeUpdated: (node: SQLNode) => void;
    level?: number;
}

type FilterBinaryValueNode =
    | DateNode
    | TimeStampNode
    | StringNode
    | CurrentTimeNode
    | NumberNode
    | NullNode
    | ListNode
    | BinaryNode;

const defaultOps = ['IS', 'ISNOT'];
const logicalOps = ['AND', 'OR'];
const relOps = ['<>', '=', '<', '>', '<=', '>=', 'IN', 'NOT IN', 'BETWEEN', 'NOTBETWEEN'];
const timeIntervalOps = ['', '+', '-'];
const stringRelOps = ['LIKE', 'NOT LIKE'];

function isLogicalConnector(node: BinaryNode) {
    return (
        node &&
        node.left &&
        node.right &&
        node.left.type === 'binary-expression' &&
        node.right.type === 'binary-expression' &&
        (node.operator === 'AND' || node.operator === 'OR')
    );
}

export const FilterBinaryOperator = (props: FilterBinaryOperatorProps): JSX.Element => {
    const { node, layer, handleRemoveNode, handleGroupNodes, handleAddNode, parent } = props;

    const [operators, setOperators] = useState<string[]>(node.operator ? [node.operator] : []);

    const [op, setOp] = useState<NodeOperator>(node.operator);

    const [paren, setParen] = useState<boolean>((node as CorrectedBinaryNode)?.paren);

    /**
     * Used to help determine the value controls e.g. date control, numeric text box, etc.
     */
    const [opType, setOpType] = useState<'date' | 'string' | 'number'>();

    const getFieldForColumn = useCallback(
        (columnName: string): Field => {
            const fieldsIndex: FieldsIndex = (layer as FilterableLayer).fieldsIndex;
            return fieldsIndex.get(columnName);
        },
        [layer]
    );

    /**
     * For binary operators with a column-reference, this refers to the field the column is referencing.
     */
    const [field, setField] = useState<Field | null>(
        node.left?.type === 'column-reference' ? getFieldForColumn(node.left.column) : null
    );

    /**
     * Used for spacing when rendering to show nested expressions
     */
    const elevation = props.level ?? 0;

    const handleNodeUpdated = () => {
        props.handleNodeUpdated({ ...node });
    };

    const getOperatorsFromField = useCallback(() => {
        if (isLogicalConnector(node)) {
            return logicalOps;
        } else if (field) {
            switch (field.type) {
                case 'xml':
                case 'global-id':
                case 'string':
                    return [...relOps, ...stringRelOps, ...defaultOps];
                case 'oid':
                case 'double':
                case 'small-integer':
                case 'single':
                case 'integer':
                case 'long':
                case 'date':
                    return [...relOps, ...defaultOps];
                default:
                    return defaultOps;
            }
        }
        return [...relOps, ...stringRelOps, ...defaultOps];
    }, [node, field]);

    const getNodeFromField = useCallback(
        (originalNode: FilterBinaryValueNode, field: Field): FilterBinaryValueNode => {
            if (field) {
                switch (field.type) {
                    case 'xml':
                    case 'global-id':
                    case 'string': {
                        return originalNode?.type === 'string'
                            ? originalNode
                            : ({
                                  type: 'string',
                                  value: '',
                              } as StringNode);
                    }
                    case 'oid': // fall through
                    case 'double': // fall through
                    case 'small-integer': // fall through
                    case 'single': // fall through
                    case 'integer': // fall through
                    case 'long': {
                        // fall through
                        return originalNode?.type === 'number'
                            ? originalNode
                            : ({
                                  type: 'number',
                                  value: 0,
                              } as NumberNode);
                    }
                    case 'date': {
                        const currentTimeNode = {
                            type: 'current-time',
                            mode: 'timestamp',
                        } as CurrentTimeNode;

                        if (!originalNode) {
                            return currentTimeNode;
                        }

                        if (
                            originalNode.type !== 'date' &&
                            originalNode.type !== 'current-time' &&
                            originalNode.type !== 'timestamp' &&
                            !(originalNode.type === 'binary-expression' && originalNode.right.type === 'interval')
                        ) {
                            return currentTimeNode;
                        } else {
                            return originalNode;
                        }
                    }
                    default:
                        return originalNode;
                }
            }

            return originalNode;
        },
        [field]
    );

    /**
     * Update the node type based on the operator type when it is changed.
     * In some cases, the filter value node type needs to be changed when the operator changes.
     */
    useEffect(() => {
        if (op) {
            if (field) {
                switch (op) {
                    case 'AND':
                    case 'OR':
                        break;

                    case 'IS': // fall through
                    case 'ISNOT': {
                        node.right = {
                            type: 'null',
                            value: null,
                        } as NullNode;
                        break;
                    }
                    case 'BETWEEN': // fall through
                    case 'NOTBETWEEN': // fall through
                        if (node.right.type !== 'expression-list') {
                            const exprListNode = {
                                type: 'expression-list',
                                value: [],
                            } as CorrectedListNode;
                            node.right = exprListNode as ListNode;
                        }
                        break;
                    case 'IN': // fall through
                    case 'NOT IN': {
                        if (node.right.type !== 'expression-list') {
                            const exprListNode = {
                                type: 'expression-list',
                                value: [node.right],
                            } as CorrectedListNode;
                            node.right = exprListNode as ListNode;
                        }
                        break;
                    }
                    case '<>':
                    case '=':
                    case '<':
                    case '>':
                    case '<=':
                    case '>=':
                    case 'LIKE':
                    case 'NOT LIKE':
                    default: {
                        if (node.right.type === 'expression-list') {
                            try {
                                // @ts-ignore value[] missing in ListNode type
                                node.right = node.right.value[0];
                            } catch (e) {
                                console.error(e.message, e);
                            }
                        }
                        node.right = getNodeFromField(node.right as FilterBinaryValueNode, field);
                    }
                }
            }

            node.operator = op;
            handleNodeUpdated();
        }
    }, [op, field]);

    useEffect(() => {
        const parentNode = node as CorrectedBinaryNode;
        parentNode.paren = paren;
        handleNodeUpdated();
    }, [paren]);

    useEffect(() => {
        if (node) {
            const operators =
                node.left.type === 'current-time' || node.left.type === 'timestamp' || node.left.type === 'date'
                    ? timeIntervalOps
                    : getOperatorsFromField();

            setOperators(operators);
            setOp(operators.includes(node.operator) ? node.operator : '=');

            const parentNode = node as CorrectedBinaryNode;
            setParen(parentNode.paren);
        }
    }, [node, field]);

    const removeNode = useCallback((): void => {
        handleRemoveNode(node);
    }, [handleRemoveNode, node]);

    useEffect(() => {
        if (field) {
            switch (field.type) {
                case 'date':
                    setOpType((oldOpType) => {
                        if (oldOpType) {
                            if (node.right.type === 'expression-list') {
                                const listNode = node.right as CorrectedListNode;
                                listNode.value = [];
                            }
                        }
                        return 'date';
                    });
                    break;
                case 'string':
                case 'xml':
                case 'guid':
                    setOpType((oldOpType) => {
                        if (oldOpType) {
                            if (node.right.type === 'expression-list') {
                                const listNode = node.right as CorrectedListNode;
                                listNode.value = [];
                            }
                        }
                        return 'string';
                    });
                    break;
                default:
                    setOpType((oldOpType) => {
                        if (oldOpType) {
                            if (node.right.type === 'expression-list') {
                                const listNode = node.right as CorrectedListNode;
                                listNode.value = [];
                            }
                        }
                        return 'number';
                    });
            }
        }
    }, [field]);

    const getLeafNode = (parent: SQLNode, node: SQLNode): JSX.Element => {
        function handleColumnReferenceNodeUpdated(columnNode: ColumnNode) {
            if (columnNode.type === 'column-reference') {
                const field = getFieldForColumn(columnNode.column);
                if (field) {
                    setField(field);
                    handleNodeUpdated();
                }
            }
            return;
        }

        if (node) {
            switch (node.type) {
                case 'interval': {
                    return <FilterTimeInterval node={node} handleNodeUpdated={handleNodeUpdated} />;
                }
                case 'column-reference': {
                    return (
                        <FilterColumn layer={layer} node={node} handleNodeUpdated={handleColumnReferenceNodeUpdated} />
                    );
                }
                case 'current-time': // fallthrough
                case 'date': // fallthrough
                case 'timestamp': // fallthrough
                case 'boolean': // fallthrough
                case 'string': // fallthrough
                case 'null': // fallthrough
                case 'number': // fallthrough
                case 'expression-list': {
                    return op === 'BETWEEN' || op === 'NOTBETWEEN' ? (
                        <FilterBetweenValue
                            node={node as ListNode}
                            handleNodeUpdated={handleNodeUpdated}
                            valueType={opType ?? 'string'}
                            layer={layer}
                            field={field}
                            op={op}
                        />
                    ) : (
                        <FilterValue
                            node={node as ListNode}
                            handleNodeUpdated={handleNodeUpdated}
                            valueType={opType ?? 'string'}
                            layer={layer}
                            field={field}
                            op={op}
                        />
                    );
                }
                case 'binary-expression': {
                    if (node.right.type === 'interval') {
                        return <FilterTimeExpression node={node} handleNodeUpdated={handleNodeUpdated} />;
                    }

                    return (
                        <FilterBinaryOperator
                            node={node}
                            parent={parent as BinaryNode}
                            layer={layer}
                            level={elevation + 1}
                            handleRemoveNode={handleRemoveNode}
                            handleGroupNodes={handleGroupNodes}
                            handleNodeUpdated={handleNodeUpdated}
                            handleAddNode={handleAddNode}
                        />
                    );
                }
            }
        }
        return <></>;
    };

    const handleOpChanged = useCallback(
        (event : SelectChangeEvent<NodeOperator>) => {
            setOp((op) => {
                const newOp = event.target.value as NodeOperator;
                if (newOp === 'NOT IN' || newOp === 'IN') {
                    if (op !== 'NOT IN' && op !== 'IN') {
                        const listNode = node.right as CorrectedListNode;
                        if(listNode) {
                            listNode.value = [];
                        }
                    }
                } else {
                    if (op === 'NOT IN' || op === 'IN') {
                        const listNode = node.right as CorrectedListNode;
                        if(listNode) {
                            listNode.value = [];
                        }
                    }
                }
                return event.target.value as NodeOperator;
            });
        },
        [node]
    );

    const binaryNodeContent = (
        <>
            {getLeafNode(node, node.left)}

            <StyledSubclause>
                <Select
                    fullWidth
                    variant='outlined'
                    color='secondary'
                    value={op}
                    onChange={handleOpChanged}>
                    {operators?.map((op) => (
                        <MenuItem key={op} value={op} title={op}>
                            {op}
                        </MenuItem>
                    ))}
                </Select>
            </StyledSubclause>

            {getLeafNode(node, node.right)}
        </>
    );

    const content = useMemo(() => {
        return !isLogicalConnector(node) ? (
            <StyledSubclause>
                <StyledSquareIconButton
                    disableRipple
                    title={paren ? 'Ungroup' : 'Group'}
                    onClick={() => setParen((paren) => !paren)}
                >
                    {paren ? <GroupItemsIcon size={16} /> : <UngroupItemsIcon size={16} />}
                </StyledSquareIconButton>
                {binaryNodeContent}
                <StyledSquareIconButton disableRipple title='Remove Clause' onClick={removeNode}>
                    <XIcon size={16} />
                </StyledSquareIconButton>
            </StyledSubclause>
        ) : (
            <div>{binaryNodeContent}</div>
        );
    }, [binaryNodeContent]);

    return (
        <ErrorBoundary>
            {(node as CorrectedBinaryNode)?.paren ? (
                <StyledGroupContent variant={'outlined'}>

                    {content}

                    <StyledGroupActions>
                        <ActionButton
                            size='small'
                            title={'Ungroup'}
                            variant='outlined'
                            onClick={() => setParen((paren) => !paren)}
                            startIcon={<UngroupItemsIcon size={16} />}
                        >
                            Ungroup All
                        </ActionButton>

                        <ActionButton
                            size='small'
                            title='Add Filter'
                            onClick={() => handleAddNode(parent, node, 'AND')}
                            variant='outlined'
                            type='button'
                            startIcon={<FilterIcon size={16} />}
                        >
                            <i>Add</i>
                        </ActionButton>
                    </StyledGroupActions>

                </StyledGroupContent>
            ) : (
                <div>{content}</div>
            )}
        </ErrorBoundary>
    );
};
