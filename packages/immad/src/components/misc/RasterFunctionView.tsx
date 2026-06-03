// React imports
import React, { useContext, useEffect, useState } from 'react';

import ImageryLayer from '@arcgis/core/layers/ImageryLayer';
import ImageryLayerFactor from './ImageryLayerFactor';
import LayerView from '@arcgis/core/views/layers/LayerView';
import RasterFunction from '@arcgis/core/layers/support/RasterFunction';
import { MapContext } from '../../contexts/Map';
import MapView from '@arcgis/core/views/MapView';
import SceneView from '@arcgis/core/views/SceneView';
import {
    ActionButton,
    FieldGroup,
    InputField,
    WidgetActions,
    WidgetContainer,
    WidgetContent,
    WidgetHeader,
} from '../common';

import Portal from '@arcgis/core/portal/Portal';
import { WidgetProgress } from '../common/styles';
import { Typography } from '@mui/material';
import { LogHelper } from '../../helpers/logHelper';

/**
 * Doctrinal Template Preview component. Deprecated and will be removed in a future release.
 * @deprecated
 */
const RasterFunctionView = (): JSX.Element => {
    const [layers, setLayers] = React.useState<LayerView[]>([]);

    const [rasterRenderingLayer, setRasterRenderingLayer] = useState<ImageryLayer | null>(null);

    const [input, setInput] = useState<string>('');

    const [rasterFunctionMap, setRasterFunctionMap] = useState({});

    const [rasterRenderingURL, setRasterRenderingURL] = useState<string | undefined>(undefined);

    const [rasterRenderingUpdating, setRasterRenderingUpdating] = useState<boolean>(false);

    const [view, setView] = useState<MapView | SceneView>();

    const [showDebug, setShowDebug] = useState<boolean>(false);

    const { mapViewInitialized, sceneViewInitialized, activeView, getMapView, getSceneView } = useContext(MapContext);

    useEffect(() => {
        const portal = new Portal();
        portal.load().then(() => {
            let url = portal.helperServices.rasterAnalytics.url;
            url = url.substring(0, url.lastIndexOf('/RasterAnalysisTools')) + '/RasterRendering/ImageServer';
            setRasterRenderingURL(url);
        });
    }, []);

    useEffect(() => {
        setRasterFunctionMap({});
        setRasterRenderingUpdating(false);
        setInput('');
        rasterRenderingLayer && view && view.map.remove(rasterRenderingLayer);
        setRasterRenderingLayer(null);

        switch (activeView) {
            case 'MAP':
                if (mapViewInitialized) {
                    const mapView = getMapView();
                    setView(mapView);
                }
                return;
            case 'SCENE': {
                if (sceneViewInitialized) {
                    const sceneView = getSceneView();
                    setView(sceneView);
                }
                return;
            }
        }
    }, [mapViewInitialized, sceneViewInitialized, activeView]);

    useEffect(() => {
        let createHandle: IHandle, destroyHandle: IHandle;
        if (view) {
            createHandle = view.on('layerview-create', () => {
                loadLayers(view);
            });
            destroyHandle = view.on('layerview-destroy', () => {
                loadLayers(view);
            });
            loadLayers(view);
        }
        return () => {
            createHandle && createHandle.remove();
            destroyHandle && destroyHandle.remove();
        };
    }, [view]);

    const loadLayers = (v: MapView | SceneView) => {
        // TODO: Still need to fix issues with updating data added from Data Feed
        const layers = v?.allLayerViews?.filter((item) => item.layer?.type === 'imagery').toArray();
        setLayers(layers);
    };

    useEffect(() => {
        let layerUpdatingHandle: __esri.WatchHandle;
        let layerDestroyedHandle: __esri.WatchHandle;
        if (view && rasterRenderingLayer) {
            view.map.add(rasterRenderingLayer);

            // Update progressor
            view.whenLayerView(rasterRenderingLayer).then((lv: LayerView) => {
                layerUpdatingHandle = lv.watch('updating', (updating) => setRasterRenderingUpdating(updating));
                layerDestroyedHandle = lv.layer.on('layerview-destroy', () => {
                    setRasterRenderingLayer(null);
                    setRasterRenderingUpdating(false);
                });
            });
        }
        return () => {
            layerUpdatingHandle?.remove();
            layerDestroyedHandle?.remove();
        };
    }, [rasterRenderingLayer, view]);

    useEffect(() => {
        const rasters = [];
        const inputNames = [];
        const expressions = [];

        for (const layerId in rasterFunctionMap) {
            const r = rasterFunctionMap[layerId];

            if (r.enabled) {
                if (r.raster && r.raster.name && r.range.min && r.range.max) {
                    rasters.push(r.raster);
                    inputNames.push(r.raster.name);
                    expressions.push(`( ${r.raster.name} >= (${r.range.min}) & ${r.raster.name} <= (${r.range.max}) )`);
                    expressions.push(r.operator === 'AND' ? ' & ' : ' | ');
                }
            }
        }

        expressions.pop(); // remove last bool

        if (expressions.length > 0) {
            const expr = expressions.join(' ');
            const rf = new RasterFunction({
                functionArguments: {
                    Rasters: rasters,
                    InputNames: inputNames,
                    Expression: expr,
                },
                functionName: 'RasterCalculator',
                variableName: 'Raster',
            });

            const s = JSON.stringify(rf, null, 3);
            setInput(s);
        } else {
            setInput('');
        }
    }, [rasterFunctionMap, layers]);

    const onRangeChange = function (
        layerView: LayerView,
        range: number[],
        title: string,
        enabled: boolean,
        logicalOperator: string
    ) {
        const lyr = layerView.layer as ImageryLayer;

        if (!lyr) {
            return;
        }

        const newRasterFunctionMap = { ...rasterFunctionMap };

        const rasterFunctionVariable = {
            url: lyr.url,
            name: title,
        };

        newRasterFunctionMap[lyr.id] = {
            raster: rasterFunctionVariable,
            range: {
                min: range[0],
                max: range[1],
            },
            enabled: enabled,
            operator: logicalOperator,
        };

        setRasterFunctionMap(newRasterFunctionMap);
    };

    const clearRasterRendering = () => {
        rasterRenderingLayer && view && view.map.remove(rasterRenderingLayer);
    };

    const updatePreview = () => {
        LogHelper.log(input);

        if (!input) {
            clearRasterRendering();
            return;
        }

        const rasterData = btoa(input); // base64 encode

        if (rasterRenderingLayer) {
            rasterRenderingLayer.set('raster', rasterData).refresh();

            if (view && view.map && !view.map.findLayerById(rasterRenderingLayer.id)) {
                view.map.add(rasterRenderingLayer);
            }
        } else {
            const colorMap: number[][] = [
                [0, 170, 0, 0],
                [1, 0, 255, 0],
            ];

            const colorRF = new RasterFunction();
            colorRF.functionName = 'Colormap';
            colorRF.functionArguments = {
                Colormap: colorMap,
                Raster: '$$',
            };

            // setRasterRenderingRule(colorRF);

            const lyr = new ImageryLayer({
                url: rasterRenderingURL,
                raster: rasterData, // undocumented feature
                renderingRule: colorRF,
                interpolation: 'nearest',
                opacity: 0.6,
                popupTemplate: {
                    title: 'Query Surface',
                    content: 'Value: <b>{Raster.ItemPixelValue}</b>',
                    actions: [],
                },
            });

            setRasterRenderingLayer(lyr);
        }
    };

    const handleClick = () => {
        updatePreview();
    };

    const handleInputChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    return (
        <WidgetContainer>
            <WidgetHeader position='static'>Doctrinal Template (Tech Preview)</WidgetHeader>
            <WidgetContent elevation={0}>
                {showDebug && (
                    <FieldGroup>
                        <InputField
                            multiline
                            rowsMax={12}
                            rows={12}
                            value={input}
                            fullWidth
                            size='small'
                            variant='outlined'
                            color='secondary'
                            onChange={handleInputChanged}
                        />
                    </FieldGroup>
                )}

                {view && !view.updating && (!layers || layers.length === 0) && (
                    <Typography>No imagery layers are available. Please add them to the map first.</Typography>
                )}

                {layers?.map((layerView: LayerView) => {
                    if (
                        layerView.layer?.type === 'imagery' &&
                        (layerView.layer as ImageryLayer).url !== rasterRenderingURL
                    ) {
                        return (
                            <ImageryLayerFactor
                                layerView={layerView}
                                key={layerView.layer.id}
                                onRangeChange={onRangeChange}
                            />
                        );
                    }
                })}
            </WidgetContent>

            {(rasterRenderingUpdating || !view || (view.updating && (!layers || layers.length === 0))) && (
                <WidgetProgress color={'secondary'} />
            )}

            <WidgetActions elevation={0}>
                <ActionButton
                    variant='contained'
                    color='secondary'
                    value={showDebug}
                    onClick={() => setShowDebug(!showDebug)}
                >
                    {showDebug ? (
                        <React.Fragment>Hide Query</React.Fragment>
                    ) : (
                        <React.Fragment>Show Query</React.Fragment>
                    )}
                </ActionButton>

                {!rasterRenderingLayer && (
                    <ActionButton
                        variant='contained'
                        color='secondary'
                        disabled={input === '' || rasterRenderingUpdating}
                        onClick={handleClick}
                    >
                        Submit
                    </ActionButton>
                )}

                {rasterRenderingLayer && (
                    <ActionButton
                        variant='contained'
                        color='secondary'
                        disabled={input === ''}
                        onClick={() => clearRasterRendering()}
                    >
                        Remove
                    </ActionButton>
                )}

                {rasterRenderingLayer && (
                    <ActionButton
                        variant='contained'
                        color='secondary'
                        disabled={input === '' || rasterRenderingUpdating}
                        onClick={handleClick}
                    >
                        Update
                    </ActionButton>
                )}
            </WidgetActions>
        </WidgetContainer>
    );
};

export default RasterFunctionView;
