import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Tooltip, Typography } from '@mui/material';
import { IItem } from '@esri/arcgis-rest-portal';
import { Actions, MissionAction, MissionState } from '../../../../../contexts/missionStateReducer';
import { AppConfig } from '../../../../../interfaces/AppConfig';
import {
    StyledBoxCardHeader,
    StyledBoxDisplayFlex,
    StyledBoxFullWidth,
    StyledCardActions,
    StyledCardContentNoTopPadding,
    StyledCardMediaPng,
    StyledCardRoot,
    StyledHeadingDiv,
    StyledMissionIcon,
    StyledSpanBlock,
    StyledSpanEmptyBlock,
    StyledSpanForEllipsis,
    StyledTopicIcon,
    StyledTypographyMarginTop,
    StyledTypographyTitle,
} from '../styles';

import PortalItem from '@arcgis/core/portal/PortalItem';
import defaultThumbnail from '../../../../../images/default_thumbnail.png';
import { missionMode } from '../helpers/missionCreationViewModel';
import { ConfirmationDialog } from '../../../../common/ConfirmationDialog';

function MyComponent(data: string) {
    return <span dangerouslySetInnerHTML={{ __html: data }} />;
}

const MissionWebScene = (props: {
    currentScene: PortalItem | IItem;
    dispatch: React.Dispatch<MissionAction>;
    state: MissionState;
    config: AppConfig;
}): JSX.Element => {
    const { currentScene, dispatch, state, config } = props;
    const [categoryDataToolTip, setCategoryDataToolTip] = useState<string>('None');
    const [thumbnailImage, setThumbnailImage] = useState<string>(defaultThumbnail);
    const [showWarningOpen, setShowWarningOpen] = useState(false);
    const [categoryData, setCategoryData] = useState<JSX.Element>(
        <>
            <StyledSpanBlock>None</StyledSpanBlock>
            <StyledSpanEmptyBlock> </StyledSpanEmptyBlock>
            <StyledSpanEmptyBlock> </StyledSpanEmptyBlock>
        </>
    );
    const mode =
        state.portalGroupId === '' || state.portalGroupId === undefined || state.missionIsCopy
            ? missionMode.CREATE
            : missionMode.UPDATE;
    useEffect(() => {
        if (currentScene) {
            const thumbnailUrl =
                config && currentScene && currentScene.thumbnail
                    ? `${config.portalUrl}/sharing/rest/content/items/${currentScene.id}/info/${currentScene.thumbnail}`
                    : thumbnailImage;
            setThumbnailImage(thumbnailUrl); //(currentScene.thumbnailUrl);
            if (currentScene && currentScene.categories && currentScene.categories.length > 0) {
                const forDisplay = currentScene?.categories[0].split('/');
                if (forDisplay.length > 3) {
                    // handles 2 or more levels deep topics
                    setCategoryData(
                        <>
                            <StyledSpanBlock>{forDisplay[2]}</StyledSpanBlock>
                            <StyledSpanForEllipsis>...</StyledSpanForEllipsis>
                            <StyledSpanBlock>{forDisplay[forDisplay.length - 1]}</StyledSpanBlock>
                        </>
                    );
                } else {
                    // handles 1 level deep mission topics
                    setCategoryData(
                        <>
                            <StyledSpanBlock>{forDisplay[forDisplay.length - 1]}</StyledSpanBlock>
                            <StyledSpanEmptyBlock> </StyledSpanEmptyBlock>
                            <StyledSpanEmptyBlock> </StyledSpanEmptyBlock>
                        </>
                    );
                }
                const categories = currentScene.categories.toString();
                setCategoryDataToolTip(categories.replaceAll(',', '\n'));
            }
        }
    }, [currentScene]);

    function whichDialogMessage() {
        let message =
            'Selecting a new scene for this mission will unshare the existing mission scene and replace it with ' +
            "a copy of the selected scene. Click 'Cancel' avoid making changes or click 'Continue' to create a " +
            'copy of the selected scene.';
        const missionSceneOwner = state.mapItem?.owner;
        if (missionSceneOwner) {
            if (missionSceneOwner === state.currentUser || state.isImmadAdmin) {
                message =
                    'Selecting a new scene for this mission will delete the existing mission scene and replace it ' +
                    "with a copy of the selected scene. Click 'Cancel' avoid making changes or click 'Continue' to " +
                    'create a copy of the selected scene.';
            }
        }
        return message;
    }

    function addSceneWarningCheck() {
        if (mode === missionMode.UPDATE) {
            setShowWarningOpen(true);
        } else {
            setShowWarningOpen(false);
            addSceneToMission();
        }
    }

    function handleCancel() {
        setShowWarningOpen(false);
    }

    /**
     * Add webscene to state. Remove any datafeeds since a new scene has been selected.
     */
    function addSceneToMission() {
        dispatch({ type: Actions.UPDATE_WEBSCENE, payload: { item: currentScene } });
        dispatch({ type: Actions.CLEAR_DATAFEEDS, payload: { item: [] } });
        dispatch({ type: Actions.UPDATE_CREATE_NEW_SCENE, payload: true });
        setShowWarningOpen(false);
    }

    /**
     * Clean an existing webscene from the state. Remove all datafeeds associated with the scene, as well as any others that have been added.
     */
    function removeSceneFromMission() {
        dispatch({ type: Actions.UPDATE_WEBSCENE, payload: { item: undefined } });
        dispatch({ type: Actions.CLEAR_DATAFEEDS, payload: { item: [] } });
    }

    const modified = new Date(currentScene.modified).toString();
    const description = currentScene.snippet
        ? MyComponent(currentScene.snippet)
        : currentScene.description
        ? MyComponent(currentScene.description)
        : 'No summary or description found.';

    return (
        <div>
            {config ? (
                <StyledCardRoot variant='outlined'>
                    <StyledHeadingDiv>
                        <StyledCardMediaPng image={thumbnailImage} />
                        <StyledBoxCardHeader>
                            <Tooltip title={currentScene.title}>
                                <StyledTypographyTitle noWrap variant='body1'>
                                    <StyledMissionIcon size={16} />
                                    {currentScene.title}
                                </StyledTypographyTitle>
                            </Tooltip>
                            <StyledBoxDisplayFlex>
                                <StyledTopicIcon size={16} />
                                <Tooltip title={categoryDataToolTip} aria-multiline={true}>
                                    <StyledTypographyMarginTop variant='body2'>
                                        {categoryData}
                                    </StyledTypographyMarginTop>
                                </Tooltip>
                            </StyledBoxDisplayFlex>
                        </StyledBoxCardHeader>
                    </StyledHeadingDiv>
                    <StyledCardContentNoTopPadding>
                        <Typography variant='caption'>{modified}</Typography>
                        <Box mt={1} maxHeight='60px' overflow='auto'>
                            <Tooltip title={description} aria-multiline={true}>
                                <Typography noWrap={true} variant='body2'>
                                    {description}
                                </Typography>
                            </Tooltip>
                        </Box>
                    </StyledCardContentNoTopPadding>
                    <StyledCardActions>
                        <StyledBoxFullWidth>
                            <Tooltip
                                title={
                                    state.mapItem && state.mapItem.id === currentScene.id
                                        ? 'Click to remove from mission'
                                        : 'Click to add to mission'
                                }
                            >
                                {state.mapItem && state.mapItem.id === currentScene.id ? (
                                    <Button onClick={removeSceneFromMission} variant='outlined' color='secondary'>
                                        Remove from Mission
                                    </Button>
                                ) : (
                                    <>
                                        <Button onClick={addSceneWarningCheck} variant='contained' color='secondary'>
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
                        </StyledBoxFullWidth>
                    </StyledCardActions>
                </StyledCardRoot>
            ) : (
                <h4>Loading...</h4>
            )}
        </div>
    );
};
export default MissionWebScene;
