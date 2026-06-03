import styled from 'styled-components';
import DatePicker from 'react-datepicker';
import 'dseg/css/dseg.css';
import ReactQuill from 'react-quill';
import { Typography, InputLabel, Button, Stack } from '@mui/material';
import Box from '@mui/material/Box';
import { WidgetActions } from '../common';

const StyledDatePickerGate = styled(DatePicker)`
    width: auto;
    border-style: solid;
    border-width: 1px;
    border-color: dimgray;
    border-radius: 2px;
    background: none;
    padding-left: 16.5px;
    min-height: 40px;
`;

/**Added additional styled item to support displaying in the GATEWAY that can be updated
 * without impacting any other views. */
const StyledDatePickerGateWay = styled(DatePicker)`
    width: 100%;
    border-style: solid;
    border-width: 1px;
    border-color: dimgray;
    border-radius: 2px;
    background: none;
    padding-left: 16.5px;
    min-height: 40px;
`;

/**Added additional styled item to support displaying in the GATEWAY that can be updated
 * without impacting any other views. */
const StyledDatePickerGateWayRequired = styled(DatePicker)`
    width: 100%;
    border-style: solid;
    border-width: 1px;
    border-color: #d32f2f;
    border-radius: 2px;
    background: none;
    padding-left: 16.5px;
    min-height: 40px;
`;

const DatePickerContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 20px;
`;

const IcodLabelContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 6px;
`;

const StyledReactQuill = styled(ReactQuill)`
    .ql-editor.ql-blank::before {
        color: #ffffff;
    }
`;

const StyledIcodHintText = styled(Typography)`
    font-size: 12px;
    color: #bcbcbc;
    margin-left: 10px;
`;

const StyledIcodLabelText = styled(InputLabel)`
    color: white;
    margin-right: 10px;
`;

const StyledIcodButton = styled(Button)`
    border-color: #44a9db;
    color: #44a9db;
    height: 20px;
    width: 130px;
    text-transform: none;
`;

const StyledIcodButtonText = styled(Typography)`
    color: #44a9db;
    font-size: smaller;
`;

const StyledIcodErrorText = styled(Typography)`
    color: #fa2929;
    font-size: 12px;
    padding-left: 10px;
`;

const StyledPositionButton = styled(Button)`
    min-width: 100px;
    height: 25px;
`;

const StyledVisibilityToggleStack = styled(Stack)`
    margin-top: 20px;
`;

const StyledPositionSelectionBox = styled(Box)`
    display: flex;
    padding-top: 15px;
    justify-content: space-between;
    width: 100%;
`;

const StyledPositionButtonsContainerBox = styled(Box)`
    flex-basis: 25%;
    display: flex;
    flex-direction: column;
`;

const StyledPositionButtonWrapperBox = styled(Box)`
    display: flex;
    width: 100%;
`;

const StyledWidgetActions = styled(WidgetActions)`
    margin-top: 20px;
`;

const StyledPositionInputBox = styled(Box)`
    flex-basis: 70%;
`;

export {
    StyledDatePickerGate,
    DatePickerContainer,
    StyledDatePickerGateWay,
    StyledDatePickerGateWayRequired,
    IcodLabelContainer,
    StyledReactQuill,
    StyledIcodHintText,
    StyledIcodLabelText,
    StyledIcodButton,
    StyledIcodButtonText,
    StyledIcodErrorText,
    StyledPositionButton,
    StyledVisibilityToggleStack,
    StyledPositionSelectionBox,
    StyledPositionButtonsContainerBox,
    StyledPositionButtonWrapperBox,
    StyledWidgetActions,
    StyledPositionInputBox,
};
