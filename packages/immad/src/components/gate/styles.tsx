import styled from 'styled-components';
import { Box, Button, Typography } from '@mui/material';
import RefreshIcon from 'calcite-ui-icons-react/RefreshIcon';

const StyledFullHeightTableDiv = styled.div`
    width: 100%;
    height: 100%;
    overflow: auto;
    margin-top: 50px;
`;

const StyledBodyHeadDiv = styled.div`
    display: flex;
    width: 100%;
    justify-content: space-between;
    align-items: center;
`;

const StyledBox = styled(Box)`
    min-height: 100px;
    margin-top: 15px;
`;

const StyledFilterOptions = styled(Box)`
    display: flex;
    justify-content: space-between;
`;

const StyledWidgetHeaderText = styled(Typography)`
    margin-right: 5px;
`;

const StyledButtonRefreshIcon = styled(Button)`
    color: #0063a5;
    height: 22px;
    min-width: 30px;
    &:hover {
        color: #0daeff;
    }
`;

const StyledRefreshIcon = styled(RefreshIcon)`
    color: #0063a5;
    &:hover {
        color: #0daeff;
    }
`;

const StyledRefreshIconSpinning = styled(RefreshIcon)`
    color: #ffffff;
    animation: spin 1s infinite linear;
`;

export {
    StyledFullHeightTableDiv,
    StyledBodyHeadDiv,
    StyledBox,
    StyledFilterOptions,
    StyledWidgetHeaderText,
    StyledButtonRefreshIcon,
    StyledRefreshIcon,
    StyledRefreshIconSpinning,
};
