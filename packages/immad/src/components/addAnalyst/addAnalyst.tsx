import React, { useState, useEffect, useRef } from 'react';
import UserPlusIcon from 'calcite-ui-icons-react/UserPlusIcon';

import { Grid, ButtonGroup } from '@mui/material';
import { IconButton } from '@mui/material';
import Analysts from './analysts';
import { ConfigHelper } from '../../helpers/configHelper';
import { AddAnalystButtonContainer, AddAnalystDialogBody, AddAnalystModalDialog } from './styles';
import { StyledButton } from '../layout/styles';
import { UserRoles } from '../../contexts/App';

import { useSnackbar } from 'notistack';
import { addUsersToGroupById, getPortalGroupUsers, removeUsersFromPortalGroup } from '../../helpers/portalUsersHelper';
import { DEFAULT_MISSION } from '../../data/savedState';
import { updateAnalystsInTheMission } from '../home/components/missionCreate/MissionCreationSlice';
import { useAppDispatch } from '../../hooks/hooks';

interface AddAnalystProps {
    userRoles: UserRoles;
    portalGroupId: string;
    selectedMission: string;
}

export default function AddAnalyst(props: AddAnalystProps): JSX.Element {
    const { userRoles, portalGroupId, selectedMission } = props;
    const { enqueueSnackbar } = useSnackbar();
    const [config] = useState(ConfigHelper.getAppConfig());
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isEnabled, setIsEnabled] = useState(false);
    const [analystNames, setAnalystNames] = useState<string[]>();
    const analystContent = useRef<HTMLDivElement | undefined>(undefined);
    const appDispatch = useAppDispatch();

    /**
     * Clear out any users in the store when this loads
     */
    useEffect(() => {
        appDispatch(updateAnalystsInTheMission(undefined));//clear users from state slice
    },[])

    
    useEffect(() => {
        if ((userRoles.Administrator || userRoles.MissionManager) && selectedMission !== DEFAULT_MISSION) {
            setIsEnabled(true);
        } else setIsEnabled(false);
    }, [userRoles, selectedMission]);

    /**
     * Handles menu item click
     */
    function handleMenuItemClick() {
        analystContent.current = (
            <div style={{ height: '98%' }}>
                <Analysts resetAnalysts={true} groupId={portalGroupId} analystUpdateCallback={analystUpdateCallback} config={config} />
            </div>
        );
        setDialogOpen(true);
    }

    /**
     * Closes the Dialog
     */
    const handleDialogClose = () => {
        setDialogOpen(false);
    };

    /**
     * Remove any users in the group before adding new users
     * @param portalGroupId group id
     */
    const removeUsers = async (portalGroupId: string) => {
        try{
            const result = await getPortalGroupUsers(portalGroupId);
            await removeUsersFromPortalGroup(portalGroupId, result.users);
        }
        catch(error){
            console.error(error);
        }
    }

    /**
     * Save the updated users and close the dialog
     */
    const handleAddAnalystButtonClick = async () => {
        //first remove all the existing users
        await removeUsers(portalGroupId);
        //add users selected in the grid
        addUsersToGroupById(portalGroupId, analystNames)
            .then(() => {
                enqueueSnackbar('Analysts Updated Successfully', { variant: 'success' });
            })
            .catch((error) => {
                console.error(error);
                enqueueSnackbar('Error Occurred. Please review log output.', { variant: 'error' });
            });
        setDialogOpen(false);
    };

    /**
     * Callback function for updating analysts in the add analyst popup content.This receives
     * a list of analysts, updates the current mission, and displays the success/fail results to
     * the user.
     * @param analystNamesInMission - an array of analysts to set as the analysts for the current mission.
     */
    const analystUpdateCallback = (analystNamesInMission: string[]): void => {
        setAnalystNames(analystNamesInMission);
    };

    return (
        <>
            <Grid container direction='column' alignItems='center' spacing={0}>
                <Grid item xs={12}>
                    <ButtonGroup variant='outlined' size='small' aria-label='Save'>
                        <IconButton
                            aria-label='Save'
                            onClick={handleMenuItemClick}
                            title={'Add Analyst'}
                            disabled={!isEnabled}
                        >
                            <UserPlusIcon size={16} />
                        </IconButton>
                    </ButtonGroup>
                </Grid>
            </Grid>

            <AddAnalystModalDialog open={dialogOpen} disablebackdropclick={'true'} aria-labelledby='form-dialog-title'>
                <AddAnalystDialogBody>
                    {analystContent.current}
                    <AddAnalystButtonContainer>
                        <StyledButton variant='contained' color='primary' onClick={handleDialogClose}>
                            Cancel
                        </StyledButton>
                        <StyledButton variant='contained' color='secondary' onClick={handleAddAnalystButtonClick}>
                            Update Analysts
                        </StyledButton>
                    </AddAnalystButtonContainer>
                </AddAnalystDialogBody>
            </AddAnalystModalDialog>
        </>
    );
}
