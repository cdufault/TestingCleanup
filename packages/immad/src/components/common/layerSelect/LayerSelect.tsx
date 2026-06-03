import React, { useEffect, useState } from 'react';
import MenuItem from '@mui/material/MenuItem';
import { StyledFeatureSelectItemDiv, StyledListItemIcon } from './styles';
import FeatureLayer = __esri.FeatureLayer;
import { ListItemText, TextField, Tooltip, Typography } from '@mui/material';
import LayerPointsIcon from 'calcite-ui-icons-react/LayerPointsIcon';
import LayerLineIcon from 'calcite-ui-icons-react/LayerLineIcon';
import LayerPolygonIcon from 'calcite-ui-icons-react/LayerPolygonIcon';
import LayerIcon from 'calcite-ui-icons-react/LayerIcon';
import FeatureLayerIcon from 'calcite-ui-icons-react/FeatureLayerIcon';
import LayersEditableIcon from 'calcite-ui-icons-react/LayersEditableIcon';
import LayerFilterIcon from 'calcite-ui-icons-react/LayerFilterIcon';
import LayerBrokenIcon from 'calcite-ui-icons-react/LayerBrokenIcon';
import BlankIcon from 'calcite-ui-icons-react/BlankIcon';
import ImageLayerIcon from 'calcite-ui-icons-react/ImageLayerIcon';
import LayerMapIcon from 'calcite-ui-icons-react/LayerMapIcon';
import * as promiseUtils from '@arcgis/core/core/promiseUtils';
import GeoJSONLayer = __esri.GeoJSONLayer;
import WFSLayer = __esri.WFSLayer;
import StreamLayer = __esri.StreamLayer;
import SubtypeGroupLayer = __esri.SubtypeGroupLayer;
import MapImageLayer = __esri.MapImageLayer;
import CollectionChangeEvent = __esri.CollectionChangeEvent;
import Layer from '@arcgis/core/layers/Layer';
import Sublayer = __esri.Sublayer;
import EachAlwaysResult = __esri.EachAlwaysResult;
import WebScene = __esri.WebScene;
import WebMap = __esri.WebMap;

/**
 * Custom attribute that tracks a Sublayer-generated Feature Layer's parent Map Image Layer.
 */
export const SUBLAYER_PARENT = 'sublayer_parent';

/**
 * Properties for Feature Layer Select component.
 */
interface LayerSelectProps {
    /**
     * Map
     */
    map: __esri.Map;

    /**
     * Show a "required" message when set to true
     */
    required: boolean;

    /**
     * A prop to disable/enable the Feature Layer Select
     */
    disabled?: boolean;

    /**
     * The title of the Feature Layer Select
     */
    title: string;

    /**
     * Function to notify when a select change has occurred.
     * @param layer
     */
    onChange: (layer: Layer | undefined) => void;

    /**
     * The currently selected layer
     */
    selectedLayer?: Layer;

    /**
     * Optional custom icon to the right of the layer, to provide additional information
     */
    itemIconType?: 'has-filter' | 'is-editable';

    /**
     * A filter function for the layer, to allow filtering by type or other layer attributes
     * @param lyr
     */
    layerTypeFilter?: (lyr: Layer) => boolean;

    /**
     * This prop is used to include Sublayers.
     * This loads sublayers as a FeatureLayer but only persists for the session
     * This will also include layers that are part of a GroupLayer
     * Should be true for: feature table, feature style, feature filter
     */
    includeSublayersAsFeatureLayers?: boolean;

    /**
     * Allows additional styling for layer text as a customization.
     */
    customListItemRenderer?: (layer: Layer, defaultText: string) => string;

    /**
     * Caller can pass a callback method if cleanup is needed before the new layer
     * is loaded
     * @returns void
     */
    onBeforeChange?: () => void;
}

/**
 * LayerSelect is used to select a Layer from the current Map.
 * @param props {LayerSelectProps} The Layer Select properties
 * @constructor
 */
const LayerSelect = (props: LayerSelectProps): JSX.Element => {
    const {
        onBeforeChange,
        map,
        onChange,
        selectedLayer,
        layerTypeFilter,
        includeSublayersAsFeatureLayers,
        customListItemRenderer,
    } = props;

    // NOTE: We cannot use '' or 'undefined' here due to Material UI spec, so we use a dummy value of 'none'.
    const [selectedLayerId, setSelectedLayerId] = useState<string>(props.selectedLayer?.id ?? 'none');
    const [layers, setLayers] = useState<Layer[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const isLayerCompatible = layerTypeFilter ? layerTypeFilter : () => true;

    useEffect(() => {
        setSelectedLayerId('none');
    }, [map]);

    const handleLayersChange = (e: CollectionChangeEvent<Layer>) => {
        const added: Layer[] = e.added ?? [];
        const removed: Layer[] = e.removed ?? [];

        if (added || removed) {
            const mapImageLayers = added.filter((lyr) => lyr.type === 'map-image');
            if (mapImageLayers.length > 0 && includeSublayersAsFeatureLayers) {
                loadSublayers(mapImageLayers);
            }

            setLayers((_) => {
                const webMap = map as WebScene | WebMap;
                const layers = webMap?.allLayers.filter(isLayerCompatible).toArray();

                const filteredLayers = layers.filter(
                    (item) =>
                        added?.indexOf(item) < 0 && // exclude duplicate items
                        removed?.indexOf(item) < 0 && // exclude removed items
                        item?.SUBLAYER_PARENT !== null &&
                        !removed?.includes(item?.SUBLAYER_PARENT)
                );

                return added.filter(isLayerCompatible).concat(filteredLayers);
            });
        }
    };

    /**
     * Recursively loads all sublayers (as Feature Layers) from a set of map layers.
     * @param layers
     */
    const loadSublayers = (layers: Layer[]) => {
        const mapImageLayers = layers.filter((lyr) => lyr.type === 'map-image') as MapImageLayer[];

        if (mapImageLayers && includeSublayersAsFeatureLayers) {
            for (const mapImageLayer of mapImageLayers) {
                mapImageLayer
                    .loadAll()
                    .catch((error: any) => {
                        console.error(error.message);
                    })
                    .then(() => {
                        return promiseUtils
                            .eachAlways(
                                mapImageLayer.allSublayers.map((sublayer: Sublayer) => sublayer.createFeatureLayer())
                            )
                            .then((result: EachAlwaysResult[]) => {
                                const errorResults = result.filter((res) => res.error);
                                for (const errorResult of errorResults) {
                                    console.error(errorResult.error);
                                }
                                const featureLayers: FeatureLayer[] = result
                                    .filter((res) => res.value)
                                    .map((res) => res.value as FeatureLayer);

                                return promiseUtils
                                    .eachAlways(featureLayers.map((lyr) => lyr.load()))
                                    .then((result: EachAlwaysResult[]) => {
                                        const errorResults = result.filter((res) => res.error);
                                        for (const errorResult of errorResults) {
                                            console.error(errorResult.error);
                                        }
                                        const loadedLayers = result
                                            .filter((res) => res.value)
                                            .map((res) => res.value as Layer);
                                        for (const layer of loadedLayers) {
                                            layer.set(SUBLAYER_PARENT, mapImageLayer);
                                        }

                                        setLayers((layers) => {
                                            const idx = layers.indexOf(mapImageLayer);
                                            //return sub layers filtered using layerTypeFilter
                                            return [
                                                ...layers.slice(0, idx),
                                                ...loadedLayers.filter(isLayerCompatible),
                                                ...layers.slice(idx),
                                            ];
                                        });
                                    });
                            });
                    });
            }
        }
    };

    /**
     * Sets the Layers list to the Map's current list of feature layers when the map changes.
     */
    useEffect(() => {
        if (map) {
            const handle = map.allLayers.on('change', handleLayersChange);

            const webSceneOrMap = map as WebScene | WebMap;
            setIsLoading(true);
            webSceneOrMap.load().then(() => {
                const layers = webSceneOrMap.allLayers.filter(isLayerCompatible).toArray();

                setLayers(layers);

                if (includeSublayersAsFeatureLayers) {
                    const mapImageLayers = webSceneOrMap.allLayers
                        .filter((layer: Layer) => layer.type === 'map-image')
                        .toArray();
                    loadSublayers(mapImageLayers);
                }

                setIsLoading(false);
            });

            return () => {
                handle?.remove();
                setIsLoading(false);
            };
        } else {
            setIsLoading(true);
            setLayers([]);
            setSelectedLayerId('none');
            setIsLoading(false);
        }
    }, [map, includeSublayersAsFeatureLayers]);

    /**
     * Sets the Layers list to the Map's current list of feature layers when the map changes.
     */
    useEffect(() => {
        if (selectedLayerId !== 'none') {
            const layer = layers.find((lyr) => lyr.id === selectedLayerId);
            if (!layer) {
                // layer was removed
                setSelectedLayerId('none');
            } else {
                //execute callback to cleanup from previous layer
                if (onBeforeChange) {
                    onBeforeChange();
                }
                onChange(layer);
            }
        } else {
            if (onBeforeChange) {
                //execute callback to cleanup from previous layer
                onBeforeChange();
            }
            onChange(undefined); // User selected 'none'
        }
    }, [layers, selectedLayerId]);

    useEffect(() => {
        if (selectedLayer) {
            setSelectedLayerId(selectedLayer.id);
        }
    }, [selectedLayer]);

    function getCustomFeatureLayerIcon(layer: Layer, iconType: 'has-filter' | 'is-editable') {
        const featureLayer = layer as FeatureLayer;

        if (layer.loadError) {
            return (
                <Tooltip title={layer.loadError.message}>
                    <StyledListItemIcon>
                        <LayerBrokenIcon size={16} />
                    </StyledListItemIcon>
                </Tooltip>
            );
        }

        if (featureLayer) {
            if (iconType === 'is-editable') {
                if (featureLayer.editingEnabled) {
                    return (
                        <StyledListItemIcon>
                            <LayersEditableIcon size={16} />
                        </StyledListItemIcon>
                    );
                }
            } else if (iconType === 'has-filter') {
                if (featureLayer.definitionExpression) {
                    return (
                        <StyledListItemIcon>
                            <LayerFilterIcon size={16} />
                        </StyledListItemIcon>
                    );
                }
            }
        }

        return (
            <StyledListItemIcon>
                <BlankIcon size={16} />
            </StyledListItemIcon>
        );
    }

    function getLayerTypeIcon(layer: Layer) {
        switch (layer?.type) {
            case 'geojson': // intentional fall through
            case 'stream': // intentional fall through
            case 'subtype-group': // intentional fall through
            case 'wfs':
            case 'feature': {
                const geometryLayer = layer as FeatureLayer | GeoJSONLayer | WFSLayer | StreamLayer | SubtypeGroupLayer;
                if (geometryLayer) {
                    switch (geometryLayer.geometryType) {
                        case 'point':
                            return <LayerPointsIcon size={16} />;
                        case 'polyline':
                            return <LayerLineIcon size={16} />;
                        case 'polygon':
                            return <LayerPolygonIcon size={16} />;
                        default:
                            return <FeatureLayerIcon size={16} />;
                    }
                }
                break;
            }
            case 'imagery': {
                return <ImageLayerIcon size={16} />;
            }
            case 'map-image': {
                return <LayerMapIcon size={16} />;
            }
            default: {
                return <LayerIcon size={16} />;
            }
        }
    }

    return (
        <TextField
            variant='outlined'
            select
            fullWidth
            disabled={isLoading || props.disabled}
            color='secondary'
            helperText={props.required ? 'Required' : ''}
            title={props.title}
            value={selectedLayerId}
            onChange={(event) => {
                setSelectedLayerId(event.target.value);
            }}
        >
            <MenuItem key='none' value='none'>
                <StyledFeatureSelectItemDiv>
                    <ListItemText disableTypography>
                        <Typography variant={'body2'}>
                            <i>Select a Layer</i>
                        </Typography>
                    </ListItemText>
                </StyledFeatureSelectItemDiv>
            </MenuItem>

            {layers.map((layer: Layer, index) => {
                const parent = layer?.SUBLAYER_PARENT as Layer;
                const parentTitle = parent ? parent.title + ' > ' : '';
                const itemText = parentTitle + layer.title;

                return (
                    <MenuItem key={layer.id + ':' + layer.title + ':' + index} value={layer.id} id={layer.id}>
                        <StyledFeatureSelectItemDiv>
                            <StyledListItemIcon>{getLayerTypeIcon(layer)}</StyledListItemIcon>
                            <ListItemText disableTypography>
                                <Typography variant={'body2'}>
                                    {customListItemRenderer ? customListItemRenderer(layer, itemText) : itemText}
                                </Typography>
                            </ListItemText>
                            <StyledListItemIcon>
                                {props.itemIconType && getCustomFeatureLayerIcon(layer, props.itemIconType)}
                            </StyledListItemIcon>
                        </StyledFeatureSelectItemDiv>
                    </MenuItem>
                );
            })}
        </TextField>
    );
};

export default LayerSelect;
