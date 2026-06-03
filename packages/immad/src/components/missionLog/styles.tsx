import styled from 'styled-components';
import { Button, DialogActions, DialogContent, IconButton, TableRow, TextField } from '@mui/material';
import RefreshIcon from 'calcite-ui-icons-react/RefreshIcon';
import Tabs from '@mui/material/Tabs';
import Box from '@mui/material/Box';
import SortDescendingIcon from 'calcite-ui-icons-react/SortDescendingIcon';

const StyledDialogActions = styled(DialogActions)`
    justify-content: center;
    padding: 24px;
`;

const StyledFullHeightDiv = styled.div`
    width: 100%;
    height: 100%;
`;
const StyledFullHeightOverflowHiddenDiv = styled.div`
    width: 100%;
    height: 100%;
    overflow: hidden;
`;

const StyledFullHeightTableDiv = styled.div`
    width: 100%;
    height: 100%;
    overflow: auto;
`;

const StyledMissionLogEntryTextField = styled(TextField)`
    margin-top: 10px;
    background-color: #262c39;
`;

const StyledDataItemDiv = styled.div`
    background-color: #292d3f;
`;

const StyledDataItemValueDiv = styled.div`
    background-color: #485a73;
    margin-top: 1.5rem;
    margin-bottom: 2.5rem;
`;

const StyledHeaderInfo = styled.span`
    padding-left: 30px;
`;

const StyledHeaderDate = styled.span`
    padding-left: 30px;
`;
const StyledHeaderDateError = styled.span`
    padding-left: 30px;
    color: red;
`;

const StyledHeaderDiv = styled.div`
    width: 100%;
`;

const MissionBodyHead = styled.div`
    width: 100%;
    display: flex;
`;

const StyledIconButton = styled(IconButton)`
    float: right;
`;

const StyledButtonStartIcon = styled(Button)`
    border-radius: 33.33px;
    min-height: 24px;
    color: #0daeff;
    background-color: #235590;
    &:hover {
        background-color: #3d445b;
    }
`;

const StyledSVGDiv = styled.div`
    height: 32px;
    width: 32px;
`;

const StyledRightPaddedSVGDiv = styled(StyledSVGDiv)`
    padding-right: 5px;
`;

const StyledBaseIconButton = styled(IconButton)`
    color: #0daeff;
`;

const StyledFlashIconButton = styled(StyledBaseIconButton)`
    padding-right: 15px;
`;

const StyledInlineDiv = styled.div`
    display: flex;
`;

const StyledTableRow = styled(TableRow)`
    background-color: #353f56;
`;

const StyledBodyHeadDiv = styled.div`
    display: flex;
    width: 90%;
`;

const StyledExpandButtonDiv = styled.div`
    float: right;
`;

const StyledButtonRefreshIcon = styled(Button)`
    color: #0063a5;
    height: 22px;
    width: 10px;
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

const StyledSortIconButton = styled(SortDescendingIcon)`
    color: #0063a5;
    &:hover {
        color: #0daeff;
    }
`;

const StyledMissionLogContainer = styled.div`
    flex: 1;
    overflow-y: auto;
    height: 100%;
`;

const StyledScrollableMessageList = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 0 16px; /* Optional spacing */
    min-height: 0;
`;

const StyledSummaryContainerDiv = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
`;

const StyledTabs = styled(Tabs)`
    height: 48px;
`;

const StyledMissionLogWidgetContainer = styled.div`
    width: 100%;
    height: 100%;
    overflow: hidden;
`;

const StyledPaginationDiv = styled.div`
    padding: 0 0 20px 0;
`;

const StyledDialogContentOverFlowHidden = styled(DialogContent)`
    height: 100%;
    overflow: hidden;
`;

const StyledBoxAsCollapse = styled(Box)`
    overflow: auto;
    transition: height 300ms ease;
`;
const StyleFlexColumnDiv = styled.div`
    display: flex;
    flex-direction: column;
`;

const StyledFlexFullHeightColumnDiv = styled(StyleFlexColumnDiv)`
    overflow: auto;
    height: 100%;
`;

export {
    StyledDialogActions,
    StyledFullHeightDiv,
    StyledFullHeightOverflowHiddenDiv,
    StyledMissionLogEntryTextField,
    StyledHeaderInfo,
    StyledHeaderDiv,
    StyledHeaderDate,
    StyledHeaderDateError,
    StyledDataItemDiv,
    MissionBodyHead,
    StyledIconButton,
    StyledDataItemValueDiv,
    StyledButtonStartIcon,
    StyledSVGDiv,
    StyledRightPaddedSVGDiv,
    StyledFlashIconButton,
    StyledBaseIconButton,
    StyledInlineDiv,
    StyledFullHeightTableDiv,
    StyledTableRow,
    StyledBodyHeadDiv,
    StyledExpandButtonDiv,
    StyledButtonRefreshIcon,
    StyledRefreshIcon,
    StyledRefreshIconSpinning,
    StyledSortIconButton,
    StyledMissionLogContainer,
    StyledScrollableMessageList,
    StyledSummaryContainerDiv,
    StyledTabs,
    StyledMissionLogWidgetContainer,
    StyledPaginationDiv,
    StyledDialogContentOverFlowHidden,
    StyledBoxAsCollapse,
    StyleFlexColumnDiv,
    StyledFlexFullHeightColumnDiv,
};
