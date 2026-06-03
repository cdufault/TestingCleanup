// React imports
import React, {useCallback, useContext, useEffect, useState} from 'react';
import { Link, useHistory } from 'react-router-dom';

// Component imports
import ToolsetToggle from './components/ToolsetToggle';
import ViewSelect from './components/ViewSelect';
import User from './components/User';
import { UserRoles } from '../../contexts/App';
import DynamicClassificationToggle from './components/DynamicClassificationToggle';
import SaveStateContainer from './components/saveState';
import RemoteView from './components/remoteView';
import Bookmarks from '../widgets/bookmarks';
import AddLayerByUrl from '../widgets/addLayerByUrl';
import AddAnalyst from '../addAnalyst/addAnalyst';

import { Divider, Grid, IconButton } from '@mui/material';

import HomeIcon from 'calcite-ui-icons-react/HomeIcon';

// Type imports
import { ToolsetType } from '../../types/ToolsetType';

// Style imports
import { AppBar } from '../common/styles';
import { StyledDivHidden } from './styles';

// ArcGIS imports
import PortalUser from '@arcgis/core/portal/PortalUser';

//context imports
import { useSaveLoadContext } from '../../contexts/SaveLoad';
import LaunchIcon from 'calcite-ui-icons-react/LaunchIcon';
import { ConfigHelper } from '../../helpers/configHelper';
import { MapContext } from '../../contexts/Map';
import WebScene from '@arcgis/core/WebScene';
import { ApplicationStateHelper } from '../../helpers/ApplicationStateHelper';
import SelectionMenu from './components/selection/SelectionMenu';
import { createPortalLink } from '@stratcom/lib-functions';
import { useAppSelector } from '../../hooks/hooks';
import { RootState } from '../../data/store';
import WebMap = __esri.WebMap;
import ClassificationModal from '../classificationBanner/classificationModal/ClassificationModal';
import { MissingClassificationButton } from '../classificationBanner/styles';
import DynamicClassificationWarningIcon from '../../images/24px/24px_dynamic-classification_excpt_1.png';

interface MenuBarProps {
    portalUser: PortalUser;
    userRoles: UserRoles;
    handleToolsetChange: (newToolset: ToolsetType) => void;
    inComing: any;
}

// Component
const MenuBar = (props: MenuBarProps): JSX.Element => {
    const isDynamicClassificationEnabled = useAppSelector(
        (state: RootState) => state.classificationSlice.isDynamicClassificationEnabled
    );
    const saveLoadContext = useSaveLoadContext();
    const history = useHistory();
    const appConfig = ConfigHelper.getAppConfig();
    const { setMap, map, activeView } = useContext(MapContext);
    const applicationStateHelper = ApplicationStateHelper;
    const [showModal, setShowModal] = useState<boolean>(false);
    const [modalIcon, setModalIcon] = useState<JSX.Element>();
    const classificationItems = useAppSelector((state: RootState) => state.classificationSlice.classificationItems);
    const hasUnknownClassification = useAppSelector(
        (state: RootState) => state.classificationSlice.hasUnknownClassification
    );

    useEffect(() => {
        setModalIcon(getModalIcon());
    }, [hasUnknownClassification, classificationItems, isDynamicClassificationEnabled]);

    /**
     * Sends alert to the user that they have unsaved state
     * before they navigate away from the page.
     * @param event
     */
    const alertUserUnsavedState = useCallback( (event: any) => {
        if (!saveLoadContext.isStateSaved) {
            event.preventDefault();
            const newLine = '\r\n';
            const result = confirm('Leave Site?' + newLine + newLine + 'Changes you made may not be saved.');
            if (!result) {
                return;
            }
        }
        setMap(null);
        history.push('/');
    }, [history, saveLoadContext]);

    async function handleViewMapInPortalClicked() {
        if (map) {
            let webSceneToOpenID;
            if (activeView === 'MAP') {
                webSceneToOpenID = (map as WebMap).portalItem.id;
            } else {
                webSceneToOpenID = (map as WebScene).portalItem.id;
            }
            const portalUrl = await applicationStateHelper.removeHttp(appConfig.portalUrl);
            window.open(createPortalLink(portalUrl, webSceneToOpenID), '_blank');
        }
    }

    /**
     * Opens the classification modal
     */
    const handleOpen = () => {
        setShowModal(true);
    };

    /**
     * Returns the appropriate classification icon depending on what information is provided and set.
     * If classification is missing, show the warning icon. Else, show icon for dynamic classification on or off
     */
    const getModalIcon = (): JSX.Element => {
        return hasUnknownClassification && isDynamicClassificationEnabled ? (
            <MissingClassificationButton aria-label='Missing Classification Markers' onClick={handleOpen}>
                <div style={{ marginInline: '0.5rem' }}>
                    <img
                        src={DynamicClassificationWarningIcon}
                        alt={'DynamicClassificationWarningIcon'}
                        style={{ width: 24, height: 24, marginTop: '0.2rem' }}
                    />
                </div>
            </MissingClassificationButton>
        ) : (
            <DynamicClassificationToggle enabled={isDynamicClassificationEnabled} onClick={handleOpen} />
        );
    };

    return (
        <AppBar position='static'>
            <Grid container alignItems='center' justifyContent='space-between'>
                <Grid item>
                    <Grid container columnSpacing={1} alignItems='center'>
                        <Grid item>
                            <Link
                                to='/'
                                onClick={(e) => {
                                    alertUserUnsavedState(e);
                                }}
                            >
                                <IconButton
                                    aria-label='Home'
                                    size='small'
                                    title='Home'
                                    style={{ marginInlineStart: '0.5rem', marginInlineEnd: '1rem' }}
                                >
                                    <HomeIcon size={16} />
                                </IconButton>
                            </Link>
                        </Grid>
                        <Divider orientation='vertical' flexItem />
                        <StyledDivHidden>
                            <Grid item>
                                <ToolsetToggle
                                    userRoles={props.userRoles}
                                    handleToolsetChange={props.handleToolsetChange}
                                />
                            </Grid>
                        </StyledDivHidden>
                        <Grid item>
                            <ViewSelect />
                        </Grid>
                        <Grid item>
                            <AddAnalyst
                                userRoles={props.userRoles}
                                portalGroupId={props.inComing.value.id}
                                selectedMission={props.inComing.value.title}
                            />
                        </Grid>
                        <Grid item>
                            <IconButton
                                aria-label='View Map in Portal'
                                title='View Map in Portal'
                                onClick={handleViewMapInPortalClicked}
                            >
                                <LaunchIcon size={16} />
                            </IconButton>
                        </Grid>

                        <Grid item>
                            <SaveStateContainer portalUser={props.portalUser} selectedMission={props.inComing} />
                        </Grid>

                        <Divider orientation='vertical' flexItem />

                        <Grid item>
                            <AddLayerByUrl />
                        </Grid>

                        <Divider orientation='vertical' flexItem />

                        <Grid item>
                            <SelectionMenu />
                        </Grid>

                        <Divider orientation='vertical' flexItem />

                        <Grid item>
                            <Bookmarks />
                        </Grid>

                        <Divider orientation='vertical' flexItem />

                        <Grid item>
                            {showModal ? (
                                <>
                                    <ClassificationModal open={showModal} onClose={() => setShowModal(false)} />
                                    {modalIcon}
                                </>
                            ) : (
                                <>{modalIcon}</>
                            )}
                        </Grid>

                        <Divider orientation='vertical' flexItem />

                        <Grid item>
                            <RemoteView />
                        </Grid>

                        <Divider orientation='vertical' flexItem />
                    </Grid>
                </Grid>
                <Grid item>
                    <Grid container columnSpacing={2} alignItems='center'>
                        <Grid item>
                            <User portalUser={props.portalUser} userRoles={props.userRoles} showSettingsLink={false} selectedMissionId={saveLoadContext.missionSelect}/>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </AppBar>
    );
};

export default MenuBar;
