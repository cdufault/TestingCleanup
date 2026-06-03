import React, { useCallback, useState } from 'react';
import { FieldGroup, InputField, InputLabel } from '../../../common';
import LayerSelect from '../../../common/layerSelect';
import { WidgetDialogActions } from '../../../widgets/layerList/styles';
import { RightButton } from '../../../layout/styles';
import ImageryLayer = __esri.ImageryLayer;
import WebMap = __esri.WebMap;
import WebScene = __esri.WebScene;
import { Dialog, DialogContent, DialogContentText, DialogTitle, MenuItem } from '@mui/material';
import { isLayerSelectable, SelectableLayer, SelectByLocationParams, SpatialRelationship } from './SelectionHelper';
import Layer = __esri.Layer;

/**
 * Represents the supported spatial operations in this tool
 */
const spatialOps: SpatialRelationship[] = [
    'intersects',
    'contains',
    'crosses',
    'envelope-intersects',
    'overlaps',
    'touches',
    'within',
];

/**
 * The props for the Select By Location Dialog.
 */
export interface SelectByLocationDialogProps {
    selectionLayer?: SelectableLayer;
    spatialLayer?: Exclude<SelectableLayer, ImageryLayer>;
    handleClose: (params: SelectByLocationParams) => void;
    handleCancel: () => void;
    map: WebMap | WebScene;
}

/**
 * Modal Dialog for Select by Location
 * @constructor
 */
const SelectByLocationDialog = (props: SelectByLocationDialogProps): JSX.Element => {
    const { handleClose, handleCancel, map } = props;

    const [open, setOpen] = useState<boolean>(true);

    const [selectionLayer, setSelectionLayer] = useState<SelectableLayer | undefined>(props.selectionLayer);

    const [spatialLayer, setSpatialLayer] = useState<Exclude<SelectableLayer, ImageryLayer> | undefined>(
        props.spatialLayer
    );

    const [selectedOp, setSelectedOp] = useState<SpatialRelationship>('intersects');

    const handleSelectClicked = useCallback(() => {
        setOpen(false);
        if (selectionLayer && spatialLayer) {
            handleClose({ op: selectedOp, targetLayer: selectionLayer, spatialLayer: spatialLayer });
        }
    }, [selectionLayer, spatialLayer, selectedOp]);

    return (
        <Dialog open={open} aria-labelledby='form-dialog-title'>
            <DialogTitle id='form-dialog-title'>Select by Location</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Select by Location selects features based on spatial relationships, such as all points within a
                    geometry. If the Spatial Layer has an active selection, then only those features will be evaluated
                    instead of the entire layer.
                </DialogContentText>

                <FieldGroup>
                    <InputLabel>Selection Layer</InputLabel>
                    <LayerSelect
                        map={map}
                        required={true}
                        title={'Selection Result Layer'}
                        layerTypeFilter={isLayerSelectable}
                        selectedLayer={selectionLayer || undefined}
                        onChange={(layer: Layer) => setSelectionLayer(layer as SelectableLayer)}
                    />
                </FieldGroup>

                <FieldGroup>
                    <InputLabel>Select features where the geometry of: </InputLabel>
                    <LayerSelect
                        map={map}
                        required={true}
                        title={'Spatial Layer'}
                        layerTypeFilter={(layer) => layer.type !== 'imagery' && isLayerSelectable(layer)}
                        selectedLayer={spatialLayer || undefined}
                        onChange={(layer: Layer) => setSpatialLayer(layer as Exclude<SelectableLayer, ImageryLayer>)}
                    />
                </FieldGroup>

                <InputField
                    variant='outlined'
                    select
                    fullWidth
                    color='secondary'
                    value={selectedOp}
                    onChange={(e) => {
                        const op = e.target.value as SpatialRelationship;
                        setSelectedOp(op);
                    }}
                >
                    {spatialOps.map((op) => (
                        <MenuItem key={op} value={op}>
                            {op} the Selection Layer's features{' '}
                        </MenuItem>
                    ))}
                </InputField>
            </DialogContent>

            <WidgetDialogActions>
                <RightButton variant='contained' color='primary' onClick={handleCancel}>
                    Cancel
                </RightButton>
                <RightButton
                    variant='contained'
                    color='secondary'
                    disabled={!selectionLayer || !spatialLayer}
                    onClick={handleSelectClicked}
                >
                    Select
                </RightButton>
            </WidgetDialogActions>
        </Dialog>
    );
};

export default SelectByLocationDialog;
