import React from 'react';

import { DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material';
import { ActionButton } from '../../common';
import { StyledBackdrop, StyledDialog } from '../styles';

interface ConfirmDialogProps {
    onClose: (value: boolean) => void;
    open: boolean;
    message: string;
    container?: HTMLElement | null;
    title?: string;
}

const ConfirmDialog = (props: ConfirmDialogProps): JSX.Element => {
    const { onClose, open, message, title, container } = props;

    const handleCancel = () => {
        onClose(false);
    };
    const handleOk = () => {
        onClose(true);
    };

    return (
        <StyledDialog open={open} container={container} BackdropComponent={StyledBackdrop}>
            {title && <DialogTitle>{title}</DialogTitle>}
            <DialogContent>
                <Typography>{message}</Typography>
            </DialogContent>
            <DialogActions>
                <ActionButton color='secondary' variant='contained' onClick={handleOk}>
                    Yes
                </ActionButton>
                <ActionButton color='secondary' variant='contained' onClick={handleCancel}>
                    No
                </ActionButton>
            </DialogActions>
        </StyledDialog>
    );
};
export default ConfirmDialog;
