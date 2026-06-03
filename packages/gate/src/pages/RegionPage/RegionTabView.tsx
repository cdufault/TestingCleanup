import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import {
    Accordion,
    AccordionSummary,
    Alert,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Snackbar,
    styled,
    Tab,
    Tabs,
    Tooltip,
    Typography,
} from '@mui/material';
import { HomeCommand } from './RegionTools';
import { CustomTab } from './CustomTab';
import RegionFlexLayoutView from './RegionFlexLayoutView';
import { createSearchParams, useNavigate } from 'react-router-dom';
import { setRegionName } from './RegionSlice';
import { AppDispatch, RootState } from '../../data/store';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../../hooks/hooks';

import DownIcon from 'calcite-ui-icons-react/CaretDownIcon';
import { QueryJ2Assessment } from '../../Share/TrendsWidgetHelper';
import { useSelector } from 'react-redux';
import {
    getPortalItemDataById,
    findAppByKeywordAndType,
    updatePortalWebApp,
    retrieveRegionItemData,
} from '@stratcom/lib-functions';

import './RegionPage.css';
import * as FlexLayout from 'flexlayout-react';
import RegionPageToolbar from './RegionPageToolbar';
import { ToolbarItem } from './RegionToolsHelper';
import RichTextEditorViewer from '../../Share/RichTextEditorViewer';
import { setLayoutModel, setLayoutModelJson, setResetLayoutClicked, setSaveLayoutClicked } from './ToolbarSlice';
import { flexLayoutJson } from './FlexLayoutJson';
import { StaticAuthenticationState } from '../../data/StaticAuthenticationState';

const DownIconButton = styled(DownIcon)`
    color: white;
`;
const MapTab = styled(Tab)`
    color: white;
    font-size: 16px;
`;
const SecondaryTab = styled(MapTab)`
    padding-left: 25px;
`;

const SelectLabel = styled(InputLabel)`
    color: white;
    padding-top: 10px;
    padding-right: 10px;
`;

/**Properties passes to tab panel */
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

/**The tabs in the regions view */
function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    let displayTab = value === index;

    return (
        <>
            {displayTab ? (
                <div className='tabpanel0' id={`simple-tabpanel-${index}`} {...other}>
                    {value === index && <div className='tab-children'>{children}</div>}
                </div>
            ) : (
                ''
            )}
        </>
    );
}

/**Props for the region tab view */
interface RegionTabViewProps {
    /**Region id - name of the region */
    regionId?: string;
    /**view type MAP/SCENE 2D/3D */
    viewType: string | null;
}

interface ITabsData {
    title: string;
    url: string;
    visible: boolean;
}

/**The tabs for the region view */
export default function RegionTabView(props: RegionTabViewProps) {
    let { regionId, viewType } = props;
    const navigate = useNavigate();
    const dispatch: AppDispatch = useDispatch();

    const [currentTabValue, setCurrentTabValue] = useState<number>(0);
    const [regionNames, setRegionNames] = useState<string[]>([]);
    const [expanded, setExpanded] = useState<boolean>(false);
    const [j2AssessmentText, setJ2AssessmentText] = useState<string>('');
    const [tabsData, setTabsData] = useState<ITabsData[] | undefined>();
    const portalUrl = useSelector((state: RootState) => state.applicationSlice.applicationConfig.portalUrl);
    const gateTypeKeywords = useSelector((state: RootState) => state.applicationSlice.gateRegionAppTypeKeywords);

    const landingPageStateData = useAppSelector((state) => state.landingPage.landingPageItems);
    const appDataMap = useAppSelector((state) => state.landingPage.appData);

    const [selectedToolbarItemIds, setSelectedToolbarItemIds] = useState<string[]>([]);
    const [toolbarItems, setToolbarItems] = useState<ToolbarItem[]>([]);
    const [regionJsonModel, setRegionJsonModel] = useState<FlexLayout.Model | undefined>(undefined);

    const [useStackedJson, setUseStackedJson] = useState<boolean>(false);
    const [selectedRegionId, setSelectedRegionId] = useState<string>(regionId ? regionId : '');
    const appConfig = useSelector((state: RootState) => state.applicationSlice.applicationConfig);
    const defaultRegionJsonFlexLayout = flexLayoutJson as FlexLayout.IJsonModel;
    const saveLayout = useSelector((state: RootState) => state.toolbarSlice.saveLayoutClicked);
    const regionModelLayout = useSelector((state: RootState) => state.toolbarSlice.layoutModel);
    const regionModelLayoutJson = useSelector((state: RootState) => state.toolbarSlice.layoutModelJson);
    const resetLayout = useSelector((state: RootState) => state.toolbarSlice.resetLayoutClicked);
    const userSession = StaticAuthenticationState.getUserSessionState();
    const portal = StaticAuthenticationState.getPortalState();

    /**Handle tab selection change */
    function handleTabChanged(event: React.SyntheticEvent, newValue: number) {
        setCurrentTabValue(newValue);
    }

    /**Handle regions select change */
    function handleRegionsSelectChange(event: SelectChangeEvent) {
        let id = event?.target.value;
        if (selectedRegionId !== '' && selectedRegionId !== id) {
            //1-31
            dispatch(setRegionName(id));
            setSelectedRegionId(id);
            setJ2AssessmentText('');
        }
    }

    useEffect(() => {
        dispatch(setSaveLayoutClicked(false));
        const initialWidth = window.innerWidth;
        initialWidth < 1200 ? setUseStackedJson(true) : setUseStackedJson(false);

        window.addEventListener('resize', (event) => {
            const displayWindow = event?.currentTarget as Window;
            let width = 1500;
            if (displayWindow) {
                width = displayWindow.innerWidth;
            }

            width < 1200 ? setUseStackedJson(true) : setUseStackedJson(false);
        });

        return () => {
            //detach event
        };
    }, []);

    // sets region model from current json model
    useEffect(() => {
        setRegionJsonModel(regionModelLayout);
    }, [regionModelLayout]);

    // resets the layout to the initial default if the reset layout button is selected
    useEffect(() => {
        resetJsonLayoutToDefault();
    }, [resetLayout]);

    useEffect(() => {
        if (toolbarItems) {
            console.log('toolbar items ', toolbarItems);
        }
    }, [toolbarItems]);

    useEffect(() => {
        if (regionId && selectedRegionId) {
            //1-31
            retrieveTabData();
            retrieveJsonLayout();
        }
    }, [selectedRegionId, regionId]);

    useEffect(() => {
        if (landingPageStateData && landingPageStateData.regionCards.length > 0) {
            let names = landingPageStateData.regionCards.map((card) => card.regionName);
            setRegionNames(names);
        }
    }, [landingPageStateData]);

    useEffect(() => {
        if (!viewType) {
            navigate('/error', { state: 'Query param for viewType must be: 2D or 3D' });
        }
        if (selectedRegionId === regionId) {
            return;
        }
        if (selectedRegionId && selectedRegionId !== '' && navigate) {
            let vType = viewType ? viewType : '2d';
            const params = { regionId: selectedRegionId, viewType: vType };

            navigate({
                pathname: '/region',
                search: `?${createSearchParams(params)}`,
            });
        }
    }, [selectedRegionId, navigate, viewType]);

    useEffect(() => {
        if (saveLayout) {
            saveJsonLayoutToDefault();
        }
    }, [saveLayout]);

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
            selectedRegionApp = resultsFindAllApps?.results.find((result: any) => result.title === regionId);
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
     * Saves the region json model for widgets to set a new default layout
     */
    const saveJsonLayoutToDefault = async () => {
        if (selectedToolbarItemIds) {
            if (regionJsonModel) {
                if (selectedToolbarItemIds.length > 0) {
                    if (saveLayout) {
                        let resultsFindAllApps: any;
                        if (portalUrl) {
                            resultsFindAllApps = await findAppByKeywordAndType(
                                portalUrl,
                                gateTypeKeywords,
                                appConfig.oauthAppId
                            );
                        }
                        let selectedRegionApp: any | undefined;
                        if (portalUrl) {
                            selectedRegionApp = resultsFindAllApps?.results.find(
                                (result: any) => result.title === regionId
                            );
                            if (selectedRegionApp) {
                                const jsonData = {
                                    jsonLayout: { regionModelLayoutJson },
                                };
                                const itemData = await retrieveRegionItemData(
                                    selectedRegionApp?.id,
                                    portalUrl,
                                    appConfig.oauthAppId
                                );
                                const dataToSend = { ...itemData, ...jsonData };
                                const result = await updatePortalWebApp(
                                    selectedRegionApp.id,
                                    JSON.stringify(dataToSend),
                                    userSession,
                                    portal.restUrl
                                );
                                if (!result?.success) {
                                    console.error('Error occurred updating layout for region page: ', result);
                                }
                            }
                        }
                    }
                }
            }
        }
    };

    /**
     * Get the data for the tabs to display for this region.
     */
    async function retrieveTabData() {
        if (!appDataMap) {
            const resultsFind = await findAppByKeywordAndType(portalUrl, gateTypeKeywords, appConfig.oauthAppId);
            const selectedRegion = resultsFind?.results.find((result) => result.title === regionId);

            selectedRegion &&
                getPortalItemDataById(selectedRegion.id, portalUrl, appConfig.oauthAppId).then((result) => {
                    console.log('Item Data Result:', result);
                    result &&
                        result.appData &&
                        setTabsData(result.appData.tabs?.filter((tab: ITabsData) => tab.visible) ?? []);
                    console.log('found tab data: ');
                    console.log(result.appData.tabs);
                });
        } else {
            const appData = appDataMap?.find((item) => {
                if (item.key === selectedRegionId) {
                    return item.value;
                }
            });
            const regionData = appData.value;
            if (regionData) {
                setTabsData(regionData.tabs?.filter((tab: ITabsData) => tab.visible) ?? []);
            }
            console.log('found tab data from cache: ');
            console.log(regionData.tabs);
        }
    }

    const handleAccordionChange = (event: React.SyntheticEvent, newExpanded: boolean) => {
        setExpanded(newExpanded);
    };

    function updateAssessmentText(text: string) {
        setJ2AssessmentText(text);
    }

    const handleClose = () => {
        dispatch(setSaveLayoutClicked(false));
    };

    return (
        <>
            <div className='tabs-box'>
                <div className='home-button'>
                    <HomeCommand tooltip='Landing Page' enabled={true} />
                </div>
                <div className='tabs-div'>
                    <Tabs value={currentTabValue} onChange={handleTabChanged}>
                        <MapTab label={`${selectedRegionId}`} />
                        {tabsData && tabsData.map((tab) => tab.visible && <SecondaryTab label={tab.title} />)}
                    </Tabs>
                </div>
                <div className='j2assessment-div'>
                    <J2AssessmentWidget
                        handleAccordionChange={handleAccordionChange}
                        updateAssessmentText={updateAssessmentText}
                        disabled={j2AssessmentText === ''}
                    />
                    <SelectLabel>Go To Region:</SelectLabel>
                    <FormControl sx={{ minWidth: '150px' }} size='small'>
                        <Select sx={{ color: 'white' }} value={selectedRegionId} onChange={handleRegionsSelectChange}>
                            {regionNames.map((region, idx) => {
                                return (
                                    <MenuItem value={region} key={region + '_' + idx}>
                                        {region}
                                    </MenuItem>
                                );
                            })}
                        </Select>
                    </FormControl>
                </div>
            </div>
            {expanded && (
                <div className='j2assessment-text'>
                    <div>
                        <RichTextEditorViewer viewerData={j2AssessmentText} />
                    </div>
                </div>
            )}

            {regionJsonModel && currentTabValue === 0 && (
                <div className='map-tab-div'>
                    <RegionPageToolbar
                        toolbarItems={toolbarItems}
                        setToolbarItems={setToolbarItems}
                        selectedToolbarItemIds={selectedToolbarItemIds}
                        setSelectedToolbarItemIds={setSelectedToolbarItemIds}
                        regionJsonModel={regionJsonModel}
                    />

                    <div className='flex-layout-container-div'>
                        <TabPanel value={currentTabValue} index={0}>
                            <RegionFlexLayoutView
                                toolbarItems={toolbarItems}
                                selectedToolbarItemIds={selectedToolbarItemIds}
                                setSelectedToolbarItemIds={setSelectedToolbarItemIds}
                                regionId={selectedRegionId}
                                regionJsonModel={regionJsonModel}
                            />
                        </TabPanel>
                    </div>
                </div>
            )}
            {currentTabValue !== 0 && (
                <div className='non-map-tab-div'>
                    {tabsData &&
                        tabsData.map(
                            (tab, idx) =>
                                tab.visible && (
                                    <TabPanel value={currentTabValue} index={idx + 1}>
                                        <CustomTab tabUrl={tab.url} />
                                    </TabPanel>
                                )
                        )}
                </div>
            )}
            <Snackbar
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                open={saveLayout}
                autoHideDuration={5000}
                onClose={handleClose}
            >
                <Alert onClose={handleClose} variant={'filled'} severity={'info'}>
                    Current widget layout set as default.
                </Alert>
            </Snackbar>
        </>
    );
}

/**
 * Region Details Properties
 */
export interface J2AssessmentWidgetProps {
    /**event handler for the accordion toggle icon */
    handleAccordionChange: (event: React.SyntheticEvent, newExpanded: boolean) => void | undefined;
    /**call back method to update the ui with the current text */
    updateAssessmentText: (s: string) => void;
    /**disable if no text is found */
    disabled: boolean;
}

/**Widget for display the J2Assessment text */
export function J2AssessmentWidget(props: J2AssessmentWidgetProps) {
    const landingPageData = useAppSelector((state) => state.landingPage.landingPageItems);
    const regionName = useAppSelector((state: RootState) => state.regionSlice.regionName);
    const regionsFClassId = useAppSelector(
        (state: RootState) => state.applicationSlice.gateDynamicConfig.regionFeatureClassId
    );
    const j2AssessmentFClassId = useAppSelector(
        (state: RootState) => state.applicationSlice.gateDynamicConfig.j2SummaryFeatureClassId
    );
    const gateDynamicConfig = useAppSelector((state: RootState) => state.applicationSlice.gateDynamicConfig);
    const j2AssessmentAlias = gateDynamicConfig.j2AssessmentAlias
        ? gateDynamicConfig.j2AssessmentAlias
        : 'J2 Assessment';
    const appDataMap = useAppSelector((state) => state.landingPage.appData);

    useEffect(() => {
        if (landingPageData && regionName !== '' && regionsFClassId !== '' && j2AssessmentFClassId !== '') {
            queryJ2Assessment();
        }
    }, [landingPageData, regionName, regionsFClassId, j2AssessmentFClassId]);

    /**query the J2Assessment ftr class for the latest data */
    async function queryJ2Assessment() {
        const appData = appDataMap?.find((item) => {
            if (item.key === regionName) {
                return item.value;
            }
        });
        const globalId = appData?.value.regionFtrClassGlobalId;
        console.debug('regiontabView: ' + globalId);
        if (globalId) {
            const r = await QueryJ2Assessment(j2AssessmentFClassId, globalId);
            r && props.updateAssessmentText(r);
        }
    }

    return (
        <React.Fragment>
            <Box>
                <Tooltip title={props.disabled ? 'No assessment text found' : 'Show/Hide assessment text'}>
                    <Accordion
                        disabled={props.disabled}
                        disableGutters
                        onChange={props.handleAccordionChange}
                        sx={{ width: '250px', marginTop: '0px', marginRight: '25px' }}
                    >
                        <AccordionSummary
                            expandIcon={<DownIconButton />}
                            sx={{ paddingTop: '0px', color: 'white', backgroundColor: 'black' }}
                        >
                            <Typography>{j2AssessmentAlias}</Typography>
                        </AccordionSummary>
                    </Accordion>
                </Tooltip>
            </Box>
        </React.Fragment>
    );
}
