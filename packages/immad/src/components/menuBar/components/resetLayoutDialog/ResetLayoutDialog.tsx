import React, { useEffect, useState } from 'react';

import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

import { getMissionLayout, saveUserLayout } from '../../../layout/helpers/LayoutHelper';
import { analystLayout } from '../../../analyst/resources';

import { useSnackbar } from 'notistack';
import { useLayoutContext } from '../../../../contexts/LayoutContext';
import FlexLayout, { IJsonModel, Model } from 'flexlayout-react';
import { StyledDialogButton } from '../../styles';

interface ResetLayoutDialogProperties {
    missionTitle: string | null;
    onClose?: () => void;
}

const ResetLayoutDialog = (props: ResetLayoutDialogProperties): JSX.Element => {
    const { enqueueSnackbar } = useSnackbar();
    const { missionTitle, onClose } = props;

    const { model, setModel, showModal, setShowModal } = useLayoutContext();

    const defaultAnalystLayout = FlexLayout.Model.fromJson(analystLayout);

    const [missionLayout, setMissionLayout] = useState<IJsonModel | null>(null);

    useEffect(() => {
        if (showModal && missionTitle) {
            getMissionLayout(missionTitle).then((result) => {
                if (result.success) {
                    setMissionLayout(result.layout ?? null);
                }
            });
        }
    }, [missionTitle, showModal, model]);

    const handleReset = async () => {
        try {
            const result = await saveUserLayout('');
            if (result.success) {
                enqueueSnackbar('Layout saved successfully', { variant: 'success' });
            } else {
                enqueueSnackbar(result.message, { variant: 'error' });
            }
        } catch (error) {
            enqueueSnackbar(error.message, { variant: 'error' });
            console.error(error.message);
        }

        if (missionLayout !== null) {
            setModel(Model.fromJson(missionLayout));
        } else {
            setModel(defaultAnalystLayout);
        }

        setShowModal(false);
        if (onClose) {
            onClose();
        }
    };

    const handleClose = () => {
        setShowModal(false);
        if (onClose) {
            onClose();
        }
    };

    if (showModal) {
        return (
            <Dialog onClose={handleClose} open={showModal}>
                <DialogTitle>Reset Layout?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This will reset your layout to the <b>{missionLayout ? 'Mission Layout' : 'Default Layout'}</b>.
                        Your current Custom Layout will be lost. Are you sure?
                    </DialogContentText>
                    <DialogActions>
                        <StyledDialogButton color='secondary' variant='outlined' onClick={handleClose}>
                            No
                        </StyledDialogButton>
                        <StyledDialogButton color='secondary' variant='contained' onClick={handleReset}>
                            Yes
                        </StyledDialogButton>
                    </DialogActions>
                </DialogContent>
            </Dialog>
        );
    }

    return <></>;
};

export default ResetLayoutDialog;
