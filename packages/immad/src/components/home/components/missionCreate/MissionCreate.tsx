// React imports
import React, { useState, useReducer, useEffect } from 'react';

// Component imports
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';
import IconButton from '@mui/material/IconButton';
import ArrowLeftIcon from 'calcite-ui-icons-react/ArrowLeftIcon';
import MissionData from './views/missionData';
import { missionStateReducer, initMissionState } from '../../../../contexts/missionStateReducer';
import MapItems from './views/mapItems';
import Analysts from '../../../addAnalyst/analysts';
import MissionSummary from './views/missionSummary';
import ErrorDialog from './views/errorDialog';
import { validateMissionData, validateMissionMapItem } from './helpers/missionCreationViewModel';
import { IItem } from '@esri/arcgis-rest-portal';
import { Typography, Box } from '@mui/material';

// Style imports
import { Container, Header, Title, Section, Aside, Stepper, FormView, StepView, Button, Actions } from './styles';
import { useSnackbar } from 'notistack';
import { updateAnalystsInTheMission } from './MissionCreationSlice';
import { useAppDispatch, useAppSelector } from '../../../../hooks/hooks';
import { StyledTextButton } from '../../styles';
export type directionType = 'forward' | 'backward';

// Config imports/
const stepsConfig = {
    labels: ['Mission Information', 'Maps', 'Analysts', 'Summary'],

    subtext: [
        'Input general information about the new mission.',
        'Optionally, choose a map to include in the mission.',
        'Add additional analysts to the mission.',
        'View and approve the summary of the mission options.',
    ],

    components: [
        <div key={0}>Info</div>,
        <div key={1}>Scenes</div>,
        <div key={2}>Analysts component</div>,
        <div key={3}>Summary component</div>,
    ],
};

// Component
const MissionCreate = (props: {
    handleReturn: () => void;
    selectedMission: IItem | undefined;
    showOnlyGateMissions: boolean;
    typeKeywords: string;
}): JSX.Element => {
    // State
    const [activeStep, setActiveStep] = useState(0);
    const [completed, setCompleted] = useState<{ [key: number]: boolean }>({});

    const [mission, dispatch] = useReducer(missionStateReducer, initMissionState);

    const [errors, setErrors] = useState<string[]>([]);
    const [open, setOpen] = useState(false);

    const AppConfig = useAppSelector((state) => state.applicationSlice);
    const [disableNextBtn, setDisableNextBtn] = useState(false);
    const [direction, setDirection] = useState<directionType>('forward');
    const steps = stepsConfig.labels;
    const { handleReturn, showOnlyGateMissions, typeKeywords } = props;
    const { enqueueSnackbar } = useSnackbar();
    const appDispatch = useAppDispatch();
    // Stepper methods
    const totalSteps = () => {
        return steps.length;
    };

    const completedSteps = () => {
        return Object.keys(completed).length;
    };

    const isLastStep = () => {
        return activeStep === totalSteps() - 1;
    };

    const allStepsCompleted = () => {
        return completedSteps() === totalSteps();
    };

    async function handleNext(): Promise<void> {
        if (activeStep === 0) {
            const errors = await validateMissionData(mission, props.selectedMission);
            if (mission && mission.managerNames && mission.managerNames.length > 0) {
                const namesArray = mission.managerNames.split(',');
                if (namesArray && namesArray.length < 2 && !props.selectedMission && !mission.gateMapType) {
                    enqueueSnackbar(`It is highly recommended to assign at least two managers to the mission.`, {
                        variant: 'warning',
                    });
                }
            }
            if (errors && errors.length > 0) {
                setOpen(true);
                setErrors(errors);
                return;
            }
        }
        if (activeStep === 1) {
            if (mission && mission.gateMapType !== undefined) {
                //GATE mission so validate map, no default is set for gate
                const errors = validateMissionMapItem(mission);
                if (errors && errors.length > 0) {
                    setOpen(true);
                    setErrors(errors);
                    return;
                }
            }
        }

        const newActiveStep =
            isLastStep() && !allStepsCompleted() ? steps.findIndex((step, i) => !(i in completed)) : activeStep + 1;
        setActiveStep(newActiveStep);
    }

    /**Clear out all analyst names in the store */
    useEffect(() => {
        appDispatch(updateAnalystsInTheMission(undefined)); //clear users from state slice
    }, []);

    useEffect(() => {
        if (activeStep === 3) {
            setDisableNextBtn(true);
        } else {
            setDisableNextBtn(false);
        }
    }, [activeStep]);

    const handleBack = () => {
        const newCompleted = completed;
        const newActiveStep = activeStep > 0 ? activeStep - 1 : 0;
        newCompleted[newActiveStep] = false;
        setCompleted(newCompleted);
        setDirection('backward');
        setActiveStep((prevActiveStep) => (prevActiveStep > 0 ? prevActiveStep - 1 : 0));
    };

    const handleComplete = () => {
        const newCompleted = completed;
        newCompleted[activeStep] = true;
        setCompleted(newCompleted);
        setDirection('forward');
        handleNext();
    };

    /**
     * callback to update the mission state with the selected analysts
     * @param userNamesInMission
     */
    const handleAnalystsUpdate = (userNamesInMission: string[]) => {
        console.log(userNamesInMission);
        dispatch({
            type: 'update_analyst_names',
            payload: { item: userNamesInMission },
        });
    };

    const handleReset = () => {
        setActiveStep(0);
        setCompleted({});
    };

    const handleClose = () => {
        setOpen(false);
    };
    return (
        <Container>
            <Header>
                <IconButton aria-label='Back to Missions' size='small' onClick={handleReturn}>
                    <ArrowLeftIcon size={24} />
                </IconButton>
                {props.selectedMission == undefined ? (
                    <Title variant='h6'>Create new mission</Title>
                ) : (
                    <Title variant='h6'>Edit mission</Title>
                )}
            </Header>

            <Section>
                <Aside>
                    <Stepper activeStep={activeStep} orientation='vertical'>
                        {steps.map((label, index) => (
                            <Step key={label} completed={completed[index]}>
                                <StepLabel>{label}</StepLabel>

                                <StepContent>
                                    <p>{stepsConfig.subtext[index]}</p>
                                </StepContent>
                            </Step>
                        ))}
                    </Stepper>
                </Aside>

                <FormView
                    onSubmit={(e) => {
                        e.preventDefault();
                    }}
                >
                    {allStepsCompleted() ? (
                        <>
                            <Box mb={2}>
                                <Typography align='center' variant='h6'>
                                    All steps completed
                                </Typography>
                            </Box>

                            <Button onClick={handleReset}>Reset</Button>
                        </>
                    ) : (
                        <>
                            <ErrorDialog errors={errors} open={open} handleClose={handleClose} />
                            <StepView>
                                {activeStep == 0 ? (
                                    <MissionData
                                        dispatch={dispatch}
                                        missionState={mission}
                                        missionToUpdate={props.selectedMission ? props.selectedMission : undefined}
                                    />
                                ) : activeStep === 1 ? (
                                    <MapItems
                                        dispatch={dispatch}
                                        state={mission}
                                        config={AppConfig}
                                        showOnlyGateMissions={showOnlyGateMissions}
                                        typeKeywords={typeKeywords}
                                    />
                                ) : activeStep === 2 ? (
                                    <Analysts
                                        analystUpdateCallback={handleAnalystsUpdate}
                                        groupId={mission.portalGroupId}
                                        config={AppConfig}
                                        mgrsNamesInCreateMissionReducer={mission.managerNames
                                            ?.split(',')
                                            .map((item: string) => item.trim())}
                                    />
                                ) : activeStep === 3 ? (
                                    <MissionSummary
                                        dispatch={dispatch}
                                        state={mission}
                                        config={AppConfig}
                                        setDisableNextBtn={setDisableNextBtn}
                                        missionToUpdate={props.selectedMission ? props.selectedMission : undefined}
                                    />
                                ) : (
                                    <h4
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            height: '80%',
                                        }}
                                    >
                                        Default
                                    </h4>
                                )}
                            </StepView>

                            <Actions>
                                <StyledTextButton disabled={activeStep === 0} onClick={handleBack} variant='outlined'>
                                    Back
                                </StyledTextButton>

                                <StyledTextButton
                                    variant='contained'
                                    color='secondary'
                                    onClick={handleComplete}
                                    disabled={disableNextBtn}
                                >
                                    Next
                                </StyledTextButton>
                            </Actions>
                        </>
                    )}
                </FormView>
            </Section>
        </Container>
    );
};

export default MissionCreate;
