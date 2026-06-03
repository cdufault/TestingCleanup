import React, { useState, useEffect } from 'react';
import {
    Box,
    Tabs,
    Tab,
    Tooltip,
    Grid,
    AccordionSummary,
    Accordion,
    AccordionDetails,
    Autocomplete,
    TextField,
} from '@mui/material';
import { InputLabel, InputLabelWMargin } from '../../../../common/styles';
import AddIcon from 'calcite-ui-icons-react/PlusIcon';
import DeleteIcon from 'calcite-ui-icons-react/XIcon';
import styled from 'styled-components';

import Button from '@mui/material/Button';
import { FieldGroup, InputField, WidgetContainer } from '../../../../common';
import {
    ActivityCountsDataDef,
    ColumnTotalDef,
    ColumnTotalItem,
    addNewCountDataColumn,
    deleteItemInArrayGen,
} from '../helpers/ActivityCountsFormHelper';

import DownIcon from 'calcite-ui-icons-react/CaretDownIcon';
import { StyledTextButton } from '../../../styles';

const DownIconButton = styled(DownIcon)`
    color: white;
`;

/**describes this components inputs */
interface CountsSummaryFormProps {
    /**Activity Counts data */
    activityCountsData: ActivityCountsDataDef | undefined;
    /**objects from the defineColumnCount section of the counts JSON*/
    columnTotals: ColumnTotalDef[] | undefined;
    /**array of a rows defined in the JSON */
    rowNames: string[];
    /**row name / column names mapping*/
    columnNamesMap: Map<string, string[]> | undefined;
    numberOfColumns: number;
    summaryRowLabel: string;
    /**callback to enable removing defineColumnCounnt array elements that have no count data item and need to be removed */
    setOutputPositionToDrop: React.Dispatch<React.SetStateAction<number | undefined>>;
    setSummaryRowLabel: React.Dispatch<React.SetStateAction<string>>;
    selectedRowLabel: string;
    setPrevSelectedCountSummaryTabIndex: React.Dispatch<React.SetStateAction<number>>;
    prevSelectedCountSummaryTabIndex: number;
    refreshCountsGrid: () => void;
}

export type updateColumnTotalType = 'columns' | 'label';

/** component for defining array items in the defineColumnTotals section of the count widget JSON */
export function CountsSummaryForm(props: CountsSummaryFormProps) {
    const {
        activityCountsData,
        columnTotals,
        rowNames,
        columnNamesMap,
        numberOfColumns,
        summaryRowLabel,
        setSummaryRowLabel,
        setOutputPositionToDrop,
        selectedRowLabel,
        setPrevSelectedCountSummaryTabIndex,
        prevSelectedCountSummaryTabIndex,
        refreshCountsGrid,
    } = props;

    const [defaultTotalColumIds, setDefaultTotalColumIds] = useState<string[]>([]);
    const [selectedColumnTotalTabIndex, setSelectedColumnTotalTabIndex] = useState<number>(0);
    const [totalColumnLabel, setTotalColumnLabel] = useState<string>();

    /**Reference to the selected defineColumnTotals JSON object, try not to mutate outside of the updateSelectedColumnTotal function */
    const [selectedColumnTotalRef, setSelectedColumnTotalRef] = useState<ColumnTotalDef | undefined>();

    /**Reference the JSON object defineColumnTotals array, try not to mutate outside of the updateColumnTotalItems */
    const [columnTotalItemsRef, setColumnTotalItemsRef] = useState<ColumnTotalItem[]>([]);
    const [summaryRowLabelVal, setSummaryRowLabelVal] = useState<string>('');

    useEffect(() => {
        if (columnTotals && columnTotals.length > 0) {
            const indexToSet = prevSelectedCountSummaryTabIndex !== -1 ? prevSelectedCountSummaryTabIndex : 0;

            const countColumn = columnTotals?.find(
                (columnTotal) => columnTotal.columnOutputPosition - 1 === indexToSet
            );
            columnTotals && setSelectedColumnTotalRef(countColumn);

            countColumn && setSelectedColumnTotalTabIndex(indexToSet);
            if (countColumn) {
                setColumnTotalItemsRef(countColumn.columns);
            }
        }
    }, [columnTotals]);

    useEffect(() => {
        if (selectedColumnTotalRef) {
            setTotalColumnLabel(selectedColumnTotalRef.columnLabel);
        } else {
            //some columns may not have defined total calc
            setTotalColumnLabel('');
        }
    }, [selectedColumnTotalRef]);

    useEffect(() => {
        if (numberOfColumns > 0) {
            const indexArrayVals = generateDefaultTotalColumnIds(numberOfColumns);
            setDefaultTotalColumIds(indexArrayVals);
        }
    }, [numberOfColumns]);

    useEffect(() => {
        if (summaryRowLabel) {
            setSummaryRowLabelVal(summaryRowLabel);
        }
    }, [summaryRowLabel]);

    useEffect(() => {
        if (summaryRowLabelVal && activityCountsData) {
            activityCountsData.summaryRowLabel = summaryRowLabelVal;
        }
    }, [summaryRowLabelVal]);

    /**
     * Update the column total items array in the totalColumnDef
     * @param items column total items [{rowPosition:number, columnName:string}, ...]
     */
    function updateColumnTotalItems(items: ColumnTotalItem[]) {
        setColumnTotalItemsRef(items);
    }

    /**
     * Update a column total item in the defineTotalColumn array
     * @param totalColumnDef selected total column definition
     * {columnOutputPosition:number, columnLabel: string, columns:[{rowPosition:number, columnName:string}}
     */
    function updateSelectedColumn(totalColumnDef: ColumnTotalDef | undefined) {
        setSelectedColumnTotalRef(totalColumnDef);
    }

    /**
     *
     * @param updateVal
     * @param updateType
     */
    function updateSelectedColumnTotal(updateVal: any, updateType: updateColumnTotalType = 'columns') {
        if (selectedColumnTotalRef) {
            if (updateType === 'columns' && Array.isArray(updateVal)) {
                selectedColumnTotalRef.columns = updateVal;
            } else if (updateType === 'label' && typeof updateVal === 'string') {
                selectedColumnTotalRef.columnLabel = updateVal;
            }
        }
    }

    /**
     * Generate generic labels for the tabs that will represent the column total -  one tab per max column count--
     * based on the row with most columns
     * @param maxColumns maximum number of columns this grid supports (row with the most columns sets the norm)
     * @returns an array of string ids - where each index in the array represents a column total
     */
    function generateDefaultTotalColumnIds(maxColumns: number): string[] {
        const defaultTotalColumIds = [];
        for (let i = 1; i < maxColumns + 1; i++) {
            defaultTotalColumIds.push(`Column Total ${i}`);
        }
        return defaultTotalColumIds;
    }

    /**
     * Handle the summary tabs change event
     * @param event summary totals tab change event
     * @param selectedIndex index of the currently selected tab
     */
    function totalsTabIndexChanged(event: React.SyntheticEvent, selectedIndex: number) {
        setSelectedColumnTotalTabIndex(selectedIndex);
        setPrevSelectedCountSummaryTabIndex(selectedIndex);
        const countColumn = columnTotals?.find((columnTotal) => columnTotal.columnOutputPosition - 1 === selectedIndex);
        columnTotals && updateSelectedColumn(countColumn);

        countColumn && updateColumnTotalItems([...countColumn?.columns]);
        !countColumn && updateColumnTotalItems([]);
    }

    /**
     * Handle click event for the add new column total item:  {rowPosition:number, columnName:string}
     */
    function addNewColumnTotalItemClickHandler() {
        const colNames = columnNamesMap?.get(selectedRowLabel);
        const newColumnName = colNames ? colNames[0] : 'Col Name';
        const rowPosition = rowNames.findIndex((rowName) => rowName === selectedRowLabel);
        const position = rowPosition !== -1 ? rowPosition + 1 : 1; //0 based to 1 based
        if (!selectedColumnTotalRef && columnTotals) {
            //if this is the first item created for this column
            const newTotal: ColumnTotalDef = {
                //must have a columnTotalDef to attach the inew tem
                columnLabel: 'Total',
                columnOutputPosition: selectedColumnTotalTabIndex + 1,
                columns: [],
            };
            newTotal.columns.push({
                //add the new item
                rowPosition: position,
                columnName: newColumnName,
            });
            columnTotals.push(newTotal);

            updateSelectedColumn(newTotal);
            updateColumnTotalItems([...newTotal.columns]);
        } else {
            //add to existing items
            const newData = addNewCountDataColumn(position, columnTotalItemsRef, newColumnName);
            updateSelectedColumnTotal(newData);
            updateColumnTotalItems([...newData]);
        }
    }

    /**
     * Handle the click on the remove item button
     * @param index index to remove in the array
     */
    const deleteColumnTotalItemClickHandler = (index: number) => {
        if (selectedColumnTotalRef) {
            const updatedColumnItems = deleteItemInArrayGen(index, selectedColumnTotalRef?.columns);

            updateSelectedColumnTotal(updatedColumnItems);
            updateColumnTotalItems(updatedColumnItems);

            const countsWithContent = columnTotals?.filter((item) => item.columns.length > 0);
            countsWithContent && countsWithContent.length < 1 && setOutputPositionToDrop(-1);
            if (countsWithContent && countsWithContent.length > 0 && updatedColumnItems.length < 1) {
                setOutputPositionToDrop(selectedColumnTotalRef.columnOutputPosition);
            }
        }
    };

    /**
     * Handle the summaryRowlabel text change
     * @param event label update event
     */
    const summaryRowLabelUpdateHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSummaryRowLabelVal(value);
    };

    /**
     * Handle the summaryRowlabel blur
     * @param event label blur event
     */
    const summaryRowLabelBlur = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSummaryRowLabel(value);
    };

    /**
     * Handle the summary item label change
     * @param event count column label change event - the label over the summary item total
     */
    function onCountColumnLabelChange(event: React.ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        setTotalColumnLabel(value);
        if (selectedColumnTotalRef) {
            updateSelectedColumnTotal(value, 'label');
        }
    }

    return (
        <>
            <WidgetContainer>
                {/* index tabs   */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
                    <Box sx={{ width: '18%' }}>
                        {/* category/row tabs */}
                        <Box>
                            <Box>
                                <InputLabel sx={{ fontWeight: '700' }}>Columns</InputLabel>
                            </Box>
                            <Tabs
                                value={selectedColumnTotalTabIndex}
                                indicatorColor='primary'
                                onChange={totalsTabIndexChanged}
                                key={'rowtabs'}
                                orientation='vertical'
                                sx={{
                                    '.MuiTabs-indicator': { width: '6px', color: 'secondary' },
                                    '.Mui-selected': { color: 'secondary' },
                                }}
                            >
                                {defaultTotalColumIds.map((indexVal, idx) => {
                                    return (
                                        <Tab key={'rowtabs' + idx} label={indexVal} sx={{ alignItems: 'flex-start' }} />
                                    );
                                })}
                            </Tabs>
                        </Box>
                    </Box>

                    <Box sx={{ width: '80%', marginTop: '1px', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ paddingTop: '1px', paddingRight: '5px', display: 'flex', width: '100%' }}>
                            <Box>
                                <InputLabel sx={{ marginLeft: '12px' }}>
                                    {`${defaultTotalColumIds[selectedColumnTotalTabIndex]}:    Label `}
                                </InputLabel>
                            </Box>
                            <Box sx={{ marginTop: '-20px', marginLeft: '10px' }}>
                                <FieldGroup>
                                    <InputField
                                        variant='outlined'
                                        size='small'
                                        required
                                        title={'Label to add over the total value.'}
                                        placeholder=''
                                        fullWidth
                                        value={totalColumnLabel}
                                        autoComplete='off'
                                        onChange={onCountColumnLabelChange}
                                        helperText={'Required'}
                                    />
                                </FieldGroup>
                            </Box>
                            <Box>
                                <StyledTextButton
                                    sx={{ marginLeft: '150px', marginTop: '-5px' }}
                                    color='secondary'
                                    onClick={() => addNewColumnTotalItemClickHandler()}
                                >
                                    Add Count Item
                                </StyledTextButton>
                                <StyledTextButton
                                    sx={{ marginLeft: '20px', marginTop: '-5px' }}
                                    color='secondary'
                                    onClick={refreshCountsGrid}
                                >
                                    Refresh Grid
                                </StyledTextButton>
                            </Box>
                        </Box>

                        <Grid container columnSpacing={1} rowSpacing={2} sx={{ marginTop: '10px' }}>
                            {columnTotalItemsRef &&
                                columnTotalItemsRef.map((val, idx) => {
                                    return (
                                        <Grid item xs={4} key={'columnLabel' + idx + val.rowPosition}>
                                            <CountsDataItemForm
                                                columnNamesMap={columnNamesMap}
                                                rowNames={rowNames}
                                                countDataColumn={val}
                                                onDeleteColumnTotalItem={deleteColumnTotalItemClickHandler}
                                                index={idx}
                                            />
                                            {idx + 1 < columnTotalItemsRef.length ? (
                                                <Grid
                                                    item
                                                    key={'columnLabel' + val.columnName + idx}
                                                    xs={2}
                                                    sx={{
                                                        marginTop: '15px',
                                                        alignItems: 'top',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <AddIcon size={32} />
                                                </Grid>
                                            ) : (
                                                <Grid key={'plus' + idx} item xs={2}></Grid>
                                            )}
                                        </Grid>
                                    );
                                })}
                        </Grid>
                        <Box sx={{ marginTop: '25px' }}>
                            <FieldGroup>
                                <InputLabelWMargin sx={{ marginBottom: '10px' }}>Summary Row Label</InputLabelWMargin>
                                <InputField
                                    variant='outlined'
                                    size='small'
                                    required
                                    title={'Label for the summary row'}
                                    placeholder=''
                                    fullWidth
                                    value={summaryRowLabelVal}
                                    autoComplete='off'
                                    onChange={summaryRowLabelUpdateHandler}
                                    onBlur={summaryRowLabelBlur}
                                    helperText={'Required'}
                                />
                            </FieldGroup>
                        </Box>
                    </Box>
                </Box>
            </WidgetContainer>
        </>
    );
}

interface CountsDataItemFormProp {
    columnNamesMap: Map<string, string[]> | undefined;
    rowNames: string[];
    index: number;
    countDataColumn: ColumnTotalItem;
    onDeleteColumnTotalItem: (idx: number) => void;
}

export function CountsDataItemForm(props: CountsDataItemFormProp) {
    const { countDataColumn, columnNamesMap, rowNames, index, onDeleteColumnTotalItem } = props;

    const [countDataColumnVal, setCountDataColumnVal] = useState<any>({
        columnName: '',
        rowPosition: -1,
        rowName: '',
    });

    const [rowName, setRowName] = useState<string>('');
    const [selectedColumnName, setSelectedColumnName] = useState<string>('');
    const [columnNames, setColumnNames] = useState<string[]>([]);
    const [hasError, setHasError] = useState<boolean>(false);
    useEffect(() => {
        if (columnNames) {
            const result = columnNames.findIndex((val) => val === countDataColumnVal.columnName);
            setHasError(result === -1);
        }
    }, [columnNames, selectedColumnName]);

    useEffect(() => {
        if (countDataColumn && columnNamesMap) {
            const rN = rowName === '' ? rowNames[countDataColumn.rowPosition - 1] : rowName;
            setCountDataColumnVal({
                columnName: countDataColumn.columnName,
                rowPosition: countDataColumn.rowPosition, //1 based value, no 0 postions
                rowName: rN,
            });
            setRowName(rN);
            if (columnNamesMap && columnNamesMap.has(rN)) {
                const colNames = columnNamesMap.get(rN);
                setColumnNames(colNames ? colNames : []);
            }
        }
    }, [countDataColumn, columnNamesMap]);

    const onRowDataChanged = (event: React.ChangeEvent<HTMLInputElement>, newValue: string | null) => {
        let rowIndex = -1;
        if (newValue) {
            rowIndex = rowNames.indexOf(newValue); //zero based
        }
        if (newValue && rowIndex > -1) {
            setCountDataColumnVal((prevData: any) => ({ ...prevData, ['rowPosition']: rowIndex + 1 })); //one based index
            setCountDataColumnVal((prevData: any) => ({ ...prevData, ['rowName']: newValue })); //one based index
            countDataColumn.rowPosition = rowIndex + 1; //back to parent, one based

            if (columnNamesMap && columnNamesMap.has(newValue)) {
                const colNames = columnNamesMap.get(newValue);
                setColumnNames(colNames ? colNames : []);
                setCountDataColumnVal((prevData: any) => ({
                    ...prevData,
                    ['columnName']: colNames ? colNames[0] : 'ColName',
                }));
            }
        }
    };

    const onColumnDataChanged = (event: React.ChangeEvent<HTMLInputElement>, newValue: string | null) => {
        newValue && setCountDataColumnVal((prevData: any) => ({ ...prevData, ['columnName']: newValue }));
        setSelectedColumnName(newValue ? newValue : '');
        if (newValue) {
            countDataColumn.columnName = newValue;
        }
    };

    const errorTitle = hasError ? 'Error - column name not found' : '';
    return (
        <>
            <Box sx={{ width: '100%' }}>
                <Box sx={{}}>
                    {countDataColumnVal.rowPosition > -1 && countDataColumnVal.columnName !== '' && (
                        <Accordion
                            title={errorTitle}
                            sx={{ backgroundColor: '#3d4149', ...(hasError && { border: '1px solid red' }) }}
                        >
                            <AccordionSummary expandIcon={<DownIconButton />}>
                                <Box sx={{}}>
                                    <InputLabel>{`${rowNames[countDataColumnVal.rowPosition - 1]} | ${
                                        countDataColumnVal.columnName
                                    }`}</InputLabel>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <WidgetContainer>
                                    <FieldGroup>
                                        <Autocomplete
                                            sx={{}}
                                            options={rowNames}
                                            disableClearable={true}
                                            value={countDataColumnVal.rowName}
                                            onInputChange={onRowDataChanged}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label='Selected Row'
                                                    value={countDataColumnVal.rowName}
                                                />
                                            )}
                                        />
                                    </FieldGroup>
                                    <FieldGroup>
                                        <Autocomplete
                                            sx={{}}
                                            options={columnNames}
                                            disableClearable={true}
                                            value={countDataColumnVal.columnName}
                                            onInputChange={onColumnDataChanged}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label='Selected Column'
                                                    helperText={hasError ? 'Error' : ''}
                                                    title={hasError ? 'Invalid column name.' : ''}
                                                    value={countDataColumnVal.columnName}
                                                />
                                            )}
                                        />
                                    </FieldGroup>
                                    <Tooltip title='Delete Column'>
                                        <Button
                                            sx={{ marginTop: '15px' }}
                                            endIcon={<DeleteIcon />}
                                            onClick={() => onDeleteColumnTotalItem(index)}
                                            disabled={false}
                                            color='secondary'
                                        >
                                            Delete
                                        </Button>
                                    </Tooltip>
                                </WidgetContainer>
                            </AccordionDetails>
                        </Accordion>
                    )}
                </Box>
            </Box>
        </>
    );
}
