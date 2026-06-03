import { Logger } from '@stratcom/lib-functions';

/**
 * Supports logging information to the console
 */
export class LogHelper {
    /**
     * Logs application information to the console.
     * @param message log message
     * @param isError set to true to have the message flagged as an error
     */
    static log(message: string, isError?: boolean): void {
        Logger.logToConsole(message, isError);
    }
}
