import Layer from '@arcgis/core/layers/Layer';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import FeatureLayerBaseApplyEditsEdits = __esri.FeatureLayerBaseApplyEditsEdits;
import Graphic from '@arcgis/core/Graphic';
import { ConfigHelper } from '../../../../helpers/configHelper';
import PortalItem from '@arcgis/core/portal/PortalItem';
import EditsResult = __esri.EditsResult;

/**
 * Given a Layer and mission id, this method "pushes" the layer to the mission by adding its portal item to the dynamic layer service table.
 * @param layer The input Layer. The layer must have a Portal item associated with it.
 * @param missionId The mission ID
 * @param defaultExpirationTimeHrs number of hours that the push layer will be valid
 */
export async function pushLayerToMission(
    layer: Layer,
    missionId: string,
    gateAppId: string,
    defaultExpirationTimeHrs: number
): Promise<EditsResult | undefined> {
    if (!gateAppId) {
        console.error('No GATE Application ID is present. Cannot push a layer to a mission.');
        return;
    }
    let appConfigPortal = await ConfigHelper.loadGateAppConfigFromPortal(gateAppId);
    switch (layer.type) {
        case 'feature': {
            console.debug('Pushing layer...');

            if (!appConfigPortal.dynamicLayerServiceId?.itemId) {
                console.error('No Dynamic Layer Service ID is present. Cannot push a layer to a mission.');
                return;
            }
            try {
                const editLayer = (await Layer.fromPortalItem({
                    portalItem: {
                        id: appConfigPortal.dynamicLayerServiceId.itemId,
                    } as PortalItem,
                })) as FeatureLayer;

                const featureLayer = layer as FeatureLayer;
                const portalItem = featureLayer.portalItem;
                const id = portalItem.id;

                // add time interval;
                const removeByTimestamp =
                    defaultExpirationTimeHrs && defaultExpirationTimeHrs > 0
                        ? Date.now() + defaultExpirationTimeHrs * 60 * 60 * 1000
                        : null;

                if (id) {
                    const graphic = new Graphic();
                    graphic.attributes = {
                        layer_item_id: id,
                        mission_id: missionId,
                        default_visibility: 1,
                        layer_symbology_2d: null,
                        layer_symbology_3d: null,
                        remove_by_date: removeByTimestamp,
                    };

                    const edits: FeatureLayerBaseApplyEditsEdits = {
                        addFeatures: [graphic],
                    };

                    return (await editLayer.applyEdits(edits)) as EditsResult;
                }
            } catch (e) {
                console.error(e.message);
            }
            break;
        }
        default:
            console.error('Unsupported layer type.');
            break;
    }
}
