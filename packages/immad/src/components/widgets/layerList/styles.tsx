import styled from 'styled-components';
import Modal from '@mui/material/Modal';
import DialogActions from '@mui/material/DialogActions';
import { Box, Button, Checkbox, Dialog } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const WidgetModalDialog = styled(Modal)`
    width: 40rem;
    height: 14rem;
    margin: auto;
    background: ${(props) => props.theme.palette.primary.main};
    box-shadow: ${(props) => props.theme.shadows[1]};
`;

const StyledModalPushLayerDialog = styled(Modal)`
    width: 40rem;
    height: 23rem;
    margin: auto;
    background: ${(props) => props.theme.palette.primary.main};
    box-shadow: ${(props) => props.theme.shadows[1]};
`;

const StyledTimeBox = styled(Box)`
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-rows: auto;
    grid-column-gap: 15px;
    margin-top: 10px;
    margin-bottom: 20px;
`;

const StyledSubHeaderBox = styled(Box)`
    margin-top: 15px;
`;

const StyledHelperText = styled(Box)`
    color: rgba(255, 255, 255, 0.7);
    font-family; Arial, sans-serif;
    font-weight: 400;
    font-size: 0.8571428rem;
    line-height: 0.857;
    margin-top: 6px;
    margin-left: 14px;
`;

const StyledErrorTextBox = styled(Box)`
    color: ${(props) => props.theme.palette.error.main};
    text-align: right;
    font-family; Arial, sans-serif;
    font-weight: 400;
    font-size: 0.8571428rem;
    line-height: 0.857;
`;

const WidgetDialogActions = styled(DialogActions)`
    padding-right: 0px;
`;

const StyledDiv = styled.div`
    display: flex;
    width: 100%;
`;

const StyledPopupFieldsHeaderBox = styled(Box)`
    margin: auto;
    margin-top: 15px;
    margin-bottom: 15px;
`;

const StyledPopupFieldsSelectionDialog = styled(Dialog)`
    display: flex;
    overflow: auto;
    min-height: 20rem;
    max-height: 85%;
    justify-content: center;
    margin: auto;
`;

const StyledDialogActionButtonsContainer = styled(Box)`
    display: flex;
    justify-content: flex-end;
    margin-right: 20px;
    margin-bottom: 15px;
    margin-top: 15px;
`;

const StyledEditPromptBox = styled(Box)`
    margin-top: 12px;
    margin-left: 15px;
`;

const ApplyButton = styled(Button)`
    margin-top: 15px;
    margin-left: 15px;
`;

const CancelButton = styled(Button)`
    margin-top: 15px;
`;

const ActionButton = styled(Button)`
    margin-inline-start: ${(props) => props.theme.spacing(1)};
    color: ${(props) => props.theme.palette.common.white};
`;

const StyledFieldsDataGrid = styled(DataGrid)`
    height: 525px;
    width: 840px;
`;

export {
    WidgetModalDialog,
    WidgetDialogActions,
    StyledDiv,
    StyledModalPushLayerDialog,
    StyledTimeBox,
    StyledHelperText,
    StyledSubHeaderBox,
    StyledErrorTextBox,
    StyledPopupFieldsHeaderBox,
    StyledDialogActionButtonsContainer,
    StyledPopupFieldsSelectionDialog,
    StyledEditPromptBox,
    CancelButton,
    ApplyButton,
    ActionButton,
    StyledFieldsDataGrid,
};
