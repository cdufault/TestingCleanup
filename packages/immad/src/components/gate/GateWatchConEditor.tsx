import React, { ChangeEvent, useEffect, useState } from 'react';

import { ActionButton, FieldGroup, InputField, InputLabel, WidgetActions } from '../common';

import { Box, MenuItem, Typography } from '@mui/material';
import { GateUpdatePayload } from '@stratcom/lib-functions';
import { useSnackbar } from 'notistack';

import { getPortalItemData } from '../../helpers/portalItemsHelper';
import { updatePortalItem } from '../../helpers/portalItemsHelper';
import { findPortalGroupByTitle } from '../../helpers/portalGroupHelper';

/**describes the components of a watchcon */
interface IWatchCon {
    /**status level */
    level: number;
    /**general comment about the status */
    comment: string;
    /**user defined link to goto when the icon is clicked */
    link: string;
    /**last time the watchcon was updated */
    dateModified: string;
}

/**input props */
interface GateWatchConEditorProps {
    /**currently selected mission title */
    missionTitle: string;
    /**mission / group application objid for the selected mission */
    currentlySelectedAppId: string;
}

/**type that represents the component text items on a landing page row */
export type LandingPageProps = Pick<GateUpdatePayload, 'comments' | 'category_level' | 'category_confidence'>;

/**UI to edit landing page data related to setting the watchcon levels */
function GateWatchConEditor(props: GateWatchConEditorProps): JSX.Element {
    const { missionTitle, currentlySelectedAppId } = props;
    const [watchConData, setWatchConData] = useState<IWatchCon>({
        level: 0,
        comment: '',
        link: '',
        dateModified: '',
    });
    const [dataInvalid, setDataInvalid] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        if (currentlySelectedAppId && missionTitle) {
            refreshWatchConData();
        }
    }, []);

    useEffect(() => {
        if (watchConData) {
            // if any of the essential info is missing, do not let the user submit the form
            if (
                !watchConData.link ||
                watchConData.link.length === 0 ||
                watchConData.level < 1 ||
                watchConData.level > 4
            ) {
                setDataInvalid(true);
            } else {
                setDataInvalid(false);
            }
        }
    }, [watchConData]);

    /**
     * Handle change on the category confidence/Expectation select
     * @param event change event
     */
    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;
        let numValue = 0;
        let isNumb = false;
        if (name === 'level') {
            numValue = Number(value);
            isNumb = true;
        }
        !isNumb && setWatchConData((prevVals) => ({ ...prevVals, [name]: value }));
        isNumb && setWatchConData((prevVals) => ({ ...prevVals, [name]: numValue }));
    }

    /**
     * Handle the save button click
     */
    function saveButtonClickHandler() {
        if (watchConData) {
            const utcDateString = new Date().toISOString().slice(0, -8) + 'Z';
            watchConData.dateModified = utcDateString;
            updateWatchConData(currentlySelectedAppId, watchConData, missionTitle).then((result) => {
                if (result) {
                    enqueueSnackbar('WatchCon data updated.', { variant: 'success' });
                    refreshWatchConData();
                } else {
                    enqueueSnackbar('Error. Update failed. Check log for errors.', { variant: 'error' });
                }
            });
        }
    }

    /**
     * Reloads the watchcon data with the latest updates to the feature class
     */
    function refreshWatchConData() {
        if (currentlySelectedAppId) {
            getPortalItemData(currentlySelectedAppId).then((data: any) => {
                if (data?.appData?.watchcon) {
                    setWatchConData(data?.appData?.watchcon as IWatchCon);
                } else {
                    const message = 'Warning. No watchCon data was found for this mission: ' + missionTitle;
                    console.warn(message);
                    enqueueSnackbar(message, { variant: 'error' });
                }
            });
        } else {
            const message = 'Error. No region identifier was found.';
            console.error(message);
            enqueueSnackbar(message, { variant: 'error' });
        }
    }

    /**
     * Add the watchcon data to the mission application object
     * @param appObjId application object GUID identifier
     * @param watchConObj data for the watchcon
     * @param missionTitle title/name of the mission
     * @returns boolean value representing either success or failure on the update
     */
    const updateWatchConData = async (appObjId: string, watchConObj: IWatchCon, missionTitle: string) => {
        const result: any = await getPortalItemData(appObjId);
        if (result) {
            delete result.watchcon;
            result.appData.watchcon = watchConObj;
            const groupSearchResult: any = await findPortalGroupByTitle(missionTitle);
            let owner = '';
            if (groupSearchResult.success) {
                owner = groupSearchResult.item[0].owner;
            } else {
                console.error('Failed to find the owner for group/mission: ' + missionTitle);
            }
            const data = {
                id: appObjId,
                text: JSON.stringify(result),
                owner: owner,
            };
            const obj = await updatePortalItem(data);
            !obj.success && console.error('Failed to update the portal item with new data for: ' + missionTitle);
            return obj.success;
        }
        console.error('Failed to find item data for: ' + missionTitle);
        return false;
    };

    /** Supported category levels */
    const categoryLevels = ['1', '2', '3', '4'];

    /** UI */
    return (
        <>
            <FieldGroup>
                <InputLabel>Current Level</InputLabel>
                <InputField
                    fullWidth
                    variant='outlined'
                    color='secondary'
                    name='level'
                    select
                    required
                    error={watchConData.level < 1 || watchConData.level > 4}
                    value={watchConData.level}
                    onChange={handleChange}
                    helperText={watchConData.level < 1 || watchConData.level > 4 ? 'Invalid WatchCon Level' : ''}
                >
                    {categoryLevels.map((watchConLevel) => (
                        <MenuItem key={missionTitle + watchConLevel} value={watchConLevel}>
                            {watchConLevel}
                        </MenuItem>
                    ))}
                </InputField>
            </FieldGroup>
            <FieldGroup>
                <Typography>Comments</Typography>
                <InputField
                    fullWidth
                    multiline
                    name='comment'
                    rows={3}
                    placeholder='Add a comment...'
                    variant='outlined'
                    value={watchConData.comment}
                    onChange={handleChange}
                />
            </FieldGroup>
            <FieldGroup>
                <InputLabel>Go To URL</InputLabel>
                <InputField
                    fullWidth
                    variant='outlined'
                    name='link'
                    value={watchConData.link}
                    error={!watchConData.link || watchConData.link.length === 0}
                    onChange={handleChange}
                    helperText={!watchConData.link || watchConData.link.length === 0 ? 'Invalid URL' : ''}
                ></InputField>
            </FieldGroup>
            <FieldGroup>
                {watchConData.dateModified !== '' ? (
                    <Box sx={{ paddingTop: '10px', display: 'inline-flex' }}>
                        <Typography>Last Updated Date:</Typography>
                        <Box sx={{ paddingLeft: '15px' }}>
                            <Typography>{watchConData.dateModified}</Typography>
                        </Box>
                    </Box>
                ) : (
                    ''
                )}
            </FieldGroup>

            <WidgetActions>
                <ActionButton
                    variant='contained'
                    color='secondary'
                    type='button'
                    title='Save Edits.'
                    disabled={dataInvalid}
                    onClick={saveButtonClickHandler}
                >
                    Save Edits
                </ActionButton>
            </WidgetActions>
        </>
    );
}
export default GateWatchConEditor;
