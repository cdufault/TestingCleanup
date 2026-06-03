import React, { useEffect, useRef, useState } from 'react';
import WebScene from '@arcgis/core/WebScene';
import { useViewState } from '../../data/useViewState';
import { RootState } from '../../data/store';
import { useSelector } from 'react-redux';
import { loadView } from './WebMapViewHelper';
import {
    findAppByKeywordAndType,
    retrieveRegionItemData,
    getWebGL3DSupportInfo,
    WebGL3DSupportInfo,
} from '@stratcom/lib-functions';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SceneView from '@arcgis/core/views/SceneView';
import MapView from '@arcgis/core/views/MapView';
import WebMap from '@arcgis/core/WebMap';
import '../../pages/RegionPage/RegionPage.css';
import { IItem } from '@esri/arcgis-rest-portal';
import { ViewState } from '../../data/StaticViewState';
import Layer from '@arcgis/core/layers/Layer';
import PortalItem from '@arcgis/core/portal/PortalItem';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { GateDynamicConfig } from '../../ApplicationSlice';
import { ILandingPageItems } from '../../pages/LandingPage/landingPageSlice';
import { enqueueSnackbar } from 'notistack';
import { searchConfig } from '@stratcom/react-widget-lib';
import { setActiveViewType } from './MapViewSlice';
import { useAppDispatch } from '../../hooks/hooks';

/**Function that handles the display of the view for the region page */
const WebMapView = (): JSX.Element => {
    const mapViewSlicePortalItemId = useSelector((state: RootState) => state.mapViewSlice.viewObjPortalItemId);
    const webMapRef = useRef<HTMLDivElement>(null);
    const hiddenMapRef = useRef<HTMLDivElement>(null);
    const [searchParams] = useSearchParams();
    let regionId = searchParams.get('regionId');
    const { getCachedView, setViewState } = useViewState();
    const [currentWebScene, setCurrentWebScene] = useState<WebMap | WebScene | undefined>();

    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const appConfig = useSelector((state: RootState) => state.applicationSlice.applicationConfig);
    const activeViewType = useSelector((state: RootState) => state.mapViewSlice.activeViewType);
    const displayMode = useSelector((state: RootState) => state.applicationSlice.regionDisplayMode);
    const [portalItemId, setPortalItemId] = useState<string>();
    const lightingIsEnabled = useSelector(
        (state: RootState) => state.applicationSlice.applicationConfig.lightingIsEnabled
    );
    const [lastViewLoaded, setLastViewLoaded] = useState<SceneView | MapView | undefined>();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const countsLoaded = useSelector((state: RootState) => state.mapViewSlice.countsWidgetInitialzied);
    const [canLoadView, setCanLoadView] = useState<boolean>(false);
    const [viewPortalItemId, setViewPortalItemId] = useState('');
    const [missionName, setMissionName] = useState('');
    const [errorMessageText, setErrorMessageText] = useState('Failed to locate the mission map.');

    const gateTypeKeywords = useSelector((state: RootState) => state.applicationSlice.gateRegionAppTypeKeywords);
    const webSceneToMissionNameMappings = useSelector((state: RootState) => state.mapViewSlice.websceneMappings);
    const cachedMissionName = useSelector((state: RootState) => state.mapViewSlice.viewItemObjMissionName);
    const [hasMapLoadErrorCondition, setHasMapLoadErrorCondition] = useState(false);
    const landingPageItems: ILandingPageItems = useSelector((state: RootState) => state.landingPage.landingPageItems);

    /**holds a reference to the last used interval id - intervals are cleared and re-launched when new missions are loaded */
    const intervalIdRef = useRef<any>();

    useEffect(() => {
        if (mapViewSlicePortalItemId && cachedMissionName) {
            const activeMapping = webSceneToMissionNameMappings.find(
                (mapping) => mapping.missionName === cachedMissionName
            );
            if (activeMapping) {
                setViewPortalItemId(activeMapping?.scenePortalItemId);
                setMissionName(cachedMissionName);
            }
        }
    }, [mapViewSlicePortalItemId, cachedMissionName]);

    const dynamicConfig: GateDynamicConfig = useSelector(
        (state: RootState) => state.applicationSlice.gateDynamicConfig
    );
    const DEFAULT_POLLING_INTERVAL_MINS = 5; // 5 minutes
    /*
        The dynamic layer cache. Map of the layer's portalItem ID to its MapView layer ID
     */
    const dynamicLayersRef = useRef<Map<string, string>>(new Map<string, string>());

    /**This property points to the map/scene portal item for the current mission,
     * it updates from a slice property that fires when the region changes while in the region view
     */
    useEffect(() => {
        if (viewPortalItemId && portalItemId !== viewPortalItemId) {
            if (canLoadView) {
                if (intervalIdRef.current) {
                    clearInterval(intervalIdRef.current);
                    console.debug(
                        `Unloading intervalIdRef - portalItemId: ${portalItemId} missionName:${missionName} regionId: ${regionId}`
                    );
                }
                dynamicLayersRef.current?.clear(); //clear old push layer mappings when a new mission is loaded
                setIsLoading(true);
                loadTheView()
                    .then((viewState) => {
                        if (viewState) {
                            intervalIdRef.current = runLoadDynamicLayersInterval(viewState);
                        }
                    })
                    .finally(() => {
                        setIsLoading(false);
                    });
            }
        }
    }, [viewPortalItemId]);

    useEffect(() => {
        if (
            countsLoaded &&
            viewPortalItemId &&
            activeViewType &&
            webMapRef.current &&
            hiddenMapRef.current &&
            displayMode
        ) {
            setCanLoadView(true);
        } else {
            setCanLoadView(false);
        }
    }, [
        countsLoaded && viewPortalItemId && activeViewType && webMapRef.current && hiddenMapRef.current && displayMode,
    ]);

    /**this property is set to true when the region view page is first displayed and multiple underlying
     * dependencies are set - once set this property should remain true until the page is unloaded -
     * future load actions will be driven by other property changes ie: map/scene, mission
     */
    useEffect(() => {
        if (canLoadView) {
            setIsLoading(true);
            loadTheView()
                .then((viewState) => {
                    if (viewState) {
                        intervalIdRef.current = runLoadDynamicLayersInterval(viewState);
                    }
                })
                .finally(() => {
                    setIsLoading(false);
                });
            return () => {
                if (intervalIdRef.current) {
                    clearInterval(intervalIdRef.current);
                }
            };
        }
    }, [canLoadView]);

    useEffect(() => {
        if (hasMapLoadErrorCondition) {
            console.log('MISSING MAP. Will try to find an updated map for the mission');
            checkForUpdatedPortalMapId(missionName).then((itemId) => {
                if (itemId) {
                    setViewPortalItemId(itemId);
                }
            });
        }
    }, [hasMapLoadErrorCondition]);

    /**
     * Called when default mission scene was not found in the cache. This method tries to re-query the application
     * object for the mission to see if there has been an update to the mission since the cache was built.
     * @param nameOfTheCurrentMission webscene or webmap name
     * @returns the updated item id or an empty string if it was not found
     */
    const checkForUpdatedPortalMapId = async (nameOfTheCurrentMission: string) => {
        try {
            let updatedSceneId = '';
            if (nameOfTheCurrentMission) {
                const gateApps = await findAppByKeywordAndType(
                    appConfig.portalUrl,
                    gateTypeKeywords,
                    appConfig.oauthAppId
                );
                const selectedGateApp = gateApps?.results.find(
                    (result: IItem) => result.title === nameOfTheCurrentMission
                );
                const gateAppData = await retrieveRegionItemData(
                    selectedGateApp?.id,
                    appConfig.portalUrl,
                    appConfig.oauthAppId
                );
                updatedSceneId = gateAppData.defaultViewId ? gateAppData.defaultViewId : '';
                if (!updatedSceneId) {
                    const message =
                        'No mapping in the mapping table for map/scene with name: ' + nameOfTheCurrentMission;
                    throw new Error(message);
                }
            } else {
                throw new Error('Mission name not found in the mapping table.');
            }
            return updatedSceneId;
        } catch (error) {
            console.error(error);
            setErrorMessageText('Error occurred. See log for details.');
            return '';
        }
    };

    /**
     * Reference to the dynamic feature layer
     */
    const featureLayerRef = useRef<FeatureLayer>();

    /**
     * Retrive the group id for the selected mission from the cached data in the landing page slice
     * @param missionName name of the current mission
     * @returns undefined or the group id for the current mission
     */
    function getGroupIdFromLandingPageItemsCache(
        currentRegionId: string | undefined | null
    ): string | undefined | null {
        if (landingPageItems) {
            const currentCard = landingPageItems.regionCards.find((regionCard) => {
                return regionCard.regionName === currentRegionId;
            });
            if (currentCard) {
                return currentCard.mission_id;
            }
        }
        return undefined;
    }

    /**
     * Add this layer to the current map and also add it to the mappings of push
     * layers currently added to the map
     * @param mapLayerId portal item id of the layer to add
     * @param viewState data related to the current view
     */
    async function addPushedLayer(layerItemId: string, viewState: ViewState) {
        if (layerItemId) {
            const refreshInterval = dynamicConfig.dynamicLayerServicePollIntervalMins
                ? dynamicConfig.dynamicLayerServicePollIntervalMins + 0.5
                : 2.5;
            if (!dynamicLayersRef.current.get(layerItemId)) {
                //only layers that have not been added previously
                const featureLayer = (await Layer.fromPortalItem({
                    portalItem: { id: layerItemId } as PortalItem,
                })) as FeatureLayer;
                await featureLayer.load();
                viewState.currentView.map.add(featureLayer);
                featureLayer.refreshInterval = refreshInterval; //continue to pull new data for this layer
                // update cache with the map's layer id. This is randomly generated when adding to the map
                dynamicLayersRef.current.set(layerItemId, featureLayer.id);
                enqueueSnackbar('Added ' + featureLayer.title + ' to the map.', { variant: 'success' });
            }
        }
    }

    /**
     * Remove this layer from the current map if it present and also remove it from the mappings of push
     * layers currently added to the map
     * @param mapLayerId portal item id of the layer to remove
     * @param viewState data related to the current view
     */
    function removePushedLayer(mapLayerId: string, viewState: ViewState) {
        if (mapLayerId) {
            const layerId = dynamicLayersRef.current.get(mapLayerId);
            if (layerId) {
                const layer = viewState.currentView.map.findLayerById(layerId);
                if (layer) {
                    viewState.currentView.map.remove(layer);
                    dynamicLayersRef.current.delete(mapLayerId); //remove from push layer mappings
                    enqueueSnackbar('Removed ' + layer.title + ' from the map.', { variant: 'info' });
                }
            }
        }
    }

    /**
     * Look at all the layers in the service for this mission and figure out if they are being added or
     * removed from the map
     * @param groupId mission name
     * @param dateField field in the dynamic layer service that holds the expiration date
     * @param layerItemFieldName field in the dynamic layer service that hols the layer portal item id
     * @param featureLayer the dynamic layer service
     * @returns Map<string, boolean> where string is the layer portal item id and boolean is true if it
     * is to be added to map or false if it is to be removed
     */
    async function createPushActionMappings(
        groupId: string,
        dateField: string,
        layerItemFieldName: string,
        featureLayer: any
    ): Promise<Map<string, boolean>> {
        const result = await featureLayer.queryFeatures({
            where: `mission_id = '${groupId}'`,
            outFields: ['*'],
        });
        const today = Date.now();
        const pushActionMap = new Map<string, boolean>();
        if (result.features) {
            result.features.forEach((ftr: any) => {
                const date = ftr.attributes[dateField.toLowerCase()];
                const id = ftr.attributes[layerItemFieldName.toLowerCase()];
                if (date >= today) {
                    //adding layer
                    pushActionMap.set(id, true); //will add this layer and overwrite any delete action
                } else {
                    //removing layer
                    if (!pushActionMap.has(id)) {
                        //only if there is no add action for this id
                        pushActionMap.set(id, false); //will remove this layer
                    }
                }
            });
        }
        return pushActionMap;
    }

    /**
     * Execute code for adding and removing the dynamic push layers
     * @param viewState holds data related to the last view loaded
     */
    async function loadDynamicLayers(viewState: ViewState) {
        //when in presentation mode we must depend on the missionName
        const groupId = getGroupIdFromLandingPageItemsCache(regionId ? regionId : missionName);
        if (!groupId) {
            console.error(`Failed to find a group id for: ${regionId ? regionId : missionName}`); //use friendly name instead of GUID
            return;
        }
        let featureLayer = featureLayerRef.current as FeatureLayer;
        if (!featureLayer) {
            console.info('Checking for layers in dynamic layer service... ');

            const layer = await Layer.fromPortalItem({
                portalItem: {
                    id: dynamicConfig.dynamicLayerServiceId?.itemId,
                } as PortalItem,
            });
            await layer.load().then((layer) => {
                //needed to await so that the featureLayer is ready to run
                //the first time it hits the if(featureLayer) below - otherwise would have to wait another interval cycle
                featureLayerRef.current = layer as FeatureLayer;
                featureLayer = layer;
            });
        }

        const dateField = 'REMOVE_BY_DATE';
        const layerItemId = 'layer_item_id';
        if (featureLayer && groupId) {
            console.debug('GATE Dynamic Layers: Querying layer using Mission ID: ' + groupId);
            const ftrLayerMapping = await createPushActionMappings(groupId, dateField, layerItemId, featureLayer);
            const ftrLayerMappingIds = Array.from(ftrLayerMapping.keys()); //keys are the layer's portal item ids
            ftrLayerMappingIds.map((key: string) => {
                const addVal = ftrLayerMapping.get(key); //values are boolean
                if (addVal) {
                    //add true values to the map
                    addPushedLayer(key, viewState);
                } else {
                    addVal !== undefined && removePushedLayer(key, viewState); //value must be present but false
                }
            });
        }
    }

    /**
     * Loads the dynamic layer service and polls it at a set interval defined by the configuration.
     * @param viewState holds data related to the last view loaded
     */
    const runLoadDynamicLayersInterval = (viewState: ViewState) => {
        let pollingInterval = DEFAULT_POLLING_INTERVAL_MINS;

        if (dynamicConfig.dynamicLayerServicePollIntervalMins) {
            pollingInterval = dynamicConfig.dynamicLayerServicePollIntervalMins;
            console.info('GATE Dynamic Layers: Polling interval set to ' + pollingInterval + ' minutes');
        } else {
            console.warn(
                'GATE Dynamic Layers: Polling interval setting was not found in the GATE application config. Using the default of ' +
                    DEFAULT_POLLING_INTERVAL_MINS +
                    ' minutes'
            );
        }
        loadDynamicLayers(viewState); //do an initial load while waiting for the interval to start
        const intervalId = setInterval(async () => {
            //starting the interval
            loadDynamicLayers(viewState);
        }, pollingInterval * 60 * 1000);

        return intervalId;
    };

    /**
     * Load the current view - MapView or SceneView - into the designated DOM node
     */
    async function loadTheView(): Promise<ViewState | undefined> {
        let viewState: ViewState | undefined;
        //ensure all relevant state values are hydrated
        if (mapViewSlicePortalItemId && activeViewType && webMapRef.current && hiddenMapRef.current && displayMode) {
            if (currentWebScene && currentWebScene.portalItem?.id === mapViewSlicePortalItemId) {
                return; //view currently has this scene loaded
            }

            let viewType = activeViewType;

            if (getCachedView) {
                if (appConfig.defaultSymbol) {
                    console.info('Calling loadView: ' + mapViewSlicePortalItemId);
                    if (webMapRef.current) {
                        webMapRef.current.style.visibility = 'visible';
                    }

                    const searchConfig: searchConfig = {
                        includeGeocoder: appConfig.search.includeGeocoder,
                        name: appConfig.search.name,
                        allPlaceholder: appConfig.search.allPlaceholder,
                        geocoderUrl: appConfig.search.url,
                        position: 'top-left',
                        minSuggestCharacters: 1,
                    };

                    try {
                        if (activeViewType === 'SCENE') {
                            const webglSupport: WebGL3DSupportInfo = getWebGL3DSupportInfo() as WebGL3DSupportInfo;
                            if (!webglSupport.isWebGLSupported) {
                                if (regionId) {
                                    const params2D = `regionId=${regionId}&viewType=2d`;
                                    navigate(
                                        {
                                            pathname: '/region',
                                            search: params2D,
                                        },
                                        { replace: true }
                                    );
                                } else {
                                    navigate(
                                        {
                                            pathname: '/presentation',
                                            search: 'viewType=2d',
                                        },
                                        { replace: true }
                                    );
                                }

                                enqueueSnackbar(
                                    `${webglSupport.resultMessage}\nThe view has been switched to a 2D Map View.`,
                                    {
                                        variant: 'warning',
                                        autoHideDuration: 12000,
                                        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
                                    }
                                );

                                viewType = 'MAP';
                                dispatch(setActiveViewType(viewType));
                            }
                        }

                        viewState = await loadView(
                            viewType,
                            mapViewSlicePortalItemId,
                            webMapRef.current,
                            hiddenMapRef.current,
                            getCachedView,
                            appConfig.defaultSymbol,
                            lightingIsEnabled,
                            searchConfig
                        );

                        if (viewState) {
                            setViewState(viewState); //don't add an undefined view state
                        }
                        setCurrentWebScene(viewState?.currentWebScene);
                        setLastViewLoaded(viewState?.currentView);
                    } catch (error) {
                        if ((error as Error)?.name?.includes('not-authorized')) {
                            enqueueSnackbar(`Insufficient privileges to view layers, contact GATE admin.`, {
                                variant: 'error',
                                autoHideDuration: 12000,
                                anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
                                transitionDuration: 30,
                            });
                        }
                        console.error('Error loading the view.', error);
                        setCurrentWebScene(undefined);
                        setLastViewLoaded(undefined);
                        if (webMapRef.current) {
                            webMapRef.current.style.visibility = 'hidden';
                        }
                    }

                    setPortalItemId(mapViewSlicePortalItemId);
                }
            }
        }
        return viewState;
    }

    return (
        <>
            {isLoading && (
                <div className='map-wait-icon'>
                    <CircularProgress />
                </div>
            )}
            {!portalItemId ||
                (!lastViewLoaded && !isLoading && (
                    <Box
                        sx={{
                            marginTop: '20%',
                            fontSize: '2em',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: 'white',
                        }}
                    >
                        <Typography>{errorMessageText}</Typography>
                    </Box>
                ))}
            <div className='webmap' ref={webMapRef} />
            <div
                className='getViewPoint2'
                ref={hiddenMapRef}
                style={{ width: '90%', height: '0%', visibility: 'hidden' }}
            />
        </>
    );
};

export default WebMapView;
