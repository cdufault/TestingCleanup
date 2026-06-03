import React, { useState, useEffect } from 'react';

import {
    Box,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Tooltip,
    Button,
    Autocomplete,
    TextField,
} from '@mui/material';
import styled from 'styled-components';
import MoveRightIcon from 'calcite-ui-icons-react/ArrowRightIcon';
import MoveLeftIcon from 'calcite-ui-icons-react/ArrowLeftIcon';
import DeleteIcon from 'calcite-ui-icons-react/XIcon';
import DownIcon from 'calcite-ui-icons-react/CaretDownIcon';
import {
    Row,
    ColumnCountData,
    deleteColumn,
    moveItemInArrayGen,
    deepCopyObjectGen,
} from '../helpers/ActivityCountsFormHelper';
import { FieldGroup, InputField, WidgetContainer } from '../../../../common';
import { InputLabelWMargin } from '../../../../common/styles';
import { ColumnDataForm } from './ColumnDataForm';
import { useFeeds } from '../../../../../hooks/missionHooks';
import { IItem } from '@esri/arcgis-rest-portal';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';

const InputLabelCenter = styled.label`
    display: flex;
    justify-content: center;
    align-items: center;
    color: ${(props) => props.theme.palette.common.white};
`;

const DownIconButton = styled(DownIcon)`
    color: white;
`;
/**describes component inputs */
interface RowDataFormProps {
    /**row that is selected */
    selectedRow: Row;
    /**method to update the row */
    refreshCountsGrid: () => void;
    /**update the columns for the selected row - called on the parent to force a refresh on the UI */
    selectedRowColumnsUpdate: (newArray: ColumnCountData[]) => void;
    /**helps with re-render since the label is set in the parent */
    rowHeader: string;
    /** There is an error callback prop  */
    onErrorExistsChange: (hasError: boolean) => void;
}

/**
 * Captures the user input to describe a row in the activity counts widget
 * @param props props
 * @returns JSX.Element
 */
export const RowDataForm = (props: RowDataFormProps): JSX.Element => {
    const { selectedRow, selectedRowColumnsUpdate, refreshCountsGrid, onErrorExistsChange } = props;

    const [rowLabel, setRowLabel] = useState<string>(selectedRow.rowLabel);
    const [hoverText, setHoverText] = useState<string>(selectedRow.hoverText);
    const [, setPositionInTable] = useState<number>(selectedRow.positionInTable);
    const [, setSelectedFClassPortalItemId] = useState<string>(selectedRow.ftrClassPortalItemId);
    const { feeds } = useFeeds();
    const feed = feeds.find((feed) => feed.id === selectedRow.ftrClassPortalItemId);
    const [selectedFeed, setSelectedFeed] = useState<IItem | undefined>();
    const [fLayerHelperText, setFLHelperText] = useState<string>('');
    const [fieldNames, setFieldNames] = useState<string[]>([]);
    const [selectedFieldName, setSelectedFieldName] = useState<string>(selectedRow.lastUpdatedFieldName ?? '');
    const [rowLabelErrorMessage, setRowLabelErrorMessage] = useState<string>('');

    useEffect(() => {
        if (feed) {
            setSelectedFeed(feed);
            setFLHelperText('');
        }
    }, [feed]);

    useEffect(() => {
        if (selectedRow) {
            setRowLabel(selectedRow.rowLabel);
            setHoverText(selectedRow.hoverText);
            setSelectedFClassPortalItemId(selectedRow.ftrClassPortalItemId);
            setPositionInTable(selectedRow.positionInTable);
            if (!feed) {
                const helperText = selectedRow.ftrClassPortalItemId
                    ? `Could not find item: ${selectedRow.ftrClassPortalItemId}`
                    : 'Missing feature layer';
                setFLHelperText(helperText);
            }
        }
    }, [selectedRow]);

    useEffect(() => {
        if (selectedFeed) {
            if (selectedRow && selectedRow.ftrClassPortalItemId !== selectedFeed.id) {
                selectedRow.ftrClassPortalItemId = selectedFeed.id;
                setFLHelperText('');
                refreshCountsGrid();
            }
            updateFieldNames(selectedFeed);
        }
    }, [selectedFeed]);

    useEffect(() => {
        if (fieldNames) {
            setSelectedFieldName(selectedRow.lastUpdatedFieldName ?? '');
        }
    }, [fieldNames]);

    /**
     * Get all the field names in a feature class
     * @param selectedFeedItem user selected feature class
     */
    const updateFieldNames = (selectedFeedItem: IItem | undefined) => {
        if (selectedFeedItem) {
            const portalItemId = selectedFeedItem.id;
            const fLayer = new FeatureLayer({
                portalItem: {
                    id: portalItemId,
                },
            });
            fLayer.load().then(() => {
                const fieldNames: string[] = [];
                fLayer.fields.forEach((field: any) => {
                    fieldNames.push(field.name);
                });
                setFieldNames([...fieldNames]);
            });
        }
    };

    /**
     * Handle the blur on the row label
     * @param event event for row label change
     */
    const onBlurRowLabel = (event: React.ChangeEvent<HTMLInputElement>) => {
        const data = event.target.value;
        setRowLabel(data);
        selectedRow.rowLabel = data;

        const copy = deepCopyObjectGen(selectedRow.rowColumns);
        selectedRowColumnsUpdate(copy);
    };

    /**
     * Handle the change on the row label
     * @param event event for row label change
     */
    const onChangeRowLabel = (event: React.ChangeEvent<HTMLInputElement>) => {
        const data = event.target.value;
        setRowLabel(data);
        selectedRow.rowLabel = data;
        validateFormRowLabel(data);
    };

    /**
     * Validate that Form Row label is sql safe.
     * @param data string value to validate
     */
    const validateFormRowLabel = (data: string) => {
        // regex to remove special characters but keeps letters, numbers, spaces, dashes and underscores.
        const validNameRegex = /^[a-zA-Z0-9 _-]+$/;
        if (validNameRegex.test(data)) {
            // the string is safe
            if (rowLabelErrorMessage !== '') {
                setRowLabelErrorMessage('');
            }
            onErrorExistsChange(false);
        } else {
            setRowLabelErrorMessage('Invalid name: special characters detected.');
            onErrorExistsChange(true);
        }
    };

    /**
     * Handle the change on the hover text input
     * @param event hover text change event
     */
    const onChangeHoverText = (event: React.ChangeEvent<HTMLInputElement>) => {
        const data = event.target.value;
        setHoverText(data);
        selectedRow.hoverText = data;
    };

    /**
     * Update the text value on the column label field
     * @param newValue new label value
     * @param attribute new attribute value
     * @param index index position in the array for the column
     */
    const updateColumnAttribute = (newValue: string, attribute: string, index: number) => {
        selectedRow.rowColumns[index][attribute] = newValue;
        const copy = deepCopyObjectGen(selectedRow.rowColumns);
        selectedRow.rowColumns = [...copy];
    };

    /**
     * Handle the move column button click
     * @param pos column index in the array to move
     * @param direction move direction 'left' or 'right'
     */
    const onMoveColumn = (pos: number, direction: string) => {
        const { updatedArray } = moveItemInArrayGen(pos, direction, selectedRow.rowColumns);
        const repositionedItems = updatedArray.map((item: ColumnCountData, index: number) => {
            item.positionInTable = index + 1; //one based
            return item;
        });

        selectedRowColumnsUpdate(repositionedItems);
    };

    /**
     * Handle the delete column button click
     * @param pos index position in the array of the column to delete
     */
    const onDeleteColumn = (pos: number) => {
        const updatedArray = deleteColumn(pos, selectedRow.rowColumns);
        selectedRowColumnsUpdate(updatedArray);
    };

    /**use until it is determined what items will be candidates for generating counts */
    const feedTitles = feeds.map((feed) => feed.title);

    /**
     * Handle the feature layer select change event
     * @param event select change event
     * @param newValue the new selected value
     */
    const onFeatureLayerChanged = (event: React.ChangeEvent<HTMLInputElement>, newValue: string | null) => {
        if (newValue) {
            const feed = feeds.find((feed) => feed.title === newValue);
            setSelectedFeed(feed);
        }
    };

    /**
     * Handle the feature layer fields change event
     * @param event select change event
     * @param newValue new selected value
     */
    const onSelectedFieldNameChanged = (event: React.ChangeEvent<HTMLInputElement>, newValue: string | null) => {
        if (newValue && selectedRow) {
            setSelectedFieldName(newValue);
            selectedRow.lastUpdatedFieldName = newValue;
        }
    };

    return (
        <>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {/* column definition forms  */}
                <Box
                    sx={{
                        marginTop: '15px',
                        display: 'flex',
                        paddingLeft: '0px',
                        rowGap: '15px',
                        flexWrap: 'wrap',
                        justifyContent: 'flex-start',
                    }}
                >
                    {selectedRow?.rowColumns.map((col: ColumnCountData, idx: number) => {
                        return (
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    width: '50%',
                                    marginBottom: '15px',
                                    flexWrap: 'wrap',
                                }}
                                key={col.columnLabel + idx + col.columnLabel}
                            >
                                <Accordion
                                    key={selectedRow.rowLabel + idx}
                                    sx={{ backgroundColor: '#3d4149', width: '99%' }}
                                >
                                    <AccordionSummary expandIcon={<DownIconButton />}>
                                        <Typography sx={{ wordWrap: 'break-word' }}>{`${col.columnLabel}`}</Typography>
                                    </AccordionSummary>
                                    {/* column action buttons */}
                                    <AccordionDetails key={idx + selectedRow.rowLabel}>
                                        <ColumnDataForm
                                            selectedColumn={col}
                                            selectedColumnArrayIndexPos={idx}
                                            updateColumnAttribute={updateColumnAttribute}
                                        />

                                        <Tooltip title='Delete Column'>
                                            <Button
                                                sx={{ marginTop: '15px' }}
                                                endIcon={<DeleteIcon />}
                                                onClick={() => onDeleteColumn(idx)}
                                                disabled={false}
                                                color='secondary'
                                            >
                                                Delete
                                            </Button>
                                        </Tooltip>

                                        <Tooltip title='Move Column to Right'>
                                            <Button
                                                sx={{ marginTop: '15px' }}
                                                endIcon={<MoveRightIcon />}
                                                onClick={() => onMoveColumn(idx, 'right')}
                                                disabled={false}
                                                color='secondary'
                                            >
                                                Move
                                            </Button>
                                        </Tooltip>

                                        <Tooltip title='Move Column to Left'>
                                            <Button
                                                sx={{ marginTop: '15px' }}
                                                endIcon={<MoveLeftIcon />}
                                                onClick={() => onMoveColumn(idx, 'left')}
                                                disabled={false}
                                                color='secondary'
                                            >
                                                Move
                                            </Button>
                                        </Tooltip>
                                    </AccordionDetails>
                                </Accordion>
                            </Box>
                        );
                    })}
                </Box>

                {/* category details form */}
                <Box sx={{ marginTop: '25px' }}>
                    <Accordion sx={{ backgroundColor: '#3d4149' }}>
                        <AccordionSummary expandIcon={<DownIconButton />}>
                            <Box sx={{}}>
                                <InputLabelCenter>{`Row/Category Details | ${rowLabel}:`}</InputLabelCenter>
                            </Box>
                        </AccordionSummary>
                        {/* category/topic form fields */}
                        <AccordionDetails>
                            <WidgetContainer>
                                <FieldGroup>
                                    <InputLabelWMargin sx={{ marginBottom: '10px' }}>Row Label</InputLabelWMargin>
                                    <InputField
                                        variant='outlined'
                                        required
                                        size='small'
                                        title={'Label for the row. No special Characters allowed'}
                                        placeholder=''
                                        fullWidth
                                        value={rowLabel}
                                        autoComplete='off'
                                        onBlur={onBlurRowLabel}
                                        onChange={onChangeRowLabel}
                                        error={rowLabelErrorMessage !== ''}
                                        helperText={rowLabelErrorMessage !== '' ? rowLabelErrorMessage : 'Required'}
                                    />
                                </FieldGroup>
                                <FieldGroup>
                                    {feeds && (
                                        <Autocomplete
                                            sx={{ marginTop: '20px' }}
                                            options={feedTitles}
                                            value={selectedFeed ? selectedFeed.title : ''}
                                            onInputChange={onFeatureLayerChanged}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    value={selectedFeed ? selectedFeed.title : ''}
                                                    label='Selected Feature Layer'
                                                    helperText={fLayerHelperText}
                                                />
                                            )}
                                        />
                                    )}
                                </FieldGroup>
                                <FieldGroup>
                                    {feeds && (
                                        <Autocomplete
                                            sx={{ marginTop: '20px', marginBottom: '10px' }}
                                            options={fieldNames}
                                            value={selectedFieldName}
                                            onInputChange={onSelectedFieldNameChanged}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    value={selectedFieldName}
                                                    label='Last Updated Field Name'
                                                />
                                            )}
                                        />
                                    )}
                                </FieldGroup>
                                <FieldGroup>
                                    <InputLabelWMargin sx={{ marginBottom: '10px' }}>
                                        Hover Text / Tooltip
                                    </InputLabelWMargin>
                                    <InputField
                                        variant='outlined'
                                        required
                                        size='small'
                                        title={'Tooltip when mouse is over the item'}
                                        placeholder=''
                                        fullWidth
                                        value={hoverText}
                                        autoComplete='off'
                                        onChange={onChangeHoverText}
                                        helperText={'Required'}
                                    />
                                </FieldGroup>
                            </WidgetContainer>
                        </AccordionDetails>
                    </Accordion>
                </Box>
            </Box>
        </>
    );
};
