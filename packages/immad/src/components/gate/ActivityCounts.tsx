import React, { ChangeEvent, useEffect, useState } from 'react';

import { FieldGroup, InputField, InputLabel, WidgetContainer, WidgetHeader } from '../common';

import { Box, MenuItem, Typography } from '@mui/material';
import { CountWidgetLib } from '@stratcom/react-widget-lib';
import { useSaveLoadContext } from '../../contexts/SaveLoad';
import { getAllGATEApps, ApplicationItem } from './GateDataEditorHelper';
import { ConfigHelper } from '../../helpers/configHelper';

/**Main UI for editing GATE data */
function ActivityCounts(): JSX.Element {
    const appConfig = ConfigHelper.getAppConfig();
    const { missionSelect } = useSaveLoadContext();
    const portalUrl = appConfig.portalUrl;
    const currentDisplayMode = 'Standard'; //always there is not automation for IMMAD display
    const categoryRowColors = appConfig.countWidgetRowColors;
    const gateTypeKeywords = appConfig.typekeywords.gateMission;

    const [applicationItems, setApplicationItems] = useState<ApplicationItem[]>([]);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [selectedMissionTitle, setSelectedMissionTitle] = useState<string>('');
    const [, setSelectedAppId] = useState<string>('');
    const lastUpdatedFieldName = appConfig.gate.lastUpdatedFieldName;
    const executeCountQueriesSequentially = appConfig.gate.executeCountQueriesSequentially;

    /** Any user can update any GATE group's item data except for visibility and tabs.
     * To update those two items the user must belong to the group.
     */
    useEffect(() => {
        getAllGATEApps(
            appConfig.portalUrl,
            appConfig.typekeywords.gateExercise,
            appConfig.typekeywords.gateMission,
            appConfig.oauthAppId
        ).then((appItems) => {
            appItems && setApplicationItems(appItems);
        });
    }, []);

    useEffect(() => {
        setSelectedMissionTitle(missionSelect);
    }, [missionSelect]);

    useEffect(() => {
        if (applicationItems && selectedMissionTitle !== '') {
            const currentlySelectedApp: any = applicationItems.find((item) => item.title === selectedMissionTitle);
            currentlySelectedApp && setSelectedAppId(currentlySelectedApp.id);
            const gateLabel = appConfig?.gate?.gateLabel ?? '';
            setErrorMessage(
                !currentlySelectedApp
                    ? `The currently selected mission was not found in the${
                          gateLabel ? ' ' + gateLabel : ''
                      } mission list.`
                    : ''
            );
        }
    }, [applicationItems, selectedMissionTitle]);

    /**
     * Handle change event on the mission select
     * @param event change event
     */
    function handleSelectedMissionTitleChanged(event: ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        setSelectedMissionTitle(value as string);
    }
    let canExecute = false;
    if (portalUrl && selectedMissionTitle && selectedMissionTitle !== '' && errorMessage === '') {
        canExecute = true;
    }
    /** UI */
    return (
        <WidgetContainer>
            <WidgetHeader position={'static'}>
                <InputLabel>Activity Count Widget</InputLabel>
            </WidgetHeader>

            <FieldGroup>
                {applicationItems.length > 0 ? <Typography variant="caption">Select A Mission</Typography> : ''}
                <InputField
                    fullWidth
                    variant="outlined"
                    color="secondary"
                    select
                    required
                    error={errorMessage !== ''}
                    value={selectedMissionTitle}
                    onChange={handleSelectedMissionTitleChanged}
                    helperText={errorMessage !== '' ? errorMessage : ''}
                >
                    {applicationItems.map((appItem: ApplicationItem) => (
                        <MenuItem key={appItem.title} value={appItem.title}>
                            {appItem.title}
                        </MenuItem>
                    ))}
                </InputField>
            </FieldGroup>
            <Box sx={{ marginTop: '15px' }}>
                {canExecute && (
                    <CountWidgetLib
                        portalUrl={portalUrl}
                        gateTypeKeywords={gateTypeKeywords}
                        currentDisplayMode={currentDisplayMode}
                        categoryRowColors={categoryRowColors}
                        regionName={selectedMissionTitle}
                        lastUpdatedFieldName={lastUpdatedFieldName}
                        executeCountQueriesSequentially={executeCountQueriesSequentially}
                    />
                )}
            </Box>
        </WidgetContainer>
    );
}
export default ActivityCounts;
