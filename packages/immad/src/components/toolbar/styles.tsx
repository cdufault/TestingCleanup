import styled from 'styled-components';

import { default as MuiPaper } from '@mui/material/Paper';
import { default as MuiToggleButton } from '@mui/material/ToggleButton';
import { ToggleButtonGroup, IconButton } from '@mui/material';

const Paper = styled(MuiPaper)`
    border-top: 2px solid transparent;
    max-height: 86.75vh;
    display: flex;
    flex-wrap: wrap;
`;

const ToggleButton = styled(MuiToggleButton)`
    &:hover {
        background-color: ${(props) => props.theme.palette.secondary.main};
        color: ${(props) => props.theme.palette.primary.contrastText};
    }

    &.Mui-selected {
        background-color: ${(props) => props.theme.palette.primary.light};
        color: ${(props) => props.theme.palette.primary.contrastText};

        &:hover {
            background-color: ${(props) => props.theme.palette.secondary.main};
            color: ${(props) => props.theme.palette.primary.contrastText};
        }
    }
`;

const StyledToggleButtonGroup = styled(ToggleButtonGroup)`
    height: -webkit-fill-available;
    display: flex;
    flex-wrap: wrap;
`;

const StyledToolbarDrawer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    background-color: #181d26;
`;

const StyledIconButtonToolbarDrawer = styled(IconButton)`
    height: 100%;
`;

export { Paper, ToggleButton, StyledToggleButtonGroup, StyledToolbarDrawer, StyledIconButtonToolbarDrawer };
