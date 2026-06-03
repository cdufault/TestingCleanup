// React imports
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';

// Context imports
import { MapContext } from '../../../contexts/Map';

// Helper imports
import { ConfigHelper } from '../../../helpers/configHelper';
import { zoomToLayer } from '../../../helpers/extentHelper';
import { LogHelper } from '../../../helpers/logHelper';
import { useSnackbar } from 'notistack';

// Component imports
import ActionButton from '@arcgis/core/support/actions/ActionButton';
import ActionToggle from '@arcgis/core/support/actions/ActionToggle';
import Collection from '@arcgis/core/core/Collection';
import EsriLayerList from '@arcgis/core/widgets/LayerList';
import Sublayer from '@arcgis/core/layers/support/Sublayer';
import LayerListViewModel from '@arcgis/core/widgets/LayerList/LayerListViewModel';
import GroupLayer from '@arcgis/core/layers/GroupLayer';
import RenameLayerDialog from './components/RenameLayerDialog';
import NameGroupLayerDialog from './components/NameGroupLayerDialog';

import LayerListViewModelProperties = __esri.LayerListViewModelProperties;
import LayerListViewModelTriggerActionEvent = __esri.LayerListViewModelTriggerActionEvent;
import ListItem = __esri.ListItem;
import PortalLayer = __esri.PortalLayer;
import RefreshableLayer = __esri.RefreshableLayer;
import TemporalLayer = __esri.TemporalLayer;
import Layer = __esri.Layer;
import GeoJSONLayerElevationInfo = __esri.GeoJSONLayerElevationInfo;
import WFSLayerElevationInfo = __esri.WFSLayerElevationInfo;
import CSVLayerElevationInfo = __esri.CSVLayerElevationInfo;
import GraphicsLayerElevationInfo = __esri.GraphicsLayerElevationInfo;
import OGCFeatureLayerElevationInfo = __esri.OGCFeatureLayerElevationInfo;
import StreamLayerElevationInfo = __esri.StreamLayerElevationInfo;
import ElevationOptionsDialog from './components/ElevationOptionsDialog';
import PopupConfigDialog from './components/PopupConfigDialog';
import LabelConfigDialog from './components/LabelConfigDialog';
import PushLayerDialog from './components/PushLayerDialog';
import WMSSubLayer from '@arcgis/core/layers/support/WMSSublayer';
import { ElevationInfoLayer } from '../../../helpers/layerHelper';
import FeatureLayerBaseElevationInfo = __esri.FeatureLayerBaseElevationInfo;
import { pushLayerToMission } from './helpers/layerHelpers';
import { AppContext } from '../../../contexts/App';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { useAppSelector } from '../../../hooks/hooks';

/**
 * Actions for elements in the Layer List.
 */
enum ItemActions {
    FullExtent = 'full-extent',
    IncreaseTransparency = 'increase-transparency',
    DecreaseTransparency = 'decrease-transparency',
    Rename = 'rename',
    ElevationMode = 'elevation-mode',
    ElevationConfig = 'elevation-config',
    ConfigurePopups = 'configure-popups',
    ConfigureLabels = 'configure-labels',
    TimeSupport = 'time-support',
    RefreshInterval = 'refresh-interval',
    ViewPortalItem = 'view-portal-item',
    Remove = 'remove',
    AddToNewGroup = 'add-to-new-group',
    PushLayer = 'push-layer',
}

enum ElevationModes {
    OnTheGround = 'on-the-ground',
    RelativeToGround = 'relative-to-ground',
    AbsoluteHeight = 'absolute-height',
    RelativeToScene = 'relative-to-scene',
}

const elevationInfoLayerTypes: string[] = [
    'feature',
    'scene',
    'building-scene',
    'geojson',
    'csv',
    'graphics',
    'integrated-mesh',
    'ogc-feature',
    'point-cloud',
    'stream',
    'subtype-group',
    'wfs',
];

const featureExpressionSupportTypes: string[] = [
    'feature',
    'geojson',
    'csv',
    'graphics',
    'ogc-feature',
    'stream',
    'subtype-group',
    'wfs',
];

type FeatureExpressionElevationInfo = FeatureLayerBaseElevationInfo &
    GeoJSONLayerElevationInfo &
    CSVLayerElevationInfo &
    GraphicsLayerElevationInfo &
    OGCFeatureLayerElevationInfo &
    StreamLayerElevationInfo &
    WFSLayerElevationInfo;

const LayerList = (): JSX.Element => {
    const appConfig = ConfigHelper.getAppConfig();

    const layerListRef = useRef<HTMLDivElement>(null);

    const { getMapView, getSceneView, activeView, mapView, sceneView } = useContext(MapContext);

    const { enqueueSnackbar } = useSnackbar();

    // Some defaults are provided in case config is missing values
    const [refreshIntervals, setRefreshIntervals] = useState<number[]>([0, 1, 5, 10]);

    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
    const [renameDialogValue, setRenameDialogValue] = useState<string>('');

    const [isNameGroupDialogOpen, setIsNameGroupDialogOpen] = useState(false);
    const [nameGroupDialogValue, setNameGroupDialogValue] = useState<string>('');

    const [isPushLayerDialogOpen, setIsPushLayerDialogOpen] = useState(false);

    const layerToGroup = useRef<Layer>();

    const layerToRename = useRef<Layer>();

    const layerToPush = useRef<Layer>();

    const [selectedLayer, setSelectedLayer] = useState<Layer>();

    const [dialogItem, setDialogItem] = useState<ItemActions | null>();

    // Creates a LayerListViewModel on mount and keep it during the state of the LayerList component
    const layerListViewModel = useMemo(
        () =>
            new LayerListViewModel({
                listItemCreatedFunction: listItemCreated,
            } as LayerListViewModelProperties),
        []
    );

    const { userRoles } = useContext(AppContext);
    const isAdminUser = userRoles.Administrator === true || userRoles.MissionManager === true;
    const gateApplicationId = useAppSelector((state) => state.adminSettingsSlice.gateApplicationId);

    useEffect(() => {
        if (appConfig?.refreshIntervalsInMinutes) {
            setRefreshIntervals([0, ...appConfig.refreshIntervalsInMinutes]);
        } else {
            LogHelper.log('Warning: refreshIntervals could not be loaded from the application configuration.', true);
        }

        layerListViewModel.listItemCreatedFunction = listItemCreated;

        const layerList = new EsriLayerList({
            dragEnabled: true,
            selectionMode: 'single',
            container: layerListRef.current ?? '',
            viewModel: layerListViewModel,
        });

        return () => {
            layerList.destroy();
        };
    }, []);

    useEffect(() => {
        let handler: IHandle;
        if (layerListViewModel && activeView) {
            if (activeView === 'MAP') {
                const mapView = getMapView();
                if (mapView) {
                    layerListViewModel.view = mapView;
                    handler = layerListViewModel.on('trigger-action', handleItemAction);
                }
            } else {
                const sceneView = getSceneView();
                if (sceneView) {
                    layerListViewModel.view = sceneView;
                    handler = layerListViewModel.on('trigger-action', handleItemAction);
                }
            }

            layerListViewModel.operationalItems.forEach((item) => {
                item.view = layerListViewModel.view;
            });
        }
        return () => {
            handler?.remove();
        };
    }, [activeView, layerListViewModel, mapView, sceneView]);

    useEffect(() => {
        if (renameDialogValue.length > 0 && layerToRename.current) {
            layerToRename.current.title = renameDialogValue.trim();
        }
    }, [renameDialogValue]);

    useEffect(() => {
        if (nameGroupDialogValue.length > 0 && layerToGroup.current) {
            const newGroupLayer = new GroupLayer({
                id: nameGroupDialogValue,
                title: nameGroupDialogValue,
                layers: [layerToGroup.current],
            });
            if (activeView === 'MAP') {
                const mapView = getMapView();
                if (mapView) mapView.map.add(newGroupLayer);
            } else if (activeView === 'SCENE') {
                const sceneView = getSceneView();
                if (sceneView) sceneView.map.add(newGroupLayer);
            }
        }
    }, [nameGroupDialogValue]);

    /**
     * Update configured feature class id with details about the layer to push to gate
     * @param portalGroupId group id
     * @param gateApplicationId GATE application id
     * @param layerToPush layer to push
     * @param defaultExpirationTimeHrs the amount of time that will elapse after which the layer will be marked for removal
     */
    const pushLayerInfoToDB = (
        portalGroupId: string,
        gateApplicationId: string,
        layerToPush: Layer | undefined,
        defaultExpirationTimeHrs: number
    ) => {
        const fLayer = layerToPush as FeatureLayer;
        console.debug(
            `push data: missionId: ${portalGroupId} | expirationTimeHrs: ${defaultExpirationTimeHrs} | layer: ${layerToPush?.title}| layerId:${fLayer?.portalItem.id} `
        );
        if (layerToPush && portalGroupId && gateApplicationId) {
            enqueueSnackbar('Pushing Layer...', { variant: 'info' });
            pushLayerToMission(layerToPush, portalGroupId, gateApplicationId, defaultExpirationTimeHrs).then((res) => {
                if (res) {
                    for (const addFeatureResult of res.addFeatureResults) {
                        if (addFeatureResult.error) {
                            enqueueSnackbar('Error pushing layer to mission: ' + addFeatureResult.error.message, {
                                variant: 'error',
                            });
                            console.error(addFeatureResult.error.message);
                        } else {
                            enqueueSnackbar('Pushed Layer to Mission Successfully.', {
                                variant: 'success',
                            });
                        }
                    }
                }
                setIsPushLayerDialogOpen(false);
            });
        } else {
            const message = `Error trying to push layer to mission. Mission id: ${portalGroupId} GATE application id: ${gateApplicationId},  or missing layer id: ${
                layerToPush ? layerToPush.id : 'undefined layer'
            }`;
            console.error(message);
            enqueueSnackbar(message, {
                variant: 'error',
            });
        }
    };

    const handleDialogClose = (nameValue: string) => {
        setRenameDialogValue(nameValue.trim());
        setIsRenameDialogOpen(false);
    };

    const handleDialogCancel = () => {
        setIsRenameDialogOpen(false);
    };

    /**
     * Cancel and close the push layer dialog
     */
    const handlePushDialogCancel = () => {
        setIsPushLayerDialogOpen(false);
    };

    /**
     * Names the group the layer will be added to.
     * @param nameValue
     */
    const handleGroupDialogClose = (nameValue: string) => {
        setNameGroupDialogValue(nameValue.trim());
        setIsNameGroupDialogOpen(false);
    };

    /**
     * Closes the group naming dialog box when cancel is clicked.
     */
    const handleGroupDialogCancel = () => {
        setIsNameGroupDialogOpen(false);
    };

    /**
     * Perform custom actions based on a ListItem and ActionBase button.
     * @param {LayerListViewModelTriggerActionEvent} event An event containing the action and item on which the action operates.
     */
    function handleItemAction(event: LayerListViewModelTriggerActionEvent): void {
        const { item, action } = event;
        const { view } = item as ListItem;
        const { id } = action;

        setSelectedLayer(item.layer);

        switch (id) {
            case ItemActions.FullExtent: {
                const options = {
                    speedFactor: appConfig.panningSpeed,
                };
                action.active = true;
                zoomToLayer(item.layer, view, options)
                    .then(() => {
                        action.active = false;
                    })
                    .catch((e) => {
                        action.active = false;
                        LogHelper.log(e, e.name !== 'AbortError');
                    });
                break;
            }
            case ItemActions.IncreaseTransparency: {
                item.layer.opacity -= 0.25;
                action.disabled = item.layer.opacity <= 0;
                const decreaseTransparencyAction = findActionButtonById(item, ItemActions.DecreaseTransparency);
                if (decreaseTransparencyAction) {
                    decreaseTransparencyAction.disabled = false;
                }
                break;
            }
            case ItemActions.DecreaseTransparency: {
                item.layer.opacity += 0.25; // Opacity is inverse of transparency
                action.disabled = item.layer.opacity >= 1;
                const increaseTransparencyAction = findActionButtonById(item, ItemActions.IncreaseTransparency);
                if (increaseTransparencyAction) {
                    increaseTransparencyAction.disabled = false;
                }
                break;
            }
            case ItemActions.Rename: {
                layerToRename.current = item.layer;
                setRenameDialogValue(item.layer.title);
                setIsRenameDialogOpen(true);
                break;
            }
            case ItemActions.AddToNewGroup: {
                layerToGroup.current = item.layer;
                setNameGroupDialogValue('');
                setIsNameGroupDialogOpen(true);
                break;
            }
            case ItemActions.ConfigurePopups: {
                setDialogItem(id);
                break;
            }
            case ItemActions.ConfigureLabels: {
                setDialogItem(id);
                break;
            }
            case ItemActions.ElevationConfig: {
                if (item.view.type === '3d') {
                    setDialogItem(id);
                } else {
                    enqueueSnackbar('Operation not available in 2d mode.', {
                        variant: 'warning',
                    });
                }
                break;
            }
            case ItemActions.ElevationMode: {
                const elevationInfoLayer = item.layer as ElevationInfoLayer;
                if (elevationInfoLayer && item.view.type === '3d') {
                    let selectedMode: ElevationModes;

                    if (elevationInfoLayer.elevationInfo) {
                        switch (elevationInfoLayer.elevationInfo.mode) {
                            case ElevationModes.OnTheGround:
                                selectedMode = ElevationModes.RelativeToGround;
                                break;
                            case ElevationModes.RelativeToGround:
                                selectedMode = ElevationModes.AbsoluteHeight;
                                break;
                            case ElevationModes.AbsoluteHeight:
                                selectedMode = ElevationModes.RelativeToScene;
                                break;
                            case ElevationModes.RelativeToScene:
                                selectedMode = ElevationModes.OnTheGround;
                                break;
                            default:
                                selectedMode = ElevationModes.OnTheGround;
                                break;
                        }
                    } else {
                        selectedMode = ElevationModes.OnTheGround;
                    }

                    // Copy to create a backup
                    const oldElevationInfo = JSON.parse(JSON.stringify(elevationInfoLayer.elevationInfo));

                    elevationInfoLayer.elevationInfo = {
                        mode: selectedMode,
                        offset: elevationInfoLayer.elevationInfo?.offset,
                        unit: elevationInfoLayer.elevationInfo?.unit,
                    };

                    if (featureExpressionSupportTypes.includes(item.layer.type)) {
                        const elevationInfo = oldElevationInfo as FeatureExpressionElevationInfo;
                        if (elevationInfo) {
                            const newElevationInfo = elevationInfoLayer.elevationInfo as FeatureExpressionElevationInfo;
                            newElevationInfo.featureExpressionInfo = elevationInfo.featureExpressionInfo;
                        }
                    }

                    action.title = `Elevation Mode: ${elevationInfoLayer.elevationInfo.mode}`;

                    if (elevationInfoLayerTypes.includes(item.layer.type)) {
                        const elevationConfigAction = findActionButtonById(item, ItemActions.ElevationConfig);
                        if (elevationConfigAction) {
                            elevationConfigAction.visible =
                                elevationInfoLayer.elevationInfo.mode === ElevationModes.AbsoluteHeight ||
                                elevationInfoLayer.elevationInfo.mode === ElevationModes.RelativeToScene ||
                                elevationInfoLayer.elevationInfo.mode === ElevationModes.RelativeToGround;
                        }
                    }
                } else if (item.view.type === '2d') {
                    enqueueSnackbar('Operation not available in 2d mode.', {
                        variant: 'warning',
                    });
                }

                break;
            }
            case ItemActions.Remove: {
                if (item.parent && item.parent.layer instanceof GroupLayer) {
                    const groupLayer = item.parent.layer as GroupLayer;
                    groupLayer.layers.remove(item.layer);
                } else {
                    view.map.remove(item.layer);
                }
                break;
            }
            case ItemActions.TimeSupport: {
                const temporalLayer = item.layer as unknown as TemporalLayer;
                if (temporalLayer) {
                    temporalLayer.useViewTime = !temporalLayer.useViewTime;
                    const toggleButton = action as ActionToggle;
                    if (toggleButton) {
                        toggleButton.title = 'Time Filter ' + (temporalLayer.useViewTime ? 'Enabled' : 'Disabled');
                        toggleButton.value = temporalLayer.useViewTime;
                    }
                }
                break;
            }
            case ItemActions.RefreshInterval: {
                const refreshableLayer = item.layer as Layer as unknown as RefreshableLayer;
                if (refreshableLayer) {
                    const index = refreshIntervals.indexOf(refreshableLayer.refreshInterval);
                    // Increase index and cycle through refresh interval length
                    refreshableLayer.refreshInterval = refreshIntervals[(index + 1) % refreshIntervals.length];
                    // Update title
                    action.title = formatRefreshIntervalTitle(refreshableLayer.refreshInterval);
                }
                break;
            }
            case ItemActions.ViewPortalItem: {
                const portalLayer = item.layer as unknown as PortalLayer;
                if (portalLayer) {
                    const portalHostPath = portalLayer.portalItem?.portal?.portalHostname;
                    const id = portalLayer.portalItem?.id;
                    if (portalHostPath && id) {
                        window.open(`https://${portalHostPath}/home/item.html?id=${id}`, '_blank');
                    } else {
                        LogHelper.log('Error constructing Portal item URL from layer.', true);
                    }
                }
                break;
            }
            case ItemActions.PushLayer: {
                layerToPush.current = item.layer;
                setIsPushLayerDialogOpen(true);
                break;
            }
        }
    }

    /**
     * Given a refresh interval number (in minutes) this function returns a title for the Action.
     * @param {number} refreshInterval The refresh interval, in minutes, to use for the display string.
     * @return {string} A formatted string containing the refresh interval title.
     */
    function formatRefreshIntervalTitle(refreshInterval: number): string {
        if (refreshInterval <= 0) {
            return 'Refresh Interval Disabled';
        } else if (refreshInterval < 1) {
            return `Refresh Every ${Math.round(refreshInterval * 60)} Seconds`;
        } else if (refreshInterval === 1) {
            return `Refresh Every Minute`;
        } else {
            return `Refresh Every ${refreshInterval} Minutes`;
        }
    }

    function findActionButtonById(item: ListItem, id: ItemActions): ActionButton | ActionToggle | null {
        for (const actionsSection of item.actionsSections.toArray()) {
            const item = actionsSection.find((item) => item.id === id);
            if (item) {
                return item;
            }
        }
        return null;
    }

    /**
     * Called then a Layer ListItem is created.
     * @param event The event with a new ListItem.
     */
    function listItemCreated(event: { item: ListItem }): void {
        const { item } = event;

        item.actionsSections = new Collection([
            [
                {
                    title: 'Go to Full Extent',
                    className: 'esri-icon-zoom-out-fixed',
                    id: ItemActions.FullExtent,
                } as ActionButton,
            ],
            [
                {
                    title: 'Increase Transparency',
                    className: 'esri-icon-up',
                    id: ItemActions.IncreaseTransparency,
                    disabled: item.layer.opacity === 0,
                } as ActionButton,
                {
                    title: 'Decrease Transparency',
                    className: 'esri-icon-down',
                    id: ItemActions.DecreaseTransparency,
                    disabled: item.layer.opacity === 1,
                } as ActionButton,
            ],
            [
                {
                    title: 'Rename Layer',
                    className: 'esri-icon-edit',
                    id: ItemActions.Rename,
                } as ActionButton,
            ],
        ]);

        const portalLayer = item.layer as unknown as PortalLayer;
        if (isAdminUser && portalLayer?.portalItem?.itemUrl) {
            item.actionsSections.push(
                new Collection([
                    {
                        /* current implementation is only supporting pushing feature layers */
                        title:
                            item.layer.type !== 'feature'
                                ? 'Push To Mission - Unsupported Layer Type'
                                : 'Push To Mission',
                        disabled: item.layer.type !== 'feature',
                        className: 'esri-icon-share',
                        id: ItemActions.PushLayer,
                    } as ActionButton,
                ])
            );
        }
        // noinspection SuspiciousTypeOfGuard
        const sublayer = item.layer instanceof Sublayer;
        const isWmsSublayer = item.layer instanceof WMSSubLayer;
        if (!isWmsSublayer) {
            item.actionsSections.push(
                new Collection([
                    {
                        title: 'Create Group',
                        className: 'esri-icon-collection',
                        id: ItemActions.AddToNewGroup,
                    } as ActionButton,
                ])
            );
        }

        if (!sublayer) {
            const temporalLayer = item.layer as unknown as TemporalLayer;
            if (temporalLayer && temporalLayer?.timeInfo) {
                temporalLayer.useViewTime = false;
                item.actionsSections.push(
                    new Collection([
                        new ActionToggle({
                            title: 'Time Filter Disabled',
                            className: 'esri-icon-time-clock',
                            id: ItemActions.TimeSupport,
                        }),
                    ])
                );
            }

            if (elevationInfoLayerTypes.includes(item.layer.type)) {
                const layer = item.layer as ElevationInfoLayer;
                const elevationMode = layer.elevationInfo?.mode;
                // section 3
                item.actionsSections.push(
                    new Collection([
                        {
                            title: `Elevation Mode: ${elevationMode ?? 'None'}`,
                            className: 'esri-icon-elevation-profile',
                            id: ItemActions.ElevationMode,
                        } as ActionButton,
                        {
                            title: 'Advanced Elevation Options',
                            className: 'esri-icon-settings2',
                            id: ItemActions.ElevationConfig,
                            visible:
                                (elevationMode && elevationMode === ElevationModes.AbsoluteHeight) ||
                                elevationMode === ElevationModes.RelativeToScene ||
                                elevationMode === ElevationModes.RelativeToGround,
                        } as ActionButton,
                    ])
                );
            }

            item.actionsSections.push(
                new Collection([
                    {
                        title: 'Configure Popups',
                        className: 'esri-icon-configure-popup',
                        id: ItemActions.ConfigurePopups,
                        visible: item.layer?.popupTemplate !== undefined,
                    } as ActionButton,
                    {
                        title: 'Configure Labels',
                        className: 'esri-icon-labels',
                        id: ItemActions.ConfigureLabels,
                        visible: item.layer?.labelingInfo !== undefined,
                    } as ActionButton,
                ])
            );

            const refreshableLayer = item.layer as unknown as RefreshableLayer;
            if (refreshableLayer) {
                refreshableLayer.refreshInterval = refreshableLayer.refreshInterval ?? 0;
                item.actionsSections.push(
                    new Collection([
                        {
                            title: formatRefreshIntervalTitle(refreshableLayer.refreshInterval),
                            className: 'esri-icon-refresh',
                            id: ItemActions.RefreshInterval,
                        } as ActionButton,
                    ])
                );
            }

            if (portalLayer?.portalItem?.itemUrl) {
                item.actionsSections.push(
                    new Collection([
                        {
                            title: 'View Portal Item',
                            className: 'esri-icon-launch-link-external',
                            id: ItemActions.ViewPortalItem,
                        } as ActionButton,
                    ])
                );
            }

            // Remove is always last
            const removeLayerAction = new Collection([
                {
                    title: 'Remove Layer',
                    className: 'esri-icon-close',
                    id: ItemActions.Remove,
                } as ActionButton,
            ]);

            item.actionsSections.push(removeLayerAction);
        }
    }

    return (
        <div>
            {isRenameDialogOpen && (
                <RenameLayerDialog
                    handleClose={handleDialogClose}
                    handleCancel={handleDialogCancel}
                    name={renameDialogValue}
                />
            )}
            {isNameGroupDialogOpen && (
                <NameGroupLayerDialog
                    handleClose={handleGroupDialogClose}
                    handleCancel={handleGroupDialogCancel}
                    name={nameGroupDialogValue}
                />
            )}
            {dialogItem === ItemActions.ConfigurePopups && selectedLayer && (
                <PopupConfigDialog
                    handleClose={() => {
                        setDialogItem(null);
                    }}
                    handleCancel={() => {
                        setDialogItem(null);
                    }}
                    layer={selectedLayer}
                />
            )}
            {dialogItem === ItemActions.ConfigureLabels && selectedLayer && (
                <LabelConfigDialog
                    handleClose={() => {
                        setDialogItem(null);
                    }}
                    handleCancel={() => {
                        setDialogItem(null);
                    }}
                    layer={selectedLayer}
                />
            )}
            {dialogItem === ItemActions.ElevationConfig && selectedLayer && (
                <ElevationOptionsDialog
                    handleClose={(elevationInfo) => {
                        selectedLayer.set('elevationInfo', elevationInfo);
                        setDialogItem(null);
                    }}
                    handleCancel={() => {
                        setDialogItem(null);
                    }}
                    layer={selectedLayer}
                />
            )}
            {isPushLayerDialogOpen && (
                <PushLayerDialog
                    handleCancel={handlePushDialogCancel}
                    handlePush={(missionId, defaultExpirationTimeHrs) => {
                        /** updated to support user defined expiration time */
                        pushLayerInfoToDB(missionId, gateApplicationId, layerToPush.current, defaultExpirationTimeHrs);
                    }}
                />
            )}
            <div ref={layerListRef} />
        </div>
    );
};
export default LayerList;
