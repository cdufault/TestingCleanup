import React, { useState, useEffect } from 'react';
import { ColumnCountData } from '../helpers/ActivityCountsFormHelper';
import { FieldGroup, InputField } from '../../../../common';

import { InputLabelWMargin } from '../../../../common/styles';

/**describes this component's inputs */
interface ColumnDataFormProps {
    /** selected column */
    selectedColumn: ColumnCountData;
    selectedColumnArrayIndexPos: number;
    /**callback to update the text in the seleted column label */
    updateColumnAttribute: (newValue: string, attribute: string, index: number) => void;
}

/**UI for collecting input needed to construct the rowColumns property of the count widget JSON */
export function ColumnDataForm(props: ColumnDataFormProps) {
    const { selectedColumnArrayIndexPos, selectedColumn, updateColumnAttribute } = props;

    const [columnData, setColumnData] = useState<ColumnCountData>({
        queryField: '',
        positionInTable: 1,
        columnLabel: '',
        query: '',
    });

    useEffect(() => {
        if (selectedColumn) {
            setColumnData({
                queryField: selectedColumn.queryField,
                positionInTable: selectedColumnArrayIndexPos + 1,
                columnLabel: selectedColumn.columnLabel,
                query: selectedColumn.query,
            });
        }
    }, [selectedColumn]);

    /**
     * Handler for the form input items change
     * @param event UI form update event
     */
    const handleColumnDataUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
        const attributeName = event.target.name;
        let value = event.target.value;
        setColumnData((prevData) => ({ ...prevData, [attributeName]: value }));
        updateColumnAttribute(value, attributeName, selectedColumnArrayIndexPos);
    };

    return (
        <>
            <FieldGroup>
                <InputLabelWMargin sx={{ marginBottom: '10px' }}>Column Label</InputLabelWMargin>
                <InputField
                    variant='outlined'
                    required
                    title={'Column label'}
                    placeholder=''
                    fullWidth
                    value={columnData.columnLabel}
                    autoComplete='off'
                    onChange={handleColumnDataUpdate}
                    helperText={'Required'}
                    name='columnLabel'
                    type='text'
                />
            </FieldGroup>
            <FieldGroup>
                <InputLabelWMargin sx={{ marginBottom: '10px' }}>Query</InputLabelWMargin>
                <InputField
                    variant='outlined'
                    required
                    title={'Query to apply or leave empty to count every row.'}
                    placeholder=''
                    fullWidth
                    value={columnData.query}
                    autoComplete='off'
                    onChange={handleColumnDataUpdate}
                    helperText={'Required'}
                    name='query'
                    type='string'
                />
            </FieldGroup>
        </>
    );
}
