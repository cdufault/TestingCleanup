import { ListItemIcon, IconButton, MenuItem, Typography, ButtonGroup } from '@mui/material';
import styled from 'styled-components';
import TextField from '@mui/material/TextField';
import { CalciteIcon } from '@esri/calcite-components-react';

// Shared Style Variables
const COLORS = {
    background: '#272c31',
    hover: '#2d4254',
    lightGray: '#d9d9d9',
    accent: '#0daeff',
    darkGray: '#333b42',
    highlight: 'rgba(13, 174, 255, 0.25)',
};

const DIMENSIONS = {
    handleSize: '24px',
    iconButtonMinWidth: '60px',
    iconHeight: '122px',
    itemMinHeight: '142px',
};

const StyledCalciteIcon = styled(CalciteIcon)`
    height: ${DIMENSIONS.handleSize};
    width: ${DIMENSIONS.handleSize};
    color: ${COLORS.accent};
`;

const StyledCalciteIconWrapperDiv = styled.div`
    width: 60px;
    height: 40px;
    display: flex;
    justify-content: space-around;
    align-items: center;
    &:hover {
        background-color: ${COLORS.hover};
        border-radius: 0;
    }
`;

// Styled Components
const StyledMenuListDiv = styled.div`
    background-color: ${COLORS.background};
    border-radius: 8px;
    max-width: 600px;
`;

const StyledMenuItemCentered = styled(MenuItem)`
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: ${COLORS.background};
    min-height: 80px;
    min-width: 600px;
    color: ${COLORS.accent};
    border-radius: 0;
    &:hover {
        background-color: ${COLORS.hover};
        border-radius: 0;
    }
`;

const StyledListItemDiv = styled.div`
    display: flex;
    width: 100%;
    align-items: center;
`;

const StyledListItemIcon = styled(ListItemIcon)`
    height: ${DIMENSIONS.iconHeight};
    width: 195.19px;
    max-height: ${DIMENSIONS.iconHeight};
    max-width: 195.19px;
    background-color: ${COLORS.lightGray};
`;

const StyledIconButtonContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: ${DIMENSIONS.iconHeight};
    min-width: ${DIMENSIONS.iconButtonMinWidth};
    justify-content: space-evenly;
`;

const StyledBookmarkHandleBarDiv = styled.div`
    height: ${DIMENSIONS.handleSize};
    width: ${DIMENSIONS.handleSize};
    cursor: grab;
`;

const StyledIconButton = styled(IconButton)`
    color: ${COLORS.accent};
    border-radius: 0;
    &:hover {
        background-color: ${COLORS.highlight};
    }
`;

const StyledTextField = styled(TextField)`
    width: 100%;
    margin: 0 10px;
    min-width: 250px;
`;

const StyledBookmarkTypography = styled(Typography)`
    cursor: pointer;
    word-wrap: break-word;
    white-space: pre-wrap;
    padding: 15px 24px 12px;
    line-height: 1.44;
    display: grid;
    place-items: center;
    width: 100%;
`;

const StyledEverythingDiv = styled.div`
    max-height: 80vh;
    padding: 10px 0;
    gap: 0;
    display: flex;
    flex-direction: column;
    background-color: ${COLORS.background};
`;

const StyledMenuAllDiv = styled.div`
    height: 100%;
    overflow: auto;
`;

const StyledBookmarkButtonGroup = styled(ButtonGroup)`
    padding-right: 0.5rem;
`;

const StyledBookmarkItemMainDiv = styled.div`
    display: flex;
    align-items: center;
    padding: 8px;
    margin-bottom: 4px;
`;

// Export Components
export {
    StyledTextField,
    StyledMenuListDiv,
    StyledCalciteIcon,
    StyledMenuItemCentered,
    StyledListItemDiv,
    StyledListItemIcon,
    StyledIconButtonContainer,
    StyledIconButton,
    StyledBookmarkHandleBarDiv,
    StyledBookmarkTypography,
    StyledEverythingDiv,
    StyledBookmarkButtonGroup,
    StyledBookmarkItemMainDiv,
    StyledMenuAllDiv,
    StyledCalciteIconWrapperDiv,
};
