import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import { StyledTextButton } from '../../../styles';

function ErrorDialog(props: { errors: string[]; handleClose: () => void; open: boolean }): JSX.Element {
    const { errors, handleClose, open } = props;

    function formatErrors() {
        if (errors && errors.length > 0) {
            return errors.join(' -- ');
        } else {
            return '';
        }
    }
    return (
        <Dialog onClose={handleClose} open={open}>
            <DialogTitle>{errors.length > 1 ? 'These items are required:' : 'This item is required:'} </DialogTitle>
            <DialogContent>{<DialogContentText>{formatErrors()}</DialogContentText>}</DialogContent>
            <DialogActions>
                <StyledTextButton variant={'contained'} onClick={handleClose}>
                    OKAY
                </StyledTextButton>
            </DialogActions>
        </Dialog>
    );
}

export default ErrorDialog;
