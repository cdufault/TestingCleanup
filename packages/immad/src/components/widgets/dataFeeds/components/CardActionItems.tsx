// React imports
import React, { Fragment, useContext, useEffect, useState } from 'react';
import PortalItem from '@arcgis/core/portal/PortalItem';
import Layer from '@arcgis/core/layers/Layer';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import MapView from '@arcgis/core/views/MapView';
import SceneView from '@arcgis/core/views/SceneView';
import { ButtonProgress, ButtonWrapper } from '../styles';
import { LogHelper } from '../../../../helpers/logHelper';
import { MapContext } from '../../../../contexts/Map';
import PromisedWatchHandle = __esri.PromisedWatchHandle;
import LayerFromPortalItemParams = __esri.LayerFromPortalItemParams;
import { SaveLoadContext } from '../../../../contexts/SaveLoad';
import { ZoomToContext } from '../../../../contexts/ZoomToLayerContext';
import { checkAndUpdateLayerDefaultElevationStrategy } from '../../../../helpers/layerHelper';
import { Alert, Button } from '@mui/material';
import { useSnackbar } from 'notistack';

interface CardActionItemsProps {
    item?: PortalItem;
}

function CardActionItems(props: CardActionItemsProps): JSX.Element {
    const { item } = props;
    const { enqueueSnackbar } = useSnackbar();
    const { isStateSaved } = useContext(SaveLoadContext);
    const { map, activeView, getMapView, getSceneView } = useContext(MapContext);

    const [isLoading, setIsLoading] = useState(false);
    const [mapLayer, setMapLayer] = useState<Layer | null>();

    const [hasError, setHasError] = useState<boolean>();
    const [error, setError] = useState<string>();
    const { addLayerToMapWithZoomAction } = useContext(ZoomToContext);

    useEffect(() => {
        if (item && isLoading) {
            Layer.fromPortalItem({ portalItem: item } as LayerFromPortalItemParams)
                .then((newLayer) => {
                    switch (newLayer.type) {
                        //special case for map-image or tile layers which are not supported by the defaultPopupTemplate property
                        case 'map-image':
                        case 'tile':
                            newLayer.load().then((layer) => {
                                for (const subLayer of layer.allSublayers.items) {
                                    if (subLayer.geometryType === 'point') {
                                        subLayer.popupTemplate = subLayer.createPopupTemplate();
                                    }
                                }
                            });
                            setMapLayer(newLayer);
                            break;
                        //scene, integrated mesh, and point cloud layers are not supported in 2D.
                        case 'scene':
                        case 'integrated-mesh':
                        case 'point-cloud':
                            if (activeView === 'MAP') {
                                enqueueSnackbar(
                                    `${item.title} cannot be loaded in a 2D view. To view the layer switch to 3D and add the layer.`,
                                    {
                                        variant: 'warning',
                                        persist: false,
                                    }
                                );
                                setIsLoading(false);
                                break;
                            }
                        //if the active view is SCENE the new layer will fall through to the default case
                        default:
                            newLayer
                                .load()
                                .then((layer) => {
                                    setMapLayer(layer);
                                })
                                .catch(async () => {
                                    //Might of failed to load due to inability to render 3d in 2d view
                                    //attempts to create layer regardless of type, using an undefined renderer
                                    if (activeView === 'MAP') {
                                        newLayer = await Layer.fromArcGISServerUrl({
                                            url: item.url.trim(),
                                        });
                                        newLayer
                                            .load()
                                            .then((layer) => {
                                                setMapLayer(layer);
                                            })
                                            .catch(() => {
                                                setHasError(true);
                                            });
                                    } else {
                                        setHasError(true);
                                    }
                                });
                    }
                })
                .catch(() => {
                    setHasError(true);
                });
        }
    }, [item, isLoading]);

    useEffect(() => {
        if (!map) {
            return;
        }

        if (mapLayer) {
            let handle: IHandle;
            let loadHandle: PromisedWatchHandle;
            try {
                handle = map.allLayers.on('change', (e) => {
                    if (e.removed.map((layer) => layer.id).includes(mapLayer.id)) {
                        setMapLayer(null);
                    }
                });

                reactiveUtils.whenOnce(() => mapLayer.loaded).then(() => setIsLoading(false));

                const view: SceneView | MapView | undefined = activeView === 'MAP' ? getMapView() : getSceneView();
                // check if activeView is 3D, else do not do this step.
                let updatedLayer = mapLayer;
                if (activeView === 'SCENE') {
                    updatedLayer = checkAndUpdateLayerDefaultElevationStrategy(updatedLayer);
                }
                if (view) {
                    addLayerToMapWithZoomAction(view, updatedLayer);
                }
            } catch (error) {
                LogHelper.log(error);
                setHasError(true);
                setError(error);
            }
            return () => {
                handle?.remove();
                loadHandle?.remove();
            };
        }
    }, [map, mapLayer]);

    useEffect(() => {
        // view has changed reset button.
        // view was saved reset button.
        if (map && mapLayer) {
            setMapLayer(null);
        }
    }, [isStateSaved]);

    const handleRemoveLayer = () => {
        // need to check if mapLayer for the card
        // is in map if not then reset button
        // else remove the layer
        if (map && mapLayer) {
            const isInThere = map.allLayers.includes(mapLayer);
            if (!isInThere) {
                // layer is not present in map reset button
                setMapLayer(null);
            } else {
                map.remove(mapLayer);
            }
        }
    };

    return (
        <Fragment>
            {hasError && (
                <Alert
                    title={error}
                    severity='error'
                    variant='outlined'
                    style={{ padding: '0 16px', width: '100%', justifyContent: 'center' }}
                >
                    Error Loading Layer
                </Alert>
            )}
            {!hasError && (
                <ButtonWrapper fullWidth>
                    {isLoading && <ButtonProgress color='secondary' size={24} />}
                    {!mapLayer && (
                        <Button
                            variant='contained'
                            color='secondary'
                            fullWidth
                            disabled={isLoading}
                            onClick={() => setIsLoading(true)}
                        >
                            Add Layer
                        </Button>
                    )}
                    {mapLayer && (
                        <Button
                            variant='outlined'
                            color='secondary'
                            fullWidth
                            disabled={isLoading}
                            onClick={handleRemoveLayer}
                        >
                            Remove Layer
                        </Button>
                    )}
                </ButtonWrapper>
            )}
        </Fragment>
    );
}

export default CardActionItems;
