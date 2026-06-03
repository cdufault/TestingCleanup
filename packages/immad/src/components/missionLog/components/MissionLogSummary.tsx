import React, { useEffect, useRef, useState } from 'react';
import {
    StyledButtonRefreshIcon,
    StyledHeaderDiv,
    StyledMissionLogContainer,
    StyledPaginationDiv,
    StyledRefreshIcon,
    StyledRefreshIconSpinning,
    StyledScrollableMessageList, StyledSortIconButton,
    StyledSummaryContainerDiv,
} from '../styles';
import { NewtMessageEnvelope, queryMessageData, setPage, setPageSize, updateMessages } from '../MissionLogSlice';
import { useAppDispatch, useAppSelector } from '../../../hooks/hooks';
import CollapsibleMissionHeader from './CollapsibleMissionHeader';
import { RemoveMissionLogMessageFeature } from '../MissionLogHelper';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { useSnackbar } from 'notistack';
import Box from '@mui/material/Box';
import TablePagination from '@mui/material/TablePagination';
import SortAscendingIcon from 'calcite-ui-icons-react/SortAscendingIcon';
import { IconButton } from '@mui/material';

const MissionLogSummary = (): JSX.Element => {
    const dispatch = useAppDispatch();
    const { enqueueSnackbar } = useSnackbar();

    const currentMessages = useAppSelector((state) => state.missionLogSlice.messages);
    const messageFeatureTableId = useAppSelector((state) => state.adminSettingsSlice.rmtMessageTable);
    const rmtData = useAppSelector((state) => state.adminSettingsSlice.rmtQueryMetadata);
    const dataLoading = useAppSelector((state) => state.missionLogSlice.loading);
    const currentPage = useAppSelector((state) => state.missionLogSlice.currentPage);
    const pageSize = useAppSelector((state) => state.missionLogSlice.pageSize);
    const totalRecords = useAppSelector((state) => state.missionLogSlice.totalRecords);
    const page = useAppSelector((state) => state.missionLogSlice.currentPage);
    const [sortedDateAscending, setSortedDateAscending] = useState(true);

    // orderField is not currently reset but will be needed when additional sort options are added.
    const [orderByField, setOrderByField] = useState('message_date');

    const lastQueryRef = useRef<ReturnType<typeof dispatch> | null>(null);
    const missionLogFeatureLayer = new FeatureLayer({
        portalItem: { id: messageFeatureTableId },
    });

    useEffect(() => {
        triggerQuery();
        return () => {
            // cleanup on un-mount
            lastQueryRef.current?.abort();
        };
    }, [currentPage, pageSize, messageFeatureTableId, rmtData, dispatch]);

    // used to resetting to page 1 when loaded or reloaded.
    useEffect(() => {
        if (page !== 1) {
            dispatch(setPage(1));
        }
    }, [dispatch]);

    const createHeader = (header: NewtMessageEnvelope, index: number) => (
        <CollapsibleMissionHeader
            messageEnvelope={header}
            key={index}
            collapsible={true}
            handleRemoveHeader={handleRemoveHeader}
        />
    );

    /**
     * Handle remove header
     */
    const handleRemoveHeader = async (objectId: number): Promise<void> => {
        if (!objectId) return;

        await RemoveMissionLogMessageFeature(objectId, missionLogFeatureLayer);
        enqueueSnackbar('Message Removed', { variant: 'success' });

        const newMessages = currentMessages.filter((msg) => msg.header.objectId !== objectId);
        dispatch(updateMessages(newMessages));
    };

    /**
     * When the refresh button is clicked, run the slice reducer feature query
     */
    const handleRefreshButtonClick = () => {
        if (dataLoading) return;
        triggerQuery();
    };

    /**
     * When the sort button is clicked, run the sort query
     */
    const handleSortDateClick = () => {
        if (sortedDateAscending) {
            setSortedDateAscending(false);
            triggerSort();
        } else {
            setSortedDateAscending(true);
            triggerSort();
        }
    };

    /**
     * send query to mission log slice
     */
    const triggerQuery = () => {
        lastQueryRef.current?.abort();
        lastQueryRef.current = dispatch(
            queryMessageData({
                portalItemId: messageFeatureTableId,
                rmtData,
                page: currentPage,
                pageSize,
                orderByField: 'created_date',
                order: 'DESC',
            })
        );
    };

    /**
     * send the sort query to mission log slice
     */
    const triggerSort = () => {
        lastQueryRef.current?.abort();
        lastQueryRef.current = dispatch(
            queryMessageData({
                portalItemId: messageFeatureTableId,
                rmtData,
                page: currentPage,
                pageSize,
                orderByField: orderByField,
                order: sortedDateAscending ? 'ASC' : 'DESC',
            })
        );
    };

    /**
     * Handle page change mouse event
     * @param event mouse event
     * @param newPage new page number
     */
    const handlePageChange = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
        dispatch(setPage(newPage + 1));
    };

    return (
        <StyledSummaryContainerDiv>
            <Box display='flex' alignItems='center' justifyContent='space-between' mb={2}>
                <StyledButtonRefreshIcon
                    title='Refresh Mission Log Messages'
                    disableRipple
                    disableFocusRipple
                    onClick={handleRefreshButtonClick}
                >
                    {dataLoading ? <StyledRefreshIconSpinning size={16} /> : <StyledRefreshIcon size={16} />}
                </StyledButtonRefreshIcon>
                <StyledHeaderDiv>
                    {sortedDateAscending ? (
                        <IconButton onClick={handleSortDateClick} title='Sort By Misssion Date Descending'>
                            <StyledSortIconButton />
                        </IconButton>
                    ) : (
                        <IconButton onClick={handleSortDateClick} title='Sort By Misssion Date Ascending'>
                            <SortAscendingIcon />
                        </IconButton>
                    )}
                </StyledHeaderDiv>
            </Box>
            <StyledMissionLogContainer>
                <StyledScrollableMessageList>{currentMessages.map(createHeader)}</StyledScrollableMessageList>
            </StyledMissionLogContainer>
            <StyledPaginationDiv className={'table-pagination'}>
                <TablePagination
                    component='div'
                    count={totalRecords || 0}
                    page={page - 1}
                    onPageChange={handlePageChange}
                    rowsPerPage={pageSize}
                    onRowsPerPageChange={(event) => dispatch(setPageSize(parseInt(event.target.value, 10)))}
                    rowsPerPageOptions={[10, 15, 20]}
                />
            </StyledPaginationDiv>
        </StyledSummaryContainerDiv>
    );
};

export default MissionLogSummary;
