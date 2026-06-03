// React imports
import React, { useCallback, useEffect, useState } from 'react';

// Component imports
import { Chip, Button, Grid, Hidden, IconButton, Popover, Typography } from '@mui/material';

import { UserRoles } from '../../../contexts/App';

// Style imports
import {
    Avatar,
    BigAvatar,
    StyledButtonContainer,
    StyledPopoutContent,
    StyledAvatarContainer,
    StyledUsernameContainer,
    StyledRow,
    StyledRowWithPadding,
    StyledColumn,
    useStyles,
    StyledUserButton,
    StyledSettingsButtonRow,
} from '../styles';

// ArcGIS imports
import PortalUser from '@arcgis/core/portal/PortalUser';

import { Link as RouterLink, useHistory } from 'react-router-dom';

import {
    getMissionLayout,
    getUserSavedState,
    saveAsMissionLayout,
    saveUserLayout,
} from '../../layout/helpers/LayoutHelper';
import { useLayoutContext } from '../../../contexts/LayoutContext';
import { useSnackbar } from 'notistack';
import { useAppSelector } from '@stratcom/gate/src/hooks/hooks';
import ResetLayoutDialog from './resetLayoutDialog';
import { IJsonModel } from 'flexlayout-react';

interface UserProps {
    portalUser: PortalUser;
    userRoles: UserRoles;
    showSettingsLink: boolean;
    selectedMissionId?: string;
}

enum LayoutType {
    CUSTOM,
    MISSION,
    DEFAULT,
    UNKNOWN,
}

// Component
const User = (props: UserProps): JSX.Element => {
    const { portalUser, userRoles, showSettingsLink, selectedMissionId } = props;
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const { model, setShowModal } = useLayoutContext();
    const { enqueueSnackbar } = useSnackbar();
    const classes = useStyles();

    const [hasMissionLayout, setHasMissionLayout] = useState<boolean>();
    const [layoutType, setLayoutType] = useState<LayoutType>(LayoutType.UNKNOWN);

    const history = useHistory();
    const savedStateItem = useAppSelector((state) => state.adminSettingsSlice.savedState);

    const [updated, setUpdated] = useState<[]>();

    useEffect(() => {
        if ((!savedStateItem || savedStateItem?.itemId.trim() === '') && userRoles.Administrator) {
            history.push('/administrator');
        }
    }, [savedStateItem, userRoles.Administrator]);

    /**
     * Retrieves the Mission Layout status when the User dialog opens or the user's layout changess
     */
    useEffect(() => {
        if (selectedMissionId && anchorEl) {
            initializeLayoutType(selectedMissionId); // ignore promise
        }
    }, [anchorEl, selectedMissionId, updated]);

    /**
     * Initializes the current Layout type for a mission with given Mission ID
     * @param missionId The mission ID
     */
    const initializeLayoutType = async (missionId: string): Promise<void> => {
        try {
            const result = await getMissionLayout(missionId);

            let hasMissionLayout = false;

            if (result.success && result.layout) {
                hasMissionLayout = true;
            }

            setHasMissionLayout(hasMissionLayout);

            const userSaveState = await getUserSavedState();

            if (userSaveState?.layout) {
                setLayoutType(LayoutType.CUSTOM);
            } else {
                setLayoutType(hasMissionLayout ? LayoutType.MISSION : LayoutType.DEFAULT);
            }
        } catch (error) {
            setLayoutType(LayoutType.UNKNOWN);
            console.error(error);
            enqueueSnackbar('Error initializing the layout type. Check the log for details.', { variant: 'error' });
        }
    };

    const getPermissions = (): string => {
        const result = [];

        if (userRoles.Administrator !== false) {
            result.push('Administrator');
        }

        if (userRoles.MissionManager !== false) {
            result.push('Mission Manager');
        }

        if (userRoles.Analyst !== false) {
            result.push('Analyst');
        }

        return result.join(' - ');
    };

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSaveCustomLayout = async () => {
        try {
            const modelJson: IJsonModel = model.toJson();
            const result = await saveUserLayout(modelJson);

            if (result.success) {
                enqueueSnackbar('Layout saved successfully', { variant: 'success' });
            } else {
                enqueueSnackbar(result.message, { variant: 'error' });
            }
        } catch (error) {
            console.error(error.message);
            enqueueSnackbar(error.message, { variant: 'error' });
        } finally {
            setUpdated([]);
        }
    };

    /**
     * Saves the Mission Layout to the current Mission object.
     */
    const handleSaveMissionLayout = useCallback(async () => {
        if (selectedMissionId && model) {
            try {
                const layoutJson: IJsonModel = model.toJson();
                const result = await saveAsMissionLayout(selectedMissionId, layoutJson);
                enqueueSnackbar(result.message, { variant: result.success ? 'success' : 'error' });
            } catch (error) {
                console.error(error.message);
                enqueueSnackbar(error.message, { variant: 'error' });
            } finally {
                setUpdated([]);
            }
        }
    }, [selectedMissionId, model]);

    /**
     * Removes the current Mission Layout (sets the layout to null) on the Mission object.
     */
    const handleDeleteMissionLayout = useCallback(async () => {
        if (selectedMissionId) {
            try {
                const result = await saveAsMissionLayout(selectedMissionId, null);
                enqueueSnackbar(result.message, { variant: result.success ? 'success' : 'error' });
            } catch (error) {
                console.error(error.message);
                enqueueSnackbar(error.message, { variant: 'error' });
            } finally {
                setUpdated([]);
            }
        }
    }, [selectedMissionId]);

    const handleOpenReset = () => {
        setShowModal(true);
    };

    return (
        <Grid container columnSpacing={1} alignItems='center'>
            <Grid item>
                <Hidden mdDown>
                    <Button startIcon={<Avatar src={portalUser.thumbnailUrl} />} onClick={handleClick}>
                        {portalUser.username}
                    </Button>
                </Hidden>
                <Hidden mdUp>
                    <IconButton onClick={handleClick}>
                        <Avatar src={portalUser.thumbnailUrl} />
                    </IconButton>
                </Hidden>

                <Popover
                    open={Boolean(anchorEl)}
                    anchorEl={anchorEl}
                    onClose={handleClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    classes={{ paper: classes.muipaper }}
                >
                    <StyledPopoutContent>
                        <StyledRow>
                            <StyledColumn>
                                <StyledAvatarContainer>
                                    <BigAvatar src={portalUser.thumbnailUrl} />
                                </StyledAvatarContainer>
                                <StyledUsernameContainer>
                                    <Typography>{portalUser.fullName}</Typography>
                                </StyledUsernameContainer>
                            </StyledColumn>
                        </StyledRow>
                        <StyledRowWithPadding>
                            <StyledColumn>
                                <Chip size='small' label={getPermissions()} />
                            </StyledColumn>
                        </StyledRowWithPadding>
                        {showSettingsLink && userRoles.Administrator === true && (
                            <StyledSettingsButtonRow>
                                <StyledButtonContainer>
                                    <StyledUserButton
                                        variant='outlined'
                                        color='secondary'
                                        component={RouterLink}
                                        to={{
                                            pathname: '/administrator',
                                            state: {
                                                active: true,
                                            },
                                        }}
                                    >
                                        IMMAD Settings
                                    </StyledUserButton>
                                </StyledButtonContainer>
                            </StyledSettingsButtonRow>
                        )}

                        {userRoles.Analyst === true && selectedMissionId && (
                            <StyledRowWithPadding>
                                <StyledColumn>
                                    <StyledButtonContainer>
                                        <StyledUserButton
                                            variant='outlined'
                                            color='secondary'
                                            onClick={handleSaveCustomLayout}
                                        >
                                            Save Custom Layout
                                        </StyledUserButton>
                                    </StyledButtonContainer>
                                </StyledColumn>
                                <StyledColumn>
                                    <StyledButtonContainer>
                                        <StyledUserButton
                                            variant='outlined'
                                            color='secondary'
                                            onClick={handleOpenReset}
                                        >
                                            Remove Custom Layout
                                        </StyledUserButton>
                                    </StyledButtonContainer>
                                </StyledColumn>
                            </StyledRowWithPadding>
                        )}

                        {(userRoles.Administrator !== false || userRoles.MissionManager !== false) &&
                            selectedMissionId && (
                                <StyledRowWithPadding>
                                    <StyledColumn>
                                        <StyledButtonContainer>
                                            <StyledUserButton
                                                variant='outlined'
                                                size='small'
                                                color='secondary'
                                                onClick={handleSaveMissionLayout}
                                            >
                                                Save Mission Layout
                                            </StyledUserButton>
                                        </StyledButtonContainer>
                                    </StyledColumn>

                                    <StyledColumn>
                                        {hasMissionLayout && (
                                            <StyledButtonContainer>
                                                <StyledUserButton
                                                    variant='outlined'
                                                    size='small'
                                                    color='secondary'
                                                    onClick={handleDeleteMissionLayout}
                                                >
                                                    Remove Mission Layout
                                                </StyledUserButton>
                                            </StyledButtonContainer>
                                        )}
                                    </StyledColumn>
                                </StyledRowWithPadding>
                            )}

                        {layoutType === LayoutType.CUSTOM ? (
                            <Chip
                                size='small'
                                label={'Custom Layout'}
                                title={
                                    'A Custom Layout is active. You may need to refresh the page to see layout changes.'
                                }
                            />
                        ) : layoutType === LayoutType.MISSION ? (
                            <Chip
                                size='small'
                                label={'Mission Layout'}
                                title={
                                    'A Mission Layout is active. You may need to refresh the page to see layout changes.'
                                }
                            />
                        ) : layoutType === LayoutType.DEFAULT ? (
                            <Chip
                                size='small'
                                label={'Default Layout'}
                                title={
                                    'The Default Layout is active. You may need to refresh the page to see layout changes.'
                                }
                            />
                        ) : (
                            <div />
                        )}

                        {<ResetLayoutDialog missionTitle={selectedMissionId ?? null} onClose={() => setUpdated([])} />}
                    </StyledPopoutContent>
                </Popover>
            </Grid>
        </Grid>
    );
};

export default User;
