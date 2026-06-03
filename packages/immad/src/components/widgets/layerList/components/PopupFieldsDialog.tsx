import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';

import {
    CancelButton,
    ApplyButton,
    StyledDialogActionButtonsContainer,
    StyledPopupFieldsHeaderBox,
    StyledPopupFieldsSelectionDialog,
    StyledFieldsDataGrid,
    StyledEditPromptBox,
} from '../styles';

/**
 * Interface to handle callback and input data coming from
 * where the modal dialog is initialized.
 */
interface PopupFieldsDialogProps {
    /**list of all the fields currently selected to be visible/displayed in the popup,
     * this list may be updated and a copy will be passed back to the caller in the
     * apply button click handler
     */
    selectedFieldNames: string[];

    /**list of all field names in the layer */
    fieldNames: string[];

    handleCancel: () => void;
    handleApply: (fieldsToUse: string[]) => void;

    /**mapping of field names to their alias names */
    fieldAliasesMap: Map<string, string>;

    /**mapping of field names to popup label values, note this is passed by reference to the
     * widget and will be updated and the caller will used the modified values
     */
    fieldLabelsMap: Map<string, string>;
}

/**
 * Modal Dialog for getting a URL input from the user.
 * @param props RenameLayerDialogProps
 * @constructor
 */
export default function PopupFieldsDialog(props: PopupFieldsDialogProps): JSX.Element {
    const { handleCancel, handleApply, selectedFieldNames, fieldNames, fieldAliasesMap, fieldLabelsMap } = props;
    const [dataRows, setDataRows] = useState<any[]>([]);
    const [columns, setColumns] = useState<any[]>([]);
    const [selectionModel, setSelectionModel] = useState<number[]>([]);
    const gridIdToFieldNamesMapRef = useRef<Map<number, string>>(new Map<number, string>());
    const [editPrompt, setEditPrompt] = useState('');

    useEffect(() => {
        const cols = configureColumns();
        setColumns(cols);
        const data = parseInputs(selectedFieldNames, fieldAliasesMap, fieldLabelsMap, gridIdToFieldNamesMapRef.current);
        const selectedIds = getInitialSelection(data);
        setDataRows(data);
        setSelectionModel([...selectedIds]);
    }, []);

    /**
     * Convert the selected field names into an array of corresponding grid ids
     * @param data the selected fields names passed to the widget
     * @returns array of grid ids
     */
    function getInitialSelection(data: any[]): number[] {
        const selectedItems: number[] = [];
        data.forEach((dataItem) => {
            if (dataItem.selected === 'true') {
                selectedItems.push(dataItem.id);
            }
        });
        return selectedItems;
    }

    /**
     * define the columns for the grid
     * @returns array of column header objects
     */
    function configureColumns(): any[] {
        const cols = [
            {
                field: 'name',
                headerName: 'Field Name',
                width: 250,
                editable: false,
            },
            {
                field: 'alias',
                headerName: 'Field Alias',
                width: 250,
                editable: false,
            },
            {
                field: 'label',
                headerName: 'Display Label (editable)',
                width: 250,
                editable: true,
            },
        ];
        return cols;
    }

    /**
     * Mash up the input data objects into a format that the grid can display
     * @param preSelectedFieldNames field names already defined to be displayed in the popup
     * @param fieldAliases Map of fieldNames to alias names
     * @param fieldLabels Map of field names to display/label names
     * @param gridIdToFieldNames Map of ids to field names - for display in the grid
     * @returns array of data ojects formatted for display in the grid
     */
    function parseInputs(
        preSelectedFieldNames: string[],
        fieldAliases: Map<string, string>,
        fieldLabels: Map<string, string>,
        gridIdToFieldNames: Map<number, string>
    ): string[] {
        const rows: any[] = [];
        preSelectedFieldNames.map((field: string, idx: number) => {
            //handle fields previously selected
            let aliasName = fieldAliases.get(field);
            let label = fieldLabels.get(field); //predefined labels passed to widget
            rows.push({
                id: idx,
                selected: 'true',
                name: field,
                alias: aliasName ? aliasName : field,
                label: label ? label : '',
            });
            gridIdToFieldNames.set(idx, field);
        });
        fieldNames.map((fieldName: any, id: number) => {
            //handle non-selected fields
            //all the layer field names
            let aliasName = fieldAliases.get(fieldName);
            let nextId = id + preSelectedFieldNames.length; //fields.indexOf(fieldName); //selected fields passed to widget
            let label = fieldLabels.get(fieldName); //predefined labels passed to widget
            let canAdd = preSelectedFieldNames.indexOf(fieldName); //fields not among those selected
            if (canAdd === -1) {
                rows.push({
                    id: nextId,
                    selected: 'false',
                    name: fieldName,
                    alias: aliasName ? aliasName : fieldName,
                    label: label ? label : '',
                });
                gridIdToFieldNames.set(nextId, fieldName);
            }
        });
        return rows;
    }

    /**
     * Prep the data returned back to the caller - a list of selected field names
     * @returns array of seleted field names
     */
    function parseReturnData(): string[] {
        const selectedFieldNames: string[] = [];
        selectionModel.forEach((selectedId) => {
            const fieldName = gridIdToFieldNamesMapRef.current.get(selectedId);
            fieldName && selectedFieldNames.push(fieldName);
        });
        return selectedFieldNames;
    }

    /**
     * Handle grid checkbox state change
     * @param params grid state
     */
    function onSelectionModelChange(params: any) {
        setSelectionModel([...params]);
    }

    /**
     * Handle cell edit start event
     * @param params edit event params
     */
    function onCellEditStart(params: any) {
        setEditPrompt('Click outside of cell to finalize edit.');
    }

    /**
     * Handle stop editing grid event
     * @param grid cell stop edit params
     */
    function onCellEditStop(params: any) {
        setEditPrompt('');
        const fieldName = gridIdToFieldNamesMapRef.current.get(params.id);
        fieldName && fieldLabelsMap.set(fieldName, params.value);
    }

    return (
        <StyledPopupFieldsSelectionDialog open={true} maxWidth={'md'} fullWidth>
            <StyledPopupFieldsHeaderBox>
                <Typography variant='h6'>Show / Hide Popup Fields and Labels</Typography>
            </StyledPopupFieldsHeaderBox>
            <Box>
                <StyledFieldsDataGrid
                    rows={dataRows}
                    columns={columns}
                    pageSize={8}
                    checkboxSelection
                    disableColumnFilter
                    loading={false}
                    rowsPerPageOptions={[8]}
                    onSelectionModelChange={onSelectionModelChange}
                    onCellEditCommit={onCellEditStop}
                    onCellEditStart={onCellEditStart}
                    disableSelectionOnClick
                    selectionModel={selectionModel}
                />
            </Box>
            <StyledEditPromptBox>
                <Typography>{editPrompt}</Typography>
            </StyledEditPromptBox>
            <StyledDialogActionButtonsContainer>
                <CancelButton
                    title='Cancel Changes'
                    variant='contained'
                    color='primary'
                    onClick={() => {
                        handleCancel();
                    }}
                >
                    Cancel
                </CancelButton>
                <ApplyButton
                    title='Apply Changes'
                    variant='contained'
                    color='secondary'
                    disabled={false}
                    onClick={() => {
                        handleApply(parseReturnData());
                    }}
                >
                    Apply
                </ApplyButton>
            </StyledDialogActionButtonsContainer>
        </StyledPopupFieldsSelectionDialog>
    );
}
