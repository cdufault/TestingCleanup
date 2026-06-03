import React, { useContext, useEffect, useRef, useState } from 'react';
import OfflineIcon from 'calcite-ui-icons-react/OfflineIcon';
import OnlineIcon from 'calcite-ui-icons-react/OnlineIcon';
import CloudIcon from 'calcite-ui-icons-react/CloudIcon';
import { IconButton, Popover, Switch, FormControlLabel, MenuList, MenuItem } from '@mui/material';
import { useInterval } from '../../../../hooks/useInterval';
import { useSnackbar } from 'notistack';
import footprintHelper from './helpers/footprintHelper';
import { MapContext } from '../../../../contexts/Map';
import MapView from '@arcgis/core/views/MapView';
import SceneView from '@arcgis/core/views/SceneView';
import { getPortalUserProperties } from '../../../../helpers/portalUsersHelper';

export default function RemoteView(): JSX.Element {
    const { mapViewInitialized, sceneViewInitialized, getMapView, getSceneView } = useContext(MapContext);
    const activeView = useRef<MapView | SceneView>();
    const addToLayerList = useRef<boolean>(true);
    const pollDelay = useRef<number>(5000);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

    const [listenForConnection, setListenForConnection] = useState<boolean | undefined>();
    const [syncImageFootprint, setSyncImageFootprint] = useState<boolean>(false);
    const [syncMapExtentFootprint, setSyncMapExtentFootprint] = useState<boolean>(false);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        loadUserProperties();
    }, []);

    useEffect(() => {
        const mapView = getMapView() as MapView;
        if (mapView) {
            activeView.current = mapView;
        }
    }, [mapViewInitialized]);

    useEffect(() => {
        const sceneView = getSceneView() as SceneView;
        if (sceneView) {
            activeView.current = sceneView;
        }
    }, [sceneViewInitialized]);

    useEffect(() => {
        if (!listenForConnection && isConnected) {
            setIsConnected(false);
        }
    }, [listenForConnection]);

    useEffect(() => {
        if (activeView.current && !syncImageFootprint) {
            const helper = new footprintHelper(activeView.current);
            helper.hideImageFootprint();
        }
    }, [syncImageFootprint]);

    useEffect(() => {
        if (activeView.current && !syncMapExtentFootprint) {
            const helper = new footprintHelper(activeView.current);
            helper.hideMapExtentFootprint();
        }
    }, [syncMapExtentFootprint]);

    useEffect(() => {
        if (isConnected && listenForConnection) {
            enqueueSnackbar('RemoteView Connected', {
                variant: 'success',
            });
        } else if (listenForConnection) {
            enqueueSnackbar('RemoteView Disconnected', {
                variant: 'error',
            });
        }
    }, [isConnected]);

    const runRemoteViewSync = async () => {
        if (activeView.current) {
            const helper = new footprintHelper(activeView.current);
            if (listenForConnection) {
                const isConnected = await helper.runSyncScripts(
                    syncImageFootprint,
                    syncMapExtentFootprint,
                    addToLayerList.current
                );
                setIsConnected(isConnected);
            }
        }
    };

    useInterval(runRemoteViewSync, pollDelay.current, listenForConnection);

    const loadUserProperties = async () => {
        const result = await getPortalUserProperties();
        if (result) {
            if (!result.immadDisplaySettings) {
                //No settings stored so use defaults
                setListenForConnection(true);
                addToLayerList.current = true;
                pollDelay.current = 5000;
            } else {
                setListenForConnection(result.immadDisplaySettings.listenForConnection);
                addToLayerList.current = result.immadDisplaySettings.addToLayerList;
                pollDelay.current = result.immadDisplaySettings.pollDelay * 1000;
            }
        } else {
            //If no results set the default properties
            setListenForConnection(true);
            addToLayerList.current = true;
            pollDelay.current = 5000;
        }
    };

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <div>
            <IconButton
                aria-label='RemoteView'
                size='small'
                title={
                    !listenForConnection
                        ? 'Not listening for RemoteView Connection'
                        : isConnected
                        ? 'RemoteView Connected'
                        : 'RemoteView Not Connected'
                }
                onClick={handleClick}
                style={{ marginInline: '1rem' }}
            >
                {!listenForConnection ? (
                    <CloudIcon size={16} color='#808080' />
                ) : isConnected ? (
                    <OnlineIcon size={16} />
                ) : (
                    <OfflineIcon size={16} />
                )}
            </IconButton>

            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
            >
                <MenuList>
                    <MenuItem key='1'>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={listenForConnection}
                                    onChange={(event) => {
                                        setListenForConnection(event.target.checked);
                                    }}
                                />
                            }
                            label='Listen for Connection'
                        />
                    </MenuItem>
                    <MenuItem key='2'>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={syncImageFootprint}
                                    onChange={(event) => {
                                        setSyncImageFootprint(event.target.checked);
                                    }}
                                />
                            }
                            label='Sync Image Footprint'
                        />
                    </MenuItem>
                    <MenuItem key='3'>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={syncMapExtentFootprint}
                                    onChange={(event) => {
                                        setSyncMapExtentFootprint(event.target.checked);
                                    }}
                                />
                            }
                            label='Sync Map Extent Footprint'
                        />
                    </MenuItem>
                </MenuList>
            </Popover>
        </div>
    );
}
