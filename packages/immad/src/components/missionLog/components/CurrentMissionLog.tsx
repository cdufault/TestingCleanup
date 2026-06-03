//react imports
import React, { useEffect, useState } from 'react';
import { StyledFullHeightDiv } from '../styles';
import { NewtMessageEnvelope } from '../MissionLogSlice';

import { useAppSelector } from '../../../hooks/hooks';
import CollapsibleMissionHeader from './CollapsibleMissionHeader';
import { RemoveMissionLogMessageFeature } from '../MissionLogHelper';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { useSnackbar } from 'notistack';

interface currentMissionLogProps {
    messageEnvelope: NewtMessageEnvelope | undefined;
}

/**
 *
 * @constructor
 */
const CurrentMissionLog = (props: currentMissionLogProps): JSX.Element => {
    const currentMessage = props.messageEnvelope;
    const [message, setMessage] = useState<NewtMessageEnvelope | undefined>(currentMessage);

    const messageFeatureTableId = useAppSelector((state) => state.adminSettingsSlice.rmtMessageTable);
    const missionLogFeatureLayer = new FeatureLayer({
        portalItem: {
            id: messageFeatureTableId,
        },
    });
    const { enqueueSnackbar } = useSnackbar();
    useEffect(() => {
        setMessage(currentMessage);
    }, [currentMessage]);

    const handleRemoveHeader = async (objectId: number): Promise<void> => {
        if (objectId) {
            await RemoveMissionLogMessageFeature(objectId, missionLogFeatureLayer);
            setMessage(undefined);
            enqueueSnackbar('Message Removed', { variant: 'success' });
        }
    };

    return (
        <StyledFullHeightDiv className={'current-mission-log-full-height-div'}>
            {message ? (
                <CollapsibleMissionHeader
                    messageEnvelope={message}
                    collapsible={false}
                    handleRemoveHeader={handleRemoveHeader}
                />
            ) : (
                <div></div>
            )}
        </StyledFullHeightDiv>
    );
};

export default CurrentMissionLog;
