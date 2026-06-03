import { Backdrop, Box, ButtonGroup, Dialog } from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import styled from 'styled-components';
import MuiRadioGroup from '@mui/material/RadioGroup';
import ArrowBoldRightIcon from 'calcite-ui-icons-react/ArrowBoldRightIcon';

interface IGutters {
    $nogutters?: boolean;
    $bottomgutter?: boolean;
}

const StyledFullHeightDiv = styled.div`
    width: 100%;
    height: 100%;
`;

const StyledPopoverBox = styled(Box)`
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    max-height: 320px;
    width: 400px;
    overflow: auto;
    padding: 5px;
    border-style: solid;
    border-color: gray;
`;

const StratLeadSectionTitle = styled(Box)`
    margin-top: 10px;
`;
const FlexedBox = styled(Box)`
    display: flex;
`;

//these styles are applied in order, so evaluating overrides updated, etc.
const StyledAgGrid = styled(AgGridReact)`
    .row-updated {
        background-color: rgb(175, 0, 0, 0.3);
    }
    .row-locked {
        background-color: rgb(150, 150, 150, 0.3);
    }
    .row-evaluating {
        background-color: rgb(255, 140, 0, 0.3);
    }
    input[type='date']::-webkit-calendar-picker-indicator {
        background-color: gray;
    }
`;

const StyledDialog = styled(Dialog)`
    position: absolute !important;
    padding: 10px;
    border: gray 1px solid;
`;

const StyledStratLeadDialog = styled(Dialog)`
    position: absolute !important;
    padding: 10px;
    border: gray 1px solid;
`;

const StyledStratLeadSearchDialog = styled(Dialog)`
    position: absolute !important;
    padding: 10px;
    border: gray 1px solid;
`;

const RadioGroupStratLead = styled(MuiRadioGroup)<IGutters>`
    margin-block-start: ${(props) => props.theme.spacing(1)};

    ${(props) =>
        props.$bottomgutter &&
        `
            margin-block-end: ${props.theme.spacing(1)};
        `};
`;
const StyledBackdrop = styled(Backdrop)`
    position: absolute !important;
`;

const StyledArrowBoldRightIcon = styled(ArrowBoldRightIcon)`
    margin: 0 5px 0 5px;
    vertical-align: bottom;
`;

const StyledButtonGroup = styled(ButtonGroup)`
    border-width: 1px;
    border-style: solid;
    border-color: gray;
    vertical-align: middle;
    margin-left: 8px;
    margin-right: 8px;
`;

const StyledEndJustifiedBox = styled(Box)`
    display: flex;
    align-items: flex-end;
`;
export {
    StyledFullHeightDiv,
    StyledPopoverBox,
    FlexedBox,
    StratLeadSectionTitle,
    StyledAgGrid,
    StyledDialog,
    StyledBackdrop,
    StyledStratLeadDialog,
    RadioGroupStratLead,
    StyledArrowBoldRightIcon,
    StyledButtonGroup,
    StyledStratLeadSearchDialog,
    StyledEndJustifiedBox,
};
