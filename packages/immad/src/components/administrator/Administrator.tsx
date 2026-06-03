// React imports
import React, { useState } from 'react';
import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router-dom';

// Context Imports
import { AdminSettingsProvider } from '../../contexts/AdminSettingsContext';
// Component imports
import { SnackbarProvider } from 'notistack';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import ClassificationBanner from '../classificationBanner';
import Footer from '../footer';
import PropTypes from 'prop-types';
import { makeStyles } from '@mui/styles';
import User from '../menuBar/components/User';
import { AppContext } from '../../contexts/App';
import SystemSettingsPage from './components/SystemSettingsPage';
import PortalUsersPage from './components/PortalUsersPage';
import A3MLSettingsPage from './components/A3MLSettingsPage';
import RMTSettingsPage from './components/RMTSettingsPage';

// Style imports
import { StyledAdminAppBar, StyledMainSettingsContainer, StyledWrappingDiv } from './styles';
import { Branding, Logo } from '../common/styles';
import ArrowLeftIcon from 'calcite-ui-icons-react/ArrowLeftIcon';
import LogoImage from '../../images/logo.png';
import { ConfigHelper } from '../../helpers/configHelper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import XIcon from 'calcite-ui-icons-react/XIcon';
import Slide from '@mui/material/Slide';

/**
 * Administrator tabbed panel page to allow IMMAD admins to
 * update and configure the IMMAD application.
 * @constructor
 */
export default function Administrator(): JSX.Element {
    const classes = useStyles();
    const appVersion = ConfigHelper.getAppVersion();
    const [value, setValue] = useState(0);

    const handleChange = (event: any, newValue: React.SetStateAction<number>) => {
        setValue(newValue);
    };
    // add action to all snackbars
    const notistackRef: any = React.createRef();
    const onClickDismiss = (key: any) => () => {
        notistackRef.current.closeSnackbar(key);
    };

    return (
        <StyledWrappingDiv>
            <AdminSettingsProvider>
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
                    <StyledAdminAppBar position='static' color='primary'>
                        <Branding>
                            <Logo src={LogoImage} alt='US Strategic Command seal image' />
                            <h1 title={appVersion?.trim()}>IMMAD</h1>
                        </Branding>
                        <AppContext.Consumer>
                            {(context) => (
                                <Grid item>
                                    <Grid container spacing={2} alignItems='center'>
                                        <Grid item>
                                            <User
                                                portalUser={context.portalUser}
                                                userRoles={context.userRoles}
                                                showSettingsLink={false}
                                            />
                                        </Grid>
                                    </Grid>
                                </Grid>
                            )}
                        </AppContext.Consumer>
                    </StyledAdminAppBar>
                    <h2>
                        <Link
                            component={RouterLink}
                            to={{
                                pathname: '/',
                            }}
                            variant='inherit'
                            underline='hover'
                            color='secondary'
                        >
                            <Button variant='contained' color='primary' startIcon={<ArrowLeftIcon />}>
                                To Landing Page
                            </Button>
                        </Link>
                    </h2>
                    <StyledMainSettingsContainer className={classes.root}>
                        <Tabs
                            orientation='vertical'
                            variant='scrollable'
                            value={value}
                            onChange={handleChange}
                            aria-label='Vertical Tabs Example'
                            className={classes.tabs}
                        >
                            <Tab label='System Settings' {...a11yProps(0)} />
                            <Tab label='User Settings' {...a11yProps(1)} />
                            <Tab label='Analytics Settings' {...a11yProps(2)} />
                            <Tab label='RMT Settings' {...a11yProps(3)} />
                        </Tabs>
                        <TabPanel index={0} value={value}>
                            <SystemSettingsPage />
                        </TabPanel>
                        <TabPanel index={1} value={value}>
                            <PortalUsersPage />
                        </TabPanel>
                        <TabPanel index={2} value={value}>
                            <A3MLSettingsPage />
                        </TabPanel>
                        <TabPanel index={3} value={value}>
                            <RMTSettingsPage />
                        </TabPanel>
                    </StyledMainSettingsContainer>
                    <Footer />
                    <ClassificationBanner />
                </SnackbarProvider>
            </AdminSettingsProvider>
        </StyledWrappingDiv>
    );
}

function TabPanel(props: { [x: string]: any; children: any; value: any; index: any }) {
    const { children, value, index, ...other } = props;
    const classes = useStyles();
    return (
        <div
            className={classes.tabPanel}
            role='tabpanel'
            hidden={value !== index}
            id={`vertical-tabpanel-${index}`}
            aria-labelledby={`vertical-tab-${index}`}
            {...other}
        >
            {value === index && <Box p={3}> {children}</Box>}
        </div>
    );
}
TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.any.isRequired,
    value: PropTypes.any.isRequired,
};

function a11yProps(index: number) {
    return {
        id: `vertical-tab-${index}`,
        'aria-controls': `vertical-tabpanel-${index}`,
    };
}

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
        backgroundColor: theme.palette.background.paper,
        display: 'flex',
        height: 244,
    },
    tabs: {
        borderRight: `1px solid ${theme.palette.divider}`,
    },
    tabPanel: { flexGrow: '1', overflow: 'auto' },
}));
