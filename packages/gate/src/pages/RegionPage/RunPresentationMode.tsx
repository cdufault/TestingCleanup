import React, { useCallback, useEffect, useState } from 'react';
import RegionFlexLayoutView from './RegionFlexLayoutView';
import { Box, IconButton, Typography } from '@mui/material';
import LandingPage from '../LandingPage/LandingPage';

import './RunPresentationMode.css';
import { useRegionAppData } from '../../hooks/useRegionAppData';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppDispatch, RootState } from '../../data/store';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveViewType, setViewObjPortalItemId } from '../../features/Map/MapViewSlice';
import { IRegionSlice, setRegionName } from './RegionSlice';
import { setRegionDisplayMode, setShowJ2SummaryWhenInPresentationMode } from '../../ApplicationSlice';
import { HomeCommand } from './RegionTools';
import { QueryJ2Assessment } from '../../Share/TrendsWidgetHelper';
import './RegionPage.css';
import { J2AssessmentWidget } from './RegionTabView';
import * as FlexLayout from 'flexlayout-react';
import { flexLayoutJson } from './FlexLayoutJson';
import RegionPageToolbar from './RegionPageToolbar';
import { ToolbarItem } from './RegionToolsHelper';

import XIcon from 'calcite-ui-icons-react/XIcon';
import PreviousIcon from 'calcite-ui-icons-react/BeginningIcon';
import NextIcon from 'calcite-ui-icons-react/EndIcon';
import PauseIcon from 'calcite-ui-icons-react/PauseIcon';
import PlayIcon from 'calcite-ui-icons-react/PlayIcon';
import { useAppSelector } from '../../hooks/hooks';
import {
    nextCard,
    pauseCarousel,
    prevCard,
    resumeCarousel,
    setCurrentIndex,
    stopCarousel,
} from '../LandingPage/landingPageSlice';
import { findAppByKeywordAndType, retrieveRegionItemData } from '@stratcom/lib-functions';
import { setLayoutModel, setLayoutModelJson, setResetLayoutClicked } from './ToolbarSlice';

/**
 * Get the specific data for this region from the config
 * @param regionSlice mock data for region
 */
function parseRegionSlice(regionSlice: IRegionSlice[]): Map<string, IRegionSlice> {
    const regionsMap = new Map<string, IRegionSlice>();
    regionSlice.forEach((region) => {
        regionsMap.set(region.regionName, region);
    });
    return regionsMap;
}

/**Link back to landing page constant */
const LANDING_PAGE = 'home';

/**Show the mapping view - toolbars, widgets, and map of the regions view. No tabs.*/
export function RunPresentationMode(): JSX.Element {
    const dispatch: AppDispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isLoadingAppData, appDataError, regionSliceData } = useRegionAppData();
    // slice values
    const presentationModeUpdateIntervalMinutes = useAppSelector(
        (state: RootState) => state.applicationSlice.gateDynamicConfig.presentationModeUpdateIntervalMinutes
    );
    const landingPageData = useAppSelector((state: RootState) => state.landingPage.landingPageItems);
    const regionName = useAppSelector((state: RootState) => state.regionSlice.regionName);
    const regionsFClassId = useAppSelector(
        (state: RootState) => state.applicationSlice.gateDynamicConfig.regionFeatureClassId
    );
    const j2AssessmentFClassId = useAppSelector(
        (state: RootState) => state.applicationSlice.gateDynamicConfig.j2SummaryFeatureClassId
    );
    const showJ2Assessment = useAppSelector(
        (state: RootState) => state.applicationSlice.showJ2SummaryWhenInPresentationMode
    );
    const appDataMap = useAppSelector((state: RootState) => state.landingPage.appData);
    const webSceneToMissionNameMappings = useAppSelector((state: RootState) => state.mapViewSlice.websceneMappings);
    const carouselPagingUpdateIntervalMinutes = useAppSelector(
        (state: RootState) => state.applicationSlice.gateDynamicConfig.carouselPagingUpdateIntervalMinutes
    );
    const currentIndex = useAppSelector((state: RootState) => state.landingPage.currentIndex);
    const totalCards = useAppSelector((state: RootState) => state.landingPage.totalCards);
    const regionSlices = useSelector((state: RootState) => state.regionSlice.regionSlices);
    // local state variables
    const [, setExpanded] = useState<boolean>(false);
    const [j2AssessmentText, setJ2AssessmentText] = useState<string>('');
    const [currentRegion, setCurrentRegion] = useState<string | undefined>();
    const [regionsFromConfig, setRegionsFromConfig] = useState<Map<string, IRegionSlice>>(
        new Map<string, IRegionSlice>()
    );
    const [regionIdsMemo, setRegionIdsMemo] = useState<string[]>(() => {
        const map = parseRegionSlice(regionSlices);
        return Array.from(map.keys());
    });
    const [count, setCount] = useState<number>(0);
    const [regionJsonModel, setRegionJsonModel] = useState<FlexLayout.Model | undefined>(undefined);
    const defaultRegionJsonFlexLayout = flexLayoutJson as FlexLayout.IJsonModel;
    const regionModelLayout = useSelector((state: RootState) => state.toolbarSlice.layoutModel);
    const portalUrl = useSelector((state: RootState) => state.applicationSlice.applicationConfig.portalUrl);
    const [selectedToolbarItemIds, setSelectedToolbarItemIds] = useState<string[]>([]);
    const [toolbarItems, setToolbarItems] = useState<ToolbarItem[]>([]);
    const [timer, setTimer] = useState<NodeJS.Timer>();
    const [paused, setPaused] = useState<boolean>(false);
    const resetLayout = useSelector((state: RootState) => state.toolbarSlice.resetLayoutClicked);
    const appConfig = useSelector((state: RootState) => state.applicationSlice.applicationConfig);
    const gateTypeKeywords = useSelector((state: RootState) => state.applicationSlice.gateRegionAppTypeKeywords);

    const viewType = searchParams.get('viewType') ?? '2d';
    dispatch(setActiveViewType(viewType === '2D' || viewType === '2d' ? 'MAP' : 'SCENE'));
    dispatch(setRegionDisplayMode('Presentation'));

    /**
     * Increment count index by one to move to next region
     */
    const nextRegion = useCallback(async () => {
        await setCount((id) => {
            if (regionIdsMemo && id < regionIdsMemo.length - 1) {
                return id + 1; // Move to the next region
            } else {
                return -1; // Return to the landing page
            }
        });
    }, [regionIdsMemo]);

    const nextLandingPageCard = useCallback(() => {
        if (count === -1) {
            // On the landing page
            if (currentIndex < totalCards - 1) {
                // Move to the next card
                dispatch(nextCard());
            } else {
                // Transition to the first region when on the last card
                nextRegion();
            }
        }
    }, [count, currentIndex, totalCards, dispatch]);

    /**
     * Decrement count index by one to move to previous region
     */
    const previousRegion = () => {
        /**Cycle through the regions and landing page */
        setCount((id) => {
            if (regionIdsMemo && id >= 0) {
                // on landingPage
                return id - 1;
            } else if (regionIdsMemo && id < 0) {
                // on region pages
                return regionIdsMemo.length - 1;
            } else {
                return 0;
            }
        });
    };

    useEffect(() => {
        // Clear any existing timer
        if (timer) clearInterval(timer);

        // Don't start a new timer if paused
        if (paused) return;

        let interval: NodeJS.Timer;

        // Determine the interval duration
        const intervalMs =
            count === -1
                ? ((carouselPagingUpdateIntervalMinutes as number) ?? 10) * 60 * 1000
                : ((presentationModeUpdateIntervalMinutes as number) ?? 10) * 60 * 1000;

        // Set the interval based on the current mode (landing page or region)
        if (count === -1) {
            // Landing page: handle cards and transition to regions
            interval = setInterval(nextLandingPageCard, intervalMs);
        } else {
            // Region view: cycle through regions
            interval = setInterval(nextRegion, intervalMs);
        }

        setTimer(interval);

        // Cleanup on unmount or when dependencies change
        return () => clearInterval(interval);
    }, [count, paused, carouselPagingUpdateIntervalMinutes, presentationModeUpdateIntervalMinutes, currentIndex]);

    useEffect(() => {
        if (regionIdsMemo) {
            if (count === -1) {
                dispatch(setCurrentIndex(0));
                setCurrentRegion(LANDING_PAGE);
            } else {
                setCurrentRegion(regionIdsMemo[count]);
            }
        }
    }, [count, regionIdsMemo]);

    useEffect(() => {
        if (currentRegion && webSceneToMissionNameMappings && webSceneToMissionNameMappings.length > 0) {
            const currentMapping = webSceneToMissionNameMappings.find(
                (mapping) => mapping.missionName === currentRegion
            );
            dispatch(
                setViewObjPortalItemId({
                    id: currentMapping?.scenePortalItemId,
                    name: currentMapping?.missionName,
                })
            );
            dispatch(setRegionName(currentRegion));
        }
    }, [currentRegion, regionsFromConfig, dispatch, webSceneToMissionNameMappings]);

    useEffect(() => {
        if (regionSliceData) {
            const map = parseRegionSlice(regionSliceData);
            setRegionsFromConfig(map);
            setRegionIdsMemo(Array.from(map.keys()));
        }
    }, [regionSliceData]);

    useEffect(() => {
        if (landingPageData && regionName !== '' && regionsFClassId !== '' && j2AssessmentFClassId !== '') {
            setJ2AssessmentText('');
            queryJ2Assessment();
            retrieveJsonLayout();
        }
    }, [landingPageData, regionName, regionsFClassId, j2AssessmentFClassId]);

    // sets region model from current json model
    useEffect(() => {
        setRegionJsonModel(regionModelLayout);
    }, [regionModelLayout]);

    // resets the layout to the initial default if the reset layout button is selected
    useEffect(() => {
        resetJsonLayoutToDefault();
    }, [resetLayout]);

    /**
     * Get the json layout for widgets to display for this region.
     */
    async function retrieveJsonLayout() {
        let resultsFindAllApps: any;
        if (portalUrl) {
            resultsFindAllApps = await findAppByKeywordAndType(portalUrl, gateTypeKeywords, appConfig.oauthAppId);
        }
        let selectedRegionApp: any | undefined;
        if (portalUrl) {
            selectedRegionApp = resultsFindAllApps?.results.find((result: any) => result.title === regionName);
            if (selectedRegionApp) {
                const itemData = await retrieveRegionItemData(selectedRegionApp?.id, portalUrl, appConfig.oauthAppId);
                if (itemData.jsonLayout) {
                    const formattedJsonLayout = JSON.parse(itemData.jsonLayout.regionModelLayoutJson);
                    const model = FlexLayout.Model.fromJson(formattedJsonLayout);
                    setRegionJsonModel(model);
                    dispatch(setLayoutModelJson(formattedJsonLayout));
                    dispatch(setLayoutModel(model));
                } else {
                    const model = FlexLayout.Model.fromJson(defaultRegionJsonFlexLayout);
                    setRegionJsonModel(model);
                    dispatch(setLayoutModelJson(defaultRegionJsonFlexLayout));
                    dispatch(setLayoutModel(model));
                }
            }
        }
    }

    /**
     * Resets the region json model for widgets to bring back default layout
     */
    const resetJsonLayoutToDefault = async () => {
        if (regionJsonModel) {
            if (resetLayout) {
                retrieveJsonLayout();
                dispatch(setResetLayoutClicked(false));
            }
        }
    };

    /**
     * Flush out error display in another Task
     */
    function showError() {
        return <Box>Error</Box>;
    }

    /**
     * TODO: Flush out loading in another Task
     */
    function showLoading() {
        return <Box>Loading. . .</Box>;
    }

    /**
     * TODO: Improve this user experience
     */
    function showInitializing() {
        return <Box>Initializing...</Box>;
    }

    /**
     * close out of presentation mode
     */
    const closeButtonClicked = useCallback(() => {
        dispatch(stopCarousel());
        dispatch(setRegionDisplayMode('Standard'));
        navigate({
            pathname: '/',
        });
    }, [navigate]);

    /**
     * Clears the timer, switches to the next region, recreates the timer (if not paused)
     */
    function next() {
        if (count === -1) {
            // On the landing page
            if (currentIndex < totalCards - 1) {
                dispatch(nextCard()); // Move to the next card
            } else {
                nextRegion(); // Transition to the first region
            }
        } else {
            // In a region
            nextRegion();
        }

        // Restart the timer only if not paused
        if (!paused) {
            clearInterval(timer);
            const interval = startTimer(
                paused,
                count,
                (carouselPagingUpdateIntervalMinutes as number) ?? 10,
                (presentationModeUpdateIntervalMinutes as number) ?? 10,
                nextRegion,
                dispatch,
                currentIndex,
                totalCards
            );
            if (interval) setTimer(interval);
        }
    }

    /**
     * Clears the timer, switches to previous region, recreates the timer (if not paused)
     */
    function previous() {
        if (count === -1) {
            // On the landing page
            if (currentIndex > 0) {
                dispatch(prevCard()); // Move to the previous card
            } else {
                previousRegion(); // Cycle to the last region
            }
        } else {
            // In a region
            previousRegion();
        }

        // Restart the timer only if not paused
        if (!paused) {
            clearInterval(timer);
            const interval = startTimer(
                paused,
                count,
                (carouselPagingUpdateIntervalMinutes as number) ?? 10,
                (presentationModeUpdateIntervalMinutes as number) ?? 10,
                nextRegion,
                dispatch,
                currentIndex,
                totalCards
            );
            if (interval) setTimer(interval);
        }
    }

    /**
     * Pauses presentation mode
     */
    function pause() {
        clearInterval(timer);
        setPaused(true);
        dispatch(pauseCarousel());
    }

    /**
     * Un-pause presentation mode and create a new timer
     */
    function play() {
        setPaused(false);
        if (count === -1) {
            const interval = createInterval((carouselPagingUpdateIntervalMinutes as number) ?? 10, () => {
                if (currentIndex < totalCards - 1) {
                    dispatch(nextCard());
                } else {
                    nextRegion();
                }
            });
            setTimer(interval);
        } else {
            const interval = createInterval((presentationModeUpdateIntervalMinutes as number) ?? 10, nextRegion);
            setTimer(interval);
        }
        dispatch(resumeCarousel());
    }

    /**
     * Creates the interval timer used to switch to the next region automatically or the next
     * card in the carousel
     * Refresh Interval defined on the configuration page
     * @returns {JSNode.Timer} The timer object
     */
    function createInterval(refreshIntervalInMinutes: number, action: () => void) {
        const timerMilliSecs = refreshIntervalInMinutes * 60 * 1000;
        return setInterval(action, timerMilliSecs);
    }

    function startTimer(
        paused: boolean,
        count: number,
        carouselInterval: number,
        presentationInterval: number,
        nextRegion: () => void,
        dispatch: AppDispatch,
        currentIndex: number,
        totalCards: number
    ) {
        if (!paused) {
            const intervalMs = count === -1 ? carouselInterval * 60 * 1000 : presentationInterval * 60 * 1000;
            const action =
                count === -1
                    ? () => {
                          if (currentIndex < totalCards - 1) {
                              dispatch(nextCard());
                          } else {
                              nextRegion();
                          }
                      }
                    : nextRegion;

            return setInterval(action, intervalMs);
        }
    }

    /**query the J2Assessment ftr class for the latest data */
    async function queryJ2Assessment() {
        const appData = appDataMap?.find((item) => {
            if (item.key === regionName) {
                return item.value;
            }
        });

        const globalId = appData?.value.regionFtrClassGlobalId;
        console.debug('presentation: ' + globalId);
        if (globalId) {
            const r = await QueryJ2Assessment(j2AssessmentFClassId, globalId);
            r && setJ2AssessmentText(r);
        }
    }

    function updateAssessmentText(text: string) {
        setJ2AssessmentText(text);
    }
    /**Event handler for accordion change */
    const handleAccordionChange = (event: React.SyntheticEvent, newExpanded: boolean) => {
        setExpanded(newExpanded);
        dispatch(setShowJ2SummaryWhenInPresentationMode(newExpanded));
    };

    let showLandingPage = currentRegion === 'home';
    return (
        <>
            {isLoadingAppData && showLoading()}
            {appDataError && showError()}
            {!currentRegion && !isLoadingAppData && showInitializing()}
            {!isLoadingAppData && appDataError === undefined && currentRegion ? (
                !showLandingPage ? (
                    <div className='region-container'>
                        <div className='tabs-box'>
                            <div className='home-button'>
                                <HomeCommand tooltip='Landing Page' enabled={true} />
                            </div>
                            <div className='tabs-div color-white'>
                                <div className='presentation-header-text-div'>
                                    Presentation View: Region {currentRegion}
                                </div>
                            </div>
                            <div className='j2assessment-div'>
                                <J2AssessmentWidget
                                    handleAccordionChange={handleAccordionChange}
                                    updateAssessmentText={updateAssessmentText}
                                    disabled={j2AssessmentText === ''}
                                />
                            </div>
                        </div>
                        {showJ2Assessment && (
                            <div className='j2assessment-text'>
                                <Typography>{j2AssessmentText}</Typography>
                            </div>
                        )}
                        {regionJsonModel && (
                            <>
                                <div className='map-tab-div'>
                                    <RegionPageToolbar
                                        toolbarItems={toolbarItems}
                                        setToolbarItems={setToolbarItems}
                                        selectedToolbarItemIds={selectedToolbarItemIds}
                                        setSelectedToolbarItemIds={setSelectedToolbarItemIds}
                                        regionJsonModel={regionJsonModel}
                                    />
                                    <div className='flex-layout-container-div'>
                                        <RegionFlexLayoutView
                                            regionId={currentRegion}
                                            regionJsonModel={regionJsonModel}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <LandingPage />
                )
            ) : (
                ''
            )}
            <div className='media-controls'>
                <IconButton className='previous-button media-control-button' title='Previous' onClick={previous}>
                    <PreviousIcon className='previous-icon media-control-icon' />
                </IconButton>
                {paused && (
                    <IconButton className='play-button media-control-button' title='Play' onClick={play}>
                        <PlayIcon className='play-icon media-control-icon' />
                    </IconButton>
                )}
                {!paused && (
                    <IconButton className='pause-button media-control-button' title='Pause' onClick={pause}>
                        <PauseIcon className='pause-icon media-control-icon' />
                    </IconButton>
                )}
                <IconButton className='next-button media-control-button' title='Next' onClick={next}>
                    <NextIcon className='next-icon media-control-icon' />
                </IconButton>
            </div>
            <IconButton
                className='close-presentation-mode-button'
                title='Exit out of Presentation Mode'
                onClick={closeButtonClicked}
            >
                <XIcon className='close-presentation-mode-icon' />
            </IconButton>
        </>
    );
}
