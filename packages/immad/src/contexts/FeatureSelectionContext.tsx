import React, { useContext, useEffect, useRef, useState } from 'react';

// interfaces
import FeatureLayerView = __esri.FeatureLayerView;
import ImageryLayer = __esri.ImageryLayer;
import Layer = __esri.Layer;
import MapView = __esri.MapView;
import SceneView = __esri.SceneView;

// helpers
import { EllipseInfo } from '../components/widgets/layerEllipse/resources';
import Query from '@arcgis/core/rest/support/Query';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { arrayEquals } from '../helpers/arrayHelper';
import GeoJSONLayer = __esri.GeoJSONLayer;
import CSVLayer = __esri.CSVLayer;
import OGCFeatureLayer = __esri.OGCFeatureLayer;
import WFSLayer = __esri.WFSLayer;
import SceneLayer = __esri.SceneLayer;
import SceneLayerView = __esri.SceneLayerView;
import WFSLayerView = __esri.WFSLayerView;
import OGCFeatureLayerView = __esri.OGCFeatureLayerView;
import GeoJSONLayerView = __esri.GeoJSONLayerView;
import CSVLayerView = __esri.CSVLayerView;

export interface FeatureSelectionProviderProps {
    children: JSX.Element[] | JSX.Element;
}

/**
 * Describes the method of selection.
 */
export enum SelectionMode {
    NewSelectionSet = 0,
    AddToSelectionSet = 1,
    RemoveFromSelectionSet = 2,
    SelectFromSelectionSet = 3,
}

interface ProcessingResult {
    vals: number[];
}

/**
 * Properties for the Selection Context
 */
interface FeatureSelectionContextProps {
    featureSelection: number[];
    selectionLayer: Layer | undefined;
    turnOnPairingPointsAndEllipses: (b: boolean) => void;
    isTransitiveEvent: boolean; //allows caller to pass a value to determine how caller handles the callback event that will fire
    processingResult: ProcessingResult; //callback event object of current oid's selected
    setSelectionData: (
        view: MapView | SceneView,
        layer: Layer,
        ids: number[],
        selectionMode?: SelectionMode,
        isTransitive?: boolean,
        updateFtrLayerOnly?: boolean
    ) => void;
    clearSelection: () => void;
}

export const FeatureSelectionContext = React.createContext<FeatureSelectionContextProps>({
    featureSelection: [],
    turnOnPairingPointsAndEllipses: () => {
        return;
    },
    isTransitiveEvent: false,
    processingResult: { vals: [] },
    selectionLayer: undefined,
    setSelectionData: () => {
        return;
    },
    clearSelection: () => {
        return;
    },
});

export function useFeatureSelectionContext(): FeatureSelectionContextProps {
    return useContext(FeatureSelectionContext);
}

export function FeatureSelectionProvider({ children }: FeatureSelectionProviderProps): JSX.Element {
    const [featureSelection, setFeatureSelection] = useState<number[]>([]);

    const selectedPointFtrOidsRef = useRef<number[]>([]);
    const selectedEllipseFtrOidsRef = useRef<number[]>([]);
    const unknownLayerRef = useRef<Layer>(); //some ftr layer but not known to be either a point or ellipse
    const pointLayerRef = useRef<Layer>();
    const ellipseLayerRef = useRef<Layer>();

    const [isTransitiveEvent, setIsTransitiveEvent] = useState<boolean>(false);
    const supportsEllipsePairing = useRef<boolean>(false);
    const [processingResult, setProcessingResult] = useState<ProcessingResult>({ vals: [] });

    const [selectionLayer, setSelectionLayer] = useState<Layer>();
    const viewRef = useRef<MapView | SceneView>();
    const highlight = useRef<IHandle | undefined>();
    const ellipseHighlight = useRef<IHandle | undefined>();
    const ellipseInfoRef = useRef<EllipseInfo>();
    const [ellipseSelection, setEllipseSelection] = useState<number[]>([]);
    const [ellipsePointSelection, setEllipsePointSelection] = useState<number[]>([]);
    const highlightHandlesByLayerId = useRef<Record<string, __esri.Handle>>({});

    useEffect(() => {
        handleFeatureSelection();
    }, [featureSelection]);

    useEffect(() => {
        //ellipseSelection, user clicked an ellipse feature on the map
        handleEllipseSelection();
    }, [ellipseSelection]);

    useEffect(() => {
        //ellipsePointSelection, points associated with an ellipse
        handleEllipseAssociatedPointSelection();
    }, [ellipsePointSelection]);

    /**
     * Set if the context is supporting the pairing of an ellipse layer with a point layer
     * @param turnOnSupport set support for pairing a point layer with an ellipse layer
     */
    function turnOnPairingPointsAndEllipses(turnOnSupport: boolean) {
        supportsEllipsePairing.current = turnOnSupport;

        if (!turnOnSupport) {
            if (pointLayerRef.current) {
                pointLayerRef.current.set('ellipseInfo', undefined);
            }
            if (ellipseLayerRef.current) {
                ellipseLayerRef.current.set('ellipseInfo', undefined);
            }
        }
    }

    /**
     * Handle the case when a feature has been selected on the map.
     */
    function handleFeatureSelection() {
        const view = viewRef.current;
        const layer = unknownLayerRef.current;

        // abort if nothing selected or no layer set
        if (!layer || !layer.id || featureSelection?.length === 0) {
            highlight.current?.remove();
            ellipseHighlight.current?.remove();
            setProcessingResult({ vals: [] });
            setProcessingResult({ vals: [] });
            // force clear internal tracking
            unknownLayerRef.current = undefined;
            setSelectionLayer(undefined);
            return;
        }

        // if nothing is selected, remove all highlights and exit
        if (featureSelection.length === 0) {
            highlight.current?.remove();
            ellipseHighlight.current?.remove();
            setProcessingResult({ vals: [] });
            return;
        }
        selectedPointFtrOidsRef.current = [...featureSelection];

        layer
            .load()
            .then(() => {
                if (view && layer && featureSelection) {
                    const ellipseInfoJson = layer?.ellipseInfo as string;

                    // Both the point and ellipse layers contain an ellipseInfo object
                    if (ellipseInfoJson) {
                        ellipseInfoRef.current = JSON.parse(ellipseInfoJson) as EllipseInfo;
                        // Check if feature is on an ellipse layer, otherwise use default selection workflow
                        if (ellipseInfoJson && ellipseInfoRef.current?.enabled) {
                            if (layer.id === ellipseInfoRef.current.pointLayerId) {
                                setEllipsePointSelection(featureSelection);
                            } else if (layer.id === ellipseInfoRef.current.ellipseLayerId) {
                                setEllipseSelection(featureSelection);
                            }
                            return;
                        }
                    }

                    // Handle non-ellipse layer

                    selectedEllipseFtrOidsRef.current = [];

                    switch (layer.type) {
                        case 'imagery': {
                            const imageryLayer = layer as ImageryLayer;
                            imageryLayer.queryRasters({ objectIds: featureSelection }).then((res) => {
                                view.whenLayerView(imageryLayer)
                                    .then((imageryLayerView) => {
                                        highlight.current?.remove();
                                        highlight.current = imageryLayerView.highlight(res.features);
                                    })
                                    .catch((e) => {
                                        console.error(e.message);
                                    });
                            });
                            return;
                        }
                        default: {
                            const viewableLayer = layer as
                                | FeatureLayer
                                | GeoJSONLayer
                                | CSVLayer
                                | OGCFeatureLayer
                                | WFSLayer
                                | SceneLayer;

                            // Exclude Map Service sublayers-turned-FeatureLayers, they do not support highlighting.
                            if (viewableLayer && !viewableLayer?.SUBLAYER_PARENT) {
                                view.whenLayerView(viewableLayer)
                                    .then(
                                        (
                                            layerView:
                                                | FeatureLayerView
                                                | GeoJSONLayerView
                                                | CSVLayerView
                                                | OGCFeatureLayerView
                                                | WFSLayerView
                                                | SceneLayerView
                                        ) => {
                                            // remove old highlight for this layer if it exists
                                            highlightHandlesByLayerId.current[layer.id]?.remove();

                                            // add new highlight and store the handle
                                            highlightHandlesByLayerId.current[layer.id] =
                                                layerView.highlight(featureSelection);
                                            setProcessingResult({ vals: [...featureSelection] }); // NOTE: Can move this to before the switch statement to support Map sublayer selections
                                        }
                                    )
                                    .catch((e) => {
                                        console.error(e.message);
                                    });
                            }
                        }
                    }
                }
            })
            .catch((e) => {
                console.error(e.message, e);
            });
    }

    /**
     * Handle support for the selection of point affiliated with an ellipse when supporting point/ellipse interaction.
     */
    function handleEllipseAssociatedPointSelection() {
        const view = viewRef.current;
        const pointLayer = unknownLayerRef.current as FeatureLayer;
        pointLayerRef.current = pointLayer;
        const ellipseInfo = ellipseInfoRef.current;
        ellipseHighlight.current?.remove();

        if (view && pointLayer && ellipseInfo && ellipsePointSelection.length > 0) {
            //highlight selected point
            view.whenLayerView(pointLayer).then((ellipsePointLayerView) => {
                highlightHandlesByLayerId.current[pointLayer.id]?.remove();
                highlightHandlesByLayerId.current[pointLayer.id] =
                    ellipsePointLayerView.highlight(ellipsePointSelection);
            });

            //get ellipse graphics to highlight
            const ellipseFeatureLayer = view.map.findLayerById(ellipseInfo.ellipseLayerId) as FeatureLayer;
            ellipseLayerRef.current = ellipseFeatureLayer;
            view.whenLayerView(ellipseFeatureLayer).then((ellipseLayerView) => {
                const query = new Query({
                    where: `pointOid IN (${ellipsePointSelection})`,
                    outFields: ['*'],
                });
                ellipseFeatureLayer.queryFeatures(query).then((ellipseFeatureSet) => {
                    const ellipseOids: number[] = [];
                    //highlight the selected ellipse
                    ellipseFeatureSet.features.forEach((ellipseFeature) => {
                        ellipseOids.push(ellipseFeature.getObjectId());
                    });
                    ellipseHighlight.current = ellipseLayerView.highlight(ellipseOids);

                    selectedPointFtrOidsRef.current = [...ellipsePointSelection];
                    selectedEllipseFtrOidsRef.current = [...ellipseOids];
                    setProcessingResult({ vals: [...ellipsePointSelection] });
                });
            });
        } else {
            setProcessingResult({ vals: [] }); //if nothing is selected on the map
        }
    }

    /**
     * Handle support for the selection of an ellipse feature affiliated with a point
     * when supporting point/ellipse interaction.
     */
    function handleEllipseSelection() {
        const view = viewRef.current;
        const ellipseLayer = unknownLayerRef.current as FeatureLayer;
        ellipseLayerRef.current = ellipseLayer;
        const ellipseInfo = ellipseInfoRef.current;

        if (view && ellipseLayer && ellipseInfo && ellipseSelection.length > 0) {
            const ellipseQuery = ellipseLayer.createQuery(); // Use existing def expr
            ellipseQuery.objectIds = ellipseSelection;
            ellipseQuery.outFields = ['pointOid'];
            ellipseQuery.returnGeometry = false;

            //get ellipse graphics
            ellipseLayer.queryFeatures(ellipseQuery).then((ellipseFeatureSet) => {
                selectedEllipseFtrOidsRef.current = [...ellipseSelection];

                try {
                    view.whenLayerView(ellipseLayer).then((ellipseLayerView) => {
                        //clear existing ellipse highlight
                        highlightHandlesByLayerId.current[ellipseLayer.id]?.remove();
                        highlightHandlesByLayerId.current[ellipseLayer.id] =
                            ellipseLayerView.highlight(ellipseSelection);
                    });
                } catch (e) {
                    ellipseHighlight.current?.remove();
                    console.error(e.message);
                }

                const associatedPointOIDs = ellipseFeatureSet.features
                    .map((graphic) => graphic.getAttribute('pointOid'))
                    .filter((id) => id !== null);

                const pointFeatureLayer = view.map.findLayerById(ellipseInfo.pointLayerId) as FeatureLayer;
                if (pointFeatureLayer) {
                    const pointQuery = pointFeatureLayer.createQuery();
                    pointQuery.objectIds = associatedPointOIDs;

                    // Query object IDs based on the point layer filter (including its definition expression)
                    pointFeatureLayer
                        .queryObjectIds(pointQuery)
                        .then((ids: number[]) => {
                            selectedPointFtrOidsRef.current = ids;
                            setProcessingResult({ vals: ids });
                        })
                        .catch((e) => {
                            console.error(e.message);
                        });

                    try {
                        view.whenLayerView(pointFeatureLayer).then((layerView) => {
                            highlightHandlesByLayerId.current[pointFeatureLayer.id]?.remove();
                            highlightHandlesByLayerId.current[pointFeatureLayer.id] =
                                layerView.highlight(associatedPointOIDs);
                        });
                    } catch (e) {
                        highlight.current?.remove();
                        console.error(e.message);
                    }
                } else {
                    console.debug('The layer could not be found: ' + ellipseInfo.pointLayerId);
                }
            });
        }
    }

    /**
     *
     * @param ids oids of features selected on the map
     * @param selectionMode is the selection mode: Add, Remove, or Replace
     */
    const updateSelection = (ids: number[], selectionMode: SelectionMode) => {
        switch (selectionMode) {
            case SelectionMode.RemoveFromSelectionSet: {
                setFeatureSelection((featureSelection) => featureSelection.filter((id) => !ids.includes(id))); // keep all except the ones to remove
                break;
            }
            case SelectionMode.AddToSelectionSet: {
                setFeatureSelection(
                    (featureSelection) =>
                        featureSelection
                            .filter((id) => !ids.includes(id))
                            .concat(ids)
                            .sort() // TODO: investigate sorted insertion
                );
                break;
            }
            case SelectionMode.SelectFromSelectionSet: {
                setFeatureSelection((featureSelection) => ids.filter((id) => featureSelection.includes(id)));
                break;
            }
            case SelectionMode.NewSelectionSet: {
                setFeatureSelection((_) => ids.sort()); // TODO: O(n logn), consider improving complexity here by using different data structure
                break;
            }
        }
    };

    const isSameSelectionSet = (
        oldSelectionLayer: Layer | undefined,
        newSelectionLayer: Layer,
        oldSelectionSet: number[],
        newSelectionSet: number[]
    ) => {
        // Return if layers are equal or if they are generated from the same sublayer.
        const layersAreEqual =
            newSelectionLayer &&
            (oldSelectionLayer?.id === newSelectionLayer?.id ||
                (oldSelectionLayer?.SUBLAYER_PARENT &&
                    oldSelectionLayer?.SUBLAYER_PARENT === newSelectionLayer?.SUBLAYER_PARENT));

        return layersAreEqual && arrayEquals(oldSelectionSet, newSelectionSet);
    };

    /**
     * This method starts a series of event that will highlight selected oids and make a callback with the current
     * selected oids
     * @param view current view
     * @param layer layer holding the current selection
     * @param ids array of selected feature oids
     * @param selectionMode is the selection mode: Add, Remove, or Replace (default).
     * @param isTransitive value passed by a caller to indicate how they will handle the callback selection event
     * @param updateFtrLayerOnly used exclusively for the feature table to prevent an infinite loop when a selection is made
     */
    const setSelectionData = (
        view: MapView | SceneView,
        layer: Layer,
        ids: number[],
        selectionMode: SelectionMode = SelectionMode.NewSelectionSet,
        isTransitive = false,
        updateFtrLayerOnly = false
    ) => {
        if (!layer) return;

        const sortedIds = ids.sort();
        if (arrayEquals(processingResult.vals, sortedIds)) {
            // the new selection is the same as the current one, so do nothing.
            return;
        }

        if (
            updateFtrLayerOnly &&
            selectionMode !== SelectionMode.NewSelectionSet &&
            isSameSelectionSet(unknownLayerRef.current, layer, selectedPointFtrOidsRef.current, sortedIds)
        ) {
            return;
        }

        viewRef.current = view;

        if (supportsEllipsePairing.current) {
            unknownLayerRef.current = layer;
            setSelectionLayer(layer);
            setIsTransitiveEvent(isTransitive); //used exclusively by tactical grid to suppress selectionChange events
            updateSelection(sortedIds, selectionMode);
            return;
        }

        //switched feature classes so the new oids belong to a diffent fclass than the ones that are stashed
        //from the previous call to this method
        if (unknownLayerRef.current && layer.id !== unknownLayerRef.current.id) {
            highlight.current?.remove();
            ellipseHighlight.current?.remove();
            unknownLayerRef.current = layer;
            setSelectionLayer(layer);
            updateSelection(sortedIds, selectionMode); //if layer changed don't try to add to selection
            return;
        }

        // In this case, layers are different but selection sets are the same
        setIsTransitiveEvent(isTransitive);
        unknownLayerRef.current = layer;
        setSelectionLayer(layer);
        updateSelection(sortedIds, selectionMode);
    };

    /**
     * Clear the state of the context
     */
    const clearSelection = async () => {
        Object.values(highlightHandlesByLayerId.current).forEach((handle) => {
            handle?.remove();
        });
        highlightHandlesByLayerId.current = {};
        ellipseHighlight.current?.remove();
        highlight.current?.remove();

        selectedEllipseFtrOidsRef.current = [];
        selectedPointFtrOidsRef.current = [];

        unknownLayerRef.current = undefined; // Clear internal layer
        pointLayerRef.current = undefined;
        ellipseLayerRef.current = undefined;
        ellipseInfoRef.current = undefined;

        setSelectionLayer(undefined); // Clear selectionLayer
        setFeatureSelection([]); // Clear selection IDs
        setProcessingResult({ vals: [] }); // Clear selection result
    };

    const value = {
        featureSelection,
        selectionLayer,
        isTransitiveEvent, //specifcally for supporting tactical grid
        processingResult, //specifcally for supporting tactical grid
        setSelectionData,
        clearSelection,
        turnOnPairingPointsAndEllipses, //supports tgrid and ellipse widget
    };

    return <FeatureSelectionContext.Provider value={value}>{children}</FeatureSelectionContext.Provider>;
}
