/**
 * This class supports the retrieving and parsing of values from a config JSON file.
 */
export declare class ConfigFileHelper {
    private static appConfig;
    private static appConfigPortal;
    private static appVersion;
    /**
     * Load the app config file based on the name of the file. It is expected to be found in the root
     * of the project's deployed location.
     * @param configFileName name of the config file - should end in .json
     * @param lookInRootOnly allows skipping the parsing of the window location pathname to find the root
     * Returns the contents of the config file as a JSON object
     */
    static loadAppConfigFile(configFileName?: string, lookInRootOnly?: boolean): Promise<any>;
    /**
     * A convenience method to get the config JSON for the app without having to use an async method call.
     * This method depends on loadAppConfigFile having been called once in the application.
     * Returns the static JSON config object that holds the  app config data.
     */
    static getAppConfig(): any;
    /**
     * Loads a text file for tracking the application version
     * @param versionTextFileName name of the version text file
     * Returns the text content of the file
     */
    static loadAppVersion(versionTextFileName: string): Promise<string>;
    /**
     * Gets a cached version of the text file holding app version data.
     */
    static getAppVersion(): string;
    /**
     * Returns the portal config.
     */
    static getAppConfigPortal(): any;
    /**
     * Loads up the config from the default portal.
     * @param portalUrl URL to the default portal
     * Returns a JSON object representing the portal item data.
     * @param oauthAppId
     */
    static loadAppConfigFromPortal(portalUrl: string, oauthAppId: string): Promise<any>;
}
