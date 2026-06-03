import Portal from '@arcgis/core/portal/Portal';
/**
 * Supports getting the default portal for the application
 */
export declare class DefaultPortal {
    private static defaultPortal;
    /**
     * Get the portal at the URL defined in the JSON configuration file.
     * @param portalUrl URL to the default portal
     * Returns a portal object if found or undefined.
     */
    static getTheDefaultPortal(portalUrl: string): Promise<Portal | undefined>;
}
