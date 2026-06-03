import React, { ChangeEvent, useEffect, useState } from 'react';
import { DialogContent, DialogTitle, Fade, IconButton, InputAdornment } from '@mui/material';
import XIcon from 'calcite-ui-icons-react/XIcon';
import { InputField } from '../../../common';
import { WidgetDialogActions, WidgetModalDialog } from '../styles';
import { RightButton } from '../../../layout/styles';

/**
 * Interface to handle callback and input data coming from
 * where the modal dialog is initialized.
 */
interface RenameLayerDialogProps {
    handleClose: (url: string) => void;
    handleCancel: (url: string) => void;
    name: string;
}

/**
 * Modal Dialog for getting a URL input from the user.
 * @param props RenameLayerDialogProps
 * @constructor
 */
export default function RenameLayerDialog(props: RenameLayerDialogProps): JSX.Element {
    const [open] = useState<boolean>(true);
    const [name, setName] = useState(props.name);
    const [errorHelperText, setErrorHelperText] = useState<string>('');
    const [hasError, setHasError] = useState<boolean>(false);
    const [hasValidName, setHasValidName] = useState<boolean>(true);
    const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

    const { handleClose } = props;
    const { handleCancel } = props;

    useEffect(() => {
        if (name) {
            setIsInitialLoad(false);
        }
    }, []);

    const handleLoadClicked = () => {
        handleClose(name);
    };

    const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (isInitialLoad) {
            setIsInitialLoad(false);
        }
        setName(event.target.value);
        setHasValidName(isName(event.target.value));
    };
    const handleClearName = () => {
        setName('');
    };

    const handleCancelClick = () => {
        handleClearName();
        handleCancel('');
    };

    useEffect(() => {
        if (!hasValidName) {
            setErrorHelperText('Invalid Name');
            setHasError(true);
        } else {
            setErrorHelperText('');
            setHasError(false);
        }
    }, [hasValidName]);

    function isName(strValue: string) {
        //check to make sure name is not blank
        if (strValue) {
            return true;
        } else {
            setHasValidName(false);
            return false;
        }
    }

    return (
        <WidgetModalDialog open={open} aria-labelledby='form-dialog-title'>
            <Fade in={open} timeout={500}>
                <div>
                    <DialogTitle id='form-dialog-title'>New layer name</DialogTitle>
                    <DialogContent>
                        <InputField
                            variant='outlined'
                            placeholder='New layer name'
                            fullWidth
                            size='small'
                            color='secondary'
                            value={name}
                            onChange={handleNameChange}
                            error={hasError}
                            helperText={errorHelperText}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position='end'>
                                        <IconButton onClick={handleClearName} disabled={name.length === 0}>
                                            <XIcon size={16} />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <WidgetDialogActions>
                            <RightButton variant='contained' color='primary' onClick={handleCancelClick}>
                                Cancel
                            </RightButton>
                            <RightButton
                                variant='contained'
                                color='secondary'
                                disabled={hasError || isInitialLoad}
                                onClick={handleLoadClicked}
                            >
                                Rename
                            </RightButton>
                        </WidgetDialogActions>
                    </DialogContent>
                </div>
            </Fade>
        </WidgetModalDialog>
    );
}
