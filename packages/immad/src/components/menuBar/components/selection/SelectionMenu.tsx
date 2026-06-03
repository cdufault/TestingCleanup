import { Button, ButtonGroup, ListItemText, ListItemIcon, Menu, MenuItem } from '@mui/material';
import CaretDownIcon from 'calcite-ui-icons-react/CaretDownIcon';
import CursorSelectionIcon from 'calcite-ui-icons-react/CursorSelectionIcon';
import SelectIcon from 'calcite-ui-icons-react/SelectIcon';
import CursorMarqueeIcon from 'calcite-ui-icons-react/CursorMarqueeIcon';
import SpinnerIcon from 'calcite-ui-icons-react/SpinnerIcon';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { MapContext } from '../../../../contexts/Map';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel';
import { FeatureSelectionContext, SelectionMode } from '../../../../contexts/FeatureSelectionContext';
import SceneView = __esri.SceneView;
import MapView = __esri.MapView;
import SketchProperties = __esri.SketchProperties;
import LayerSelect from '../../../common/layerSelect';
import WebScene = __esri.WebScene;
import WebMap = __esri.WebMap;
import { LogHelper } from '../../../../helpers/logHelper';
import Geometry from '@arcgis/core/geometry/Geometry';
import Query from '@arcgis/core/rest/support/Query';
import { isLayerSelectable, SelectableLayer, selectByLocationAsync, SelectByLocationParams } from './SelectionHelper';
import SelectByLocationDialog from './SelectByLocationDialog';
import { useSnackbar } from 'notistack';
import Layer = __esri.Layer;
import { useStyles } from '../../styles';

/**
 * Selection operation values
 */
enum SelectionOperation {
    Cursor,
    Rectangle,
    ByLocation,
}

/**
 * Menu showing Selection options
 * @constructor
 */
const SelectionMenu = (): JSX.Element => {
    const { map, mapViewInitialized, sceneViewInitialized, activeView, getMapView, getSceneView } =
        useContext(MapContext);

    const { setSelectionData, clearSelection, featureSelection, selectionLayer } = useContext(FeatureSelectionContext);

    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    const [operation, setOperation] = useState<SelectionOperation>(SelectionOperation.Cursor);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const openMenu = Boolean(anchorEl);

    const [selectedLayer, setSelectedLayer] = useState<SelectableLayer>();

    const [view, setView] = useState<MapView | SceneView>();

    const [queryGeometry, setQueryGeometry] = useState<Geometry>();

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const { enqueueSnackbar } = useSnackbar();

    const classes = useStyles();

    /**
     * The Sketch View Model for sketching selection boxes
     */
    const sketchViewModel = useMemo(
        () =>
            new SketchViewModel({
                view: view,
                layer: new GraphicsLayer(),
                updateOnGraphicClick: false,
                defaultCreateOptions: {
                    hasZ: false,
                },
            } as SketchProperties),
        [view]
    );

    useEffect(() => {
        setView(getMapView());
    }, [mapViewInitialized]);

    useEffect(() => {
        setView(getSceneView());
    }, [sceneViewInitialized]);

    useEffect(() => {
        const view = activeView === 'MAP' ? getMapView() : getSceneView();
        if (view) {
            setView(view);
        }
    }, [activeView]);

    /**
     * Clears the selection set and sets the global selection layer when the local selected layer changes.
     */
    useEffect(() => {
        if (view && selectedLayer && selectedLayer !== selectionLayer) {
            clearSelection();
            setSelectionData(view, selectedLayer, [], SelectionMode.NewSelectionSet);
        }
    }, [selectedLayer]);

    useEffect(() => {
        return handleSelection(operation);
    }, [operation]);

    useEffect(() => {
        setSelectedLayer(selectionLayer as SelectableLayer);
    }, [selectionLayer]);

    /**
     * When the Tool's query geometry is set, we perform a query by object IDs to make the selection
     */
    useEffect(() => {
        if (queryGeometry && selectedLayer && view) {
            const query = selectedLayer.type === 'imagery' ? new Query() : selectedLayer.createQuery();
            query.geometry = queryGeometry;
            query.spatialRelationship = 'intersects';
            selectedLayer
                .queryObjectIds(query)
                .then((ids) => {
                    setSelectionData(view, selectedLayer, ids, SelectionMode.NewSelectionSet);
                })
                .catch((error) => {
                    enqueueSnackbar(error.message, { variant: 'error' });
                    setQueryGeometry(undefined);
                });
        }
    }, [queryGeometry, view]);

    const handleMenuClick = useCallback(
        (event: { currentTarget: React.SetStateAction<HTMLElement | null> }) => {
            setAnchorEl(event.currentTarget);
        },
        [view]
    );

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    /**
     * Activates the selection tool based on the operation provided.
     * @param operation The selection operation to activate
     */
    const handleSelection = (operation: SelectionOperation) => {
        sketchViewModel.cancel();
        switch (operation) {
            case SelectionOperation.Rectangle:
                return handleSelectionTool('rectangle');
            case SelectionOperation.Cursor:
                return; // do nothing
            case SelectionOperation.ByLocation: {
                setIsDialogOpen(true);
                return;
            }
        }
    };

    /**
     * Handles creating the selection map tool
     */
    const handleSelectionTool = useCallback(
        (tool: 'point' | 'multipoint' | 'polyline' | 'polygon' | 'rectangle' | 'circle') => {
            sketchViewModel.on('create', async (e) => {
                if (e.state === 'complete') {
                    const geometry = e.graphic.geometry;
                    setQueryGeometry(geometry);
                    sketchViewModel.layer.remove(e.graphic);
                }
            });

            sketchViewModel.create(tool);
        },
        [selectedLayer, view]
    );

    /**
     * Returns the selected tool title based on the operation value
     * @param operation The selection operation
     * @param isLoading Loading icon if the operation is currently active.
     */
    const getToolTitle = (operation?: SelectionOperation, isLoading?: boolean): string => {
        if (isLoading) {
            return 'Loading...';
        }
        switch (operation) {
            case SelectionOperation.ByLocation:
                return 'Select by Location';
            case SelectionOperation.Rectangle:
                return 'Select by Rectangle';
            case SelectionOperation.Cursor:
            default:
                return 'Default Selection Cursor';
        }
    };

    /**
     * Returns the selected icon based on the operation value
     * @param operation The selection operation
     * @param isLoading Loading icon if the operation is currently active.
     */
    const getSelectedIcon = (operation?: SelectionOperation, isLoading?: boolean): JSX.Element => {
        if (isLoading) {
            return <SpinnerIcon className={classes.rotateIcon} size={16} />;
        }
        switch (operation) {
            case SelectionOperation.ByLocation:
                return <CursorSelectionIcon size={16} />;
            case SelectionOperation.Rectangle:
                return <CursorMarqueeIcon size={16} />;
            case SelectionOperation.Cursor:
            default:
                return <SelectIcon size={16} />;
        }
    };

    /**
     * Selects a menu item
     * @param operation
     */
    const selectMenuItem = (operation: SelectionOperation) => {
        setIsDialogOpen(operation === SelectionOperation.ByLocation);
        setOperation(operation);
        setAnchorEl(null);
    };

    /**
     * Provides a custom rendered title to show the number of items selected.
     */
    const customListItemRenderer = useCallback(
        (layer: Layer, defaultText: string) => {
            return selectionLayer === layer && featureSelection.length > 0
                ? `${defaultText} (${featureSelection.length} Selected)  `
                : defaultText;
        },
        [selectionLayer, featureSelection]
    );

    /**
     * Handle the close operation for select by location and executes the selection operation.
     */
    const handleSelectByLocationClose = useCallback(
        (params: SelectByLocationParams) => {
            setIsDialogOpen(false);
            if (view && params && params.targetLayer && params.spatialLayer) {
                const selectionIds = params.spatialLayer === selectionLayer ? featureSelection : undefined;

                setIsLoading(true);

                selectByLocationAsync(params.op, params.targetLayer, params.spatialLayer, selectionIds)
                    .then((ids) => {
                        setIsLoading(false);
                        setSelectionData(view, params.targetLayer, ids ?? [], SelectionMode.NewSelectionSet);
                    })
                    .catch((error) => {
                        setIsLoading(false);
                        LogHelper.log(error.message, true);
                        enqueueSnackbar(error.message, { variant: 'error' });
                    });
            }
        },
        [selectionLayer, featureSelection, view]
    );

    /**
     * Handle select by rectangle; prevents cursor from disappearing when selecting from the menu item list
     */
    const handleRectangleSelect = () => {
        handleSelection(SelectionOperation.Rectangle);
        selectMenuItem(SelectionOperation.Rectangle);
    };

    return (
        <>
            <LayerSelect
                map={map}
                customListItemRenderer={customListItemRenderer}
                required={false}
                title={selectedLayer?.title ?? ''}
                selectedLayer={selectedLayer}
                layerTypeFilter={isLayerSelectable}
                onChange={(layer) => setSelectedLayer(layer as SelectableLayer)}
            />

            <ButtonGroup variant='outlined' color='primary' disabled={isLoading}>
                <Button onClick={() => handleSelection(operation)} title={getToolTitle(operation, isLoading)}>
                    {getSelectedIcon(operation, isLoading)}
                </Button>
                <Button color='primary' size='small' onClick={handleMenuClick}>
                    <CaretDownIcon size={16} />
                </Button>
            </ButtonGroup>

            <Menu
                open={openMenu}
                anchorEl={anchorEl}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                onClose={handleMenuClose}
            >
                <MenuItem
                    selected={operation === SelectionOperation.Cursor}
                    onClick={() => selectMenuItem(SelectionOperation.Cursor)}
                >
                    <ListItemIcon>{getSelectedIcon(SelectionOperation.Cursor)}</ListItemIcon>
                    <ListItemText>Select by Cursor</ListItemText>
                </MenuItem>

                <MenuItem selected={operation === SelectionOperation.Rectangle} onClick={handleRectangleSelect}>
                    <ListItemIcon>{getSelectedIcon(SelectionOperation.Rectangle)}</ListItemIcon>
                    <ListItemText>Select by Rectangle</ListItemText>
                </MenuItem>

                <MenuItem
                    selected={operation === SelectionOperation.ByLocation}
                    onClick={() => selectMenuItem(SelectionOperation.ByLocation)}
                >
                    <ListItemIcon>{getSelectedIcon(SelectionOperation.ByLocation)}</ListItemIcon>
                    <ListItemText>Select by Location</ListItemText>
                </MenuItem>
            </Menu>

            {isDialogOpen && operation === SelectionOperation.ByLocation && (
                <SelectByLocationDialog
                    map={map as WebMap | WebScene}
                    handleCancel={() => setIsDialogOpen(false)}
                    handleClose={handleSelectByLocationClose}
                    selectionLayer={selectedLayer}
                    spatialLayer={selectedLayer?.type !== 'imagery' ? selectedLayer : undefined}
                />
            )}
        </>
    );
};

export default SelectionMenu;
