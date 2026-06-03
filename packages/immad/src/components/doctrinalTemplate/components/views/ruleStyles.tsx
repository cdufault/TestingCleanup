import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import styled from 'styled-components';

/**
 * A MenuItem element with centered content.
 */
export const CenteredMenuItem = styled(MenuItem)`
    justify-content: center;
`;

/**
 * A Select element with centered content
 */
export const CenteredSelect = styled(Select)`
    text-align: center;
    height: 100%;
    width: 100%;
`;

/**
 * A customized AccordionDetails component used by the RuleView.
 */
export const RuleDetails = styled(AccordionDetails)`
    padding: ${(props) => props.theme.spacing(1)};
`;

/**
 * A customized AccordionSummary component used by the RuleView.
 */
export const RuleHeader = styled(AccordionSummary)`
    padding: 0px ${(props) => props.theme.spacing(1)};

    &.MuiAccordionSummary-root.Mui-expanded {
        min-height: auto;
    }

    & .MuiAccordionSummary-content {
        margin: 0px;
    }
`;
