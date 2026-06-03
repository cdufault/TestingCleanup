import React, { useRef, useState } from 'react';
import { DialogContent, DialogTitle, Fade } from '@mui/material';
import { RightButton } from '../layout/styles';
import { StyledWidgetModalDialog, StyledDialogActions } from './style';
import Typography from '@mui/material/Typography';

/**
 * Interface to handle callback and input data coming from
 * where the modal dialog is initialized.
 */
interface MessageDialogProps {
    handleClose: (closeValue: boolean) => void;
    open: boolean;
    dialogTitle: string;
    dialogMessage: string;
}

/**
 * Modal Dialog for getting a URL input from the user.
 * @param props UrlInputDialogProps
 * @constructor
 */
export default function MessageDialog(props: MessageDialogProps): JSX.Element {
    const [open] = useState<boolean>(props.open);
    const { handleClose } = props;

    const dialogTitle = useRef<string>(props.dialogTitle);
    const dialogMessage = useRef<string>(props.dialogMessage);

    function handleOkClicked() {
        handleClose(false);
    }

    return (
        <StyledWidgetModalDialog
            open={open}
            disableBackdropClick
            aria-labelledby='form-dialog-title'
            maxWidth='sm'
            fullWidth={true}
        >
            <Fade in={open} timeout={500}>
                <div>
                    <DialogTitle id='form-dialog-title'>{dialogTitle.current}</DialogTitle>
                    <DialogContent dividers>
                        <Typography>{dialogMessage.current}</Typography>
                    </DialogContent>
                    <StyledDialogActions>
                        <RightButton variant='contained' color='secondary' onClick={handleOkClicked}>
                            OK
                        </RightButton>
                    </StyledDialogActions>
                </div>
            </Fade>
        </StyledWidgetModalDialog>
    );
}
