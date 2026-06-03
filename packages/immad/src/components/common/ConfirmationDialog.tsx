import React from 'react';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { StyledTextButton } from '../home/styles';

export interface ConfirmationDialogProps {
    description: string;
    open: boolean;
    title: string;
    onClose?: () => void;
    onSubmit?: () => void;
}

export const ConfirmationDialog = (props: ConfirmationDialogProps): JSX.Element => {
    const { description, open, title, onClose, onSubmit } = props;

    return (
        <Dialog onClose={onClose} open={open}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <DialogContentText>{description}</DialogContentText>
                <DialogActions>
                    <StyledTextButton variant={'outlined'} onClick={onClose}>
                        Cancel
                    </StyledTextButton>
                    <StyledTextButton variant={'contained'} onClick={onSubmit}>
                        Continue
                    </StyledTextButton>
                </DialogActions>
            </DialogContent>
        </Dialog>
    );
};
