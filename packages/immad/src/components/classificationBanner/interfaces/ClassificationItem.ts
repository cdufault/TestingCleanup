import WebScene from '@arcgis/core/WebScene';
import WebMap from '@arcgis/core/WebMap';
import PortalItem from '@arcgis/core/portal/PortalItem';
import Layer from '@arcgis/core/layers/Layer';
import { ClassificationMarking } from '@stratcom/lib-functions/types/interfaces/Classification';

/**
 * ClassificationItem interface
 */
export interface ClassificationItem {
    id: string;
    type: string;
    title: string;
    licenseInfo: string;
    portalHostname: string;
    classification: ClassificationMarking | null;
    manualClassification: ClassificationMarking | null;
}

/**
 * Create classification items for Portal Item, Layer, WebScene or WebMap
 * @param item item to set classifications on
 */
export const createClassificationItem = async (
    item: PortalItem | Layer | WebScene | WebMap
): Promise<ClassificationItem> => {
    let classificationMarking: ClassificationMarking | null = null;
    if (item instanceof PortalItem) {
        const portalItem = item as PortalItem;
        if (portalItem.licenseInfo) {
            classificationMarking = await createClassificationMarkingFromLicenseInfo(portalItem.licenseInfo);
        } else {
            classificationMarking = null;
        }
        return {
            id: portalItem.id,
            type: 'portal',
            title: portalItem.title,
            licenseInfo: portalItem.licenseInfo || '',
            portalHostname: portalItem.portal?.portalHostname || '',
            classification: classificationMarking,
            manualClassification: null,
        };
    } else if (item instanceof Layer) {
        const layerItem = item as Layer;
        const portalItem = (layerItem as any)?.portalItem as PortalItem;
        if (portalItem?.licenseInfo) {
            classificationMarking = await createClassificationMarkingFromLicenseInfo(portalItem.licenseInfo);
        } else {
            classificationMarking = null;
        }
        return {
            id: portalItem?.id || layerItem.id,
            type: 'layer',
            title: layerItem.title,
            licenseInfo: portalItem?.licenseInfo || '',
            portalHostname: portalItem?.portal?.portalHostname || '',
            classification: classificationMarking,
            manualClassification: null,
        };
    } else if (item instanceof WebMap || item instanceof WebScene) {
        const webMapItem = item as WebMap | WebScene;
        if (webMapItem.portalItem?.licenseInfo) {
            classificationMarking = await createClassificationMarkingFromLicenseInfo(webMapItem.portalItem.licenseInfo);
        } else {
            classificationMarking = null;
        }
        return {
            id: webMapItem.portalItem?.id || '',
            type: 'webscene',
            title: webMapItem.portalItem?.title || '',
            licenseInfo: webMapItem.portalItem?.licenseInfo || '',
            portalHostname: webMapItem.portalItem?.portal?.portalHostname || '',
            classification: classificationMarking,
            manualClassification: null,
        };
    }
    throw new Error('Unknown item');
};

/**
 * Creates a classification item object from a licenseInfo passed in.
 * @param licenseInfo license info string
 */
export const createClassificationMarkingFromLicenseInfo = async (
    licenseInfo: string | null
): Promise<ClassificationMarking | null> => {
    if (licenseInfo) {
        const cleanLicenseInfo = licenseInfo.replace(/&quot;/g, '"').match(/{.*?}/);
        if (cleanLicenseInfo) {
            return JSON.parse(cleanLicenseInfo[0]) as ClassificationMarking;
        }
    }
    return null;
};
