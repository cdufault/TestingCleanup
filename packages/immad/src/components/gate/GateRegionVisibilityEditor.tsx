import React, { ChangeEvent, useEffect, useState } from 'react';
import { ActionButton, InputField } from '../common';

import { Box, Switch, Typography } from '@mui/material';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { ConfigHelper } from '../../helpers/configHelper';
import { useSnackbar } from 'notistack';
import { Logger, updateRegionVisibilityFeature } from '@stratcom/lib-functions';
import { updatePortalItem } from '../../helpers/portalItemsHelper';
import { getPortalItemData } from '../../helpers/portalItemsHelper';
import { findPortalGroupByTitle } from '../../helpers/portalGroupHelper';
import {
    StyledPositionButton,
    StyledPositionButtonsContainerBox,
    StyledPositionButtonWrapperBox,
    StyledPositionInputBox,
    StyledPositionSelectionBox,
    StyledVisibilityToggleStack,
    StyledWidgetActions,
} from './gateStyles';

/**input props */
interface GateRegionVisibilityEditorProps {
    /**most recent summary comment for the region */
    isVisible: number;
    /**update UI when this data has been updated and submitted */
    setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
    /**unique identifier to map this data to */
    regionGuid: string;
    /**indicates if this mission is an exercise */
    missionIsExercise: boolean;
    /**location on the landing page */
    positionValue: number;
    /**region name */
    regionName: string;
    /**callback to update position on page */
    positionOnPageIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
    /**mission application object id */
    currentlySelectedAppId: string;
}

/**UI for updating GATE summary data - a column on the landing page data row */
function GateRegionVisibilityEditor(props: GateRegionVisibilityEditorProps): JSX.Element {
    const {
        isVisible,
        setIsDirty,
        regionGuid,
        missionIsExercise,
        positionValue,
        regionName,
        positionOnPageIsDirty,
        currentlySelectedAppId,
    } = props;

    const appConfig = ConfigHelper.getAppConfig();
    const [visible, setVisible] = useState<number>(-1);
    const { enqueueSnackbar } = useSnackbar();
    const [selectedPosition, setSelectedPosition] = useState<number>(99);
    const regionSummary = appConfig.gate.regionSummary;

    // Predefined 2D array representing button layout (4 rows, 2 buttons ber row)
    const buttonPositions = [
        [1, 2],
        [3, 4],
        [5, 6],
        [7, 8],
    ];

    useEffect(() => {
        if (isVisible > -1) {
            setVisible(isVisible);
        }
    }, [isVisible]);

    useEffect(() => {
        setSelectedPosition(positionValue);
    }, [positionValue]);

    /**Handle the save button click */
    function saveButtonClickHandler() {
        updateRegionVisibility(regionName);
    }

    /**
     * Handle switch on/off event
     * @param event switch change event
     */
    function switchChanged(event: React.ChangeEvent<HTMLInputElement>) {
        setVisible(event.target.checked ? 1 : 0);
    }

    /**
     * Update feature in the region summary
     */
    async function updateRegionVisibility(regionName: string) {
        setIsDirty(true);
        const regionsFLayer = new FeatureLayer({
            portalItem: {
                id: missionIsExercise ? appConfig.gate.exercise.exRegionsFClassGuid : appConfig.gate.regionsFClassGuid,
            },
        });

        regionsFLayer
            .load()
            .then(async () => {
                let success = await updateRegionVisibilityFeature(regionsFLayer, visible, regionGuid);
                if (!success) {
                    throw new Error('Failed to update the region visibility in the Regions feature class.');
                }

                const result: any = await getPortalItemData(currentlySelectedAppId);
                const groupSearchResult: any = await findPortalGroupByTitle(regionName);
                let owner = '';
                if (groupSearchResult.success) {
                    owner = groupSearchResult.item[0].owner;
                }
                result.appData.positionOnLandingPage = selectedPosition;
                const data = {
                    id: currentlySelectedAppId,
                    text: JSON.stringify(result),
                    owner: owner,
                };
                const updateItemResponse = await updatePortalItem(data);
                success = updateItemResponse.success;
                success && positionOnPageIsDirty(true);
                const message = success
                    ? `Successfully updated the ${regionSummary}.`
                    : 'Failed when trying to update the application object.';
                enqueueSnackbar(message, { variant: success ? 'info' : 'error' });
            })
            .catch((error) => {
                const errorMessage = `Error updating the region visibility: ${appConfig.gate.regionsFClassGuid}`;
                Logger.log(errorMessage, 'ERROR', error);
                enqueueSnackbar(errorMessage, { variant: 'error' });
            });
    }

    /**
     * Handle selected position text counter changed
     * @param event event object
     */
    function handleSelectedPositionChanged(event: ChangeEvent<HTMLInputElement>) {
        const position = Number(event.target.value);
        if (position) {
            position >= 1 && position < 100 && setSelectedPosition(position);
        } else {
            setSelectedPosition(99);
        }
    }

    /**
     * Allow user to click a numbered button to select the position. The
     * location of the button visually corresponds to the landing page location.
     * @param position position associated with the button
     */
    function positionClicked(position: string) {
        setSelectedPosition(Number(position));
    }
    // Reusable Button Component
    const PositionButton = ({ position }: { position: number }) => (
        <StyledPositionButton
            variant='contained'
            onClick={() => positionClicked(String(position))}
            sx={{ marginLeft: position % 2 === 0 ? '10px' : 0 }}
        >
            {position}
        </StyledPositionButton>
    );

    /** UI */
    return (
        <>
            {/* Visibility Toggle */}
            <StyledVisibilityToggleStack direction='row' spacing={1.5} alignItems='center'>
                <Typography>Hide from Landing Page</Typography>
                <Switch checked={visible !== 0} onChange={switchChanged} />
                <Typography>Show on Landing Page</Typography>
            </StyledVisibilityToggleStack>

            {/* Position Selection */}
            <StyledPositionSelectionBox>
                {/* Position Input */}
                <StyledPositionInputBox>
                    <Typography variant='caption'>Position on Landing Page</Typography>
                    <InputField
                        fullWidth
                        variant='outlined'
                        color='secondary'
                        type='number'
                        InputProps={{ inputProps: { min: 1, max: 99 } }}
                        required
                        value={selectedPosition}
                        onChange={handleSelectedPositionChanged}
                        helperText={`Click on a box to set the position. 
              Positions > 8 can be typed into the field. 
              Missions with identical position numbers will list alphabetically by title.
              Empty card positions will be filled by the closest ranked card.`}
                    />
                </StyledPositionInputBox>

                {/* Position Buttons */}
                <StyledPositionButtonsContainerBox>
                    <Typography variant='caption'>Landing Page Cards Layout</Typography>
                    <Box>
                        {buttonPositions.map((pair, rowIndex) => (
                            <StyledPositionButtonWrapperBox
                                key={rowIndex}
                                sx={{ marginTop: rowIndex > 0 ? '10px' : 0 }}
                            >
                                {pair.map((position) => (
                                    <PositionButton key={position} position={position} />
                                ))}
                            </StyledPositionButtonWrapperBox>
                        ))}
                    </Box>
                </StyledPositionButtonsContainerBox>
            </StyledPositionSelectionBox>

            {/* Save Button */}
            <StyledWidgetActions>
                <ActionButton variant='contained' color='secondary' onClick={saveButtonClickHandler}>
                    Save Edits
                </ActionButton>
            </StyledWidgetActions>
        </>
    );
}
export default GateRegionVisibilityEditor;
