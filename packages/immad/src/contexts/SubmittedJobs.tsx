import React, { createContext, useEffect, useRef, useState } from 'react';
import { JobStatusType } from '../components/widgets/submittedJobsList/resources';

export interface SubmittedJobType {
    jobTitle: string;
    jobId: string;
    jobUrl: string;
    jobTimestamp: string;
    jobStatus?: JobStatusType;
    jobStatusMessages?: __esri.GPMessage[];
    jobResults?: GPResult[];
}

export interface GPResult {
    paramUrl: string;
}

interface SubmittedJobsProviderProps {
    children: JSX.Element[] | JSX.Element;
}

interface ContextProps {
    submittedJobs: SubmittedJobType[] | undefined;
    setSubmittedJobs: React.Dispatch<React.SetStateAction<SubmittedJobType[]>>;
    lastUsedFeatureClassNames: string[] | undefined;
    setLastUsedFeatureClassNames: React.Dispatch<React.SetStateAction<string[]>>;
    tabValue: number;
    setTabValue: React.Dispatch<React.SetStateAction<number>>;
    removeJob: (submittedJob: SubmittedJobType) => void;
    updateJob: (updatedJob: SubmittedJobType) => void;
}

export const SubmittedJobsContext = createContext<ContextProps>({
    submittedJobs: [],
    setSubmittedJobs: () => {
        return;
    },
    lastUsedFeatureClassNames: [],
    setLastUsedFeatureClassNames: () => {
        return;
    },
    tabValue: 0,
    setTabValue: () => {
        return;
    },
    removeJob: () => {
        return;
    },
    updateJob: () => {
        return;
    },
});

export const SubmittedJobsProvider = ({ children }: SubmittedJobsProviderProps): JSX.Element => {
    const [submittedJobs, setSubmittedJobs] = useState<SubmittedJobType[]>();
    const [lastUsedFeatureClassNames, setLastUsedFeatureClassNames] = useState([]);
    const submittedJobsRef = useRef<SubmittedJobType[]>();
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        submittedJobsRef.current = submittedJobs;
    }, [submittedJobs]);

    const removeJob = (submittedJob: SubmittedJobType) => {
        const newSubmittedJobsList = submittedJobsRef.current?.filter((job) => {
            return job !== submittedJob;
        });
        setSubmittedJobs(newSubmittedJobsList);
    };

    const updateJob = (updatedJob: SubmittedJobType) => {
        const submittedJobsClone = JSON.parse(JSON.stringify(submittedJobsRef.current)) as SubmittedJobType[];
        const index = submittedJobsClone.findIndex((job) => job.jobId === updatedJob.jobId);
        submittedJobsClone[index] = updatedJob;
        setSubmittedJobs(submittedJobsClone);
    };

    const value = {
        submittedJobs,
        setSubmittedJobs,
        lastUsedFeatureClassNames,
        setLastUsedFeatureClassNames,
        tabValue,
        setTabValue,
        removeJob,
        updateJob,
    };

    return <SubmittedJobsContext.Provider value={value}>{children}</SubmittedJobsContext.Provider>;
};
