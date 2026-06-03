import SceneView from '@arcgis/core/views/SceneView';
import MapView from '@arcgis/core/views/MapView';
import esriRequest from '@arcgis/core/request';
import { ConfigHelper } from '../../../../../helpers/configHelper';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import Polygon from '@arcgis/core/geometry/Polygon';
import Point from '@arcgis/core/geometry/Point';
import Graphic from '@arcgis/core/Graphic';
import Field from '@arcgis/core/layers/support/Field';
import Extent from '@arcgis/core/geometry/Extent';

interface attributes {
    ObjectID: number;
    title?: string;
    fileName?: string;
    collectionTime?: string;
    classification?: string;
    sensorModel?: string;
    xMax?: number;
    yMax?: number;
    xMin?: number;
    yMin?: number;
}

interface footprintResults {
    points: Array<Point>;
    attributes: attributes;
}

interface syncLayerInfo {
    imageFootprintId: string;
    imageFootprintTitle: string;
    mapExtentFootprintId: string;
    mapExtentFootprintTitle: string;
}

export const syncLayerInfo: syncLayerInfo = {
    imageFootprintId: 'ImageFootprintLayer',
    imageFootprintTitle: 'RemoteView Image Footprint',
    mapExtentFootprintId: 'MainViewerFootprintLayer',
    mapExtentFootprintTitle: 'RemoteView Main Viewer Footprint',
};

class footprintHelper {
    constructor(view: MapView | SceneView) {
        this.view = view;
    }

    view: MapView | SceneView;
    //enqueueSnackbar: (message: React.ReactNode, options?: OptionsObject) => React.ReactText;
    metadataUrl = ConfigHelper.getAppConfig().remoteView.metadataUrl;
    imageFootprintScript =
        'var Image=new CookieProxy("CurrentImage");' +
        'var corner1 = Image.CornerGeoLocations[0];' +
        'var corner2 = Image.CornerGeoLocations[1];' +
        'var corner3 = Image.CornerGeoLocations[2];' +
        'var corner4 = Image.CornerGeoLocations[3];' +
        'var formattedCorner1 = corner1.Format("%lon(%-%DDD.DDDD), %lat(%-%DDD.DDDD) ");' +
        'var formattedCorner2 = corner2.Format("%lon(%-%DDD.DDDD), %lat(%-%DDD.DDDD) ");' +
        'var formattedCorner3 = corner3.Format("%lon(%-%DDD.DDDD), %lat(%-%DDD.DDDD) ");' +
        'var formattedCorner4 = corner4.Format("%lon(%-%DDD.DDDD), %lat(%-%DDD.DDDD) ");' +
        'var title = Image.Title;' +
        'var fileName = Image.FileName;' +
        'var collectionTime = Image.CollectionTime;' +
        'var classification = toString(Image.Metadata.Security.ClassString);' +
        'var sensorModel = Image.SensorModel;' +
        'var results = \'{"cornerOne": "\'+ formattedCorner1 +\'", "cornerTwo" : "\'+ formattedCorner2 +\'",' +
        '"cornerThree" : "\'+ formattedCorner3 +\'", "cornerFour" : "\'+ formattedCorner4 + \'",' +
        '"title" : "\'+ title +\'", "fileName" : "\'+ fileName + \'", "collectionTime" : "\'+ collectionTime +\'",' +
        '"classification" : "\' + classification + \'","sensorModel" : "\' + sensorModel + \'"}\';' +
        'print (results);';

    mapExtentFootprintScript =
        'var Viewer=new CookieProxy("CurrentViewer");' +
        'var corner1 = Viewer.CornerGeoLocations[0];' +
        'var corner2 = Viewer.CornerGeoLocations[1];' +
        'var corner3 = Viewer.CornerGeoLocations[2];' +
        'var corner4 = Viewer.CornerGeoLocations[3];' +
        'var formattedCorner1 = corner1.Format("%lon(%-%DDD.DDDD), %lat(%-%DDD.DDDD) ");' +
        'var formattedCorner2 = corner2.Format("%lon(%-%DDD.DDDD), %lat(%-%DDD.DDDD) ");' +
        'var formattedCorner3 = corner3.Format("%lon(%-%DDD.DDDD), %lat(%-%DDD.DDDD) ");' +
        'var formattedCorner4 = corner4.Format("%lon(%-%DDD.DDDD), %lat(%-%DDD.DDDD) ");' +
        'var results = \'{"cornerOne": "\'+ formattedCorner1 +\'",' +
        '"cornerTwo" : "\'+ formattedCorner2 +\'", "cornerThree" : "\'+ formattedCorner3 +\'",' +
        '"cornerFour" : "\'+ formattedCorner4 + \'"}\';' +
        'print (results);';

    listMode: 'show' | 'hide' = 'show';

    async runSyncScripts(
        syncImageFootprint: boolean,
        syncMapExtentFootprint: boolean,
        addToLayerList: boolean
    ): Promise<boolean> {
        addToLayerList ? (this.listMode = 'show') : (this.listMode = 'hide');
        let connected = false;
        if (!syncImageFootprint && !syncMapExtentFootprint) {
            const isConnected = await this.runCheckConnection();
            connected = isConnected;
        }
        if (syncImageFootprint) {
            const isConnected = await this.runSyncImageFootprint();
            if (!connected) {
                connected = isConnected;
            }
        }
        if (syncMapExtentFootprint) {
            const isConnected = await this.runSyncMapExtentFootprint();
            if (!connected) {
                connected = isConnected;
            }
        }
        return connected;
    }

    async runCheckConnection(): Promise<boolean> {
        return new Promise((resolve) => {
            esriRequest(this.metadataUrl, { responseType: 'document' })
                .then(() => {
                    resolve(true);
                })
                .catch(() => {
                    resolve(false);
                });
        });
    }

    async runSyncImageFootprint(): Promise<boolean> {
        return new Promise((resolve) => {
            esriRequest(this.metadataUrl, { body: this.imageFootprintScript, responseType: 'document' })
                .then((result) => {
                    const resultString = result.data.documentElement.innerText;
                    if (resultString.includes('TypeError') || resultString.includes('ReferenceError')) {
                        //If an error is returned then the request did not fail and the connection is available.
                        resolve(true);
                    } else {
                        const footprint = this.parseFootprint(resultString, 'image');
                        const newPolygon = this.createFootprintPolygon(footprint);
                        const fields = this.createImageFootprintFields();
                        this.setPolygonOnMap(
                            newPolygon,
                            footprint.attributes,
                            syncLayerInfo.imageFootprintId,
                            syncLayerInfo.imageFootprintTitle,
                            [7, 252, 252],
                            fields
                        );
                        resolve(true);
                    }
                })
                .catch(() => {
                    //This would indicate that the request failed and no connection is available.
                    resolve(false);
                });
        });
    }

    async runSyncMapExtentFootprint(): Promise<boolean> {
        return new Promise((resolve) => {
            esriRequest(this.metadataUrl, { body: this.mapExtentFootprintScript, responseType: 'document' })
                .then((result) => {
                    const resultString = result.data.documentElement.innerText;
                    if (resultString.includes('TypeError') || resultString.includes('ReferenceError')) {
                        //If an error is returned then the request did not fail and the connection is available.
                        resolve(true);
                    } else {
                        const footprint = this.parseFootprint(resultString, 'map');
                        const newPolygon = this.createFootprintPolygon(footprint);
                        const fields = [
                            new Field({
                                name: 'ObjectID',
                                alias: 'ObjectID',
                                type: 'oid',
                            }),
                            new Field({
                                name: 'xMax',
                                alias: 'X Max',
                                type: 'double',
                            }),
                            new Field({
                                name: 'yMax',
                                alias: 'Y Max',
                                type: 'double',
                            }),
                            new Field({
                                name: 'xMin',
                                alias: 'X Min',
                                type: 'double',
                            }),
                            new Field({
                                name: 'yMin',
                                alias: 'Y Min',
                                type: 'double',
                            }),
                        ];
                        this.setPolygonOnMap(
                            newPolygon,
                            footprint.attributes,
                            syncLayerInfo.mapExtentFootprintId,
                            syncLayerInfo.mapExtentFootprintTitle,
                            [255, 0, 0],
                            fields
                        );
                        resolve(true);
                    }
                })
                .catch(() => {
                    //This would indicate that the request failed and no connection is available.
                    resolve(false);
                });
        });
    }

    createImageFootprintFields(): Array<Field> {
        const fields = [
            new Field({
                name: 'ObjectID',
                alias: 'ObjectID',
                type: 'oid',
            }),
            new Field({
                name: 'title',
                alias: 'Title',
                type: 'string',
            }),
            new Field({
                name: 'fileName',
                alias: 'File Name',
                type: 'string',
            }),
            new Field({
                name: 'collectionTime',
                alias: 'Collection Time',
                type: 'string',
            }),
            new Field({
                name: 'classification',
                alias: 'Classification',
                type: 'string',
            }),
            new Field({
                name: 'sensorModel',
                alias: 'Sensor Model',
                type: 'string',
            }),
            new Field({
                name: 'xMax',
                alias: 'X Max',
                type: 'double',
            }),
            new Field({
                name: 'yMax',
                alias: 'Y Max',
                type: 'double',
            }),
            new Field({
                name: 'xMin',
                alias: 'X Min',
                type: 'double',
            }),
            new Field({
                name: 'yMin',
                alias: 'Y Min',
                type: 'double',
            }),
        ];
        return fields;
    }

    createFootprintPolygon(footprint: footprintResults): Polygon {
        const newPolygon = new Polygon();
        newPolygon.addRing(footprint.points);
        return newPolygon;
    }

    parseFootprint(resultString: string, type: string): footprintResults {
        resultString = resultString.split('\n')[0];
        resultString = resultString.replaceAll('\\', '/');
        const resultJson = JSON.parse(resultString);
        const footprint: footprintResults = {} as footprintResults;
        const pointOne = new Point({ x: resultJson.cornerOne.split(',')[0], y: resultJson.cornerOne.split(',')[1] });
        const pointTwo = new Point({ x: resultJson.cornerTwo.split(',')[0], y: resultJson.cornerTwo.split(',')[1] });
        const pointThree = new Point({
            x: resultJson.cornerThree.split(',')[0],
            y: resultJson.cornerThree.split(',')[1],
        });
        const pointFour = new Point({ x: resultJson.cornerFour.split(',')[0], y: resultJson.cornerFour.split(',')[1] });
        const pointArray = [];
        pointArray.push(pointOne);
        pointArray.push(pointTwo);
        pointArray.push(pointThree);
        pointArray.push(pointFour);
        pointArray.push(pointOne);
        footprint.attributes = { ObjectID: 1 };
        if (type === 'image') {
            footprint.attributes.title = resultJson.title && resultJson.title != 'undefined' ? resultJson.title : null;
            footprint.attributes.fileName =
                resultJson.fileName && resultJson.fileName != 'undefined' ? resultJson.fileName : null;
            footprint.attributes.collectionTime =
                resultJson.collectionTime && resultJson.collectionTime != 'undefined'
                    ? resultJson.collectionTime
                    : null;
            footprint.attributes.classification =
                resultJson.classification && resultJson.classification != 'undefined'
                    ? resultJson.classification
                    : null;
            footprint.attributes.sensorModel =
                resultJson.sensorModel && resultJson.sensorModel != 'undefined' ? resultJson.sensorModel : null;
        }
        footprint.points = pointArray;
        return footprint;
    }

    setPolygonOnMap(
        newPolygon: Polygon,
        attributes: attributes,
        layerId: string,
        layerTitle: string,
        defaultColor: Array<number>,
        fields: Array<Field>
    ): void {
        let footprintLayer = this.view.map.findLayerById(layerId) as FeatureLayer;
        if (!footprintLayer) {
            this.addLayerToMap(layerId, layerTitle, fields, defaultColor, newPolygon.extent);
            footprintLayer = this.view.map.findLayerById(layerId) as FeatureLayer;
        }
        if (newPolygon.extent) {
            attributes.xMax = newPolygon.extent.xmax;
            attributes.yMax = newPolygon.extent.ymax;
            attributes.xMin = newPolygon.extent.xmin;
            attributes.yMin = newPolygon.extent.ymin;
        }
        const newGraphic = new Graphic({ attributes: attributes, geometry: newPolygon });
        const features = [newGraphic];
        footprintLayer.applyEdits({ updateFeatures: features });
        footprintLayer.set('visible', true);
    }

    addLayerToMap(
        layerId: string,
        layerTitle: string,
        fields: Array<Field>,
        defaultColor: Array<number>,
        fullExtent: Extent
    ): void {
        const newGraphic = new Graphic({});
        const features = [newGraphic];
        const footprintLayer = new FeatureLayer({
            id: layerId,
            title: layerTitle,
            listMode: this.listMode,
            source: features,
            fields: fields,
            objectIdField: 'ObjectID',
            geometryType: 'polygon',
            fullExtent: fullExtent,
            renderer: {
                type: 'simple',
                symbol: {
                    type: 'simple-fill',
                    style: 'none',
                    outline: {
                        color: defaultColor,
                        width: '2px',
                    },
                },
            },
        });
        this.view.map.add(footprintLayer);
    }

    hideImageFootprint(): void {
        const footprintLayer = this.view.map.findLayerById(syncLayerInfo.imageFootprintId);
        if (footprintLayer) {
            footprintLayer.set('visible', false);
        }
    }

    hideMapExtentFootprint(): void {
        const footprintLayer = this.view.map.findLayerById(syncLayerInfo.mapExtentFootprintId);
        if (footprintLayer) {
            footprintLayer.set('visible', false);
        }
    }
}
export default footprintHelper;
