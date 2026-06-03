import React, { useEffect, useState } from 'react';
import './ConfigurationPage.css';
import { StaticAuthenticationState } from '../../data/StaticAuthenticationState';
import { Logger, shareItemsWithGroup, getPortalGroupMembers } from '@stratcom/lib-functions';
import { useNavigate } from 'react-router-dom';
import { setGateConfigured } from '../../ApplicationSlice';
import { useAppSelector } from '../../hooks/hooks';
import ConfigurationForm from './ConfigurationForm';
import { useDispatch, useSelector } from 'react-redux';
import { ThemeProvider } from '@emotion/react';
import { theme } from '../../assets/theme';
import { Box, Button, Typography } from '@mui/material';
import { RootState } from '../../data/store';

/**
 * This is the page that will be displayed when the GATE application is not configured
 * @constructor
 */
export default function ConfigurationPage() {
    const userSession = StaticAuthenticationState.getUserSessionState();
    const portal = StaticAuthenticationState.getPortalState();
    const thePortal = StaticAuthenticationState.getPortalState();
    const user = thePortal.user;
    const gateConfigured = useAppSelector((state) => state.applicationSlice.gateConfigured);
    const [isAdmin, setIsAdmin] = useState(false);
    const [message, setMessage] = useState(
        'The GATE application has not been configured yet. Contact your GATE or Esri Portal administrator.'
    );
    const [showForm, setShowForm] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const appConfig = useSelector((state: RootState) => state.applicationSlice.applicationConfig);

    useEffect(() => {
        initialize();
    }, []);

    useEffect(() => {
        if (gateConfigured && isInitialized) {
            if (!showForm && isAdmin) {
                setShowForm(true);
            }
        }
    }, [gateConfigured, isInitialized]);

    async function initialize() {
        const adminGroupMembers = await getPortalGroupMembers(portal.restUrl, userSession, appConfig.gateAdminGroupId);
        const groupMembers = [...adminGroupMembers.users, ...adminGroupMembers.admins];
        const isAdmin = groupMembers.includes(user.username);

        setMessage(
            isAdmin
                ? 'The GATE application has not been configured yet. Would you like to configure it now?'
                : `The user [${user.username}] does not have sufficient priviledges to configure GATE. Contact your GATE or Esri Portal administrator.`
        );
        setIsAdmin(isAdmin);
        setIsInitialized(true);
    }

    async function handleOnClick() {
        dispatch(setGateConfigured(false));
        try {
            // add application to the group
            const shareResult = await shareItemsWithGroup(
                portal,
                appConfig.appPortalId,
                [appConfig.gateAdminGroupId],
                true
            );
            if (shareResult.error) {
                Logger.log('Error Sharing GATE admin Application.', 'ERROR', shareResult);
                navigate('/error', { state: 'failed to share GATE Config Application.' });
            }

            // add basic config values that are needed to the text object
            // replace page with form to add in data if application exists validate that guids have been populated.
            // if it didn't exist initialize regions to empty array
            // this will be done by showing the GateConfigurationForm in the window
            // to take in and set these values.
            if (isAdmin) {
                setShowForm(true);
            }
        } catch (error) {
            navigate('/error', { state: 'Error occurred during configuration.' });
        }
    }

    return (
        <>
            <ThemeProvider theme={theme}>
                {showForm ? (
                    <ConfigurationForm />
                ) : (
                    <Box className='ConfigurationPage-body'>
                        <Box className='gate-config-article'>
                            <Typography variant='h5' align='center' display='block'>
                                {message}
                            </Typography>
                            {isAdmin ? (
                                <Button size='medium' variant='contained' onClick={handleOnClick}>
                                    Configure Gate Now
                                </Button>
                            ) : (
                                ''
                            )}

                            <Typography variant='h6' align='center'>
                                "Based on the findings of the report, my conclusion was that this idea was not a
                                practical deterrent for reasons which at this moment must be all too obvious." - Dr.
                                Strangelove
                            </Typography>
                        </Box>
                    </Box>
                )}
            </ThemeProvider>
        </>
    );
}
