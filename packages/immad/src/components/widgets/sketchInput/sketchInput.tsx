// React imports
import React, { useEffect, useContext, useRef } from 'react';

import { MapContext } from '../../../contexts/Map';
import { WidgetContainer, WidgetActions, ActionButton } from '../../common';
import { ConfigHelper } from '../../../helpers/configHelper';
import { AppConfig } from '../../../interfaces/AppConfig';

import EsriSketch from '@arcgis/core/widgets/Sketch';
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import SpatialReference from '@arcgis/core/geometry/SpatialReference';
import Layer from '@arcgis/core/layers/Layer';
import Graphic from '@arcgis/core/Graphic';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import SimpleRenderer from '@arcgis/core/renderers/SimpleRenderer';
import Collection from '@arcgis/core/core/Collection';

export interface sketchWidgetProps {
    featureLayerId: string;
    graphicType: 'point' | 'polyline' | 'polygon';
    hasZ: boolean;
    sketchWidgetIsActive: boolean;
    onDoneButtonCallback: (drawLayer: Layer) => void;
    onCancelButtonCallback: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const SketchInput = (props: sketchWidgetProps): JSX.Element => {
    const { getMapView, getSceneView, activeView } = useContext(MapContext);
    const { featureLayerId, graphicType, hasZ, sketchWidgetIsActive, onDoneButtonCallback, onCancelButtonCallback } =
        props;

    const sketchContainerRef = useRef<HTMLDivElement>();
    const graphicsLayer = useRef<GraphicsLayer>();
    const originalGraphics = useRef<Array<Graphic>>();
    const appConfig = useRef<AppConfig>();

    const sketch = useRef<EsriSketch>();

    useEffect(() => {
        appConfig.current = ConfigHelper.getAppConfig();
        let view: __esri.MapView | __esri.SceneView | undefined;
        if (activeView === 'MAP') {
            view = getMapView();
        } else {
            view = getSceneView();
        }
        if (view) {
            if (!graphicsLayer.current) {
                graphicsLayer.current = new GraphicsLayer({
                    id: featureLayerId + 'TempGraphicsLayer',
                    title: featureLayerId + 'TempGraphicsLayer',
                    listMode: 'hide',
                });
            }

            const defaultSymbol = new SimpleMarkerSymbol(appConfig.current.sketch.defaultSymbol);

            const sketchView = new SketchViewModel({
                layer: graphicsLayer.current,
                pointSymbol: defaultSymbol,
                defaultCreateOptions: { hasZ: false },
            });

            sketch.current = new EsriSketch({
                layer: graphicsLayer.current,
                availableCreateTools: [graphicType],
                creationMode: 'single',
                defaultCreateOptions: { hasZ: hasZ },
                viewModel: sketchView,
                container: sketchContainerRef.current,
            });

            initGraphics();
        }
        return () => {
            if (graphicsLayer.current) {
                graphicsLayer.current.graphics = new Collection(originalGraphics.current);
                view?.map.remove(graphicsLayer.current);
            }
            const inputFeatureLayer: FeatureLayer = view?.map.findLayerById(featureLayerId) as FeatureLayer;
            if (inputFeatureLayer) {
                inputFeatureLayer.visible = true;
            }
        };
    }, []);

    useEffect(() => {
        let view;
        if (activeView === 'MAP') {
            view = getMapView();
        } else {
            view = getSceneView();
        }
        if (view) {
            const inputFeatureLayer: FeatureLayer = view.map.findLayerById(featureLayerId) as FeatureLayer;
            if (sketchWidgetIsActive) {
                if (graphicsLayer.current) {
                    view.map.add(graphicsLayer.current);
                }
                if (inputFeatureLayer) {
                    inputFeatureLayer.visible = false;
                }
            } else {
                if (graphicsLayer.current) {
                    view.map.remove(graphicsLayer.current);
                    if (inputFeatureLayer) {
                        inputFeatureLayer.visible = true;
                    }
                }
            }
        }
    }, [sketchWidgetIsActive]);

    useEffect(() => {
        let view;
        if (activeView === 'MAP') {
            view = getMapView();
            if (view) {
                if (graphicsLayer.current) {
                    if (!view.map.findLayerById(graphicsLayer.current.id)) {
                        view.map.add(graphicsLayer.current);
                    }
                }
                if (sketch.current) {
                    sketch.current.view = view;
                }
            }
        } else {
            view = getSceneView();
            if (view) {
                if (graphicsLayer.current && !view.map.findLayerById(graphicsLayer.current.id)) {
                    view.map.add(graphicsLayer.current);
                }
                if (sketch.current) {
                    sketch.current.view = view;
                }
            }
        }
    }, [activeView]);

    const initGraphics = async () => {
        const defaultSymbol = new SimpleMarkerSymbol(appConfig.current?.sketch.defaultSymbol);
        let view;
        if (activeView === 'MAP') {
            view = getMapView();
        } else {
            view = getSceneView();
        }
        if (view && graphicsLayer.current) {
            const existingFeatureLayer = view.map.findLayerById(featureLayerId) as FeatureLayer;
            if (existingFeatureLayer) {
                const supportQuery = existingFeatureLayer.createQuery();
                supportQuery.returnGeometry = true;
                supportQuery.where = '1=1';
                supportQuery.outSpatialReference = SpatialReference.WebMercator;
                const graphics = await existingFeatureLayer.queryFeatures(supportQuery);
                for (const graphic of graphics.features) {
                    const newGraphic = new Graphic();
                    newGraphic.geometry = graphic.geometry;
                    newGraphic.symbol = defaultSymbol;
                    graphicsLayer.current.add(newGraphic);
                }
                originalGraphics.current = graphicsLayer.current.graphics.clone().toArray();
            }
        }
    };

    const createNewFeatures = (): Array<Graphic> => {
        const newGraphics = [];
        const defaultSymbol = new SimpleMarkerSymbol(appConfig.current?.sketch.defaultSymbol);
        if (graphicsLayer.current) {
            const clonedGraphics = graphicsLayer.current.graphics.clone().toArray();
            for (const graphic of clonedGraphics) {
                const newGeometry = graphic.geometry;
                newGraphics.push(
                    new Graphic({
                        geometry: newGeometry,
                        symbol: defaultSymbol,
                    })
                );
            }
        }
        return newGraphics;
    };

    const onDoneButtonClicked = async () => {
        if (sketch.current && graphicsLayer.current) {
            sketch.current.complete();
            let view: __esri.MapView | __esri.SceneView | undefined;
            if (activeView === 'MAP') {
                view = getMapView();
            } else {
                view = getSceneView();
            }
            const newFeatures = createNewFeatures();
            if (view) {
                let inputFeatureLayer: FeatureLayer = view.map.findLayerById(featureLayerId) as FeatureLayer;
                if (inputFeatureLayer) {
                    const oldFeatures = await inputFeatureLayer.queryFeatures();
                    if (newFeatures.length > 0) {
                        inputFeatureLayer.applyEdits({
                            addFeatures: newFeatures,
                            deleteFeatures: oldFeatures.features,
                        });
                    }
                    inputFeatureLayer.refresh();
                } else {
                    const features = [] as Array<Graphic>;
                    if (appConfig.current) {
                        const defaultSymbol = new SimpleMarkerSymbol(appConfig.current.sketch.defaultSymbol);
                        const renderer = new SimpleRenderer({ symbol: defaultSymbol });
                        inputFeatureLayer = new FeatureLayer({
                            id: featureLayerId,
                            title: featureLayerId,
                            source: features,
                            fields: [{ name: 'ObjectID', alias: 'ObjectID', type: 'oid' }],
                            objectIdField: 'ObjectID',
                            geometryType: graphicType,
                            renderer: renderer,
                            spatialReference: SpatialReference.WGS84,
                        });
                        if (newFeatures.length > 0) {
                            inputFeatureLayer.applyEdits({
                                addFeatures: newFeatures,
                            });
                        }
                        inputFeatureLayer.refresh();
                        view.map.add(inputFeatureLayer);
                    }
                }
                originalGraphics.current = newFeatures;
                onDoneButtonCallback(inputFeatureLayer);
            }
        }
    };

    const onCancelButtonClicked = (evt: React.MouseEvent<HTMLButtonElement>) => {
        if (graphicsLayer.current) {
            graphicsLayer.current.graphics = new Collection(originalGraphics.current);
            onCancelButtonCallback(evt);
        }
    };

    return (
        <WidgetContainer>
            <div ref={sketchContainerRef}></div>
            <WidgetActions elevation={0}>
                <ActionButton
                    variant='contained'
                    color='secondary'
                    type='button'
                    title='Done Adding Graphics'
                    onClick={onDoneButtonClicked}
                >
                    Done
                </ActionButton>
                <ActionButton
                    variant='contained'
                    color='secondary'
                    type='button'
                    title='Cancel'
                    onClick={onCancelButtonClicked}
                >
                    Cancel
                </ActionButton>
            </WidgetActions>
        </WidgetContainer>
    );
};

export default SketchInput;
