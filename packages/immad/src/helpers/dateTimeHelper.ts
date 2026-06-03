/**
 * Returns the difference between the start time and end time in the format '00h 00m 00s'
 * @param startTime
 * @param endTime
 */
export function getElapsedTime(startTime: Date, endTime: Date): string {
    //elapsed time in seconds
    let timeDiff = Math.abs(endTime.getTime() - startTime.getTime()) / 1000;
    const diffSeconds = Math.floor(timeDiff % 60);
    //elapsed time in minutes
    timeDiff = timeDiff / 60;
    const diffMinutes = Math.floor(timeDiff % 60);
    //elapsed time in hours
    const diffHours = Math.floor(timeDiff / 60);

    //build response string
    let timeStr = diffHours > 0 ? diffHours + 'h ' : '';
    timeStr += diffMinutes > 0 ? diffMinutes + 'm ' : '';
    timeStr += diffSeconds + 's';

    return timeStr;
}
/**
 * Returns date object for noon at the specified longitude
 * Assumes 15 degrees of longitude per time zone to calculate rough UTC offset
 * @param longitude
 */
export function getMidDayAtLongitude(longitude: number): Date {
    const timeZone = Math.round((longitude * 24) / 360);
    const plusMinus = timeZone >= 0 ? '+' : '';
    return new Date(`${new Date().toDateString()} 12:00:00 UTC${plusMinus}${timeZone}`);
}

export function convertUTCToLocalDate(date: Date) {
    if (!date) {
        return date;
    }

    return new Date(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds()
    );
}

export function convertLocalToUTCDate(date: Date) {
    if (!date) {
        return date;
    }

    return new Date(
        Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            date.getHours(),
            date.getMinutes(),
            date.getSeconds()
        )
    );
}
