// React Imports
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useSnackbar } from 'notistack';

// Component imports
import SaveState from './SaveState';
import { IUserSaveState, ManualClassificationInfo, WorkSpaceItem } from '../../../../interfaces/UserSaveState';
import SaveWorkspaceNameDialog from './SaveWorkspaceDialog';
import { PortalClassification } from '../../../../interfaces/PortalClassification';

import { Button, MenuItem } from '@mui/material';

// helper imports
import { ConfigHelper } from '../../../../helpers/configHelper';
import { ApplicationStateHelper } from '../../../../helpers/ApplicationStateHelper';
import { getDefaultMissionMap } from '../../../../helpers/mapHelper';
import { getMissionsForUser, getPortalGroupUsers } from '../../../../helpers/portalUsersHelper';
import { DEFAULT_MISSION, DEFAULT_VIEW, DEFAULT_WORKSPACE } from '../../../../data/savedState';
import { findPortalGroupByTitle, getGroupContentByGroupId } from '../../../../helpers/portalGroupHelper';
import { getMissionIdByTitle, getWebAppAndData, isGateMission } from '../../../../helpers/missionHelper';
import {
    checkIfItemIdIsGroup,
    findPortalItemById,
    updateGroupToScene,
    updatePortalWebApp,
} from '../../../../helpers/portalItemsHelper';
import { getMidDayAtLongitude } from '../../../../helpers/dateTimeHelper';

// Context imports
import { AppContext } from '../../../../contexts/App';
import { MapContext } from '../../../../contexts/Map';
import { useSaveLoadContext } from '../../../../contexts/SaveLoad';

// esri imports
import MapView from '@arcgis/core/views/MapView';
import SceneView from '@arcgis/core/views/SceneView';
import View from '@arcgis/core/views/View';
import PortalGroup from '@arcgis/core/portal/PortalGroup';
import SunLighting from '@arcgis/core/views/3d/environment/SunLighting';
import VirtualLighting from '@arcgis/core/views/3d/environment/VirtualLighting';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import { IItem, IUpdateItemResponse } from '@esri/arcgis-rest-portal';
import { useAppDispatch, useAppSelector } from '../../../../hooks/hooks';
import { RootState } from '../../../../data/store';
import { OpsClockDataSerializable } from '@stratcom/react-widget-lib/types/OpsClockWidgetLib';
import { setExistingClocksList } from './SaveStateSlice';
import { setActiveView } from '../../../webMap/WebMapViewSlice';
import { useHistory } from 'react-router-dom';

/**
 * SaveState parameters
 * @param portalUser - currently logged-in user
 * @param selectedMission - object to load that is either a Mission, Workspace, or appDefault
 */
type SaveStateContainerProps = {
    portalUser: __esri.PortalUser;
    selectedMission: { value: IItem | WorkSpaceItem; timeStamp: Date; viewType?: '2D' | '3D' };
};

/**
 * structure to hold mission info for when browser is in a reload state
 */
type sessionMissionItem = {
    id: string;
    title: string;
    isWorkspace: boolean;
    timeStamp: Date;
    viewType: string;
};

/**
 * saves application current state.
 * @param props
 * @constructor
 */
export default function SaveStateContainer(props: SaveStateContainerProps): JSX.Element {
    // Added for toast messages
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const defaultPortalClassificationItem = {
        classification: '',
        banner: '',
        disseminationOptions: [],
        classificationDate: '',
        declassificationDate: 'Manual Review',
        isRawSigint: false,
        isEvaluatedAndMinimized: false,
        isDisseminable: false,
        lacOptions: [],
        topicOptions: [],
        regionOptions: [],
        classifiedBy: '',
    };
    // Get contexts
    const {
        activeView,
        getMapView,
        getSceneView,
        sceneView,
        mapView,
        setLayersRemovedFor2dDisplay,
        setRenderReplacementObjects,
        setLoadedViewPoint,
        map,
    } = useContext(MapContext);
    const { portalUser } = useContext(AppContext);
    const saveLoadContext = useSaveLoadContext();
    const appConfig = ConfigHelper.getAppConfig();
    const applicationStateHelper = ApplicationStateHelper;
    const classificationItems = useAppSelector((state: RootState) => state.classificationSlice.classificationItems);
    const [userSaveExists, setUserSaveExists] = useState<boolean>(false);
    const [view, setView] = useState<View>();
    const [isAGateMission, setIsAGateMission] = useState<boolean>(false);
    const [lastSelectedMission, setLastSelectedMission] = useState<sessionMissionItem>();
    const [selectedObject] = useState(props.selectedMission);
    const [openNameDialog, setOpenNameDialog] = useState(false);
    const [finishedUpdating, setFinishedUpdating] = useState(false);
    const opsClocks = useAppSelector((state) => state.saveStateSlice.existingClocksList);
    const dispatch = useAppDispatch();
    const history = useHistory();
    const saveButtonOptions = ['Save As Workspace', 'Save As Mission Default'];
    // tracks saved state for beforeunload event tracking
    const currentSavedState = useRef(true);
    const selectedSaveIndex = useRef(0);
    const isInitialLoad = useRef(true);
    const workspaceChanged = useRef(false);
    const selectedMissionObject = useRef(props.selectedMission); // is group not scene...
    const missionMenuItems = useRef<JSX.Element[]>([]);
    const workSpaces = useRef<JSX.Element[]>([]);
    const filteredMissions = useRef<PortalGroup[]>([]);
    const isViewDoneUpdating = useRef(false);
    const workspaceLayerId = useRef<string>();
    const viewType = useRef<'2D' | '3D'>(selectedObject.viewType ? selectedObject.viewType : '3D');
    const workSpaceItem = useRef<WorkSpaceItem>({
        lastSaved: '',
        viewType: '',
        missionValue: '',
        viewNameValue: '',
        workspaceId: '',
        portalItemId: '',
        mapView: { extent: '', center: '', scale: 0, zoom: 0 },
        sceneView: {
            camera: {
                fov: 0,
                heading: 0,
                position: {
                    spatialReference: {
                        wkid: 4326,
                    },
                    x: 0,
                    y: 0,
                    z: 0,
                },
                tilt: 0,
            },
        },
        gpTaskList: [],
        bookmarks: '',
        title: '',
        opsClocks: [],
    });

    const iUserSaveObjectJson = useRef<IUserSaveState>({
        defaultWebSceneId: '',
        defaultWebMapId: '',
        workspaces: [],
        lastSavedMission: '',
        currentWorkspace: '',
        lastSavedPortalItemId: '',
        viewType: '',
    });

    const initialWorkSpaceItemState = {
        lastSaved: '',
        viewType: '',
        missionValue: '',
        viewNameValue: '',
        workspaceId: '',
        portalItemId: '',
        mapView: { extent: '', center: '', scale: 0, zoom: 0 },
        sceneView: { camera: '' },
        gpTaskList: [],
        bookmarks: '',
    };
    const portalClassification = useRef<PortalClassification>(defaultPortalClassificationItem);

    /**
     * Get feature layer and set the FeatureLayer object to save state to.
     */
    useEffect(() => {
        window.addEventListener('beforeunload', alertUserUnsavedState);
        return () => {
            window.removeEventListener('beforeunload', alertUserUnsavedState);
        };
    }, []);

    useEffect(() => {
        if (activeView === 'MAP') {
            if (!isInitialLoad.current) {
                viewType.current = '2D';
            }
            const view = getMapView();
            if (view) {
                setView(view);
            }
        } else {
            if (!isInitialLoad.current) {
                viewType.current = '3D';
            }
            const view = getSceneView();
            if (view) {
                setView(view);
            }
        }
    }, [activeView, sceneView, mapView]);

    useEffect(() => {
        if (!isInitialLoad.current) {
            // reset context for next load views.
            setLayersRemovedFor2dDisplay([]);
            setRenderReplacementObjects([]);
            setLoadedViewPoint(undefined);
            workspaceChanged.current = true;
            saveLoadContext.setIsStateSaved(true);
            currentSavedState.current = true;
            if (saveLoadContext.viewSelect === DEFAULT_VIEW) {
                // load mission default
                setDefaultMissionSceneView(saveLoadContext.missionSelect);
                // logic to updated selected index for the save button if mission
                // manager is the current user only
                if (saveLoadContext.isGroupMgrOrOwner) {
                    saveLoadContext.setSaveButtonSelectIndex(1);
                }
            } else {
                // load selected workspace.
                setWorkspaceSelectedView();
                // logic to updated selected index for the save button if
                // mission manager is the current user only
                if (saveLoadContext.isGroupMgrOrOwner) {
                    saveLoadContext.setSaveButtonSelectIndex(0);
                }
            }
        }
    }, [saveLoadContext.viewSelect]);

    useEffect(() => {
        if (!isInitialLoad.current) {
            setIsAGateMission(false);
            workspaceChanged.current = true;
            saveLoadContext.setIsStateSaved(true);
            //reset context for new load.
            setLayersRemovedFor2dDisplay([]);
            setRenderReplacementObjects([]);
            setLoadedViewPoint(undefined);
            if (selectedMissionObject.current) {
                saveLoadContext.setIsViewLoaded(false);
                if (saveLoadContext.viewSelect !== DEFAULT_VIEW) {
                    saveLoadContext.setViewSelect(DEFAULT_VIEW);
                }
                setDefaultMissionSceneView(saveLoadContext.missionSelect);
                checkMissionForWorkspace();
                updateIfUserGroupOwner(saveLoadContext.missionSelect);
            }
        }
    }, [saveLoadContext.missionSelect]);

    useEffect(() => {
        if (view) {
            saveLoadContext.setIsViewLoaded(false);
            isViewDoneUpdating.current = false;
            watchViewUpdating(view);
        }
        return viewChanged();
    }, [view]);

    useEffect(() => {
        if (selectedObject && selectedObject.value.id) {
            // convert selected object from group or web mapping application to scene info object
            // check if id is of type group
            if (
                selectedObject.value.id === appConfig.defaultWebSceneId ||
                selectedObject.value.id === appConfig.defaultWebMapId
            ) {
                saveLoadContext.setIsGroupMgrOrOwner(false);
            }
            const sceneView = getSceneView();
            if (sceneView) {
                setView(sceneView);
            }
            // check reload or regular load function call to initialize
            // the application with.
            checkReloadOrInitialLoad();
            workspaceChanged.current = true;
        }
    }, [selectedObject]);

    useEffect(() => {
        if (lastSelectedMission) {
            setSessionStorageItem();
        }
    }, [lastSelectedMission]);

    /**
     * Displays snackbar message when all application data updates are completed
     */
    useEffect(() => {
        if (finishedUpdating) {
            enqueueSnackbar('Updated Application Data Successfully', { variant: 'success' });
        }
    }, [finishedUpdating]);

    /**
     * Button click function to return user to landing page if error occurs with map layer or scene layer
     */
    function goToLandingPage() {
        history.push('/');
    }

    /**
     * Handles changes of the view from 3d to 2d and vise versa
     */
    function viewChanged() {
        if (view) {
            const handler = reactiveUtils.when(
                () => !view.updating,
                (valueChanged) => {
                    if (valueChanged === null) {
                        if (view.type === '2d') {
                            enqueueSnackbar('Set view to 3d scene', { variant: 'info' });
                            saveLoadContext.setDisabledViewSelect(false);
                            saveLoadContext.setDisabledMissionSelect(false);
                            setView(getSceneView() as View);
                        } else {
                            enqueueSnackbar('Set view to 2d map', { variant: 'info' });
                            setView(getMapView() as View);
                            saveLoadContext.setDisabledViewSelect(true);
                            saveLoadContext.setDisabledMissionSelect(true);
                        }
                        saveLoadContext.setIsStateSaved(true);
                    } else {
                        saveLoadContext.setIsStateSaved(false);
                        currentSavedState.current = false;
                    }
                }
            );
            return () => {
                handler.remove();
            };
        }
    }

    /**
     * Check if reload has fired. If so then load session storage if newer
     * than incoming props. Else load the props.
     */
    function checkReloadOrInitialLoad() {
        getUserSavedState().then(() => {
            setMissionsInMenu().then(() => {
                setWorkSpaceViewSelectContextValues().then(() => {
                    // if reload check session storage and choose which is newer
                    // session storage or props passed in.
                    const parsedLastSelectedMission = JSON.parse(
                        sessionStorage.getItem('lastSelectedMission') as string
                    );
                    if (parsedLastSelectedMission) {
                        const lastMissionTimestamp = parsedLastSelectedMission.timeStamp as Date;
                        const result = applicationStateHelper.compareDate(
                            lastMissionTimestamp,
                            selectedMissionObject.current.timeStamp
                        );
                        if (result === 1) {
                            // session storage is newer load that
                            LoadSessionStorageObject(parsedLastSelectedMission);
                        } else {
                            // props value is newer load that.
                            loadLandingPageSelection();
                        }
                    } else {
                        loadLandingPageSelection();
                    }
                });
            });
        });
    }

    /**
     * Loads the session item from the browser session storage.
     * @param parsedLastSelectedMission - the json parsed version of the session stored item
     */
    function LoadSessionStorageObject(parsedLastSelectedMission: sessionMissionItem) {
        if (parsedLastSelectedMission.isWorkspace) {
            saveLoadContext.setViewSelect(DEFAULT_WORKSPACE);
        } else {
            if (saveLoadContext.viewSelect !== DEFAULT_VIEW) {
                saveLoadContext.setViewSelect(DEFAULT_VIEW);
            }
        }

        if (parsedLastSelectedMission.viewType === '2D' && activeView === 'SCENE') {
            dispatch(setActiveView('MAP'));
            viewType.current = parsedLastSelectedMission.viewType;
        } else if (parsedLastSelectedMission.viewType === '3D' && activeView === 'MAP') {
            dispatch(setActiveView('SCENE'));
            viewType.current = parsedLastSelectedMission.viewType;
        }
        saveLoadContext.setMissionSelect(parsedLastSelectedMission.title);
        checkMissionForWorkspace();
        checkIfItemIdIsGroup(parsedLastSelectedMission.id).then(async (isItemGroup) => {
            if (isItemGroup) {
                updateGroupToScene(parsedLastSelectedMission.id).then(async (result) => {
                    if (result) {
                        await setClassificationRefs(result);
                        await setClockRefs(result);
                        saveLoadContext.setPortalIdToLoad(result);
                    }
                    isInitialLoad.current = false;
                });
            } else {
                await setClassificationRefs(parsedLastSelectedMission.id);
                await setClockRefs(parsedLastSelectedMission.id);
                saveLoadContext.setPortalIdToLoad(parsedLastSelectedMission.id);
            }
            isInitialLoad.current = false;
        });
        updateIfUserGroupOwner(parsedLastSelectedMission.title);
        updateIfGateMission(parsedLastSelectedMission.id);
    }

    /**
     * Handles the loading of the item selected from landing page.
     */
    async function loadLandingPageSelection(): Promise<void> {
        if (selectedMissionObject?.current?.value) {
            saveLoadContext.setIsViewLoaded(false);
            isViewDoneUpdating.current = false;
            if (viewType.current === '2D') {
                dispatch(setActiveView('MAP'));
            } else {
                dispatch(setActiveView('SCENE'));
            }
            if (!selectedMissionObject.current.value.workspaceId) {
                const selectedValue = selectedMissionObject.current.value as IItem;
                if (selectedValue.title === DEFAULT_MISSION) {
                    // it is appDefault
                    const selectedValue = selectedMissionObject.current.value as IItem;
                    dispatch(
                        setExistingClocksList(
                            selectedMissionObject.current.value.opsClocks
                                ? selectedMissionObject.current.value.opsClocks
                                : []
                        )
                    );
                    saveLoadContext.setViewSelect(DEFAULT_VIEW);
                    saveLoadContext.setMissionSelect(DEFAULT_MISSION);
                    updateGroupToScene(selectedValue.id).then((result) => {
                        if (result) {
                            saveLoadContext.setPortalIdToLoad(result);
                        }
                    });
                } else {
                    // is mission
                    if (saveLoadContext.viewSelect !== DEFAULT_VIEW) {
                        saveLoadContext.setViewSelect(DEFAULT_VIEW);
                    }
                    saveLoadContext.setMissionSelect(selectedValue.title);
                    loadDefaultMapForMission(selectedValue);
                    updateIfUserGroupOwner(selectedValue.title);
                    updateIfGateMission(selectedValue.id);
                    dispatch(
                        setExistingClocksList(
                            selectedMissionObject.current.value.opsClocks
                                ? selectedMissionObject.current.value.opsClocks
                                : []
                        )
                    );
                }
                checkMissionForWorkspace();
                updateLastSelectedMission(selectedValue);
            } else {
                // is workspace
                setWorkSpaceViewSelectContextValues().then(async () => {
                    const selectedValue = selectedMissionObject.current.value as WorkSpaceItem;
                    console.debug('Selected item is workspace');
                    saveLoadContext.setViewSelect(DEFAULT_WORKSPACE);
                    if (saveLoadContext.missionSelect !== selectedValue.missionValue) {
                        saveLoadContext.setMissionSelect(selectedValue.missionValue);
                    }
                    updateLastSelectedMission(selectedValue);
                    await setClassificationRefs(selectedValue.portalItemId);
                    await setClockRefs(selectedValue.portalItemId);
                    dispatch(setExistingClocksList(selectedValue.opsClocks));
                    saveLoadContext.setPortalIdToLoad(selectedValue.portalItemId);
                });
            }
        }
    }

    async function updateIfGateMission(missionId: string) {
        const result = await isGateMission(missionId);
        if (result) {
            setIsAGateMission(true);
            saveLoadContext.setSaveButtonSelectIndex(1);
        } else {
            setIsAGateMission(false);
        }
    }

    /**
     * sets the state of the isGroupMgrOrOwner to true if they are a manager or owner of that mission group.
     * @param missionTitle group title to check for owner or admin
     */
    function updateIfUserGroupOwner(missionTitle: string) {
        if (missionTitle !== DEFAULT_MISSION) {
            findPortalGroupByTitle(missionTitle).then((result) => {
                if (result.item[0]) {
                    getPortalGroupUsers(result.item[0].id).then((result) => {
                        const mgrName = result.admins.find((managerName) => managerName === portalUser.username);
                        if (mgrName || result.owner === portalUser.username) {
                            saveLoadContext.setIsGroupMgrOrOwner(true);
                        } else {
                            saveLoadContext.setIsGroupMgrOrOwner(false);
                        }
                    });
                } else {
                    saveLoadContext.setIsGroupMgrOrOwner(false);
                }
            });
        } else {
            saveLoadContext.setIsGroupMgrOrOwner(false);
        }
    }

    /**
     * Updates the last selected mission with the value selected by the user.
     * @param selectedValue
     */
    async function updateLastSelectedMission(selectedValue: __esri.PortalGroup | IItem | WorkSpaceItem) {
        let valueToUse: sessionMissionItem;
        let viewTypeValue: '2D' | '3D' = '3D';
        if (viewType.current) {
            viewTypeValue = viewType.current;
        }
        if (selectedValue.workspaceId !== undefined) {
            selectedValue = selectedValue as WorkSpaceItem;
            valueToUse = {
                id: selectedValue.portalItemId,
                title: selectedValue.missionValue,
                isWorkspace: true,
                timeStamp: new Date(),
                viewType: viewTypeValue,
            };
        } else {
            selectedValue = selectedValue as IItem;

            valueToUse = {
                id: selectedValue.id,
                title: selectedValue.title,
                isWorkspace: false,
                timeStamp: new Date(),
                viewType: viewTypeValue,
            };
        }
        setLastSelectedMission(valueToUse);
        if (isInitialLoad.current) {
            // first time loading set session storage with value that has been already populated.
            sessionStorage.setItem('lastSelectedMission', JSON.stringify(valueToUse));
        }
    }

    /**
     * Sets Session Storage value in case of refresh or reload of workspace.
     */
    function setSessionStorageItem() {
        // if back is pressed and new mission selected then not loaded.
        const sessionLastSelectedMission = JSON.parse(sessionStorage.getItem('lastSelectedMission') as string);
        let sessionTimeStamp: Date;
        if (sessionLastSelectedMission && selectedMissionObject.current) {
            sessionTimeStamp = sessionLastSelectedMission?.timeStamp;
            let selectedValue = selectedMissionObject.current.value;
            const selectedTimeStamp = selectedMissionObject.current.timeStamp;
            if (String(window.performance.getEntriesByType('navigation')[0].type) === 'reload') {
                // in a reload state
                const processedReload = window.performance.getEntriesByName('reloaded');
                if (processedReload?.length === 0) {
                    window.performance.mark('reloaded');
                    if (
                        lastSelectedMission !== undefined &&
                        lastSelectedMission?.id !== sessionLastSelectedMission.id
                    ) {
                        sessionStorage.setItem('lastSelectedMission', JSON.stringify(lastSelectedMission));
                    }
                    const sessionIsNewer = ApplicationStateHelper.compareDate(sessionTimeStamp, selectedTimeStamp);
                    if (sessionIsNewer === 1) {
                        // Session Time stamp is newer
                        console.debug('session time stamp is newer');
                        if (viewType.current) {
                            selectedMissionObject.current.viewType = viewType.current;
                        }
                        if (sessionLastSelectedMission?.isWorkspace) {
                            selectedValue = selectedValue as WorkSpaceItem;
                            if (sessionLastSelectedMission?.id !== selectedValue.portalItemId) {
                                // last selection was workspace
                                selectedMissionObject.current.value.id = sessionLastSelectedMission.id;
                                selectedMissionObject.current.value.portalItemId = sessionLastSelectedMission.id;
                                selectedMissionObject.current.value.title = sessionLastSelectedMission.title;
                                selectedMissionObject.current.value.workspaceId = true;
                            }
                        } else if (sessionLastSelectedMission?.value?.id !== selectedValue.portalItemId) {
                            // last selection was mission
                            selectedMissionObject.current.value.id = sessionLastSelectedMission.id;
                            selectedMissionObject.current.value.title = sessionLastSelectedMission.title;
                            selectedMissionObject.current.value.workspaceId = false;
                        }
                        sessionStorage.setItem('lastSelectedMission', JSON.stringify(selectedMissionObject.current));
                    } else {
                        console.debug('selected time stamp is newer');
                    }
                } else {
                    if (
                        lastSelectedMission !== undefined &&
                        lastSelectedMission?.id !== sessionLastSelectedMission?.id
                    ) {
                        sessionStorage.setItem('lastSelectedMission', JSON.stringify(lastSelectedMission));
                    }
                }
            } else {
                if (lastSelectedMission !== undefined && lastSelectedMission.id !== sessionLastSelectedMission?.id) {
                    sessionStorage.setItem('lastSelectedMission', JSON.stringify(lastSelectedMission));
                }
            }
        }
    }

    /**
     * Send Snackbar Messages when finished initial loading.
     * Update any UI pieces that need to be enabled
     */
    function loadingFinishedDisplayResults(view: View) {
        // Check when view is done loading to fix save button enabling to early
        // Once scene or map is fully loaded then send update messages.
        reactiveUtils
            .whenOnce(() => !view.updating)
            .then(() => {
                saveLoadContext.setIsViewLoaded(true);
                isViewDoneUpdating.current = true;
                if (!saveLoadContext.isStateSaved) {
                    saveLoadContext.setIsStateSaved(true);
                }
                updateUiAfterLoadingState();
            });
    }

    /**
     * enable the selects for mission and view at the end of loading
     */
    function updateUiAfterLoadingState(): void {
        if (selectedMissionObject.current.value?.workspaceId) {
            // set history to have theSelectedWorkspace = '';
            enqueueSnackbar('Loaded Successfully', { variant: 'success' });
        } else if (selectedMissionObject.current.value.title === DEFAULT_MISSION) {
            // set history to have theSelectedWorkspace = '';
            enqueueSnackbar('Loaded Default Scene Successfully', { variant: 'success' });
        } else {
            enqueueSnackbar('Loaded Successfully', { variant: 'success' });
        }
    }

    /**
     * Watch the view to update
     * @param view
     */
    function watchViewUpdating(view: View) {
        // This will fire events when the view's data can be queried but is not
        // fully loaded yet.
        if (view) {
            reactiveUtils
                .whenOnce(() => view.ready)
                .then(() => {
                    // send update to context here
                    console.debug('ViewChanged done updating', false);
                    saveLoadContext.setIsViewLoaded(true);
                    // set value here for initial load completed
                    if (isInitialLoad.current) {
                        isInitialLoad.current = false;
                    }
                    if (workspaceChanged.current) {
                        loadingFinishedDisplayResults(view);
                        workspaceChanged.current = false;
                    }
                });
        }
    }

    /**
     * Load workspace from portal item id.
     * @param portalItemId
     */
    async function loadWorkSpaceView(portalItemId: string) {
        const sceneView = await getSceneView();
        const mapView = await getMapView();
        if (sceneView || mapView) {
            saveLoadContext.setPortalIdToLoad(portalItemId);
        } else {
            console.debug('View was undefined.');
        }
    }

    async function setClassificationRefs(portalItemId: string): Promise<void> {
        // check for classification here
        const item = await findPortalItemById(portalItemId);
        if (item) {
            workspaceLayerId.current = item.id;
        }
    }

    async function setClockRefs(portalItemId: string): Promise<void> {
        // check for clocks here
        const item = await findPortalItemById(portalItemId);
        if (item) {
            workspaceLayerId.current = item.id;
            await loadLandingPageSelection();
        }
    }

    /**
     * Sets the Workspace Selected View
     */
    async function setWorkspaceSelectedView() {
        // check if view has workspace view already loaded from saving if so do nothing
        const viewSelectValue = selectedMissionObject.current.value.portalItemId;
        if (iUserSaveObjectJson.current.workspaces) {
            // Get workspace object to load.
            let workspaceToLoad = iUserSaveObjectJson.current.workspaces.filter(
                (workspace) => workspace.portalItemId === viewSelectValue
            );
            if (!selectedMissionObject.current.value.workspaceId) {
                workspaceToLoad = checkMissionForWorkspace();
            }
            const currentView = activeView === 'SCENE' ? await getSceneView() : await getMapView();
            if (currentView && workspaceToLoad.length > 0) {
                saveLoadContext.setIsViewLoaded(false);
                isViewDoneUpdating.current = false;
                const mapId = (currentView.map as any).portalItem?.id;
                if (saveLoadContext.viewSelect === DEFAULT_WORKSPACE) {
                    if (workspaceToLoad[0].portalItemId === mapId) {
                        enqueueSnackbar('current workspace is loaded.', { variant: 'info' });
                    } else {
                        await setClassificationRefs(workspaceToLoad[0].portalItemId);
                        await loadWorkSpaceView(workspaceToLoad[0].portalItemId);
                        dispatch(setExistingClocksList(workspaceToLoad[0].opsClocks));
                        enqueueSnackbar('Loading workspace view.', { variant: 'info' });
                    }
                    const parsedLastSelectedMission = JSON.parse(
                        sessionStorage.getItem('lastSelectedMission') as string
                    );
                    if (workspaceToLoad[0].portalItemId !== parsedLastSelectedMission?.id) {
                        await setClassificationRefs(workspaceToLoad[0].portalItemId);
                        dispatch(setExistingClocksList(workspaceToLoad[0].opsClocks));
                        await updateLastSelectedMission(workspaceToLoad[0]);
                        selectedMissionObject.current.value.id = workspaceToLoad[0].portalItemId;
                        selectedMissionObject.current.value.portalItemId = workspaceToLoad[0].portalItemId;
                        selectedMissionObject.current.value.title = workspaceToLoad[0].missionValue;
                        selectedMissionObject.current.value.workspaceId = true;
                    }
                }
            } else {
                saveLoadContext.setViewSelect(DEFAULT_VIEW);
                enqueueSnackbar('No saved workspace view for this mission.', { variant: 'info' });
                workspaceChanged.current = false;
                saveLoadContext.setIsStateSaved(false);
            }
            // do not allow saving of workspace unless mission is selected
            if (saveLoadContext.missionSelect === '') {
                saveLoadContext.setIsStateSaved(true);
            }
            if (workspaceToLoad.length > 0) {
                if (saveLoadContext.missionSelect !== workspaceToLoad[0].missionValue) {
                    saveLoadContext.setMissionSelect(workspaceToLoad[0].missionValue);
                }
            }
        } else {
            // if workspace view does not exist for selected missions then send snack bar user does not yet have workspace.
            saveLoadContext.setDisabledViewSelect(true);
            if (saveLoadContext.viewSelect !== DEFAULT_VIEW) {
                saveLoadContext.setViewSelect(DEFAULT_VIEW);
            }
            enqueueSnackbar('There are no saved workspaces.', { variant: 'info' });
            workspaceChanged.current = false;
        }
    }

    /**
     * Loads Default map for mission passed in.
     * @param missionToLoad
     */
    async function loadDefaultMapForMission(missionToLoad: any): Promise<void> {
        let defaultWebSceneId = undefined;
        if (missionToLoad.title !== DEFAULT_MISSION) {
            defaultWebSceneId = await getDefaultMissionMap(missionToLoad?.id);
        }
        if (!defaultWebSceneId) {
            // defaultWebSceneId = missionToLoad.id;
            if (missionToLoad.title === DEFAULT_MISSION) {
                defaultWebSceneId = missionToLoad.id;
            } else {
                enqueueSnackbar('Default Mission Map is missing or was deleted.', {
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
                });
                return;
            }
        }
        const missionMetaData = await getWebAppAndData(missionToLoad.id);
        //IMMAD_Default is implemented without a group only a scene. See setMissionsInMenu()
        //hence there is no immadVersion association
        if (missionMetaData && missionMetaData.immadVersion !== appConfig.immadVersion) {
            enqueueSnackbar(
                'The version of this IMMAD Mission does not match the current version. Edit and save the Mission to update it to the latest.',
                { variant: 'warning' }
            );
        }
        await setClassificationRefs(defaultWebSceneId);
        dispatch(setExistingClocksList(missionMetaData?.opsClocks ?? []));
        const view = await getSceneView();
        if (view !== undefined) {
            if (defaultWebSceneId) {
                if (saveLoadContext.portalIdToLoad !== defaultWebSceneId) {
                    saveLoadContext.setPortalIdToLoad(defaultWebSceneId);
                    console.debug('Loaded default mission for ' + missionToLoad?.title);
                } else {
                    console.debug('Default mission for ' + missionToLoad.title + ' already loaded, do nothing.');
                }
            } else {
                console.debug('No Default Mission Selected to load.');
            }
        } else {
            saveLoadContext.setPortalIdToLoad(defaultWebSceneId);
        }
    }

    /**
     * Sets the Mission Select Value
     * @param missionSelect
     */
    async function setDefaultMissionSceneView(missionSelect: string): Promise<void> {
        if (filteredMissions.current) {
            if (viewType.current === '2D') {
                dispatch(setActiveView('MAP'));
            } else {
                dispatch(setActiveView('SCENE'));
            }
            saveLoadContext.setIsViewLoaded(false);
            isViewDoneUpdating.current = false;
            const missionsToLoad = filteredMissions.current.filter((mission) => mission.title === missionSelect);
            await loadDefaultMapForMission(missionsToLoad[0]);
            updateIfUserGroupOwner(saveLoadContext.missionSelect);
            updateIfGateMission(missionsToLoad[0].id);
            const missionToLoad = missionsToLoad[0];
            if (!missionToLoad) {
                return;
            }
            const lastSelectedMission = JSON.parse(sessionStorage.getItem('lastSelectedMission') as string);
            if (lastSelectedMission?.isWorkspace || missionToLoad?.id !== lastSelectedMission?.id) {
                //Update since last was a workspace and this is mission setting.
                updateLastSelectedMission(missionToLoad);
                selectedMissionObject.current.value.id = missionToLoad.id;
                selectedMissionObject.current.value.portalItemId = missionToLoad.id;
                selectedMissionObject.current.value.title = missionToLoad.title;
                selectedMissionObject.current.value.workspaceId = false;
            }
            console.debug('Loaded default map for mission.');
        } else {
            console.error('Error view is undefined can not set new mission selected.');
        }
    }

    /**
     * Populate mission drop down in menubar
     */
    async function setMissionsInMenu() {
        return getMissionsForUser(props.portalUser, appConfig.tags.mission).then((results) => {
            filteredMissions.current = results.sort((portalGroupA: PortalGroup, portalGroupB: PortalGroup) =>
                portalGroupA.title.localeCompare(portalGroupB.title)
            );
            // add default mission here to the front of filtered missions.
            filteredMissions.current.unshift({
                title: 'IMMAD Default',
                id: appConfig.defaultWebSceneId,
            } as PortalGroup);
            missionMenuItems.current = [];
            for (let i = 0; i < filteredMissions.current.length; i++) {
                missionMenuItems.current.push(
                    <MenuItem key={filteredMissions.current[i].id} value={filteredMissions.current[i].title}>
                        {filteredMissions.current[i].title}
                    </MenuItem>
                );
            }
            if (missionMenuItems.current.length >= 0) {
                saveLoadContext.setMissionValues(missionMenuItems.current);
                console.debug('Missions select values set.');
            }
        });
    }

    /**
     * Checks if the current mission has a workspace associated with it.
     */
    function checkMissionForWorkspace() {
        let workspacesForMission: WorkSpaceItem[] = [];
        if (iUserSaveObjectJson.current.workspaces) {
            workspacesForMission = iUserSaveObjectJson.current.workspaces.filter(
                (workspace) => workspace.workspaceId === saveLoadContext.missionSelect + '_' + DEFAULT_WORKSPACE
            );
        }
        return workspacesForMission;
    }

    /**
     * Sets the Workspace View Select context values.
     */
    async function setWorkSpaceViewSelectContextValues() {
        workSpaces.current = [];
        if (saveLoadContext.workspaceValues.length === 1) {
            workSpaces.current = saveLoadContext.workspaceValues;
        } else {
            workSpaces.current.push(
                <MenuItem key={DEFAULT_VIEW} value={DEFAULT_VIEW}>
                    Default
                </MenuItem>
            );
        }
        workSpaces.current.push(
            <MenuItem key={DEFAULT_WORKSPACE} value={DEFAULT_WORKSPACE}>
                Workspace
            </MenuItem>
        );
        saveLoadContext.setWorkspaceValues(workSpaces.current);
        if (saveLoadContext.viewSelect !== (workSpaces.current[0].key as string)) {
            saveLoadContext.setViewSelect(workSpaces.current[0].key as string);
        }
        console.debug('Workspaces set');
    }

    /**
     * Sends alert to the user that they have unsaved state
     * before they navigate away from the page.
     * @param event
     */
    function alertUserUnsavedState(event: any) {
        event.preventDefault();
        // added logic to handle download links for automatic downloads when
        // gp tools complete.
        if (event.target.links.length > 0) {
            let isFileDownload = false;
            for (let i = 0; i < event.target.links.length; i++) {
                const link = event.target.links[i];
                if (link.title === 'file') {
                    isFileDownload = true;
                }
            }
            if (isFileDownload) {
                // do nothing download file starting
                return;
            } else {
                if (!currentSavedState.current) {
                    event.returnValue = false;
                }
            }
        } else {
            if (!currentSavedState.current) {
                event.returnValue = false;
            }
        }
    }

    /**
     * Gate save workflow - preps data and checks if workspace for saving gate missions
     * @param value Number is the selected item from the save button
     */
    async function runGateWorkflow(value: number) {
        // check if owner here
        // The user is not owner warn user to transfer ownership.
        // If owner save as normal
        let portalItemId = '';
        if (selectedMissionObject.current.value.id) {
            portalItemId = selectedMissionObject.current.value.id;
        }
        let missionMapId = undefined;
        if (selectedMissionObject.current.value.title !== DEFAULT_MISSION) {
            missionMapId = await getDefaultMissionMap(portalItemId);
        }
        if (!missionMapId) {
            missionMapId = portalItemId;
        }
        findPortalItemById(missionMapId).then(async (result) => {
            if (result) {
                if (value !== 1) {
                    enqueueSnackbar('Can not save workspaces for Gate Missions. Must save default only.', {
                        variant: 'warning',
                    });
                    setOpenNameDialog(false);
                    return;
                } else {
                    selectedSaveIndex.current = 1;
                    setOpenNameDialog(true);
                    return;
                }
            } else {
                enqueueSnackbar('Unable to find Gate Map to save to. See log for more details', {
                    variant: 'warning',
                });
                if (result != undefined) {
                    console.error(result);
                } else {
                    console.error('Undefined was returned from find portal item by id.');
                }
            }
        });
    }

    /**
     * When save button is clicked the index of the current state will
     * be passed to make the dialog title correct based on the save type.
     * @param value Number is the selected item from the save button
     */
    async function handleOnSaveClick(value: number) {
        if (isAGateMission) {
            await updateMissionDefaultOpsClocks(opsClocks);
            runGateWorkflow(value);
        } else {
            selectedSaveIndex.current = value;
            setOpenNameDialog(true);
        }
    }

    /**
     * Handles changes to save classification dialog when it closes
     */
    function handleDialogCancel() {
        setOpenNameDialog(false);
    }

    /**
     * Runs the On Save Clicked Logic
     */
    async function handleSaveDialogClose() {
        setOpenNameDialog(false);
        portalClassification.current.classifiedBy = props.portalUser.username;
        portalClassification.current.classificationDate = new Date().toISOString().slice(0, 10); // get format as yyyy-mm-dd

        if (selectedSaveIndex.current === 0) {
            // save as workspace
            saveAsWorkspace();
        } else {
            // save to mission default
            saveToMissionDefaultScene();
        }
    }

    /**
     * Save current view to workspace returns void
     */
    async function saveAsWorkspace() {
        if (!currentSavedState.current) {
            saveLoadContext.setIsStateSaved((prevState: boolean) => !prevState);
            currentSavedState.current = true;
            saveLoadContext.setIsStateSaved(true);
            await updateSavedSandboxView();
            await updateIUserSaveObjectJson();
            saveLoadContext.setPortalIdToLoad(iUserSaveObjectJson.current.lastSavedPortalItemId);
            if (userSaveExists) {
                const result = await applicationStateHelper.updateSavedUserFeature(
                    props.portalUser.username,
                    iUserSaveObjectJson.current
                );

                if (result.success) {
                    saveLoadContext.setViewSelect(DEFAULT_WORKSPACE);
                    enqueueSnackbar(result.message, { variant: 'success' });
                } else {
                    enqueueSnackbar(result.message, { variant: 'error' });
                }
            } else {
                // no save exists call create save
                const result = await ApplicationStateHelper.createSavedUserFeature(iUserSaveObjectJson.current);
                if (result === 'true') {
                    setUserSaveExists(true);
                    saveLoadContext.setViewSelect(DEFAULT_WORKSPACE);
                    enqueueSnackbar('Save complete.', { variant: 'success' });
                    // added to make sure classification and manual classification is properly set on workspace
                    await applicationStateHelper.updateSavedUserFeature(
                        props.portalUser.username,
                        iUserSaveObjectJson.current
                    );
                    setFinishedUpdating(false);
                } else {
                    enqueueSnackbar(result, { variant: 'error' });
                }
            }
            if (saveLoadContext.viewSelect !== DEFAULT_WORKSPACE) {
                saveLoadContext.setViewSelect(DEFAULT_WORKSPACE);
            }
        }
    }

    /**
     * Save Current View to Mission Default Scene returns void
     */
    async function saveToMissionDefaultScene() {
        saveLoadContext.setIsStateSaved((prevState: boolean) => !prevState);
        currentSavedState.current = true;

        // this function will now have to update the application part of the mission
        // to hold any manual classification items that can be reloaded later.
        await updateMissionDefaultManualClassifications();
        await updateMissionDefaultOpsClocks(opsClocks);

        let portalIdToSaveAs = saveLoadContext.portalIdToLoad;
        if (saveLoadContext.viewSelect === DEFAULT_WORKSPACE) {
            // Handle save workspace as default mission map
            const result = await findPortalGroupByTitle(saveLoadContext.missionSelect);
            if (result) {
                const missionMapItemId = await getDefaultMissionMap(result.item[0].id);
                if (missionMapItemId) {
                    portalIdToSaveAs = missionMapItemId;
                }
            }
        }
        if (map?.portalItem?.type === 'Web Scene') {
            let sceneView = view as SceneView;
            const sceneViewLightingType = sceneView?.environment?.lighting?.type;
            if (sceneViewLightingType === 'virtual') {
                sceneView = await setViewLightingToSun(sceneView);
            }
            applicationStateHelper.saveWebScene(portalIdToSaveAs, sceneView).then(async (resultValue) => {
                // update portal item here with resultValue.id
                if (resultValue) {
                    iUserSaveObjectJson.current.lastSavedPortalItemId = resultValue.id;
                    setUserSaveExists(true);
                    saveLoadContext.setViewSelect(DEFAULT_VIEW);
                    saveLoadContext.setPortalIdToLoad(resultValue.id);
                    if (sceneViewLightingType === 'virtual') {
                        await setViewLightingToVirtual(sceneView);
                    }
                    enqueueSnackbar('Save complete.', { variant: 'success' });
                    setFinishedUpdating(false);
                } else {
                    enqueueSnackbar(resultValue, { variant: 'error' });
                }
            });
        } else {
            // a true webmap GATE 2d or other
            applicationStateHelper.saveWebMap(portalIdToSaveAs, view as MapView).then((resultValue) => {
                if (resultValue.id) {
                    iUserSaveObjectJson.current.lastSavedPortalItemId = resultValue.id;
                    setUserSaveExists(true);
                    saveLoadContext.setViewSelect(DEFAULT_VIEW);
                    saveLoadContext.setPortalIdToLoad(resultValue.id);
                    enqueueSnackbar('Save complete.', { variant: 'success' });
                    setFinishedUpdating(false);
                } else {
                    enqueueSnackbar(resultValue, { variant: 'error' });
                }
            });
        }
    }

    async function setViewLightingToSun(view: SceneView): Promise<SceneView> {
        const mapDate = getMidDayAtLongitude(view.camera.position.longitude);
        view.environment.lighting = {
            type: 'sun',
            directShadowsEnabled: false,
            //set daylight to follow viewpoint
            cameraTrackingEnabled: true,
            date: mapDate,
        } as SunLighting;

        return view;
    }

    async function setViewLightingToVirtual(view: SceneView): Promise<SceneView> {
        view.environment.lighting = {
            type: 'virtual',
            directShadowsEnabled: false,
        } as VirtualLighting;
        return view;
    }

    /**
     * Saves the web map or web scene workspace to the users content and
     * updates the iUserSaveObjectJson with the portalId for that item.
     */
    async function updateSavedSandboxView() {
        // get workspace name from user pre-populate it with mission_workspace
        const workspaceName = saveLoadContext.missionSelect + '_' + DEFAULT_WORKSPACE;
        const existingWorkspaceItem = checkMissionForWorkspace();
        iUserSaveObjectJson.current.currentWorkspace = workspaceName;
        //Check for workspace id if one exists save to that if not call function to make new save.
        if (map?.portalItem?.type === 'Web Map') {
            if (iUserSaveObjectJson.current.lastSavedPortalItemId === map?.portalItem?.id) {
                // if sandBoxWebMapId exists update it with current webmap
                const resultValue = await applicationStateHelper.saveWebMap(
                    iUserSaveObjectJson.current.lastSavedPortalItemId,
                    view as MapView
                );
                iUserSaveObjectJson.current.lastSavedPortalItemId = resultValue.id;
            } else {
                // else create new workspace webmap and update sandBoxWebMapId
                const value = await applicationStateHelper.saveAsWebMap(workspaceName, view as MapView);
                if (value) {
                    iUserSaveObjectJson.current.lastSavedPortalItemId = value.id;
                } else {
                    const message = 'Error occurred saving as webMap see log for details';
                    console.error(message);
                    enqueueSnackbar(message, { variant: 'error' });
                }
            }
        } else {
            if (existingWorkspaceItem.length === 0) {
                //create new workspace scene and update sandBoxWebSceneId
                let sceneView = view as SceneView;
                const sceneViewLightingType = sceneView?.environment?.lighting?.type;
                if (sceneViewLightingType === 'virtual') {
                    sceneView = await setViewLightingToSun(sceneView);
                }
                const value = await applicationStateHelper.saveAsWebScene(workspaceName, sceneView);
                if (value) {
                    // update portal item here with resultValue.id
                    iUserSaveObjectJson.current.lastSavedPortalItemId = value.id;
                    if (sceneViewLightingType === 'virtual') {
                        await setViewLightingToVirtual(sceneView);
                    }
                } else {
                    const message = 'Error occurred saving as webScene see log for details';
                    console.error(message);
                    enqueueSnackbar(message, { variant: 'error' });
                }
            } else {
                // sandBoxWebSceneId exists update it with current scene
                let sceneView = view as SceneView;
                const sceneViewLightingType = sceneView?.environment?.lighting?.type;
                if (sceneViewLightingType === 'virtual') {
                    sceneView = await setViewLightingToSun(sceneView);
                }
                const resultValue = await applicationStateHelper.saveWebScene(
                    existingWorkspaceItem[0].portalItemId,
                    sceneView
                );
                // update portal item here with resultValue.id
                iUserSaveObjectJson.current.lastSavedPortalItemId = resultValue ? resultValue.id : '';
                if (sceneViewLightingType === 'virtual') {
                    await setViewLightingToVirtual(sceneView);
                }
            }
        }
    }

    /**
     * Updates the Mission Web App Data and provides UI notification messages on success or error.
     * @param webAppId The web app ID for the Mission.
     * @param data The data (JSON) containing the updated Mission Data.
     * @return True if the data was successfully updated, otherwise False.
     */
    const updateMissionAppData = async (webAppId: string, data: any): Promise<boolean> => {
        try {
            const result: IUpdateItemResponse = await updatePortalWebApp(webAppId, JSON.stringify(data));

            if (result.success) {
                //sets marker to display snackbar success message
                setFinishedUpdating(true);
                return true;
            } else {
                // log error and send up snackbar error
                console.error('Error occurred updating Application Data.');
                console.error(result);
            }
        } catch (e) {
            console.error(e.message);
        }

        enqueueSnackbar('Error occurred updating Application Data. See console logs for more details.', {
            variant: 'error',
        });

        return false;
    };

    const updateMissionDefaultManualClassifications = async () => {
        const manualClassifications = getManualClassifications();
        // here we need to take the missionDefaultManualClassifications and add them to the mission application data object.
        const missionId = await getMissionIdByTitle(saveLoadContext.missionSelect);
        // getPortalItemDataById() ArcGISPortalItemsHelper.ts in lib functions
        if (missionId) {
            const groupContent = await getGroupContentByGroupId(missionId);
            const webApps = groupContent.filter((content) => content.type === 'Application');
            if (webApps && webApps.length > 0) {
                const webAppId: string = webApps[0].id;
                const data = await getWebAppAndData(missionId);
                // add manual classification to the data object
                data.defaultManualClassification = manualClassifications.map((item) => item);
                await updateMissionAppData(webAppId, data);
            }
        }

        if (saveLoadContext.viewSelect !== DEFAULT_VIEW) {
            await updateIUserSaveObjectJson();
        }
        if (!currentSavedState.current) {
            await applicationStateHelper.updateSavedUserFeature(props.portalUser.username, iUserSaveObjectJson.current);
        }
    };

    /**
     * Saves the ops clocks to the mission default
     * @param clocks the new clocks to be added to the mission default
     */
    const updateMissionDefaultOpsClocks = async (clocks: OpsClockDataSerializable[]) => {
        // here we need to take the missionDefaultClocks and add them to the mission application data object.
        const missionId = await getMissionIdByTitle(saveLoadContext.missionSelect);
        // getPortalItemDataById() ArcGISPortalItemsHelper.ts in lib functions
        if (missionId) {
            const groupContent = await getGroupContentByGroupId(missionId);
            const webApps = groupContent.filter((content) => content.type === 'Application');
            if (webApps && webApps.length > 0) {
                const webAppId: string = webApps[0].id;
                const data = await getWebAppAndData(missionId);
                // add clocks to the data object
                data.opsClocks = clocks;
                dispatch(setExistingClocksList(clocks));
                await updateMissionAppData(webAppId, data);
            }
        }

        //TODO: Investigate. Is this for saving the default state or is this for workspaces?
        if (saveLoadContext.viewSelect !== DEFAULT_VIEW) {
            await updateIUserSaveObjectJson();
        }
        if (!currentSavedState.current) {
            await applicationStateHelper.updateSavedUserFeature(props.portalUser.username, iUserSaveObjectJson.current);
        }
    };

    /**
     * Gets the currently saved state Json object from feature service containing it.
     */
    async function getUserSavedState() {
        await applicationStateHelper.getUserSavedState(props.portalUser).then((returnValue) => {
            if (returnValue) {
                iUserSaveObjectJson.current = returnValue;
                setUserSaveExists(true);
                console.debug('Loaded User Save Object');
            } else {
                setUserSaveExists(false);
                console.debug('No current saved state');
                iUserSaveObjectJson.current.defaultWebMapId = appConfig.defaultWebMapId;
                iUserSaveObjectJson.current.defaultWebSceneId = appConfig.defaultWebSceneId;
            }
        });
    }

    /**
     * Update the iUserSaveObjectJson with current settings.
     */
    async function updateIUserSaveObjectJson(): Promise<void> {
        let workSpaceItemID = '';
        if (iUserSaveObjectJson.current.currentWorkspace) {
            workSpaceItemID = iUserSaveObjectJson.current.currentWorkspace;
        } else workSpaceItemID = saveLoadContext.missionSelect + '_' + DEFAULT_WORKSPACE; // for future workspace use  saveLoadContext.viewSelect;

        if (iUserSaveObjectJson.current.workspaces) {
            const workspaceItem = iUserSaveObjectJson.current.workspaces.find(
                (workspaceItem) => workspaceItem.workspaceId === workSpaceItemID
            );
            // if workspace item exists pre-populate with existing then update.
            if (workspaceItem) {
                workSpaceItem.current = workspaceItem;
            } else {
                workSpaceItem.current = initialWorkSpaceItemState;
            }
            if (view) {
                // workSpaceItem.current.viewType = view.type;
                if (view.type === '2d') {
                    const mapView = view as MapView;
                    workSpaceItem.current.mapView = {
                        extent: mapView.extent.toJSON(),
                        zoom: mapView.zoom,
                        center: mapView.center.toJSON(),
                        scale: mapView.scale,
                        viewpoint: mapView.viewpoint.toJSON(),
                    };
                    workSpaceItem.current.viewType = '2d';
                    iUserSaveObjectJson.current.viewType = '2d';
                } else {
                    const sceneView = view as SceneView;
                    workSpaceItem.current.sceneView.camera = sceneView.camera.toJSON();
                    iUserSaveObjectJson.current.viewType = '3d';
                    workSpaceItem.current.viewType = '3d';
                }
                workSpaceItem.current.lastSaved = new Date().toUTCString(); //setting zulu time
                workSpaceItem.current.missionValue = saveLoadContext.missionSelect;
                workSpaceItem.current.viewNameValue = saveLoadContext.viewSelect;
                workSpaceItem.current.workspaceId = workSpaceItemID;
                workSpaceItem.current.portalItemId = iUserSaveObjectJson.current.lastSavedPortalItemId;
                workSpaceItem.current.manualClassifications = getManualClassifications();
                workSpaceItem.current.opsClocks = opsClocks;
                iUserSaveObjectJson.current.lastSavedMission = saveLoadContext.missionSelect;
                iUserSaveObjectJson.current.currentWorkspace = workSpaceItemID;
                if (iUserSaveObjectJson.current.workspaces.length <= 0) {
                    iUserSaveObjectJson.current.workspaces.push(workSpaceItem.current);
                } else if (!workspaceItem) {
                    iUserSaveObjectJson.current.workspaces.push(workSpaceItem.current);
                }
            }
        } else {
            iUserSaveObjectJson.current.workspaces = [];
        }
    }

    /**
     * Retrieves the manual classifications for the Classification context
     */
    const getManualClassifications = (): ManualClassificationInfo[] => {
        return classificationItems
            .filter((item) => item.manualClassification)
            .map((item) => {
                return {
                    layerId: item.id,
                    licenseInfo: item.manualClassification,
                } as unknown as ManualClassificationInfo;
            });
    };

    return (
        <>
            <SaveState
                onClickHandler={handleOnSaveClick}
                disabled={saveLoadContext.isStateSaved}
                buttonOptions={saveButtonOptions}
                selectedIndex={saveLoadContext.saveButtonSelectIndex}
            />
            {openNameDialog ? (
                <SaveWorkspaceNameDialog
                    handleClose={handleSaveDialogClose}
                    handleCancel={handleDialogCancel}
                    dialogTitle={saveButtonOptions[selectedSaveIndex.current]}
                    layerId={workspaceLayerId.current}
                />
            ) : (
                ''
            )}
        </>
    );
}
