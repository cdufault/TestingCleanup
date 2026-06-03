import React, { ChangeEvent, useEffect, useState } from 'react';
import { ActionButton, FieldGroup, WidgetActions } from '../common';

import { Box, TextField, Typography } from '@mui/material';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { ConfigHelper } from '../../helpers/configHelper';
import { useSnackbar } from 'notistack';
import { addAnalystCommentFeatureLib, AnalystCommentsQueryResult } from '@stratcom/lib-functions';
import { LogHelper } from '../../helpers/logHelper';

import RichTextEditor from './RichTextEditor';
import ICODWidget from '../widgets/ICODDateWidget/ICODWidget';

/**Input props */
interface GateAnalystCommentEditorProps {
    /**most recently updated comment data */
    analystCommentQueryResult?: AnalystCommentsQueryResult;
    /**selected category */
    category: string;
    /**unique identifier to map this data to */
    regionGuid: string;
    /**name of the region */
    regionName: string;
    /**indicates if this mission is an exercise */
    missionIsExercise: boolean;
}

/***Edit GATE analyst comment data */
function GateAnalystCommentEditor(props: GateAnalystCommentEditorProps): JSX.Element {
    const { analystCommentQueryResult, category, regionGuid, regionName, missionIsExercise } = props;

    const appConfig = ConfigHelper.getAppConfig();
    const [comment, setComment] = useState<string>('');
    const [classification, setClassification] = useState<string>('');
    const analystComments = appConfig.gate.analystComments;

    const { enqueueSnackbar } = useSnackbar();

    const [savedValue, setSavedValue] = useState<string>('');
    const [updatedValue, setUpdatedComment] = useState<string>();
    const [icodDate, setICODDate] = useState<Date | undefined>(
        analystCommentQueryResult?.icod ? new Date(analystCommentQueryResult.icod) : undefined
    );
    const [savedIcodDate, setSavedIcodDate] = useState<Date | undefined>(
        analystCommentQueryResult?.icod ? new Date(analystCommentQueryResult.icod) : undefined
    );

    useEffect(() => {
        if (updatedValue) {
            setComment(updatedValue);
        }
    }, [updatedValue]);

    useEffect(() => {
        if (analystCommentQueryResult) {
            const savedComment = analystCommentQueryResult.comment ? analystCommentQueryResult.comment : '';
            setComment(savedComment);
            setSavedValue(savedComment);
            setClassification(
                analystCommentQueryResult.human_readable_class ? analystCommentQueryResult.human_readable_class : ''
            );
            setICODDate(analystCommentQueryResult.icod && new Date(analystCommentQueryResult.icod));
            setSavedIcodDate(analystCommentQueryResult.icod && new Date(analystCommentQueryResult.icod));
        }
    }, [analystCommentQueryResult]);

    /**
     * handle change to the human readable classification input textbox
     * @param event input text change event
     */
    function handleHumanReadableClassChanged(event: ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        setClassification(value);
    }

    /**handle save button clicked */
    function saveButtonClickHandler() {
        addAnalystCommentFeature();
    }

    /**Update the featurelayer with the current input data */
    async function addAnalystCommentFeature() {
        const analystCommentsFLayer = new FeatureLayer({
            portalItem: {
                id: missionIsExercise
                    ? appConfig.gate.exercise.exAnalystCommentsFClassGuid
                    : appConfig.gate.analystCommentsFClassGuid,
            },
        });
        analystCommentsFLayer
            .load()
            .then(async () => {
                const success = await addAnalystCommentFeatureLib(
                    {
                        region_guid: regionGuid,
                        comments: comment,
                        topic: category,
                        region_name: regionName,
                        human_readable_class: classification,
                        icod: icodDate,
                    },
                    analystCommentsFLayer
                );
                const message = success ? `Successfully updated the ${analystComments}.` : 'Error updating data.';
                enqueueSnackbar(message, { variant: success ? 'info' : 'error' }); //
            })
            .catch((error) => {
                LogHelper.log(
                    `Error loading ${analystComments} layer: ${appConfig.gate.analystCommentsFClassGuid}. Error: ` +
                        JSON.stringify(error),
                    true
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
                <Typography>{`${analystComments} Editor`}</Typography>
                <Box sx={{ minHeight: '100px', marginTop: '15px' }}>
                    <RichTextEditor commentDataOnStartup={savedValue} setUpdatedCommentVal={setUpdatedComment} />
                </Box>
            </FieldGroup>
            <FieldGroup>
                <Typography>Human Readable Classification</Typography>
                <TextField
                    fullWidth
                    multiline
                    rows={5}
                    placeholder='Enter human readable class...'
                    variant='outlined'
                    value={classification}
                    onChange={handleHumanReadableClassChanged}
                />
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
export default GateAnalystCommentEditor;
