import React, { useEffect, useState } from 'react';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Backdrop,
    Box,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    Tabs,
    Tab,
    Tooltip,
    Typography,
} from '@mui/material';
import { InputLabel, InputLabelWMargin } from '../../../../common/styles';
import styled from 'styled-components';
import { FieldGroup, InputField, WidgetContainer } from '../../../../common';
import MoveDownIcon from 'calcite-ui-icons-react/ArrowDownIcon';
import MoveUpIcon from 'calcite-ui-icons-react/ArrowUpIcon';
import DeleteIcon from 'calcite-ui-icons-react/XIcon';
import AddIcon from 'calcite-ui-icons-react/PlusIcon';

import {
    ColumnCountData,
    ActivityCountsDataDef,
    Row,
    addColumn,
    addRow,
    calculateMaxColumnCount,
    deepCopyArray,
    deepCopyObjectGen,
    deleteItemInArrayGen,
    moveItemInArrayGen,
    parseColumnNames,
    parseRowNames,
    cascadeRowDeleteOnSummaryColumns,
    cascadeRowMoveOnSummaryColumns,
} from '../helpers/ActivityCountsFormHelper';
import { RowDataForm } from './RowDataForm';
import { CountsSummaryForm } from './CountsSummaryForm';
import { CountWidgetLib } from '@stratcom/react-widget-lib';
import { ConfigHelper } from '../../../../../helpers/configHelper';
import { IQueryCountWidgetTableResults, QueryForCountsLib } from '@stratcom/lib-functions';
import DownIcon from 'calcite-ui-icons-react/CaretDownIcon';
import { validateActivityCountsJson } from '../helpers/missionCreationViewModel';
import SaveIcon from 'calcite-ui-icons-react/SaveIcon';
import XIcon from 'calcite-ui-icons-react/XIcon';
import { StyledTextButton } from '../../../styles';
import { StyledAcivityCountsButtons } from '../styles';

const DownIconButton = styled(DownIcon)`
    color: white;
`;

const StyledBackdrop = styled(Backdrop)`
    position: absolute !important;
`;

/**describes the input for the method that sets up and calls the activity counts widget */
interface WidgetProps {
    widgetDataCache: IQueryCountWidgetTableResults | undefined;
}

/**
 * Describes props for this component
 */
interface ActivityCountsFormProps {
    /**dialog close handler - passes back the UI rendered to JSON */
    onClose: (json: string) => void;

    /**dialog cancel handler */
    onCancel: () => void;

    /**on change handler for the dialog textarea */
    onChangeCountsWJson: (event: React.ChangeEvent<HTMLInputElement>) => void;

    /**DOM node to attach the dialog */
    container?: HTMLElement | null;

    /**JSON text in the textarea */
    countsWidgetJson: string;

    /**name of the mission -- this can be empty if so the JSON will update when the name
     * updates in the missionData form
     */
    missionName: string;
}

/**Show a modal form for collecting needed data to generate a JSON used to
 * configure the activity counts widget */
const ActivityCountsForm = (props: ActivityCountsFormProps): JSX.Element => {
    const { onClose, onCancel, container, countsWidgetJson, missionName } = props;

    const [selectedRowTabIndex, setSelectedRowTabIndex] = useState<number>(0);
    const [selectedRow, setSelectedRow] = useState<Row | undefined>();
    const [rowHeader, setRowHeader] = useState<string>('');
    const [summaryRowLabel, setSummaryRowLabel] = useState<string>('');
    const [errorMessages, setErrorMessages] = useState<string[]>([]);
    const [rowDataError, setRowDataError] = useState<boolean>(false);
    const [errorExists, setErrorExists] = useState<boolean>(false);

    /**stashed copy of either the default JSON or existing mission JSON before any UI edits are applied
     * this JSON is updated with all UI edits on Save button click and passed back to the caller
     */
    const [originalJsonObj, setOriginalJsonObj] = useState<any | undefined>();

    /**columns that belong to the currently selected row object */
    const [selectedRowColumns, setSelectedRowColumns] = useState<ColumnCountData[]>([]);

    /**when the ui refreshes set the summary tab index back to where it was */
    const [prevSelectedCountSummaryTabIndex, setPrevSelectedCountSummaryTabIndex] = useState<number>(-1);

    /**when there are no column items in a defineColumnCounts array item remove it from the JSON */
    const [outputPositionToDrop, setOutputPositionToDrop] = useState<number | undefined>();
    const [widgetDataCache, setWidgetDataCache] = useState<IQueryCountWidgetTableResults | undefined>();

    const appConfig = ConfigHelper.getAppConfig();
    const portalUrl = appConfig.portalUrl;
    const categoryRowColors = appConfig.countWidgetRowColors;
    const gateTypeKeywords = appConfig.typekeywords.gateMission;

    const [activityCountsData, setActivityCountsData] = useState<ActivityCountsDataDef>({
        regionName: '',
        summaryRowLabel: '',
        refreshIntervalInMinutes: 0,
        defaultTotalColumnName: '',
        defaultTotalColumnValue: '',
        categoryLabel: '',
        rows: [],
        defineColumnTotals: [],
    });

    const [columnNamesMap, setColumnNamesMap] = useState<Map<string, string[]> | undefined>();
    const numberOfColumns = calculateMaxColumnCount(activityCountsData);
    const rowNames = parseRowNames(activityCountsData);
    const [counter, setCounter] = useState<number>(0);

    /**hold for working out issues with validation */
    useEffect(() => {
        if (activityCountsData) {
            getCountsData();
            setSelectedRow(activityCountsData.rows[selectedRowTabIndex]);
            setColumnNamesMap(parseColumnNames(activityCountsData));
        }
    }, [activityCountsData]);

    useEffect(() => {
        if (countsWidgetJson) {
            try {
                const obj = JSON.parse(countsWidgetJson);
                if (obj) {
                    obj.rows.sort((rowA: Row, rowB: Row) => rowA.positionInTable - rowB.positionInTable);
                    obj.rows.forEach((row: Row) => {
                        row.rowColumns.sort(
                            (colA: ColumnCountData, colB: ColumnCountData) =>
                                colA.positionInTable - colB.positionInTable
                        );
                    });
                    setOriginalJsonObj(obj);

                    setActivityCountsData({
                        regionName: missionName,
                        summaryRowLabel: obj.summaryRowLabel,
                        refreshIntervalInMinutes: obj.refreshIntervalInMinutes,
                        defaultTotalColumnName: obj.defaultTotalColumnName,
                        defaultTotalColumnValue: obj.defaultTotalColumnValue,
                        categoryLabel: obj.categoryLabel,
                        rows: obj.rows,
                        defineColumnTotals: obj.defineColumnTotals ? obj.defineColumnTotals : [],
                    });
                    setSelectedRow(obj.rows.length > 0 ? obj.rows[0] : undefined);
                    setSummaryRowLabel(obj.summaryRowLabel);
                    setPrevSelectedCountSummaryTabIndex(-1);
                }
            } catch (error) {
                console.error('Error parsing activity counts JSON.', error);
            }
        }
    }, [countsWidgetJson]);

    useEffect(() => {
        if (outputPositionToDrop) {
            if (outputPositionToDrop >= 0 && activityCountsData?.defineColumnTotals) {
                const index = activityCountsData.defineColumnTotals.findIndex(
                    (total) => total.columnOutputPosition === outputPositionToDrop
                );
                index > -1 && activityCountsData?.defineColumnTotals.splice(index, 1);
            } else {
                //no count items defined for this array entry
                delete activityCountsData.defineColumnTotals;
            }
            setOutputPositionToDrop(undefined);
        }
    }, [outputPositionToDrop]);

    useEffect(() => {
        if (summaryRowLabel !== activityCountsData.summaryRowLabel) {
            setActivityCountsData((prevData) => ({ ...prevData, ['summaryRowLabel']: summaryRowLabel }));
        }
    }, [summaryRowLabel]);

    useEffect(() => {
        updateSelectedRow(selectedRowTabIndex);
    }, [selectedRowTabIndex]);

    useEffect(() => {
        if (selectedRow) {
            selectedRow.rowColumns = [...selectedRowColumns];
            const copyRows = deepCopyArray(activityCountsData.rows);
            //new reference - clean up any dangling references in child components
            setActivityCountsData((prevData) => ({ ...prevData, ['rows']: copyRows }));
        }
    }, [selectedRowColumns]);

    useEffect(() => {
        if (selectedRow) {
            updateRowHeader(selectedRow.rowLabel);
        }
    }, [selectedRow]);

    useEffect(() => {
        if (rowDataError) {
            setErrorExists(true);
        } else {
            setErrorExists(false);
        }
    }, [rowDataError]);

    /**
     * Used locally and passed to the RowDataForm -- may consider passing the setRowHeader state setter
     * @param newHeader new header value for the row
     */
    const updateRowHeader = (newHeader: string) => {
        if (selectedRow) {
            setRowHeader(newHeader);
        }
    };

    /**
     * Update the selected row based on the index value for the current tab
     * @param indexPos the new selected index
     */
    function updateSelectedRow(indexPos: number) {
        if (indexPos < 0) {
            //no rows
            setSelectedRow(undefined);
        } else {
            setSelectedRow(activityCountsData.rows[selectedRowTabIndex]);
        }
    }

    /**
     * Since the positionInTable attribute of the row to its index + 1 position in the array
     * called after deletes and moves on rows
     * @param rows current set of row objects in the UI
     */
    function updateAllPositionInTableValues(rows: Row[]) {
        const updatedRowsArray = rows.map((row: Row, idx: number) => {
            row.positionInTable = idx + 1; //one based values
            return row;
        });
        activityCountsData.rows = updatedRowsArray;
    }

    /**
     * Handle tab index change events
     * @param event tab change event
     * @param selectedIndex new selected index
     */
    function onRowTabsChanged(event: React.SyntheticEvent, selectedIndex: number) {
        setSelectedRowTabIndex(selectedIndex);
    }

    /**
     * Handle move row button click
     * @param indexPos the index in the array of the row to move
     * @param direction direction 'up' or 'down'
     * @returns void
     */
    function btnMoveRowClicked(indexPos: number, direction: string) {
        if (!activityCountsData.rows || indexPos > activityCountsData.rows.length - 1 || indexPos < 0) {
            return;
        }
        if (activityCountsData.defineColumnTotals) {
            cascadeRowMoveOnSummaryColumns(activityCountsData.defineColumnTotals, indexPos, direction);
        }

        const { updatedArray, newIndexPos } = moveItemInArrayGen(indexPos, direction, activityCountsData.rows);
        updateAllPositionInTableValues(updatedArray);
        if (newIndexPos < 0) {
            //out of bounds
            return;
        }
        setSelectedRowTabIndex(newIndexPos);
        refreshCountsGrid();
    }

    /**
     * Handle the row delete button click
     * @param indexPos index of the row in the array to delete
     * @returns void
     */
    function btnDeleteRowClicked(indexPos: number) {
        if (!activityCountsData.rows || indexPos > activityCountsData.rows.length - 1 || indexPos < 0) {
            return;
        }
        activityCountsData.defineColumnTotals &&
            cascadeRowDeleteOnSummaryColumns(activityCountsData.defineColumnTotals, indexPos); //no defineColumnTotals item can reference a non-existing row index
        const updatedRows = deleteItemInArrayGen(indexPos, activityCountsData.rows);
        if (updatedRows.length < 1) {
            activityCountsData.defineColumnTotals = []; //remove fragmented count definitions
        }
        updateAllPositionInTableValues(updatedRows);
        const newIndex = indexPos - 1;
        if (indexPos === 0 && updatedRows.length > 0) {
            //first row item
            updateSelectedRow(0);
        } else if (newIndex === -1) {
            //no more rows available
            setSelectedRowTabIndex(-1);
        } else {
            setSelectedRowTabIndex(newIndex);
        }
        refreshCountsGrid();
    }

    /**
     * Handle the add new row button click
     */
    const onAddRowClicked = () => {
        const updatedRowArray = addRow(activityCountsData.rows, counter);
        setCounter((count) => count + 2); //one val for new row and one for the new column
        activityCountsData.rows = updatedRowArray;
        setSelectedRowTabIndex(updatedRowArray.length - 1);
        refreshCountsGrid();
    };

    /**
     * Handle main UI form elements updates
     * @param event ui change event
     */
    const handleActivityCountsDataUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
        const name = event.target.name;
        const value = event.target.value;
        const type = event.target.type;
        if (type === 'number') {
            const val = parseInt(value);
            val && setActivityCountsData((prevData) => ({ ...prevData, [name]: value }));
        } else {
            setActivityCountsData((prevData) => ({ ...prevData, [name]: value }));
        }
    };

    /**
     * Handle the add new column button click
     */
    const onAddColumn = () => {
        if (selectedRow) {
            const returnArray = addColumn(selectedRow.rowColumns, counter);
            setCounter((count) => count + 1);
            if (returnArray) {
                onSelectedRowColumnsUpdate([...returnArray]);
            }
        }
    };

    /**
     * Method passed to child components to call if they update the columns on the selected row
     * ie: move/delete etc. Passed to RowDataForm.
     * @param newArray new columns array for the selected row
     */
    const onSelectedRowColumnsUpdate = (newArray: ColumnCountData[]) => {
        setSelectedRowColumns(newArray); //fires update to rows
    };

    /**
     * Handles Row Data Errors
     * @param value boolean
     */
    const handleRowDataError = (value: boolean) => {
        setRowDataError(value);
    };

    /**
     * Called only when the activityCounts object is updated
     * @returns the JSON data needed to render the activity counts widget
     */
    async function getCountsData(): Promise<any> {
        console.info('Counts Data: ', activityCountsData);
        const lastUpdatedFieldName = appConfig.gate.lastUpdatedFieldName;
        const executeCountQueriesSequentially = appConfig.gate.executeCountQueriesSequentially;
        const data = await QueryForCountsLib(activityCountsData, lastUpdatedFieldName, executeCountQueriesSequentially); //sample dataObj
        data.refreshIntervalInMinutes = activityCountsData.refreshIntervalInMinutes;
        setWidgetDataCache(data);
        return data;
    }

    /**
     * Refresh the data in the activity grid widget. Used internally on row actions and passed to child form
     * items to callback when their changes require a grid refresh.
     * Passed to RowDataForm and CountsSummaryForm
     */
    function refreshCountsGrid() {
        const copyData = deepCopyObjectGen(activityCountsData);
        setActivityCountsData(copyData);
        validateCountsJson();
    }

    /**
     * Hold code for later implementation
     * Validate the counts widget JSON
     */
    const validateCountsJson = () => {
        const json = JSON.stringify(activityCountsData, undefined, 3);
        const messageArray: string[] = [];

        activityCountsData &&
            activityCountsData.rows.length > 0 &&
            validateActivityCountsJson(messageArray, json, false, 'tags').then((result) => {
                setErrorMessages([...result]);
                console.error('Validation Errors', errorMessages);
            });
    };

    /** Attach all UI element values and covert back to a JSON string and send to the caller*/
    function onCloseActivityCountsUI() {
        originalJsonObj.regionName = activityCountsData.regionName;
        originalJsonObj.summaryRowLabel = activityCountsData.summaryRowLabel;
        originalJsonObj.refreshIntervalInMinutes = activityCountsData.refreshIntervalInMinutes;
        originalJsonObj.defaultTotalColumnName = activityCountsData.defaultTotalColumnName;
        originalJsonObj.defaultTotalColumnValue = activityCountsData.defaultTotalColumnValue;
        originalJsonObj.categoryLabel = activityCountsData.categoryLabel;
        originalJsonObj.rows = deepCopyArray(activityCountsData.rows);
        originalJsonObj.defineColumnTotals = activityCountsData.defineColumnTotals
            ? deepCopyArray(activityCountsData.defineColumnTotals)
            : [];

        const json = JSON.stringify(originalJsonObj, undefined, 5);
        onClose(json);
    }

    /**
     * Render the activity counts widget
     * @param props widget props
     * @returns React component
     */
    const CountsWidget = (props: WidgetProps) => {
        const { widgetDataCache } = props;

        return (
            <Box>
                <CountWidgetLib
                    portalUrl={portalUrl}
                    oauthAppId={appConfig.oauthAppId}
                    gateTypeKeywords={gateTypeKeywords}
                    currentDisplayMode={'Standard'}
                    categoryRowColors={categoryRowColors}
                    regionName={'regionName'}
                    activityCountsData={widgetDataCache}
                />
            </Box>
        );
    };

    return (
        <Dialog
            fullWidth={true}
            maxWidth={'xl'}
            open={true}
            container={container}
            slots={{
                backdrop: StyledBackdrop,
            }}
        >
            <DialogTitle>{'Activity Counts Setup & Configuration'}</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', flexBasis: '60%', flexShrink: '0' }}>
                        {/* Top level JSON Props */}
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                justifyContent: 'space-between',
                            }}
                        >
                            <FieldGroup>
                                <InputLabelWMargin sx={{ marginBottom: '10px' }}>
                                    Refresh Interval in Minutes
                                </InputLabelWMargin>
                                <InputField
                                    variant='outlined'
                                    size='small'
                                    type='number'
                                    inputprop={{ inputProps: { max: 1440, min: 0.5 } }}
                                    required
                                    title={'Data refresh interval in minutes'}
                                    placeholder=''
                                    fullWidth
                                    name='refreshIntervalInMinutes'
                                    value={activityCountsData.refreshIntervalInMinutes}
                                    autoComplete='off'
                                    onChange={handleActivityCountsDataUpdate}
                                    helperText={'Required'}
                                />
                            </FieldGroup>

                            <FieldGroup>
                                <InputLabelWMargin sx={{ marginBottom: '10px' }}>
                                    Default Total Column Header
                                </InputLabelWMargin>
                                <InputField
                                    variant='outlined'
                                    size='small'
                                    title={'Total column header if not defined.'}
                                    placeholder={'This value is optional'}
                                    fullWidth
                                    name='defaultTotalColumnName'
                                    value={activityCountsData.defaultTotalColumnName}
                                    autoComplete='off'
                                    onChange={handleActivityCountsDataUpdate}
                                    helperText={'Optional'}
                                />
                            </FieldGroup>

                            <FieldGroup>
                                <InputLabelWMargin sx={{ marginBottom: '10px' }}>Default Total Value</InputLabelWMargin>
                                <InputField
                                    variant='outlined'
                                    title={'Default value for total column if not defined.'}
                                    placeholder={'This value is optional'}
                                    fullWidth
                                    size='small'
                                    name='defaultTotalColumnValue'
                                    value={activityCountsData.defaultTotalColumnValue}
                                    autoComplete='off'
                                    onChange={handleActivityCountsDataUpdate}
                                    helperText={'Optional'}
                                />
                            </FieldGroup>
                        </Box>

                        {/* tab/tab tool buttons   */}
                        <Box sx={{ marginTop: '15px' }}>
                            <WidgetContainer>
                                <Box sx={{ marginTop: '20px' }}>
                                    <Typography sx={{ fontWeight: '700' }}>Rows/Categories & Columns</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
                                    <Box sx={{ width: '30%' }}>
                                        {/* category/row tabs */}
                                        <Box>
                                            <Box>
                                                <InputLabel sx={{ fontWeight: '700' }}>Rows/Categories</InputLabel>
                                            </Box>
                                            <Tabs
                                                value={selectedRowTabIndex}
                                                indicatorColor='primary'
                                                onChange={onRowTabsChanged}
                                                orientation='vertical'
                                                sx={{
                                                    '.MuiTabs-indicator': { width: '6px', color: 'secondary' },
                                                    '.Mui-selected': { color: 'secondary' },
                                                }}
                                            >
                                                {activityCountsData.rows.map((row: Row, idx: number) => {
                                                    return (
                                                        <Tab
                                                            label={row.rowLabel}
                                                            sx={{ alignItems: 'flex-start' }}
                                                            key={row.rowLabel + idx}
                                                        />
                                                    );
                                                })}
                                            </Tabs>
                                        </Box>

                                        {/* category/row form tool buttons  */}
                                        <Grid
                                            container
                                            sx={{ width: '95%' }}
                                            wrap='wrap'
                                            rowSpacing={1}
                                            columnSpacing={0.25}
                                        >
                                            <Grid item xs={6}>
                                                <Tooltip title='Add a new row/category'>
                                                    <StyledAcivityCountsButtons
                                                        onClick={onAddRowClicked}
                                                        variant='outlined'
                                                        endIcon={<AddIcon />}
                                                        disabled={false}
                                                    >
                                                        Add
                                                    </StyledAcivityCountsButtons>
                                                </Tooltip>
                                            </Grid>

                                            <Grid item xs={6}>
                                                <Tooltip title='Delete Row'>
                                                    <StyledAcivityCountsButtons
                                                        onClick={() => btnDeleteRowClicked(selectedRowTabIndex)}
                                                        variant='outlined'
                                                        endIcon={<DeleteIcon />}
                                                        disabled={false}
                                                    >
                                                        Delete
                                                    </StyledAcivityCountsButtons>
                                                </Tooltip>
                                            </Grid>

                                            <Grid item xs={6}>
                                                <Tooltip title='Move Row Up'>
                                                    <StyledAcivityCountsButtons
                                                        onClick={() => btnMoveRowClicked(selectedRowTabIndex, 'up')}
                                                        variant='outlined'
                                                        endIcon={<MoveUpIcon />}
                                                        disabled={false}
                                                    >
                                                        Move
                                                    </StyledAcivityCountsButtons>
                                                </Tooltip>
                                            </Grid>

                                            <Grid item xs={6}>
                                                <Tooltip title='Move Row Down'>
                                                    <StyledTextButton
                                                        onClick={() => btnMoveRowClicked(selectedRowTabIndex, 'down')}
                                                        variant='outlined'
                                                        endIcon={<MoveDownIcon />}
                                                        disabled={false}
                                                    >
                                                        Move
                                                    </StyledTextButton>
                                                </Tooltip>
                                            </Grid>
                                        </Grid>
                                    </Box>

                                    {/* selected row data*/}
                                    <Box sx={{ width: '65%', marginTop: '1px' }}>
                                        {/* add column buttons */}
                                        <Box
                                            sx={{
                                                paddingTop: '1px',
                                                paddingRight: '5px',
                                                display: 'flex',
                                                width: '100%',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <Box>
                                                <InputLabel sx={{ marginLeft: '15px' }}>
                                                    {`Columns for ${selectedRow?.rowLabel}`}
                                                </InputLabel>
                                            </Box>
                                            <Box>
                                                <StyledTextButton
                                                    sx={{ marginLeft: '20px', marginTop: '-5px' }}
                                                    color='secondary'
                                                    onClick={() => onAddColumn()}
                                                >
                                                    Add Column
                                                </StyledTextButton>
                                            </Box>
                                            <Box>
                                                <StyledTextButton
                                                    onClick={refreshCountsGrid}
                                                    color='secondary'
                                                    sx={{ marginLeft: '20px', marginTop: '-5px' }}
                                                >
                                                    Refresh Grid
                                                </StyledTextButton>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Typography variant='caption'>
                                                Click Refresh Grid to see changes to columns.
                                            </Typography>
                                        </Box>
                                        <Box sx={{ marginTop: '15px' }}>
                                            {selectedRow && (
                                                <RowDataForm
                                                    selectedRow={selectedRow}
                                                    rowHeader={rowHeader}
                                                    refreshCountsGrid={refreshCountsGrid}
                                                    selectedRowColumnsUpdate={onSelectedRowColumnsUpdate}
                                                    onErrorExistsChange={handleRowDataError}
                                                />
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            </WidgetContainer>
                        </Box>
                    </Box>

                    {/* Activity Counts Widget Grid */}
                    <Box
                        sx={{
                            display: 'flex',
                            marginLeft: '20px',
                            flexBasis: '40%',
                            flexDirection: 'column',
                            marginTop: '35px',
                            marginRight: '15px',
                        }}
                    >
                        {widgetDataCache && <CountsWidget widgetDataCache={widgetDataCache} />}
                        {errorMessages.length > 0 &&
                            errorMessages.map((message: string, idx: number) => {
                                return (
                                    <Box key={idx} sx={{ color: 'white', marginTop: '40px' }}>
                                        <Typography>{message}</Typography>
                                    </Box>
                                );
                            })}
                    </Box>
                </Box>

                {/* column count summary section */}
                <Box sx={{ marginTop: '30px' }}>
                    <Accordion sx={{ backgroundColor: '#3d4149', width: '99%' }}>
                        <AccordionSummary expandIcon={<DownIconButton />}>
                            <Box sx={{ marginTop: '5px' }}>
                                <Typography sx={{ fontWeight: '700' }}>Define Column Totals</Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            {selectedRow && (
                                <CountsSummaryForm
                                    activityCountsData={activityCountsData}
                                    columnNamesMap={columnNamesMap}
                                    rowNames={rowNames}
                                    columnTotals={activityCountsData.defineColumnTotals}
                                    numberOfColumns={numberOfColumns}
                                    summaryRowLabel={activityCountsData.summaryRowLabel}
                                    setSummaryRowLabel={setSummaryRowLabel}
                                    setOutputPositionToDrop={setOutputPositionToDrop}
                                    selectedRowLabel={selectedRow.rowLabel}
                                    prevSelectedCountSummaryTabIndex={prevSelectedCountSummaryTabIndex}
                                    setPrevSelectedCountSummaryTabIndex={setPrevSelectedCountSummaryTabIndex}
                                    refreshCountsGrid={refreshCountsGrid}
                                />
                            )}
                        </AccordionDetails>
                    </Accordion>
                </Box>
            </DialogContent>
            <DialogActions>
                <StyledTextButton
                    variant='outlined'
                    onClick={onCancel}
                    title={'Cancel'}
                    startIcon={<XIcon size={16} />}
                >
                    Cancel
                </StyledTextButton>
                <StyledTextButton
                    variant='contained'
                    onClick={onCloseActivityCountsUI}
                    disabled={errorExists}
                    title={'Save Changes'}
                    startIcon={<SaveIcon size={16} />}
                >
                    Save
                </StyledTextButton>
            </DialogActions>
        </Dialog>
    );
};
export default ActivityCountsForm;
