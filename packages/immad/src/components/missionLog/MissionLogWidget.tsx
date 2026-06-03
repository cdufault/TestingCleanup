import { useEffect, useState } from 'react';
import { IconButton, InputAdornment, Typography } from '@mui/material';
import Tab from '@mui/material/Tab';
import * as React from 'react';
import {
    StyledButtonStartIcon,
    StyledDialogActions,
    StyledDialogContentOverFlowHidden,
    StyledFullHeightDiv,
    StyledFullHeightOverflowHiddenDiv,
    StyledMissionLogEntryTextField,
    StyledMissionLogWidgetContainer,
    StyledSVGDiv,
    StyledTabs,
} from './styles';
import { parseMessage } from './MissionLogParser';
import { runRMTQuery } from './QueryRMTFeatures';
import { RMTQueryMetadata } from '../administrator/components/AdminSettingsSlice';
import { updateMessages } from './MissionLogSlice';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { NewtMessageEnvelope } from './MissionLogSlice';
import CurrentMissionLog from './components/CurrentMissionLog';
import { useSnackbar } from 'notistack';
import MissionLogSummary from './components/MissionLogSummary';
import { AddMissionLogMessageFeature } from './MissionLogHelper';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { Recurrence } from '../../images/24px/recurrence';
import XIcon from 'calcite-ui-icons-react/XIcon';
import SpinnerIcon from 'calcite-ui-icons-react/SpinnerIcon';
import Box from '@mui/material/Box';
import PropTypes from 'prop-types';
import { makeStyles } from '@mui/styles';

/**
 * Mission Log Widget which contains a text input for mission messages
 * To be further built in future tickets
 */
const MissionLogWidget = (): JSX.Element => {
    const [missionLogText, setMissionLogText] = useState<string>();
    const [parsedMessage, setParsedMessage] = useState<NewtMessageEnvelope>();
    const rmtData: RMTQueryMetadata[] = useAppSelector((state) => state.adminSettingsSlice.rmtQueryMetadata);
    const existingMessages: NewtMessageEnvelope[] = useAppSelector((state) => state.missionLogSlice.messages);
    const dispatch = useAppDispatch();
    const [dataSourceErrors, setDataSourceErrors] = useState<string[]>([]);
    const { enqueueSnackbar } = useSnackbar();
    const [tabValue, setTabValue] = useState(0);
    const [parsing, setParsing] = useState(false);
    const [parsingError, setParsingError] = useState(false);
    const [currentMessage, setCurrentMessage] = useState<NewtMessageEnvelope>();
    const messageFeatureTableId = useAppSelector((state) => state.adminSettingsSlice.rmtMessageTable);
    const missionLogFeatureLayer = new FeatureLayer({
        portalItem: {
            id: messageFeatureTableId,
        },
    });

    useEffect(() => {
        updateMissionLogSlice().then(() => {
            if (parsedMessage) enqueueSnackbar('Message Loaded Successfully', { variant: 'success' });
        });
    }, [parsedMessage]);

    useEffect(() => {
        setParsing(false);
    }, [existingMessages.length]);

    useEffect(() => {
        if (dataSourceErrors && dataSourceErrors.length > 0) {
            showDataSourceErrors();
        }
    }, [dataSourceErrors]);

    /**
     * Run the RMT Query to get the values for each code and then update the MissionLogSlice
     */
    const updateMissionLogSlice = async () => {
        if (parsedMessage) {
            //Set this in the mission Log SLice
            const newMessage = await runRMTQuery(rmtData, parsedMessage);
            setCurrentMessage(newMessage);
            const updatedMessages = [...existingMessages, newMessage];
            dispatch(updateMessages(updatedMessages));
        }
    };

    /**
     * Display a snackbar if datasource errors were generated during parsing.
     * A datasource error could be - for example, when an attribute has no value
     */
    const showDataSourceErrors = () => {
        setParsingError(true);
        const message = dataSourceErrors.join('\n');
        enqueueSnackbar(`${message}`, {
            variant: 'error',
            persist: true,
            style: { whiteSpace: 'pre-line' },
        });
        setParsing(false);
    };

    /**
     * Handle parsing the message when the user clicks the Transcode button
     */
    const handleParseMessage = async () => {
        if (missionLogText) {
            setParsing(true);
            setParsingError(false);
            const info = await parseMessage(missionLogText, rmtData);
            if (info) {
                setDataSourceErrors(info.dataSourceErrors ?? []);
                if (info.dataSourceErrors?.length === 0) {
                    // if there are no formatting issues with the message, send it to the feature table
                    const results = await AddMissionLogMessageFeature(missionLogText, missionLogFeatureLayer);
                    if (results && results.addFeatureResults.length > 0) {
                        info.messages[0].header.objectId = results.addFeatureResults[0].objectId;
                    }
                    setParsedMessage(info.messages[0]);
                }
            }
        }
    };

    /**
     * Update the mission log text when the value changes in the input box
     * @param event
     */
    const handleMissionLogChange = (event: Event) => {
        setMissionLogText(event.currentTarget?.value);
    };

    const handleTabChange = (event: React.SyntheticEvent, newTabValue: number) => {
        setTabValue(newTabValue);
    };

    const handleClearMessage = () => {
        setMissionLogText('');
        setCurrentMessage(undefined);
    };

    return (
        <>
            {rmtData.length ? (
                <StyledMissionLogWidgetContainer className={'styled-mission-log-widget-container'}>
                    <StyledTabs
                        orientation='horizontal'
                        variant='scrollable'
                        value={tabValue}
                        onChange={handleTabChange}
                    >
                        <Tab label='Incoming Message' {...a11yProps(0)} />
                        <Tab label='Mission Log' {...a11yProps(1)} />
                    </StyledTabs>
                    <TabPanel
                        index={0}
                        value={tabValue}
                        style={{ overflow: 'hidden', height: '100%' }} // must inline style due to TabPanel being defined in this class
                        className={'incoming-message-panel'}
                    >
                        <StyledFullHeightOverflowHiddenDiv value={tabValue} index={0}>
                            <StyledMissionLogEntryTextField
                                onChange={handleMissionLogChange}
                                fullWidth
                                label={'Input'}
                                multiline
                                placeholder={'Please paste message here...'}
                                value={missionLogText}
                                minRows={4}
                                maxRows={4}
                                InputProps={{
                                    sx: {
                                        overflow: 'auto',
                                        resize: 'none',
                                    },
                                    endAdornment: (
                                        <InputAdornment position='end'>
                                            <IconButton onClick={handleClearMessage}>
                                                <XIcon size={16} />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <StyledDialogActions className={'styled-buttons'}>
                                {parsing ? (
                                    <StyledButtonStartIcon
                                        color='secondary'
                                        variant='contained'
                                        startIcon={
                                            <StyledSVGDiv>
                                                <SpinnerIcon />
                                            </StyledSVGDiv>
                                        }
                                        disabled={parsing}
                                    >
                                        processing
                                    </StyledButtonStartIcon>
                                ) : (
                                    <StyledButtonStartIcon
                                        title={'Transcode and save to Mission Log'}
                                        color='secondary'
                                        variant='contained'
                                        onClick={handleParseMessage}
                                        startIcon={
                                            <StyledSVGDiv>
                                                <Recurrence />
                                            </StyledSVGDiv>
                                        }
                                        disabled={parsing}
                                    >
                                        transcode
                                    </StyledButtonStartIcon>
                                )}
                            </StyledDialogActions>
                            <StyledDialogContentOverFlowHidden className={'dialog-content'}>
                                {parsing || parsingError ? (
                                    <div />
                                ) : (
                                    <CurrentMissionLog messageEnvelope={currentMessage} />
                                )}
                            </StyledDialogContentOverFlowHidden>
                        </StyledFullHeightOverflowHiddenDiv>
                    </TabPanel>
                    <TabPanel
                        style={{ overflow: 'hidden', height: '100%' }} // must inline style due to TabPanel being defined in this class
                        value={tabValue}
                        index={1}
                        className={'styled-tab-panel-mission-log-container'}
                    >
                        <StyledFullHeightDiv className={'mission-log-summary-container'} value={tabValue} index={1}>
                            <MissionLogSummary />
                        </StyledFullHeightDiv>
                    </TabPanel>
                </StyledMissionLogWidgetContainer>
            ) : (
                <StyledFullHeightDiv>
                    <Typography>
                        Mission Log is not configured. Contact an Administrator to enable this tool.
                    </Typography>
                </StyledFullHeightDiv>
            )}
        </>
    );
};

const TabPanel = (props: { [x: string]: any; children: any; value: any; index: any }) => {
    const { children, value, index, ...other } = props;
    const classes = useStyles();
    return (
        <div
            className={classes.tabPanel}
            role='tabpanel'
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`vertical-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box style={{ height: '100%' }} p={3}>
                    {' '}
                    {children}
                </Box>
            )}
        </div>
    );
};
TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.any.isRequired,
    value: PropTypes.any.isRequired,
};

const a11yProps = (index: number) => {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
};

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

export default MissionLogWidget;
