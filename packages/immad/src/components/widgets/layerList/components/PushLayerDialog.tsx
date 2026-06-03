import React, { ChangeEvent, useEffect, useState } from 'react';
import { DialogContent, DialogTitle, Fade, MenuItem, Select, TextField, Tooltip, Typography } from '@mui/material';
import { InputField } from '../../../common';
import {
    WidgetDialogActions,
    StyledTimeBox,
    StyledHelperText,
    StyledModalPushLayerDialog,
    StyledSubHeaderBox,
    StyledErrorTextBox,
} from '../styles';
import { RightButton } from '../../../layout/styles';
import { ApplicationItem, getAllGATEApps } from '../../../gate/GateDataEditorHelper';
import { ConfigHelper } from '../../../../helpers/configHelper';
import { findPortalGroupByTitle, getGroupContentByGroupId } from '../../../../helpers/portalGroupHelper';
import { GateDynamicConfig } from '../../../administrator/components/GateDynamicConfig';
import { useAppSelector } from '../../../../hooks/hooks';

/**
 * Interface to handle callback and input data coming from
 * where the modal dialog is initialized.
 */
interface PushLayerDialogProps {
    handleCancel: () => void;
    handlePush: (missionId: string, defaultExpirationTimeHrs: number) => void;
}

/**
 * Modal Dialog for getting a URL input from the user.
 * @param props RenameLayerDialogProps
 * @constructor
 */
export default function PushLayerDialog(props: PushLayerDialogProps): JSX.Element {
    const appConfig = ConfigHelper.getAppConfig();
    const [open] = useState<boolean>(true);
    const [missions, setMissions] = useState<ApplicationItem[]>([]);
    const [selectedMissionId, setSelectedMissionId] = useState<string>('');
    const [selectedGroupError, setSelectedGroupError] = useState<string>('');
    const { handleCancel, handlePush } = props;
    const [selectedGroupId, setSelectedGroupId] = useState('');

    /** these two values hold state for the UI */
    const [expirationTimeQty, setExpirationTimeQty] = useState(1);
    const [expirationTimeUnits, setExpirationTimeUnits] = useState('Hours');

    /**initially holds the value from the config and after updating it holds the value passed back to the caller */
    const [defaultExpirationTimeHrs, setDefaultExpirationTimeHrs] = useState(1);
    const [showError, setShowError] = useState(false);
    const gateApplicationId = useAppSelector((state) => state.adminSettingsSlice.gateApplicationId);

    /**
     * Load the mission select drop down.
     */
    useEffect(() => {
        getAllGATEApps(
            appConfig.portalUrl,
            appConfig.typekeywords.gateExercise,
            appConfig.typekeywords.gateMission,
            appConfig.oauthAppId
        ).then((appItems) => {
            //load GATE mission names into picklist alphabetically - ascending
            const sortedAppItems = appItems.sort((appItemsA: ApplicationItem, appItemsB: ApplicationItem) =>
                appItemsA.title.localeCompare(appItemsB.title)
            );
            //filter out any duplicates by ID
            const filteredApplicationItems = filterOutApplicationItemDuplicates(sortedAppItems);
            setMissions(filteredApplicationItems);
        });
        if (gateApplicationId) {
            /** this is the default value set by the IMMAD administrator for push layers expiration time */
            ConfigHelper.loadGateAppConfigFromPortal(gateApplicationId).then((result: GateDynamicConfig) => {
                setExpirationTimeQty(result.dynamicLayerServiceDefaultExpirationTimeHrs);
            });
        }
    }, []);

    useEffect(() => {
        if (expirationTimeUnits === 'Hours') {
            setDefaultExpirationTimeHrs(expirationTimeQty);
        } else if (expirationTimeUnits === 'Days') {
            const hrs = 24 * expirationTimeQty;
            setDefaultExpirationTimeHrs(hrs);
        }
    }, [expirationTimeQty, expirationTimeUnits]);

    /**
     * Filter out duplicate application items from array.
     * @param array of Application Items
     */
    function filterOutApplicationItemDuplicates(array: ApplicationItem[]): ApplicationItem[] {
        const uniqueMap = new Map();
        array.forEach((item: ApplicationItem) => {
            uniqueMap.set(item.id, item);
        });
        return Array.from(uniqueMap.values());
    }

    /**
     * Change handler for the mission select
     * @param evt event object
     */
    async function selectedMissionChangeHandler(evt: ChangeEvent<HTMLInputElement>) {
        const groupName = evt.target.value;
        setSelectedMissionId(groupName);
        setSelectedGroupError('');

        const matchingGroupId = await getGroupIdBasedOnAGroupName(groupName, missions);
        matchingGroupId ? setSelectedGroupId(matchingGroupId) : setSelectedGroupId('');

        if (!matchingGroupId) {
            console.error('Failed to retrieve a valid portal group id for the group: ' + groupName);
            setSelectedGroupError('Mission was not found: ' + groupName);
            setShowError(true);
        } else {
            setSelectedGroupError('');
            setShowError(false);
        }
    }

    /**
     * Given a group name find the portal id for the group, if more than one group is found with the same name
     * then use the group with the same application item id as the picklist item
     * @param groupName name of the group in the picklist
     * @param gateAppItems application items representing GATE missions
     * @return Promise group id as a string or undefined if not found
     */
    async function getGroupIdBasedOnAGroupName(
        groupName: string,
        gateAppItems: ApplicationItem[]
    ): Promise<string | undefined> {
        const result = await findPortalGroupByTitle(groupName);
        const groups = result.item;
        let matchingGroup: any;
        if (groups && groups.length === 1) {
            matchingGroup = groups[0];
        } else if (groups && groups.length > 1) {
            //more than one group with the same name
            const app = gateAppItems.find((appItem) => appItem.title === groups[0].title);
            if (app) {
                for (let i = 0; i < groups.length; i++) {
                    const group = groups[i];
                    const groupContent = await getGroupContentByGroupId(group.id);
                    //find the group with the matching application id
                    const matchingGroupApp = groupContent.filter(
                        (content) => content.type === 'Application' && content.id === app.id
                    );
                    if (matchingGroupApp) {
                        matchingGroup = group;
                        break;
                    }
                }
            }
        }
        return matchingGroup ? matchingGroup.id : undefined;
    }

    /**
     * Handle time quantity change
     * @param event input change event
     */
    const expirationTimeQtyChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
        let expirationTime = Number(event.target.value);
        /** 1 hour is the minimum value */
        if (expirationTime < 1) {
            expirationTime = 1;
        } else if (expirationTime > 1000) {
            expirationTime = 1000;
        }
        /** no fractional units */
        setExpirationTimeQty(Math.floor(expirationTime));
    };

    /**
     * Handle time units change
     * @param event select change event
     */
    const expirationTimeUnitsChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
        setExpirationTimeUnits(event.target.value);
    };

    return (
        <StyledModalPushLayerDialog open={open} aria-labelledby='form-dialog-title'>
            <Fade in={open} timeout={500}>
                <div>
                    <DialogTitle id='form-dialog-title'>Push layer</DialogTitle>
                    <DialogContent>
                        <InputField
                            fullWidth
                            variant='outlined'
                            color='secondary'
                            select
                            required
                            value={selectedMissionId}
                            onChange={selectedMissionChangeHandler}
                            helperText={'Select Mission'}
                        >
                            {missions?.map((mission: ApplicationItem) => (
                                <MenuItem key={mission.title} value={mission.title}>
                                    {mission.title}
                                </MenuItem>
                            ))}
                        </InputField>

                        <StyledSubHeaderBox>
                            <Typography>Push layer will expire and be removed in:</Typography>
                        </StyledSubHeaderBox>
                        <StyledTimeBox>
                            <TextField
                                type='number'
                                size='small'
                                color='secondary'
                                value={expirationTimeQty}
                                onChange={expirationTimeQtyChangeHandler}
                                inputProps={{
                                    min: '1',
                                    max: '1000',
                                }}
                            />

                            <Select
                                size='small'
                                color='secondary'
                                fullWidth
                                value={expirationTimeUnits}
                                onChange={expirationTimeUnitsChangeHandler}
                            >
                                {['Hours', 'Days'].map((unit) => (
                                    <MenuItem key={unit} value={unit}>
                                        {unit}
                                    </MenuItem>
                                ))}
                            </Select>
                            <StyledHelperText>Select Quantity - min:1, max:1000</StyledHelperText>
                            <StyledHelperText>Select Time Unit</StyledHelperText>
                        </StyledTimeBox>

                        <WidgetDialogActions>
                            <RightButton
                                variant='contained'
                                color='primary'
                                onClick={() => {
                                    handleCancel();
                                }}
                            >
                                Cancel
                            </RightButton>
                            <Tooltip title={selectedGroupError}>
                                <span>
                                    <RightButton
                                        variant='contained'
                                        color='secondary'
                                        disabled={!selectedGroupId}
                                        onClick={() => {
                                            handlePush(selectedGroupId, defaultExpirationTimeHrs);
                                        }}
                                    >
                                        Push Layer
                                    </RightButton>
                                </span>
                            </Tooltip>
                        </WidgetDialogActions>
                        {showError && <StyledErrorTextBox>{selectedGroupError}</StyledErrorTextBox>}
                    </DialogContent>
                </div>
            </Fade>
        </StyledModalPushLayerDialog>
    );
}
