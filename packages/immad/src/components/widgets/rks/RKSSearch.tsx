// React imports
import React, { useEffect, useState, ChangeEvent, useContext, useRef } from 'react';

// Component imports

import {
    Tabs,
    Tab,
    MenuItem,
    FormControlLabel,
    Checkbox,
    Snackbar,
    Input,
    ListItemText,
    TextField,
    Box,
    RadioGroup,
    Radio,
    Typography,
    Alert,
} from '@mui/material';

import {
    WidgetContainer,
    FieldGroup,
    InputLabel,
    InlineSelect,
    WidgetActions,
    ActionButton,
    WidgetContent,
    CheckBoxGroup,
} from '../../common';
import { AppBar, InputField, InputGroup } from '../../common/styles';

import {
    executeRKSSearch,
    createRKSLayers,
    validateRKSConfigItems,
    retrieveRKSMetaData,
    mergeEntityIdElements,
} from './helpers/RKSSearchViewModel';

import { preFeatureObj, RKSSearchType, RKSEntityType } from './helpers/RKSInterfaces';
import { MapContext } from '../../../contexts/Map';
import MapView from '@arcgis/core/views/MapView';
import SceneView from '@arcgis/core/views/SceneView';
import JsonView from './views/jsonView';
import useDataTable from './views/dataTableHooks';
import DataTableHeader from './views/dataTableHeader';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { LogHelper } from '../../../helpers/logHelper';
import { ConfigHelper } from '../../../helpers/configHelper';
import { AppConfig } from '../../../interfaces/AppConfig';
import { useSnackbar } from 'notistack';
import Sketch from '@arcgis/core/widgets/Sketch';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';

function RKSSearch(): JSX.Element {
    const { mapViewInitialized, sceneViewInitialized, getMapView, getSceneView, activeView } = useContext(MapContext);

    const [errorText, setErrorText] = useState('');
    const [searchText, setSearchText] = useState('');
    const [layerName, setLayerName] = useState('');
    const [zoomToLayerExtent, setZoomToLayerExtent] = useState(true);
    const [maxRecordCount, setMaxRecordCount] = useState(100);
    const [maxDetailsRecordCount, setMaxDetailsRecordCount] = useState(50);
    const [scrollId, setScrollId] = useState<string | undefined>('');
    const [showMoreResults, setShowMoreResults] = useState(true);
    const recordsRetrieved = useRef(0);
    const totalRecordsAvailable = useRef<number | undefined>(0);
    const detailsNotProcessed = useRef<number>(0);

    const [rksEntities, setRKSEntities] = useState<string[]>(['']);
    const [selectedEntity, setSelectedEntity] = useState('');
    const [tabValue, setTabValue] = useState(0);
    const [searchResultDetail, setSearchResultDetail] = useState(new Map<string, preFeatureObj>());
    const [entityIdCountMap, setEntityIdCountMap] = useState(new Map<string, number>());
    const [searchResultJson, setSearchResultJson] = useState('');

    const [postRequestJson, setPostRequestJson] = useState<string>('');

    const viewRef = useRef<SceneView | MapView>(); //used for local reference to clean sketch and graphics layser
    const [fLayer, setFLayer] = useState<FeatureLayer | undefined>(undefined);
    const [selectedDetails, setSelectedDetails] = useState<string[]>([]);
    const [availableDetails, setAvailableDetails] = useState<string[]>([]);

    const xySearchResultsNode = useRef<HTMLDivElement>(null);
    const tableSearchResultsNode = useRef<HTMLDivElement>(null);
    const [configHelper, setConfigHelper] = useState<AppConfig | undefined>(undefined);

    const { enqueueSnackbar } = useSnackbar();
    const rksSearchModes = ['test', 'global_string_search', 'field_string_search'];

    const [useSearchExtent, setUseSearchExtent] = useState(false);
    const [searchByCurrentMapExtent, setSearchByCurrentMapExtent] = useState(true);
    const [searchByDrawnExtent, setSearchByDrawnMapExtent] = useState(false);
    const [searchExtent, setSearchExtent] = useState<number[]>([]);

    const [useTimeExtent, setUseTimeExtent] = useState(false);
    const [searchByTimeWindow, setSearchByTimeWindow] = useState(false);
    const [searchByRecentUpdate, setSearchByRecentUpdate] = useState(false);
    const [timeIntervalUnit, setTimeIntervalUnit] = useState('M');
    const [timeIntervalAmount, setTimeIntervalAmount] = useState(1);
    const [startTimeExtent, setStartTimeExtent] = useState<string>('');
    const [endTimeExtent, setEndTimeExtent] = useState<string>('');
    const [timeExtent, setTimeExtent] = useState<string[]>(['now-1d']);

    const {
        composeTable: composeFtrTable,
        addFLayerToMap: addFtrLayerToMap,
        zoomToFeaturesFunc,
        toggleMapSelectionFunc,
        featureCount: featureCount,
        refreshedGrid: refreshedGrid,
        selectedFeatures,
        currentLayerViewIsConnected,
    } = useDataTable({
        allowSelection: true,
        view: viewRef.current,
        zoomToLayerExtent: zoomToLayerExtent,
        loggerMethod: LogHelper.log,
    });
    const { composeTable: composeDataTable } = useDataTable({ view: undefined });

    const [searchMode, setSearchMode] = useState<RKSSearchType>(RKSSearchType.TEST); //TODO
    const [runDebug, setRunDebug] = useState(true);

    const sketchRef = useRef<Sketch>();
    const graphicsLayerRef = useRef<GraphicsLayer>();
    const layerViewDestroyHandleRef = useRef<IHandle>();
    const sketchCreateHandleRef = useRef<IHandle>();
    const rksGraphicsSketchLayerTitle = 'RKS Search Graphic';
    const activeViewRef = useRef<'MAP' | 'SCENE'>();

    useEffect(() => {
        let view;
        if (mapViewInitialized && activeView === 'MAP') {
            view = getMapView();
        } else if (sceneViewInitialized && activeView === 'SCENE') {
            view = getSceneView();
        }
        if (view) {
            viewRef.current = view;
            if (activeViewRef.current && activeViewRef.current != activeView) {
                const gLayer = view.map.layers.find((lyr) => lyr.title === rksGraphicsSketchLayerTitle);
                if (gLayer) {
                    graphicsLayerRef.current = gLayer as GraphicsLayer;
                }
                cleanUpAfterViewChange();
            }
            layerViewDestroyHandleRef.current = viewRef.current.on('layerview-destroy', (event) => {
                if (event.layer && event.layer.title === rksGraphicsSketchLayerTitle) {
                    graphicsLayerRef.current = undefined;
                    viewRef.current && sketchRef.current && viewRef.current.ui.remove(sketchRef.current);
                    sketchRef.current = undefined;
                    sketchCreateHandleRef.current && sketchCreateHandleRef.current.remove();
                    sketchCreateHandleRef.current = undefined;

                    setSearchByCurrentMapExtent(true);
                    setSearchByDrawnMapExtent(false);
                }
            });
            activeViewRef.current = activeView;
        }
    }, [activeView]);

    useEffect(() => {
        getAppConfig();
        return () => {
            if (sketchRef.current && viewRef.current) {
                viewRef.current.ui.remove(sketchRef.current);
                sketchRef.current?.destroy();
                sketchRef.current = undefined;
            }
            sketchCreateHandleRef.current && sketchCreateHandleRef.current.remove();
            sketchCreateHandleRef.current = undefined;

            if (graphicsLayerRef.current && viewRef.current) {
                viewRef.current.map.remove(graphicsLayerRef.current);
                graphicsLayerRef.current.destroy();
                graphicsLayerRef.current = undefined;
            }

            layerViewDestroyHandleRef.current && layerViewDestroyHandleRef.current?.remove();
            layerViewDestroyHandleRef.current = undefined;
        };
    }, []);

    useEffect(() => {
        if (configHelper && searchMode) {
            if (errorText.trim() != '') {
                return;
            }
            setRunDebug(configHelper.rks.runDebug);
            try {
                getRKSEntities(searchMode);
            } catch (Error) {
                setErrorText('Error occured retrieving RKS entities. See log for more details.');
            }
        }
    }, [configHelper]);

    useEffect(() => {
        if (!searchResultDetail && searchText != '') {
            setSearchResultJson(
                JSON.stringify(
                    {
                        result: 'No items found',
                    },
                    null,
                    4
                )
            );
            setTabValue(1);
            return;
        }
        const obj = Object.fromEntries(searchResultDetail);
        const json = JSON.stringify(obj, null, 8);
        setSearchResultJson(json);

        if (searchText != '') {
            setTabValue(1);
        }
        if (sceneViewInitialized && viewRef.current && searchText != '') {
            //TODO support map view
            const fLayers = createRKSLayers(
                searchResultDetail,
                layerName,
                entityIdCountMap,
                configHelper?.rks.integerFields
            );
            setTabValue(1);

            if (Array.from(searchResultDetail.keys()).length < 1) {
                //set error condition: This is another story for later
            }

            if (fLayers[0] && xySearchResultsNode.current) {
                composeFtrTable(fLayers[0], xySearchResultsNode.current);
                setFLayer(fLayers[0]);
            }
            if (fLayers[1] && tableSearchResultsNode.current) {
                composeDataTable(fLayers[1], tableSearchResultsNode.current);
            }
        }
    }, [searchResultDetail]);

    useEffect(() => {
        try {
            if (selectedEntity) {
                getEntityDetails();
            }
        } catch (error) {
            setErrorText('Error occured retrieving RKS entity details. Check log for more information.');
        }
    }, [selectedEntity]);

    /**
     * If the view changes remove graphicsLayer, sketch widget, view change handle, and sketch create handle.
     * Switching back and forth from 2D to 3D not full supported just trying for now to prevent crashing.
     */
    function cleanUpAfterViewChange() {
        layerViewDestroyHandleRef.current && layerViewDestroyHandleRef.current?.remove();
        layerViewDestroyHandleRef.current = undefined;

        sketchCreateHandleRef.current && sketchCreateHandleRef.current.remove();
        sketchCreateHandleRef.current = undefined;
        sketchRef.current = undefined;

        setSearchByCurrentMapExtent(true);
        setSearchByDrawnMapExtent(false);
    }

    /**
     * Create a graphics layer for the sketch widget and add both to the map/ui respectively
     */
    function createSketch(view: SceneView | MapView): void {
        let gLayer;
        if (graphicsLayerRef.current) {
            gLayer = graphicsLayerRef.current;
        } else {
            gLayer = new GraphicsLayer({
                elevationInfo: { mode: 'on-the-ground' },
                title: rksGraphicsSketchLayerTitle,
            });
            graphicsLayerRef.current = gLayer;
            view.map.layers.add(gLayer);
        }

        const sketch = new Sketch({
            layer: gLayer,
            view: view,
            creationMode: 'update',
        });
        sketch.availableCreateTools = ['rectangle'];

        sketchCreateHandleRef.current = sketch.on('create', (event) => {
            if (event.state === 'complete') {
                const extent = event.graphic.geometry.extent;
                setSearchExtent([extent.ymax, extent.ymin, extent.xmin, extent.xmax]);
            }
        });
        view.ui.add(sketch, 'top-right');
        sketchRef.current = sketch;
    }

    /**
     * Get the UI values for the time exent and update the state.
     */
    function getTimeExtent(): string[] {
        const timeExtent: string[] = [];
        if (useTimeExtent) {
            if (searchByTimeWindow) {
                timeExtent.push(startTimeExtent);
                timeExtent.push(endTimeExtent);
            }
            if (searchByRecentUpdate) {
                const timeString = `now-${timeIntervalAmount}${timeIntervalUnit}`;
                timeExtent.push(timeString);
            }
        }
        setTimeExtent(timeExtent);
        return timeExtent;
    }

    /**
     * Find the current extent to use for geo-searches
     */
    function getSearchExtent(): number[] {
        let extentArray: number[] = [];
        if (useSearchExtent) {
            if (searchByCurrentMapExtent) {
                let extent;
                if (viewRef.current) {
                    extent = viewRef.current?.extent;
                }
                if (extent) {
                    extentArray = [extent.ymax, extent.ymin, extent.xmin, extent.xmax]; //top-xmax, bottom-xmin,left-ymin, right-ymax
                }
            } else if (searchByDrawnExtent) {
                if (searchExtent && searchExtent.length > 0) {
                    extentArray = searchExtent;
                } else {
                    //try to grab the last graphic drawn
                    if (graphicsLayerRef.current && graphicsLayerRef.current.graphics.length > 0) {
                        const len = graphicsLayerRef.current.graphics.length;
                        const g = graphicsLayerRef.current.graphics.getItemAt(len - 1);
                        const extent = g.geometry.extent;
                        extentArray = [extent.ymax, extent.ymin, extent.xmin, extent.xmax];
                    }
                }
            }
        } else {
            extentArray = [];
        }

        setSearchExtent(extentArray);
        return extentArray;
    }

    /**
     * When the entity changes get the details for the current entity. Only relevant when doing a Field-String-Search
     */
    async function getEntityDetails() {
        if (!configHelper) {
            return;
        }
        try {
            const entityDetailsUrl = configHelper.rks.entityDetailMetaDataUrl;
            const start = entityDetailsUrl.indexOf('{');
            const end = entityDetailsUrl.indexOf('}');
            const url =
                entityDetailsUrl.substring(0, start) + selectedEntity.trim() + entityDetailsUrl.substring(end + 1);
            const details = await retrieveRKSMetaData(url, 'details', searchMode);

            if (!details || details.length < 1) {
                LogHelper.log('No entity detail items were found when making the rest call.', true);
                throw new Error();
            }
            setSelectedDetails([]);
            setAvailableDetails(details);
        } catch (error) {
            LogHelper.log(error, true);
            setErrorText('Failed to retrieve details for selected entity.');
        }
    }

    /** Get the app config json */
    async function getAppConfig() {
        const config = await ConfigHelper.getAppConfig();
        if (config.rks) {
            const isValid = validateRKSConfigItems(config);
            if (!isValid) {
                setErrorText('The config settings for RKS are missing some key values.');
                return;
            }
        } else {
            setErrorText('Unable to find the RKS section of the config file.');
            return;
        }
        setConfigHelper(config);
    }

    /**
     * Get RKS entities
     * @param searchType entity type
     */
    async function getRKSEntities(searchType: RKSSearchType) {
        try {
            if (!configHelper) {
                return;
            }
            const entityMetaDataUrl = configHelper.rks.entityMetaDataUrl;
            const result = await retrieveRKSMetaData(entityMetaDataUrl, 'entities', searchMode);

            if (!result || result.length < 1) {
                LogHelper.log(JSON.stringify(searchType));
                LogHelper.log('No entity items were found when making the rest call.', true);
                throw new Error();
            }
            setRKSEntities(result);
            setSelectedEntity(result[0]);
        } catch (error) {
            setErrorText('Unable to find the RKS entities.');
        }
    }

    /**
     * Used when paging RKS data
     * @param evt search more button
     */
    async function searchMoreRKS(evt: React.MouseEvent<HTMLButtonElement>) {
        const button = evt.target as HTMLButtonElement;
        const btnText = button.innerText;
        button.innerText = 'Searching...';
        try {
            const rksEntityType = selectedEntity as RKSEntityType;
            let id = undefined;
            if (scrollId && scrollId.trim() != '') {
                id = scrollId;
            }
            const results = await executeRKSSearch(
                searchText,
                selectedDetails,
                rksEntityType,
                searchMode,
                maxRecordCount,
                maxDetailsRecordCount,
                id,
                totalRecordsAvailable.current,
                searchExtent,
                timeExtent
            );
            const countsMap = new Map<string, number>();
            const dataMap = new Map<string, preFeatureObj>();

            detailsNotProcessed.current = results.numberOfDetailsNotProcessed
                ? results.numberOfDetailsNotProcessed + detailsNotProcessed.current
                : 0;
            entityIdCountMap.forEach((value, key) => countsMap.set(key, value));
            results.recordCountPerEntityIdMap.forEach((value, key) => countsMap.set(key, value));
            setEntityIdCountMap(countsMap);
            setScrollId(results.scrollId);
            recordsRetrieved.current += maxRecordCount;

            if (totalRecordsAvailable.current && totalRecordsAvailable.current > recordsRetrieved.current) {
                setShowMoreResults(true);
            } else {
                setShowMoreResults(false);
            }
            searchResultDetail.forEach((value, key) => dataMap.set(key, value));
            results.resultData.forEach((value, key) => {
                if (dataMap.has(key)) {
                    const existingElements = dataMap.get(key)?.elements;
                    const newElements = value.elements;
                    if (existingElements) {
                        if (newElements) {
                            mergeEntityIdElements(existingElements, newElements);
                        }
                    } else {
                        dataMap.set(key, value); //no existing elements use the new values
                    }
                } else {
                    //unique entityId
                    dataMap.set(key, value);
                }
            });

            setSearchResultDetail(dataMap); //redraw the data grid with the element from the new search merged into the prvious results

            const postJson = JSON.stringify(results.postRequest, null, 4);
            setPostRequestJson(postJson);
            console.log(results); //log out the object for easy onsite debugging
        } catch (error) {
            //TODO: implement more precise error messaging.
            setErrorText(`The following error occured: ` + error);
            enqueueSnackbar('Error occurrd accessing RKS. Please ensure that the config settings are correct.', {
                variant: 'error',
            });
        } finally {
            button.innerText = btnText;
        }
    }

    /**
     * Actions/settings to revert when doing a new or first search
     */
    function setPreSearchDefaults() {
        recordsRetrieved.current = 0;
        totalRecordsAvailable.current = 0;
        detailsNotProcessed.current = 0;
        setShowMoreResults(false);
        setScrollId('');
        setTimeExtent([]);
    }

    /**
     * Search RKS
     * @param evt Button element
     */
    async function searchRKS(evt: React.MouseEvent<HTMLButtonElement>) {
        const button = evt.target as HTMLButtonElement;
        const btnText = button.innerText;
        button.innerText = 'Searching...';
        setPreSearchDefaults();
        const extent = getSearchExtent();
        const timeExtent = getTimeExtent();
        try {
            const rksEntityType = selectedEntity as RKSEntityType;
            const results = await executeRKSSearch(
                searchText,
                selectedDetails,
                rksEntityType,
                searchMode,
                maxRecordCount,
                maxDetailsRecordCount,
                scrollId,
                0, //records returned previously
                extent,
                timeExtent
            );

            button.innerText = 'Processing...';
            setEntityIdCountMap(results.recordCountPerEntityIdMap);
            setScrollId(results.scrollId);
            detailsNotProcessed.current = results.numberOfDetailsNotProcessed ? results.numberOfDetailsNotProcessed : 0;

            totalRecordsAvailable.current = results.totalCount ? results.totalCount : undefined;
            recordsRetrieved.current = maxRecordCount;
            if (totalRecordsAvailable.current && totalRecordsAvailable.current > recordsRetrieved.current) {
                setShowMoreResults(true);
            } else {
                setShowMoreResults(false);
            }
            setSearchResultDetail(results.resultData);

            const postJson = JSON.stringify(results.postRequest, null, 4);
            setPostRequestJson(postJson);
        } catch (error) {
            //TODO: implement more precise error messaging.
            setErrorText(`The following error occured: ` + error);
            enqueueSnackbar('Error occurrd accessing RKS. Please ensure that the config settings are correct.', {
                variant: 'error',
            });
        } finally {
            button.innerText = btnText;
        }
    }

    function searchTextChanged(evt: React.ChangeEvent<HTMLInputElement>) {
        setSearchText(evt.target.value);
    }

    function layerNameTextChanged(evt: React.ChangeEvent<HTMLInputElement>) {
        setLayerName(evt.target.value);
    }

    function handleTabChange(_event: React.ChangeEvent, newValue: number) {
        setTabValue(newValue);
    }

    function handleSelectedEntityChanged(event: ChangeEvent<HTMLInputElement>) {
        setSelectedEntity(event.target.value);
    }

    function handleSelectedSearchModeChanged(event: ChangeEvent<HTMLInputElement>) {
        setSearchMode(event.target.value as RKSSearchType);
    }

    function handleZoomToLayerExtentChecked(event: ChangeEvent<HTMLInputElement>) {
        setZoomToLayerExtent(event.target.checked);
    }

    function handleDefineSearchExtentChecked(event: ChangeEvent<HTMLInputElement>) {
        setUseSearchExtent(event.target.checked);
    }

    function handleMaxRecordCountChanged(event: ChangeEvent<HTMLInputElement>) {
        setMaxRecordCount(parseInt(event.target.value));
    }

    function handleMaxDetailsRecordCountChanged(event: ChangeEvent<HTMLInputElement>) {
        setMaxDetailsRecordCount(parseInt(event.target.value));
    }

    function handleErrorSnackbarClose() {
        setErrorText('');
    }

    function handleUseTimeExtentChecked(event: ChangeEvent<HTMLInputElement>) {
        setUseTimeExtent(event.target.checked);
    }

    const MenuProps = {
        PaperProps: {
            style: {
                maxHeight: 300,
                width: 550,
            },
        },
    };

    const handleDetailsSelectChange = (event: React.ChangeEvent<{ name?: string | undefined; value: unknown }>) => {
        const val = event.target.value;
        setSelectedDetails(val as string[]);
    };

    /**
     * Handle the extent type radio button change
     * @param event Radio button change event
     */
    function extentTypeRadioChange(event: React.ChangeEvent<HTMLInputElement>) {
        setSearchExtent([]);
        const r = event.target.value;
        if (r === 'mapExtent') {
            setSearchByCurrentMapExtent(true);
            setSearchByDrawnMapExtent(false);
        } else if (r === 'drawnExtent') {
            if (viewRef.current && !sketchRef.current) {
                createSketch(viewRef.current);
            }
            setSearchByDrawnMapExtent(true);
            setSearchByCurrentMapExtent(false);
        }
    }

    function timeExtentTypeRadioChange(event: React.ChangeEvent<HTMLInputElement>) {
        const r = event.target.value;
        if (r === 'recentUpdate') {
            setSearchByRecentUpdate(true);
            setSearchByTimeWindow(false);
        } else if (r === 'timeWindow') {
            setSearchByRecentUpdate(false);
            setSearchByTimeWindow(true);
        }
    }

    const timeIntervalUnitsChanged = (event: ChangeEvent<HTMLInputElement>) => {
        setTimeIntervalUnit(event.target.value);
    };

    const timeIntervalAmountChanged = (evt: ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(evt.target.value);
        const v = Math.abs(val) > 1000 ? 1000 : Math.abs(val);
        setTimeIntervalAmount(v);
    };

    const onChangeStartTime = (event: React.ChangeEvent<HTMLInputElement>) => {
        setStartTimeExtent(event.target.value);
    };

    const onChangeEndTime = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEndTimeExtent(event.target.value);
    };

    /**
     * Validate that the required parameters in the UI are populated.
     */
    const canExecuteSearch = (): boolean => {
        if (searchText != '' && layerName != '' && tabValue == 0 && (sceneViewInitialized || mapViewInitialized)) {
            if (useTimeExtent && searchByTimeWindow) {
                if (startTimeExtent != '' && endTimeExtent != '') {
                    if (new Date(startTimeExtent).getTime() > new Date(endTimeExtent).getTime()) {
                        return false;
                    }
                    return true;
                }
                return false;
            }
            return true;
        }
        return false;
    };

    const enableSearch = canExecuteSearch();

    if (errorText != '') {
        return (
            <Box mt={3}>
                <Typography variant='h6' align='center' color='error'>
                    {errorText}
                </Typography>
            </Box>
        );
    }
    let nextSetOfRecordsAvailable = false;
    if (totalRecordsAvailable && totalRecordsAvailable.current) {
        nextSetOfRecordsAvailable = recordsRetrieved.current >= totalRecordsAvailable.current;
    }
    const s = timeIntervalAmount > 1 ? 's' : '';

    return (
        <WidgetContainer>
            <AppBar position='static'>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label='route finder tabs'>
                    <Tab label='Search' />
                    <Tab label='Feature Table' />
                    <Tab label='Results JSON' />
                    <Tab label='Data Table' />
                    {runDebug ? <Tab label='Post Request' /> : ''}
                </Tabs>
            </AppBar>

            <WidgetContainer role='tabpanel' style={{ display: tabValue !== 0 ? 'none' : '' }}>
                <WidgetContent>
                    <FieldGroup>
                        <InputLabel>Search Type</InputLabel>
                        <InputField
                            fullWidth
                            variant='outlined'
                            color='secondary'
                            select
                            required
                            value={searchMode}
                            onChange={handleSelectedSearchModeChanged}
                        >
                            {rksSearchModes.map((mode) => (
                                <MenuItem key={mode} value={mode}>
                                    {mode}
                                </MenuItem>
                            ))}
                        </InputField>
                    </FieldGroup>
                    <FieldGroup>
                        <InputLabel>Entity Type</InputLabel>
                        <InputField
                            fullWidth
                            variant='outlined'
                            color='secondary'
                            select
                            required
                            value={selectedEntity}
                            onChange={handleSelectedEntityChanged}
                        >
                            {rksEntities.map((entity) => (
                                <MenuItem key={entity} value={entity}>
                                    {entity}
                                </MenuItem>
                            ))}
                        </InputField>
                    </FieldGroup>
                    {searchMode === RKSSearchType.RKS_Field_String_Search ? (
                        <FieldGroup>
                            <InputLabel>Fields to Search</InputLabel>
                            <InlineSelect
                                multiple
                                id='chipper'
                                value={selectedDetails}
                                onChange={handleDetailsSelectChange}
                                placeholder='Entity Details'
                                label='Entity Details'
                                input={<Input />}
                                renderValue={(selected: string[]) => selected.join(', ')}
                                MenuProps={MenuProps}
                            >
                                {availableDetails.map((name) => (
                                    <MenuItem key={name} value={name}>
                                        <Checkbox checked={selectedDetails.indexOf(name) > -1} />
                                        <ListItemText primary={name} />
                                    </MenuItem>
                                ))}
                            </InlineSelect>
                        </FieldGroup>
                    ) : (
                        ''
                    )}
                    <FieldGroup>
                        <InputLabel>Search Terms</InputLabel>
                        <InputField
                            variant='outlined'
                            placeholder='search text'
                            helperText='Required'
                            fullWidth
                            size='small'
                            color='secondary'
                            title='Enter a text string to search for.'
                            onChange={searchTextChanged}
                            value={searchText}
                        />
                    </FieldGroup>

                    <FieldGroup>
                        <FormControlLabel
                            title='Limit query results to a defined extent'
                            control={<Checkbox onChange={handleDefineSearchExtentChecked} checked={useSearchExtent} />}
                            label='Limit search result to a defined extent'
                        />
                    </FieldGroup>

                    {useSearchExtent ? (
                        <FieldGroup $bottomgutter>
                            <InputLabel>Extent Type</InputLabel>
                            <RadioGroup name='loopRadioButton' onChange={extentTypeRadioChange} row>
                                <FormControlLabel
                                    control={<Radio />}
                                    label='Current map extent'
                                    value='mapExtent'
                                    title='Use current map extent.'
                                    checked={searchByCurrentMapExtent}
                                ></FormControlLabel>
                                <FormControlLabel
                                    control={<Radio />}
                                    label='Draw a custom extent'
                                    value='drawnExtent'
                                    title='Use the sketch tool to draw a rectangle to define search extent.'
                                    checked={searchByDrawnExtent}
                                ></FormControlLabel>
                            </RadioGroup>
                        </FieldGroup>
                    ) : (
                        ''
                    )}

                    <FieldGroup>
                        <FormControlLabel
                            title='Limit results to a defined time extent'
                            control={<Checkbox onChange={handleUseTimeExtentChecked} checked={useTimeExtent} />}
                            label='Limit search result to a defined time  extent'
                        />
                    </FieldGroup>
                    {useTimeExtent ? (
                        <FieldGroup $bottomgutter>
                            <InputLabel>Extent Type</InputLabel>
                            <RadioGroup name='timeExtentRadioButton' onChange={timeExtentTypeRadioChange} row>
                                <FormControlLabel
                                    control={<Radio />}
                                    label='Return records updated between:'
                                    value='timeWindow'
                                    title=''
                                    checked={searchByTimeWindow}
                                ></FormControlLabel>
                                <FormControlLabel
                                    control={<Radio />}
                                    label='Limit results to records updated in the last:'
                                    value='recentUpdate'
                                    title=''
                                    checked={searchByRecentUpdate}
                                ></FormControlLabel>
                            </RadioGroup>
                        </FieldGroup>
                    ) : (
                        ''
                    )}

                    {useTimeExtent && searchByTimeWindow ? (
                        <FieldGroup $bottomgutter>
                            <Box display='flex'>
                                <Box pr={1} pt={0.5}>
                                    <InputLabel>Start Date:</InputLabel>
                                </Box>
                                <Box mr={1}>
                                    <TextField value={startTimeExtent} onChange={onChangeStartTime} type='date' />
                                </Box>
                                <Box pl={1} pr={1} pt={0.5}>
                                    <InputLabel>End Date:</InputLabel>
                                </Box>
                                <Box>
                                    <TextField type='date' value={endTimeExtent} onChange={onChangeEndTime} />
                                </Box>
                            </Box>
                        </FieldGroup>
                    ) : (
                        ''
                    )}

                    {useTimeExtent && searchByRecentUpdate ? (
                        <FieldGroup $bottomgutter>
                            <InputGroup>
                                <InputField
                                    variant='outlined'
                                    type='number'
                                    placeholder='Enter a number...'
                                    helperText='Select a value'
                                    onChange={timeIntervalAmountChanged}
                                    value={timeIntervalAmount}
                                    size='small'
                                    inputProps={{ min: '1', max: '1000' }}
                                    color='secondary'
                                    InputLabelProps={{ shrink: true }}
                                />

                                <InlineSelect
                                    fullWidth
                                    variant='outlined'
                                    value={timeIntervalUnit}
                                    onChange={timeIntervalUnitsChanged}
                                    color='secondary'
                                >
                                    <MenuItem value='m'>Minute{s}</MenuItem>
                                    <MenuItem value='h'>Hour{s}</MenuItem>
                                    <MenuItem value='d'>Day{s}</MenuItem>
                                    <MenuItem value='w'>Week{s}</MenuItem>
                                    <MenuItem value='M'>Month{s}</MenuItem>
                                    <MenuItem value='y'>Year{s}</MenuItem>
                                </InlineSelect>
                            </InputGroup>
                        </FieldGroup>
                    ) : (
                        ''
                    )}

                    <FieldGroup>
                        <InputLabel>Output Layer Name</InputLabel>
                        <InputField
                            variant='outlined'
                            placeholder='Output Layer Name'
                            helperText='Required'
                            fullWidth
                            size='small'
                            color='secondary'
                            title='Enter a name for the search result layer.'
                            onChange={layerNameTextChanged}
                            value={layerName}
                        />
                    </FieldGroup>
                    <FieldGroup>
                        <InputLabel>Maximum Number of Entities to Return</InputLabel>
                        <InputField
                            variant='outlined'
                            type='number'
                            placeholder='Max entity  count'
                            helperText='Required -- Not supported for mock data -- see count in Post tab.'
                            fullWidth
                            size='small'
                            color='secondary'
                            title='Enter a number for the maximum number of records to return.'
                            onChange={handleMaxRecordCountChanged}
                            value={maxRecordCount}
                        />
                    </FieldGroup>
                    <FieldGroup>
                        <InputLabel>Maximum Number of Records per Entity to Process</InputLabel>
                        <InputField
                            variant='outlined'
                            type='number'
                            placeholder='Max records to process per entity'
                            helperText='Required -- Not supported for mock data -- see count in Post tab.'
                            fullWidth
                            size='small'
                            color='secondary'
                            title='Enter a number for the maximum number of records to return.'
                            onChange={handleMaxDetailsRecordCountChanged}
                            value={maxDetailsRecordCount}
                        />
                    </FieldGroup>
                    <FieldGroup>
                        <CheckBoxGroup $bottomgutter>
                            <FormControlLabel
                                control={
                                    <Checkbox checked={zoomToLayerExtent} onChange={handleZoomToLayerExtentChecked} />
                                }
                                label='Zoom to layer extent when search results are added to the map'
                            />
                        </CheckBoxGroup>
                    </FieldGroup>
                    <Snackbar open={errorText != ''} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
                        <Alert severity='error' onClose={handleErrorSnackbarClose}>
                            {errorText}{' '}
                        </Alert>
                    </Snackbar>
                </WidgetContent>
            </WidgetContainer>

            <WidgetContainer
                role='tabpanel'
                style={{ display: tabValue !== 1 ? 'none' : '', overflowY: 'auto', marginLeft: '0px' }}
            >
                {fLayer != undefined ? (
                    <DataTableHeader
                        zoomToFeaturesFunc={zoomToFeaturesFunc}
                        addDataToMapFunc={addFtrLayerToMap}
                        toggleMapSelectionFunc={toggleMapSelectionFunc}
                        featureCount={featureCount}
                        selectedFeatures={selectedFeatures}
                        addToMap={true}
                        refreshedGrid={refreshedGrid}
                        layerViewIsConnected={currentLayerViewIsConnected}
                    />
                ) : (
                    ''
                )}
                <div ref={xySearchResultsNode}></div>
                <Box mt={0.5} mb={0.5}>{`Number of records not processed: ${detailsNotProcessed.current}`}</Box>
            </WidgetContainer>

            <WidgetContainer role='tabpanel' style={{ display: tabValue !== 2 ? 'none' : '', overflowY: 'auto' }}>
                <JsonView json={searchResultJson} />
            </WidgetContainer>

            <WidgetContainer
                role='tabpanel'
                style={{ display: tabValue !== 3 ? 'none' : '', overflowY: 'auto', marginLeft: '0px' }}
            >
                <div ref={tableSearchResultsNode}></div>
            </WidgetContainer>

            {runDebug ? (
                <WidgetContainer role='tabpanel' style={{ display: tabValue !== 4 ? 'none' : '', overflowY: 'auto' }}>
                    <JsonView json={postRequestJson} />
                </WidgetContainer>
            ) : (
                ''
            )}

            <WidgetActions>
                {showMoreResults && tabValue != 0 ? (
                    <div>
                        <ActionButton
                            variant='contained'
                            color='secondary'
                            type='button'
                            title=''
                            disabled={true}
                            onClick={searchMoreRKS}
                        >
                            {`Showing records ${recordsRetrieved.current} of ${totalRecordsAvailable.current}`}
                        </ActionButton>

                        <ActionButton
                            variant='contained'
                            color='secondary'
                            type='button'
                            title='Get more results.'
                            disabled={nextSetOfRecordsAvailable}
                            onClick={searchMoreRKS}
                        >
                            Next {maxRecordCount} records
                        </ActionButton>
                    </div>
                ) : (
                    <ActionButton
                        variant='contained'
                        color='secondary'
                        type='button'
                        title='Search RKS data.'
                        disabled={!enableSearch}
                        onClick={searchRKS}
                    >
                        Search
                    </ActionButton>
                )}
            </WidgetActions>
        </WidgetContainer>
    );
}

export default RKSSearch;
