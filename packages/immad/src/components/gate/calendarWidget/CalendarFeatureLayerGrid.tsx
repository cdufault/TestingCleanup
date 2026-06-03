//react imports
import React, { useContext, useEffect, useRef } from 'react';

//arcgis component imports
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { StyledAgGrid, StyledFullHeightDiv } from '../../tacticalGrid/styles';
import Field from '@arcgis/core/layers/support/Field';

//ag-grid component imports
import {
    ColDef,
    FilterOpenedEvent,
    FirstDataRenderedEvent,
    GridApi,
    IDatasource,
    RowSelectedEvent,
} from 'ag-grid-community';
import {
    DragStoppedEvent,
    FilterChangedEvent,
    GridReadyEvent,
    SelectionChangedEvent,
    SortChangedEvent,
} from 'ag-grid-community';
import { IGetRowsParams } from 'ag-grid-community/dist/lib/interfaces/iDatasource';

//custom component imports
import CalendarGridColumnFilterButton from '../calendarWidget/CalendarGridColumnFilterButton';
import { useSnackbar } from 'notistack';

//context imports
import { CalendarFeatureGridContext } from './CalendarFeatureLayerGridContext';

//Grid styles
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine-dark.css';
import WatchHandle = __esri.WatchHandle;
import { queryCalendarData, fromJSMapToKeyValueObject, dateFormatter } from '../GateDataEditorHelper';
import { useAppDispatch, useAppSelector } from '../../../hooks/hooks';
import { setSelectedEventToEdit, setIsUpdate } from '../GateDataEditorSlice';
import { GateCalendarEventSerializable } from '@stratcom/lib-functions';

interface FeatureLayerGridProps {
    featureLayer: FeatureLayer;
}

const CalendarFeatureLayerGrid = (props: FeatureLayerGridProps): JSX.Element => {
    const { featureLayer } = props;
    const { enqueueSnackbar } = useSnackbar();
    const gridContainer = useRef<HTMLDivElement | null>();
    const menuItem = useRef<HTMLElement>();
    const selectedRowsRef = useRef<any[]>();
    const gridApiRef = useRef<GridApi>();
    const gridCheckedRef = useRef<boolean>(false);
    const emptyGridSerializableEvent: GateCalendarEventSerializable = {
        region_name: '',
        objectid: '',
        globalid: '',
        event_name: '',
        date_start: 0,
        date_end: 0,
        location: null,
        description: '',
        participants: '',
        recurring: 0,
        initial_date: 0,
        recurrence_type: null,
        recurrence_pattern: null,
        recurrence_end_date: null,
        number_of_occurrences: 0,
        is_child_record: 0,
        is_master_record: 0,
        parent_guid: null,
        number_of_days: 0,
        important_anniversary: 0,
        comments: '',
        classification: 'Unclassified',
        highlight: false,
        alternate_calendar: null,
        icod: undefined,
    };
    const {
        aliasNameToFieldNameMap,
        setAliasNameToFieldNameMap,
        columnState,
        setColumnState,
        filterState,
        setFilterState,
        selectedRows,
        setSelectedRows,
        colDefs,
        setColDefs,
        gridApi,
        setGridApi,
        gridColumnApi,
        setGridColumnApi,
    } = useContext(CalendarFeatureGridContext);
    const dispatch = useAppDispatch();
    const ftrIsSelectedInGridRef = useRef<boolean>(false);
    const currentMissionName = useAppSelector((state) => state.gateCalendarEditorSlice.currentMissionName);

    useEffect(() => {
        let definitionExprHandle: WatchHandle;
        //no longer render the grid if its tab is not visible/selected
        if (gridColumnApi && featureLayer) {
            if (!colDefs || colDefs.length === 0) {
                const columns = getColumnDefinitions(featureLayer.fields) ?? [];
                setColDefs(columns);
            }
            setGridDataSource();
            // Update data source and grid when definitionExpression changes (Filter widget).
            definitionExprHandle = featureLayer.watch('definitionExpression', (_) => {
                setGridDataSource();
                gridApiRef.current?.refreshInfiniteCache();
            });
        }
        return () => {
            definitionExprHandle?.remove();
        };
    }, [gridColumnApi, featureLayer]);

    useEffect(() => {
        gridApiRef.current = gridApi;
    }, [gridApi]);

    useEffect(() => {
        selectedRowsRef.current = selectedRows;
    }, [selectedRows]);

    //work around for filter menu not closing in popout
    const hideMenu = (clickEvent: MouseEvent) => {
        const clickedEl = clickEvent.target as HTMLElement;

        //selected/nested option items are not found by 'contains' so identify them using class
        const isMenuSelectItem = clickedEl.parentElement?.className.includes('ag-select-list');

        //hide the menu if the clicked item is outside the menu and it is not a ag-grid select
        if (menuItem.current && !isMenuSelectItem && !menuItem.current?.contains(clickedEl)) {
            gridApi?.hidePopupMenu();
            gridContainer.current?.ownerDocument.removeEventListener('click', hideMenu);
            menuItem.current = undefined;

            //turn filter menu buttons back on
            const buttons = gridContainer.current?.getElementsByClassName('ag-floating-filter-button-button');
            buttons &&
                Array.from(buttons).forEach((btn: HTMLButtonElement) => {
                    btn.disabled = false;
                });
        }
    };

    const onGridReady = (params: GridReadyEvent) => {
        //fires when the grid is created, either initial load or popout
        setGridApi(params.api);
        setGridColumnApi(params.columnApi);
    };

    const onSelectionChange = async (event: SelectionChangedEvent) => {
        let selectedGridRows = event.api.getSelectedRows();
        if (selectedGridRows && selectedGridRows.length > 0) {
            //update table from server side feature layer
            gridApi?.refreshInfiniteCache();
            gridCheckedRef.current = true;
            const selectedRow = selectedGridRows[0];
            if (aliasNameToFieldNameMap && selectedRow) {
                const rowConvertedFromAliasNamesToFieldNames = fromJSMapToKeyValueObject(
                    selectedRow,
                    aliasNameToFieldNameMap
                );
                const newCalendarObject = rowConvertedFromAliasNamesToFieldNames as GateCalendarEventSerializable;
                dispatch(setSelectedEventToEdit(newCalendarObject));
            }
        } else {
            gridCheckedRef.current = false;
            selectedGridRows = [];
            setSelectedRows(undefined);
            dispatch(setIsUpdate(false));
            dispatch(setSelectedEventToEdit(emptyGridSerializableEvent));
        }
    };

    const onRowSelected = (event: RowSelectedEvent) => {
        const isSelected = event.node.isSelected();
        const maxSelectedRows = 1;
        const rowArray = gridApi?.getSelectedRows();
        if (rowArray && rowArray.length > maxSelectedRows && isSelected) {
            enqueueSnackbar(`Maximum number of selected rows exceeded. Max: ${maxSelectedRows} `, {
                variant: 'warning',
            });
            event.node.setSelected(false);
            return;
        }
        ftrIsSelectedInGridRef.current = true;
    };

    const onDragStopped = (event: DragStoppedEvent) => {
        setColumnState(event.columnApi.getColumnState());
    };
    const onFilterChanged = (event: FilterChangedEvent) => {
        setFilterState(event.api.getFilterModel());
    };
    const onSortChanged = (event: SortChangedEvent) => {
        setColumnState(event.columnApi.getColumnState());
    };
    const onFilterOpened = (event: FilterOpenedEvent) => {
        //this event fires on initialize, so check to see if the filter menu is open
        if (event.eGui.isConnected) {
            menuItem.current = event.eGui;
            //watch the owner document for a click to close the filter menu
            gridContainer.current?.ownerDocument.addEventListener('click', hideMenu);

            //prevent grid from opening two filter menus simultaneously
            //this is necessary because the grid filter button click event fires before the owner doc click
            const buttons = gridContainer.current?.getElementsByClassName('ag-floating-filter-button-button');
            buttons &&
                Array.from(buttons).forEach((btn: HTMLButtonElement) => {
                    btn.disabled = true;
                });
        }
    };
    const onFirstDataRendered = (event: FirstDataRenderedEvent) => {
        if (!columnState) {
            event.columnApi.autoSizeAllColumns();
            //get user settings from portal the first time the grid is loaded
        } else {
            //apply column state from memory to ui
            event.columnApi.applyColumnState({ state: columnState, applyOrder: true });
        }
        filterState && event.api.setFilterModel(filterState);
    };

    /**
     * Queries the calendar feature layer to set the source and filter for the grid data
     */
    const setGridDataSource = () => {
        const dataSource = {
            rowCount: undefined,
            getRows: (params: IGetRowsParams) => {
                queryCalendarData(params, featureLayer as FeatureLayer, currentMissionName).then(
                    (rowsThisPage) => {
                        if (rowsThisPage) {
                            const lastRow = rowsThisPage.totalRows;
                            params.successCallback(rowsThisPage.rows, lastRow);
                            /* use alias names in the grid display */
                            setAliasNameToFieldNameMap(rowsThisPage.aliasNameToFieldNameMap);
                        }
                        if (rowsThisPage && rowsThisPage.rows.length > 0) {
                            gridApi?.hideOverlay();
                        } else {
                            gridApi?.showNoRowsOverlay();
                        }
                    },
                    () => {
                        enqueueSnackbar('Error loading data', {
                            variant: 'error',
                        });
                    }
                );
            },
        } as IDatasource;
        gridApi?.setDatasource(dataSource);
    };

    const getColumnDefinitions = (fields: Field[]) => {
        //set column definitions
        const numberFieldTypes = ['small-integer', 'integer', 'single', 'double', 'long', 'oid'];
        const dateFieldTypes = ['date'];
        const columnNamesToShow = [
            'event_name',
            'region_name',
            'description',
            'comments',
            'participants',
            'date_start',
            'date_end',
        ];
        const cols = fields?.map((field) => {
            let colType: string;
            // hides any columns that the user doesn't need for filtering the grid
            if (!columnNamesToShow.includes(field.name)) {
                return {
                    hide: true,
                    field: field.alias ? field.alias.toLowerCase() : field.name,
                };
            }
            if (numberFieldTypes.includes(field.type)) {
                colType = 'agNumberColumnFilter';
            } else if (dateFieldTypes.includes(field.type)) {
                colType = 'agDateColumnFilter';
            } else {
                colType = 'agTextColumnFilter';
            }
            if (field.type === 'date') {
                return {
                    field: field.alias ? field.alias : field.name,
                    filter: colType,
                    //handles arcgis date format
                    valueFormatter: dateFormatter,
                    minWidth: 30,
                    flex: 0,
                };
            } else {
                return {
                    field: field.alias ? field.alias.toLowerCase() : field.name,
                    filter: colType,
                    minWidth: 30,
                    flex: 0,
                };
            }
        }) as ColDef[];

        //add action column to first column
        cols?.unshift({
            headerName: '',
            headerComponentFramework: CalendarGridColumnFilterButton,
            suppressMovable: true,
            resizable: false,
            minWidth: 10,
            flex: 0,
            checkboxSelection: () => {
                return true;
            },
            filter: false,
            sortable: false,
            floatingFilter: false,
            pinned: true,
        } as ColDef);
        return cols;
    };

    return (
        <StyledFullHeightDiv className='ag-theme-alpine-dark' ref={(node) => (gridContainer.current = node)}>
            <StyledAgGrid
                defaultColDef={{
                    flex: 1,
                    minWidth: 30,
                    filter: true,
                    sortable: true,
                    floatingFilter: true,
                    resizable: true,
                    suppressMenu: true,
                    suppressToolPanel: true,
                }}
                getDocument={() => gridContainer.current?.ownerDocument as Document}
                getRowNodeId={(data) => {
                    return data.objectid;
                }}
                rowModelType={'infinite'}
                cacheBlockSize={100}
                cacheOverflowSize={2}
                maxConcurrentDatasourceRequests={2}
                infiniteInitialRowCount={1}
                maxBlocksInCache={2}
                pagination={true}
                paginationPageSize={15}
                rowHeight={25}
                paginationAutoPageSize={'0'}
                suppressCellSelection={true}
                enableCellTextSelection={true}
                ensureDomOrder={true}
                suppressColumnVirtualisation={true}
                rowSelection={'single'}
                suppressRowClickSelection={true}
                onSelectionChanged={onSelectionChange}
                onDragStopped={onDragStopped}
                onGridReady={onGridReady}
                onFirstDataRendered={onFirstDataRendered}
                onFilterChanged={onFilterChanged}
                onSortChanged={onSortChanged}
                onFilterOpened={onFilterOpened}
                onRowSelected={onRowSelected}
                columnDefs={colDefs}
                domLayout={'autoHeight'}
            />
        </StyledFullHeightDiv>
    );
};

export default CalendarFeatureLayerGrid;
