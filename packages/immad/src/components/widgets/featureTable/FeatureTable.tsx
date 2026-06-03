// React & External Imports
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSnackbar } from 'notistack';
import { Box } from '@mui/material';

// ArcGIS Core Imports
import EsriFeatureTable from '@arcgis/core/widgets/FeatureTable';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import FeatureTableViewModel from '@arcgis/core/widgets/FeatureTable/FeatureTableViewModel';
import ButtonMenuViewModel from '@arcgis/core/widgets/FeatureTable/Grid/support/ButtonMenuViewModel';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import * as coordinateFormatter from '@arcgis/core/geometry/coordinateFormatter';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';

// ArcGIS Layer Types
// In Modern ArcGIS API development, it is generally preferred to use the ES module import unless we have a
// specific reason to import the types only
import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer';
import ImageryLayer from '@arcgis/core/layers/ImageryLayer';
import WFSLayer from '@arcgis/core/layers/WFSLayer';
import CSVLayer from '@arcgis/core/layers/CSVLayer';
import SceneLayer from '@arcgis/core/layers/SceneLayer';
import Query from '@arcgis/core/rest/support/Query';
import FeatureSet from '@arcgis/core/rest/support/FeatureSet';
import TableTemplate from '@arcgis/core/widgets/FeatureTable/support/TableTemplate';
import FieldColumnTemplate from '@arcgis/core/widgets/FeatureTable/support/FieldColumnTemplate';
import CodedValueDomain from '@arcgis/core/layers/support/CodedValueDomain';
import SpatialReference from '@arcgis/core/geometry/SpatialReference';

// UI Components & Icons
import { WidgetActions, WidgetContainer, WidgetContent, WidgetHeader } from '../../common';
import {
    StyledActionInputGroup,
    StyledInlineButton,
    StyledInlineToggleButton,
    StyledInputGroup,
    StyledLayerSelect,
} from './styles';
import SelectionIcon from 'calcite-ui-icons-react/SelectionIcon';
import LayersEditableIcon from 'calcite-ui-icons-react/LayersEditableIcon';
import TrashIcon from 'calcite-ui-icons-react/TrashIcon';
import PlusSquareIcon from 'calcite-ui-icons-react/PlusSquareIcon';
import ZoomToObjectIcon from 'calcite-ui-icons-react/ZoomToObjectIcon';
import ExtentFilterIcon from 'calcite-ui-icons-react/ExtentFilterIcon';

// Contexts
import { MapContext } from '../../../contexts/Map';
import { useConfirmationDialogContext } from '../../../contexts/ConfirmationDialogContext';
import { FeatureSelectionContext, SelectionMode } from '../../../contexts/FeatureSelectionContext';

// Helpers
import { tryToConvertFeatureLayerToSublayer } from '../../../helpers/layerFilterHelper';
import { useAppSelector } from '../../../hooks/hooks';
import SaveIcon from 'calcite-ui-icons-react/SaveIcon';
import XIcon from 'calcite-ui-icons-react/XIcon';

// Supported Feature Table Layers
type FeatureTableLayer = FeatureLayer | SceneLayer | GeoJSONLayer | CSVLayer | WFSLayer | ImageryLayer;
const supportedTypes: string[] = ['feature', 'imagery', 'scene', 'wfs', 'geojson', 'csv'];

// Field names for virtual layers
/**
 * Field names for virtual layer. These fields don't exist in the actual layer but are used in an in-memory
 * feature layer to support editing geometry attributes and tracking edit operations.
 **/
const POS_FIELD_NAME = 'POINT_DMS';
const Z_FIELD_NAME = 'POINT_Z';
const EDIT_FIELD_NAME = 'EDIT_TYPE';

// Component imports
import FeatureEditResult = __esri.FeatureEditResult;
import FeatureLayerProperties = __esri.FeatureLayerProperties;
import FeatureTableProperties = __esri.FeatureTableProperties;
import FieldProperties = __esri.FieldProperties;
import Field = __esri.Field;
import Geometry = __esri.Geometry;
import Layer = __esri.Layer;
import TableTemplateProperties = __esri.TableTemplateProperties;
import FieldColumnTemplateProperties = __esri.FieldColumnTemplateProperties;
import FeatureLayerBaseApplyEditsEdits = __esri.FeatureLayerBaseApplyEditsEdits;
import FeatureLayerBaseApplyEditsOptions = __esri.FeatureLayerBaseApplyEditsOptions;
import { arrayEquals } from '../../../helpers/arrayHelper';

const updateStatusCodedValues = new CodedValueDomain({
    codedValues: [
        {
            name: 'Add',
            code: 'ADD',
        },
        {
            name: 'Update',
            code: 'UPDATE',
        },
        {
            name: 'Delete',
            code: 'DELETE',
        },
    ],
});

const editAttribute = {
    name: EDIT_FIELD_NAME,
    alias: 'Edit Type',
    type: 'string',
    editable: true,
    defaultValue: 'ADD',
    domain: updateStatusCodedValues,
    nullable: false,
    valueType: 'type-or-category',
} as FieldProperties;

// Props Interface
interface FeatureTableProps {
    isDocked?: boolean;
}

const FeatureTable = ({ isDocked }: FeatureTableProps): JSX.Element => {
    const { enqueueSnackbar } = useSnackbar();
    const panningSpeed = useAppSelector((state) => state.applicationSlice.panningSpeed);
    const tacticalGrid = useAppSelector((state) => state.applicationSlice.tacticalGrid);
    const confirmationDialogContext = useConfirmationDialogContext();
    const { map, activeView, getMapView, getSceneView } = useContext(MapContext);
    const { featureSelection, selectionLayer, setSelectionData, clearSelection } = useContext(FeatureSelectionContext);
    const view = activeView === 'SCENE' ? getSceneView() : getMapView();

    // Local State
    const [selectedLayer, setSelectedLayer] = useState<FeatureTableLayer | undefined>();
    const [editingLayer, setEditingLayer] = useState<FeatureLayer | null>();
    const [tableTemplate, setTableTemplate] = useState<TableTemplate>();
    const [filterGeometry, setFilterGeometry] = useState<Geometry>();

    // Could be moved to slice if needed
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isEditEnabled, setIsEditEnabled] = useState<boolean>();
    const [isFilterByExtentEnabled, setIsFilterByExtentEnabled] = useState<boolean>();
    const [refresh, setRefresh] = useState<boolean>();
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [isTableLoaded, setIsTableLoaded] = useState(false);

    // ViewModel
    const [viewModel, setViewModel] = useState<FeatureTableViewModel>(
        new FeatureTableViewModel({
            editingEnabled: false,
        })
    );

    // Feature Table Instance & DOM Ref
    const featureTableRef = useRef<HTMLDivElement | null>(null);
    const saveWithoutGeometry = useRef(true);

    const table: EsriFeatureTable | null = useMemo(() => {
        setIsTableLoaded(false);

        const featureTableDiv = featureTableRef.current as HTMLDivElement;
        if (featureTableDiv) {
            featureTableDiv.innerHTML = '';
        }

        if (!selectedLayer) {
            return null;
        }

        const table: __esri.FeatureTable = new EsriFeatureTable({
            view: view,
            layer: editingLayer ? editingLayer : selectedLayer,
            highlightOnRowSelectEnabled: false, // handled externally
            editingEnabled: editingLayer !== null,
            visibleElements: {
                header: true,
                menuItems: {
                    zoomToSelection: false,
                },
            },
            menuConfig: {
                items: [
                    {
                        hidden: () => {
                            return hideZoomToExtentButton();
                        },
                        label: 'Zoom to extent',
                        icon: 'zoom-to-object',
                        clickFunction: () => {
                            handleZoomToSelection();
                        },
                    },
                ],
            },
            autoRefreshEnabled: true,
            pageSize: 20,
            container: featureTableRef.current,
        } as FeatureTableProperties);

        if (!editingLayer) {
            if (tableTemplate) {
                table.tableTemplate = tableTemplate;
            }
        }

        setViewModel(table.viewModel);

        return table;
    }, [featureTableRef, editingLayer, activeView, tableTemplate]);

    useEffect(() => {
        confirmationDialogContext.setDescription(
            'One or more features will be saved with as empty geometry. Continue?'
        );
        confirmationDialogContext.setTitle('Do you want to save?');
    }, []);

    useEffect(() => {
        // for use in debugging and fixing SI-3602 and SI-2840
        console.debug(`isDocked changed current value = ${isDocked}.`);
    }, [isDocked]);

    /**
     * Synchronizes selection when the ViewModel is ready to highlight IDs.
     */
    useEffect(() => {
        const handle = viewModel.watch('state', (newValue) => {
            if (newValue === 'loaded') {
                setIsTableLoaded(true);
            } else {
                setIsTableLoaded(false);
            }
        });
        return () => {
            //viewModel changed, so delete all highlights for the old viewModel to prevent orphaned selected features,
            //the selectionContext is not updated when editing so map feature selection will remain the same
            //and when edit mode exits the new table viewModel will update its selection based on the current map selection
            viewModel?.highlightIds?.removeAll();
            handle.remove();
        };
    }, [viewModel]);

    /**
     * Synchronizes the table highlighted rows when the feature selection is changed (in non-Editing mode)
     */
    useEffect(() => {
        if (!isEditing && isTableLoaded) {
            if (selectedLayer === selectionLayer) {
                viewModel.highlightIds.removeAll();
                viewModel.highlightIds.addMany(featureSelection);
            }
        }
    }, [isTableLoaded, featureSelection, selectionLayer, selectedLayer, activeView]);

    /**
     * Add the selectionChange event to the table.highlightIds
     */
    useEffect(() => {
        if (table) {
            const handle = table.highlightIds.on('change', (e) => {
                handleSelectionChange(e.target.items);
            });
            return () => {
                handle.remove();
            };
        }
    }, [table]);

    /**
     * Updates the global selection when the selected rows are updated (in non-Editing mode)
     */
    useEffect(() => {
        if (!selectedLayer || isEditing) return;
        const view = activeView === 'MAP' ? getMapView() : getSceneView();
        if (!view) return;

        // Only update if the new selection differs from the current featureSelection
        if (arrayEquals(selectedRows, featureSelection)) return;

        // Determine selection mode based on how the selection changed.
        let mode: SelectionMode;
        if (featureSelection.length > 0 && selectedRows.length < featureSelection.length) {
            // The new selection is smaller, so some items were unselected.
            mode = SelectionMode.RemoveFromSelectionSet;
        } else if (selectedRows.length > featureSelection.length) {
            // The new selection is larger (for instance, after a "Select All" action).
            mode = SelectionMode.AddToSelectionSet;
        } else {
            // Otherwise, default to NewSelectionSet.
            mode = SelectionMode.NewSelectionSet;
        }

        setSelectionData(view, selectedLayer as Layer, selectedRows, mode, false, false);
    }, [selectedRows, isEditing, selectedLayer, selectionLayer, featureSelection]);

    useEffect(() => {
        setIsEditing(false);

        if (selectionLayer === selectedLayer) {
            setSelectedRows(featureSelection);
        } else {
            setSelectedRows([]);
        }

        // if this is a "fake" sublayer, then map definitionExpression changes to it
        if (selectedLayer && selectedLayer.type === 'feature') {
            const sublayer = tryToConvertFeatureLayerToSublayer(selectedLayer);
            if (sublayer) {
                const handle = reactiveUtils.watch(
                    () => sublayer.definitionExpression,
                    (definitionExpression) => {
                        try {
                            // @ts-ignore setting 'undefined' is a valid value here
                            selectedLayer.definitionExpression = definitionExpression;
                        } catch (error) {
                            console.error(error.message);
                        }
                    }
                );
                return () => handle?.remove();
            }
        }
    }, [selectedLayer]);

    useEffect(() => {
        if (selectedLayer && supportedTypes.includes(selectedLayer.type)) {
            if (
                (selectedLayer.type === 'imagery' || selectedLayer.type === 'feature') &&
                !selectedLayer.capabilities?.operations?.supportsQuery
            ) {
                console.debug('Query is not supported for this layer.');

                return;
            }

            setIsFilterByExtentEnabled(false);
            // Only enable edit button for Feature Layers (if editing is enabled on the layer)
            setIsEditEnabled(selectedLayer.type === 'feature' ? selectedLayer.editingEnabled : false);

            selectedLayer
                .when(() => {
                    viewModel.layer = selectedLayer;
                    setTableTemplate(
                        new TableTemplate({
                            columnTemplates: selectedLayer.fields.map(
                                (field: Field) =>
                                    new FieldColumnTemplate({
                                        fieldName: field.name,
                                        label: field.alias,
                                        editable: false,
                                    } as FieldColumnTemplateProperties)
                            ),
                        } as TableTemplateProperties)
                    );
                })
                .catch((error) => {
                    console.error(error);
                });
        } else {
            const featureTableDiv = featureTableRef.current as HTMLDivElement;
            if (featureTableDiv) {
                featureTableDiv.innerHTML = '';
            }
        }
    }, [selectedLayer]);

    useEffect(() => {
        if (editingLayer) {
            viewModel.layer = editingLayer; // virtual client side layer
            viewModel.hiddenFields.push(editingLayer.objectIdField);
            setTableTemplate(
                new TableTemplate({
                    columnTemplates: editingLayer.fields.map(
                        (field) =>
                            new FieldColumnTemplate({
                                fieldName: field.name,
                                label: field.alias,
                                editable: field.editable ?? false, // set based on field properties
                                sortable: false, // workaround for another possible JSAPI bug
                                menuConfig: {
                                    container: document.createElement('div'),
                                    viewModel: new ButtonMenuViewModel({
                                        items: [],
                                    }),
                                },
                            })
                    ),
                })
            );
        } else {
            viewModel.layer = selectedLayer as FeatureTableLayer;
            viewModel.tableTemplate?.columnTemplates?.forEach((columnTemplate: FieldColumnTemplate) => {
                if (columnTemplate) {
                    columnTemplate.editable = false;
                }
            });
        }
    }, [editingLayer]);

    useEffect(() => {
        if (!editingLayer) return;

        const handleEdits = editingLayer.on('apply-edits', () => {
            console.debug('Edits applied, refreshing table...');
            viewModel.refresh();
        });

        return () => {
            handleEdits.remove();
        };
    }, [editingLayer, viewModel]);

    useEffect(() => {
        if (isEditing) {
            setSelectedRows([]); // Reset selection when entering editing
            const selectedFeatureLayer: FeatureLayer = selectedLayer as FeatureLayer;
            if (!selectedFeatureLayer) return;

            if (featureTableRef.current) {
                featureTableRef.current.innerHTML = '';
            }

            let shapeAttributes: FieldProperties[] = [];
            if (selectedFeatureLayer.geometryType === 'point') {
                shapeAttributes = [
                    {
                        name: POS_FIELD_NAME,
                        alias: 'Position [*]',
                        type: 'string',
                        valueType: 'coordinate',
                        editable: true,
                    },
                ];
                if (selectedFeatureLayer.capabilities.data.supportsZ) {
                    shapeAttributes.push({
                        name: Z_FIELD_NAME,
                        type: 'double',
                        alias: 'Altitude [*]',
                        valueType: 'measurement',
                        editable: true,
                    });
                }
            }

            coordinateFormatter.load().then(() => {
                const supportQuery = selectedFeatureLayer.createQuery();
                supportQuery.returnGeometry = true;
                supportQuery.returnZ = true;
                const highlightIds = viewModel.highlightIds;
                supportQuery.objectIds = highlightIds.toArray();
                if (supportQuery.objectIds.length === 0) {
                    supportQuery.where = '1=0'; // return only IDs, or no records at all.
                }
                supportQuery.outSpatialReference = SpatialReference.WGS84;
                supportQuery.outFields = ['*'];

                selectedFeatureLayer.queryFeatures(supportQuery).then((featureSet) => {
                    featureSet.features.forEach((graphic) => {
                        const point = graphic.geometry as Point;
                        if (point) {
                            const formattedCoordinate = coordinateFormatter.toLatitudeLongitude(point, 'dms', 0);
                            if (formattedCoordinate) {
                                // DDMM0SShDDDMM0SSh
                                //     ^        ^
                                // Remove spaces and leading 0 from arcseconds at 4th and 14th index positions.
                                const tmp = formattedCoordinate.replace(/\s/g, '');
                                const dms = tmp.slice(0, 3) + tmp.slice(4, 13) + tmp.slice(14);
                                // DDMMSShDDDMMSSh
                                graphic.setAttribute(POS_FIELD_NAME, dms);
                            }
                            if (point.hasZ) {
                                graphic.setAttribute(Z_FIELD_NAME, point.z);
                            }
                        }
                        graphic.setAttribute(EDIT_FIELD_NAME, 'UPDATE');
                    });

                    const options = {
                        source: featureSet.features,
                        title: selectedFeatureLayer.title + ' [Editing]',
                        objectIdField: selectedFeatureLayer.objectIdField,
                        geometryType: selectedFeatureLayer.geometryType,
                        spatialReference: SpatialReference.WGS84,
                        editingEnabled: true,
                        fields: [editAttribute, ...shapeAttributes, ...selectedFeatureLayer.fields],
                        hasZ: selectedFeatureLayer.hasZ,
                    } as FeatureLayerProperties;

                    const featureLayer = new FeatureLayer(options);
                    featureLayer.load().then(() => {
                        setEditingLayer(featureLayer);
                    });
                });
            });
        } else {
            setIsFilterByExtentEnabled(false);
            const featureTableDiv = featureTableRef.current as HTMLDivElement;
            if (featureTableDiv) {
                featureTableDiv.innerHTML = '';
            }
            setEditingLayer(null);
        }
    }, [isEditing]);

    /**
     * Refresh table when the refresh flag is set
     */
    useEffect(() => {
        if (refresh) {
            viewModel?.refresh();
            setRefresh(false);
        }
    }, [refresh]);

    /**
     *     Apply filterGeometry to the table
     */
    useEffect(() => {
        viewModel.filterGeometry = filterGeometry ? filterGeometry : undefined;
    }, [filterGeometry]);

    useEffect(() => {
        if (table && !isEditing) {
            if (isFilterByExtentEnabled) {
                const view = activeView === 'MAP' ? getMapView() : getSceneView();
                if (view) {
                    const handle = reactiveUtils.when(
                        () => view.stationary && !view.updating,
                        () => {
                            if (view.extent) {
                                setFilterGeometry(view.extent);
                            }
                        }
                    );
                    return () => {
                        handle.remove();
                    };
                }
            } else {
                // @ts-ignore
                setFilterGeometry(undefined);
            }
        }
    }, [table, activeView, isEditing, isFilterByExtentEnabled]);

    /**
     * Handle table checkbox change event
     * @param selectedRowsOIDs array of selected rows object ids
     */
    const handleSelectionChange = (selectedRowsOIDs: number[]) => {
        setSelectedRows([...selectedRowsOIDs]);
    };

    /**
     * Check if the zoom to extent button should be hidden
     * @returns true to hide or false to show the button
     */
    const hideZoomToExtentButton = () => {
        if (table?.rowHighlightIds) {
            return table?.highlightIds.length === 0;
        }
        return true;
    };

    /**
     * On click handler for Edit button.
     */
    const handleEditClick = () => {
        setIsEditing(true);
    };

    /**
     * This is a callback function passed to the LayerSelect widget which will fire just before the LayerSelect
     * fires its change method. Current highlights need to be cleared before the new layer is loaded.
     */
    const onBeforeLayerChange = () => {
        if (viewModel.highlightIds.length > 0) {
            clearSelection(); //clear selectionContext
        }
        viewModel.highlightIds.removeAll(); //clear table's viewModel
    };

    /**
     * Cancels the edit session and returns the layer menu to the non-edit view.
     */
    const handleCancel = () => {
        if (isEditing) {
            setIsEditing(false);
            setSelectedRows([]);
        }
    };

    /**
     * Consolidates edits from the in-memory layer and applies the edits on the real layer in a single transaction.
     */
    const handleCommit = () => {
        if (!editingLayer) return;

        viewModel.refresh(); // workaround for JSAPI bug

        const selectedFeatureLayer = selectedLayer as FeatureLayer;

        if (!selectedFeatureLayer) return;

        coordinateFormatter.load().then(() => {
            editingLayer.queryFeatures().then(async (result) => {
                const graphics = result.features;

                for (const graphic of result.features) {
                    const latLon: string = graphic.getAttribute(POS_FIELD_NAME);
                    if (latLon) {
                        const latLonWithSpace = latLon.slice(0, 7) + ' ' + latLon.slice(7);
                        const point = coordinateFormatter.fromLatitudeLongitude(
                            latLonWithSpace,
                            editingLayer.spatialReference
                        );
                        const z = graphic.getAttribute(Z_FIELD_NAME);
                        if (z) {
                            point.z = z;
                        }
                        if (point) {
                            graphic.geometry = point;
                        }
                    }
                }

                const addFeatures: Graphic[] = [];
                const updateFeatures: Graphic[] = [];
                const deleteFeatures: Graphic[] = [];

                // reset the ref
                saveWithoutGeometry.current = true;
                // get a count of all graphics being added without geometry
                const count = graphics.filter(
                    (graphic) => graphic.attributes.EDIT_TYPE === 'ADD' && graphic.geometry === null
                ).length;

                if (count > 0) {
                    // if there are graphics without geometry, ask if they want to save
                    await confirmationDialogContext.showConfirmationDialog()?.then((result: boolean) => {
                        saveWithoutGeometry.current = result;
                    });

                    // if no is clicked, return to edit session
                    if (!saveWithoutGeometry.current) return;
                }

                for (const graphic of graphics) {
                    const editType = graphic.getAttribute(EDIT_FIELD_NAME);
                    switch (editType) {
                        case 'ADD':
                            if (saveWithoutGeometry.current) {
                                addFeatures.push(graphic);
                            }
                            break;
                        case 'UPDATE':
                            updateFeatures.push(graphic);
                            break;
                        case 'DELETE':
                            deleteFeatures.push(graphic);
                            break;
                    }
                }

                const featureEdits: FeatureLayerBaseApplyEditsEdits = {
                    addFeatures: addFeatures,
                    updateFeatures: updateFeatures,
                    deleteFeatures: deleteFeatures,
                };

                const options: FeatureLayerBaseApplyEditsOptions = {
                    rollbackOnFailureEnabled: editingLayer?.capabilities?.editing.supportsRollbackOnFailure,
                };

                selectedFeatureLayer
                    .applyEdits(featureEdits, options)
                    .then(
                        (result: {
                            addFeatureResults: FeatureEditResult[];
                            updateFeatureResults: FeatureEditResult[];
                            deleteFeatureResults: FeatureEditResult[];
                        }) => {
                            for (const featureResult of [
                                ...result.addFeatureResults,
                                ...result.updateFeatureResults,
                                ...result.deleteFeatureResults,
                            ]) {
                                if (featureResult.error) {
                                    enqueueSnackbar(featureResult.error.message, { variant: 'error' });
                                    console.error(featureResult.error.message);
                                }
                            }
                        }
                    )
                    .catch((error) => {
                        console.error('ERROR: ' + error);
                        enqueueSnackbar('ERROR: ' + error, { variant: 'error' });
                    })
                    .finally(() => {
                        setIsEditing(false);
                    });
            });
        });
    };

    /**
     * on click handler for add row
     */
    const handleAddRow = useCallback(() => {
        if (!editingLayer) return;

        const edits: FeatureLayerBaseApplyEditsEdits = {};
        const graphic = new Graphic({
            attributes: [{ name: EDIT_FIELD_NAME, value: 'ADD' }],
        });
        edits.addFeatures = [graphic];
        editingLayer.applyEdits(edits).then((result: { addFeatureResults: FeatureEditResult[] }) => {
            for (const featureResult of result.addFeatureResults) {
                if (featureResult.error) {
                    enqueueSnackbar(featureResult.error.message, { variant: 'error' });
                }
            }
            viewModel.refresh();
        });
    }, [editingLayer, viewModel]);

    /**
     * Handles zoom to selected rows
     */
    const handleZoomToSelection = () => {
        if (featureSelection && selectedLayer) {
            const view = activeView === 'SCENE' ? getSceneView() : getMapView();
            if (view) {
                const options = {
                    speedFactor: panningSpeed,
                };

                if (selectedLayer.type === 'imagery') {
                    const layer = selectedLayer as ImageryLayer;
                    const query = {
                        objectIds: viewModel.highlightIds.toArray(),
                        returnGeometry: true,
                    } as Query;
                    layer.queryRasters(query).then((featureSet: FeatureSet) => {
                        view.goTo(featureSet.features, options).catch((error) => {
                            if (error.name !== 'AbortError') {
                                enqueueSnackbar('Error zooming to selection.', { variant: 'error' });
                                console.error(error);
                            }
                        });
                    });
                } else {
                    const layer = selectedLayer as FeatureLayer | SceneLayer | GeoJSONLayer | CSVLayer | WFSLayer;
                    if (layer) {
                        const query = layer.createQuery(); // Includes any existing definitionExpression
                        /*
                            Testing is showing that viewModel.highlightIds always has a count of 0
                            even when items are selected in the table and highlighted on the map,
                            keeping old code commented out for documentation purposes knowing that this
                            code will be revisited when the selection issues ticket is worked
                        */
                        //query.objectIds = viewModel.highlightIds.toArray();//previous code
                        query.objectIds = convertHighlightsToNumberArray();
                        query.returnGeometry = true;
                        layer.queryFeatures(query).then((featureSet: FeatureSet) => {
                            view.goTo(featureSet.features, options)
                                .then(() => {
                                    if (
                                        featureSet.features.length === 1 &&
                                        featureSet.features[0].geometry.type === 'point'
                                    ) {
                                        view.scale = tacticalGrid.zoomViewScale;
                                    }
                                })
                                .catch((error) => {
                                    if (error.name !== 'AbortError') {
                                        enqueueSnackbar('Error zooming to selection.', { variant: 'error' });
                                        console.error(error);
                                    }
                                });
                        });
                    }
                }
            }
        }
    };

    /**
     * Implemented to keep TS from complaining about type mismatch if:
     * query.objectids = table.highlightIds.toArray();-- it seems that highLightIds can be number[] | string[]
     * objectids is expecting a number[] only.
     * @returns number array
     */
    const convertHighlightsToNumberArray = (): number[] => {
        const vals: number[] = [];
        if (table?.highlightIds) {
            const valArray = table.highlightIds.toArray();
            for (let i = 0; i < valArray.length; i++) {
                const val = valArray[i];
                if (val !== undefined && typeof val !== 'string') {
                    vals.push(val);
                }
            }
        }
        return vals;
    };

    /**
     * Handles delete current selected rows
     */
    const handleDeleteSelection = useCallback(() => {
        if (!editingLayer) return;

        const supportQuery = editingLayer.createQuery();
        supportQuery.objectIds = viewModel.highlightIds.toArray();
        if (supportQuery.objectIds.length === 0) {
            supportQuery.where = '1=0';
        }

        editingLayer
            ?.queryFeatures(supportQuery)
            .then((featureSet) => {
                const edits = {
                    updateFeatures: [],
                    deleteFeatures: [],
                } as FeatureLayerBaseApplyEditsEdits;

                featureSet.features.forEach((graphic) => {
                    const updateStatus = graphic.attributes[EDIT_FIELD_NAME];
                    switch (updateStatus) {
                        case 'UPDATE':
                            // This is a real record, so we add to pending delete
                            graphic.attributes[EDIT_FIELD_NAME] = 'DELETE';
                            edits.updateFeatures?.push(graphic);
                            break;
                        case 'ADD':
                            // This is a new record (pending add), so we can delete it
                            edits.deleteFeatures?.push(graphic);
                            break;
                    }
                });

                editingLayer
                    .applyEdits(edits)
                    .then(
                        (result: {
                            updateFeatureResults: FeatureEditResult[];
                            deleteFeatureResults: FeatureEditResult[];
                        }) => {
                            for (const featureResult of result.updateFeatureResults) {
                                if (featureResult.error) {
                                    enqueueSnackbar(featureResult.error.message, { variant: 'error' });
                                }
                            }
                            for (const featureResult of result.deleteFeatureResults) {
                                if (featureResult.error) {
                                    enqueueSnackbar(featureResult.error.message, { variant: 'error' });
                                }
                            }
                            setRefresh(true);
                        }
                    );
            })
            .catch((reason) => {
                console.error('ERROR: ' + reason);
            });
    }, [editingLayer, viewModel]);

    /**
     * on click handler for filter by extent.
     */
    const OnExtentFilterClicked = () => {
        const newValue = !isFilterByExtentEnabled;
        setIsFilterByExtentEnabled(newValue);
        // Capture the current extent immediately
        const view = activeView === 'MAP' ? getMapView() : getSceneView();
        if (!view) return;
        if (newValue) {
            if (view.extent) {
                setFilterGeometry(view.extent);
            }
        } else {
            setFilterGeometry(undefined);
            // @ts-ignore
            viewModel.filterGeometry = undefined;
        }
        viewModel.refresh();
    };

    /**
     * on select all click handler
     */
    const onSelectAllButtonClicked = () => {
        const lyr = viewModel.layer;
        if (lyr) {
            const queryObjectIdsPromise = viewModel.filterGeometry
                ? lyr.queryObjectIds({ geometry: viewModel.filterGeometry })
                : lyr.queryObjectIds();

            queryObjectIdsPromise
                .then((numbers) => {
                    viewModel.highlightIds.removeAll();
                    if (numbers.length !== selectedRows.length) {
                        viewModel.highlightIds.addMany(numbers);
                    }
                })
                .catch((error) => {
                    console.error(error.message);
                });
        }
    };

    /**
     * On layer select change handler
     * @param layer updated layer
     */
    const onLayerSelectChange = (layer: __esri.Layer) => {
        if (layer) {
            layer
                .load()
                .then((lyr) => {
                    setSelectedLayer(lyr);
                })
                .catch((result) => {
                    console.error(result);
                    setSelectedLayer(undefined);
                });
        } else {
            setSelectedLayer(undefined);
        }
    };

    /**
     * Layer type filter to remove certain layers.
     * @param layer layer to check
     */
    const layerTypeFilter = (layer: __esri.Layer): boolean => {
        const isSupported = supportedTypes.includes(layer.type);
        if (isSupported && layer.type === 'imagery') {
            const imageryLayer = layer as ImageryLayer;
            return imageryLayer.fields?.length > 0;
        }
        return isSupported;
    };

    return (
        <WidgetContainer>
            <WidgetHeader position='static'>
                <StyledInputGroup>
                    {selectedLayer && !isEditing && (
                        <StyledInlineToggleButton
                            value='filter'
                            selected={isFilterByExtentEnabled}
                            onClick={OnExtentFilterClicked}
                            title={'Filter by Active View Extent'}
                        >
                            <ExtentFilterIcon size={16} />
                        </StyledInlineToggleButton>
                    )}
                    <StyledLayerSelect
                        map={map}
                        required={false}
                        disabled={isEditing}
                        title={'Select Layer'}
                        selectedLayer={selectedLayer as FeatureTableLayer}
                        itemIconType={'is-editable'}
                        onBeforeChange={onBeforeLayerChange}
                        onChange={onLayerSelectChange}
                        layerTypeFilter={layerTypeFilter}
                        includeSublayersAsFeatureLayers={true}
                    />

                    {selectedLayer && (
                        <React.Fragment>
                            {isEditEnabled && !isEditing && (
                                <StyledInlineButton
                                    variant='outlined'
                                    title={selectedRows.length > 0 ? 'Edit the Selected Row' : 'Edit to Add Row(s)'}
                                    startIcon={<LayersEditableIcon size={16} />}
                                    onClick={handleEditClick}
                                >
                                    Edit
                                </StyledInlineButton>
                            )}

                            <Box title={'Zoom to Selected'}>
                                <StyledInlineToggleButton
                                    disabled={selectedRows.length === 0}
                                    onClick={handleZoomToSelection}
                                >
                                    <ZoomToObjectIcon size={16} />
                                </StyledInlineToggleButton>
                            </Box>

                            <StyledInlineToggleButton onClick={onSelectAllButtonClicked} title={'Select All'}>
                                <SelectionIcon size={16} />
                            </StyledInlineToggleButton>
                        </React.Fragment>
                    )}
                </StyledInputGroup>

                {isEditing && (
                    <StyledActionInputGroup>
                        <StyledInlineButton
                            title={'Add Row'}
                            startIcon={<PlusSquareIcon size={16} />}
                            onClick={handleAddRow}
                        >
                            Add Row
                        </StyledInlineButton>
                        {selectedRows.length > 0 && (
                            <StyledInlineButton
                                type='button'
                                title={'Delete Selected Rows'}
                                startIcon={<TrashIcon size={16} />}
                                onClick={handleDeleteSelection}
                            >
                                Delete
                            </StyledInlineButton>
                        )}
                    </StyledActionInputGroup>
                )}
            </WidgetHeader>
            <WidgetContent elevation={0}>{selectedLayer && <div ref={featureTableRef} />}</WidgetContent>

            {isEditing && (
                <WidgetActions elevation={0}>
                    <React.Fragment>
                        <StyledInlineButton
                            variant='outlined'
                            type='button'
                            title={'Cancel'}
                            onClick={handleCancel}
                            startIcon={<XIcon size={16} />}
                        >
                            Cancel
                        </StyledInlineButton>

                        <StyledInlineButton
                            variant='outlined'
                            type='button'
                            title={'Save Changes'}
                            onClick={handleCommit}
                            startIcon={<SaveIcon size={16} />}
                        >
                            Save Changes
                        </StyledInlineButton>
                    </React.Fragment>
                </WidgetActions>
            )}
        </WidgetContainer>
    );
};

export default FeatureTable;
