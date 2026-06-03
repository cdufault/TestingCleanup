// React imports
import React, { useContext, useEffect, useState } from 'react';

import { SubmittedJobsContext } from '../../../contexts/SubmittedJobs';

// Component imports
import { WidgetContainer, WidgetContent } from '../../common';

import SubmittedJobCard from './components/SubmittedJobCard';
import DetailsView from './components/DetailsView';

// Context imports
import { SubmittedJobType } from '../../../contexts/SubmittedJobs';
import { Box, Divider, IconButton } from '@mui/material';
import ArrowLeftIcon from 'calcite-ui-icons-react/ArrowLeftIcon';

/**
 * List of submitted jobs with name, status and cancel button
 * @param props
 */
function SubmittedJobsList(): JSX.Element {
    const { submittedJobs, removeJob, updateJob, tabValue } = useContext(SubmittedJobsContext);
    const [showResults, setShowResults] = useState<boolean>(false);
    const [selectedJob, setSelectedJob] = useState<SubmittedJobType>();

    useEffect(() => {
        //when switching to the results tab always show the submitted jobs list (closes job details if open)
        if (tabValue === 1) {
            setShowResults(false);
        }
    }, [tabValue]);

    return (
        <WidgetContainer>
            <WidgetContent elevation={0}>
                <Box hidden={showResults}>
                    {submittedJobs &&
                        submittedJobs.map((job: SubmittedJobType) => (
                            <SubmittedJobCard
                                key={job.jobId}
                                job={job}
                                removeJob={removeJob}
                                updateJob={updateJob}
                                setShowResults={setShowResults}
                                setSelectedJob={setSelectedJob}
                            />
                        ))}
                </Box>
                <Box hidden={!showResults}>
                    <IconButton
                        size='small'
                        onClick={() => {
                            setShowResults(false);
                        }}
                        title='Go back to the starting page.'
                    >
                        <ArrowLeftIcon size={30} />
                    </IconButton>
                    <Divider />
                    {selectedJob && <DetailsView job={selectedJob} />}
                </Box>
            </WidgetContent>
        </WidgetContainer>
    );
}

export default SubmittedJobsList;
