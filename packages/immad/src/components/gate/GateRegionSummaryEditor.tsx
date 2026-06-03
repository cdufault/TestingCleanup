import React, { useEffect, useState } from 'react';
import { ActionButton, FieldGroup, WidgetActions } from '../common';
import { Box, Typography } from '@mui/material';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { ConfigHelper } from '../../helpers/configHelper';
import { useSnackbar } from 'notistack';
import { addRegionSummaryFeature, textDateVal } from '@stratcom/lib-functions';
import RichTextEditor from './RichTextEditor';
import ICODWidget from '../widgets/ICODDateWidget/ICODWidget';

/**input props */
interface GateRegionSummaryEditorProps {
    /**most recent summary comment for the region */
    summaryComments: textDateVal | undefined;
    /**update UI when this data has been updated and submitted */
    setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
    /**unique identifier to map this data to */
    regionGuid: string;
    /**indicates if this mission is an exercise */
    missionIsExercise: boolean;
}

/**UI for updating GATE summary data - a column on the landing page data row */
function GateRegionSummaryEditor(props: GateRegionSummaryEditorProps): JSX.Element {
    const { summaryComments, setIsDirty, regionGuid, missionIsExercise } = props;

    const appConfig = ConfigHelper.getAppConfig();
    const [summary, setSummary] = useState<string>('');
    const { enqueueSnackbar } = useSnackbar();
    const regionSummary = appConfig.gate.regionSummary;
    const [icodDate, setICODDate] = useState(summaryComments?.dateVal && new Date(summaryComments.dateVal));
    const [savedIcodDate, setSavedIcodDate] = useState<Date | undefined>(
        summaryComments?.dateVal ? new Date(summaryComments.dateVal) : undefined
    );

    useEffect(() => {
        if (summaryComments?.textVal) {
            setSummary(summaryComments.textVal);
        }
        if (summaryComments?.dateVal) {
            setICODDate(new Date(summaryComments?.dateVal));
            setSavedIcodDate(new Date(summaryComments?.dateVal));
        }
    }, [summaryComments?.textVal, summaryComments?.dateVal]);

    /**Handle the save button click */
    function saveButtonClickHandler() {
        updateRegionSummary();
    }

    /**
     * Add a new ftr into the region summary
     */
    async function updateRegionSummary() {
        setIsDirty(true);
        const regionsFLayer = new FeatureLayer({
            portalItem: {
                id: missionIsExercise
                    ? appConfig.gate.exercise.exAnalystCommentsFClassGuid
                    : appConfig.gate.analystCommentsFClassGuid,
            },
        });
        regionsFLayer
            .load()
            .then(async () => {
                const success = await addRegionSummaryFeature(
                    {
                        region_summary: summary ?? '',
                        region_guid: regionGuid ?? '',
                        icod: icodDate,
                    },
                    regionsFLayer
                );
                const message = success ? `Successfully updated the ${regionSummary}.` : 'Error updating data.';
                enqueueSnackbar(message, { variant: success ? 'info' : 'error' });
            })
            .catch((error) => {
                console.error(
                    `Error loading ${regionSummary} layer: ${appConfig.gate.regionsFClassGuid}` + error.message
                );
            });
    }

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
                <Typography>{`${regionSummary}`}</Typography>
                <Box sx={{ minHeight: '100px', marginTop: '15px' }}>
                    <RichTextEditor
                        commentDataOnStartup={summaryComments?.textVal ?? ''}
                        setUpdatedCommentVal={setSummary}
                    />
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
export default GateRegionSummaryEditor;
