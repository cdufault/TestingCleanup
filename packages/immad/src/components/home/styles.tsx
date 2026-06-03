import styled from 'styled-components';

import { AppBar as MuiAppBar, FieldGroup } from '../common/styles';
import { Link } from 'react-router-dom';
import { Badge, badgeClasses, Button, IconButton } from '@mui/material';
import { CalciteIcon } from '@esri/calcite-components-react';
import '@esri/calcite-components/dist/components/calcite-icon.js';
import '@esri/calcite-components/dist/calcite/calcite.css';

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

const Container = styled.main`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
`;

const AppBar = styled(MuiAppBar)`
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
`;

const StyledLink = styled(Link)`
    text-decoration: none;
`;

const StyledTextButtonExercise = styled(Button)<{ variant: 'contained' | 'outlined' }>`
    color: ${({ variant }) => (variant === 'outlined' ? '#d3b343' : 'black')};
    background-color: ${({ variant }) => (variant === 'contained' ? '#d3b343' : '#04a6d')};
    border-radius: 33.33px;
    border: ${({ variant }) => (variant === 'outlined' ? '1px solid #d3b343' : 'none')};

    &:hover {
        background-color: ${({ variant }) => (variant === 'contained' ? '#d3b343' : '#3D445B')};
    }
`;

const StyledTextButton = styled(Button)<{ variant: 'contained' | 'outlined' }>`
    color: ${({ variant }) => (variant === 'contained' ? 'white' : '#0daeff')};
    background-color: ${({ variant }) => (variant === 'contained' ? '#0daeff' : '#04a6d')};
    border-radius: 33.33px;
    border: ${({ variant }) => (variant === 'outlined' ? '1px solid #0daeff' : 'none')};

    &:hover {
        background-color: ${({ variant }) => (variant === 'contained' ? '#034a6d' : '#3D445B')};
    }
`;

const StyledFieldGroup = styled(FieldGroup)`
    padding-left: 5px;
    padding-right: 5px;
`;

const StyledPencilBadge = styled(Badge)<{ configured: boolean }>`
    & .${badgeClasses.badge} {
        top: -12px;
        right: -6px;
        color: ${({ configured }) => (configured ? 'green' : '#0daeff')};
    }
`;

const StyledIconButton = styled(IconButton)`
    color: #0daeff;
`;

const StyledIconButtonWithBadge = styled(StyledIconButton)`
    color: white;
    background-color: #0daeff;
    height: 35px;
    width: 35px;
    margin-left: 10px;
`;

const StyledFlatLeftIconButton = styled(IconButton)`
    color: white;
    background-color: #0daeff;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 33.33px;
    border-top-left-radius: 0;
    border-top-right-radius: 33.33px;
`;

const StyledFlatRightTextButton = styled(IconButton)`
    color: ${({ variant }) => (variant === 'contained' ? 'white' : '#0daeff')};
    background-color: ${({ variant }) => (variant === 'contained' ? '#0daeff' : '#04a6d')};
    border: ${({ variant }) => (variant === 'outlined' ? '1px solid #0daeff' : 'none')};

    &:hover {
        background-color: ${({ variant }) => (variant === 'contained' ? '#034a6d' : '#3D445B')};
    }
    border-bottom-left-radius: 33.33px;
    border-bottom-right-radius: 0;
    border-top-left-radius: 33.33px;
    border-top-right-radius: 0;
`;

export {
    Container,
    AppBar,
    StyledLink,
    StyledTextButton,
    StyledTextButtonExercise,
    StyledFieldGroup,
    StyledPencilBadge,
    StyledIconButton,
    StyledFlatLeftIconButton,
    StyledFlatRightTextButton,
    StyledIconButtonWithBadge,
    StyledCalciteIcon,
};
