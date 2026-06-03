import React, { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import {
    createMission,
    createSceneFromMissionMapItem,
    validateMissionState,
} from '../helpers/missionCreationViewModel';
import { useSaveLoadContext } from '../../../../../contexts/SaveLoad';
import { Actions, MissionAction, MissionState } from '../../../../../contexts/missionStateReducer';
import Typography from '@mui/material/Typography';
import WebScene from '@arcgis/core/WebScene';
import Layer from '@arcgis/core/layers/Layer';
import { useHistory } from 'react-router-dom';
import { IGroup, ISearchResult, IUser } from '@esri/arcgis-rest-portal';
import { useSnackbar } from 'notistack';
import { MissionCreationOutput } from '../styles';
import { AppConfig } from '../../../../../interfaces/AppConfig';
import { findPortalGroupsByTag } from '../../../../../helpers/portalGroupHelper';
import { getGroupUsersByGroupId } from '../../../../../helpers/portalUsersHelper';
import { StyledTextButton } from '../../../styles';

const MissionSummary = (props: {
    dispatch: React.Dispatch<MissionAction>;
    state: MissionState;
    missionToUpdate: any | undefined;
    config: AppConfig;
    setDisableNextBtn: React.Dispatch<React.SetStateAction<boolean>>;
}): JSX.Element => {
    const { dispatch, state, missionToUpdate, config } = props;
    const saveLoadContext = useSaveLoadContext();
    const { push: pushToHistory } = useHistory();
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const messageArray = useRef<string[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const summaryMapRef = useRef<HTMLDivElement>(null);
    const logMessageDiv = useRef<HTMLDivElement>(null);
    const [webScene, setWebScene] = useState<WebScene>();
    const [isExecuting, setIsExecuting] = useState<boolean>(false);
    const [mission, setMission] = useState<IGroup | undefined>();
    const [workflowCompleted, setWorkflowCompleted] = useState<boolean>(false);
    const [showMessageArray, setShowMessageArray] = useState<boolean>(false);
    const { enqueueSnackbar } = useSnackbar();
    const currentMessageItem = currentMessage ? currentMessage : ' ';
    const errors = validationErrors && validationErrors.length > 0 ? validationErrors.join('') : undefined;

    const expandedCategories = [];
    const enableUpdate = (state.webScene && missionToUpdate && state.gateMapType === undefined) || false;
    const enableCreate = state.webScene && !missionToUpdate && state.gateMapType === undefined;
    const enableCreateGateMission = state.webScene && state.gateMapType !== undefined && missionToUpdate === undefined;
    const enableUpdateGateMission = state.webScene && state.gateMapType !== undefined && missionToUpdate !== undefined;
    const isGate = enableCreateGateMission || enableUpdateGateMission;
    const showWaiting = !state.webScene;

    let categories = '';
    if (state.expandedCategories) {
        for (const category of state.expandedCategories) {
            expandedCategories.push(category.name);
        }
    }
    if (expandedCategories.length) {
        categories = expandedCategories.reverse().join(' / ');
    }

    useEffect(() => {
        if (summaryMapRef.current && webScene) {
            dispatch({ type: Actions.UPDATE_EXTENT_WEBSCENE, payload: { item: webScene } });
        }
    }, [webScene]);

    useEffect(() => {
        const validationErrors = validateMissionState(state);
        if (validationErrors.length > 0) {
            const errorHTML = validationErrors.map((error) => `<Typography>${error}</Typography>`);
            setValidationErrors(errorHTML);
        } else {
            createMap()
                .then(() => {
                    sortMgrsFromAnalysts();
                })
                .catch((error) => {
                    console.error('Error creating the map in the mission summary step of create/update mission.');
                    console.error(error);
                });
        }
    }, []);

    useEffect(() => {
        if (workflowCompleted && mission) {
            loadMissionIntoWorkspace();
        }
    }, [workflowCompleted]);

    /**
     * Sort out those users that are managers from those that are analysts.
     */
    async function sortMgrsFromAnalysts() {
        const missionMgrArray = state.managerNames?.split(',').map((item) => item.trim());
        let allMgrNames: string[] | undefined = [];

        const immadAdmins = await getAllImmadAdminNames();
        if (!immadAdmins) {
            //user will note the missing managers on the summary page
            console.log('Failed to find any IMMAD admins.');
        }
        //add all IMMAD admins to mgr role
        if (missionMgrArray && immadAdmins) {
            const allAssignedAsAdmin = [...missionMgrArray, ...immadAdmins];
            const set = new Set(allAssignedAsAdmin);
            allMgrNames = Array.from(set);
        }
        if (allMgrNames && allMgrNames.length > 0) {
            //analysts consists of all users added to mission irrespective of role
            //remove the users added to the mgr role and all immad admins
            const analysts: string[] = [];
            state.analystNames?.map((analyst) => {
                const result = allMgrNames?.find((mgrName) => {
                    return mgrName.toLowerCase() === analyst.toLowerCase();
                });
                if (result === undefined) {
                    analysts.push(analyst);
                }
            });

            dispatch({
                type: Actions.UPDATE_ANALYST_NAMES,
                payload: { item: analysts },
            });
            dispatch({
                type: Actions.UPDATE_MGRNAMES,
                payload: { item: allMgrNames.join() },
            });
        }
    }

    async function getAllImmadAdminNames(): Promise<string[] | undefined> {
        const admins = await findPortalGroupsByTag(config.roles.admin.tag);
        const adminUsers: ISearchResult<IUser> | undefined = admins.success
            ? await getGroupUsersByGroupId(admins.item[0].id)
            : undefined;
        const names: string[] = [];
        adminUsers?.results.forEach((user) => {
            if (user.username) {
                names.push(user.username);
            }
        });
        return names;
    }

    /**
     * We need to map to support group layers - which appear to need a rendered map in order to work properly, otherwise if we just have a reference the
     * group layer is added but all the subLayers take on the name of the parent layer.
     */
    async function createMap() {
        const aWebScene = await createSceneFromMissionMapItem(state, config);
        aWebScene
            .load()
            .then(async () => {
                const allLayers = aWebScene.allLayers;
                await Promise.all<Layer>(
                    allLayers.map((layer: Layer) => {
                        return layer
                            .load()
                            .then(() => {
                                console.debug('Loaded layers from the selected webscene: ' + layer.title);
                            })
                            .catch((error) => {
                                console.error('Error loading layers from the selected webscene: ' + error);
                            });
                    })
                );
                setWebScene(aWebScene);
            })
            .catch(() => {
                console.error('Error occurred getting existing layers from the selected webscene.');
            });
    }

    async function createTheMission() {
        setIsExecuting(true);
        const group = await createMission(state, dispatch, outputFunc);

        if (group) {
            enqueueSnackbar('Mission Created Successfully', { variant: 'success' });
            sessionStorage
                ? sessionStorage.setItem('first_time', '1')
                : console.error('Unable to find session storage');
            setMission(group);
            setWorkflowCompleted(true);
        } else {
            console.error('Error occurred. Group object is not defined.');
        }
    }

    /**
     * Handle createMission button click
     */
    const createMissionHandler = () => {
        createTheMission();
    };

    /**
     * Forces all created missions to load in 2D only so the thin clients will load properly
     */
    const loadMissionIntoWorkspace = async () => {
        pushToHistory({
            pathname: '/workspace',
            state: {
                value: mission,
                timeStamp: new Date(),
                viewType: '2D',
            },
        });
        // set save button default to save mission default
        saveLoadContext.setSaveButtonSelectIndex(1);
    };

    /**
     * Call back method that is passed to createMission function to support logging.
     * @param data string to output to the screen
     */
    function outputFunc(data: string): void {
        if (data === 'DONE') {
            messageArray.current.push(`Process completed. Review log output for warnings or errors.`);
        }
        if (data === 'ERROR') {
            messageArray.current.push(`Mission creation failed.`);
            setShowMessageArray(true);
            enqueueSnackbar('Error Occurred. Please review log output.', { variant: 'error' });
        }
        if (data) {
            messageArray.current.push(`${data}`);
        }

        if (logMessageDiv.current) {
            setCurrentMessage(`${data}`);
        }
    }

    const getMissionButtonLabel = (): string => {
        const isCopy = state.missionIsCopy;
        if (isGate) {
            if (enableCreateGateMission && isCopy) return 'Copy GATE Mission';
            if (enableCreateGateMission && !isCopy) return 'Create GATE Mission';
            if (enableUpdateGateMission && !isCopy) return 'Update GATE Mission';
        } else {
            if (enableCreate && enableUpdate && isCopy) return 'Copy Mission';
            if (enableCreate && !isCopy) return 'Create Mission';
            if (enableUpdate && !isCopy) return 'Update Mission';
        }
        return '';
    };

    return (
        <>
            {errors === undefined && !showMessageArray ? (
                <MissionCreationOutput>
                    <div
                        className='webmap'
                        ref={summaryMapRef}
                        style={{ width: '90%', height: '5%', visibility: 'hidden' }}
                    />
                    <Grid container spacing={1}>
                        <Grid item xs={12}>
                            <Typography component='h6' variant='h6'>
                                Summary
                            </Typography>
                        </Grid>
                        <Grid item xs={2}>
                            <Typography component={'span'}>Mission Name:</Typography>
                        </Grid>
                        <Grid item xs={10}>
                            <Typography component={'span'}>{state.name}</Typography>
                        </Grid>

                        <Grid item xs={2}>
                            <Typography component={'span'}>Managers:</Typography>
                        </Grid>
                        <Grid item xs={10}>
                            <Typography component={'span'}>{state.managerNames}</Typography>
                        </Grid>

                        <Grid item xs={2}>
                            <Typography component={'span'}>Summary:</Typography>
                        </Grid>
                        <Grid item xs={10}>
                            <Typography component={'span'}>{state.description}</Typography>
                        </Grid>

                        <Grid item xs={2}>
                            <Typography component={'span'}>Categories:</Typography>
                        </Grid>
                        <Grid item xs={10}>
                            <Typography component={'span'}>{categories}</Typography>
                        </Grid>

                        {state.tacticalGridLayerGuid && (
                            <Grid item xs={2}>
                                <Typography component={'span'}>Tactical Grid:</Typography>
                            </Grid>
                        )}
                        {state.tacticalGridLayerGuid && (
                            <Grid item xs={10}>
                                <Typography component={'span'}>{state.tacticalGridLayerLayerName}</Typography>
                            </Grid>
                        )}

                        {state.tacticalGridLayerGuid && (
                            <Grid item xs={2}>
                                <Typography component={'span'}>TGrid Fields Mapped to SMART:</Typography>
                            </Grid>
                        )}
                        {state.tacticalGridLayerGuid && (
                            <Grid item xs={10}>
                                <Typography component={'span'}>
                                    {state.supportsMappedGridFieldsToSMARTFields ? 'True' : 'False'}
                                </Typography>
                            </Grid>
                        )}

                        <Grid item xs={2}>
                            <Typography component={'span'}>Map:</Typography>
                        </Grid>
                        <Grid item xs={10}>
                            <Typography component={'span'}>
                                {state.mapItem ? state.mapItem.title : 'Using Default Map'}
                            </Typography>
                        </Grid>

                        <Grid item xs={2}>
                            <Typography component={'span'}>Analysts:</Typography>
                        </Grid>

                        <Grid item xs={10}>
                            <Typography component={'span'}>{state.analystNames?.join(', ')}</Typography>
                        </Grid>

                        {showWaiting ? (
                            <Grid item xs={12}>
                                <Typography component={'span'}>Evaluating mission inputs. . . </Typography>
                            </Grid>
                        ) : (
                            ''
                        )}
                        <Grid item xs={12}>
                            {(enableCreate || enableUpdate || enableCreateGateMission || enableUpdateGateMission) && (
                                <StyledTextButton
                                    onClick={createMissionHandler}
                                    variant='contained'
                                    disabled={isExecuting}
                                >
                                    {getMissionButtonLabel()}
                                </StyledTextButton>
                            )}
                        </Grid>

                        <Grid item xs={12}>
                            <div ref={logMessageDiv}>
                                <Typography color='textSecondary'>{currentMessageItem}</Typography>
                            </div>
                        </Grid>
                    </Grid>
                </MissionCreationOutput>
            ) : errors ? (
                <MissionCreationOutput>
                    <Typography variant='h5'>Errors</Typography>
                    {errors}
                </MissionCreationOutput>
            ) : showMessageArray ? (
                <MissionCreationOutput>
                    <Box>
                        <Typography variant='h6'>Log Output:</Typography>
                    </Box>
                    {messageArray.current.map((message, index) => {
                        return (
                            <Box key={index}>
                                <Typography>{message}</Typography>
                            </Box>
                        );
                    })}
                </MissionCreationOutput>
            ) : (
                ''
            )}
        </>
    );
};
export default MissionSummary;
