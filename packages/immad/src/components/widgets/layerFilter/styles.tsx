import styled from 'styled-components';
import { makeStyles } from '@mui/styles';
import { InputField } from '../../common';
import DatePicker from 'react-datepicker';
import { Button, Paper, Select, ToggleButton } from '@mui/material';
import React from 'react';

const useStyles = makeStyles({
    input: {
        '& .MuiInputBase-root': {
            height: '100%',
            display: 'flex',
            alignItems: 'flex-start',
        },
    },
});

const AddFilterGroupDiv = styled.div`
    padding: 5px;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const FilterExpressionSelect = styled(Select)`
    height: 2.5em;
    margin: ${(props) => props.theme.spacing(1)};
`;

const StyledInlineToggleButton = styled(({ className, ...props }) => <ToggleButton {...props} />)`
    margin-inline-end: 1rem;
    color: ${(props) => props.theme.palette.common.white};
`;

const StyledInsetDiv = styled.div`
    padding: 15px;
    border: 2px solid ${(props) => props.theme.palette.primary.light};
    border-radius: 4px;
`;

const StyledGroupContent = styled(Paper)`
    width: 100%;
    height: 100%;
    overflow: auto;
    padding: ${(props) => props.theme.spacing(1)};
    border: 2px solid ${(props) => props.theme.palette.primary.light};
    border-radius: 4px;
`;

const StyledGroupActions = styled.div`
    display: inline-flex;
    justify-content: flex-end;
    align-items: center;
    width: 100%;
    margin-top: 15px;
    padding: ${(props) => props.theme.spacing(1)};
`;

const StyledInput = styled(InputField)`
    min-width: 80px;
    width: auto;
    max-width: 120px;
`;

const StyledClause = styled.div`
    display: flex;
    padding: 5px;
    width: 100%;
`;

const StyledSubclause = styled.div`
    display: flex;
    flex-grow: 1;
    text-align: center;
`;

const StyledExpressionListDiv = styled.div`
    flex-direction: column;
    display: flex;
    justify-content: center;
    width: 100%;
`;

const StyledSquareIconButton = styled(Button)`
    min-width: 48px;
    border: 1px solid ${(props) => props.theme.palette.primary.light};
    border-radius: 4px;
`;

const StyledDatePicker = styled(DatePicker)`
    border-style: solid;
    border-width: 1px;
    border-color: dimgray;
    border-radius: 2px;
    text-align: center;
    height: 100%;
    width: 100%;
`;

export {
    AddFilterGroupDiv,
    FilterExpressionSelect,
    StyledInlineToggleButton,
    StyledInsetDiv,
    StyledInput,
    StyledClause,
    StyledSubclause,
    StyledExpressionListDiv,
    StyledSquareIconButton,
    StyledGroupContent,
    StyledGroupActions,
    StyledDatePicker,
    useStyles,
};
