import React, { useEffect, useState } from 'react';
import { InputField } from '../../common/styles';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, MenuItem } from '@mui/material';
import { RMTQueryMetadata } from './AdminSettingsSlice';

/* Props for the CreateRMTTypesDialog */
export interface CreateRMTTypesDialogProps {
    onCancel: () => void;
    onApply: (messageType: string) => void;
    rmtMessageTypes: string[];
    /* forward looking parameter to later support updating existing RMT data*/
    currentPositionOnPage?: number;
    /* forward looking parameter to later support updating existing RMT data*/
    rmtMessageAndCodeTypes?: RMTQueryMetadata[];
}

/** Widget supporting the UI for defining RMT message types and code types */
export default function CreateRMTTypesDialog(props: CreateRMTTypesDialogProps): JSX.Element {
    const { onCancel, onApply, rmtMessageTypes } = props;
    const [selectedMessageType, setSelectedMessageType] = useState<string>('');
    const [contentText] = useState('Select the RMT Message type');
    const [errorText, setErrorText] = useState('Required: RMT message type.');
    const [hasError, setHasError] = useState(true);

    useEffect(() => {
        if (selectedMessageType) {
            setErrorText('');
            setHasError(false);
        }
    }, [selectedMessageType]);

    /**
     * Handle the cancel button click
     */
    const handleCancelClicked = () => {
        onCancel();
    };

    /**
     * Handle the apply button click
     */
    const handleApplyClicked = () => {
        onApply(selectedMessageType);
    };

    const rmtMessageTypeChanged = (event: any) => {
        setSelectedMessageType(event.target.value);
    };

    return (
        <Dialog open={true} aria-labelledby='form-dialog-title'>
            <DialogTitle id='form-dialog-title'>Add New RMT Type</DialogTitle>
            <DialogContent>
                <DialogContentText>{contentText}</DialogContentText>
                <InputField
                    fullWidth
                    variant='outlined'
                    color='secondary'
                    select
                    required
                    error={''}
                    value={selectedMessageType}
                    onChange={rmtMessageTypeChanged}
                    helperText={errorText}
                >
                    {rmtMessageTypes.map((code: string) => (
                        <MenuItem key={code} value={code}>
                            {code}
                        </MenuItem>
                    ))}
                </InputField>
            </DialogContent>
            <DialogActions>
                <Button title='Cancel' variant='contained' color='primary' onClick={handleCancelClicked}>
                    Cancel
                </Button>
                <Button
                    title='Apply'
                    variant='contained'
                    disabled={hasError}
                    color='secondary'
                    onClick={handleApplyClicked}
                >
                    Apply
                </Button>
            </DialogActions>
        </Dialog>
    );
}
