/**
 * Types of log message outputs that the user can specify
 */
export enum LogType {
    DEBUG,
    ERROR,
    WARN,
    INFO,
    LOG,
}

/**Type for method input representing a LogType */
type LogTypeStrings = keyof typeof LogType;

/**
 * Supports logging information to the console
 */
export class Logger {
    /**
     * Logs application information to the console.
     * @param message log message
     * @param isError set to true to have the message flagged as an error
     * @param debug a flag that can be set to turn off logging data to the console
     * Returns void
     */
    static logToConsole(message: string, isError?: boolean, debug = true): void {
        if (debug) {
            if (isError) {
                console.error(message);
            } else {
                console.log(message);
            }
        }
    }

    /**
     * Write a specific type of message to the console
     * @param message log message to print to console
     * @param type has valid types: info, warn, debug, error
     * @param obj an object to output
     */
    static log(message = '', type: LogTypeStrings, obj: any = undefined): void {
        const objDub = obj ? obj : 'No object was defined.';
        let outputMessage;
        switch (type) {
            case 'DEBUG':
                outputMessage = message !== '' ? message : 'Debug Message';
                console.debug('Message: %s \nObject: %O', outputMessage, objDub);
                break;
            case 'WARN':
                outputMessage = message !== '' ? message : 'Warning Message';
                console.warn('Message: %s \nObject: %O', outputMessage, objDub);
                break;
            case 'INFO':
                outputMessage = message !== '' ? message : 'Info Message';
                console.info('Message: %s \nObject: %O', outputMessage, objDub);
                break;
            case 'LOG':
                outputMessage = message !== '' ? message : 'Log Message';
                console.log('Message: %s \nObject: %O', outputMessage, objDub);
                break;
            case 'ERROR':
                outputMessage = message !== '' ? message : 'Error Message';
                console.error('Message: %s \nObject: %O', outputMessage, objDub);
                break;
            default:
                outputMessage = message !== '' ? message : 'Log Message';
                console.log('Message: %s \nObject: %O', outputMessage, objDub);
        }
    }
}
