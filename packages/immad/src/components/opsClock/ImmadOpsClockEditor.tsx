import React, { useEffect, useState } from 'react';
import { OpsClockEditorWidgetLib } from '@stratcom/react-widget-lib';
import { OpsClockDataSerializable } from '@stratcom/react-widget-lib/types/OpsClockWidgetLib';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { setExistingClocksList } from '../menuBar/components/saveState/SaveStateSlice';
import { ApplicationItem, getAllGATEApps } from '../gate/GateDataEditorHelper';
import { ConfigHelper } from '../../helpers/configHelper';
import { useSaveLoadContext } from '../../contexts/SaveLoad';

/** Ops Clock shared from the React widget lib for GATE display */
const ImmadOpsClockEditor = (): JSX.Element => {
    const existingDefaultOrWorkspaceClocks = useAppSelector((state) => state.saveStateSlice.existingClocksList);
    const appConfig = ConfigHelper.getAppConfig();
    const { missionSelect } = useSaveLoadContext();
    const [applicationItems, setApplicationItems] = useState<ApplicationItem[]>([]);
    const [selectedMissionTitle, setSelectedMissionTitle] = useState<string>('');
    const [maxClocks, setMaxClocks] = useState<number>();
    const dispatch = useAppDispatch();

    /** If user is not in GATE Admin group, user will not be able to save ops clocks to mission object */
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
            setMaxClocks(!currentlySelectedApp ? 100 : 5);
        }
    }, [applicationItems, selectedMissionTitle]);

    /**
     * Handle save event of Ops Clock component.
     */
    function handleOpsClockSave(clocks: OpsClockDataSerializable[]) {
        dispatch(setExistingClocksList(clocks));
    }

    return (
        <OpsClockEditorWidgetLib
            existingClocks={existingDefaultOrWorkspaceClocks}
            onClocksSave={handleOpsClockSave}
            displayOnly={false}
            maximumNumberOfClocks={maxClocks}
        />
    );
};

export default ImmadOpsClockEditor;
