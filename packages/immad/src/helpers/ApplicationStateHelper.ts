// esri imports
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import FeatureSet from '@arcgis/core/rest/support/FeatureSet';
// Helper classes
import { IUserSaveState } from '../interfaces/UserSaveState';

// context imports
import { ConfigHelper } from './configHelper';
import WebScene from '@arcgis/core/WebScene';
import SceneView from '@arcgis/core/views/SceneView';
import WebMap from '@arcgis/core/WebMap';
import ImageryLayer from '@arcgis/core/layers/ImageryLayer';
import Request from '@arcgis/core/request';
import PortalItem from '@arcgis/core/portal/PortalItem';
import PortalUser from '@arcgis/core/portal/PortalUser';
import MapView from '@arcgis/core/views/MapView';
import { syncLayerInfo } from '../components/menuBar/components/remoteView/helpers/footprintHelper';

export interface ApplicationStateHelperResult {
    success: boolean;
    message: string;
}

export class ApplicationStateHelper {
    public static iUserSaveState: IUserSaveState;

    /**
     * TESTING METHOD - as the saving and loading state related tickets get worked having the ability to clear state
     * should be a useful utility method. Currently not wired to anything in the UI.
     * @param portalUser current user
     */
    static async clearUserState(portalUser: PortalUser) {
        const featureLayer = await this.getDefaultSavedStateFeatureLayer();

        if (featureLayer) {
            let oidValue = -1;
            const saveStateTableQuery = featureLayer.createQuery();
            saveStateTableQuery.where = "created_user = '" + portalUser.username + "'";
            await featureLayer.queryFeatures(saveStateTableQuery).then(async (result: FeatureSet) => {
                if (result.features.length > 0) {
                    oidValue = result.features[0].attributes[featureLayer.objectIdField];
                }
                if (oidValue !== -1) {
                    await featureLayer
                        .applyEdits({
                            deleteFeatures: [{ objectId: oidValue }],
                        })
                        .catch((error: any) => {
                            console.error('error' + JSON.stringify(error));
                        });
                }
            });
        }
    }

    /**
     * Gets the currently saved state Json object from feature service containing it.
     * @param: string userName- current user
     */
    static async getUserSavedState(portalUser: PortalUser): Promise<IUserSaveState> {
        const appConfigPortal = ConfigHelper.getAppConfigPortal();
        const portal = portalUser.portal;
        await portal.load();
        const queryParams = {
            query: `id: ${appConfigPortal.savedState.itemId}`,
            num: 1,
        };
        const result = await portal.queryItems(queryParams);
        if (result.total === 0) {
            // User has no access, or saved state table item ID does not exist in this portal.
            throw new Error('The user does not have access or item ID does not exist in this Portal.');
        }

        const featureLayer = await this.getDefaultSavedStateFeatureLayer();

        if (featureLayer) {
            const saveStateTableQuery = featureLayer.createQuery();
            saveStateTableQuery.where = "created_user = '" + portalUser.username + "'";
            await featureLayer.queryFeatures(saveStateTableQuery).then(async (result: FeatureSet) => {
                if (result.features.length != 0) {
                    this.iUserSaveState = JSON.parse(atob(result.features[0].attributes.savedjsonstate));
                    return this.iUserSaveState;
                } else {
                    return this.iUserSaveState;
                }
            });
        }
        return this.iUserSaveState;
    }

    static async updateSavedUserFeature(
        userName: string,
        userSaveObjectJson: IUserSaveState
    ): Promise<ApplicationStateHelperResult> {
        // get object and update it
        const featureLayer = await this.getDefaultSavedStateFeatureLayer();
        let edits: any;
        if (featureLayer) {
            const saveStateTableQuery = featureLayer.createQuery();
            saveStateTableQuery.where = "created_user = '" + userName + "'";
            return await featureLayer.queryFeatures(saveStateTableQuery).then(async (result: FeatureSet) => {
                const featureValue = result.features[0];
                if (featureValue) {
                    featureValue.attributes.savedjsonstate = btoa(JSON.stringify(userSaveObjectJson));
                    edits = {
                        updateFeatures: [featureValue],
                    };
                    return featureLayer.applyEdits(edits).then((result: any) => {
                        if (result.updateFeatureResults.length > 0) {
                            if (result.updateFeatureResults[0].error) {
                                const errorMessage = result.updateFeatureResults[0].error.message;
                                console.error(errorMessage);
                                return { success: false, message: errorMessage };
                            } else {
                                return { success: true, message: 'Save successful.' };
                            }
                        } else {
                            return { success: false, message: 'Apply edits failed see server logs for more detail' };
                        }
                    });
                } else {
                    return { success: false, message: `No row to update for ${userName}.` };
                }
            });
        } else {
            return { success: false, message: 'FeatureLayer did not exist' };
        }
    }

    /**
     * logic to save workspace versions of those if they exist
     */
    static async createSavedUserFeature(userState: IUserSaveState): Promise<string> {
        const saveFeature = {
            attributes: {
                savedjsonstate: btoa(JSON.stringify(userState)),
            },
        } as __esri.Graphic;
        const edits = { addFeatures: [saveFeature] };

        const featureLayer = await this.getDefaultSavedStateFeatureLayer();
        if (featureLayer) {
            return featureLayer.applyEdits(edits).then((result: any) => {
                if (result.addFeatureResults.length > 0) {
                    // check for error
                    if (result.addFeatureResults[0].error) {
                        return result.addFeatureResults[0].error.message;
                    } else {
                        return 'true';
                    }
                } else {
                    return 'Apply edits failed see server logs for more detail';
                }
            });
        } else {
            return 'FeatureLayer did not exist';
        }
    }

    /**
     * Get a Feature layer object from the FeatureLayer portal item ID
     * @param featureLayerId is the portalItemID
     */
    static getFeatureLayerByID(featureLayerId: string): FeatureLayer {
        return new FeatureLayer({
            portalItem: {
                id: featureLayerId,
            },
        });
    }

    /**
     * Get a default Saved State Feature layer object from the portal
     */
    static getDefaultSavedStateFeatureLayer(): FeatureLayer {
        const portalAppConfig = ConfigHelper.getAppConfigPortal();
        return new FeatureLayer({
            portalItem: {
                id: portalAppConfig.savedState.itemId,
            },
        });
    }

    /**
     * Save a sceneView to an existing WebScene. Will remove the Raster analysis layer from the scene
     * if it is in the 'View.map'
     * @param portalId
     * @param view
     *
     */
    static async saveWebScene(portalId: string, view: SceneView): Promise<WebScene | PortalItem | undefined> {
        let scene = new WebScene({
            portalItem: {
                id: portalId,
            },
        });
        if (view) {
            return await scene.load().then(async () => {
                // Do Destroy of scene here but save portalItem
                const portalItem = scene.portalItem;
                (scene.portalItem as any) = null;
                scene.destroy();
                // place view map as scene reset portal item to save all layers
                scene = (await ApplicationStateHelper.removeLayersNotSaved(view.map)) as WebScene;
                scene.portalItem = portalItem;
                return scene.updateFrom(view as SceneView).then(async () => {
                    return scene.save();
                });
            });
        }
    }

    /**
     * Save a sceneView as a WebScene. Will remove the Raster analysis layer from the scene
     * if it is in the 'View.map'
     * @param title
     * @param view
     */
    static async saveAsWebScene(title: string, view: SceneView): Promise<__esri.PortalItem | undefined> {
        const item = {
            title,
        };
        if (view) {
            const scene = (await ApplicationStateHelper.removeLayersNotSaved(view.map)) as WebScene;
            return scene.updateFrom(view as SceneView).then(async () => {
                return scene.saveAs(item);
            });
        }
    }

    /**
     * Removes https:// or http:// from URLs passed in. If none is there
     * it will return the original url passed in.
     * @param url to remove values from
     */
    static async removeHttp(url: string): Promise<string> {
        if (url.startsWith('https://')) {
            const https = 'https://';
            return url.slice(https.length);
        }
        if (url.startsWith('http://')) {
            const http = 'http://';
            return url.slice(http.length);
        }
        return url;
    }

    /**
     * Save a webMap to an existing webMap.
     * @param portalId of item to overwrite
     * @param view as MapView
     */
    static async saveWebMap(portalId: string, view: MapView): Promise<any> {
        let webmap = new WebMap({
            portalItem: {
                id: portalId,
            },
        });
        return webmap.load().then(async () => {
            // Do Destroy of webMap here but save portalItem
            const portalItem = webmap.portalItem;
            (webmap.portalItem as any) = null;
            webmap.destroy();
            // place view map as webmap reset portal item to save all layers
            if (view && view.type === '2d') {
                (webmap as any) = await ApplicationStateHelper.removeLayersNotSaved(view.map as __esri.Map);
                webmap.portalItem = portalItem;
                return webmap
                    .updateFrom(view as MapView)
                    .then(() => {
                        // scale was missing from the updateFrom view
                        if (webmap.initialViewProperties.viewpoint.scale !== view.viewpoint.scale) {
                            webmap.initialViewProperties.viewpoint.scale = view.viewpoint.scale;
                        }
                        return webmap.save().then(() => {
                            return ApplicationStateHelper.saveWithImageryLayers(webmap);
                        });
                    })
                    .catch((error: { message: string }) => {
                        console.error(error.message);
                        return error;
                    });
            }
        });
    }

    /**
     * Save a mapView as a webMap.
     * @param title to save as
     * @param view current view as MapView
     */
    static async saveAsWebMap(title: string, view: MapView): Promise<any> {
        const item = {
            title,
        };
        if (view) {
            const tempMap = await ApplicationStateHelper.removeLayersNotSaved(view.map);
            const map = tempMap as WebMap;
            return map
                .updateFrom(view as MapView)
                .then(() => {
                    return map.saveAs(item).then(() => {
                        return ApplicationStateHelper.saveWithImageryLayers(map);
                    });
                })
                .catch((error: { message: string }) => {
                    console.error(error.message);
                    return error;
                });
        } else {
            const message = 'Error: view was undefined could not complete saveAsWebMap!';
            console.error(message);
            return message;
        }
    }

    /**
     * Needed to save imagery layers with WebMaps since 4.x js api is missing this type
     * of functionality out of the box. This function was derived from network traffic
     * observed by ArcGIS Portal and how it saves imagery layers into WebMaps.
     * @param webmap
     */
    static async saveWithImageryLayers(webmap: WebMap): Promise<__esri.RequestResponse> {
        const layers = webmap.layers;
        const formData = new FormData();
        const webMapData = await webmap.portalItem.fetchData();
        const opLayersToSearch = webMapData.operationalLayers;
        const operationalLayers = [];
        let itemFoundLocation = -1;
        // get first item in layers and checking if it is first item in operational layers.
        for (let i = 0; i < layers.length; i++) {
            for (let x = 0; x < opLayersToSearch.length; x++) {
                if (layers.getItemAt(i).title === opLayersToSearch[x].title) {
                    itemFoundLocation = x;
                    break;
                } else {
                    itemFoundLocation = -1;
                }
            }
            if (itemFoundLocation !== -1) {
                operationalLayers.push(webMapData.operationalLayers[itemFoundLocation]);
            } else if (layers.getItemAt(i).type === 'imagery') {
                // make and add item for imagery layer here
                const item = layers.getItemAt(i) as ImageryLayer;
                const imageToAdd = {
                    id: item.id,
                    layerType: (item as any).operationalLayerType,
                    url: item.url,
                    visibility: item.visible,
                    opacity: item.opacity,
                    title: item.title,
                    itemId: item.portalItem.id,
                };
                operationalLayers.push(imageToAdd);
            }
        }
        webMapData.operationalLayers = operationalLayers;
        formData.append('text', JSON.stringify(webMapData));
        formData.append('f', 'json');
        formData.append('type', 'Web Map');
        formData.append('overwrite', 'true');
        // need to get portal item name
        formData.append('title', webmap.portalItem.title);
        const options: __esri.RequestOptions = {
            responseType: 'json',
            body: formData,
            method: 'post',
            authMode: 'no-prompt',
        };
        const theUserContentUrl = webmap.portalItem.portal.user.userContentUrl;
        const updateUrl = theUserContentUrl + '/items/' + webmap.portalItem.id + '/update';
        return Request(updateUrl, options).then((response: __esri.RequestResponse) => {
            return response.data;
        });
    }

    /**
     * Removes the Raster analysis layer from the scene or map
     * @param tempMap
     */
    static async removeLayersNotSaved(tempMap: __esri.Map): Promise<__esri.Map> {
        if (tempMap) {
            const layers = tempMap.layers.toArray();
            for (let i = 0; i < layers.length; i++) {
                const currentLayer = layers[i];
                //found layer with null title and this throws an error here, so adding a check
                const currentLayerTitleToLowerCase = currentLayer.title ? currentLayer.title.toLowerCase() : '';
                if (currentLayer?.type === 'graphics') {
                    tempMap.remove(currentLayer);
                } else if (currentLayer?.url?.search('System/RasterRendering') >= 0) {
                    // will be -1 if string is not there currentLayer.url.search('System/RasterRendering');
                    tempMap.remove(currentLayer);
                } else if (
                    currentLayer.id === syncLayerInfo.imageFootprintId ||
                    currentLayer.id === syncLayerInfo.mapExtentFootprintId
                ) {
                    //Remove the RemoteView layers
                    tempMap.remove(currentLayer);
                }
                //This could be moved to the config file at some point to make it more dynamic and reusable.
                if (currentLayerTitleToLowerCase.endsWith('_sketchinputs')) {
                    tempMap.remove(currentLayer);
                }
            }
        }
        return tempMap;
    }

    /**
     * Compares two Date objects and returns a number value that represents the result.
     * 0 if the two dates are equal.
     * 1 if the first date is greater than second date
     * -1 if the first date is less than second date
     * @param date1 First date object to compare
     * @param date2 Second date object to compare
     */
    static compareDate(date1: Date, date2: Date): number {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        // Check if the dates are equal
        const same = d1.getTime() === d2.getTime();
        if (same) {
            return 0;
        } else if (d1 > d2) {
            // check if first is greater than second
            return 1;
        } else {
            // first date is less than second
            return -1;
        }
    }

    /**
     * Checks if string is a json. If not returns false.
     * @param str
     */
    static isJSON(str: string): boolean {
        try {
            return JSON.parse(str) && !!str;
        } catch (e) {
            return false;
        }
    }
}
