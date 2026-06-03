import styled from 'styled-components';

import { default as MuiAppBar } from '@mui/material/AppBar';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MuiRadioGroup from '@mui/material/RadioGroup';
import { CardContent, LinearProgress, MenuItem, FormControlLabel } from '@mui/material';
import React from 'react';

// Transient props will not be added to the DOM and therefore can be boolean
// DOM rejects bool props and will log a warning
interface IGutters {
    $nogutters?: boolean;
    $bottomgutter?: boolean;
}

const WidgetContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
`;

const WidgetHeader = styled(MuiAppBar)`
    padding: ${(props) => props.theme.spacing(1)};
    // background: ${(props) => props.theme.palette.background.paper};
`;

const WidgetContent = styled(Paper)`
    width: 100%;
    height: 100%;
    overflow: auto;
    padding: ${(props) => props.theme.spacing(1)};
    border-radius: 0;
`;

const WidgetProgress = styled(LinearProgress)`
    display: flex;
    justify-content: flex-end;
    width: 100%;
`;

const WidgetActions = styled(Paper)`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    width: 100%;
    padding: ${(props) => props.theme.spacing(1)};
    border-radius: 0;
    // background: ${(props) => props.theme.palette.background.paper};
    box-shadow: ${(props) => props.theme.shadows[1]};
`;

const FixedWidgetActions = styled(Paper)`
    display: flex;
    align-items: center;
    position: fixed;
    width: 100%;
    padding: ${(props) => props.theme.spacing(1)};
    border-radius: 0;
    //background: ${(props) => props.theme.palette.background.paper};
    box-shadow: ${(props) => props.theme.shadows[1]};
    bottom: 46px;
`;

const WidgetButtonBox = styled(Box)`
    width: 100%;
    display: flex;
    align-items: center;
`;

const ActionButtonBox = styled(Box)`
    display: flex;
`;

const ActionButton = styled(Button)`
    color: ${(props) => props.theme.palette.primary.contrastText}
    margin-inline-start: ${(props) => props.theme.spacing(1)};
    margin-inline-end: ${(props) => props.theme.spacing(1)};
`;

const PopoverCardImage = styled.img`
    height: 100%;
    width: 25rem;
    background-color: white;
`;

const PopoverCardContent = styled(CardContent)`
    max-width: 25rem;
    border-width: 0.3rem;
    padding: 0.3rem;
`;

const FieldGroup = styled.div<IGutters>`
    margin-block-start: ${(props) => props.theme.spacing(1)};

    ${(props) =>
        props.$nogutters &&
        `
            margin: 0;
        `};

    ${(props) =>
        props.$bottomgutter &&
        `
            margin-block-end: ${props.theme.spacing(1)};
        `};
`;

const InputGroup = styled.div`
    display: flex;
    width: 100%;
    align-items: center;
`;

const InputLabel = styled.label`
    display: block;
    margin-block-end: ${(props) => props.theme.spacing(0.5)};
    color: ${(props) => props.theme.palette.common.white};
`;

const InputLabelInline = styled.label`
    display: inline;
    padding-right: 10px;
    margin-inline-start: ${(props) => props.theme.spacing(1)};
    color: ${(props) => props.theme.palette.common.white};
`;

const SpacedFormControlLabel = styled(FormControlLabel)`
    margin-inline-start: ${(props) => props.theme.spacing(1)};
`;

const InputField = styled(({ className, ...props }) => <TextField autoComplete={'off'} {...props} />)`
    && {
        ${(props) =>
            props.select &&
            `
                .MuiSelect-root {
                    display: flex;
                    line-height: 2rem;
                    align-items: center;
                }
        `};

        ${(props) =>
            props.InputProps && props.InputProps.endAdornment && `.MuiOutlinedInput-adornedEnd { padding-right: 0;}  `};
    }
`;

const InputFieldInlineWMargin = styled(TextField)`
    margin: 0px 15px 0px 0px;
    && {
        ${(props) =>
            props.select &&
            `
                .MuiSelect-root {
                    display: flex;
                    line-height: 2.5rem;
                    align-items: center;
                }
        `};

        ${(props) =>
            props.InputProps && props.InputProps.endAdornment && `.MuiOutlinedInput-adornedEnd { padding-right: 0;}  `};
    }
`;

const InputFieldInlineWMargin350 = styled(TextField)`
    width: 350px;
    margin: 0px 15px 15px 0px;
    && {
        ${(props) =>
            props.select &&
            `
                .MuiSelect-root {
                    display: flex;
                    line-height: 2.5rem;
                    align-items: center;
                }
        `};

        ${(props) =>
            props.InputProps && props.InputProps.endAdornment && `.MuiOutlinedInput-adornedEnd { padding-right: 0;}  `};
    }
`;

const InlineSelect = styled(Select)`
    height: 2.5em;
    margin-inline-start: ${(props) => props.theme.spacing(1)};
`;
const InlineSelectNarrow = styled(Select)`
    height: 2em;
    padding-left: 0.3rem;
    margin-inline-start: ${(props) => props.theme.spacing(1)};
    min-width: 8rem;
`;

const CheckBoxGroup = styled.section<IGutters>`
    display: flex;
    flex-direction: column;
    margin-block-start: ${(props) => props.theme.spacing(1)};
    margin-inline-start: ${(props) => props.theme.spacing(1)};

    ${(props) =>
        props.$bottomgutter &&
        `
            margin-block-end: ${props.theme.spacing(1)};
        `};
`;

const HorizontalCheckBoxGroup = styled.section<IGutters>`
    display: flex;
    ${(props) =>
        props.$bottomgutter &&
        `
            margin-block-end: ${props.theme.spacing(1)};
        `};
`;
const InlineSelectNoMargin = styled(Select)`
    margin: 0px;
    width: 100%;
`;
const InputLabelWMargin = styled.label`
    display: block;
    margin-block-end: ${(props) => props.theme.spacing(0.5)};
    color: ${(props) => props.theme.palette.common.white};
    margin-bottom: 5px;
`;
const ManagerMenuItem = styled(MenuItem)`
    height: 2.5em;
    margin-inline-start: ${(props) => props.theme.spacing(1)};
`;

const RadioGroup = styled(MuiRadioGroup)<IGutters>`
    margin-block-start: ${(props) => props.theme.spacing(1)};
    margin-inline-start: ${(props) => props.theme.spacing(1)};

    ${(props) =>
        props.$bottomgutter &&
        `
            margin-block-end: ${props.theme.spacing(1)};
        `};
`;

const Branding = styled.div`
    display: flex;
    align-items: center;
`;

const Logo = styled(Box)`
    width: 52px;
    height: 52px;
    margin: 0 1rem;
`;

const AppBar = styled(MuiAppBar)`
    padding: 0 0.5rem;
    overflow: hidden;
`;

export {
    WidgetContainer,
    WidgetHeader,
    WidgetContent,
    WidgetProgress,
    WidgetActions,
    WidgetButtonBox,
    ActionButton,
    ActionButtonBox,
    PopoverCardContent,
    PopoverCardImage,
    FieldGroup,
    FixedWidgetActions,
    InputGroup,
    InputLabel,
    InputLabelInline,
    InputField,
    InlineSelect,
    InlineSelectNarrow,
    CheckBoxGroup,
    HorizontalCheckBoxGroup,
    InlineSelectNoMargin,
    InputFieldInlineWMargin,
    InputFieldInlineWMargin350,
    InputLabelWMargin,
    ManagerMenuItem,
    RadioGroup,
    AppBar,
    Branding,
    Logo,
    SpacedFormControlLabel,
};
