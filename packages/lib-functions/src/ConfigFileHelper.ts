import { getPortalItemDataById } from './ArcGISPortalItemsHelper';

/**
 * This class supports the retrieving and parsing of values from a config JSON file.
 */
export class ConfigFileHelper {
    private static appConfig: any;
    private static appConfigPortal: any;
    private static appVersion: string;

    /**
     * Load the app config file based on the name of the file. It is expected to be found in the root
     * of the project's deployed location.
     * @param configFileName name of the config file - should end in .json
     * @param lookInRootOnly allows skipping the parsing of the window location pathname to find the root
     * Returns the contents of the config file as a JSON object
     */
    static async loadAppConfigFile(configFileName = '', lookInRootOnly = false): Promise<any> {
        if (!this.appConfig && configFileName === '') {
            const message = 'No configuration file for the application has been defined.';
            console.debug(message);
            throw new Error(message);
        }
        if (!this.appConfig) {
            const modifiedFileName =
                configFileName && configFileName.trim().endsWith('.json')
                    ? configFileName
                    : `${configFileName.trim()}.json`;
            try {
                const appLocation = window.location.pathname;
                const path = lookInRootOnly ? '' : appLocation.substring(0, appLocation.lastIndexOf('/'));
                const request = await fetch(`${path}/${modifiedFileName}`);
                this.appConfig = await request.json();
                //testing
                console.debug(this.appConfig);
            } catch (error) {
                console.error('Error getting App Config: ' + error);
            }
        }
        return this.appConfig;
    }

    /**
     * A convenience method to get the config JSON for the app without having to use an async method call.
     * This method depends on loadAppConfigFile having been called once in the application.
     * Returns the static JSON config object that holds the  app config data.
     */
    static getAppConfig(): any {
        return this.appConfig;
    }

    /**
     * Loads a text file for tracking the application version
     * @param versionTextFileName name of the version text file
     * Returns the text content of the file
     */
    static async loadAppVersion(versionTextFileName: string): Promise<string> {
        if (!this.appVersion) {
            this.appVersion = '';
            try {
                const appLocation = window.location.pathname;
                const path = appLocation.substring(0, appLocation.lastIndexOf('/'));
                const response = await fetch(`${path}/${versionTextFileName}`);
                if (response.ok) {
                    this.appVersion = await response.text();
                }
            } catch (error) {
                console.error('Error getting version text: ' + error);
            }
        }
        return this.appVersion;
    }

    /**
     * Gets a cached version of the text file holding app version data.
     */
    static getAppVersion(): string {
        return this.appVersion;
    }

    /**
     * Returns the portal config.
     */
    static getAppConfigPortal(): any {
        return this.appConfigPortal;
    }

    /**
     * Loads up the config from the default portal.
     * @param portalUrl URL to the default portal
     * Returns a JSON object representing the portal item data.
     * @param oauthAppId
     */
    static async loadAppConfigFromPortal(portalUrl: string, oauthAppId: string): Promise<any> {
        try {
            const request = await getPortalItemDataById(this.appConfig.portalConfigItemId, portalUrl, oauthAppId);
            this.appConfigPortal = JSON.parse(JSON.stringify(request));
        } catch (error) {
            console.error('Error getting portal config: ' + error);
        }
        return this.appConfigPortal;
    }
}
