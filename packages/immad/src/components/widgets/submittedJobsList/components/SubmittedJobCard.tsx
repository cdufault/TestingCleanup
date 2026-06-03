// React imports
import React, { useState, useEffect } from 'react';
import Request from '@arcgis/core/request';

//component imports
import { Typography, Divider, CardActions, Box, LinearProgress } from '@mui/material';

import { ActionButton } from '../../../common';
import CheckCircleIcon from 'calcite-ui-icons-react/CheckCircleIcon';
import {
    CenterBox,
    JobCard,
    JobCardContent,
    JobCardHeader,
    JobText,
    StyledFlexBox,
    StyledFlexGrowBox,
    StyledGrowBox,
} from '../styles';
import { useSnackbar } from 'notistack';

// Context imports
import { SubmittedJobType } from '../../../../contexts/SubmittedJobs';
import { LogHelper } from '../../../../helpers/logHelper';
import HourglassActiveIcon from 'calcite-ui-icons-react/HourglassActiveIcon';
import RunningIcon from 'calcite-ui-icons-react/RunningIcon';
import ExclamationMarkTriangleIcon from 'calcite-ui-icons-react/ExclamationMarkTriangleIcon';
import XCircleIcon from 'calcite-ui-icons-react/XCircleIcon';
import CalendarIcon from 'calcite-ui-icons-react/CalendarIcon';

// Helper imports
import { getElapsedTime } from '../../../../helpers/dateTimeHelper';
import { JobStatusType, getStatusDesc } from '../resources';

interface SubmittedJobCardProps {
    job: SubmittedJobType;
    removeJob: (submittedJob: SubmittedJobType) => void;
    updateJob: (submittedJob: SubmittedJobType) => void;
    setShowResults: React.Dispatch<React.SetStateAction<boolean>>;
    setSelectedJob: React.Dispatch<React.SetStateAction<SubmittedJobType>>;
}

function SubmittedJobCard(props: SubmittedJobCardProps): JSX.Element {
    const { job, removeJob, updateJob, setShowResults, setSelectedJob } = props;
    const [jobPercentComplete, setJobPercentComplete] = useState<number>();
    const [taskProgress, setTaskProgress] = useState<string[]>();
    const [timeElapsed, setTimeElapsed] = useState<string>();
    const [lostConnection, setLostConnection] = useState<boolean>(false);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        let mounted = true;
        const getJobStatus = async (submittedJob: SubmittedJobType) => {
            const response = await Request(submittedJob.jobUrl + '/jobs/' + submittedJob.jobId, {
                query: {
                    f: 'json',
                },
                responseType: 'json',
            });
            return response.data;
        };

        let errorCount = 0;
        const interval = setInterval(() => {
            getJobStatus(job).then(
                (jobStatusResponse) => {
                    setLostConnection(false);
                    if (!mounted) {
                        clearInterval(interval);
                    } else {
                        const status = jobStatusResponse.jobStatus;
                        job.jobStatus = status;
                        const startTime = new Date(job.jobTimestamp);
                        const currentTime = new Date();
                        setTimeElapsed(getElapsedTime(startTime, currentTime));

                        if (
                            status === JobStatusType.SUCCEEDED ||
                            status === JobStatusType.FAILED ||
                            status === JobStatusType.CANCELLED
                        ) {
                            clearInterval(interval);
                        }
                        if (jobStatusResponse.progress && jobStatusResponse.progress.percent) {
                            setTaskProgress(jobStatusResponse.progress.message);
                            setJobPercentComplete(jobStatusResponse.progress.percent);
                        } else {
                            setTaskProgress(undefined);
                            setJobPercentComplete(undefined);
                        }
                        if (jobStatusResponse.messages) {
                            job.jobStatusMessages = jobStatusResponse.messages;
                        }
                        if (jobStatusResponse.results) {
                            job.jobResults = jobStatusResponse.results;
                        }
                        updateJob(job);
                    }
                },
                (error) => {
                    errorCount++;
                    setLostConnection(true);
                    LogHelper.log(error, true);
                    if (errorCount > 10) {
                        enqueueSnackbar('Error getting job status.', {
                            variant: 'error',
                        });
                        clearInterval(interval);
                    }
                }
            );
        }, 5000);

        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    const cancelJob = (submittedJob: SubmittedJobType) => {
        Request(submittedJob.jobUrl + '/jobs/' + submittedJob.jobId + '/cancel', {
            query: {
                f: 'json',
            },
            method: 'post',
            responseType: 'json',
        });
    };

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

    return (
        <JobCard variant='outlined'>
            <JobCardHeader
                title={job.jobTitle}
                titleTypographyProps={{
                    variant: 'h6',
                }}
            />
            <JobCardContent>
                <StyledFlexBox>
                    <StyledFlexGrowBox>
                        <Box paddingRight={0.5}>{job.jobStatus && getStatusIcon()}</Box>
                        <JobText variant='body2'>{job.jobStatus && getStatusDesc(job.jobStatus)}</JobText>
                    </StyledFlexGrowBox>
                    <StyledFlexBox>
                        <Box paddingRight={0.5}>
                            <CalendarIcon />
                        </Box>
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
                    {taskProgress && <Typography variant='subtitle1'>{taskProgress}</Typography>}
                    {lostConnection ? (
                        <Box>
                            <Typography variant='subtitle1'>Reconnecting...</Typography>
                        </Box>
                    ) : (
                        <CenterBox>
                            <StyledGrowBox>
                                <LinearProgress
                                    color={'secondary'}
                                    variant={jobPercentComplete ? 'determinate' : 'indeterminate'}
                                    value={jobPercentComplete}
                                />
                            </StyledGrowBox>
                            {jobPercentComplete && <JobText variant='body2'>{jobPercentComplete}%</JobText>}
                        </CenterBox>
                    )}
                </Box>
                <Box hidden={timeElapsed ? false : true}>
                    <Divider />
                    <Typography variant='subtitle1'>{`Total running time: ${timeElapsed}`}</Typography>
                </Box>
            </JobCardContent>
            <Divider />
            <CardActions>
                <Box hidden={job.jobStatus && job.jobStatus === JobStatusType.EXECUTING ? false : true}>
                    <ActionButton
                        variant='contained'
                        color='secondary'
                        onClick={() => {
                            cancelJob(job);
                        }}
                    >
                        Cancel
                    </ActionButton>
                </Box>
                <Box
                    hidden={
                        job.jobStatus &&
                        (job.jobStatus === JobStatusType.FAILED ||
                            job.jobStatus === JobStatusType.SUCCEEDED ||
                            job.jobStatus === JobStatusType.CANCELLED)
                            ? false
                            : true
                    }
                >
                    <ActionButton
                        variant='contained'
                        color='secondary'
                        onClick={() => {
                            removeJob(job);
                        }}
                    >
                        Remove
                    </ActionButton>
                </Box>
                <Box hidden={job.jobStatus && job.jobStatus != JobStatusType.INITIALIZING ? false : true}>
                    <ActionButton
                        variant='contained'
                        color='secondary'
                        onClick={() => {
                            setSelectedJob(job);
                            setShowResults(true);
                        }}
                    >
                        View Details
                    </ActionButton>
                </Box>
            </CardActions>
        </JobCard>
    );
}
export default SubmittedJobCard;
