import styled from 'styled-components';

import { InputField, WidgetContent, InlineSelect } from '../common';
import { Autocomplete } from '@mui/lab';
import { makeStyles } from '@mui/styles';
import { Box } from '@mui/material';
import DatePicker from 'react-datepicker';

interface IFullWidth {
    fullWidth?: boolean;
}

const ButtonWrapper = styled.div<IFullWidth>`
    position: relative;

    ${(props) =>
        props.fullWidth &&
        `
            width: 100%;
            display: flex;
            justify-content: space-around;
            align-items: center;
        `};
`;

const StyledWidgetContent = styled(WidgetContent)`
    padding: 0px;
`;
const StyledAutocomplete = styled(Autocomplete)`
    width: 300px;
`;
const StyledEndJustifiedBox = styled(Box)`
    display: flex;
    align-items: flex-end;
`;

const StyledInputField = styled(InputField)`
    flex: 75%;
    margin-right: 5px;
    line-height: 0;
`;

const FlexContainer = styled.div`
    display: flex;
`;

const StyledDatePicker = styled(DatePicker)`
    min-width: 140px;
    border-style: solid;
    border-width: 1px;
    border-color: dimgray;
    border-radius: 2px;
`;

const StyledInlineSelect = styled(InlineSelect)`
    margin-inline-start: 0em;
`;

// spinning icon
const useStyles = makeStyles(() => ({
    refresh: {},
    spin: {
        animation: '$spin 1s 1',
    },
    '@keyframes spin': {
        '0%': {
            transform: 'rotate(0deg)',
        },
        '100%': {
            transform: 'rotate(360deg)',
        },
    },
}));

export {
    ButtonWrapper,
    StyledWidgetContent,
    StyledAutocomplete,
    StyledEndJustifiedBox,
    StyledInputField,
    FlexContainer,
    StyledDatePicker,
    useStyles,
    StyledInlineSelect,
};
