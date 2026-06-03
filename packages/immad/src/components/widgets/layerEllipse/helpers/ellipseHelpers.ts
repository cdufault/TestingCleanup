import { Point } from '@arcgis/core/geometry';
import SpatialReference from '@arcgis/core/geometry/SpatialReference';
import * as webMercatorUtils from '@arcgis/core/geometry/support/webMercatorUtils';
import Graphic from '@arcgis/core/Graphic';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import Field from '@arcgis/core/layers/support/Field';
import FeatureLayerProperties = __esri.FeatureLayerProperties;
import View = __esri.View;
import FeatureSet from '@arcgis/core/rest/support/FeatureSet';
/**
 * Returns the points for an ellipse
 * @param lat in decimal degrees
 * @param lon in decimal degrees
 * @param semiMajor in meters
 * @param semiMinor in meters
 * @param rotation in degrees
 * @param outSr spatial reference
 */
export default function getEllipsePoints_NoAPI(
    lat: number,
    lon: number,
    semiMajor: number,
    semiMinor: number,
    rotation: number,
    outSr: SpatialReference
): number[][] {
    // Rotation conversion (degrees to radians)
    const rRotation = rotation * (Math.PI / 180);
    // Major axis conversion (Meters to DD)
    const semiMajorX = (semiMajor * Math.cos(rRotation)) / (111320.0 * Math.cos(lat * (Math.PI / 180.0)));
    const semiMajorY = (semiMajor * Math.sin(rRotation)) / 111320.0;
    const rXaxis = Math.sqrt(semiMajorX ** 2 + semiMajorY ** 2);
    // Minor axis conversion (Meters to DD)
    const semiMinorX = (semiMinor * Math.sin(rRotation)) / (111320.0 * Math.cos(lat * (Math.PI / 180.0)));
    const semiMinorY = (semiMinor * Math.cos(rRotation)) / 111320.0;
    const rYaxis = Math.sqrt(semiMinorX ** 2 + semiMinorY ** 2);
    const vertices = [];
    let x, y, t;
    for (let i = 0; i <= 360; i += 5) {
        t = i * (Math.PI / 180);
        x = rXaxis * Math.cos(t);
        y = rYaxis * Math.sin(t);
        // rotate/transpose ellipse
        const rotationX = lon + x * Math.cos(rRotation) - y * Math.sin(rRotation);
        const rotationY = lat + y * Math.cos(rRotation) + x * Math.sin(rRotation);
        const unprojectedPoint = new Point({ x: rotationX, y: rotationY });
        const projectedPoint = webMercatorUtils.project(unprojectedPoint, outSr) as Point;
        vertices.push([projectedPoint.x, projectedPoint.y]);
    }
    if (vertices.length > 1) {
        // add the first point as the last point to make a complete polygon ring
        vertices.push(vertices[0]);
    } else {
        // Invalid geometry, log error
        console.error('error creating ellipse: invalid geometry');
    }
    return vertices;
}

/**
 * Create an ellipse layer
 * @param selectedInputLayer layer to base the name and extent of the ellipse layer
 * @param view current view
 */
export function helperCreateEllipseLayer(selectedInputLayer: FeatureLayer, view: View | undefined): FeatureLayer {
    //append _Ellipse to source layer to create new layer for the ellipses
    const layerName = `${selectedInputLayer?.title}_Ellipse`;
    const existingLayer = view?.map.allLayers.find((lyr: any) => {
        return lyr.title === layerName;
    });
    if (existingLayer) {
        //if the layer exists remove & recreate
        view?.map.remove(existingLayer);
    }

    const options = {
        source: [],
        title: layerName,
        geometryType: 'polyline',
        spatialReference: view?.spatialReference,
        editingEnabled: true,
        popupEnabled: true,
        fullExtent: selectedInputLayer?.fullExtent,
        renderer: {
            type: 'simple',
            symbol: {
                type: 'simple-line',
                color: [255, 0, 0],
                width: 1,
            },
        },
        fields: [
            new Field({ name: 'OBJECTID', type: 'oid' }),
            new Field({ name: 'pointOid', type: 'oid' }),
            new Field({ name: 'semiMinorAxis', type: 'double' }),
            new Field({ name: 'semiMajorAxis', type: 'double' }),
            new Field({ name: 'azimuth', type: 'double' }),
        ],
    } as FeatureLayerProperties;

    const newLayer = new FeatureLayer(options);
    return newLayer;
}

/**
 * Units for creating ellipses
 */
const unitInMeters: { [name: string]: number } = {
    meters: 1,
    feet: 0.3048,
    nauticalmiles: 1852, //the code elsewhere looks for nauticalmiles and not nautical-miles
    miles: 1609.34,
    kilometers: 1000,
};

/**
 * Which features to use from the input layer
 */
export type SelectionType = 'selected' | 'all';

/**
 *
 * @param semiMajorAxisField semi-major value
 * @param semiMinorAxisField semi-minor value
 * @param azimuthField azimuth value
 * @param selectedInputLayer point layer to associate with the ellipse layer
 * @param selectionType  which ftrs to include 'all' or 'selected'
 * @param semiMajorAxisUnit semi-major unit
 * @param semiMinorAxisUnit semi-minor unit
 * @param view  current view
 * @param ellipseLayer ellipse ftr layer
 * @param featureSelection number[]
 */
export async function helperDrawFeatures(
    semiMajorAxisField: string,
    semiMinorAxisField: string,
    azimuthField: string,
    selectedInputLayer: FeatureLayer,
    selectionType: SelectionType,
    semiMajorAxisUnit: string,
    semiMinorAxisUnit: string,
    view: View | undefined,
    ellipseLayer: FeatureLayer | undefined,
    featureSelection: number[]
): Promise<void> {
    if (
        semiMajorAxisField !== 'none' &&
        semiMinorAxisField !== 'none' &&
        azimuthField !== 'none' &&
        selectedInputLayer
    ) {
        const query = selectedInputLayer.createQuery();
        if (query) {
            query.outFields = ['objectid', semiMajorAxisField, semiMinorAxisField, azimuthField];

            //handle All Features/Selected Features user selection
            if (selectionType === 'selected' && featureSelection.length > 0) {
                //BUG SI-1869, currently the selection context only supports one layer and does not store all selected feature objectids
                //this code assumes the context feature selection layer is the same as the Selected Input Layer and uses the object ids that are stored
                if (selectedInputLayer.definitionExpression) {
                    query.where = `(${
                        selectedInputLayer.definitionExpression as string
                    }) AND objectid IN (${featureSelection})`;
                } else {
                    query.where = `objectid IN (${featureSelection})`;
                }
            } else {
                //maintain any filters previously applied to the layer
                if (selectedInputLayer.definitionExpression) {
                    query.where = selectedInputLayer.definitionExpression as string;
                }
            }
            const featureSet = await selectedInputLayer?.queryFeatures(query);

            const ellipseFeatures: Graphic[] = [];

            featureSet?.features.forEach((feature) => {
                //get attribute values for selected fields
                const attributes = feature.attributes;
                const semiMajorAxis = attributes[semiMajorAxisField];
                const semiMinorAxis = attributes[semiMinorAxisField];

                const azimuth = attributes[azimuthField];

                const semiMajorAxisInMeters = semiMajorAxis * unitInMeters[semiMajorAxisUnit];
                const semiMinorAxisInMeters = semiMinorAxis * unitInMeters[semiMinorAxisUnit];

                if (semiMajorAxis && semiMinorAxis && azimuth && view) {
                    const pointFeature = new Point(feature.geometry);
                    const ellipsePoints = getEllipsePoints_NoAPI(
                        pointFeature.latitude,
                        pointFeature.longitude,
                        semiMajorAxisInMeters,
                        semiMinorAxisInMeters,
                        azimuth,
                        view.spatialReference
                    );

                    const polylineGeom = {
                        type: 'polyline',
                        paths: ellipsePoints,
                        spatialReference: view.spatialReference,
                    };

                    const newGraphic = new Graphic({
                        geometry: polylineGeom,
                        attributes: {
                            pointOid: feature.getObjectId(),
                            semiMajorAxis: semiMajorAxis,
                            semiMinorAxis: semiMinorAxis,
                            azimuth: azimuth,
                        },
                    });
                    ellipseFeatures.push(newGraphic);
                } else {
                    console.warn('attribute values not found');
                }
            });

            ellipseLayer?.applyEdits({
                addFeatures: ellipseFeatures,
            });
        } else {
            console.warn('missing inputs, ellipse not created');
        }
    }
}

/**
 * Draws features (ellipses) for only the currently selected rows in the tactical grid
 * @param semiMajorAxisField semi-major value
 * @param semiMinorAxisField semi-minor value
 * @param azimuthField azimuth value
 * @param selectedInputLayer point layer to associate with the ellipse layer
 * @param selectionType  which ftrs to include 'all' or 'selected'
 * @param semiMajorAxisUnit semi-major unit
 * @param semiMinorAxisUnit semi-minor unit
 * @param view  current view
 * @param ellipseLayer ellipse ftr layer
 * @param featureSelection number[]
 */
export async function helperDrawFeaturesOnDemand(
    semiMajorAxisField: string,
    semiMinorAxisField: string,
    azimuthField: string,
    selectedInputLayer: FeatureLayer,
    selectionType: SelectionType,
    semiMajorAxisUnit: string,
    semiMinorAxisUnit: string,
    view: View | undefined,
    ellipseLayer: FeatureLayer | undefined,
    featureSelection: number[]
): Promise<void> {
    if (
        semiMajorAxisField !== 'none' &&
        semiMinorAxisField !== 'none' &&
        azimuthField !== 'none' &&
        selectedInputLayer
    ) {
        if (ellipseLayer) {
            //delete all existing ellipse features
            await ellipseLayer.queryObjectIds().then(async (ftrSet) => {
                const oidObjArray: any[] = [];
                ftrSet.forEach((oid) => {
                    oidObjArray.push({ objectId: oid });
                });
                await ellipseLayer.applyEdits({
                    deleteFeatures: oidObjArray,
                });
            });
        }
        if (featureSelection.length < 1) {
            //nothing selected
            return;
        }

        //add new ellipses for currenlty selected tactical grid rows
        const query = selectedInputLayer.createQuery();
        if (query) {
            query.outFields = ['objectid', semiMajorAxisField, semiMinorAxisField, azimuthField];

            //handle All Features/Selected Features user selection
            if (selectionType === 'selected') {
                //BUG SI-1869, currently the selection context only supports one layer and does not store all selected feature objectids
                //this code assumes the context feature selection layer is the same as the Selected Input Layer and uses the object ids that are stored
                if (selectedInputLayer.definitionExpression && featureSelection.length > 0) {
                    query.where = `(${
                        selectedInputLayer.definitionExpression as string
                    }) AND objectid IN (${featureSelection})`;
                } else {
                    query.where = `objectid IN (${featureSelection})`;
                }
            } else {
                //maintain any filters previously applied to the layer
                if (selectedInputLayer.definitionExpression) {
                    query.where = selectedInputLayer.definitionExpression as string;
                }
            }
            const featureSet = await selectedInputLayer?.queryFeatures(query);

            const ellipseFeatures: Graphic[] = [];

            featureSet?.features.forEach((feature) => {
                //get attribute values for selected fields
                const attributes = feature.attributes;
                const semiMajorAxis = attributes[semiMajorAxisField];
                const semiMinorAxis = attributes[semiMinorAxisField];

                const azimuth = attributes[azimuthField];

                const semiMajorAxisInMeters = semiMajorAxis * unitInMeters[semiMajorAxisUnit];
                const semiMinorAxisInMeters = semiMinorAxis * unitInMeters[semiMinorAxisUnit];

                if (semiMajorAxis && semiMinorAxis && azimuth && view) {
                    const pointFeature = new Point(feature.geometry);
                    const ellipsePoints = getEllipsePoints_NoAPI(
                        pointFeature.latitude,
                        pointFeature.longitude,
                        semiMajorAxisInMeters,
                        semiMinorAxisInMeters,
                        azimuth,
                        view.spatialReference
                    );

                    const polylineGeom = {
                        type: 'polyline',
                        paths: ellipsePoints,
                        spatialReference: view.spatialReference,
                    };

                    const newGraphic = new Graphic({
                        geometry: polylineGeom,
                        attributes: {
                            pointOid: feature.getObjectId(),
                            semiMajorAxis: semiMajorAxis,
                            semiMinorAxis: semiMinorAxis,
                            azimuth: azimuth,
                        },
                    });
                    ellipseFeatures.push(newGraphic);
                } else {
                    console.warn('attribute values not found');
                }
            });

            ellipseLayer?.applyEdits({
                addFeatures: ellipseFeatures,
            });
        } else {
            console.warn('missing inputs, ellipse not created');
        }
    }
}
/**
 * describes a SMART data object used for drawing ellipses in the SmartFilterDialog
 */
export interface StratLead {
    semiMajor: number,
    semiMinor: number,
    azimuth: number,
    semiMajorUnit: string,
    semiMinorUnit: string,
    latitude: number,
    longitude: number,
    recordId: string,
}

/**
 * Method draws ellipse geometry into a feature layer
 * @param stratLeads SMART data for drawing an ellipse
 * @param view sceneView
 * @param ellipseLayer layer to hold the ellipse geometry
 * @returns Promise<void>
 */
export async function helperDrawFeaturesOnDemandProto(
    stratLeads: StratLead[],
    view: View | undefined,
    ellipseLayer: FeatureLayer | undefined,
): Promise<void> {
    if (ellipseLayer) {
        //delete all existing ellipse features
        await ellipseLayer.queryObjectIds().then(async (ftrSet) => {
            const oidObjArray: any[] = [];
            ftrSet.forEach((oid) => {
                oidObjArray.push({ objectId: oid });
            });
            await ellipseLayer.applyEdits({
                deleteFeatures: oidObjArray,
            });
        });
    }
    if (!stratLeads || stratLeads.length < 1) {
        //nothing selected
        return;
    }

    const ellipseFeatures: Graphic[] = [];
    stratLeads.forEach((stratLead:StratLead, index:number) => {

        const semiMajorAxis = stratLead.semiMajor;
        const semiMinorAxis = stratLead.semiMinor;

        const azimuth = stratLead.azimuth;

        const semiMajorAxisInMeters = semiMajorAxis * unitInMeters[stratLead.semiMajorUnit];
        const semiMinorAxisInMeters = semiMinorAxis * unitInMeters[stratLead.semiMinorUnit];

        if (semiMajorAxis && semiMinorAxis && azimuth && view) {
            const ellipsePoints = getEllipsePoints_NoAPI(
                stratLead.latitude,
                stratLead.longitude,
                semiMajorAxisInMeters,
                semiMinorAxisInMeters,
                azimuth,
                view.spatialReference
            );

            const polylineGeom = {
                type: 'polyline',
                paths: ellipsePoints,
                spatialReference: view.spatialReference,
            };

            const newGraphic = new Graphic({
                geometry: polylineGeom,
                attributes: {
                    pointOid: index + 1,
                    semiMajorAxis: semiMajorAxis,
                    semiMinorAxis: semiMinorAxis,
                    azimuth: azimuth,
                    recordId: stratLead['recordId']
                },
            });
            ellipseFeatures.push(newGraphic);
        } else {
            console.warn('attribute values not found');
        }
    });

    await ellipseLayer?.applyEdits({
        addFeatures: ellipseFeatures,
    });
}

/**
 * Create a layer that can be used to draw ellipse data for SMART data
 * @param selectedInputLayer related layer to use for defining extent
 * @param view sceneview
 * @returns FeatureLayer
 */
export function helperCreateEllipseLayerProto(selectedInputLayer: FeatureLayer, view: View | undefined): FeatureLayer {
    //append _Ellipse to source layer to create new layer for the ellipses
    const layerName = `StratLead_Search_Ellipse`;
    const existingLayer = view?.map.allLayers.find((lyr: any) => {
        return lyr.title === layerName;
    });
    if (existingLayer) {
        //if the layer exists remove & recreate
        view?.map.remove(existingLayer);
    }

    const options = {
        source: [],
        title: layerName,
        geometryType: 'polyline',
        spatialReference: view?.spatialReference,
        editingEnabled: true,
        popupEnabled: true,
        fullExtent: selectedInputLayer?.fullExtent,
        renderer: {
            type: 'simple',
            symbol: {
                type: 'simple-line',
                color: [255, 0, 0],
                width: 1,
            },
        },
        fields: [
            new Field({ name: 'OBJECTID', type: 'oid' }),
            new Field({ name: 'pointOid', type: 'oid' }),
            new Field({ name: 'semiMinorAxis', type: 'double' }),
            new Field({ name: 'semiMajorAxis', type: 'double' }),
            new Field({ name: 'azimuth',  type: 'double' }),
            new Field({ name: 'recordId', type: 'string'}),
        ],
    } as FeatureLayerProperties;

    const newLayer = new FeatureLayer(options);
    return newLayer;
}

/**
 * Stub helper to draw an ellipse layer based on a featureSet -- not fully flushed out!!!
 * Idea is to allow for a dynamically expanding/contracting set of ellipses based on some yet to be determined
 * algorithm for large tactical grids
 * Will work with queryFeaturesByArrayFromMapLayer() in the mapHelper.ts class to retrieve featureSet from a oid array.
 * @param semiMajorAxisField semi-major value
 * @param semiMinorAxisField semi-minor value
 * @param azimuthField azimuth value
 * @param tgridFeatureSet point featureSet  to associate with the ellipse layer
 * @param semiMajorAxisUnit semi-major unit
 * @param semiMinorAxisUnit semi-minor unit
 * @param view  current view
 * @param ellipseLayer ellipse ftr layer
 * @param featureSelectionContext context for feature selection
 */
export async function helperDrawFeatureSet(
    semiMajorAxisField: string,
    semiMinorAxisField: string,
    azimuthField: string,
    tgridFeatureSet: FeatureSet,
    semiMajorAxisUnit: string,
    semiMinorAxisUnit: string,
    view: View | undefined,
    ellipseLayer: FeatureLayer | undefined
): Promise<void> {
    if (semiMajorAxisField !== 'none' && semiMinorAxisField !== 'none' && azimuthField !== 'none' && tgridFeatureSet) {
        const ellipseFeatures: Graphic[] = [];

        tgridFeatureSet?.features.forEach((feature) => {
            //get attribute values for selected fields
            const attributes = feature.attributes;
            const semiMajorAxis = attributes[semiMajorAxisField];
            const semiMinorAxis = attributes[semiMinorAxisField];

            const azimuth = attributes[azimuthField];

            const semiMajorAxisInMeters = semiMajorAxis * unitInMeters[semiMajorAxisUnit];
            const semiMinorAxisInMeters = semiMinorAxis * unitInMeters[semiMinorAxisUnit];

            if (semiMajorAxis && semiMinorAxis && azimuth && view) {
                const pointFeature = new Point(feature.geometry);
                const ellipsePoints = getEllipsePoints_NoAPI(
                    pointFeature.latitude,
                    pointFeature.longitude,
                    semiMajorAxisInMeters,
                    semiMinorAxisInMeters,
                    azimuth,
                    view.spatialReference
                );

                const polylineGeom = {
                    type: 'polyline',
                    paths: ellipsePoints,
                    spatialReference: view.spatialReference,
                };

                const newGraphic = new Graphic({
                    geometry: polylineGeom,
                    attributes: {
                        pointOid: feature.getObjectId(),
                        semiMajorAxis: semiMajorAxis,
                        semiMinorAxis: semiMinorAxis,
                        azimuth: azimuth,
                    },
                });
                ellipseFeatures.push(newGraphic);
            } else {
                //test mode until flushed out fully
                console.warn('attribute values not found');
            }
        });

        ellipseLayer?.applyEdits({
            //remove features -- ??delete current features no longer needed
            addFeatures: ellipseFeatures,
        });
    }
}

/**
 * Delete all the features in a featurelayer
 * @param featureSelection number[]
 */
export async function helperDeleteAllFeaturesOnDemand(ftrLayer: FeatureLayer | undefined): Promise<void> {
    if (ftrLayer) {
        //delete all existing features
        await ftrLayer.queryObjectIds().then(async (ftrSet) => {
            const oidObjArray: any[] = [];
            ftrSet.forEach((oid) => {
                oidObjArray.push({ objectId: oid });
            });
            await ftrLayer.applyEdits({
                deleteFeatures: oidObjArray,
            });
        });
    }
}
