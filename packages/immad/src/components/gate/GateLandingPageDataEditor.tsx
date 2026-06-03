import React, { ChangeEvent, useEffect, useState } from 'react';

import { ActionButton, FieldGroup, InputField, InputLabel, WidgetActions } from '../common';

import { Box, MenuItem, Typography } from '@mui/material';
import { ConfigHelper } from '../../helpers/configHelper';
import { addCategoryFeature, categoryQueryResult, GateUpdatePayload, Logger } from '@stratcom/lib-functions';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { useSnackbar } from 'notistack';

import RichTextEditor from './RichTextEditor';
import ICODWidget from '../widgets/ICODDateWidget/ICODWidget';

/**input props */
interface GateLandingPageDataEditorProps {
    /**unique identifier to map this data to */
    regionGuid: string;
    /**landing page row attribute data */
    selectedCategory: categoryQueryResult;
    /**name of the category */
    categoryName: string;
    /**update UI when this data has been updated and submitted */
    setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
    /**indicates if this mission is an exercise */
    missionIsExercise: boolean;
}

/**type that represents the component text items on a landing page row */
export type LandingPageProps = Pick<GateUpdatePayload, 'comments' | 'category_level' | 'category_confidence'>;

/**UI to edit landing page data rows */
function GateLandingPageDataEditor(props: GateLandingPageDataEditorProps): JSX.Element {
    const { regionGuid, categoryName, selectedCategory, setIsDirty, missionIsExercise } = props;

    const appConfig = ConfigHelper.getAppConfig();

    const [categoryLevel, setCategoryLevel] = useState<string | undefined>('');
    const [categoryConfidence, setCategoryConfidence] = useState<string>('Expected');
    const [comments, setComments] = useState<string | undefined>('');
    const [savedValue, setSavedValue] = useState<string>('');
    const [updatedValue, setUpdatedComment] = useState<string>();

    const { enqueueSnackbar } = useSnackbar();
    const [icodDate, setICODDate] = useState(selectedCategory.icod);
    const [savedIcodDate, setSavedIcodDate] = useState<Date | undefined>(
        selectedCategory.icod ? new Date(selectedCategory.icod) : undefined
    );

    useEffect(() => {
        if (updatedValue) {
            setComments(updatedValue);
        }
    }, [updatedValue]);

    useEffect(() => {
        const savedComment = selectedCategory.comment ? selectedCategory.comment : '';
        setComments(savedComment);
        setSavedValue(savedComment);
        setCategoryConfidence(selectedCategory.category_confidence || 'Expected');
        setCategoryLevel(selectedCategory.category_level);
        setICODDate(selectedCategory.icod && new Date(selectedCategory.icod));
        setSavedIcodDate(selectedCategory.icod && new Date(selectedCategory.icod));
    }, [selectedCategory]);

    /**
     * Handle change on the category level select
     * @param event change event
     */
    function handleCategoryLevelChanged(event: ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        setCategoryLevel(value);
    }

    /**
     * Handle change on the category confidence/Expectation select
     * @param event change event
     */
    function handleCategoryConfidenceChanged(event: ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        setCategoryConfidence(value);
    }

    /**
     * Handle the save button click
     */
    function saveButtonClickHandler() {
        addNewCategoryFtr();
    }

    /**
     * Add a new ftr data row for the landing page
     */
    async function addNewCategoryFtr() {
        const categoriesFLayer = new FeatureLayer({
            portalItem: {
                id: missionIsExercise
                    ? appConfig.gate.exercise.exLandingPageFClassGuid
                    : appConfig.gate.landingPageFClassGuid,
            },
        });
        categoriesFLayer
            .load()
            .then(async () => {
                const success = await addCategoryFeature(
                    {
                        region_guid: regionGuid,
                        category: categoryName ?? '',
                        category_level: categoryLevel ?? '',
                        category_confidence: categoryConfidence ?? '',
                        comment: comments ?? '',
                        guid: '',
                        icod: icodDate ?? undefined,
                    },
                    categoriesFLayer
                );
                const message = success ? 'Successfully updated the landing page data.' : 'Error updating data.';
                enqueueSnackbar(message, { variant: success ? 'info' : 'error' });
                setIsDirty(true);
            })
            .catch((error) => {
                Logger.log(`Error loading Category layer: ${appConfig.gate.landingPageFClassGuid}`, 'ERROR', error);
            });
    }

    /** Supported category levels */
    const categoryLevels = ['Low', 'Moderate', 'High'];

    /** Supported category confidences */
    const categoryConfidences = ['Expected', 'Not Expected'];

    /**
     * Handle the calendar date change
     * @param newDate user selected date
     */
    const handleStartDateChange = (newDate: Date) => {
        setICODDate(newDate);
    };

    /** UI */
    return (
        <>
            <FieldGroup>
                <InputLabel>Category Level</InputLabel>
                <InputField
                    fullWidth
                    variant='outlined'
                    color='secondary'
                    select
                    required
                    value={categoryLevel}
                    onChange={handleCategoryLevelChanged}
                >
                    {categoryLevels.map((categoryLevel) => (
                        <MenuItem key={categoryLevel} value={categoryLevel}>
                            {categoryLevel}
                        </MenuItem>
                    ))}
                </InputField>
            </FieldGroup>
            <FieldGroup>
                <InputLabel>Expectation</InputLabel>
                <InputField
                    fullWidth
                    variant='outlined'
                    color='secondary'
                    select
                    required
                    value={categoryConfidence}
                    onChange={handleCategoryConfidenceChanged}
                >
                    {categoryConfidences.map((categoryConfidence) => (
                        <MenuItem key={categoryConfidence} value={categoryConfidence}>
                            {categoryConfidence}
                        </MenuItem>
                    ))}
                </InputField>
            </FieldGroup>

            <FieldGroup>
                <Typography>Comments</Typography>
                <Box sx={{ minHeight: '100px', marginTop: '15px' }}>
                    <RichTextEditor commentDataOnStartup={savedValue} setUpdatedCommentVal={setUpdatedComment} />
                </Box>
            </FieldGroup>
            <ICODWidget
                onDateChange={handleStartDateChange}
                selectedDate={icodDate}
                required={true}
                savedDate={savedIcodDate}
            />
            <WidgetActions>
                <ActionButton
                    variant='contained'
                    color='secondary'
                    type='button'
                    title='Save Edits.'
                    disabled={!icodDate}
                    onClick={saveButtonClickHandler}
                >
                    Save Edits
                </ActionButton>
            </WidgetActions>
        </>
    );
}
export default GateLandingPageDataEditor;
