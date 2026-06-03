//react imports
import React, { useContext, useEffect, useRef, useState } from 'react';

//arcgis component imports
import FeatureLayerView from '@arcgis/core/views/layers/FeatureLayerView';
import SceneView from '@arcgis/core/views/SceneView';
import MapView from '@arcgis/core/views/MapView';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { StyledAgGrid, StyledFullHeightDiv } from '../styles';
import Field from '@arcgis/core/layers/support/Field';
import PortalUser from '@arcgis/core/portal/PortalUser';
import { ActionButton, WidgetActions } from '../../common';

//ag-grid component imports
import {
    ColDef,
    DragStoppedEvent,
    FilterChangedEvent,
    FilterOpenedEvent,
    FirstDataRenderedEvent,
    GridApi,
    GridReadyEvent,
    IDatasource,
    RowSelectedEvent,
    SelectionChangedEvent,
    SortChangedEvent,
} from 'ag-grid-community';
import { IGetRowsParams } from 'ag-grid-community/dist/lib/interfaces/iDatasource';

//custom component imports
import ZoomToFeatureButton from '../components/ZoomToFeatureButton';
import ColumnFilterButton from '../components/ColumnFilterButton';
import { useSnackbar } from 'notistack';
import { RowStatusEnum } from '../resources';

//context imports
import { MapContext } from '../../../contexts/Map';
import { TacticalGridContext } from '../../../contexts/TacticalGrid';
import { useSaveLoadContext } from '../../../contexts/SaveLoad';
import { ToolbarContext } from '../../../contexts/Toolbar';

//helper imports
import { ConfigHelper } from '../../../helpers/configHelper';
import queryFeaturesFromMapLayer from '../helpers/mapHelper';
import { dateFormatter, isLockingStatus, queryData } from '../helpers/gridHelper';
import { getMissionIdByTitle } from '../../../helpers/missionHelper';
import { currentPortalUser } from '../../../helpers/portalUsersHelper';

//Grid styles
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine-dark.css';
import { StratLeadExpirationRenderer, supportMissionId } from '../renderers/StratLeadExpirationRenderer';
import { FeatureSelectionContext, SelectionMode } from '../../../contexts/FeatureSelectionContext';
import { ITacticalGridSettings } from '../../../interfaces/UserSaveState';
import { useAppSelector } from '../../../hooks/hooks';

interface FeatureLayerGridProps {
    featureLayer: FeatureLayer;
    ellipseLayer?: FeatureLayer;
    showEllipseForSelected: boolean;
    isAdminUser: boolean;
    tacticalGridDataSourceReset(oids: number[] | undefined): void;
    tacticalGridSettings: ITacticalGridSettings;
}

const FeatureLayerGrid = (props: FeatureLayerGridProps): JSX.Element => {
    const appConfig = ConfigHelper.getAppConfig();
    const { featureLayer, isAdminUser, showEllipseForSelected, tacticalGridDataSourceReset, tacticalGridSettings } =
        props;
    const activeView = useAppSelector((state) => state.webMapViewSlice.activeView);

    const { mapView, sceneView } = useContext(MapContext);
    const currentUser = useRef<PortalUser>();
    const { enqueueSnackbar } = useSnackbar();

    const gridContainer = useRef<HTMLDivElement | null>();
    const view = useRef<SceneView | MapView>();
    const gridLayerView = useRef<FeatureLayerView>();
    const menuItem = useRef<HTMLElement>();

    const [gridLayer, setGridLayer] = useState<FeatureLayer>();
    const [missionId, setMissionId] = useState<string>('');
    const selectedRowsRef = useRef<any[]>();
    const gridApiRef = useRef<GridApi>();
    const missionIdRef = useRef<string>('');
    const gridCheckedRef = useRef<boolean>(false);

    const {
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
        getUserGridState,
        saveUserGridState,
        refreshRate,
        highlightTimeout,
        gridColumnsWidthIsValid,
        setHighlightTimeout,
        setAliasNameToFieldNameMap,
    } = useContext(TacticalGridContext);

    const { tGridCanRender, setTGridCanRender } = useContext(ToolbarContext);
    const { selectionLayer, setSelectionData, clearSelection, featureSelection } = useContext(FeatureSelectionContext);
    const saveLoadContext = useSaveLoadContext();
    const tacticalGridSettingsRef = useRef<ITacticalGridSettings | undefined>();

    /**this value will be set to the OID field alias value if it exists otherwise the name of the OID field name
     * Now setting this value based on the feature layer's objectIdField rather than assuming it to be objectid.
     */
    const [oidFieldName, setOidFieldName] = useState<string>('');

    useEffect(() => {
        getMissionId();
        getUser();
        tGridCanRender === undefined && setTGridCanRender(true);
        let interval: number;
        if (refreshRate) {
            interval = setInterval(() => {
                gridApiRef.current?.refreshInfiniteCache();
            }, refreshRate * 1000);
        }
        return () => {
            //in case the tab is closed while the filter menu is open
            gridContainer.current?.ownerDocument.removeEventListener('click', hideMenu);
            //save grid settings when component is destroyed
            currentUser.current &&
                saveUserGridState(currentUser.current, missionIdRef.current, tacticalGridSettingsRef.current);
            refreshRate && clearInterval(interval);
            setColumnState(undefined);
            setFilterState(undefined);
            setHighlightTimeout(undefined);
        };
    }, [refreshRate]);

    const ftrIsSelectedInGridRef = useRef<boolean>(false);

    useEffect(() => {
        if (featureSelection) {
            featureSelectionUpdated();
        }
    }, [featureSelection]);

    useEffect(() => {
        if (tacticalGridSettings) {
            tacticalGridSettingsRef.current = { ...tacticalGridSettings };
        }
    }, [tacticalGridSettings]);

    useEffect(() => {
        const syncMapSelectionWithGrid = async () => {
            selectedRowsRef.current = selectedRows;

            if (!view.current || !gridLayer) return;

            if (!selectedRows || selectedRows.length === 0) {
                clearSelection();
                gridApi?.deselectAll();
                setSelectionData(view.current, featureLayer, [], SelectionMode.NewSelectionSet);
            }

            const selectedOIDs = selectedRows.map((row) => row[oidFieldName]);
            if (selectedOIDs.length > 0) {
                setSelectionData(view.current, featureLayer, selectedOIDs, SelectionMode.NewSelectionSet);
            }
        };

        syncMapSelectionWithGrid();
    }, [selectedRows]);

    useEffect(() => {
        if (featureLayer) {
            setGridLayer(featureLayer);
            const fieldName: any = featureLayer.objectIdField;
            const oidField = featureLayer.fields.find((field) => field.name === fieldName);
            const oidFieldName = oidField && oidField.alias ? oidField.alias : fieldName;
            setOidFieldName(oidFieldName.toLowerCase());
        }
    }, [featureLayer]);

    useEffect(() => {
        if (tGridCanRender && gridApi) {
            gridApi.redrawRows();
        }
    }, [tGridCanRender]);

    useEffect(() => {
        if (activeView === 'SCENE') {
            //the grid should not continue to use the same column definitions when a view changes which
            //presents a different grid - this was a bug in the previous version
            setColDefs([]); //clear old definitions so new ones can be generated for this grid layer if one exists
            view.current = sceneView;
        } else {
            view.current = mapView;
        }
    }, [activeView]);

    /**
     * if widths have defaulted to the min width in the grid saved state, don't use those values- force the
     * grid to resize the columns back to the default which is based on the length of the column header's text
     */
    useEffect(() => {
        if (gridColumnsWidthIsValid === false) {
            const errorMessage = 'Was not able to re-set column widths from saved state. Using default widths.';
            enqueueSnackbar(errorMessage, { variant: 'warning' });
            console.error(errorMessage);
        }
    }, [gridColumnsWidthIsValid]);

    useEffect(() => {
        if (!gridColumnApi || !gridLayer?.loaded || !missionId || !tGridCanRender || !view.current) return;
        if (gridLayerView.current) return; // already initialized

        let definitionExprHandle: __esri.WatchHandle;
        //get client side layerView
        //view is now set in a useEffect that watches the context sceneView and mapView
        const setupGrid = async () => {
            try {
                const layerView = await view.current!.whenLayerView(gridLayer);
                gridLayerView.current = layerView;

                if (!colDefs || colDefs.length === 0 || !isAdminUser) {
                    const lastEditedDateFieldIndex = gridLayer.fields.findIndex(
                        (field) => field.name === appConfig.gate.lastUpdatedFieldName
                    );
                    /* Move the last updated field column to be the first column in the grid; however, this will NOT
                       override any custom column positioning that the user has made */
                    if (lastEditedDateFieldIndex > -1) {
                        [gridLayer.fields[lastEditedDateFieldIndex], gridLayer.fields[0]] = [
                            gridLayer.fields[0],
                            gridLayer.fields[lastEditedDateFieldIndex],
                        ];
                    } else {
                        console.debug(
                            `Failed to find the last updated field named: ${appConfig.gate.lastUpdatedFieldName}`
                        );
                    }

                    const columns = getColumnDefinitions(gridLayer.fields) ?? [];
                    const lastEditedField = columns.find(
                        (item) => item.field === appConfig.tacticalGrid.stratLeadCompareField
                    );

                    if (lastEditedField) {
                        lastEditedField.cellRenderer = StratLeadExpirationRenderer;
                    }

                    setColDefs(columns);
                }

                setGridDataSource();

                definitionExprHandle = featureLayer.watch('definitionExpression', (_) => {
                    setGridDataSource();
                    gridApiRef.current?.refreshInfiniteCache();

                    const oids: number[] = [];
                    if (selectedRowsRef.current) {
                        selectedRowsRef.current.forEach((row) => {
                            oids.push(row[oidFieldName]);
                        });
                    }
                    tacticalGridDataSourceReset([...oids]);
                });
            } catch (error) {
                enqueueSnackbar('Error loading tactical grid layer', { variant: 'error' });
                console.error(error);
            }
        };

        setupGrid();

        return () => {
            definitionExprHandle?.remove();
            clearSelection();
        };
    }, [gridColumnApi, gridLayer, missionId, tGridCanRender, oidFieldName]);

    useEffect(() => {
        gridApiRef.current = gridApi;
    }, [gridApi]);

    /**
     * Synchronizes the AG Grid selection with the current feature selection on the map.
     *
     * This function:
     * - Deselects all rows in the grid if the map selection is empty
     * - Selects rows in the grid that match selected features from the map
     * - Scrolls to the first matching row for visibility
     *
     * It relies on:
     * - `featureSelection` from the FeatureSelectionContext (list of OIDs selected on map)
     * - `gridLayer` as the source layer for the grid (must match the map-selected layer)
     * - `gridApi` from AG Grid for row selection and scrolling
     */
    function featureSelectionUpdated() {
        if (!gridApi || !gridLayer?.objectIdField) return;
        // If no selection on the map, clear grid selection
        if (featureSelection.length === 0) {
            const selectedRows = gridApi.getSelectedRows();
            if (selectedRows && selectedRows.length > 0) {
                gridApi.deselectAll();
            }
            setSelectedRows(undefined); // Reset internal state
            return;
        }
        if (!selectionLayer || selectionLayer.id !== gridLayer.id) return;

        const layerOidField = gridLayer.objectIdField;

        // Map selection is active — sync it to the grid
        const selectedOids = new Set(featureSelection); // Faster than Array.includes()
        let firstMatchedRowIndex: number | null = null;

        // Loop through grid rows and match against map-selected OIDs
        gridApi.forEachNode((node) => {
            const rowOid = node.data?.[layerOidField];

            if (rowOid != null && selectedOids.has(rowOid)) {
                node.setSelected(true); // Select row in grid

                if (firstMatchedRowIndex === null) {
                    firstMatchedRowIndex = node.rowIndex; // Remember first match
                }
            }
        });

        // Scroll to the first matching row for user visibility
        if (firstMatchedRowIndex != null) {
            gridApi.ensureIndexVisible(firstMatchedRowIndex, 'middle');
        }
    }

    const getMissionId = async () => {
        const newId = await getMissionIdByTitle(saveLoadContext.missionSelect);
        if (newId) {
            supportMissionId.setMissionId(newId);
            setMissionId(newId);
            missionIdRef.current = newId;
        } else {
            supportMissionId.setMissionId('error');
            setMissionId('error');
            console.log('Error getting mission id to pass to the expirations renderer.');
        }
    };

    const getUser = async () => {
        currentUser.current = await currentPortalUser();
    };

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
        const selectedGridRows = event.api.getSelectedRows();
        if (selectedGridRows && selectedGridRows.length > 0) {
            //update table from server side feature layer
            gridApi?.refreshInfiniteCache();
            gridCheckedRef.current = true;
        } else {
            gridCheckedRef.current = false;
        }
    };

    /**
     * Move the grid to the page containing the most recently selected row.
     * @param rowIndex row index of most recently selected row
     */
    const moveGridPageToSelectedRow = (rowIndex: number | null) => {
        if (gridApi && rowIndex !== null && rowIndex !== undefined) {
            const rows = gridApi?.paginationGetPageSize();
            const pageNum = Math.floor(Number(rowIndex === 0 ? 1 : rowIndex) / rows);
            gridApi?.paginationGoToPage(pageNum);
        }
    };

    const onRowSelected = (event: RowSelectedEvent) => {
        const isSelected = event.node.isSelected();
        const rowArray = event.api.getSelectedRows(); // pull fresh from AG Grid
        setSelectedRows(rowArray); // always sync state

        const maxSelectedRows = appConfig.tacticalGrid.maximumSelectedRowsAllowed;
        const rowIsLocked = isLockingStatus(event.data.eval_status);
        const oid = gridApi?.getValue(oidFieldName, event.node);
        if (!oid) return;

        // Enforce selection limits
        if (rowArray && rowArray.length > maxSelectedRows && isSelected) {
            enqueueSnackbar(`Maximum number of selected rows exceeded. Max: ${maxSelectedRows} `, {
                variant: 'warning',
            });
            event.node.setSelected(false);
            return;
        }

        // Don't let non-admins select locked rows
        if (!isAdminUser && rowIsLocked && isSelected && !showEllipseForSelected) {
            event.node.setSelected(false);
            return;
        }

        // Flag: grid initiated selection
        ftrIsSelectedInGridRef.current = true;

        // Scroll to selected row (UX)
        if (isSelected) {
            moveGridPageToSelectedRow(event.node.rowIndex);
            if (rowIsLocked && !showEllipseForSelected) {
                enqueueSnackbar('Row status previously set by another user', {
                    variant: 'info',
                });
            }
        }

        // Update map selection
        if (view.current) {
            if (showEllipseForSelected && !ftrIsSelectedInGridRef.current) {
                if (isSelected) {
                    setSelectionData(
                        view.current,
                        featureLayer,
                        [oid],
                        SelectionMode.RemoveFromSelectionSet,
                        false,
                        true
                    );
                }
            } else {
                setSelectionData(
                    view.current,
                    featureLayer,
                    [oid],
                    isSelected ? SelectionMode.NewSelectionSet : SelectionMode.RemoveFromSelectionSet
                );
            }
        }
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
            currentUser.current && getUserGridState(currentUser.current, missionIdRef.current);
        } else {
            //apply column state from memory to ui
            event.columnApi.applyColumnState({ state: columnState, applyOrder: true });
        }
        filterState && event.api.setFilterModel(filterState);
    };

    /**
     * Zoom and pan map to the feature selected in the tactical grid
     * @param data selected feature
     */
    const zoomToFeature = async (data: any) => {
        const objectid = data[oidFieldName];
        const results = await queryFeaturesFromMapLayer(objectid, featureLayer, featureLayer.objectIdField);
        if (view?.current) {
            results &&
                results.features.length > 0 &&
                view?.current.goTo(results.features, { speedFactor: appConfig.panningSpeed }).then(() => {
                    if (view?.current) {
                        //still needs to be valid when the promise resolves
                        view.current.scale = appConfig.tacticalGrid.zoomViewScale;
                    }
                });
        }
    };

    const setGridDataSource = () => {
        const dataSource = {
            rowCount: undefined,
            getRows: (params: IGetRowsParams) => {
                queryData(params, gridLayer as FeatureLayer).then(
                    (rowsThisPage) => {
                        if (rowsThisPage) {
                            const lastRow = rowsThisPage.totalRows;
                            params.successCallback(rowsThisPage.rows, lastRow);
                            /* use alias names in the grid display but all business logic
                             is implemented with the actual field names in the CreateStratleadDialog.tsx form */
                            setAliasNameToFieldNameMap(rowsThisPage.aliasNameToFieldNameMap);
                        }

                        //apply saved row selection
                        let index = selectedRowsRef.current ? selectedRowsRef.current.length - 1 : -1;
                        while (index >= 0 && selectedRowsRef.current) {
                            const row = selectedRowsRef.current[index];
                            const node = gridApi?.getRowNode(row[oidFieldName].toString());
                            if (node) {
                                //if a row is locked, do not select and remove from saved selections
                                const status = gridApi?.getValue(appConfig.tacticalGrid.statusField, node);
                                if (
                                    //allow node to be added to the selection under these conditions
                                    showEllipseForSelected ||
                                    isAdminUser ||
                                    !isLockingStatus(status) ||
                                    status === RowStatusEnum.ISSUING_STRATLEAD ||
                                    status === RowStatusEnum.UPDATING_STRATLEAD
                                ) {
                                    node.setSelected(true);
                                } else {
                                    //remove locked rows from the selection for non-admins
                                    selectedRowsRef.current?.splice(index, 1);
                                    setSelectedRows(selectedRowsRef.current);
                                }
                            }
                            index -= 1;
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

    /**take needed action to refresh the grid data */
    function refreshGrid() {
        gridApi?.refreshInfiniteCache();
    }

    /** Custom refresh button to place in filter cell of grid */
    const CustomRefreshButtonHeader = () => {
        // handle the refresh button click event
        const onRefreshBtnClick = () => {
            refreshGrid();
        };
        return (
            <>
                <WidgetActions>
                    <ActionButton
                        variant={'contained'}
                        color={'secondary'}
                        type={'button'}
                        title={'Refresh data'}
                        onClick={onRefreshBtnClick}
                        size='small'
                    >
                        Refresh
                    </ActionButton>
                </WidgetActions>
            </>
        );
    };

    const getColumnDefinitions = (fields: Field[]) => {
        //set column definitions
        const numberFieldTypes = ['small-integer', 'integer', 'single', 'double', 'long', 'oid'];
        const dateFieldTypes = ['date'];
        const cols = fields?.map((field) => {
            let colType: string;
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

        //add action column to first column - this controls the filter button column
        cols?.unshift({
            headerName: '',
            headerComponentFramework: ColumnFilterButton,
            cellRenderer: 'zoomBtnRenderer',
            suppressMovable: true,
            resizable: false,
            minWidth: 130,
            checkboxSelection: () => {
                //hides checkbox if status field row is locked unless the user is an admin - allows admins to clear status
                return true; /* isAdminUser || showEllipseForSelected
                    ? 'false'
                    : !!(params.data && !isLockingStatus(params.data[appConfig.tacticalGrid.statusField])); */
            },
            filter: true,
            sortable: false,
            floatingFilterComponentFramework: CustomRefreshButtonHeader,
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
                }}
                getDocument={() => gridContainer.current?.ownerDocument as Document}
                getRowNodeId={(data) => {
                    return data[oidFieldName];
                }}
                rowModelType={'infinite'}
                cacheBlockSize={100}
                cacheOverflowSize={2}
                maxConcurrentDatasourceRequests={2}
                infiniteInitialRowCount={1}
                maxBlocksInCache={2}
                pagination={true}
                paginationPageSize={tacticalGridSettings ? Number(tacticalGridSettings.visibleRowCount) : 30}
                rowHeight={tacticalGridSettings ? Number(tacticalGridSettings.rowHeight) : 25}
                //enableFilter={true}
                paginationAutoPageSize={tacticalGridSettings.rowHeight === '0'}
                suppressCellSelection={true}
                enableCellTextSelection={true}
                ensureDomOrder={true}
                suppressColumnVirtualisation={true}
                rowSelection={'multiple'}
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
                context={{ zoomToFeature }}
                frameworkComponents={{
                    zoomBtnRenderer: ZoomToFeatureButton,
                }}
                rowClassRules={{
                    'row-locked': (params) => {
                        const status = params.api.getValue(appConfig.tacticalGrid.statusField, params.node);
                        return params.node.data && isLockingStatus(status);
                    },
                    'row-evaluating': (params) => {
                        const status = params.api.getValue(appConfig.tacticalGrid.statusField, params.node);
                        return params.node.data && status === RowStatusEnum.EVALUATING;
                    },
                    'row-updated': (params) => {
                        if (highlightTimeout && params.node && params.node.data) {
                            const recordDateStr = params.api.getValue('last_edited_date', params.node);
                            const recordDateTime = new Date(recordDateStr);
                            const currentDateTime = new Date();
                            currentDateTime.setMinutes(currentDateTime.getMinutes() - highlightTimeout);
                            return recordDateTime >= currentDateTime;
                        } else {
                            return false;
                        }
                    },
                }}
            />
        </StyledFullHeightDiv>
    );
};

export default FeatureLayerGrid;
