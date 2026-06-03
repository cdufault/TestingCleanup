// React imports
import React, { useContext, useEffect, useState } from 'react';

// Context imports
import { AppContext } from '../../contexts/App';

// Component imports
import Missions from './components/missions';

import { Grid, IconButton, Slide } from '@mui/material';
// Style imports
import { AppBar, Container } from './styles';
import { Branding, Logo } from '../common/styles';
import LogoImage from '../../images/logo.png';
import User from '../menuBar/components/User';
import { SaveLoadContext } from '../../contexts/SaveLoad';

import { SnackbarProvider } from 'notistack';
import XIcon from 'calcite-ui-icons-react/XIcon';
import ClassificationBanner from '../classificationBanner';
import { RootState } from '../../data/store';
import { useSelector } from 'react-redux';
import { ConfigHelper } from '../../helpers/configHelper';

// Component
const Home = (): JSX.Element => {
    const savedLoadContext = useContext(SaveLoadContext);
    const immadVersion = useSelector((state: RootState) => state.applicationSlice.immadVersion);
    const [appVersion, setAppVersion] = useState<string>('v3.x');

    //resets stored value when user navigates home
    useEffect(() => {
        ConfigHelper.loadAppVersion().then((version) => {
            if (version) {
                setAppVersion(`v${version}`);
            } else if (immadVersion) {
                setAppVersion(`v${immadVersion}`);
            }
        });
        savedLoadContext.setPortalIdToLoad('');
    }, []);

    // add action to all snackbars
    const notistackRef: any = React.createRef();
    const onClickDismiss = (key: any) => () => {
        notistackRef.current.closeSnackbar(key);
    };

    return (
        <Container>
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
                <ClassificationBanner />
                <AppBar position='static' color='primary'>
                    <Branding>
                        <Logo
                            component={'img'}
                            title={appVersion}
                            src={LogoImage}
                            alt='US Strategic Command seal image'
                        />
                        <h1>IMMAD</h1>
                    </Branding>

                    <AppContext.Consumer>
                        {(context) => (
                            <Grid item>
                                <Grid container spacing={2} alignItems='center'>
                                    <Grid item>
                                        <User
                                            portalUser={context.portalUser}
                                            userRoles={context.userRoles}
                                            showSettingsLink={true}
                                        />
                                    </Grid>
                                </Grid>
                            </Grid>
                        )}
                    </AppContext.Consumer>
                </AppBar>
                <Missions />
                <ClassificationBanner />
            </SnackbarProvider>
        </Container>
    );
};

export default Home;
