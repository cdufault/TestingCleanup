// React imports
import React, { Fragment, useState } from 'react';
import PortalItem from '@arcgis/core/portal/PortalItem';
import { ButtonProgress, ButtonWrapper } from '../../../../widgets/dataFeeds/styles';
import { Alert, Button, Tooltip } from '@mui/material';
import { Actions, MissionAction, MissionState } from '../../../../../contexts/missionStateReducer';
import { ConfirmationDialog } from '../../../../common/ConfirmationDialog';
import { missionMode } from '../helpers/missionCreationViewModel';

/**
 * Properties needed to render action buttons for the portalItemList when it is working with 
 * web maps and web scenes during the mission creation/edit workflow
 */
interface ViewCardActionItemsProps {
    item?: PortalItem;
    missionState: MissionState;
    dispatch: React.Dispatch<MissionAction>;
    stateSceneId: string;
    categories: string | undefined;
}

function ViewCardActionItems(props: ViewCardActionItemsProps): JSX.Element {
    const { categories, stateSceneId, dispatch, missionState, item } = props;
    const [isLoading,] = useState(false);

    const [hasError,] = useState<boolean>();
    const [error,] = useState<string>();
    const [showWarningOpen, setShowWarningOpen] = useState(false);

    const mode =
    missionState.portalGroupId === '' || missionState.portalGroupId === undefined || missionState.missionIsCopy
            ? missionMode.CREATE
            : missionMode.UPDATE;

    /**
     * Add webscene to mission state reducer. Remove any datafeeds since a new scene has been selected.
     */
    function addSceneToMission() {
        dispatch({ type: Actions.UPDATE_WEBSCENE, payload: { item: item } });
        dispatch({ type: Actions.CLEAR_DATAFEEDS, payload: { item: [] } });
        dispatch({ type: Actions.UPDATE_CREATE_NEW_SCENE, payload: true });
        setShowWarningOpen(false);
    }

    /**
     * Clean an existing webscene from the mission state reducer. Remove all datafeeds associated with the scene, as well as any others that have been added.
     */
    function removeSceneFromMission() {
        dispatch({ type: Actions.UPDATE_WEBSCENE, payload: { item: undefined } });
        dispatch({ type: Actions.CLEAR_DATAFEEDS, payload: { item: [] } });
    }

    /**
     * Alert the user if they are changing the map/scene for an existing mission
     */
    function addSceneWarningCheck() {
        if (mode === missionMode.UPDATE) {
            setShowWarningOpen(true);
        } else {
            setShowWarningOpen(false);
            addSceneToMission();
        }
    }

    /**
     * Formulate a proper message to display to the user re: map/scene replacement
     * @returns the message to display to the user
     */
    function whichDialogMessage():string {
        let message =
            'Selecting a new scene for this mission will unshare the existing mission scene and replace it with ' +
            "a copy of the selected scene. Click 'Cancel' avoid making changes or click 'Continue' to create a " +
            'copy of the selected scene.';
        const missionSceneOwner = missionState.mapItem?.owner;
        if (missionSceneOwner) {
            if (missionSceneOwner === missionState.currentUser || missionState.isImmadAdmin) {
                message =
                    'Selecting a new scene for this mission will delete the existing mission scene and replace it ' +
                    "with a copy of the selected scene. Click 'Cancel' avoid making changes or click 'Continue' to " +
                    'create a copy of the selected scene.';
            }
        }
        return message;
    }

    /**
     * handle the cancel button click
     */
    function handleCancel() {
        setShowWarningOpen(false);
    }

    return (
        <>
            {hasError && (
                <Alert
                    title={error}
                    severity='error'
                    variant='outlined'
                    style={{ padding: '0 16px', width: '100%', justifyContent: 'center' }}
                >
                    Error Loading Layer
                </Alert>
            )}
            {!hasError && (
                <ButtonWrapper fullWidth>
                    {isLoading && <ButtonProgress color='secondary' size={24} />}
                    <Tooltip
                        title={
                            stateSceneId !== '' && stateSceneId === item?.id
                                ? 'Click to remove from mission'
                                : 'Click to add to mission'
                        }
                    >
                        {stateSceneId === item?.id ? (
                            <Button fullWidth onClick={removeSceneFromMission} variant='outlined' color='secondary'>
                                Remove from Mission
                            </Button>
                        ) : (
                            <>
                                <Button fullWidth onClick={addSceneWarningCheck} variant='contained' color='secondary'>
                                    Add to Mission
                                </Button>
                                <ConfirmationDialog
                                    description={whichDialogMessage()}
                                    open={showWarningOpen}
                                    title={'WARNING'}
                                    onClose={handleCancel}
                                    onSubmit={addSceneToMission}
                                />
                            </>
                        )}
                    </Tooltip>
                </ButtonWrapper>
            )}
        </>
    );
}

export default ViewCardActionItems;
