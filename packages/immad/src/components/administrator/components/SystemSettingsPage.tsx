// React imports
import React, { useEffect, useReducer, useState } from 'react';

// Component imports
import Typography from '@mui/material/Typography';
import { createFeatureService, updatePortalWebApp } from '../../../helpers/portalItemsHelper';
import { ConfigHelper } from '../../../helpers/configHelper';
import { useSnackbar } from 'notistack';

// Style imports
import { StyledPortalItemSelectBox, StyledRightButton } from '../styles';
import Portal from '@arcgis/core/portal/Portal';
import PortalItem from '@arcgis/core/portal/PortalItem';
import { PortalItemSelect } from '@stratcom/react-widget-lib';
import { theme } from '../../../styles/theme';
import { FieldGroup } from '../../common';
import { GateDynamicConfig } from './GateDynamicConfig';
import { shareItemsWithGroupLib } from '../../../helpers/portalGroupHelper';
import { findPortalGroupsByTag, getPortalUserSession } from '@stratcom/lib-functions';
import { getDefaultPortal } from '../../../helpers/defaultPortalHelper';
import { IGroup } from '@esri/arcgis-rest-portal';
import { IconButton, Stack } from '@mui/material';
import AddInNewIcon from 'calcite-ui-icons-react/AddInNewIcon';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import { ConfirmationDialog } from '../../common/ConfirmationDialog';
import { PortalAppSettings } from '../../../interfaces/AnalyticsGPTypes';

import {
    setGateApplicationId,
    setSliceDefaultExpirationTimeHrs,
    setSliceDynamicServicelayerId,
    setSlicePollingInterval,
} from './AdminSettingsSlice';
import { useAppDispatch, useAppSelector } from '../../../hooks/hooks';
import { joinLabel } from '../../../Constants';

type GateAppSettings = {
    dynamicLayerServiceId: { itemId: string };
    dynamicLayerServicePollIntervalMins: number;
    dynamicLayerServiceDefaultExpirationTimeHrs: number;
};

type AppReducerFields = keyof PortalAppSettings;

interface UserAction {
    type: AppReducerFields;
    payload: string;
}

type AppSettingsReducer = (state: PortalAppSettings, action: UserAction) => PortalAppSettings;

const reducer: AppSettingsReducer = (state: PortalAppSettings, action: UserAction) => {
    switch (action.type) {
        case 'savedState':
            return {
                ...state,
                [action.type]: {
                    ...state.savedState,
                    itemId: action.payload,
                },
            };
        default:
            throw new Error('Missed Item!');
    }
};

const actionCreator = (type: AppReducerFields, payload: string) => ({
    type,
    payload,
});

type GateConfigData = {
    configurationData: GateDynamicConfig;
};

/**
 * The system settings panel for the Administration page.
 * @constructor
 */
export default function SystemSettingsPage(): JSX.Element {
    let appConfigPortal = ConfigHelper.getAppConfigPortal();

    // Added for toast messages
    const { enqueueSnackbar } = useSnackbar();

    const initialState: PortalAppSettings = {
        savedState: {
            itemId: '',
        },
        gateAppPortalItemId: '',
    };

    const initialGateState: GateAppSettings = {
        dynamicLayerServiceId: {
            itemId: '',
        },
        dynamicLayerServiceDefaultExpirationTimeHrs: 24,
        dynamicLayerServicePollIntervalMins: 1,
    };

    const [immadState, dispatch] = useReducer(reducer, appConfigPortal ?? initialState);

    const [isDisabled, setIsDisabled] = useState<boolean>(true);
    const [isPublishing, setIsPublishing] = useState<boolean>(false);

    const [dynamicLayerServiceId, setDynamicLayerServiceId] = useState<string>('');
    const [pollingInterval, setPollingInterval] = useState<number>(30);
    const [defaultExpirationTimeHrs, setDefaultExpirationTimeHrs] = useState<number>(24);

    const [showPublishConfirmation, setShowPublishConfirmation] = useState<boolean>(false);
    const gateAppIdFromSlice = useAppSelector((state) => state.adminSettingsSlice.gateApplicationId);
    const [newSelectedGateAppId, setNewSelectedGateAppId] = useState('');
    const appSettingSliceDispatch = useAppDispatch();

    useEffect(() => {
        // set default settings for page.
        loadDataFromGateAndImmadApplicationObjects();
    }, []);

    useEffect(() => {
        setGateApplicationId(newSelectedGateAppId);
    }, [newSelectedGateAppId]);

    useEffect(() => {
        setSliceDynamicServicelayerId(dynamicLayerServiceId);
    }, [dynamicLayerServiceId]);

    useEffect(() => {
        setSlicePollingInterval(pollingInterval);
    }, [pollingInterval]);

    useEffect(() => {
        setSliceDefaultExpirationTimeHrs(defaultExpirationTimeHrs);
    }, [defaultExpirationTimeHrs]);

    /**
     * Gets the GATE application configuration from Portal.
     * @param gateAppId the portal item id for the GATE app - this app is created outside of IMMAD and
     * will first need to be hydrated by the GATE configuration page
     */
    const getGateAppConfigFromPortal = async (gateAppId: string | undefined): Promise<GateConfigData | null> => {
        try {
            if (gateAppId) {
                const config = await ConfigHelper.loadGateAppConfigFromPortal(gateAppId);
                if (config) {
                    return { configurationData: config };
                }
                //Removed Errors here as these should be warnings to set up the application vs it being an error.
                console.warn('GATE app configuration was not found for id: ' + gateAppId);
            } else {
                console.warn('No portal item id was provided to get GATE application ID.');
            }
        } catch (error) {
            console.error(
                `Error getting GATE application config for id: ${gateAppId}. Message: ` + error.message,
                error
            );
        }
        return null;
    };

    /**
     * Loads settings from Portal. This includes both IMMAD and GATE settings
     */
    async function loadDataFromGateAndImmadApplicationObjects() {
        try {
            appConfigPortal = await ConfigHelper.loadAppConfigFromPortal();
            dispatch(actionCreator('savedState', appConfigPortal.savedState?.itemId ?? initialState.savedState.itemId));
            setNewSelectedGateAppId(appConfigPortal.gateAppPortalItemId ? appConfigPortal.gateAppPortalItemId : '');

            const gateConfig = (await getGateAppConfigFromPortal(
                appConfigPortal.gateAppPortalItemId
            )) as GateConfigData;

            setDynamicLayerServiceId(
                gateConfig?.configurationData?.dynamicLayerServiceId?.itemId ??
                    initialGateState.dynamicLayerServiceId.itemId
            );
            setPollingInterval(
                gateConfig?.configurationData?.dynamicLayerServicePollIntervalMins ??
                    initialGateState.dynamicLayerServicePollIntervalMins
            );
            setDefaultExpirationTimeHrs(
                gateConfig?.configurationData?.dynamicLayerServiceDefaultExpirationTimeHrs ??
                    initialGateState.dynamicLayerServiceDefaultExpirationTimeHrs
            );
            !gateConfig ?? console.warn('Gate app config was not found. Setting PUSH related values to defaults.');
        } catch (error) {
            console.error(`Error getting App Config: ${error.message}`, error);
        }
    }

    /**
     * Handle the GATE application portal item change
     * @param portalItem newly selected portalItem
     */
    function gateAppChanged(portalItem: PortalItem | null) {
        if (portalItem) {
            setNewSelectedGateAppId(portalItem.id);
        }
    }

    /**
     * Create a mock GATE config template - useful for development and testing only
     * @returns mock GateConfigData structure with no real data
     */
    function createEmptyGateConfigTemplate(): GateConfigData {
        const gateAppConfigFromPortal = {
            configurationData: {
                regionFeatureClassId: '',
                landingPageCategoriesFeatureClassId: '',
                gateCalendarFeatureClassId: '',
                j2SummaryFeatureClassId: '',
                sourcesFeatureClassId: '',
                analystCommentsFeatureClassId: '',
                analystCommentsAlias: '',
                brandingTitleAlias: '',
                brandingSubtitleAlias: '',
                brandingLogo: '',
                highInterestEventCardTitle: '',
                dynamicLayerServiceId: {
                    itemId: '',
                },
                dynamicLayerServicePollIntervalMins: 0,
                dynamicLayerServiceDefaultExpirationTimeHrs: 0,
                systemHighClassification: '',
            },
        };
        return gateAppConfigFromPortal;
    }

    /**
     * Update the data in the IMMAD and GATE application objects based on the current UI data.
     * @param gateAppId id for the GATE application
     * @param immadAppId id for the IMMAD application
     * @param immadCurrentState current values in the IMMAD application object
     * @param gateCurrentState current values in the GATE application object
     * @param dynamicLayerId portal item id of the layer holding the push data
     * @param pollingIntervalMins frequency to check for updates
     * @param expirationTimeHrs number hours push layer is valid
     * @returns boolean indicating if the update was successful (true) otherwise false
     */
    async function writeNewValuesToGateAndImmadAppObject(
        gateAppId: string,
        immadAppId: string,
        immadCurrentState: PortalAppSettings,
        dynamicLayerId: string,
        pollingIntervalMins: number,
        expirationTimeHrs: number
    ): Promise<boolean> {
        immadCurrentState.gateAppPortalItemId = gateAppId; //updates on the portalWebApp not GATE
        // call rest endpoint and set values to those in the state object
        const result = await updatePortalWebApp(immadAppId, JSON.stringify(immadCurrentState));

        let updatedWithoutError = true;
        if (result.success) {
            const gateAppConfigFromPortal = await getGateAppConfigFromPortal(gateAppId);
            if (!gateAppConfigFromPortal) {
                //implemented for testing/development purposes only - client should first configure the GATE app before
                //accessing this page but when developing it can be useful to not have to first configure GATE
                //gateAppConfigFromPortal = createEmptyGateConfigTemplate();//can use an configure a mock GATE app
            }
            if (gateAppConfigFromPortal) {
                if (gateAppConfigFromPortal?.configurationData) {
                    gateAppConfigFromPortal.configurationData.dynamicLayerServiceId = { itemId: dynamicLayerId };
                    gateAppConfigFromPortal.configurationData.dynamicLayerServicePollIntervalMins = pollingIntervalMins;
                    gateAppConfigFromPortal.configurationData.dynamicLayerServiceDefaultExpirationTimeHrs =
                        expirationTimeHrs;
                }
                const result = await updatePortalWebApp(gateAppId, JSON.stringify(gateAppConfigFromPortal));
                console.debug(JSON.stringify(result, null, 2));
            } else {
                console.error('Failed to find a GATE application object for id: ' + gateAppId);
                updatedWithoutError = false;
            }
        } else {
            // log error
            console.error('Update item response was unsuccessful for item id: ' + immadAppId);
            console.debug('Update item response: ' + JSON.stringify(result, null, 2));
            updatedWithoutError = false;
        }
        return updatedWithoutError;
    }

    /**
     * Handle the save changes button click event
     */
    async function saveButtonClicked() {
        appSettingSliceDispatch(setGateApplicationId(newSelectedGateAppId));
        const staticAppConfig = ConfigHelper.getAppConfig();
        const updatedOK = await writeNewValuesToGateAndImmadAppObject(
            newSelectedGateAppId,
            staticAppConfig.portalConfigItemId,
            immadState,
            dynamicLayerServiceId,
            pollingInterval,
            defaultExpirationTimeHrs
        );
        if (updatedOK) {
            enqueueSnackbar('Updated System Settings Successfully', { variant: 'success' });
        } else {
            enqueueSnackbar('Error occurred updating system settings. See console logs for more details.', {
                variant: 'error',
            });
        }
        setIsDisabled(true); //disables editing
    }

    /**
     * Handle the edit button click event.
     */
    function editButtonClicked() {
        setIsDisabled(false);
    }

    /**
     * Handle the cancel editing button click event.
     */
    function cancelButtonClicked() {
        loadDataFromGateAndImmadApplicationObjects().then(() => {
            //restore all previous values
            setIsDisabled(true);
        });
    }

    /**
     * Publish the Dynamic Layer Feature Service
     */
    async function handlePublish() {
        enqueueSnackbar('Publishing Dynamic Layer Feature Service...', { variant: 'info' });
        setIsPublishing(true);
        try {
            const staticAppConfig = ConfigHelper.getAppConfig();
            const portal = await getDefaultPortal();
            if (portal) {
                await portal.load();
                const userSession = await getPortalUserSession(portal.url, staticAppConfig.oauthAppId);

                const layerDefJson = staticAppConfig.gate.dynamicLayerServiceTemplate;
                const featureDefJson = staticAppConfig.gate.dynamicFeatureServiceTemplate;

                if (userSession && layerDefJson) {
                    const portalItem = await createFeatureService(
                        'GATEDynamicLayerService_v1',
                        'GATE Dynamic Layer Service',
                        featureDefJson,
                        layerDefJson
                    );

                    if (portalItem) {
                        await portalItem.load();

                        setDynamicLayerServiceId(portalItem.id ?? '');

                        // post creation settings.

                        const missionMgrTag = staticAppConfig.roles.missionManager.tag;

                        let missionMgrGroup: IGroup | null = null;

                        try {
                            const result = await findPortalGroupsByTag(missionMgrTag, userSession);

                            if (result.success && result.item.length > 0) {
                                missionMgrGroup = result.item[0];
                            } else {
                                console.warn(`Failed to find a group with the tag ${missionMgrTag}.`);
                            }
                        } catch (error) {
                            console.error(error.message, error);
                        }

                        try {
                            let result: any;

                            if (missionMgrGroup) {
                                result = await shareItemsWithGroupLib(
                                    portalItem.id,
                                    missionMgrGroup ? [missionMgrGroup.id] : [],
                                    true
                                );
                            } else {
                                result = await shareItemsWithGroupLib(portalItem.id, [], true);
                            }

                            if (!result) {
                                console.error('Error sharing item to groups..');
                                enqueueSnackbar(
                                    'Error sharing items to groups. Please ensure that this layer is shared with the organization.',
                                    { variant: 'warning' }
                                );
                            } else {
                                enqueueSnackbar('Successfully Published the Service. Select Save to commit changes.', {
                                    variant: 'success',
                                });
                            }
                        } catch (error) {
                            console.error(error.message, error);
                        }
                    }
                }
            }
        } catch (e) {
            console.error(e.message, e);
        } finally {
            setIsPublishing(false);
        }
    }

    async function onPortalItemSelectChanged(item: PortalItem | null) {
        if (item) {
            dispatch(actionCreator('savedState', item?.id ?? ''));
        } else {
            dispatch(actionCreator('savedState', ''));
        }
    }

    return (
        <>
            <Typography variant='h4' gutterBottom={true}>
                {joinLabel(ConfigHelper.getAppConfig()?.appLabel ?? '', 'Settings')}
                {isDisabled ? (
                    <StyledRightButton variant='contained' color='secondary' onClick={editButtonClicked}>
                        Edit
                    </StyledRightButton>
                ) : (
                    <>
                        <StyledRightButton
                            variant='contained'
                            color='secondary'
                            type='submit'
                            onClick={saveButtonClicked}
                        >
                            Save
                        </StyledRightButton>
                        <StyledRightButton
                            variant='contained'
                            color='primary'
                            onClick={cancelButtonClicked}
                            title={'Cancel edits.'}
                        >
                            Cancel
                        </StyledRightButton>
                    </>
                )}
            </Typography>

            <FieldGroup>
                <PortalItemSelect
                    theme={theme}
                    portal={Portal.getDefault() as Portal}
                    label={'Saved State Table'}
                    disabled={isDisabled}
                    query={"type: 'feature'"}
                    portalItemID={immadState?.savedState?.itemId || ''}
                    onItemChange={onPortalItemSelectChanged}
                />
            </FieldGroup>

            <StyledPortalItemSelectBox>
                <Typography variant='h4' gutterBottom={false}>
                    {joinLabel(ConfigHelper.getAppConfig()?.gate?.gateLabel ?? '', 'Settings')}
                </Typography>
            </StyledPortalItemSelectBox>

            <FieldGroup>
                <Typography variant={'h6'} gutterBottom={true}>
                    {joinLabel('Push to', ConfigHelper.getAppConfig()?.gate?.gateLabel ?? '', '(Dynamic Layers)')}
                </Typography>

                <FieldGroup>
                    <Stack direction={'row'}>
                        <PortalItemSelect
                            theme={theme}
                            portal={Portal.getDefault() as Portal}
                            label={'Dynamic Layer Service'}
                            disabled={isDisabled || isPublishing}
                            query={"type: 'feature'"}
                            portalItemID={dynamicLayerServiceId}
                            onItemChange={(item: PortalItem | null) => {
                                setDynamicLayerServiceId(item?.id ?? '');
                            }}
                        />

                        {!isDisabled && !isPublishing && !dynamicLayerServiceId && (
                            <IconButton onClick={() => setShowPublishConfirmation(true)} title={'Create Service'}>
                                <AddInNewIcon size={16} />
                            </IconButton>
                        )}
                        {isPublishing && <CircularProgress variant={'indeterminate'} />}
                        <ConfirmationDialog
                            description={
                                `This will publish a new service for the${(ConfigHelper.getAppConfig()?.gate?.gateLabel ?? '') ? ' ' + ConfigHelper.getAppConfig().gate.gateLabel : ''} Push Dynamic Layer functionality. Do you wish to continue?`
                            }
                            open={showPublishConfirmation}
                            title={'Publish Dynamic Service'}
                            onClose={() => setShowPublishConfirmation(false)}
                            onSubmit={() => {
                                setShowPublishConfirmation(false);
                                handlePublish().then(() => {
                                    setIsPublishing(false);
                                });
                            }}
                        />
                    </Stack>
                </FieldGroup>
                <StyledPortalItemSelectBox>
                    <FieldGroup>
                        <TextField
                            fullWidth
                            type={'number'}
                            disabled={isDisabled}
                            label={'Dynamic Layer Service Polling Interval (min)'}
                            value={pollingInterval}
                            InputProps={{ inputProps: { min: 1, step: 1 } }}
                            onChange={(e) => {
                                let value = parseInt(e.target.value, 10);
                                if (value < 1) {
                                    value = 1;
                                }
                                setPollingInterval(value);
                            }}
                        />
                    </FieldGroup>
                </StyledPortalItemSelectBox>
                <StyledPortalItemSelectBox>
                    <FieldGroup>
                        <TextField
                            fullWidth
                            type={'number'}
                            disabled={isDisabled}
                            label={'Dynamic Layer Default Expiration Time (hr)'}
                            value={defaultExpirationTimeHrs}
                            InputProps={{ inputProps: { min: 0, step: 1 } }}
                            onChange={(e) => {
                                let value = parseInt(e.target.value, 10);
                                if (value < 0) {
                                    value = 0;
                                }
                                setDefaultExpirationTimeHrs(value);
                            }}
                        />
                    </FieldGroup>
                </StyledPortalItemSelectBox>

                <StyledPortalItemSelectBox>
                    <FieldGroup>
                        <PortalItemSelect
                            theme={theme}
                            portal={Portal.getDefault() as Portal}
                            label={joinLabel(ConfigHelper.getAppConfig()?.gate?.gateLabel ?? '', 'Application')}
                            disabled={isDisabled}
                            query={"type: 'application'"}
                            portalItemID={newSelectedGateAppId ? newSelectedGateAppId : gateAppIdFromSlice}
                            onItemChange={gateAppChanged}
                        />
                    </FieldGroup>
                </StyledPortalItemSelectBox>
            </FieldGroup>
        </>
    );
}
