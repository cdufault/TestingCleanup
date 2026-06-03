import styled from 'styled-components';

import Button from '@mui/material/Button';
import { AppBar, FieldGroup } from '../common/styles';
import Typography from '@mui/material/Typography';
import MuiAccordionSummary, { AccordionSummaryProps } from '@mui/material/AccordionSummary';
import ChevronRightIcon from 'calcite-ui-icons-react/ChevronDownIcon';
import React from 'react';
import Accordion from '@mui/material/Accordion';
import TableCell from '@mui/material/TableCell';
import DialogContent from '@mui/material/DialogContent';
import { AccordionSummary, Box, CircularProgress, FormControl, Select } from '@mui/material';
import SuccessIcon from 'calcite-ui-icons-react/CheckIcon';

const StyledSpaceBetweenRow = styled.div`
    display: flex;
    width: 100%;
    height: 100%;
    justify-content: space-between;
`;

const StyledFieldGroupStyled = styled(FieldGroup)`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    margin-bottom: 1rem;
`;

const StyledFieldGroupSelect = styled(FieldGroup)`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-width: 120px;
    margin-bottom: 1rem;
`;

const StyledWrappingDiv = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
`;

const StyledMainSettingsContainer = styled.main`
    display: flex;
    width: 80%;
    height: 100%;
    margin: auto;
`;

const StyledAdminAppBar = styled(AppBar)`
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 0 0.5rem;
    overflow: hidden;
`;

const StyledDivBranding = styled.div`
    display: flex;
    align-items: center;
`;

const StyledRightButton = styled(Button)`
    float: right;
    margin-inline-start: 10px;
`;

const StyledRightButtonAccordionSummary = styled(StyledRightButton)`
    padding-bottom: 0;
    padding-top: 0;
`;

const StyledSplitDivContainer = styled.div`
    display: flex;
    justify-content: space-between;
`;
const StyledLeftSideDiv = styled.div`
    width: 25%;
    height: 100%;
`;
const StyledRightSideDiv = styled.div`
    width: 75%;
    height: 100%;
`;

const StyledParameterDivContainer = styled.div`
    display: flex;
    width: 70%;
    flex-direction: column;
`;

const StyledRowContainer = styled.div`
    display: flex;
    flex-direction: row;
`;

const StyledFlexTypography = styled(Typography)`
    flex: '1 1 100%';
`;

function ChevronRightAccordionSummary(props: AccordionSummaryProps): JSX.Element {
    return <MuiAccordionSummary expandIcon={<ChevronRightIcon />} {...props} />;
}

const StyledMuiAccordionSummary = styled(ChevronRightAccordionSummary)`
    flex-direction: row-reverse;
    padding-left: 0;
    .MuiAccordionSummary-content {
        justify-content: space-between;
    }
`;

const StyledMuiAccordion = styled(Accordion)`
    &.MuiAccordion-root.Mui-expanded {
        margin-top: 0;
    }
    .MuiAccordionDetails-root {
        padding-left: 0;
    }
`;

const StyledMuiTableCell = styled(TableCell)`
    &.MuiTableCell-sizeSmall {
        padding-left: 0;
    }
`;

const StyledDivCentered = styled.div`
    display: flex;
    justify-content: center;
`;

const StyledDialogContent = styled(DialogContent)`
    min-width: 400px;
`;
const StyledCircularProgress = styled(CircularProgress)`
    margin: 20px;
`;

const StyledSuccessIcon = styled(SuccessIcon)`
    width: 100px;
    height: 100px;
`;

const StyledPortalItemSelect = styled.div`
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
`;

const StyledRMTInputBox = styled(Box)`
    margin-top: 5px;
    display: flex;
    width: 100%;
`;

const StyledRMTMessageTypeInputBox = styled(Box)`
    margin-top: 5px;
`;

const StyledRMTItemUIBox = styled(Box)`
    margin-top: 15px;
    display: flex;
`;

const StyledActionPhraseBox = styled(Box)`
    margin-top: 15px;
`;

const StyledWidgetWrapperBox = styled(Box)`
    margin-top: 15px;
`;

const StyledErrorTextBox = styled(Box)`
    color: ${(props) => props.theme.palette.error.main};
    text-align: right;
    font-family: Arial, sans-serif;
    font-weight: 400;
    font-size: 0.8571428rem;
    line-height: 0.857;
    margin-bottom: 15px;
    margin-right: 20px;
`;

const RMTButton = styled(Button)`
    margin-top: 15px;
`;

const StyledPortalItemSelectBox = styled(Box)`
    margin-top: 1em;
`;

const StyledFormControl = styled(FormControl)`
    margin-top: 20px;
`;

const StyledSelect = styled(Select)`
    height: 45px;
`;

const StyledAccordion = styled(Accordion)`
    margin-top: 0;
`;

const StyledAccordionSummary = styled(AccordionSummary)`
    margin-bottom: -10px;
`;

const StyledHeaderBox = styled(Box)`
    position: sticky;
    top: 0;
    background-color: #181d26 !important;
    z-index: 1000;
`;

const StyledRMTContainer = styled.div`
    overflow: auto;
    height: 60vh;
`;

export {
    StyledFieldGroupStyled,
    StyledFieldGroupSelect,
    StyledAdminAppBar,
    StyledDivBranding,
    StyledMainSettingsContainer,
    StyledRightButton,
    StyledWrappingDiv,
    StyledSplitDivContainer,
    StyledLeftSideDiv,
    StyledRightSideDiv,
    StyledParameterDivContainer,
    StyledRowContainer,
    StyledSpaceBetweenRow,
    StyledFlexTypography,
    StyledMuiAccordionSummary,
    StyledRightButtonAccordionSummary,
    StyledMuiAccordion,
    StyledMuiTableCell,
    StyledDivCentered,
    StyledDialogContent,
    StyledSuccessIcon,
    StyledCircularProgress,
    StyledPortalItemSelect,
    StyledRMTInputBox,
    StyledRMTMessageTypeInputBox,
    StyledRMTItemUIBox,
    StyledActionPhraseBox,
    StyledWidgetWrapperBox,
    StyledErrorTextBox,
    RMTButton,
    StyledPortalItemSelectBox,
    StyledFormControl,
    StyledSelect,
    StyledAccordion,
    StyledAccordionSummary,
    StyledHeaderBox,
    StyledRMTContainer,
};
