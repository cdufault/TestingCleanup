import React, { useState, useEffect } from 'react';
import MenuItem from '@mui/material/MenuItem';
import {
    FilterOperation,
    FilterOperationKeys_Date,
    FilterOperationKeys_Number,
    FilterOperationKeys_String,
} from '../helpers/filterOperations';
import { FilterColumnType, FilterExpression as FilterExpressionType } from '../resources';
import { FilterExpressionSelect } from '../styles';
import { InputField } from '../../../common';
import XIcon from 'calcite-ui-icons-react/XIcon';
import { IconButton } from '@mui/material';

/**
 * Defines the input properties for the FilterExpression component
 */
interface FilterExpressionProps {
    expression: FilterExpressionType;
    removeExpressionFunction: () => void;
}

const stringOperationOptions: JSX.Element[] = [
    <MenuItem key='none' value='' />,
    ...FilterOperationKeys_String.map((key) => (
        <MenuItem key={key} value={key}>
            {FilterOperation[key].value}
        </MenuItem>
    )),
];

const numberOperationOptions: JSX.Element[] = [
    <MenuItem key='none' value='' />,
    ...FilterOperationKeys_Number.map((key) => (
        <MenuItem key={key} value={key}>
            {FilterOperation[key].value}
        </MenuItem>
    )),
];

const dateOperationOptions: JSX.Element[] = [
    <MenuItem key='none' value='' />,
    ...FilterOperationKeys_Date.map((key) => (
        <MenuItem key={key} value={key}>
            {FilterOperation[key].value}
        </MenuItem>
    )),
];

/**
 * The component that visualizes the single filter clause.
 * @param props The properties for the component
 */
const FilterExpression = (props: FilterExpressionProps): JSX.Element => {
    const { expression, removeExpressionFunction } = props;

    const [columnName, setColumnName] = useState<string>(expression.column.name);

    const [filterValue, setFilterValue] = useState<string | number | string[] | number[]>(expression.value);

    const [operationOptions, setOperationOptions] = useState<JSX.Element[]>();

    const [selectedOperation, setSelectedOperation] = useState<string>('');

    const [columnType, setColumnType] = useState<FilterColumnType>();

    function setFilterOperations(colType: FilterColumnType): void {
        switch (colType) {
            case 'STRING':
                setOperationOptions(stringOperationOptions);
                break;
            case 'NUMBER':
                setOperationOptions(numberOperationOptions);
                break;
            case 'DATE':
                setOperationOptions(dateOperationOptions);
                break;
            default:
                setOperationOptions(stringOperationOptions);
        }
    }

    function getColumnType(columnType: string): FilterColumnType {
        switch (columnType) {
            case 'string':
            case 'blob':
            case 'xml':
                return 'STRING';
            case 'date':
                return 'DATE';
            case 'double':
            case 'integer':
            case 'long':
            case 'single':
            case 'small-integer':
            case 'oid':
                return 'NUMBER';
            default:
                return 'OTHER';
        }
    }

    useEffect(() => {
        const column = expression.columns.find((column) => column.name === columnName);
        if (column) {
            const columnType = getColumnType(column.type);
            setFilterOperations(columnType);
        } else {
            setFilterOperations('OTHER');
        }

        // Intentionally not setting the expression.operation in the useState constructor
        // to avoid the select value from being set before the options are populated.
        setSelectedOperation(expression.operation);
    }, []);

    useEffect(() => {
        //Update the filter operation options based on the column data type.
        let columnType: FilterColumnType = 'OTHER';
        for (let i = 0; i < expression.columns.length; i++) {
            if (expression.columns[i].name === columnName) {
                columnType = getColumnType(expression.columns[i].type);
                break;
            }
        }
        setFilterOperations(columnType);
        setColumnType(columnType);
    }, [columnName]);

    useEffect(() => {
        const updateProps = {
            id: expression.id,
            columnName: columnName,
            operation: selectedOperation,
            value: filterValue,
            expressionSetId: expression.expressionSetId,
        };
        expression.onFilterExpressionUpdate(updateProps);
    }, [filterValue, selectedOperation, columnName]);

    const handleRemoveFilter = (): void => {
        removeExpressionFunction();
    };

    return (
        <form className='expression-form'>
            <FilterExpressionSelect
                variant='outlined'
                color='secondary'
                title='Select the column to filter on.'
                onChange={(evt) => setColumnName(evt.target.value as string)}
                value={columnName}
            >
                {props.expression.columns.map((column) => (
                    <MenuItem key={column.name} value={column.name}>
                        {column.alias}
                    </MenuItem>
                ))}
            </FilterExpressionSelect>
            <FilterExpressionSelect
                variant='outlined'
                color='secondary'
                title='Select the filter operation.'
                onChange={(evt) => setSelectedOperation(evt.target.value as string)}
                value={selectedOperation}
            >
                {operationOptions}
            </FilterExpressionSelect>
            <InputField
                variant='outlined'
                placeholder='Filter Value'
                size='small'
                color='secondary'
                type={columnType === 'NUMBER' ? 'number' : 'string'}
                title='Enter the value for the filter.'
                onChange={(evt) => {
                    setFilterValue(evt.target.value);
                }}
                value={filterValue}
            />
            <IconButton title='Remove Filter' onClick={handleRemoveFilter}>
                <XIcon size={16} />
            </IconButton>
        </form>
    );
};

export default FilterExpression;
