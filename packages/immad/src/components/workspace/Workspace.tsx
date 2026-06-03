// React imports
import React, { useState } from 'react';
import { Redirect } from 'react-router';

// Context imports
import { AppContext, UserRoles } from '../../contexts/App';
import { LayoutProvider } from '../../contexts/LayoutContext';
import { MapProvider } from '../../contexts/Map';
import { UserSettingsProvider } from '../../contexts/UserSettings';

// Type imports
import { ToolsetType } from '../../types/ToolsetType';

// Component imports
import MenuBar from '../menuBar';
import Footer from '../footer';
import MissionManager from '../missionManager';
import Analyst from '../analyst';
import PopoutPreload from '../layout/PopoutPreload';
import { SnackbarProvider } from 'notistack';
import { Alert, AlertTitle, Grid, IconButton, Slide } from '@mui/material';
import XIcon from 'calcite-ui-icons-react/XIcon';

// Style imports
import { Container, Row } from './styles';
import { ZoomToProvider } from '../../contexts/ZoomToLayerContext';
import { FeatureSelectionProvider } from '../../contexts/FeatureSelectionContext';
import ClassificationBanner from '../classificationBanner';

// Component
const Workspace = (props: { location: any }): JSX.Element => {
    let toLandingPage = false;
    const firstTime = sessionStorage.getItem('first_time');
    const checkLoadType = () => {
        if (String(window.performance.getEntriesByType('navigation')[0].type) === 'back_forward') {
            // redirect to '/' route
            const processedReload = window.performance.getEntriesByName('back_forward');
            if (processedReload?.length === 0) {
                window.performance.mark('back_forward');
                toLandingPage = true;
            }
        } else if (!firstTime) {
            sessionStorage.setItem('first_time', '1');
            toLandingPage = true;
        } else {
            toLandingPage = false;
        }
    };

    // State
    const [activeToolset, setActiveToolset] = useState<ToolsetType>(ToolsetType.undefined);

    // Events
    const handleToolsetChange = (newToolset: ToolsetType) => {
        setActiveToolset(newToolset);
    };

    // add action to all snackbars
    const notistackRef: any = React.createRef();
    const onClickDismiss = (key: any) => () => {
        notistackRef.current.closeSnackbar(key);
    };

    checkLoadType();
    return toLandingPage ? (
        <Redirect to='/' />
    ) : (
        <SnackbarProvider
            ref={notistackRef}
            action={(key) => (
                <IconButton onClick={onClickDismiss(key)}>
                    <XIcon size={24} />
                </IconButton>
            )}
            maxSnack={3}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
            }}
            TransitionComponent={Slide}
        >
            <Container>
                <PopoutPreload />
                <MapProvider>
                    <ClassificationBanner />
                    <UserSettingsProvider>
                        <LayoutProvider>
                            <FeatureSelectionProvider>
                                <ZoomToProvider>
                                    <AppContext.Consumer>
                                        {(context) => (
                                            <MenuBar
                                                portalUser={context.portalUser}
                                                userRoles={context.userRoles}
                                                inComing={props.location.state}
                                                handleToolsetChange={handleToolsetChange}
                                            />
                                        )}
                                    </AppContext.Consumer>

                                    <AppContext.Consumer>
                                        {(context) => (
                                            <Row>
                                                {context.userRoles.MissionManager === true && (
                                                    <MissionManager
                                                        active={activeToolset === ToolsetType.MISSIONMANAGER}
                                                    />
                                                )}
                                                {context.userRoles.Analyst === true && (
                                                    <Analyst active={activeToolset === ToolsetType.ANALYST} />
                                                )}
                                                {getUserRole(context.userRoles) === 'INSUFFICIENT_PRIVILIGES' &&
                                                    insufficientPriveleges()}
                                                {getUserRole(context.userRoles) === false && errorAlert()}
                                            </Row>
                                        )}
                                    </AppContext.Consumer>
                                </ZoomToProvider>
                            </FeatureSelectionProvider>
                        </LayoutProvider>
                    </UserSettingsProvider>
                    <Footer />
                    <ClassificationBanner />
                </MapProvider>
            </Container>
        </SnackbarProvider>
    );

    function getUserRole(userRoles: UserRoles) {
        if (activeToolset === ToolsetType.ADMIN) {
            return userRoles.Administrator;
        } else if (activeToolset === ToolsetType.MISSIONMANAGER) {
            return userRoles.MissionManager;
        } else {
            return userRoles.Analyst;
        }
    }

    function insufficientPriveleges() {
        return (
            <Grid container justifyContent='center' alignItems='center'>
                <Alert severity='warning'>
                    <AlertTitle>Insufficient Privileges</AlertTitle>
                    You do not have the necessary privileges to use this role. Please contact an administrator.
                </Alert>
            </Grid>
        );
    }

    function errorAlert() {
        return (
            <Grid container justifyContent='center' alignItems='center'>
                <Alert severity='error'>
                    <AlertTitle>Error Occurred</AlertTitle>
                    An error occurred loading this role. Please refresh and try again or contact an administrator.
                </Alert>
            </Grid>
        );
    }
};

export default Workspace;
