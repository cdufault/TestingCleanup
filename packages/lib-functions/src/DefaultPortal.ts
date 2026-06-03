import Portal from '@arcgis/core/portal/Portal';
import { Logger } from './Logger';

/**
 * Supports getting the default portal for the application
 */
export class DefaultPortal {
    private static defaultPortal: Portal | undefined = undefined;

    /**
     * Get the portal at the URL defined in the JSON configuration file.
     * @param portalUrl URL to the default portal
     * Returns a portal object if found or undefined.
     */
    static async getTheDefaultPortal(portalUrl: string): Promise<Portal | undefined> {
        if (this.defaultPortal !== undefined && this.defaultPortal.url === portalUrl) {
            return this.defaultPortal;
        }

        this.defaultPortal = new Portal({ url: portalUrl });

        await this.defaultPortal.load().catch((e) => {
            Logger.logToConsole(e, true);
            return undefined;
        });
        return this.defaultPortal;
    }
}
