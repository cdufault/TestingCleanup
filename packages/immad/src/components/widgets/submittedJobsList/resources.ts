/**
 * job status type enum
 */
export enum JobStatusType {
    INITIALIZING = 'checking status...',
    SUBMITTED = 'esriJobSubmitted',
    WAITING = 'esriJobWaiting',
    EXECUTING = 'esriJobExecuting',
    SUCCEEDED = 'esriJobSucceeded',
    FAILED = 'esriJobFailed',
    TIMEDOUT = 'esriJobTimedOut',
    CANCELLING = 'esriJobCancelling',
    CANCELLED = 'esriJobCancelled',
}

/**
 * returns a text description of a job's current status
 * @param jobStatus job status description
 */
export const getStatusDesc = (jobStatus: JobStatusType): string => {
    switch (jobStatus) {
        case JobStatusType.WAITING:
            return 'Waiting';
        case JobStatusType.SUBMITTED:
            return 'Submitted';
        case JobStatusType.EXECUTING:
            return 'Running';
        case JobStatusType.SUCCEEDED:
            return 'Complete';
        case JobStatusType.FAILED:
            return 'Failed';
        case JobStatusType.CANCELLING:
            return 'Cancelling';
        case JobStatusType.CANCELLED:
            return 'Cancelled';
        case JobStatusType.TIMEDOUT:
            return 'Timed Out';
        default:
            return 'Submitted';
    }
};
