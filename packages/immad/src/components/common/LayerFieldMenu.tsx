import React, { useState } from 'react';
import { IconButton, ListItemText, Menu, MenuItem } from '@mui/material';
import CaretDownIcon from 'calcite-ui-icons-react/CaretDownIcon';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import PointCloudLayer = __esri.PointCloudLayer;
import OGCFeatureLayer = __esri.OGCFeatureLayer;
import GeoJSONLayer = __esri.GeoJSONLayer;
import CSVLayer = __esri.CSVLayer;
import SceneLayer = __esri.SceneLayer;
import StreamLayer = __esri.StreamLayer;
import WFSLayer = __esri.WFSLayer;
import Field = __esri.Field;
import Sublayer = __esri.Sublayer;

type FieldIndexLayer =
    | FeatureLayer
    | CSVLayer
    | GeoJSONLayer
    | OGCFeatureLayer
    | PointCloudLayer
    | SceneLayer
    | StreamLayer
    | WFSLayer
    | Sublayer;

export default function LayerFieldMenu(props: {
    layer: FieldIndexLayer;
    handleFieldSelected: (field: Field) => void;
}): JSX.Element {
    const { layer, handleFieldSelected } = props;

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const menuOpen = Boolean(anchorEl);

    const handleMenuItemSelected = (fieldName: string) => {
        const field = layer.fieldsIndex.get(fieldName);
        handleFieldSelected(field);
        setAnchorEl(null);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <IconButton
                onClick={(e) => {
                    setAnchorEl(e.currentTarget);
                }}
            >
                <CaretDownIcon size={16} />
            </IconButton>
            <Menu open={menuOpen} anchorEl={anchorEl} onClose={handleClose}>
                {layer.fields.map((field: Field) => {
                    return (
                        <MenuItem
                            key={field.name}
                            onClick={() => handleMenuItemSelected(field.name)}
                            value={field.name}
                        >
                            <ListItemText primary={field.name} />
                        </MenuItem>
                    );
                })}
            </Menu>
        </>
    );
}
