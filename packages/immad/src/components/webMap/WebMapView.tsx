import React, { useContext, useEffect, useRef, useState } from 'react';

import ImageryLayer from '@arcgis/core/layers/ImageryLayer';
import WebScene from '@arcgis/core/WebScene';
import WebMap from '@arcgis/core/WebMap';
import SceneView from '@arcgis/core/views/SceneView';
import MapView from '@arcgis/core/views/MapView';
import Viewpoint from '@arcgis/core/Viewpoint';
import PortalItem from '@arcgis/core/portal/PortalItem';

import { initialize, sceneToMap } from '../../data/map';
import { MapContext } from '../../contexts/Map';
import { SaveLoadContext } from '../../contexts/SaveLoad';
import RasterRenderHelper from '../../helpers/rasterRenderHelper';
import { addSelectionHandlersToView } from '../../helpers/mapHelper';
import { useSnackbar } from 'notistack';
import { ActionButton } from '../common';
import MessageDialog from './MessageDialog';
import { StyledSpinnerDiv } from './style';
import { findPortalItemById } from '../../helpers/portalItemsHelper';
import { FeatureSelectionContext, SelectionMode } from '../../contexts/FeatureSelectionContext';
import { ConfigHelper } from '../../helpers/configHelper';
import { ApplicationStateHelper } from '../../helpers/ApplicationStateHelper';
import { currentPortalUser } from '../../helpers/portalUsersHelper';

import CircularProgress from '@mui/material/CircularProgress';
import { getTargetGeometry } from '@stratcom/lib-functions';
import { searchConfig, updateSearchSources } from '@stratcom/react-widget-lib';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import { setActiveView } from './WebMapViewSlice';
import { useAppDispatch } from '../../hooks/hooks';
import { useHistory } from 'react-router-dom';
import { Button, IconButton } from '@mui/material';
import XIcon from 'calcite-ui-icons-react/XIcon';

const WebMapView = (): JSX.Element => {
    const mapRef = useRef<HTMLDivElement>(null);
    const summaryMapRef = useRef<HTMLDivElement>(null);
    const dispatch = useAppDispatch();
    const history = useHistory();

    const [initialized, setInitialized] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectionMode, setSelectionMode] = useState<SelectionMode>(SelectionMode.NewSelectionSet);
    let zoomLevel: number = -1;
    let isMatchingWorkspace = false;

    const activeSource = useRef<WebMap | WebScene>();
    const inactiveSource = useRef<WebMap | WebScene>();
    const inactiveView = useRef<MapView | SceneView>();
    const alertMessage = useRef('');
    const initialLoadViewPoint = useRef<Viewpoint | undefined>();
    const selectionModeRef = useRef<SelectionMode>();

    useEffect(() => {
        selectionModeRef.current = selectionMode;
    }, [selectionMode]);

    const action = () => (
        <>
            <ActionButton
                variant='outlined'
                onClick={() => {
                    setOpenDialog(true);
                }}
            >
                Show Removed List
            </ActionButton>
        </>
    );

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const { missionSelect, portalIdToLoad } = useContext(SaveLoadContext);
    const {
        setMap,
        setMapView,
        setSceneView,
        activeView,
        mapView,
        setMapViewInitialized,
        sceneView,
        setSceneViewInitialized,
        getSceneView,
        getMapView,
        setLoadedViewPoint,
        loadedViewPoint,
        setLayersRemovedFor2dDisplay,
        layersRemovedFor2dDisplay,
        setRenderReplacementObjects,
    } = useContext(MapContext);

    const { setSelectionData, clearSelection } = useContext(FeatureSelectionContext);

    useEffect(() => {
        if (sceneView) {
            setSceneViewInitialized(true);
            dispatch(setActiveView('SCENE'));
            setMap(sceneView.map);

            const watchHandle = sceneView.watch('container', (val) => {
                if (val) {
                    dispatch(setActiveView('SCENE'));
                }
            });

            const changeHandle = sceneView.allLayerViews.on('change', (changedLayers) => {
                //10.8.1 rendering bug fix
                const layerViews = changedLayers.added.filter((layerView) => layerView.layer.type === 'imagery');
                layerViews.forEach((layerView) => {
                    RasterRenderHelper.applyRasterStretchRendererFix(layerView.layer as ImageryLayer);
                });
            });

            const removeSelectionHandlers = addSelectionHandlersToView(
                sceneView,
                () => selectionModeRef.current,
                setSelectionMode,
                (
                    view: __esri.MapView | __esri.SceneView,
                    layer: __esri.Layer,
                    ids: number[],
                    selectionMode?: SelectionMode
                ) => setSelectionData(view, layer, ids, selectionMode, true, false),
                clearSelection
            );

            const reactiveLayerAdd = reactiveUtils.watch(
                () => [sceneView.map.allLayers.map((layer) => layer.id) || []],
                () => {
                    if (sceneView.map?.allLayers) {
                        const initSearchConfig: searchConfig = {
                            includeGeocoder: ConfigHelper.getAppConfig().search.includeGeocoder,
                            name: ConfigHelper.getAppConfig().search.name,
                            allPlaceholder: ConfigHelper.getAppConfig().search.allPlaceholder,
                            geocoderUrl: ConfigHelper.getAppConfig().search.url,
                            position: 'top-left',
                        };
                        updateSearchSources(sceneView, initSearchConfig);
                    }
                }
            );

            return () => {
                removeSelectionHandlers();
                watchHandle.remove();
                changeHandle.remove();
                reactiveLayerAdd.remove();
            };
        }
    }, [sceneView]);

    useEffect(() => {
        if (mapView) {
            setMapViewInitialized(true);
            dispatch(setActiveView('MAP'));
            setMap(mapView.map);
            const watchHandle = mapView.watch('container', (val) => {
                if (val) {
                    dispatch(setActiveView('MAP'));
                }
            });

            const changeHandle = mapView.allLayerViews.on('change', (changedLayers) => {
                //10.8.1 rendering bug fix
                const layerViews = changedLayers.added.filter((layerView) => layerView.layer.type === 'imagery');
                layerViews.forEach((layerView) => {
                    RasterRenderHelper.applyRasterStretchRendererFix(layerView.layer as ImageryLayer);
                });
            });

            const removeSelectionHandlers = addSelectionHandlersToView(
                mapView,
                () => selectionModeRef.current,
                setSelectionMode,
                (
                    view: __esri.MapView | __esri.SceneView,
                    layer: __esri.Layer,
                    ids: number[],
                    selectionMode?: SelectionMode
                ) => setSelectionData(view, layer, ids, selectionMode, false, false),
                clearSelection
            );

            const reactiveLayerAdd = reactiveUtils.watch(
                () => [mapView.map?.allLayers?.map((layer) => layer.id) || []],
                () => {
                    if (mapView.map?.allLayers) {
                        const initSearchConfig: searchConfig = {
                            includeGeocoder: ConfigHelper.getAppConfig().search.includeGeocoder,
                            name: ConfigHelper.getAppConfig().search.name,
                            allPlaceholder: ConfigHelper.getAppConfig().search.allPlaceholder,
                            geocoderUrl: ConfigHelper.getAppConfig().search.url,
                            position: 'top-left',
                        };
                        updateSearchSources(mapView, initSearchConfig);
                    }
                }
            );

            return () => {
                removeSelectionHandlers();
                watchHandle.remove();
                changeHandle.remove();
                reactiveLayerAdd.remove();
            };
        }
    }, [mapView]);

    useEffect(() => {
        console.debug('View switching:', activeView, 'initialized:', initialized);

        // currently no way to save out what was removed to re-add if reloaded or refresh is hit.
        if (initialized) {
            // should be fired only when 2d/3d switch has occurred
            if (activeView === 'MAP') {
                console.debug('Switching to MAP view');

                // if active view is map then it was switched from scene to map
                // get sceneview and get the webscene from the map objects
                const currentScene = getSceneView();

                if (currentScene) {
                    sceneToMap(currentScene?.map as WebScene)
                        .then(({ webScene, removedLayers, removedRenderers }) => {
                            if (webScene) {
                                activeSource.current = webScene;
                                const aMapView = getMapView();
                                if (aMapView) {
                                    aMapView.map = webScene;
                                    if (loadedViewPoint) {
                                        aMapView.viewpoint = loadedViewPoint;
                                    }
                                    setMapView(aMapView);
                                }
                            }
                            setLayersRemovedFor2dDisplay(removedLayers);
                            setRenderReplacementObjects(removedRenderers);
                            inactiveView.current = currentScene;
                        })
                        .catch((error) => {
                            if (error.name === 'AbortError') {
                                console.debug('Scene to map conversion aborted');
                                return; // Don't show snackbar for cancelled operations
                            }

                            console.error('Scene to map conversion failed:', error);
                            enqueueSnackbar(
                                'Unable to find layer: ' + error.message + ' Click OK to return to LandingPage',
                                {
                                    variant: 'error',
                                    autoHideDuration: null,
                                    action: (key) => (
                                        <Button
                                            onClick={() => {
                                                closeSnackbar(key);
                                                goToLandingPage();
                                            }}
                                            color={'secondary'}
                                            size={'small'}
                                            variant={'outlined'}
                                        >
                                            OK
                                        </Button>
                                    ),
                                }
                            );
                        });
                    inactiveSource.current = currentScene?.map as WebScene;
                }
            } else {
                console.debug('Switching to SCENE view');

                // from map to scene function
                const currentView = getMapView();

                // transitioning back to scene that was used on initial load or switch.
                if (currentView && currentView.map) {
                    try {
                        addBackLayersToScene(currentView.map as WebScene)
                            .then((updatedScene) => {
                                activeSource.current = updatedScene;
                                const aSceneView = getSceneView();
                                if (aSceneView) {
                                    aSceneView.map = updatedScene;
                                    if (loadedViewPoint) {
                                        aSceneView.viewpoint = loadedViewPoint;
                                    }
                                    setSceneView(aSceneView);
                                }
                                inactiveView.current = currentView;
                            })
                            .catch((error) => {
                                if (error.name === 'AbortError') {
                                    console.debug('Add back layers operation aborted');
                                    return; // Don't show snackbar for cancelled operations
                                }

                                console.error('Add back layers failed:', error);
                                // Re-throw to be caught by outer try-catch
                                throw error;
                            });
                    } catch (error) {
                        if (error.name === 'AbortError') {
                            console.debug('Map to scene transition aborted');
                            return; // Don't show snackbar for cancelled operations
                        }

                        console.error('Map to scene transition failed:', error);
                        enqueueSnackbar(
                            'Unable to find layer: ' + error.message + ' Click OK to return to LandingPage',
                            {
                                variant: 'error',
                                autoHideDuration: null,
                                action: (key) => (
                                    <Button
                                        onClick={() => {
                                            closeSnackbar(key);
                                            goToLandingPage();
                                        }}
                                        color={'secondary'}
                                        size={'small'}
                                        variant={'outlined'}
                                    >
                                        OK
                                    </Button>
                                ),
                            }
                        );
                    }
                }
                inactiveSource.current = currentView?.map as WebScene;
            }
        }
    }, [activeView]);

    useEffect(() => {
        alertMessage.current = '';
        if (layersRemovedFor2dDisplay.length > 0) {
            for (const layer of layersRemovedFor2dDisplay) {
                alertMessage.current += layer.title + '\n';
            }
            const message =
                'There were ' +
                layersRemovedFor2dDisplay.length +
                ' layer(s) removed as they could not be displayed in 2D view.';
            enqueueSnackbar(message, {
                variant: 'warning',
                action,
            });
        }
    }, [layersRemovedFor2dDisplay]);

    /**
     * Button click function to return user to landing page if error occurs with map layer or scene layer
     */
    function goToLandingPage() {
        history.push('/');
    }

    /**
     * Adds layers that were removed from the scene when loaded in 2D view.
     * Also reapplies renderers to FeatureLayers that had 3d-point layers
     * @param webScene to re hydrate with layers and renderers
     */
    async function addBackLayersToScene(webScene: WebScene) {
        if (webScene && webScene.allLayers) {
            const featureLayers = webScene.allLayers.filter((layer: any) => layer.type === 'feature');

            featureLayers.forEach((layer: any) => {
                if (layer.visible && layer.labelsVisible && layer.labelingInfo) {
                    layer.labelingInfo.forEach((labelClass: any) => {
                        if (labelClass.symbol && labelClass.symbol.type === 'label-3d') {
                            labelClass.symbol = {
                                type: 'text',
                                color: labelClass.symbol.symbolLayers[0]?.material?.color || [0, 0, 0, 1],
                                haloColor: labelClass.symbol.symbolLayers[0]?.halo?.color || [255, 255, 255, 1],
                                haloSize: labelClass.symbol.symbolLayers[0]?.halo?.size || 1,
                                font: {
                                    size: labelClass.symbol.symbolLayers[0]?.size || 12,
                                    family: labelClass.symbol.symbolLayers[0]?.font?.family || 'Arial',
                                },
                            };
                        }
                    });
                }
            });
        }

        return webScene;
    }

    async function whichTypeOfViewToLoad(portalIdToLoad: string): Promise<WebMap | WebScene | undefined> {
        const item = await findPortalItemById(portalIdToLoad);

        if (item?.type.toUpperCase() === 'WEB SCENE') {
            activeSource.current = new WebScene({
                portalItem: {
                    id: portalIdToLoad,
                },
            });
            return activeSource.current;
        } else if (item?.type.toUpperCase() === 'WEB MAP') {
            activeSource.current = new WebMap({
                portalItem: {
                    id: portalIdToLoad,
                },
            });
            return activeSource.current;
        }
    }

    async function initializeMap(
        mapRef: HTMLDivElement,
        webScene: WebScene | WebMap,
        isWebMap: boolean
    ): Promise<void> {
        setMap(webScene);
        if (summaryMapRef.current) {
            // only needs to run this code if 2d is selected
            // the viewpoint is needed to not default to world view.
            if (activeView === 'MAP' || isWebMap) {
                const user = await currentPortalUser();
                const userState = await ApplicationStateHelper.getUserSavedState(user);
                // find currentWorkspaceItem by mission name
                const currentWorkspaceItem = userState?.workspaces?.find((item) => item.missionValue === missionSelect);
                isMatchingWorkspace = webScene.portalItem.id === currentWorkspaceItem?.portalItemId;
                if (currentWorkspaceItem) {
                    zoomLevel = currentWorkspaceItem.mapView.zoom;
                }
                const sceneAsPortalItem = new PortalItem({
                    id: webScene.portalItem.id,
                });
                await sceneAsPortalItem.load();
                await sceneAsPortalItem.fetchData().then((data) => {
                    if (data && data.viewingMode === 'global') {
                        const initialViewpoint = data.initialState?.viewpoint;
                        setLoadedViewPoint(initialViewpoint);
                        initialLoadViewPoint.current = initialViewpoint;
                    }
                });
            }
        }
        if (activeView) {
            initialize(mapRef, webScene, isWebMap ? 'MAP' : activeView)
                .then(({ mapView, sceneView }) => {
                    mapView.when(() => {
                        if (loadedViewPoint) {
                            mapView.viewpoint = loadedViewPoint;
                            mapView.goTo(loadedViewPoint);
                        } else if (initialLoadViewPoint.current && initialLoadViewPoint.current.camera) {
                            mapView.viewpoint.targetGeometry = getTargetGeometry(initialLoadViewPoint.current?.camera);
                            mapView.zoom = isMatchingWorkspace ? zoomLevel : 3;
                        } else if (initialLoadViewPoint.current && initialLoadViewPoint.current.targetGeometry) {
                            mapView.viewpoint.targetGeometry.set(initialLoadViewPoint.current.targetGeometry);
                            mapView.zoom = isMatchingWorkspace ? zoomLevel : 3;
                        } else {
                        }
                        setMapView(mapView);
                        const handleMap = mapView.watch(['interacting', 'animation'], () => {
                            setLoadedViewPoint(mapView.viewpoint);
                        });
                        return () => {
                            handleMap.remove();
                        };
                    });
                    try {
                        if (sceneView) {
                            sceneView.when(() => {
                                setSceneView(sceneView);
                                setLoadedViewPoint(sceneView.viewpoint);
                                const handleScene = sceneView.watch(['interacting', 'animation'], () => {
                                    setLoadedViewPoint(sceneView.viewpoint);
                                });
                                webScene.layers.forEach(async (layer) => {
                                    try {
                                        await layer.load();
                                    } catch (error) {
                                        console.error(error);
                                        enqueueSnackbar(
                                            'Layer Failed to load: ' +
                                                error.message +
                                                '. Contact Mission Manager to repair.',
                                            {
                                                variant: 'warning',
                                                autoHideDuration: null,
                                                action: (key) => (
                                                    <IconButton
                                                        onClick={() => {
                                                            closeSnackbar(key);
                                                        }}
                                                    >
                                                        <XIcon />
                                                    </IconButton>
                                                ),
                                            }
                                        );
                                    }
                                });
                                return () => {
                                    handleScene.remove();
                                };
                            });
                        }
                    } catch (error) {
                        console.error(error);
                    }
                })
                .catch((error) => {
                    console.error(error);
                    enqueueSnackbar(error.message);
                });
            setIsLoaded(true);
            setInitialized(true);
        }
    }

    useEffect(() => {
        if (mapRef.current && portalIdToLoad !== '') {
            // reset
            setIsLoaded(false);
            initialLoadViewPoint.current = loadedViewPoint;

            const portalItemToPullFrom = new PortalItem({
                id: portalIdToLoad,
            });
            portalItemToPullFrom
                .load()
                .then(() => {
                    whichTypeOfViewToLoad(portalIdToLoad).then((value: WebMap | WebScene) => {
                        let isWebMap = false;
                        if (portalItemToPullFrom?.type.toUpperCase() === 'WEB MAP') {
                            isWebMap = true;
                        }
                        if (activeView === 'MAP' && portalItemToPullFrom?.type.toUpperCase() !== 'WEB MAP') {
                            // if verifies that it is a web scene
                            sceneToMap(value as WebScene)
                                .then(({ webScene, removedLayers, removedRenderers }) => {
                                    if (mapRef.current) {
                                        initializeMap(mapRef.current, webScene, isWebMap);
                                    }
                                    setLayersRemovedFor2dDisplay(removedLayers);
                                    setRenderReplacementObjects(removedRenderers);
                                })
                                // allows non-GPU users to return to the landing page when the mission fails to load
                                // due to a missing layer - mimics the 3D missing scene workflow
                                .catch((error) => {
                                    console.error(error);
                                    if (error.message.includes('You do not have access to this resource:')) {
                                        const appLabel = ConfigHelper.getAppConfig()?.appLabel ?? '';
                                        enqueueSnackbar(
                                            'Layer not shared properly: ' +
                                                error.message +
                                                ` Contact${appLabel ? ' ' + appLabel : ''} Admin and Click OK to return to LandingPage`,
                                            {
                                                variant: 'error',
                                                autoHideDuration: null,
                                                action: (key) => (
                                                    <Button
                                                        onClick={() => {
                                                            closeSnackbar(key);
                                                            goToLandingPage();
                                                        }}
                                                        color={'secondary'}
                                                        size={'small'}
                                                        variant={'outlined'}
                                                    >
                                                        OK
                                                    </Button>
                                                ),
                                            }
                                        );
                                    } else {
                                        enqueueSnackbar(
                                            'Unable to find layer: ' +
                                                error.message +
                                                ' Click OK to return to LandingPage',
                                            {
                                                variant: 'error',
                                                autoHideDuration: null,
                                                action: (key) => (
                                                    <Button
                                                        onClick={() => {
                                                            closeSnackbar(key);
                                                            goToLandingPage();
                                                        }}
                                                        color={'secondary'}
                                                        size={'small'}
                                                        variant={'outlined'}
                                                    >
                                                        OK
                                                    </Button>
                                                ),
                                            }
                                        );
                                    }
                                });
                        } else {
                            if (mapRef.current) {
                                initializeMap(mapRef.current, value, isWebMap);
                            }
                        }
                    });
                })
                .catch((error) => {
                    console.error(error);
                    if (error.message.includes('You do not have access to this resource:')) {
                        const appLabel = ConfigHelper.getAppConfig()?.appLabel ?? '';
                        enqueueSnackbar(
                            'Layer not shared properly: ' +
                                error.message +
                                ` Contact${appLabel ? ' ' + appLabel : ''} Admin and Click OK to return to LandingPage`,
                            {
                                variant: 'error',
                                autoHideDuration: null,
                                action: (key) => (
                                    <Button
                                        onClick={() => {
                                            closeSnackbar(key);
                                            goToLandingPage();
                                        }}
                                        color={'secondary'}
                                        size={'small'}
                                        variant={'outlined'}
                                    >
                                        OK
                                    </Button>
                                ),
                            }
                        );
                    } else {
                        enqueueSnackbar(
                            'Unable to find layer: ' + error.message + ' Click OK to return to LandingPage',
                            {
                                variant: 'error',
                                autoHideDuration: null,
                                action: (key) => (
                                    <Button
                                        onClick={() => {
                                            closeSnackbar(key);
                                            goToLandingPage();
                                        }}
                                        color={'secondary'}
                                        size={'small'}
                                        variant={'outlined'}
                                    >
                                        OK
                                    </Button>
                                ),
                            }
                        );
                    }
                });
        }
    }, [portalIdToLoad]);

    /**
     * Runs the On Save Clicked Logic
     */
    async function handleOnDialogClose(dialogCloseValue: boolean) {
        setOpenDialog(dialogCloseValue);
    }

    return (
        <>
            <div className='webmap' ref={mapRef} style={{ display: isLoaded ? 'flex' : 'none' }} />

            {!isLoaded && (
                <>
                    <StyledSpinnerDiv>
                        <CircularProgress color='secondary' size={100} />
                    </StyledSpinnerDiv>
                    <div
                        className='getViewPoint'
                        ref={summaryMapRef}
                        style={{
                            width: '90%',
                            height: '5%',
                            visibility: 'hidden',
                        }}
                    />
                </>
            )}
            {openDialog ? (
                <MessageDialog
                    handleClose={handleOnDialogClose}
                    open={openDialog}
                    dialogTitle={'List of layers not displayed'}
                    dialogMessage={alertMessage.current}
                />
            ) : (
                ''
            )}
        </>
    );
};

export default WebMapView;
