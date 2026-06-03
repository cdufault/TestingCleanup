//react imports
import React, { useEffect, useState } from 'react';
import {
    StyledHeaderDiv,
    StyledHeaderInfo,
    StyledHeaderDate,
    StyledHeaderDateError,
    StyledExpandButtonDiv,
    StyledBoxAsCollapse,
    StyledFlexFullHeightColumnDiv,
    StyleFlexColumnDiv,
} from '../styles';
import { NewtMessageEnvelope } from '../MissionLogSlice';
import { CardActions, IconButton } from '@mui/material';
import CollapsibleMissionBody from './CollapsibleMissionBody';
import '@esri/calcite-components/dist/components/calcite-icon';
import '@esri/calcite-components/dist/calcite/calcite.css';
import { StyledCalciteIcon } from '../../menuBar/styles';
import { getExpandIcon } from '../MissionLogHelper';
import XIcon from 'calcite-ui-icons-react/XIcon';
import { ConfirmationDialog } from '../../common/ConfirmationDialog';

interface missionHeaderProps {
    messageEnvelope: NewtMessageEnvelope;
    collapsible: boolean;
    handleRemoveHeader: (objectId: number) => void;
}
export type ExpandedState = 'closed' | 'expandedAll' | 'collapsedDetails';

/**
 * Collapsible Mission Header object
 * @param props
 * @constructor
 */
const CollapsibleMissionHeader = (props: missionHeaderProps): JSX.Element => {
    const { messageEnvelope, collapsible, handleRemoveHeader } = props;
    const { header, message } = messageEnvelope;
    const { type, timeStamp, totalQuantity } = header;
    const [headerOpen, setHeaderOpen] = useState(!collapsible);
    const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
    const [allExpanded, setAllExpanded] = useState<ExpandedState>('closed');

    useEffect(() => {
        setHeaderOpen(allExpanded !== 'closed');
    }, [allExpanded]);

    /**
     * get next expanded state based on previous
     * @param state
     */
    const nextExpandState = (state: ExpandedState): ExpandedState => {
        if (state === 'closed') return 'expandedAll';
        if (state === 'expandedAll') return 'collapsedDetails';
        return 'closed';
    };

    /**
     * Handle toggle expand all click.
     */
    const handleExpandAllClick = () => {
        setAllExpanded((previousState) => nextExpandState(previousState));
    };

    /**
     * Handle removal of current item.
     */
    const handleRemoveItem = () => {
        if (header.objectId) {
            handleRemoveHeader(header.objectId);
        }
    };

    const createMessage = (message: any, index: number) => {
        if (message[1].length) {
            return (
                <CollapsibleMissionBody
                    message={message}
                    messageType={type}
                    iconIndex={type + '-' + index}
                    key={type + '-' + index}
                    expanded={allExpanded}
                />
            );
        } else return;
    };

    const createMissionMessages = () => {
        const messages = Object.entries(message);
        return messages.map(createMessage);
    };

    const handleRemove = () => {
        handleRemoveItem(header.objectId);
    };

    const handleConfirmRemove = () => {
        setShowConfirmation(true);
    };

    return (
        <StyledFlexFullHeightColumnDiv className={'collapse-wrapper-div'}>
            <CardActions className={'card-actions'}>
                <StyledHeaderDiv className={'styled-header-div-in-card-actions'}>
                    {timeStamp === 'Incorrect Date Format' ? (
                        <StyledHeaderDateError>{timeStamp}</StyledHeaderDateError>
                    ) : (
                        <StyledHeaderDate>{timeStamp}</StyledHeaderDate>
                    )}

                    <StyledHeaderInfo> message type: {type} </StyledHeaderInfo>
                    <StyledHeaderInfo>total {totalQuantity}</StyledHeaderInfo>
                    <StyledExpandButtonDiv>
                        <IconButton onClick={handleExpandAllClick}>
                            <StyledCalciteIcon src={getExpandIcon(allExpanded)} />
                        </IconButton>
                        <IconButton title='Delete message from Mission Log' onClick={handleConfirmRemove}>
                            <XIcon />
                        </IconButton>
                    </StyledExpandButtonDiv>
                </StyledHeaderDiv>
            </CardActions>
            <StyledBoxAsCollapse
                className={'box-as-collapse-div'}
                sx={{
                    height: headerOpen ? '60%' : 0,
                }} // Needed here to handle when headerOpen changes
            >
                <StyleFlexColumnDiv className={'div-in-collapse'}>{createMissionMessages()}</StyleFlexColumnDiv>
            </StyledBoxAsCollapse>
            <ConfirmationDialog
                description={'This will permanently remove the Message from the Mission Log. Do you wish to continue?'}
                open={showConfirmation}
                title={'Remove Mission Message'}
                onClose={() => setShowConfirmation(false)}
                onSubmit={() => {
                    setShowConfirmation(false);
                    handleRemove();
                }}
            />
        </StyledFlexFullHeightColumnDiv>
    );
};

export default CollapsibleMissionHeader;
