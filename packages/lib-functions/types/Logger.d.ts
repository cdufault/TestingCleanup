/**
 * Types of log message outputs that the user can specify
 */
export declare enum LogType {
    DEBUG = 0,
    ERROR = 1,
    WARN = 2,
    INFO = 3,
    LOG = 4
}
/**Type for method input representing a LogType */
type LogTypeStrings = keyof typeof LogType;
/**
 * Supports logging information to the console
 */
export declare class Logger {
    /**
     * Logs application information to the console.
     * @param message log message
     * @param isError set to true to have the message flagged as an error
     * @param debug a flag that can be set to turn off logging data to the console
     * Returns void
     */
    static logToConsole(message: string, isError?: boolean, debug?: boolean): void;
    /**
     * Write a specific type of message to the console
     * @param message log message to print to console
     * @param type has valid types: info, warn, debug, error
     * @param obj an object to output
     */
    static log(message: string | undefined, type: LogTypeStrings, obj?: any): void;
}
export {};
