import React, { useContext, useEffect, useState } from 'react';
import { DialogContent, DialogTitle, Fade, IconButton } from '@mui/material';
import { RightButton } from '../../../layout/styles';
import { StyledDialogActions, StyledDialogContentText, StyledRow, StyledWidgetModalDialog } from '../../styles';
import { InputLabel } from '../../../common';
import LaunchIcon from 'calcite-ui-icons-react/LaunchIcon';

// Helpers
import { ApplicationStateHelper } from '../../../../helpers/ApplicationStateHelper';
import { ConfigHelper } from '../../../../helpers/configHelper';

import { MapContext } from '../../../../contexts/Map';
import { useAppSelector } from '../../../../hooks/hooks';
import { RootState } from '../../../../data/store';
import WebMap = __esri.WebMap;
import WebScene = __esri.WebScene;
import { useClassificationContext } from '../../../../contexts/ClassificationContext';
import {createPortalLink} from "@stratcom/lib-functions";

/**
 * Interface to handle callback and input data coming from
 * where the modal dialog is initialized.
 */
interface WorkspaceNameInputDialogProps {
    handleClose: () => void;
    handleCancel: (url: string) => void;
    dialogTitle: string;
    layerId: string | undefined;
}

/**
 * Modal Dialog for getting a URL input from the user.
 * @param props UrlInputDialogProps
 * @constructor
 */
export default function WorkspaceNameInputDialog(props: WorkspaceNameInputDialogProps): JSX.Element {
    const [open] = useState<boolean>(true);

    const { layerId, dialogTitle, handleCancel, handleClose } = props;
    const classificationItems = useAppSelector((state: RootState) => state.classificationSlice.classificationItems);
    const classificationMarking = useAppSelector((state: RootState) => state.classificationSlice.classificationMarking);
    const { map, activeView } = useContext(MapContext);

    const appConfig = ConfigHelper.getAppConfig();

    const [currentClassification, setCurrentClassification] = useState<string>();

    useEffect(() => {
        const item = classificationItems.find((item) => {
            return item.id === layerId;
        })?.item;

        if (item?.classification) {
            setCurrentClassification(item.classification.banner);
        }
    }, [classificationItems]);

    const saveTypeLabel = dialogTitle.replace('Save As', '').trim();

    function handleSaveClicked() {
        handleClose();
    }

    function handleCancelClick() {
        handleCancel('');
    }

    async function handleViewMapInPortalClicked() {
        if (map) {
            let webSceneToOpenID;
            if (activeView === 'MAP') {
                webSceneToOpenID = (map as WebMap).portalItem.id;
            } else {
                webSceneToOpenID = (map as WebScene).portalItem.id;
            }
            const portalUrl = await ApplicationStateHelper.removeHttp(appConfig.portalUrl);
            window.open(createPortalLink(portalUrl, webSceneToOpenID), '_blank');
        }
    }

    return (
        <StyledWidgetModalDialog open={open} aria-labelledby='form-dialog-title' maxWidth='sm' fullWidth={true}>
            <Fade in={open} timeout={500}>
                <div>
                    <DialogTitle id='form-dialog-title'>{dialogTitle}</DialogTitle>
                    <DialogContent>
                        <StyledDialogContentText>
                            <b>This action will overwrite the existing item.</b>
                            <br />
                            <b>If the calculated classification is higher than the workspace classification,</b>
                            <b>then click on the link to update the workspace classification in Portal.</b>
                        </StyledDialogContentText>
                        <StyledRow>
                            <InputLabel>Calculated {saveTypeLabel} Classification:</InputLabel>
                            <InputLabel>{classificationMarking?.banner}</InputLabel>
                        </StyledRow>
                        <StyledRow>
                            <InputLabel>Current Workspace Classification:</InputLabel>
                            <InputLabel>{currentClassification}</InputLabel>
                            <IconButton
                                aria-label='View Portal Item'
                                title='View Portal Item'
                                onClick={handleViewMapInPortalClicked}
                            >
                                <LaunchIcon />
                            </IconButton>
                        </StyledRow>
                    </DialogContent>
                    <StyledDialogActions>
                        <RightButton variant='contained' color='primary' onClick={handleCancelClick}>
                            Cancel
                        </RightButton>
                        <RightButton variant='contained' color='secondary' onClick={handleSaveClicked}>
                            Save
                        </RightButton>
                    </StyledDialogActions>
                </div>
            </Fade>
        </StyledWidgetModalDialog>
    );
}
