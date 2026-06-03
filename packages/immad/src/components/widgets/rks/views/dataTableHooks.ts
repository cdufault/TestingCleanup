import { useEffect, useState, useRef } from 'react';
import FeatureTable from '@arcgis/core/widgets/FeatureTable';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { getLayerFullExtent } from '../../../../helpers/extentHelper';
import SceneView from '@arcgis/core/views/SceneView';
import MapView from '@arcgis/core/views/MapView';
import FeatureLayerView from '@arcgis/core/views/layers/FeatureLayerView';

/**
 * Methods and props passed back to the caller for construction of a UI for this hook
 */
export interface dataTableReturn {
    //create a table
    composeTable: (layer: FeatureLayer, containerDiv: HTMLElement) => void;
    //add flayer to the map
    addFLayerToMap: () => Promise<boolean>;
    //number ofitems in the grid
    featureCount: number;
    //zoom map to selected grid items
    zoomToFeaturesFunc: () => void;
    //array of current grid rows selected
    selectedFeatures: __esri.Graphic[] | [];
    //toggle on/off auto selecting map features corresponding to selected grid row
    toggleMapSelectionFunc: (toggle: boolean) => void;
    //grid has been refreshed with new data
    refreshedGrid: boolean;
    currentLayerViewIsConnected: boolean;
}

/**
 * Constructor parameters
 */
export interface useDataTableProps {
    //allow the grid rows to be selectable
    allowSelection?: boolean;
    //zoom map to the extent of the grids data when the grid adds its' data to the view
    zoomToLayerExtent?: boolean;
    //view associated with the grid data
    view: SceneView | MapView | undefined;
    //a callback method that the grid can use to send back messages to the caller
    loggerMethod?: (message: string, isError: boolean) => void | undefined;
}

export function useDataTable(props: useDataTableProps): dataTableReturn {
    const { allowSelection, view, zoomToLayerExtent, loggerMethod } = props;

    const [dataTable, setDataTable] = useState<FeatureTable | null>(null);
    const [ftrLayerView, setFtrLayerView] = useState<FeatureLayerView>();
    const [highlightFeatureOnSelection, setHighlightFeatureOnSelection] = useState(false);

    const highlightRef = useRef<__esri.Handle>();
    const fLayerRef = useRef<FeatureLayer>();

    //These three state variables: selectedFeastures, featureCount, and refreshedGrid are passed back to the caller to assist with setting UI state
    const [selectedFeatures, setSelectedFeatures] = useState<__esri.Graphic[]>([]);
    const [featureCount, setFeatureCount] = useState(0);
    const [refreshedGrid, setRefreshedGrid] = useState(false);

    const [layerViewDestroyedHandle, setLayerViewDestroyedHandle] = useState<__esri.WatchHandle>();
    const [currentLayerViewIsConnected, setCurrentLayerViewIsConnected] = useState(false);

    useEffect(() => {
        let dataTableSelectionHandle: IHandle;
        if (dataTable) {
            const features: __esri.Graphic[] = [];
            dataTableSelectionHandle = dataTable.on('selection-change', (changes) => {
                handleFeatureTableChange(changes, features);
            });
        }
        return () => {
            if (dataTable) {
                dataTable.destroy();
                setDataTable(null);
            }
            if (dataTableSelectionHandle) {
                dataTableSelectionHandle.remove();
            }
        };
    }, [dataTable]);

    useEffect(() => {
        if (ftrLayerView) {
            const handle = ftrLayerView.layer.on('layerview-destroy', () => {
                dataTable?.clearSelection();
                setCurrentLayerViewIsConnected(false);
            });
            if (layerViewDestroyedHandle) {
                //is there a handle for previous search results added to the map
                layerViewDestroyedHandle.remove(); //table will only work with a single view
            }
            setLayerViewDestroyedHandle(handle); //current view handle
            setCurrentLayerViewIsConnected(true);
        }
        return () => {
            if (layerViewDestroyedHandle) {
                layerViewDestroyedHandle.remove();
            }
        };
    }, [ftrLayerView]);

    useEffect(() => {
        if (fLayerRef.current) {
            fLayerRef.current.queryFeatureCount().then((count) => {
                setFeatureCount(count);
            });

            setRefreshedGrid(true);
        }
    }, [fLayerRef.current]);

    useEffect(() => {
        if (!selectedFeatures) {
            return;
        }
        selectFeaturesFunc();
    }, [selectedFeatures, highlightFeatureOnSelection]);

    /**
     * Pass this method back to the caller
     * @param layer source data for the grid
     * @param containerDiv dom div to place the grid
     */
    function composeTable(layer: FeatureLayer, containerDiv: HTMLElement) {
        if (layer == null || containerDiv == null) {
            return;
        }
        setRefreshedGrid(false);

        if (dataTable && dataTable.layer) {
            dataTable.layer = layer;
            dataTable.refresh();
            fLayerRef.current = layer;
            return;
        }

        const newTable = new FeatureTable({
            layer: layer,
            visibleElements: { selectionColumn: true },
            highlightOnRowSelectEnabled: true,
            container: containerDiv,
        });
        setDataTable(newTable);
        fLayerRef.current = layer;
    }

    /**
     * Pass this method back to the caller so they can add the grid data to the map if desired.
     * Wraps internal method.
     */
    async function addFLayerToMap(): Promise<boolean> {
        if (fLayerRef.current && view != undefined) {
            const fLayerView = await addLayerToMap(view, fLayerRef.current, zoomToLayerExtent);
            if (fLayerView) {
                setFtrLayerView(fLayerView);

                return true;
            }

            return false;
        }
        return false;
    }

    /**
     * This method is returned back to the client to enable toggling map selection.
     * @param toggle toggle on/off highlight features in the map corrsponding to grid rows
     */
    function toggleMapSelectionFunc(toggle: boolean) {
        setHighlightFeatureOnSelection(toggle);
        if (toggle) {
            return;
        }
        if (highlightRef != undefined && highlightRef.current != undefined) {
            highlightRef.current.remove();
        }
    }

    /**
     * This method is returned back to the caller to enable zooming the map to the grid's selected features
     */
    function zoomToFeaturesFunc() {
        const featureIds = getSelectedFtrsOids();
        if (featureIds.length < 1 || fLayerRef.current == undefined || !currentLayerViewIsConnected) {
            return;
        }

        const query = fLayerRef.current.createQuery();
        query.objectIds = featureIds;
        query.returnGeometry = true;
        fLayerRef.current.queryFeatures(query).then((results) => {
            view?.goTo(results.features).catch((error) => {
                if (error.name != 'AbortError') {
                    log(error, true);
                }
            });
        });
    }

    /**
     * Private to the hook - Wraps the method the caller passed in for messaging
     * @param message  message
     * @param isError error or log info
     */
    function log(message: string, isError: boolean) {
        if (loggerMethod) {
            loggerMethod(message, isError);
            return;
        }
        if (isError) {
            console.error(message);
        } else {
            console.log(message);
        }
    }

    /**
     * Private method to the hook that listens for selection events on the table
     */
    function handleFeatureTableChange(
        selectionChanges: __esri.FeatureTableSelectionChangeEvent,
        features: __esri.Graphic[]
    ) {
        if (selectionChanges && dataTable && allowSelection) {
            selectionChanges.removed.forEach((item) => {
                const data = features.find((feature) => {
                    return feature === item.feature;
                });
                if (data) {
                    features.splice(features.indexOf(data), 1);
                }
            });

            selectionChanges.added.forEach((item) => {
                const feature = item.feature;
                features.push(feature);
            });
            setSelectedFeatures([...features]);
        }
    }

    /**
     * Private to the hook. Adds layer to the map. Returns a flayer view wrapped in a viewObj
     * @param view current viw
     * @param fLayer layer to add to the map
     * @param zoomToLayerExtent zoom to layer extent
     */
    async function addLayerToMap(
        view: __esri.MapView | __esri.SceneView,
        fLayer: FeatureLayer,
        zoomToLayerExtent = true
    ): Promise<__esri.FeatureLayerView | undefined> {
        if (!view || !fLayer) {
            log('Failed to add fLayer to map. View or layer was null.', true);
            return undefined;
        }
        view.map.add(fLayer);

        fLayer
            .when(() => {
                if (zoomToLayerExtent) {
                    const fullExtent = getLayerFullExtent(fLayer, view);
                    if (!fullExtent) {
                        log('Failed to get the extent for the fLayer. Unable to zoom to extent.', true);
                        return;
                    }
                    view.goTo({
                        target: fullExtent.extent,
                        scale: fullExtent.scale,
                    });
                }
            })
            .catch((error) => {
                log('Error getting flayer view: Message: ' + error, true);
                return undefined;
            });

        const rksLayerView = await view.whenLayerView(fLayer).catch((error) => {
            log('Error gettting flayer view. Error: ' + error, true);
        });

        if (rksLayerView) {
            return rksLayerView as __esri.FeatureLayerView;
        } else {
            return undefined;
        }
    }

    /**
     * Private to the hook. Sets and clears highlighted features in the map.
     */
    function selectFeaturesFunc() {
        if (!highlightFeatureOnSelection || !currentLayerViewIsConnected) {
            return;
        }
        const selectedOids = getSelectedFtrsOids();

        if (highlightRef != undefined && highlightRef.current != undefined) {
            highlightRef.current.remove();
        }
        if (ftrLayerView && selectedOids.length > 0) {
            highlightRef.current = ftrLayerView.highlight(selectedOids);
        }
    }

    /**
     * Private to the hook. Generates and OID array from the selected featues.
     */
    function getSelectedFtrsOids(): number[] {
        let returnArray: number[] = [];
        if (!fLayerRef || !fLayerRef.current || !selectedFeatures) {
            return returnArray;
        }

        const oidField = fLayerRef.current.objectIdField;
        returnArray = selectedFeatures.map((ftr: __esri.Graphic) => {
            return ftr.getAttribute(oidField);
        });
        return returnArray;
    }

    /**
     * Return this to the call of the hook.
     */
    return {
        composeTable: composeTable,
        toggleMapSelectionFunc: toggleMapSelectionFunc,
        addFLayerToMap: addFLayerToMap,
        zoomToFeaturesFunc: zoomToFeaturesFunc,
        featureCount: featureCount,
        selectedFeatures: selectedFeatures,
        refreshedGrid: refreshedGrid,
        currentLayerViewIsConnected: currentLayerViewIsConnected,
    };
}

export default useDataTable;
