import React, { useCallback, useEffect, useState } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControlLabel,
    IconButton,
    MenuItem,
    Stack,
    Switch,
    TextField,
} from '@mui/material';
import { FieldGroup } from '../../../common';
import { RightButton } from '../../../layout/styles';
import FeatureLayer = __esri.FeatureLayer;
import GeoJSONLayer = __esri.GeoJSONLayer;
import CSVLayer = __esri.CSVLayer;
import OGCFeatureLayer = __esri.OGCFeatureLayer;
import StreamLayer = __esri.StreamLayer;
import WFSLayer = __esri.WFSLayer;
import SceneLayer = __esri.SceneLayer;
import Sublayer from '@arcgis/core/layers/support/Sublayer';
import Layer = __esri.Layer;
import LabelClass from '@arcgis/core/layers/support/LabelClass';
import XIcon from 'calcite-ui-icons-react/XIcon';
import { WidgetDialogActions } from '../styles';
import Color from '@arcgis/core/Color';
import TextSymbol from '@arcgis/core/symbols/TextSymbol';
import Font from '@arcgis/core/symbols/Font';
import LayerFieldMenu from '../../../common/LayerFieldMenu';
import Field = __esri.Field;

export type LabelsSupportedLayer =
    | FeatureLayer
    | CSVLayer
    | GeoJSONLayer
    | OGCFeatureLayer
    | Sublayer
    | StreamLayer
    | SceneLayer
    | WFSLayer;

/**
 * Interface to configure a LabelClass control
 */
interface LabelClassControlProps {
    layer: LabelsSupportedLayer;
    id: number;
    labelClass: LabelClass;
    labelChanged: (labelClass: LabelClass, index: number) => void;
    deleteLabel: (index: number) => void;
}

/**
 * Represents a single LabelClass object
 * @param props Input props, including the Layer and LabelClass JSAPI object.
 * @constructor
 */
function LabelClassControl(props: LabelClassControlProps): JSX.Element {
    const { layer, id, labelClass, labelChanged, deleteLabel } = props;

    // Placement options based on geometry type
    const POINT_LABEL_PLACEMENT = [
        'above-center',
        'above-left',
        'above-right',
        'below-center',
        'below-left',
        'below-right',
        'center-center',
        'center-left',
        'center-right',
    ];

    const POLYLINE_LABEL_PLACEMENT = [
        'above-along',
        'below-along',
        'center-along',
        'above-after',
        'above-before',
        'above-start',
        'above-end',
        'below-after',
        'below-before',
        'below-start',
        'below-end',
        'center-after',
        'center-before',
        'center-start',
        'center-end',
    ];

    const POLYGON_LABEL_PLACEMENT = ['always-horizontal'];

    // Determine geometry type and appropriate placement options
    const getPlacementOptions = (): string[] => {
        const geometryType = (layer as any).geometryType;
        if (geometryType === 'point' || geometryType === 'multipoint') {
            return POINT_LABEL_PLACEMENT;
        } else if (geometryType === 'polyline') {
            return POLYLINE_LABEL_PLACEMENT;
        } else if (geometryType === 'polygon') {
            return POLYGON_LABEL_PLACEMENT;
        }
        return POINT_LABEL_PLACEMENT; // fallback
    };

    const placementOptions = getPlacementOptions();

    // Get safe default placement that works in both 2D and 3D
    const getSafeDefaultPlacement = (): string => {
        const geometryType = (layer as any).geometryType;
        // Use center-center for points (works in both 2D and 3D)
        if (geometryType === 'point' || geometryType === 'multipoint') {
            return 'center-center';
        } else if (geometryType === 'polyline') {
            return 'center-along';
        } else {
            return 'always-horizontal';
        }
    };

    // Extract current values from labelClass
    const currentExpression = labelClass.labelExpressionInfo?.expression || '';
    const currentColor = labelClass.symbol?.color?.toHex() || '#FFFFFF';
    const currentHaloColor = (labelClass.symbol as TextSymbol)?.haloColor?.toHex() || '#000000';
    const currentHaloSize = (labelClass.symbol as TextSymbol)?.haloSize || 1;
    const currentFontSize = (labelClass.symbol as TextSymbol)?.font?.size || 10;
    const currentWhere = labelClass.where || '';
    const currentPlacement = labelClass.labelPlacement || getSafeDefaultPlacement();

    // Local state for immediate UI updates
    const [expression, setExpression] = useState<string>(currentExpression);
    const [color, setColor] = useState<string>(currentColor);
    const [haloColor, setHaloColor] = useState<string>(currentHaloColor);
    const [haloSize, setHaloSize] = useState<number>(currentHaloSize);
    const [fontSize, setFontSize] = useState<number>(currentFontSize);
    const [where, setWhere] = useState<string>(currentWhere);
    const [labelPlacement, setLabelPlacement] = useState<string>(currentPlacement);

    const labelPlacementSelect = (
        <TextField
            select
            sx={{ minWidth: '130px' }}
            label={'Placement'}
            value={labelPlacement}
            onChange={(e) => setLabelPlacement(e.target.value)}
            size='small'
        >
            {placementOptions.map((placement: string) => (
                <MenuItem key={placement} value={placement}>
                    {placement}
                </MenuItem>
            ))}
        </TextField>
    );

    // Update parent when any value changes
    useEffect(() => {
        // Create TextSymbol that works in both 2D and 3D
        // Use TextSymbol (not LabelSymbol3D) for maximum compatibility
        const symbol = new TextSymbol({
            color: Color.fromString(color),
            haloColor: Color.fromString(haloColor),
            haloSize: haloSize,
            font: new Font({
                size: fontSize,
                family: 'Arial',
                weight: 'bold',
            }),
        });

        // Create new LabelClass with proper structure
        const updatedLabelClass = new LabelClass({
            // Use labelExpressionInfo for FeatureLayer (Arcade syntax)
            labelExpressionInfo: {
                expression: expression || '$feature.OBJECTID', // Default to OBJECTID if empty
            },
            symbol: symbol,
            labelPlacement: labelPlacement as any,
            where: where || undefined,
            // Optional but recommended properties
            deconflictionStrategy: 'static', // or 'none' if you want all labels to show
            minScale: 0,
            maxScale: 0,
        });

        labelChanged(updatedLabelClass, id);
    }, [expression, labelPlacement, where, color, haloColor, haloSize, fontSize, id, labelChanged]);

    return (
        <Box
            sx={{
                padding: '1rem',
                border: 1,
                borderColor: 'primary.light',
                borderRadius: '4px',
            }}
        >
            <Stack direction='column' spacing={2}>
                {/* Expression Row */}
                <Stack direction='row' spacing={1} alignItems='flex-start'>
                    <TextField
                        size='small'
                        multiline
                        fullWidth
                        label='Arcade Expression'
                        helperText='Use $feature.FIELD_NAME syntax'
                        InputProps={{
                            endAdornment: (
                                <LayerFieldMenu
                                    layer={layer}
                                    handleFieldSelected={(field: Field) =>
                                        setExpression((expr) => expr + ` $feature.${field.name}`)
                                    }
                                />
                            ),
                        }}
                        onChange={(e) => setExpression(e.target.value)}
                        value={expression}
                    />

                    <IconButton onClick={() => deleteLabel(id)} size='small' color='error'>
                        <XIcon />
                    </IconButton>
                </Stack>

                {/* Symbol Properties Row */}
                <Stack direction='row' spacing={1} alignItems='center'>
                    <TextField
                        type='color'
                        size='small'
                        label='Text Color'
                        value={color}
                        style={{ width: '120px' }}
                        onChange={(e) => setColor(e.target.value)}
                    />

                    <TextField
                        type='color'
                        size='small'
                        label='Halo Color'
                        value={haloColor}
                        style={{ width: '120px' }}
                        onChange={(e) => setHaloColor(e.target.value)}
                    />

                    <TextField
                        type='number'
                        size='small'
                        label='Halo Size'
                        value={haloSize}
                        inputProps={{ min: 0, max: 5, step: 0.5 }}
                        style={{ width: '100px' }}
                        onChange={(e) => setHaloSize(parseFloat(e.target.value) || 1)}
                    />

                    <TextField
                        type='number'
                        size='small'
                        label='Font Size'
                        value={fontSize}
                        inputProps={{ min: 6, max: 36 }}
                        style={{ width: '100px' }}
                        onChange={(e) => setFontSize(parseInt(e.target.value) || 10)}
                    />
                </Stack>

                {/* Filter and Placement Row */}
                <Stack direction='row' spacing={1} alignItems='center'>
                    <TextField
                        fullWidth
                        size='small'
                        label='Filter (SQL WHERE clause)'
                        placeholder='e.g., STATE = "CA" OR POPULATION > 100000'
                        onChange={(e) => setWhere(e.target.value)}
                        value={where}
                        InputProps={{
                            endAdornment: (
                                <LayerFieldMenu
                                    layer={layer}
                                    handleFieldSelected={(field: Field) => setWhere((expr) => expr + ` ${field.name} `)}
                                />
                            ),
                        }}
                    />

                    {labelPlacementSelect}
                </Stack>
            </Stack>
        </Box>
    );
}

/**
 * Interface to handle callback and input data coming from
 * where the modal dialog is initialized.
 */
interface LabelConfigDialogProps {
    handleClose: () => void;
    handleCancel: () => void;
    layer: Layer;
}

/**
 * Modal Dialog for configuring labels on a Feature Layer.
 * Creates proper LabelClass objects with Arcade expressions and TextSymbol properties.
 * @param props LabelConfigDialogProps
 * @constructor
 */
export default function LabelConfigDialog(props: LabelConfigDialogProps): JSX.Element {
    const { handleClose, handleCancel, layer } = props;

    const labelsLayer = layer as LabelsSupportedLayer;

    const [open] = useState<boolean>(true);

    // Clone the existing labelingInfo to avoid mutating the original
    const [labelsVisible, setLabelsVisible] = useState<boolean>(labelsLayer.labelsVisible ?? false);
    const [labelingInfo, setLabelingInfo] = useState<LabelClass[]>(
        labelsLayer.labelingInfo ? labelsLayer.labelingInfo.map((lc) => lc.clone()) : []
    );

    const handleCancelClick = () => {
        handleCancel();
    };

    const handleApplyClicked = useCallback(() => {
        // Apply the label configuration to the layer
        labelsLayer.labelsVisible = labelsVisible;
        labelsLayer.labelingInfo = labelingInfo.map((lc) => lc.clone()); // Clone to ensure proper objects
        handleClose();
    }, [labelsVisible, labelingInfo, labelsLayer, handleClose]);

    const addLabelClass = () => {
        // Determine default field based on layer
        const defaultField = labelsLayer.objectIdField || 'OBJECTID';

        // Determine safe default placement that works in both 2D and 3D
        const geometryType = (labelsLayer as any).geometryType;
        let defaultPlacement: string;
        if (geometryType === 'point' || geometryType === 'multipoint') {
            // center-center works reliably in both 2D and 3D
            defaultPlacement = 'center-center';
        } else if (geometryType === 'polyline') {
            // center-along works in both 2D and 3D
            defaultPlacement = 'center-along';
        } else {
            // always-horizontal for polygons
            defaultPlacement = 'always-horizontal';
        }

        const newLabelClass = new LabelClass({
            labelExpressionInfo: {
                expression: `$feature.${defaultField}`,
            },
            symbol: new TextSymbol({
                color: Color.fromString('#FFFFFF'),
                haloColor: Color.fromString('#000000'),
                haloSize: 1,
                font: new Font({
                    size: 10,
                    family: 'Arial',
                    weight: 'bold',
                }),
            }),
            labelPlacement: defaultPlacement as any,
            deconflictionStrategy: 'static',
            minScale: 0,
            maxScale: 0,
        });

        setLabelingInfo((prev) => [...prev, newLabelClass]);
    };

    const handleLabelChanged = (labelClass: LabelClass, index: number) => {
        // Properly update the array immutably for React
        setLabelingInfo((prev) => {
            const updated = [...prev];
            updated[index] = labelClass;
            return updated;
        });
    };

    const removeLabelClass = (index: number) => {
        setLabelingInfo((prev) => {
            const updated = [...prev];
            updated.splice(index, 1);
            return updated;
        });
    };

    return (
        <Dialog open={open} aria-labelledby='form-dialog-title' maxWidth='md' fullWidth>
            <DialogTitle id='form-dialog-title'>Feature Labels Configuration</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Configure labels using Arcade expressions ($feature.FIELD_NAME syntax). Labels support text styling,
                    halo effects, placement options, and SQL filtering. 3D SceneViews only display one label per feature
                    (the first matching LabelClass).
                </DialogContentText>

                <FieldGroup>
                    <FormControlLabel
                        label={'Enable Labels'}
                        control={
                            <Switch
                                inputProps={{ 'aria-label': 'Enable Labels' }}
                                checked={labelsVisible}
                                onChange={(e) => setLabelsVisible(e.target.checked)}
                            />
                        }
                    />
                </FieldGroup>

                {labelsVisible && (
                    <>
                        <Stack direction='column' spacing={2} sx={{ mt: 2 }}>
                            {labelingInfo.map((item, index) => (
                                <LabelClassControl
                                    layer={labelsLayer}
                                    id={index}
                                    key={`label-${index}`}
                                    labelClass={item}
                                    labelChanged={handleLabelChanged}
                                    deleteLabel={removeLabelClass}
                                />
                            ))}
                        </Stack>

                        <Button
                            title='Add Label Class'
                            variant='outlined'
                            color='primary'
                            onClick={addLabelClass}
                            sx={{ mt: 2 }}
                        >
                            Add Label Class
                        </Button>
                    </>
                )}
            </DialogContent>
            <WidgetDialogActions>
                <RightButton title='Cancel' variant='contained' color='primary' onClick={handleCancelClick}>
                    Cancel
                </RightButton>
                <RightButton title='Apply' variant='contained' color='secondary' onClick={handleApplyClicked}>
                    Apply
                </RightButton>
            </WidgetDialogActions>
        </Dialog>
    );
}
