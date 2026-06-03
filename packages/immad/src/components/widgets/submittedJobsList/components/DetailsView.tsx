// React imports
import React, { Fragment, useEffect, useRef, useState } from 'react';
import Request from '@arcgis/core/request';

import { GPResult, SubmittedJobType } from '../../../../contexts/SubmittedJobs';
import {
    AccordionDetails,
    Box,
    Divider,
    LinearProgress,
    Button,
    Link,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { StyledMuiAccordion, StyledMuiAccordionSummary } from '../../../administrator/styles';
import {
    JobText,
    StyledBlockBox,
    StyledFlexBox,
    StyledFlexGrowBox,
    StyledFullWidthBox,
    StyledJobResultsBox,
    StyledJobStatusBox,
    StyledPaddedBox,
} from '../styles';
import { InputFormItemType } from '../../../analyticCatalog/resources';
import { getTaskParameters } from '../../../../helpers/geoprocessingHelper';
import { getStatusDesc, JobStatusType } from '../resources';
import CheckCircleIcon from 'calcite-ui-icons-react/CheckCircleIcon';
import ExclamationMarkTriangleIcon from 'calcite-ui-icons-react/ExclamationMarkTriangleIcon';
import HourglassActiveIcon from 'calcite-ui-icons-react/HourglassActiveIcon';
import RunningIcon from 'calcite-ui-icons-react/RunningIcon';
import XCircleIcon from 'calcite-ui-icons-react/XCircleIcon';
import CalendarIcon from 'calcite-ui-icons-react/CalendarIcon';

interface SubmittedJobCardProps {
    job: SubmittedJobType;
}

interface ParamObject {
    name: string;
    value: string;
}

function DetailsView(props: SubmittedJobCardProps): JSX.Element {
    const { job } = props;
    const lastItemRef = useRef<HTMLDivElement>();
    const [expanded, setExpanded] = useState('statusPanel');
    const [parameterNames, setParameterNames] = useState<string[]>();
    const [parameterValues, setParameterValues] = useState<ParamObject[]>([]);
    const [resultElem, setResultElem] = useState<JSX.Element>();

    useEffect(() => {
        if (job) {
            //reset inputs
            setParameterValues([]);
            setParameterNames([]);
            //get the list of parameter names from the selected task and filter them
            getTaskParameters(job.jobUrl).then((allParams: InputFormItemType[] | undefined) => {
                if (allParams) {
                    //token fields are not shown as parameters
                    //output/calculated fields are not shown as parameters
                    //there is a special case for 'esri_out_feature_service_name' which is always shown/required EXCEPT for the visibility threat dome
                    const filteredParams = allParams.filter((p) => {
                        return (
                            (p.name.toUpperCase() !== 'RATOKEN' &&
                                p.name.toUpperCase() !== 'TOKEN' &&
                                p.direction != 'esriGPParameterDirectionOutput' &&
                                p.name != 'esri_out_feature_service_name') ||
                            (p.name === 'esri_out_feature_service_name' &&
                                job.jobTitle.toUpperCase() !== 'VISIBILITYTHREATDOME')
                        );
                    });
                    const tempNames: string[] = [];
                    filteredParams.forEach((param) => {
                        tempNames.push(param.name);
                    });
                    setParameterNames(tempNames);
                }
            });

            //set initial job results in ui
            getDisplayResults(job);
        }
    }, [job]);

    useEffect(() => {
        if (parameterNames) {
            //get the parameter values entered by the user
            parameterNames.forEach((param) => {
                const infoUrl = `${job.jobUrl}/jobs/${job.jobId}/inputs/${param}`;
                Request(infoUrl, {
                    query: {
                        f: 'json',
                    },
                    responseType: 'json',
                }).then((response) => {
                    if (response.data) {
                        setParameterValues((prevState) => [
                            ...prevState,
                            { name: param, value: JSON.stringify(response.data.value) },
                        ]);
                    }
                });
            });
        }
    }, [parameterNames]);

    useEffect(() => {
        if (lastItemRef.current && job.jobStatusMessages) {
            //scrolls status messages to bottom
            lastItemRef.current.scrollTop = lastItemRef.current.scrollHeight;
        }
    }, [job.jobStatusMessages]);

    useEffect(() => {
        //update job results in ui
        getDisplayResults(job);
        //show the results pane in the submitted jobs list
        if (job.jobResults) {
            setExpanded('resultsPanel');
        }
    }, [job.jobResults]);

    const getStatusIcon = () => {
        switch (job.jobStatus) {
            case JobStatusType.EXECUTING:
                return <RunningIcon />;
            case JobStatusType.SUCCEEDED:
                return <CheckCircleIcon />;
            case JobStatusType.FAILED:
                return <ExclamationMarkTriangleIcon />;
            case JobStatusType.CANCELLING:
            case JobStatusType.CANCELLED:
                return <XCircleIcon />;
            case JobStatusType.WAITING:
            case JobStatusType.SUBMITTED:
            default:
                return <HourglassActiveIcon />;
        }
    };

    const handleAccordionExpand = (panel: string, expanded: boolean) => {
        setExpanded(expanded ? panel : '');
    };

    /**
     * Gets the link for job result
     * @param job
     * @param resultsURL
     */
    const getLink = async (job: SubmittedJobType, resultsURL: string): Promise<string> => {
        let returnURL = `${job.jobUrl}/jobs/${job.jobId}/${resultsURL}`;
        const response = await Request(returnURL, {
            query: {
                f: 'json',
            },
            responseType: 'json',
        });
        if (response?.data && response.data?.value !== '') {
            if (response.data.value?.url) {
                returnURL = response.data.value.url;
            }
        }
        return returnURL;
    };

    async function getDisplayResults(job: SubmittedJobType): Promise<void> {
        const results: JSX.Element[] = [];
        const jobResults: GPResult[] | undefined = job.jobResults;

        if (jobResults) {
            // add link to main results page
            const jobResultsUrl = `${job.jobUrl}/jobs/${job.jobId}`;
            results.push(
                <StyledJobResultsBox key={'results'}>
                    <Typography>Job Results</Typography>
                    <Link href={jobResultsUrl} target='_blank' rel='noopener'>
                        <Button variant='contained' color='secondary'>
                            View Job Results
                        </Button>
                    </Link>
                </StyledJobResultsBox>
            );

            for (const [key, value] of Object.entries(jobResults)) {
                const link = await getLink(job, value.paramUrl);
                results.push(
                    <StyledJobResultsBox key={key}>
                        <Typography>{key}</Typography>
                        <Link href={link} target='_blank' rel='noopener'>
                            <Button variant='contained' color='secondary'>
                                View Details
                            </Button>
                        </Link>
                    </StyledJobResultsBox>
                );
            }
        }
        if (results.length > 0) {
            setResultElem(<StyledBlockBox display='block'>{results}</StyledBlockBox>);
        } else {
            setResultElem(undefined);
        }
    }

    function displayInputs(inputObj: any[]) {
        const inputElem: JSX.Element[] = [];
        inputObj &&
            inputObj.length > 0 &&
            inputObj.forEach((input) => {
                inputElem.push(
                    <TableRow key={`row_${input.name}`}>
                        <TableCell>{input.name}</TableCell>
                        <TableCell>{input.value}</TableCell>
                    </TableRow>
                );
            });
        return <>{inputElem}</>;
    }

    return (
        <Fragment>
            <Typography>Task Name: {job.jobTitle}</Typography>
            <Typography>ID: {job.jobId}</Typography>
            <StyledMuiAccordion
                expanded={expanded === 'statusPanel'}
                onChange={(event, expanded) => {
                    event && handleAccordionExpand('statusPanel', expanded);
                }}
            >
                <StyledMuiAccordionSummary>
                    <Typography>Status</Typography>
                </StyledMuiAccordionSummary>
                <AccordionDetails>
                    <StyledFullWidthBox>
                        <StyledFlexBox>
                            <StyledFlexGrowBox>
                                <StyledPaddedBox>{job.jobStatus && getStatusIcon()}</StyledPaddedBox>
                                <JobText variant='body2'>{job.jobStatus && getStatusDesc(job.jobStatus)}</JobText>
                            </StyledFlexGrowBox>
                            <StyledFlexBox>
                                <StyledPaddedBox>
                                    <CalendarIcon />
                                </StyledPaddedBox>
                                <JobText variant='body2'>{job.jobTimestamp}</JobText>
                            </StyledFlexBox>
                        </StyledFlexBox>
                        <Box
                            hidden={
                                job.jobStatus &&
                                (job.jobStatus === JobStatusType.EXECUTING ||
                                    job.jobStatus === JobStatusType.CANCELLING ||
                                    job.jobStatus === JobStatusType.WAITING)
                                    ? false
                                    : true
                            }
                        >
                            <Divider />
                            <StyledFullWidthBox>
                                <LinearProgress color={'secondary'} variant={'indeterminate'} />
                            </StyledFullWidthBox>
                        </Box>
                        <StyledJobStatusBox /* work around to add ref to a mui Box component, used for scrolling */
                            {...{
                                ref: lastItemRef,
                            }}
                        >
                            {job.jobStatusMessages?.map((message, idx) => {
                                return (
                                    <Typography noWrap key={`message_${idx}`}>
                                        {message.description}
                                    </Typography>
                                );
                            })}
                        </StyledJobStatusBox>
                    </StyledFullWidthBox>
                </AccordionDetails>
            </StyledMuiAccordion>
            <StyledMuiAccordion
                expanded={expanded === 'inputPanel'}
                onChange={(event, expanded) => {
                    event && handleAccordionExpand('inputPanel', expanded);
                }}
            >
                <StyledMuiAccordionSummary>
                    <Typography>Inputs</Typography>
                </StyledMuiAccordionSummary>
                <AccordionDetails>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Parameter</TableCell>
                                <TableCell>Value</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {parameterValues ? (
                                displayInputs(parameterValues)
                            ) : (
                                <Typography>Initializing...</Typography>
                            )}
                        </TableBody>
                    </Table>
                </AccordionDetails>
            </StyledMuiAccordion>
            <StyledMuiAccordion
                expanded={expanded === 'resultsPanel'}
                onChange={(event, expanded) => {
                    event && handleAccordionExpand('resultsPanel', expanded);
                }}
            >
                <StyledMuiAccordionSummary>
                    <Typography>Results</Typography>
                </StyledMuiAccordionSummary>
                <AccordionDetails>
                    {resultElem ? (
                        resultElem
                    ) : (
                        <Typography>{'Job status: ' + getStatusDesc(job.jobStatus as JobStatusType)}</Typography>
                    )}
                </AccordionDetails>
            </StyledMuiAccordion>
        </Fragment>
    );
}

export default DetailsView;
