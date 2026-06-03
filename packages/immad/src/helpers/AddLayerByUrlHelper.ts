import esriRequest from '@arcgis/core/request';

import { OptionsObject } from 'notistack';
import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer';
import Field from '@arcgis/core/layers/support/Field';
import GroupLayer from '@arcgis/core/layers/GroupLayer';
import { getLayerFullExtent } from './extentHelper';

import Layer from '@arcgis/core/layers/Layer';
import PortalItem from '@arcgis/core/portal/PortalItem';
import { findPortalItems } from './portalItemsHelper';
import SceneView from '@arcgis/core/views/SceneView';
import MapView from '@arcgis/core/views/MapView';
import { checkAndUpdateLayerDefaultElevationStrategy } from './layerHelper';
import RequestOptions = __esri.RequestOptions;
import WFSLayer from '@arcgis/core/layers/WFSLayer';
import WMSLayer from '@arcgis/core/layers/WMSLayer';
import SimpleLineSymbol from '@arcgis/core/symbols/SimpleLineSymbol';
import Color from '@arcgis/core/Color';
import SimpleRenderer from '@arcgis/core/renderers/SimpleRenderer';
import { BviProperties } from '../interfaces/BviProperties';
import { SimpleFillSymbol } from '@arcgis/core/symbols';
import { getWFSLayerInfo, getCapabilities } from '@arcgis/core/layers/ogc/wfsUtils';
import Collection from '@arcgis/core/core/Collection';
import WMSSubLayer from '@arcgis/core/layers/support/WMSSublayer';
import React from 'react';
import LayerSearchSource from '@arcgis/core/widgets/Search/LayerSearchSource';

export interface GeoJsonData {
    type: 'point' | 'polygon' | 'polyline' | 'multipoint';
    fields: Field[];
    title: string;
}

interface getGeoJsonResponse {
    geoJsonArray: GeoJsonData[];
    lineStyle?: bviLineStyle;
    polygonStyle?: bviPolygonStyle;
}

export interface bviPolygonStyle {
    stroke: string;
    strokeWidth: number;
    fill: string;
    fillOpacity: number;
}

export interface bviLineStyle {
    stroke: string;
    strokeWidth: number;
}

export interface bviProps {
    bviCustomProperties?: BviProperties;
    bviTimeInfo?: __esri.TimeInfo | undefined;
    bviGeoJsonData?: GeoJsonData[];
    bviPolygonStyle?: bviPolygonStyle;
    bviLineStyle?: bviLineStyle;
}

interface addServiceProps {
    urlDialogValue: string;
    currentView: MapView | SceneView;
    addLayerToMapWithZoomAction(currentView: any, theLayer: Layer): void;
    enqueueSnackbar: (message: React.ReactNode, options?: OptionsObject) => React.ReactText;
}

interface addGeoJsonProps {
    urlDialogValue: string;
    urlDialogTitle: string;
    currentView: MapView | SceneView;
    addLayerToMapWithZoomAction(currentView: any, theLayer: Layer): void;
    enqueueSnackbar: (message: React.ReactNode, options?: OptionsObject) => React.ReactText;
    bviProps: bviProps;
}

interface addWFSLayerProps {
    url: string;
    name: string;
    currentView: MapView | SceneView;
    enqueueSnackbar: (message: React.ReactNode, options?: OptionsObject) => React.ReactText;
}

interface addWMSLayerProps {
    url: string;
    name: string;
    selectedSubLayers: Collection<WMSSubLayer>;
    currentView: MapView | SceneView;
    enqueueSnackbar: (message: React.ReactNode, options?: OptionsObject) => React.ReactText;
}

const addArcGisService = (props: addServiceProps): void => {
    const { urlDialogValue, currentView, addLayerToMapWithZoomAction, enqueueSnackbar } = props;
    const map = currentView.map;
    const options = {
        query: {
            f: 'json',
        },
        responseType: 'json',
    } as RequestOptions;
    esriRequest(urlDialogValue.trim(), options).then(
        async () => {
            let theLayer: Layer;
            //get the layer's portal item, if it exists, to preserve the default renderer
            const portalItems = await findPortalItems(urlDialogValue.trim(), 'url');
            const portalItemId = portalItems[0] ? portalItems[0].id : '';
            if (portalItemId) {
                //attempts to create layer regardless of type, using the default renderer
                theLayer = await Layer.fromPortalItem({
                    portalItem: {
                        id: portalItemId,
                    } as PortalItem,
                });
            } else {
                //
                //attempts to create layer regardless of type, using an undefined renderer
                theLayer = await Layer.fromArcGISServerUrl({
                    url: urlDialogValue.trim(),
                });
            }
            // check if activeView is 3D, else do not do this step.
            let updatedLayer = theLayer;
            if (currentView.type === '3d') {
                updatedLayer = checkAndUpdateLayerDefaultElevationStrategy(updatedLayer);
            }
            if (map && theLayer) {
                addLayerToMapWithZoomAction(currentView, updatedLayer);
                //Add the layer to the search widget
                const components = currentView.ui._components;
                for (const component of components) {
                    //Get the search widget
                    if (component.widget?.label === 'Search') {
                        component.widget.sources.push(
                            new LayerSearchSource({
                                exactMatch: false,
                                layer: updatedLayer,
                                maxResults: 10,
                                maxSuggestions: 10,
                                name: updatedLayer.title,
                            })
                        );
                    }
                }
            } else {
                enqueueSnackbar('Unable to add layer to map', { variant: 'error' });
                console.warn('Unable to add layer to map');
            }
        },
        (error) => {
            console.error(error);
            enqueueSnackbar('Error Message: ' + error.message, { variant: 'error' });
        }
    );
};

const addGeoJson = async (props: addGeoJsonProps): Promise<void> => {
    const { urlDialogValue, currentView, urlDialogTitle, addLayerToMapWithZoomAction, enqueueSnackbar, bviProps } =
        props;
    let customProperties: BviProperties = {};
    if (bviProps.bviCustomProperties) customProperties = bviProps.bviCustomProperties;
    const decodedUrl = decodeURIComponent(urlDialogValue.trim());
    const existingParams = getExistingParameters(decodedUrl);
    if (existingParams.length) {
        for (const param of existingParams) {
            const splitParam = param.split('=');
            customProperties[splitParam[0]] = splitParam[1];
        }
    }
    const newUrl = getnewUrl(urlDialogValue.trim(), customProperties);
    try {
        let geoJsonData = bviProps.bviGeoJsonData;
        if (!geoJsonData || !bviProps.bviLineStyle || !bviProps.bviPolygonStyle) {
            const geoJsonResponse = await getGeoJsonData(newUrl, enqueueSnackbar);
            if (!geoJsonData) {
                geoJsonData = geoJsonResponse?.geoJsonArray;
            }
            if (!bviProps.bviLineStyle && geoJsonResponse?.lineStyle) {
                bviProps.bviLineStyle = geoJsonResponse.lineStyle;
            }
            if (!bviProps.bviPolygonStyle && geoJsonResponse?.polygonStyle) {
                bviProps.bviPolygonStyle = geoJsonResponse.polygonStyle;
            }
        }

        //Only one geometry type so create one layer
        if (geoJsonData && geoJsonData.length === 1) {
            const newLayer = createNewGeoJsonLayer(
                currentView,
                newUrl,
                urlDialogTitle,
                geoJsonData[0].fields,
                bviProps,
                geoJsonData[0].type
            );
            // check if activeView is 3D, else do not do this step.
            let updatedLayer = newLayer;
            if (currentView.type === '3d') {
                updatedLayer = checkAndUpdateLayerDefaultElevationStrategy(updatedLayer) as GeoJSONLayer;
            }
            if (newLayer) {
                addLayerToMapWithZoomAction(currentView, updatedLayer);
            } else {
                enqueueSnackbar('Unable to add layer to map', { variant: 'error' });
                console.warn('Unable to add layer to map');
            }
        }
        //More than one geometry type - make a group layer
        else if (geoJsonData && geoJsonData.length > 1) {
            const groupLayer = new GroupLayer({
                title: urlDialogTitle,
            });

            for (const geometry of geoJsonData) {
                const newLayer = createNewGeoJsonLayer(
                    currentView,
                    newUrl,
                    geometry.title,
                    geometry.fields,
                    bviProps,
                    geometry.type
                );
                groupLayer.add(newLayer);
            }
            if (groupLayer) {
                addLayerToMapWithZoomAction(currentView, groupLayer);
            } else {
                enqueueSnackbar('Unable to add layer to map', { variant: 'error' });
                console.warn('Unable to add layer to map');
            }
        } else {
            enqueueSnackbar('Unable to add layer to map', { variant: 'error' });
            console.warn('Unable to add layer to map');
        }
    } catch (error) {
        enqueueSnackbar('Unable to add layer to map', { variant: 'error' });
        console.error(error);
    }
};

const addWFSLayer = async (props: addWFSLayerProps): Promise<void> => {
    const { url, name, currentView, enqueueSnackbar } = props;
    try {
        if (name) {
            const capabilities = await getCapabilities(url);
            const wfsLayerInfo = await getWFSLayerInfo(capabilities, name);
            const layer = WFSLayer.fromWFSLayerInfo(wfsLayerInfo);
            layer.popupTemplate = layer.createPopupTemplate();
            currentView.map.add(layer);
        }
    } catch (error) {
        enqueueSnackbar('Unable to add layer to map', { variant: 'error' });
        console.error(error);
    }
};

/**
 * Create and add the WMS layer to the map
 * @typedef {addWMSLayerProps} props
 * @prop url: string;
 * @prop name: string;
 * @prop currentView: MapView | SceneView;
 * @prop enqueueSnackbar: (message: React.ReactNode, options?: OptionsObject) => React.ReactText;
 */
const addWMSLayer = async (props: addWMSLayerProps): Promise<void> => {
    const { url, name, selectedSubLayers, currentView, enqueueSnackbar } = props;
    try {
        if (name) {
            if (selectedSubLayers.length) {
                const scrubbedSubLayerList = scrubWmsSubLayers(selectedSubLayers);
                const layer = new WMSLayer({
                    url: url,
                    sublayers: scrubbedSubLayerList,
                });
                layer.load().then(() => {
                    currentView.map.add(layer);
                    enqueueSnackbar(`Layer ${layer.title} Added to the map.`, {
                        variant: 'info',
                    });
                });
            } else {
                const layer = new WMSLayer({
                    url: url,
                });
                layer.load().then(() => {
                    currentView.map.add(layer);
                    enqueueSnackbar(`Layer ${layer.title} Added to the map.`, {
                        variant: 'info',
                    });
                });
            }
        }
    } catch (error) {
        enqueueSnackbar('Unable to add layer to map', { variant: 'error' });
        console.error(error);
    }
};

/**
 * Scrubs the list of selected sublayers so that if a parent node is selected the child
 * nodes are removed from the list. When passing a parent node into the constructor for
 * a WMS layer the child nodes are included. Removing them from this list ensures they
 * are not added twice.
 * @param selectedSubLayers - List of all selected sublayers
 * @returns scrubbedSubLayerList - list of only sublayers needed for WMS layer constructor
 */
const scrubWmsSubLayers = (selectedSubLayers: Collection<WMSSubLayer>): Collection<WMSSubLayer> => {
    const scrubbedSubLayerList = selectedSubLayers.clone();
    selectedSubLayers.forEach((item) => {
        if (item.sublayers?.length > 0) {
            for (const child of item.sublayers.toArray()) {
                for (const scrubbedChild of scrubbedSubLayerList.toArray()) {
                    if (scrubbedChild.title === child.title) {
                        scrubbedSubLayerList.remove(scrubbedChild);
                    }
                }
            }
        }
    });
    return scrubbedSubLayerList;
};

const createNewGeoJsonLayer = (
    currentView: MapView | SceneView,
    url: string,
    title: string,
    fields: Field[],
    bviProperties: bviProps,
    geometryType?: 'point' | 'polygon' | 'polyline' | 'multipoint' | undefined
): GeoJSONLayer => {
    const layerProps: __esri.GeoJSONLayerProperties = {
        url: url,
        title: title,
        fields: fields,
    };
    if (geometryType) {
        layerProps.geometryType = geometryType;
        switch (geometryType) {
            case 'polyline':
                if (bviProperties.bviLineStyle) {
                    const newRenderer = new SimpleRenderer();
                    newRenderer.symbol = createLineSymbol(bviProperties.bviLineStyle);
                    layerProps.renderer = newRenderer;
                }
                break;
            case 'polygon':
                if (bviProperties.bviPolygonStyle) {
                    const newRenderer = new SimpleRenderer();
                    newRenderer.symbol = createPolygonSymbol(bviProperties.bviPolygonStyle);
                    layerProps.renderer = newRenderer;
                }
                break;
        }
    }
    if (bviProperties.bviCustomProperties && Object.keys(bviProperties.bviCustomProperties).length > 0) {
        layerProps.customParameters = bviProperties.bviCustomProperties;
    }
    if (bviProperties.bviTimeInfo) {
        layerProps.timeInfo = bviProperties.bviTimeInfo;
    }
    let newLayer = new GeoJSONLayer(layerProps);
    // check if activeView is 3D, else do not do this step.
    if (currentView.type === '3d') {
        newLayer = checkAndUpdateLayerDefaultElevationStrategy(newLayer) as GeoJSONLayer;
    }
    newLayer.popupTemplate = newLayer.createPopupTemplate();
    const extent = getLayerFullExtent(newLayer, currentView);
    if (extent.extent) {
        newLayer.set('fullExtent', extent.extent);
    }
    return newLayer;
};

const createLineSymbol = (bviLineStyle: bviLineStyle): SimpleLineSymbol => {
    const newSymbol = new SimpleLineSymbol();
    newSymbol.style = 'solid';
    newSymbol.color = new Color(bviLineStyle.stroke);
    newSymbol.width = bviLineStyle.strokeWidth;
    return newSymbol;
};

const createPolygonSymbol = (bviPolygonStyle: bviPolygonStyle): SimpleFillSymbol => {
    const newSymbol = new SimpleFillSymbol();
    newSymbol.style = 'solid';
    // get rgba value from hex
    const color = Color.fromHex(bviPolygonStyle.fill);
    // apply transparency
    color.a = bviPolygonStyle.fillOpacity;
    newSymbol.color = new Color(color);
    const newOutline = new SimpleLineSymbol();
    newOutline.width = bviPolygonStyle.strokeWidth;
    newOutline.color = new Color(bviPolygonStyle.stroke);
    newOutline.style = 'solid';
    newSymbol.outline = newOutline;
    return newSymbol;
};

const getFieldsFromFeature = (properties: any): Field[] => {
    const fields = [];
    for (const key in properties) {
        fields.push(new Field({ alias: key, name: key, type: 'string' }));
    }
    return fields;
};

const getLineStyleFromFeature = (style: any): bviLineStyle => {
    const lineStyle = {} as bviLineStyle;
    lineStyle.stroke = style.stroke;
    lineStyle.strokeWidth = style['stroke-width'];
    return lineStyle;
};

const getPolygonStyleFromFeature = (style: any): bviPolygonStyle => {
    const polygonStyle = {} as bviPolygonStyle;
    polygonStyle.stroke = style.stroke;
    polygonStyle.strokeWidth = style['stroke-width'];
    polygonStyle.fill = style.fill;
    polygonStyle.fillOpacity = style['fill-opacity'];
    return polygonStyle;
};

const getnewUrl = (url: string, customParameters: any): string => {
    const hasCustomParameters = Object.keys(customParameters).length > 0;
    if (hasCustomParameters) {
        const urlSplit = url.split('?');
        url = urlSplit[0];
        let index = 1;
        for (const key in customParameters) {
            if (index === 1) {
                url = url.concat('?' + key + '=' + customParameters[key]);
            } else {
                url = url.concat('&' + key + '=' + customParameters[key]);
            }
            index++;
        }
    }
    return url;
};

const getExistingParameters = (url: string): string[] => {
    const urlSplit = url.split('?');
    let existingParameters: string[] = [];
    if (urlSplit.length > 1) {
        const parameters = urlSplit[1];
        existingParameters = parameters.split('&');
    }
    return existingParameters;
};

const getGeoJsonData = async (
    url: string,
    enqueueSnackbar: (message: React.ReactNode, options?: OptionsObject) => React.ReactText
): Promise<getGeoJsonResponse | undefined> => {
    const geoJsonResponse = {} as getGeoJsonResponse;
    const geoJsonDataArray: GeoJsonData[] = [];
    geoJsonResponse.geoJsonArray = geoJsonDataArray;
    const options = {
        responseType: 'json',
    } as RequestOptions;
    const results = await esriRequest(url, options);
    let hasPoints = false;
    let hasMultipoints = false;
    let hasPolygons = false;
    let hasLines = false;

    if (results?.data?.features?.length > 0) {
        for (const resultFeature of results.data.features) {
            switch (resultFeature.geometry.type) {
                case 'Point':
                    if (!hasPoints) {
                        const pointFields = getFieldsFromFeature(resultFeature.properties);
                        geoJsonDataArray.push({ type: 'point', fields: pointFields, title: 'Points' });
                    }
                    hasPoints = true;
                    break;
                case 'MultiPoint':
                    if (!hasMultipoints) {
                        const multipointFields = getFieldsFromFeature(resultFeature.properties);
                        geoJsonDataArray.push({
                            type: 'multipoint',
                            fields: multipointFields,
                            title: 'MultiPoints',
                        });
                    }
                    hasMultipoints = true;
                    break;
                case 'LineString':
                case 'MultiLineString':
                    if (!hasLines) {
                        const lineFields = getFieldsFromFeature(resultFeature.properties);

                        if (resultFeature.style) {
                            const lineStyle: bviLineStyle = getLineStyleFromFeature(resultFeature.style);
                            if (lineStyle) {
                                geoJsonResponse.lineStyle = lineStyle;
                            }
                        }
                        geoJsonDataArray.push({ type: 'polyline', fields: lineFields, title: 'Lines' });
                    }
                    hasLines = true;
                    break;
                case 'Polygon':
                case 'MultiPolygon':
                    if (!hasPolygons) {
                        const polygonFields = getFieldsFromFeature(resultFeature.properties);

                        if (resultFeature.style) {
                            const polygonStyle: bviPolygonStyle = getPolygonStyleFromFeature(resultFeature.style);
                            if (polygonStyle) {
                                geoJsonResponse.polygonStyle = polygonStyle;
                            }
                        }
                        geoJsonDataArray.push({ type: 'polygon', fields: polygonFields, title: 'Polygons' });
                    }
                    hasPolygons = true;
                    break;
                default:
                    break;
            }
        }
        return geoJsonResponse;
    } else {
        enqueueSnackbar('Error Message: Unable to load GeoJSON Layer - No records returned', { variant: 'warning' });
        return;
    }
};

export { addArcGisService, addGeoJson, addWFSLayer, addWMSLayer };
