import React, { useEffect, useRef, useState } from 'react';
import { CSVDownload } from 'react-csv';
import { Box, TextField } from '@mui/material';
import { ActionButton, WidgetContainer } from '../../common';
import ConfirmDialog from './ConfirmDialog';
import { useSnackbar } from 'notistack';

interface StratLeadFormProps {
    rowData: any[];
    onClose: (value: boolean) => void;
}

const StratLeadForm = (props: StratLeadFormProps): JSX.Element => {
    const { rowData, onClose } = props;
    const [confirmIsOpen, setConfirmIsOpen] = useState<boolean>(false);
    const [downloadCsv, setDownloadCsv] = useState<boolean>(false);
    const container = useRef<HTMLDivElement>(null);
    const formSubmitted = useRef<boolean>(false);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        window.addEventListener('beforeunload', handleTabClose);
        return () => {
            window.removeEventListener('beforeunload', handleTabClose);
            if (!formSubmitted.current) {
                onClose(false);
            }
        };
    }, []);

    const handleTabClose = () => {
        if (!formSubmitted.current) {
            onClose(false);
        }
    };

    const getRowDataCsv = () => {
        const columnArray: string[] = [];
        const valueArray: string[] = [];
        rowData.forEach((row, index) => {
            for (const key in row) {
                if (index === 0) {
                    columnArray.push(key);
                }
                valueArray.push(row[key]);
            }
        });
        return [columnArray, valueArray];
    };

    const onConfirmDialogClose = (response: boolean) => {
        if (response) {
            try {
                setDownloadCsv(true);
                formSubmitted.current = true;
                onClose(true);
            } catch {
                enqueueSnackbar('Error saving form, record not updated', {
                    variant: 'error',
                });
            }
        }
        setConfirmIsOpen(false);
    };

    return (
        <WidgetContainer ref={container}>
            <ConfirmDialog
                onClose={onConfirmDialogClose}
                open={confirmIsOpen}
                message={'Submitting this form will lock the current record, do you want to proceed?'}
                title={'Tactical Grid'}
                container={container.current}
            />
            {downloadCsv && <CSVDownload data={getRowDataCsv()} target='_blank' />}
            <Box>
                {rowData &&
                    rowData.map((row: any[], index: number) => {
                        //currently only supports a single selection
                        if (index === 0) {
                            const contents = [];
                            for (const key in row) {
                                contents.push(
                                    <TextField
                                        key={`${key}_${index}`}
                                        margin={'dense'}
                                        variant={'outlined'}
                                        label={key}
                                        defaultValue={row[key]}
                                        InputProps={{
                                            readOnly: true,
                                        }}
                                    />
                                );
                            }
                            return contents;
                        }
                    })}
            </Box>
            <Box width='100%' display='flex' justifyContent='flex-end'>
                <ActionButton
                    variant='contained'
                    color='secondary'
                    type='button'
                    title='Submit'
                    size={'small'}
                    onClick={() => {
                        setConfirmIsOpen(true);
                    }}
                >
                    Submit
                </ActionButton>
                <ActionButton
                    variant='contained'
                    color='secondary'
                    type='button'
                    title='Cancel'
                    size={'small'}
                    onClick={() => {
                        onClose(false);
                    }}
                >
                    Cancel
                </ActionButton>
            </Box>
        </WidgetContainer>
    );
};

export default StratLeadForm;
