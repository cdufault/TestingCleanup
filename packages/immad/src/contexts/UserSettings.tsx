import React, { createContext, useContext, useEffect, useState } from 'react';
import { getMidDayAtLongitude } from '../helpers/dateTimeHelper';

import { MapContext } from './Map';
import { ConfigHelper } from '../helpers/configHelper';
import {
    getPortalUserProperties,
    ImmadDisplaySettings,
    updatePortalUserProperties,
    UserProperties,
} from '../helpers/portalUsersHelper';
import units from '@arcgis/core/core/units';
import { useSnackbar } from 'notistack';
import { updateAtmosphereIsEnabled, updateLightingIsEnabled } from '../components/UserSettingsSlice';
import { useAppDispatch, useAppSelector } from '../hooks/hooks';
import VirtualLighting from '@arcgis/core/views/3d/environment/VirtualLighting';
import SunLighting from '@arcgis/core/views/3d/environment/SunLighting';

export interface UserSettingsProviderProps {
    children: JSX.Element[] | JSX.Element;
}

/**
 * Properties and setters for user settings.
 * TODO: any future updates to code that touches one of these properties should include moving the prop
 * out of this context into the new UserSettingsSlice.tsx
 */
interface ContextProps {
    defaultPopupEnabled: boolean;
    setDefaultPopupEnabled: (isEnabled: boolean) => void;
    distanceUnit: string | undefined;
    setDistanceUnit: (unit: string) => void;
    areaUnit: string | undefined;
    setAreaUnit: (unit: string) => void;
    saveUserPropertiesToPortalAsync: () => Promise<__esri.RequestResponse> | undefined;
    listenForConnection: boolean;
    setListenForConnection: (isEnabled: boolean) => void;
    addToLayerList: boolean;
    setAddToLayerList: (isEnabled: boolean) => void;
    pollDelay: number;
    setPollDelay: (delay: number) => void;
    lightingIsEnabled: boolean;
    atmosphereIsEnabled: boolean;
    setLightingIsEnabled: (isEnabled: boolean) => void;
    setAtmosphereIsEnabled: (isEnabled: boolean) => void;
}

export const UserSettingsContext = createContext<ContextProps>({
    defaultPopupEnabled: true,
    setDefaultPopupEnabled: () => {
        return;
    },
    distanceUnit: '',
    setDistanceUnit: () => {
        return;
    },
    areaUnit: '',
    setAreaUnit: () => {
        return;
    },
    saveUserPropertiesToPortalAsync: () => {
        return undefined;
    },
    listenForConnection: true,
    setListenForConnection: () => {
        return undefined;
    },
    addToLayerList: true,
    setAddToLayerList: () => {
        return undefined;
    },
    pollDelay: 5,
    setPollDelay: () => {
        return;
    },
    lightingIsEnabled: true,
    setLightingIsEnabled: () => {
        return;
    },
    atmosphereIsEnabled: false,
    setAtmosphereIsEnabled: () => {
        return;
    },
});

export const UserSettingsProvider = ({ children }: UserSettingsProviderProps): JSX.Element => {
    const appConfig = ConfigHelper.getAppConfig();

    const [defaultPopupEnabled, setDefaultPopupEnabled] = useState<boolean>(true);
    const [distanceUnit, setDistanceUnit] = useState<string>();
    const [areaUnit, setAreaUnit] = useState<string>();
    const [listenForConnection, setListenForConnection] = useState<boolean>(true);
    const [addToLayerList, setAddToLayerList] = useState<boolean>(true);
    const [pollDelay, setPollDelay] = useState<number>(5);
    const [lightingIsEnabled, setLightingIsEnabled] = useState<boolean>(true);
    const [atmosphereIsEnabled, setAtmosphereIsEnabled] = useState<boolean>(false);

    const { enqueueSnackbar } = useSnackbar();

    const { activeView, sceneViewInitialized, getMapView, getSceneView, sceneView } = useContext(MapContext);

    const dispatch = useAppDispatch();
    const atmosphereEnabled = useAppSelector((state: any) => state.userSettingsSlice.atmosphereIsEnabled);
    const lightingEnabled = useAppSelector((state: any) => state.userSettingsSlice.lightingIsEnabled);

    const saveUserPropertiesToPortalAsync = async () => {
        const userProperties: UserProperties = {
            immadDisplaySettings: {
                distanceUnit: distanceUnit as units.SystemOrLengthUnit,
                areaUnit: areaUnit as units.SystemOrAreaUnit,
                defaultPopupEnabled: defaultPopupEnabled,
                lightingEnabled: lightingEnabled,
                atmosphereEnabled: atmosphereEnabled,
                listenForConnection: listenForConnection,
                addToLayerList: addToLayerList,
                pollDelay: pollDelay,
            } as ImmadDisplaySettings,
        } as UserProperties;
        try {
            return await updatePortalUserProperties(JSON.stringify(userProperties));
        } catch {
            console.error('Unable to update user properties.');
            return undefined;
        }
    };

    const getUserPropertiesFromPortalAsync = async () => {
        try {
            const result = await getPortalUserProperties();
            //use settings from portal
            if (result && result.immadDisplaySettings) {
                setDistanceUnit(result.immadDisplaySettings.distanceUnit ?? 'meters');
                setAreaUnit(result.immadDisplaySettings.areaUnit ?? 'meters');
                setDefaultPopupEnabled(result.immadDisplaySettings.defaultPopupEnabled ?? true);
                dispatch(updateLightingIsEnabled(result.immadDisplaySettings.lightingEnabled ?? true));
                dispatch(updateAtmosphereIsEnabled(result.immadDisplaySettings.atmosphereEnabled ?? true));
                setListenForConnection(result.immadDisplaySettings.listenForConnection ?? true);
                setAddToLayerList(result.immadDisplaySettings.addToLayerList ?? true);
                setPollDelay(result.immadDisplaySettings.pollDelay ?? 5);
            }
            //use settings from config
            else if (appConfig && appConfig.settings) {
                setDistanceUnit('meters');
                setAreaUnit('square-kilometers');
                setListenForConnection(true);
                setAddToLayerList(true);
                setDefaultPopupEnabled(true);
                dispatch(updateLightingIsEnabled(!ConfigHelper.getAppConfig().settings.disableSceneLighting));
                dispatch(updateAtmosphereIsEnabled(!ConfigHelper.getAppConfig().settings.disableAtmosphere));
                setPollDelay(5);
            }
            //use set values
            else {
                setDistanceUnit('meters');
                setAreaUnit('square-kilometers');
                setDefaultPopupEnabled(true);
                dispatch(updateLightingIsEnabled(true));
                dispatch(updateAtmosphereIsEnabled(false));
                setListenForConnection(true);
                setAddToLayerList(true);
                setPollDelay(5);
            }
        } catch {
            console.error('Unable to retrieve user properties.');
        }
    };

    //on load
    useEffect(() => {
        getUserPropertiesFromPortalAsync();
    }, []);

    // synchronize Redux and Context states
    useEffect(() => {
        setLightingIsEnabled(lightingEnabled);
    }, [lightingEnabled]);

    const handleSetLightingIsEnabled = (lightingValue: boolean) => {
        if (lightingIsEnabled !== lightingValue) {
            setLightingIsEnabled(lightingValue);
        }
        dispatch(updateLightingIsEnabled(lightingValue));
    };

    // synchronize Redux and Context states
    useEffect(() => {
        setAtmosphereIsEnabled(atmosphereEnabled);
    }, [atmosphereEnabled]);

    const handleSetAtmosphereIsEnabled = (atmosphereValue: boolean) => {
        if (atmosphereIsEnabled !== atmosphereValue) {
            setAtmosphereIsEnabled(atmosphereValue);
        }
        dispatch(updateAtmosphereIsEnabled(atmosphereValue));
    };

    //on load
    useEffect(() => {
        const view = getSceneView();
        console.log('view check', view);
    }, [activeView, sceneView]);

    //turn on/off lighting and override location
    useEffect(() => {
        if (activeView !== 'SCENE' || !sceneViewInitialized) return;

        const applySceneLighting = async () => {
            const view = await getSceneView();
            if (!view) {
                console.warn('Scene view not yet initialized — lighting update skipped.');
                return;
            }

            if (!lightingIsEnabled) {
                view.environment.lighting = {
                    type: 'virtual',
                    directShadowsEnabled: false,
                } as VirtualLighting;
            } else {
                //get rough timestamp for noon at current location
                const mapDate = getMidDayAtLongitude(view.camera.position.longitude);
                view.environment.lighting = {
                    type: 'sun',
                    directShadowsEnabled: false,
                    //set daylight to follow viewpoint
                    cameraTrackingEnabled: true,
                    date: mapDate,
                } as SunLighting;
            }
            // this will always be set to false currently until there is a JSAPI update due to a bug in JSAPI v.4.31
            view.environment.atmosphereEnabled = atmosphereIsEnabled;
        };
        applySceneLighting();
    }, [activeView, lightingIsEnabled, atmosphereIsEnabled, sceneViewInitialized]);

    useEffect(() => {
        const view = activeView === 'MAP' ? getMapView() : getSceneView();
        if (view?.popup) {
            view.popup.defaultPopupTemplateEnabled = defaultPopupEnabled;
            if (defaultPopupEnabled) {
                enqueueSnackbar('Enabled Default Popups.', { variant: 'info' });
            } else {
                enqueueSnackbar('Disabled Default Popups.', { variant: 'info' });
            }
        }
    }, [defaultPopupEnabled]);

    const value = {
        defaultPopupEnabled,
        setDefaultPopupEnabled,
        distanceUnit,
        setDistanceUnit,
        areaUnit,
        setAreaUnit,
        saveUserPropertiesToPortalAsync,
        listenForConnection,
        setListenForConnection,
        addToLayerList,
        setAddToLayerList,
        pollDelay,
        setPollDelay,
        lightingIsEnabled,
        setLightingIsEnabled: handleSetLightingIsEnabled, // updates both slice and context
        atmosphereIsEnabled,
        setAtmosphereIsEnabled: handleSetAtmosphereIsEnabled, // updates both slice and context
    } as ContextProps;

    return <UserSettingsContext.Provider value={value}>{children}</UserSettingsContext.Provider>;
};
