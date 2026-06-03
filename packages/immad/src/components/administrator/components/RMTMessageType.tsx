import React, { useEffect, useRef, useState } from 'react';

import {
    RMTQueryMetadata,
    RMTCodeTypeQueryMetadata,
    updateActionPhrase,
    updateTrailingPhrase,
} from './AdminSettingsSlice';
import { StyledActionPhraseBox, StyledRMTItemUIBox } from '../styles';
import { IconButton, InputLabel, TextField, Typography } from '@mui/material';
import XIcon from 'calcite-ui-icons-react/XIcon';
import { useAppDispatch, useAppSelector } from '../../../hooks/hooks';
import RMTCodeType from './RMTCodeType';

/** describes the props for the RMTMessageType */
interface RMTMessageTypeProps {
    canEdit: boolean;
    messageType: string;
    removeMessage: (rmtType: string) => void;
}

/**handle the display of a Newt/RMTMessage type item */
export default function RMTMessageType(props: RMTMessageTypeProps): JSX.Element {
    const { canEdit, messageType, removeMessage } = props;
    const dispatch = useAppDispatch();
    const rmtQueryMetadataFromSlice = useAppSelector((state) => state.adminSettingsSlice.rmtQueryMetadata);
    const [actionPhrase, setActionPhrase] = useState('');
    const [trailingPhrase, setTrailingPhrase] = useState('');
    const [currentQueryMetadataItem, setCurrentQueryMetadataItem] = useState<RMTQueryMetadata | undefined>();
    const rmtQueryMetadataItemRef = useRef<RMTQueryMetadata[]>([]);

    useEffect(() => {
        if (rmtQueryMetadataItemRef.current !== rmtQueryMetadataFromSlice) {
            rmtQueryMetadataItemRef.current = rmtQueryMetadataFromSlice;
            findCurrentQueryItem(rmtQueryMetadataFromSlice, messageType);
        }
    }, [rmtQueryMetadataFromSlice]);

    useEffect(() => {
        if (currentQueryMetadataItem && currentQueryMetadataItem.actionPhrase !== actionPhrase) {
            dispatch(
                updateActionPhrase({
                    messageType: messageType,
                    actionPhrase: actionPhrase,
                })
            );
        }
    }, [actionPhrase]);

    useEffect(() => {
        if (currentQueryMetadataItem && currentQueryMetadataItem.trailingPhrase !== trailingPhrase) {
            dispatch(
                updateTrailingPhrase({
                    messageType: messageType,
                    trailingPhrase: trailingPhrase,
                })
            );
        }
    }, [trailingPhrase]);

    useEffect(() => {
        if (currentQueryMetadataItem) {
            setActionPhrase(currentQueryMetadataItem.actionPhrase);
            setTrailingPhrase(currentQueryMetadataItem.trailingPhrase);
        }
    }, [currentQueryMetadataItem]);

    /**
     * Find the correct newt type from the collection of Newt types defined in the application object
     * @param queryMetadataSlice array of RMTQueryMetadata objects
     * @param type rmtMessage type
     */
    function findCurrentQueryItem(queryMetadataSlice: RMTQueryMetadata[], type: string) {
        const queryMetadataObj = queryMetadataSlice.find((data) => data.rmtMessageType === type);
        if (queryMetadataObj && queryMetadataObj !== currentQueryMetadataItem) {
            setCurrentQueryMetadataItem(queryMetadataObj);
        }
    }

    /**
     * Handle action phrase change event
     * @param evt change event for the textbox
     */
    const onActionPhraseTextChange = (evt: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setActionPhrase(evt.target.value);
    };

    /**
     * Handle trailing phrase change event
     * @param evt change event for the textbox
     */
    const onTrailingPhraseTextChange = (evt: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setTrailingPhrase(evt.target.value);
    };

    /**
     * Create UI to handle defining code type props
     * @param index array item position
     * @param codeType type of code
     * @returns JSX element
     */
    function createCodeType(index: number, codeType: RMTCodeTypeQueryMetadata) {
        const codeTypeKey = messageType.replace(/\s/g, ''); //remove all spaces
        return (
            <StyledActionPhraseBox key={codeTypeKey + '_' + index}>
                <RMTCodeType canEdit={canEdit} rmtMessageType={messageType} codeType={codeType} />
            </StyledActionPhraseBox>
        );
    }

    const messageTypeKey = messageType.replace(/\s/g, ''); //remove all spaces
    return (
        <>
            <StyledRMTItemUIBox key={'rootIndex_' + messageTypeKey}>
                <Typography variant='h6' gutterBottom={true}>
                    {messageType}
                </Typography>
                {canEdit && (
                    <IconButton
                        title='Remove message type and all related code types'
                        onClick={() => removeMessage(messageType)}
                    >
                        <XIcon />
                    </IconButton>
                )}
            </StyledRMTItemUIBox>
            {currentQueryMetadataItem &&
                currentQueryMetadataItem.codeTypes.map((codeType: RMTCodeTypeQueryMetadata, index: number) =>
                    createCodeType(index, codeType)
                )}
            <StyledActionPhraseBox>
                <InputLabel>Message Action Phrase</InputLabel>
                <TextField
                    fullWidth
                    value={actionPhrase ? actionPhrase : ''}
                    placeholder='Add Data String'
                    inputProps={{ readOnly: !canEdit }}
                    variant='outlined'
                    size='small'
                    onChange={(evt) => {
                        onActionPhraseTextChange(evt);
                    }}
                />
            </StyledActionPhraseBox>
            <StyledActionPhraseBox>
                <InputLabel>Message Trailing Phrase</InputLabel>
                <TextField
                    fullWidth
                    value={trailingPhrase ? trailingPhrase : ''}
                    placeholder='Add Data String'
                    inputProps={{ readOnly: !canEdit }}
                    variant='outlined'
                    size='small'
                    onChange={(evt) => {
                        onTrailingPhraseTextChange(evt);
                    }}
                />
            </StyledActionPhraseBox>
        </>
    );
}
