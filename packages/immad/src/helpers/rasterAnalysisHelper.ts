import Request from '@arcgis/core/request';
import EsriConfig from '@arcgis/core/config';
import Portal from '@arcgis/core/portal/Portal';
import { removeLayerFromPortalByName } from './portalItemsHelper';
import PortalQueryParams from '@arcgis/core/portal/PortalQueryParams';

class RasterAnalysisHelper {
    //checks for existing portal service
    static isServiceNameAvailable(name: string, type: string): Promise<__esri.RequestResponse> {
        const inputParams = {
            name: name,
            type: type,
        };

        const requestParams = {
            query: inputParams,
            authMode: 'auto',
        } as __esri.RequestOptions;

        return Request(
            EsriConfig.portalUrl + '/sharing/rest/portals/self/isServiceNameAvailable?f=json',
            requestParams
        );
    }

    //shares content from the current user with a group
    static shareItemsWithGroup(itemId: string, groupIds: string[]): Promise<any> {
        return new Promise((resolve, reject) => {
            this.getCurrentUser().then((user) => {
                const inputParams = {
                    items: itemId,
                    everyone: false, //share with everyone
                    org: false, //share with everyone in organization
                    groups: groupIds.toString(),
                    confirmItemControl: true, //groups with update ability can edit this layer
                };

                const requestParams = {
                    query: inputParams,
                    method: 'post',
                    authMode: 'auto',
                } as __esri.RequestOptions;

                Request(
                    EsriConfig.portalUrl + '/sharing/rest/content/users/' + user.username + '/shareItems?f=json',
                    requestParams
                ).then(
                    (r) => {
                        resolve(r.data.results[0].success);
                    },
                    (err) => {
                        reject(err);
                    }
                );
            });
        });
    }

    static assignLayerToCategory(itemId: string, category: string[]): Promise<__esri.RequestResponse> {
        const requestParams = {
            query: JSON.stringify([
                {
                    itemId: itemId,
                    categories: category,
                },
            ]),
            method: 'post',
            authMode: 'auto',
        } as __esri.RequestOptions;

        return Request(EsriConfig.portalUrl + '/sharing/rest/content/updateItems?f=json', requestParams);
    }

    static getItemIdByName(name: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const portal = new Portal({ url: EsriConfig.portalUrl });
            portal.authMode = 'immediate';
            portal.load().then(
                () => {
                    const searchParams = new PortalQueryParams({
                        query: "title: '" + name + "'",
                        num: 100,
                    });
                    portal.queryItems(searchParams).then((response) => {
                        let nameFound = false;
                        if (response.results && response.results.length > 0) {
                            response.results.forEach((l) => {
                                //portal searches return the closest match, check for exact match
                                if (l.title === name) {
                                    resolve({ success: true, itemId: l.id });
                                    nameFound = true;
                                }
                            });
                        }
                        if (!nameFound) {
                            reject({ success: false, error: 'Name not found' });
                        }
                    });
                },
                (error) => {
                    reject({ success: false, error: error });
                }
            );
        });
    }

    static async getCurrentUser(): Promise<__esri.PortalUser> {
        const portal = new Portal();
        portal.authMode = 'immediate';
        await portal.load();
        return portal.user;
    }

    static async removeArtifacts(itemName: string): Promise<boolean> {
        const isRemoved = false;
        let counter = 0;
        const interval = setInterval(() => {
            RasterAnalysisHelper.isServiceNameAvailable(itemName, 'Image Service').then(
                (nameResponse) => {
                    if (!nameResponse.data.available) {
                        removeLayerFromPortalByName(itemName).then(
                            (removeResponse) => {
                                if (removeResponse.success) {
                                    console.log('Removed: ' + itemName);
                                    return true;
                                }
                            },
                            (error) => {
                                console.error('error removing artifact: ' + itemName + ' -> ' + error.message);
                                return false;
                            }
                        );
                        clearInterval(interval);
                    }
                },
                (error) => {
                    console.error('error checking service name: ' + itemName + ' -> ' + error.message);
                    clearInterval(interval);
                    return false;
                }
            );

            if (counter > 10) {
                //abort after 10 attempts to find item
                clearInterval(interval);
                console.log('Artifact not found: ' + itemName);
                return false;
            }
            counter++;
        }, 5000); //check every 5 seconds

        return isRemoved;
    }
}

export = RasterAnalysisHelper;
