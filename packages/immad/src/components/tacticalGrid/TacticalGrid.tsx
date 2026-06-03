//react imports
import React, { useContext, useEffect, useRef, useState } from 'react';

//ui component imports
import { ActionButton, WidgetContainer, WidgetHeader } from '../common';
import { Box, Typography } from '@mui/material';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import PopoverPreload from './components/PopoverPreload';
import IdentityManager from '@arcgis/core/identity/IdentityManager';

//custom component imports
import FeatureLayerGrid from './components/FeatureLayerGrid';
import ConfirmDialog from './components/ConfirmDialog';
import FieldMapDialog from './components/FieldMapDialog';
import { RowStatusEnum } from './resources';

//context imports
import { MapContext } from '../../contexts/Map';
import { TacticalGridContext } from '../../contexts/TacticalGrid';
import { useSaveLoadContext } from '../../contexts/SaveLoad';
import { ToolbarContext } from '../../contexts/Toolbar';

//helper imports
import { ConfigHelper } from '../../helpers/configHelper';

import { StratLeadSectionTitle, StyledFullHeightDiv } from './styles';
import queryFeaturesFromMapLayer from './helpers/mapHelper';
import { useSnackbar } from 'notistack';
import { isLockingStatus } from './helpers/gridHelper';
import CreateStratLeadDialog from './components/CreateStratLeadDialog';
import {
    ellipseFieldMapping,
    getMissionIdByTitle,
    getMissionTacticalGridDashboardId,
    getMissionTacticalGridFieldMappingsRelatedToEllipses,
    getMissionTacticalGridLayerId,
} from '../../helpers/missionHelper';
import { FieldMapType, stratLeadDialogResult } from './components/StratLeadFormElements';
import { AppContext } from '../../contexts/App';
import QuickFilterButton from './components/QuickFilterButton';
import {
    helperCreateEllipseLayer,
    helperDeleteAllFeaturesOnDemand,
    helperDrawFeaturesOnDemand,
} from '../widgets/layerEllipse/helpers/ellipseHelpers';
import { ZoomToContext } from '../../contexts/ZoomToLayerContext';
import { useFeatureSelectionContext } from '../../contexts/FeatureSelectionContext';
import { EllipseInfo } from '../widgets/layerEllipse/resources';
import MapView from '@arcgis/core/views/MapView';
import SceneView from '@arcgis/core/views/SceneView';
import { LogHelper } from '../../helpers/logHelper';
import { checkAndUpdateLayerDefaultElevationStrategy } from '../../helpers/layerHelper';

import TacticalGridSettingsDialog, { TacticalGridSettingsMenu } from './components/TacticalGridSettingsDialog';
import HamburgerIcon from 'calcite-ui-icons-react/HamburgerIcon';
import { ApplicationStateHelper } from '../../helpers/ApplicationStateHelper';
import { currentPortalUser } from '../../helpers/portalUsersHelper';
import { ITacticalGridSettings } from '../../interfaces/UserSaveState';
import { HamburgerIconButtonDiv } from './components/stylesTGridSettingsDlg';
import SmartFilterDialog from './components/SmartFilterDialog';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import {
    setTgridInDrawEllipseMode,
    setTgridFeatureLayerOIDFieldName,
    setShowEllipseCheckbox,
    setSelectedTGridDataSliceAction,
} from './components/TacticalGridDataSlice';
const TacticalGrid = (): JSX.Element => {
    const appConfig = ConfigHelper.getAppConfig();
    const { userRoles } = useContext(AppContext);
    const isAdminUser = userRoles.Administrator === true || userRoles.MissionManager === true;

    const [tacticalGridLayerId, setTacticalGridLayerId] = useState<string>();
    const [tacticalGridLayer, setTacticalGridLayer] = useState<FeatureLayer>();
    const [confirmIsOpen, setConfirmIsOpen] = useState<boolean>(false);
    const [fieldMapConfirmIsOpen, setFieldMapConfirmIsOpen] = useState<boolean>(false);
    const [showFieldMapIsOpen, setShowFieldMapIsOpen] = useState<boolean>(false);
    const [selectedFieldMaps, setSelectedFieldMaps] = useState<FieldMapType[]>([]);
    const [additonalFieldsToAdd, setAdditonalFieldsToAdd] = useState<any[]>([]);

    const [currentStatus, setCurrentStatus] = useState<string>();
    const [stratLeadFormOpen, setStratLeadFormOpen] = useState<boolean>(false);

    const { gridApi, selectedRows, setHighlightTimeout, setColumnState, setFilterState } =
        useContext(TacticalGridContext);

    const { enqueueSnackbar } = useSnackbar();

    const container = useRef<HTMLDivElement>(null);

    const saveLoadContext = useSaveLoadContext();
    const [selectedAction, setSelectedAction] = useState<string>('Select an Action');
    const [initStratLeadDialog, setInitStratLeadDialog] = useState<boolean>(false);

    const [dialogTitle, setDialogTitle] = useState<string>('Issue StratLead');
    const [fieldsToAddToForm, setFieldsToAddToForm] = useState<string[]>([]);
    const [missionDefinedFieldMapsFound, setMissionDefinedFieldMapsFound] = useState<boolean>(true);
    const [tacticalGridDashboardId, setTacticalGridDashboardId] = useState<string | undefined>();
    const [ellipseFieldMappings, setEllipseFieldMappings] = useState<Map<string, ellipseFieldMapping>>(
        new Map<string, ellipseFieldMapping>()
    );

    const { map, activeView, sceneView, mapView } = useContext(MapContext);
    const featureSelectionContext = useFeatureSelectionContext();
    const [view, setView] = useState<MapView | SceneView | undefined>();
    const { turnOnPairingPointsAndEllipses } = featureSelectionContext;
    const [ellipseLayer, setEllipseLayer] = useState<FeatureLayer>();
    const destroyHandleRef = useRef<IHandle>();
    const { addLayerToMapWithZoomAction } = useContext(ZoomToContext);
    const [ellipseInfo, setEllipseInfo] = useState<EllipseInfo>();
    const [rowStatusBeforeActionBtnWasClicked, setRowStatusBeforeActionBtnWasClicked] = useState<string | undefined>();
    const [tacticalGridLayerSelectedOids, setTacticalGridLayerSelectedOids] = useState<number[]>([]);
    const ellipseLayerTitle = useRef<string | undefined>();

    const [showTGridSettingsDialog, setShowTGridSettingsDialog] = useState<boolean>(false);
    const [showTGridSettingsMenu, setShowTGridSettingsMenu] = useState<boolean>(false);
    const [menuAnchor, setMenuAnchor] = useState<null | undefined | HTMLElement>();
    const [tacticalGridSettings, setTacticalGridSettings] = useState<ITacticalGridSettings | undefined>();
    const [missionId, setMissionId] = useState<string>('');
    const tGridSettings = useRef<ITacticalGridSettings | undefined>();
    const { tools, setAddTool, setRemoveTool } = useContext(ToolbarContext);
    const missionIdRef = useRef<string>('');

    const [showSmartFilterDialog, setShowSmartFilterDialog] = useState<boolean>(false);

    const dispatch = useAppDispatch();
    const selectedActionInSlice = useAppSelector(
        (state: any) => state.tacticalGridDataSlice.selectedTGridDataSliceAction
    );
    const tgridSelectedRowForAction = useAppSelector(
        (state: any) => state.tacticalGridDataSlice.tgridSelectedRowForAction
    );
    const showEllipseForSelected = useAppSelector((state) => state.tacticalGridDataSlice.tgridInDrawEllipseMode);

    useEffect(() => {
        switch (selectedActionInSlice.action) {
            //STATUS
            case 'clear status': {
                onStatusBtnClick(RowStatusEnum.CLEAR_STATUS);
                break;
            }
            case 'no action': {
                onStatusBtnClick(RowStatusEnum.NO_ACTION);
                break;
            }
            case 'evaluating':
            case 'evaluate': {
                onStatusBtnClick(RowStatusEnum.EVALUATING);
                break;
            }
            case 'update time': {
                onStatusBtnClick(RowStatusEnum.UPDATED_STRATLEAD_TIME);
                break;
            }

            //ACTIONS
            case 'update location': {
                setSelectedAction(RowStatusEnum.UPDATED_STRATLEAD_LOCATION);
                break;
            }
            case 'issue': {
                setSelectedAction(RowStatusEnum.ISSUE);
                break;
            }
            case 'update all': {
                setSelectedAction(RowStatusEnum.UPDATE_ALL);
                break;
            }
            case 'update source': {
                setSelectedAction(RowStatusEnum.UPDATED_STRATLEAD_SOURCE);
                break;
            }
        }
    }, [selectedActionInSlice]);

    useEffect(() => {
        if (missionId !== '') {
            missionIdRef.current = missionId;
            getTacticalGridSettingsFromUserState(missionId).then((settings) => {
                setTacticalGridSettings(
                    settings
                        ? settings
                        : {
                              rowHeight: '35',
                              visibleRowCount: '15',
                          }
                );
            });
        }
    }, [missionId]);

    useEffect(() => {
        if (tacticalGridSettings) {
            console.debug(tacticalGridSettings);
            tGridSettings.current = { ...tacticalGridSettings };
        }
    }, [tacticalGridSettings]);

    useEffect(() => {
        return () => {
            turnOnPairingPointsAndEllipses(false);
            if (ellipseLayerTitle?.current) {
                const layer = map?.layers.find((layer) => layer.title === ellipseLayerTitle.current);
                if (layer) {
                    map?.remove(layer);
                }
            }
            //clear slice action to prevent displaying UI remnants when opening/closing or undocking/docking
            dispatch(setSelectedTGridDataSliceAction({ action: 'empty', oid: -1 }));
        };
    }, []);

    useEffect(() => {
        if (sceneView) {
            setView(sceneView);
        }
    }, [sceneView]);

    useEffect(() => {
        if (mapView) {
            setView(mapView);
        }
    }, [mapView]);

    useEffect(() => {
        setTacticalGridLayerId(undefined);
        handleDanglingEllipseLayer();
        updateTacticalGridLayer();
        dispatch(
            setShowEllipseCheckbox(!!(tacticalGridLayer && ellipseFieldMappings && ellipseFieldMappings.size === 3))
        );
    }, [map, activeView]);

    /**
     * ellipse layer is not cleaned up when workspace/default is activated even though it has a
     * defined layerview-destroy method defined
     * @returns
     */
    function handleDanglingEllipseLayer() {
        if (ellipseLayer) {
            if (destroyHandleRef && destroyHandleRef.current) {
                destroyHandleRef.current.remove();
            }
            ellipseLayer.destroy();
            setEllipseLayer(undefined);
        }
    }
    //clear saved grid state when a new mission is selected from the dropdown
    //these items are also cleared when the FeatureLayerGrid.tsx unloads
    useEffect(() => {
        setColumnState(undefined);
        setFilterState(undefined);
        setHighlightTimeout(undefined);
    }, [saveLoadContext.missionSelect]);

    useEffect(() => {
        if (selectedAction !== 'Select an Action') {
            applySelectedActionBtnClick();
        }
    }, [selectedAction]);

    useEffect(() => {
        if (map && tacticalGridLayerId && tacticalGridLayerId != 'not found') {
            //add layer to map if it doesn't exist
            const existingLayer = map.layers.filter((lyr: FeatureLayer) => {
                return lyr.portalItem && lyr.portalItem.id === tacticalGridLayerId;
            });
            if (existingLayer.length === 0) {
                let newLayer = new FeatureLayer({
                    portalItem: { id: tacticalGridLayerId },
                    returnZ: true,
                    editingEnabled: true,
                });

                //set elevation mode for tactical grid layer
                if (activeView === 'SCENE') {
                    newLayer = checkAndUpdateLayerDefaultElevationStrategy(newLayer) as FeatureLayer;
                }
                map.add(newLayer);
                newLayer.load().then(() => {
                    setTacticalGridLayer(newLayer);
                });
            } else {
                const gridLayer = existingLayer.getItemAt(0) as FeatureLayer;
                gridLayer?.load().then(() => {
                    setTacticalGridLayer(gridLayer);
                });
            }
        }
    }, [tacticalGridLayerId]);
    useEffect(() => {
        if (tacticalGridLayer) {
            registerToken();
            dispatch(setTgridInDrawEllipseMode(true));
            const fieldName = tacticalGridLayer.objectIdField;
            const oidField = tacticalGridLayer.fields.find((field) => field.name === fieldName);
            const oidFieldName = oidField && oidField.alias ? oidField.alias : fieldName;
            dispatch(setTgridFeatureLayerOIDFieldName(oidFieldName));
        }
    }, [tacticalGridLayer]);

    /**
     * Setup state after the grid layer loads.
     */
    const updateTacticalGridLayer = async () => {
        let newTacticalGridLayerId = undefined;
        let dashboardId = undefined;
        let ellipseMappings: Map<string, ellipseFieldMapping> = new Map<string, ellipseFieldMapping>();
        const missionId = await getMissionIdByTitle(saveLoadContext.missionSelect);
        if (missionId) {
            newTacticalGridLayerId = await getMissionTacticalGridLayerId(missionId);
            dashboardId = await getMissionTacticalGridDashboardId(missionId);
            ellipseMappings = await getMissionTacticalGridFieldMappingsRelatedToEllipses(missionId);
            setMissionId(missionId);
        }

        setTacticalGridLayerId(newTacticalGridLayerId ? newTacticalGridLayerId : 'not found');
        setTacticalGridDashboardId(dashboardId);
        setEllipseFieldMappings(ellipseMappings);
    };

    const registerToken = async () => {
        const credential = await IdentityManager.getCredential(tacticalGridLayer?.url as string);
        IdentityManager.registerToken({ server: appConfig.portalUrl, token: credential.token });
    };

    /**
     * Handle the closing the dialog after warning the user that editing the grid row will lock the row to other users
     * @param response users response
     */
    const onConfirmDialogClose = (response: boolean) => {
        if (response) {
            currentStatus && updateRowStatus(currentStatus);
        }
        setConfirmIsOpen(false);
    };

    /**
     * Handle closing the dialog asking the user if they want to add field mappings
     * @param response user selection to show or not show field mappings
     */
    const onFieldMapConfirmDialogClose = (response: boolean) => {
        if (response) {
            //show field mappings
            setShowFieldMapIsOpen(true);
        } else {
            // show form without any mappings
            initAndShowStratLeadDialog();
        }
        setFieldMapConfirmIsOpen(false); //hide mapping dialog
    };

    /**
     * Initialize and show the data input form.
     */
    function initAndShowStratLeadDialog() {
        setSelectedFieldMaps([]);
        setInitStratLeadDialog(true);
        setStratLeadFormOpen(true);
    }

    /**
     * Handle field mapping dialog closing.
     */
    const onFieldMapDialogClose = () => {
        setShowFieldMapIsOpen(false);
        setInitStratLeadDialog(true);
        setStratLeadFormOpen(true);
    };

    /**
     * Handle the close event on the StratLead dialog where the StratLead form is displayed.
     * @param result dialog response includes success, status, and a string message
     */
    const onStratLeadDialogClose = (result: stratLeadDialogResult) => {
        setSelectedFieldMaps([]);
        if (result.success) {
            try {
                if (currentStatus === RowStatusEnum.ISSUING_STRATLEAD) {
                    updateRowStatus(RowStatusEnum.ISSUED_STRATLEAD, true);
                    //TBD - what we do from here when we have a posting solution in place.
                    enqueueSnackbar(result.message, { variant: 'success' });
                } else if (currentStatus === RowStatusEnum.UPDATING_STRATLEAD) {
                    updateRowStatus(RowStatusEnum.UPDATED_STRATLEAD, true);
                    //TBD - what we do from here when we have a posting solution in place.
                    enqueueSnackbar(result.message, { variant: 'success' });
                }
            } catch {
                //on an error roll back status to the value the row had when it was selected
                if (currentStatus !== undefined && rowStatusBeforeActionBtnWasClicked !== undefined) {
                    updateRowStatus(rowStatusBeforeActionBtnWasClicked, true);
                } else {
                    updateRowStatus('', true);
                }
                enqueueSnackbar('Error saving form, record not updated', {
                    variant: 'error',
                });
            }
        } else {
            //on cancel roll back status to the value the row had when it was selected
            if (
                currentStatus !== undefined &&
                rowStatusBeforeActionBtnWasClicked !== undefined &&
                rowStatusBeforeActionBtnWasClicked !== ''
            ) {
                updateRowStatus(rowStatusBeforeActionBtnWasClicked, true);
            } else {
                updateRowStatus('', true);
            }
            result.status === 'warning' && enqueueSnackbar(result.message, { variant: 'warning' });
            result.status === 'info' && enqueueSnackbar(result.message, { variant: 'info' });
            result.status === 'error' && enqueueSnackbar(result.message, { variant: 'error' });
        }
        setFieldsToAddToForm([]);
        setStratLeadFormOpen(false);
        setInitStratLeadDialog(false);
        setSelectedAction('Select an Action');
        setRowStatusBeforeActionBtnWasClicked(undefined);
        dispatch(setSelectedTGridDataSliceAction({ action: 'empty', oid: -1 }));
    };

    /**
     * Handle the support actions listed in the select
     * related to updating/issuing StratLeads
     */
    const applySelectedActionBtnClick = async () => {
        const beforeStatus = getSelectedRowStatus();
        setRowStatusBeforeActionBtnWasClicked(beforeStatus); //capture the row's current status
        setCurrentStatus(RowStatusEnum.UPDATING_STRATLEAD);
        updateRowStatus(RowStatusEnum.UPDATING_STRATLEAD);

        if (selectedAction.toLowerCase() === RowStatusEnum.UPDATED_STRATLEAD_LOCATION) {
            setAdditonalFieldsToAdd([...appConfig.smart.smartExtraSystemFieldsToAddToForm]);
            setDialogTitle('Update StratLead Location');
            setFieldsToAddToForm(appConfig.smart.smartLocationFieldNames);
            if (missionDefinedFieldMapsFound) {
                setFieldMapConfirmIsOpen(true); //this will show form when closed
            } else {
                initAndShowStratLeadDialog();
            }
        } else if (selectedAction.toLowerCase() === 'issue') {
            setDialogTitle('Issue StratLead');
            setAdditonalFieldsToAdd([]);
            setCurrentStatus(RowStatusEnum.ISSUING_STRATLEAD);
            updateRowStatus(RowStatusEnum.ISSUING_STRATLEAD);
            if (selectedRows && selectedRows.length > 0) {
                if (missionDefinedFieldMapsFound) {
                    setFieldMapConfirmIsOpen(true); //this will show form when closed
                } else {
                    initAndShowStratLeadDialog();
                }
            } else {
                setInitStratLeadDialog(true);
                setStratLeadFormOpen(true); //show form without a tactical grid selection
            }
        } else if (selectedAction.toLowerCase() === 'update all') {
            setAdditonalFieldsToAdd([...appConfig.smart.smartExtraSystemFieldsToAddToForm]);
            setDialogTitle('Update StratLead');
            if (selectedRows && selectedRows.length > 0) {
                if (missionDefinedFieldMapsFound) {
                    setFieldMapConfirmIsOpen(true); //this will show form when closed
                } else {
                    initAndShowStratLeadDialog();
                }
            }
        } else if (selectedAction.toLowerCase() === RowStatusEnum.UPDATED_STRATLEAD_SOURCE) {
            setAdditonalFieldsToAdd([...appConfig.smart.smartExtraSystemFieldsToAddToForm]);
            setDialogTitle('Update StratLead Source');
            setFieldsToAddToForm([appConfig.smart.smartRecordStatusFromFieldName]);
            setInitStratLeadDialog(true);
            setStratLeadFormOpen(true);
        }
    };

    /**
     * Handle the status button clicks. Status buttons reside atop the Tactical Grid in the header of the panel.
     * @param status the action to take
     */
    const onStatusBtnClick = async (status: string) => {
        if (status === RowStatusEnum.UPDATED_STRATLEAD_TIME) {
            const beforeStatus = getSelectedRowStatus();
            setRowStatusBeforeActionBtnWasClicked(beforeStatus); //capture row's current status
            setDialogTitle('Update StratLead Time');
            setCurrentStatus(RowStatusEnum.UPDATING_STRATLEAD);
            updateRowStatus(RowStatusEnum.UPDATING_STRATLEAD);
            setFieldsToAddToForm([appConfig.smart.smartRecordEventDateFieldName]);
            setAdditonalFieldsToAdd([...appConfig.smart.smartExtraSystemFieldsToAddToForm]);
            setInitStratLeadDialog(true);
            setStratLeadFormOpen(true);
        } else if (status === RowStatusEnum.CLEAR_STATUS) {
            updateRowStatus('', true);
            enqueueSnackbar('Row status has been cleared.', {
                variant: 'success',
            });
        } else if (status === RowStatusEnum.EVALUATING || status === 'evaluate') {
            setCurrentStatus(status);
            updateRowStatus(status);
        } else if (status === RowStatusEnum.NO_ACTION) {
            setCurrentStatus(status);
            setConfirmIsOpen(true);
        } else if (status === 'Search') {
            setShowSmartFilterDialog(true);
        } else {
            setCurrentStatus(status);
            if (isLockingStatus(status)) {
                setConfirmIsOpen(true);
            } else {
                updateRowStatus(status);
            }
        }
    };

    /**
     * Update the status of a row based on the action taken by the user
     * @param status current status for the row
     * @param overrideLock make a determination if the row should be locked/unlocked based on the users action and role
     */
    const updateRowStatus = (status: string, overrideLock?: boolean) => {
        let oidFieldForQuery = '';
        const oidFieldName = tacticalGridLayer?.objectIdField;
        if (tacticalGridLayer && oidFieldName) {
            const oidField = tacticalGridLayer.fields.find((field) => field.name === oidFieldName);
            //values in the grid are keyed by the alias name of the layer oid field
            oidFieldForQuery = oidField && oidField.alias ? oidField.alias.toLowerCase() : oidFieldName.toLowerCase();
        } else {
            console.error(
                `Error getting value. TacticalGrid layer name: ${tacticalGridLayer?.title} OID field: ${fieldName}. Will not be able to update the tactical grid row status.`
            );
            return;
        }

        const oidValueBeingUpdated = tgridSelectedRowForAction[oidFieldForQuery];
        selectedRows?.forEach(async (row) => {
            //we should never be updating multiple rows - only the row that the active context menu represents
            //identified by the tgridSelectedRowForAction value - however multiple rows may be selected
            if (row[oidFieldForQuery] === oidValueBeingUpdated) {
                const tgridOIDFieldName = tacticalGridLayer?.objectIdField;
                const results = await queryFeaturesFromMapLayer(
                    row[oidFieldForQuery],
                    tacticalGridLayer as FeatureLayer,
                    tgridOIDFieldName
                );
                results.features.forEach(async (feature) => {
                    //if the row is not locked or override is true
                    if (!isLockingStatus(feature.attributes[appConfig.tacticalGrid.statusField]) || overrideLock) {
                        feature.attributes[appConfig.tacticalGrid.statusField] = status;
                        const response = await tacticalGridLayer?.applyEdits({ updateFeatures: [feature] });
                        if (response && response.updateFeatureResults) {
                            row[appConfig.tacticalGrid.statusField] = status;
                            gridApi?.refreshInfiniteCache();
                        } else {
                            enqueueSnackbar('Error applying status change, record not updated', {
                                variant: 'error',
                            });
                        }
                    } else {
                        enqueueSnackbar('Record status previously set by another user, change not saved', {
                            variant: 'error',
                        });
                        gridApi?.refreshInfiniteCache();
                    }
                });
            }
        });
    };

    /**
     * Get the status of the currently selected row.
     * This value will be stored and used to reset the status if the Action is cancelled or fails
     */
    function getSelectedRowStatus(): string | undefined {
        if (selectedRows && selectedRows.length > 0) {
            const row = selectedRows[0];
            return row[appConfig.tacticalGrid.statusField];
        }
        return undefined;
    }

    /**
     * When tgrid is open and the layout is saved -- when the mission is reloaded the grid initializes itself
     * before the view is set and hence it is undefined. This prevents ellipses from being able to render.
     */
    function resetView() {
        if (sceneView) {
            setView(sceneView);
        }
        if (mapView) {
            setView(mapView);
        }
        return;
    }

    useEffect(() => {
        if (showEllipseForSelected) {
            if (!view) {
                //if the view in undefined at this point try resetting it
                resetView();
            }
            turnOnEllipseMode(); //we need a valid view at this point in the code to draw ellipses
        } else {
            turnOffEllipseMode();
        }
    }, [tacticalGridLayer, showEllipseForSelected]);

    useEffect(() => {
        if (ellipseLayer) {
            displaySelectedEllipses(); //handle rows selected when the checkbox was checked
        }
    }, [ellipseLayer]);

    useEffect(() => {
        if (ellipseLayer) {
            displaySelectedEllipses();
        }
    }, [tacticalGridLayerSelectedOids]); //set by gridSelectedOidsUpdated

    /**
     * Handle tactical grid context selected row changes
     */
    useEffect(() => {
        if (selectedRows && selectedRows.length > 0 && tacticalGridLayer) {
            const fieldName = tacticalGridLayer.objectIdField;
            const oidField = tacticalGridLayer.fields.find((field) => field.name === fieldName);
            const oidFieldName = oidField && oidField.alias ? oidField.alias : fieldName;
            const oids: number[] = [];
            selectedRows.forEach((row) => oids.push(row[oidFieldName.toLowerCase()]));
            gridSelectedOidsUpdated([...oids]);
        } else {
            gridSelectedOidsUpdated([]);
        }
    }, [selectedRows]);

    /**
     * Turn off ellipse mode.
     */
    function turnOnEllipseMode() {
        if (showEllipseForSelected && tacticalGridLayer) {
            if (!ellipseLayer && view) {
                const newLayer = helperCreateEllipseLayer(tacticalGridLayer, view);
                view.map?.add(newLayer);
                newLayer.when(() => {
                    ellipseLayerTitle.current = newLayer.title;
                    setEllipseLayer(newLayer);
                    turnOnPairingPointsAndEllipses(true);
                    displaySelectedEllipses();
                    if (view) {
                        addLayerToMapWithZoomAction(view, newLayer);
                    }
                });
                destroyHandleRef.current = newLayer.on('layerview-destroy', () => {
                    setEllipseLayer(undefined);
                });
            } else {
                //ellipse layer exists
                updateLayersEllipseInfo();
                turnOnPairingPointsAndEllipses(true);
                displaySelectedEllipses();
            }
        }
    }

    /**
     * Turn on ellipse mode which causes ellipse to appear when a tactical grid row is selected
     */
    async function turnOffEllipseMode() {
        if (view && ellipseLayer) {
            //clear any highlights on ellipse features
            //leave commented out in case of the need to roll back on site
            //setSelectionData(view, ellipseLayer, [], SelectionMode.NewSelectionSet);
        }
        if (selectedRows && selectedRows.length > 0) {
            if (ellipseLayer) {
                turnOnPairingPointsAndEllipses(false);
                await helperDeleteAllFeaturesOnDemand(ellipseLayer);
                ellipseLayer ? ellipseLayer.refresh() : '';
            }
        }
    }

    /**
     * Called when the selected rows in the grid have changed. Method figures out what to do with the
     * ellipse drawing strategy.
     * Also used as a callback method passed to FeatureLayerGrid to use when the tactical grid's data source is reset
     * as a result of a definition query being applied
     * @param newOidArray number array - oids
     */
    function gridSelectedOidsUpdated(newOidArray: any[] | undefined) {
        //default definition - show everything
        //use this to support the user selected rows in the grid and then applying a filter
        if (
            newOidArray &&
            tacticalGridLayer &&
            tacticalGridLayer.definitionExpression &&
            tacticalGridLayer.definitionExpression === ''
        ) {
            setTacticalGridLayerSelectedOids([...newOidArray]);
        }
        //new definition applied, only show ellipses if the oid is in the definitionQuery results
        else if (
            tacticalGridLayer &&
            tacticalGridLayer.definitionExpression &&
            tacticalGridLayer.definitionExpression !== ''
        ) {
            const newOids: number[] = [];
            tacticalGridLayer
                .queryObjectIds({
                    where: tacticalGridLayer.definitionExpression,
                })
                .then((oids) => {
                    oids.forEach((oid) => {
                        const id = newOidArray?.find((tOid) => tOid === oid);
                        if (id) {
                            newOids.push(id);
                        }
                    });
                    setTacticalGridLayerSelectedOids([...newOids]);
                });
        }
        //no definition expression or no new array vals
        else {
            setTacticalGridLayerSelectedOids(newOidArray ? [...newOidArray] : []);
        }
    }

    /**
     * Show ellipses for rows selected in the tactical grid if the Show Ellipse checkbox is checked.
     */
    function displaySelectedEllipses() {
        if (ellipseLayer && showEllipseForSelected) {
            drawSelected(ellipseLayer, tacticalGridLayer);
        }
        return;
    }

    useEffect(() => {
        //add ellipse info to point and ellipse layers - this does not persist between sessions (ie not stored in portal)
        //ellipse info objects hold the data to map pont/ellipse layer pairings
        updateLayersEllipseInfo();
    }, [ellipseInfo]); // set in drawSelected

    /**
     * Draw the ellipse features based on relevant ftr attributes of the ellipse layer
     * @param ellipseLayer the ellipse layer
     * @param tacticalGridLayer the point grid layer
     */
    function drawSelected(ellipseLayer: FeatureLayer, tacticalGridLayer: FeatureLayer | undefined) {
        const semiMajor = ellipseFieldMappings.get('semi-major');
        const semiMinor = ellipseFieldMappings.get('semi-minor');
        const azimuth = ellipseFieldMappings.get('azimuth');

        if (semiMajor && semiMajor.units && semiMinor && semiMinor.units && azimuth && tacticalGridLayer) {
            helperDrawFeaturesOnDemand(
                semiMajor?.tacticalGridFieldName,
                semiMinor?.tacticalGridFieldName,
                azimuth?.tacticalGridFieldName,
                tacticalGridLayer,
                'selected',
                semiMajor?.units,
                semiMinor.units,
                view,
                ellipseLayer,
                tacticalGridLayerSelectedOids
            );
        } else {
            LogHelper.log('Unable to draw ellipse features due to missing attribute data.', true);
            enqueueSnackbar(
                'Failed to draw ellipses - missing one of the following: semi-major, semi-minor, or azimuth.',
                { variant: 'error' }
            );
        }

        if (!ellipseInfo) {
            setEllipseInfo({
                enabled: true,
                semiMajorField: semiMajor?.tacticalGridFieldName ? semiMajor.tacticalGridFieldName : '',
                semiMinorField: semiMinor?.tacticalGridFieldName ? semiMinor?.tacticalGridFieldName : '',
                azimuthField: azimuth?.tacticalGridFieldName ? azimuth?.tacticalGridFieldName : '',
                mode: 'selected',
                ellipseLayerId: ellipseLayer.id,
                pointLayerId: tacticalGridLayer?.id ? tacticalGridLayer?.id : '',
            });
        }
    }

    let semiMajorFieldName = '';
    let semiMinorFieldName = '';
    const radiusFieldName = appConfig.smart.smartRadiusFieldName;
    /**
     * Get the app config field names defined for the semi-minor and semi-major
     */
    function getEllipseFieldNames() {
        const fieldObjs: any[] = appConfig.tacticalGrid.defaultFieldMappings as any[];
        const majorObj = fieldObjs.find((obj) => obj.ellipseRole === 'semi-major');
        semiMajorFieldName = majorObj ? majorObj.systemFieldName : '';

        const minorObj = fieldObjs.find((obj) => obj.ellipseRole === 'semi-minor');
        semiMinorFieldName = minorObj ? minorObj.systemFieldName : '';
    }

    if (semiMajorFieldName === '' || semiMinorFieldName === '') {
        getEllipseFieldNames();
    }

    /**
     * Update the ellipse info object on the point and ellipse layers
     */
    function updateLayersEllipseInfo() {
        if (ellipseInfo) {
            tacticalGridLayer?.set('ellipseInfo', JSON.stringify(ellipseInfo));
            ellipseLayer?.set('ellipseInfo', JSON.stringify(ellipseInfo));
        } else {
            tacticalGridLayer?.set('ellipseInfo', undefined);
            ellipseLayer?.set('ellipseInfo', undefined);
        }
    }

    /**take needed action to refresh the grid data */
    function refreshGrid() {
        gridApi?.refreshInfiniteCache();
    }

    /**
     * Close and reload the tactical grid
     */
    function closeAndReloadGrid() {
        const tgridTool = tools.find((tool: any) => tool.name === 'Tactical Grid');
        if (tgridTool) {
            setRemoveTool(tgridTool);
            setAddTool(tgridTool);
        }
    }

    /**
     * Retrieve the current tactical grid setting from the user's save state object
     * @param missionId current mission id
     * @returns a TacticalGridSettings object
     */
    const getTacticalGridSettingsFromUserState = async (
        missionId: string
    ): Promise<ITacticalGridSettings | undefined> => {
        const user = await currentPortalUser();

        const currentState = await ApplicationStateHelper.getUserSavedState(user);
        if (currentState && currentState.tacticalGridState && Array.isArray(currentState.tacticalGridState)) {
            const gridState = currentState.tacticalGridState.find((state) => state.missionId === missionId);
            if (gridState?.properties.tacticalGridSettings) {
                const tacticalGridSettings = gridState?.properties.tacticalGridSettings;
                return tacticalGridSettings;
            }
        }
        return undefined;
    };

    /**
     * Handler for the close event on the tactical grid settings dialog
     * @param settings settings configured in the dialog
     */
    function closeTGridSettingsDialog(settings: ITacticalGridSettings | undefined, rowHeightUpdated: boolean) {
        setShowTGridSettingsDialog(false);
        if (settings) {
            setTacticalGridSettings({
                visibleRowCount: settings.visibleRowCount,
                rowHeight: settings.rowHeight,
            });
            !rowHeightUpdated && refreshGrid();

            if (rowHeightUpdated) {
                closeAndReloadGrid();
            }
        }
    }

    /**
     * Handler for the open menu event
     * @param event click event to open the tactical grid menu
     */
    function openTGridSettingsMenuClick(event: React.MouseEvent<HTMLElement>) {
        setMenuAnchor(event.currentTarget);
        setShowTGridSettingsMenu((state) => !state);
    }

    /**
     * Handler for menu close event
     * @param idClicked id of the clicked menu item
     */
    function closeTGridSettingsMenuClick(idClicked: string) {
        setShowTGridSettingsMenu(false);
        setMenuAnchor(null);
        switch (idClicked) {
            case 'tactical-grid-settings': {
                setShowTGridSettingsDialog(true);
            }
            case 'refresh-tactical-grid': {
                refreshGrid();
            }
        }
    }

    /**
     * Handler for the close event on the tactical grid settings dialog
     * @param settings settings configured in the dialog
     */
    function closeSmartFilterDialog() {
        setShowSmartFilterDialog(false);
    }

    return (
        <>
            {showTGridSettingsDialog && tacticalGridSettings && (
                <TacticalGridSettingsDialog
                    onClose={closeTGridSettingsDialog}
                    open={showTGridSettingsDialog}
                    message={'Define Setting for the Tactical Grid?'}
                    currentSettings={tacticalGridSettings}
                    container={container.current}
                />
            )}
            {showTGridSettingsMenu && (
                <TacticalGridSettingsMenu
                    onClose={closeTGridSettingsMenuClick}
                    open={showTGridSettingsMenu}
                    container={menuAnchor}
                />
            )}

            {!tacticalGridLayerId || tacticalGridLayerId === 'not found' ? (
                <StratLeadSectionTitle>
                    {!tacticalGridLayerId ? (
                        <Typography>Loading...</Typography>
                    ) : (
                        <Typography>
                            Tactical Grid is not configured for this Mission. Contact a Mission Manager to enable this
                            tool.
                        </Typography>
                    )}
                </StratLeadSectionTitle>
            ) : (
                <WidgetContainer ref={container}>
                    <PopoverPreload />
                    {showSmartFilterDialog && tacticalGridDashboardId && (
                        <SmartFilterDialog
                            onClose={closeSmartFilterDialog}
                            open={showSmartFilterDialog}
                            container={container.current}
                            tacticalGridDashboardId={tacticalGridDashboardId}
                            tacticalGridLayer={tacticalGridLayer}
                            view={view}
                            ellipseFieldMappings={ellipseFieldMappings}
                        />
                    )}
                    {initStratLeadDialog ? (
                        <CreateStratLeadDialog
                            onClose={onStratLeadDialogClose}
                            open={stratLeadFormOpen}
                            dialogTitle={dialogTitle}
                            container={container.current}
                            selectedFieldMaps={selectedFieldMaps}
                            arrayOfLimitedFieldNamesToAddToForm={fieldsToAddToForm}
                            tacticalGridDashboardId={tacticalGridDashboardId}
                            semiMajorFieldName={semiMajorFieldName}
                            semiMinorFieldName={semiMinorFieldName}
                            radiusFieldName={radiusFieldName}
                            additonalFieldsToAdd={additonalFieldsToAdd}
                        />
                    ) : (
                        ''
                    )}

                    {showFieldMapIsOpen && (
                        <FieldMapDialog
                            selectedFieldMaps={selectedFieldMaps}
                            setSelectedFieldMaps={setSelectedFieldMaps}
                            onClose={onFieldMapDialogClose}
                            container={container.current}
                            setMissionDefinedFieldMapsFound={setMissionDefinedFieldMapsFound}
                        />
                    )}
                    <ConfirmDialog
                        onClose={onFieldMapConfirmDialogClose}
                        open={fieldMapConfirmIsOpen}
                        message={'Load fields from Tactical Grid?'}
                        //title={'Tactical Grid'}
                        container={container.current}
                    />
                    <ConfirmDialog
                        onClose={onConfirmDialogClose}
                        open={confirmIsOpen}
                        message={'Setting this status will lock the current record, do you want to proceed?'}
                        title={'Tactical Grid'}
                        container={container.current}
                    />
                    <WidgetHeader position='static'>
                        <Box flex={1}>
                            <ActionButton
                                variant='contained'
                                color='secondary'
                                type='button'
                                title='Search for a STRATLEAD'
                                disabled={false}
                                size={'small'}
                                onClick={() => {
                                    onStatusBtnClick('Search');
                                }}
                            >
                                Search
                            </ActionButton>

                            {tacticalGridLayer && <QuickFilterButton layer={tacticalGridLayer} />}
                            <Box sx={{ display: 'inline', position: 'absolute', top: '-15px', right: '-5px' }}>
                                <HamburgerIconButtonDiv size='large' onClick={openTGridSettingsMenuClick}>
                                    <HamburgerIcon />
                                </HamburgerIconButtonDiv>
                            </Box>
                        </Box>
                    </WidgetHeader>
                    <StyledFullHeightDiv>
                        {tacticalGridLayer && tacticalGridSettings && (
                            <FeatureLayerGrid
                                featureLayer={tacticalGridLayer}
                                ellipseLayer={ellipseLayer}
                                isAdminUser={isAdminUser}
                                showEllipseForSelected={showEllipseForSelected}
                                tacticalGridDataSourceReset={gridSelectedOidsUpdated}
                                tacticalGridSettings={tacticalGridSettings}
                            />
                        )}
                    </StyledFullHeightDiv>
                </WidgetContainer>
            )}
        </>
    );
};

export default TacticalGrid;
