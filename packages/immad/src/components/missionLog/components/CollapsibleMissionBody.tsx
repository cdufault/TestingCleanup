import React, { useEffect, useState } from 'react';
import {
    StyledDataItemDiv,
    StyledFullHeightDiv,
    MissionBodyHead,
    StyledBodyHeadDiv,
    StyledExpandButtonDiv,
} from '../styles';
import { CardActions, Collapse, IconButton } from '@mui/material';
import { IFtrAttributeValueObj, NewtMessage } from '../MissionLogSlice';
import CollapsibleMissionData from './CollapsibleMissionData';
import { ExpandedState } from './CollapsibleMissionHeader';
import { StyledCalciteIcon } from '../../menuBar/styles';
import { getExpandIcon } from '../MissionLogHelper';

interface missionMessageProps {
    message: NewtMessage;
    messageType: string;
    iconIndex: string;
    expanded: ExpandedState;
}

const CollapsibleMissionBody = (props: missionMessageProps): JSX.Element => {
    const { message, messageType, expanded } = props;

    const [messageOpen, setMessageOpen] = useState(false);
    const [allExpanded, setAllExpanded] = useState<ExpandedState>(expanded);

    const [messageCode, messageItems] = message as unknown as [string, IFtrAttributeValueObj[]];
    const [messageCodeName, setMessageCodeName] = useState<string>();

    useEffect(() => {
        setAllExpanded(expanded);
        setMessageOpen(expanded !== 'closed');
    }, [expanded]);

    useEffect(() => {
        if (messageItems.length) {
            if (messageItems[0].codeAlias !== '') {
                setMessageCodeName(messageItems[0].codeAlias);
            } else {
                setMessageCodeName(messageCode);
            }
        }
    }, [messageItems]);

    /**
     * Handle toggle expand click.
     */
    const handleExpandClick = () => {
        if (allExpanded === 'closed') {
            setAllExpanded('expandedAll');
            setMessageOpen(true);
        } else if (allExpanded === 'expandedAll') {
            setAllExpanded('collapsedDetails');
        } else {
            setAllExpanded('closed');
            setMessageOpen(false);
        }
    };

    /**
     *
     * @param messageItem
     * @param index
     */
    const createMissionData = (messageItem: any, index: number) => {
        return (
            <CollapsibleMissionData
                message={messageItem}
                messageType={messageType}
                messageCode={messageCode}
                key={messageCode + '-' + index}
                expanded={allExpanded}
            />
        );
    };

    const createMissionDataBlocks = () => {
        return messageItems.map(createMissionData);
    };

    return (
        <StyledFullHeightDiv>
            <CardActions>
                <MissionBodyHead>
                    <StyledBodyHeadDiv>{messageCodeName}</StyledBodyHeadDiv>
                    <StyledExpandButtonDiv>
                        <IconButton onClick={handleExpandClick}>
                            <StyledCalciteIcon src={getExpandIcon(allExpanded)} />
                        </IconButton>
                    </StyledExpandButtonDiv>
                </MissionBodyHead>
            </CardActions>
            <Collapse in={messageOpen}>
                <StyledDataItemDiv>
                    <div>{createMissionDataBlocks()}</div>
                </StyledDataItemDiv>
            </Collapse>
        </StyledFullHeightDiv>
    );
};

export default CollapsibleMissionBody;
