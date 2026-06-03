import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    InputAdornment,
    MenuItem,
} from '@mui/material';
import { InputField } from '../../../common';
import { RightButton } from '../../../layout/styles';
import Layer from '@arcgis/core/layers/Layer';
import SceneLayer = __esri.SceneLayer;
import FeatureLayer = __esri.FeatureLayer;
import OGCFeatureLayer = __esri.OGCFeatureLayer;
import CSVLayer = __esri.CSVLayer;
import GeoJSONLayer = __esri.GeoJSONLayer;
import Field = __esri.Field;
import XIcon from 'calcite-ui-icons-react/XIcon';
import GeoJSONLayerElevationInfo = __esri.GeoJSONLayerElevationInfo;
import FeatureLayerElevationInfo = __esri.FeatureLayerElevationInfo;
import CSVLayerElevationInfo = __esri.CSVLayerElevationInfo;
import OGCFeatureLayerElevationInfo = __esri.OGCFeatureLayerElevationInfo;

/**
 * Union type for ElevationInfo supported layer
 */
type ElevationInfoLayer = FeatureLayer | SceneLayer | GeoJSONLayer | CSVLayer | OGCFeatureLayer;

/**
 * Union type for ElevationInfo object
 */
type ElevationInfo =
    | FeatureLayerElevationInfo
    | GeoJSONLayerElevationInfo
    | CSVLayerElevationInfo
    | OGCFeatureLayerElevationInfo;

/**
 * Interface to handle callback and input data coming from
 * where the modal dialog is initialized.
 */
interface ElevationOptionsDialogProps {
    handleClose: (elevationInfo: any) => void;
    handleCancel: () => void;
    layer: Layer;
}

type verticalUnitType = 'feet' | 'meters' | 'kilometers' | 'miles' | 'us-feet' | 'yards';

/**
 * Modal Dialog for getting a URL input from the user.
 * @param props RenameLayerDialogProps
 * @constructor
 */
export default function ElevationOptionsDialog(props: ElevationOptionsDialogProps): JSX.Element {
    const [open] = useState<boolean>(true);

    const units: string[] = ['feet', 'meters', 'kilometers', 'miles', 'us-feet', 'yards'];

    const [offset, setOffset] = useState<number>();
    const [unit, setUnit] = useState<verticalUnitType>();
    const [featureExpressionInfo, setFeatureExpressionInfo] = useState<string>('');

    const { handleClose, handleCancel, layer } = props;

    useEffect(() => {
        const elevationInfoLayer = layer as ElevationInfoLayer;
        if (elevationInfoLayer) {
            const elevationInfo = elevationInfoLayer.elevationInfo;

            //the ElevationInfoLayer type layers (FeatureLayer, SceneLayer, GeoJSONLayer, CSVLayer, OGCFeatureLayer) can all be cast as a FeatureLayer
            //which will then contain a featureExpressionInfo object
            const featureLayer = elevationInfoLayer as FeatureLayer;
            if (featureLayer) {
                const expr = featureLayer.elevationInfo?.featureExpressionInfo?.expression;
                if (expr) {
                    setFeatureExpressionInfo(expr);
                }
            }

            if (elevationInfo.offset) {
                setOffset(elevationInfo.offset);
            }

            if (elevationInfo.unit) {
                setUnit(elevationInfo.unit as verticalUnitType);
            }
        }
    }, [layer]);

    const handleCancelClick = () => {
        handleCancel();
    };

    const cloneElevationInfo = (elevationInfo: ElevationInfo): ElevationInfo | undefined => {
        if (!elevationInfo) {
            return undefined;
        }

        const newElevationInfo = {
            mode: elevationInfo.mode,
            unit: elevationInfo.unit,
            offset: elevationInfo.offset,
        } as ElevationInfo;

        if (elevationInfo.featureExpressionInfo) {
            newElevationInfo.featureExpressionInfo = {
                expression: elevationInfo.featureExpressionInfo.expression,
            };
        }
        return newElevationInfo;
    };

    const handleApplyClicked = () => {
        const elevationInfoLayer = layer as ElevationInfoLayer;

        // There may be an error with toJSON() here, so we will make our own copy of the elevationInfo object
        const elevationInfo = cloneElevationInfo(elevationInfoLayer.elevationInfo);

        if (elevationInfo) {
            elevationInfo.featureExpressionInfo = {
                expression: featureExpressionInfo,
            };

            if (unit) {
                elevationInfo.unit = unit;
            }

            if (offset) {
                elevationInfo.offset = offset;
            }

            handleClose(elevationInfo);
        }
    };

    const handleFeatureExpressionChange = (event: any) => {
        setFeatureExpressionInfo(event.target.value);
    };

    return (
        <Dialog open={open} onClose={handleClose} aria-labelledby='form-dialog-title'>
            <DialogTitle id='form-dialog-title'>Elevation Options</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    You can set an optional Arcade Z Feature expression to customize how features are displayed. For
                    instance, a feature&apos;s height above ground can be based on a field value. This is used only for
                    display purposes and does not modify the data.
                </DialogContentText>

                <InputField
                    fullWidth
                    color='secondary'
                    variant='outlined'
                    size='small'
                    multiline
                    rows={3}
                    title={'Elevation Feature Z Expression'}
                    placeholder='Example: Geometry($feature).z + $feature.HEIGHT'
                    value={featureExpressionInfo}
                    onChange={handleFeatureExpressionChange}
                    helperText={'Feature Z Expression'}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position='end'>
                                <IconButton
                                    onClick={() => {
                                        setFeatureExpressionInfo('');
                                    }}
                                    disabled={!featureExpressionInfo}
                                >
                                    <XIcon size={16} />
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                <InputField
                    title={'Elevation Unit'}
                    select
                    fullWidth
                    size='small'
                    color='secondary'
                    variant='outlined'
                    defaultValue={'meters'}
                    helperText={'Unit'}
                    onChange={(evt) => {
                        setUnit(evt.target.value as verticalUnitType);
                    }}
                    value={unit ?? 'meters'}
                >
                    {units.map((choice) => {
                        return (
                            <MenuItem key={choice} value={choice}>
                                {choice}
                            </MenuItem>
                        );
                    })}
                </InputField>

                <DialogContentText>
                    You can choose a layer field below to create a simple Feature Z expression. Please ensure that the
                    Unit listed above matches the field&apos;s unit of length.
                </DialogContentText>

                <InputField
                    select
                    fullWidth
                    title={
                        'You can choose a layer field below to create a simple Feature Z expression.\n' +
                        "Please ensure that the Unit listed above matches the field's unit of length."
                    }
                    size='small'
                    color='secondary'
                    variant='outlined'
                    defaultValue={'#'}
                    onChange={(e) => {
                        if (e.target.value !== '#') {
                            const elevationLayer = layer as ElevationInfoLayer;
                            const field = elevationLayer.fieldsIndex.get(e.target.value);
                            if (field) {
                                const numberValue = `Number($feature['${e.target.value}'])`;
                                const expressionInfo =
                                    field.type === 'string'
                                        ? `var elevation = ${numberValue};\nIIf( !IsNaN(elevation), elevation, 0 );`
                                        : numberValue;

                                setFeatureExpressionInfo(expressionInfo);
                            }
                        }
                    }}
                >
                    <MenuItem key='#' value='#'>
                        Select a Field (Optional)
                    </MenuItem>
                    {(layer as FeatureLayer)?.fields
                        ?.filter(
                            (field) =>
                                field.type === 'string' ||
                                field.type === 'long' ||
                                field.type === 'integer' ||
                                field.type === 'small-integer' ||
                                field.type === 'single' ||
                                field.type === 'double'
                        )
                        .map((field: Field) => {
                            return (
                                <MenuItem key={field.name} value={field.name}>
                                    {field.name}
                                </MenuItem>
                            );
                        })}
                </InputField>
            </DialogContent>
            <DialogActions>
                <RightButton title='Cancel' variant='contained' color='primary' onClick={handleCancelClick}>
                    Cancel
                </RightButton>
                <RightButton title='Apply' variant='contained' color='secondary' onClick={handleApplyClicked}>
                    Apply
                </RightButton>
            </DialogActions>
        </Dialog>
    );
}
