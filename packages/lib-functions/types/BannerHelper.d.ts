import PortalItem from '@arcgis/core/portal/PortalItem';
import { Classification, ClassificationItem, ClassificationMarking } from './interfaces/Classification';
import { RelToOptions } from './interfaces/RelToOptions';
import { ClassificationColor } from './interfaces/ClassificationColor';
export declare const classifications: Classification[];
/**
 * Cleans the license info item and returns it without all the stringify items in it
 * @param originalLicenseInfo original license ifo object
 * @param classificationList list of classifications
 */
declare const cleanLicenseInfo: (originalLicenseInfo: string, classificationList: Classification[]) => string | null;
/**
 * Opens a new tab to the portal item id passed in *
 * @param host like https://cigt-srv21.esri.tech/portal/
 * @param id portal item id to link to
 */
declare const createPortalLink: (host: string, id: string) => string;
/**
 * Gets the classification banner color from a list of colors. The first element in the list is considered the "default/unknown" color.
 * @param classificationMarking // current marking
 * @param classificationConfigList // color list from config
 */
declare const getBannerColor: (classificationMarking: ClassificationMarking, classificationConfigList: ClassificationColor[]) => ClassificationColor;
/**
 * Gets the banner text based on all the caveats that have been established
 * @param classificationMarkingIn includes all current classification caveats
 * @param defaultClassification used to determine if the default text is needed
 * @param defaultBannerText the default text that will be used if needed
 */
declare const getBannerText: (classificationMarkingIn: ClassificationMarking, defaultClassification: Classification, defaultBannerText: string) => string;
/**
 * Gets the Classification for the classification banner by comparing classifications layer by layer
 * @param currentClassification
 * @param comparableClassification
 */
declare const getClassification: (currentClassification: Classification, comparableClassification?: Classification) => Classification;
/**
 * Returns default classification
 */
declare const getDefaultClassificationMarking: () => ClassificationMarking;
/**
 * Gets the Dissemination options for the classification banner based on the existing set and any that need to be added layer by layer
 * @param currentDisseminationOptions
 * @param newDisseminationOptions
 */
declare const getDisseminationOptions: (currentDisseminationOptions: string[], newDisseminationOptions: string[]) => string[];
/**
 * Gets the FGI options for the classification banner based on the existing set and any that need to be added layer by layer
 * @param currentFgiOptions
 * @param newFgiOptions
 */
declare const getFGIOptions: (currentFgiOptions: string[], newFgiOptions: string[]) => string[];
declare const getClassificationList: () => Classification[];
/**
 *  Gets the REL TO options for the classification banner based on the existing set and any that need to be added layer by layer
 * @param classificationMarking
 * @param newRelToOptions
 * @param newDisseminationOptions
 */
declare const getRelToOptions: (classificationMarking: ClassificationMarking, newRelToOptions: string[], newDisseminationOptions: string[]) => RelToOptions;
/**
 * Gets the SCI options for the classification banner based on the existing set and any that need to be added layer by layer
 * @param currentSciOptions
 * @param newSciOptions
 */
declare const getSCIOptions: (currentSciOptions: string[], newSciOptions: string[]) => string[];
/**
 * Update license info object on portal item
 * @param portalItem item to update
 * @param updatedLicenseInfo new or updated license info object
 */
declare const updateLicenseInfo: (portalItem: PortalItem, updatedLicenseInfo: string) => void;
/**
 * Update the classification calculation for the banner
 */
declare const updateClassificationCalculation: (classificationItems: ClassificationItem[], appConfigClassificationBanner: string) => ClassificationMarking | null;
/**
 * Tries the mission default manual classification from mission application item, if it has one.
 * Then this sets those values on the appropriate classification items.
 * @param classificationItems array of current classification items.
 * @param data the data object from the mission application
 */
declare const getDefaultManualClassification: (classificationItems: ClassificationItem[], data: any) => Promise<ClassificationItem[] | undefined>;
/**
 * Sets manual classification for an item and updates the classification items list.
 * @param item The classification item to set a manual classification
 * @param classification The classification marking to set, or null to remove the manual classification.
 */
declare const setManualClassification: (item: ClassificationItem, classification: ClassificationMarking | null) => Promise<ClassificationItem>;
export { cleanLicenseInfo, createPortalLink, getBannerText, getBannerColor, getClassification, getClassificationList, getDefaultClassificationMarking, getDisseminationOptions, getFGIOptions, getRelToOptions, getSCIOptions, updateLicenseInfo, updateClassificationCalculation, getDefaultManualClassification, setManualClassification, };
