import PortalItem from '@arcgis/core/portal/PortalItem';
import { ClassificationMarking } from '@stratcom/lib-functions/types/interfaces/Classification';

/**
 * This interface holds information to help create the items in the information modal
 */
export interface LayerListItem {
    layerId: string | null;
    portalItem: PortalItem | null;
    classificationMarking: ClassificationMarking;
    title: string | null;
    useManualClassification: boolean;
    isEligible: boolean;
}
