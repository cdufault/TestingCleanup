/**
 * Represents the Dynamic Portal configuration for GATE.
 */
export interface GateDynamicConfig {
    /** region Feature Class Portal ID */
    regionFeatureClassId: string;
    /** landing page categories Feature Class Portal ID */
    landingPageCategoriesFeatureClassId: string;
    /** Gate calendar Feature Class Portal ID */
    gateCalendarFeatureClassId: string;
    /** J2 Summary Feature Class Portal ID */
    j2SummaryFeatureClassId: string;
    /** sources Feature Class Portal ID */
    sourcesFeatureClassId: string;
    /** analyst Comments Feature Class Portal ID */
    analystCommentsFeatureClassId: string;
    /**  alias for analyst comments */
    analystCommentsAlias: string;
    /** alias for branding title on landing page */
    brandingTitleAlias: string;
    /** alias for branding subtitle on landing page */
    brandingSubtitleAlias: string;
    /** Gate logo for display on landing page */
    brandingLogo: string;
    /**  value for the title of the high interest event card */
    highInterestEventCardTitle: string;

    /**
     * Dynamic Feature Service ID
     */
    dynamicLayerServiceId: { itemId: string };

    /**
     * Dynamic Feature Service Polling interval in minutes
     */
    dynamicLayerServicePollIntervalMins: number;

    /**s
     * Dynamic Feature Service Polling interval in hours
     */
    dynamicLayerServiceDefaultExpirationTimeHrs: number;

    /** highest classification for Gate system display */
    systemHighClassification: string;
}
