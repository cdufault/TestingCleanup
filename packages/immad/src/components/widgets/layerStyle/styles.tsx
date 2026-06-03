import styled from 'styled-components';
import { Box, Button, Paper, Radio, Typography } from '@mui/material';
import { InputField } from '../../common';

const PreviewPanel = styled('div')`
    box-sizing: border-box;
    display: flex;
    height: 100%;
    vertical-align: middle;
    padding-left: 45%;
    padding-top: 10px;
    padding-bottom: 10px;
`;

const StyledSymbolPaper = styled(Paper)`
    background: ${(props) => props.theme.palette.primary.light};
    width: 48px;
    height: 48px;
`;

const StyledSymbolImage = styled.img`
    width: 48px;
    height: 48px;
`;

const StyledSymbolText = styled(Typography)`
    padding: 1rem;
`;

const StyledBoxMarginTopBottom = styled(Box)`
    margin: 10px 0;
`;

const StyledRadio = styled(Radio)`
    padding: 0 9px;
`;

const StyledWidthInputField = styled(InputField)`
    width: 250px;
`;

// The alpha .23 value is to mimic the outlined variant in mui
// Slider does not have that option natively
const StyledSliderContainer = styled.div`
    border-radius: 5px;
    border: 1px solid rgba(255, 255, 255, 0.23);
    padding: 5px 20px;
`;

const StyledImageIconDiv = styled.div`
    width: 48px;
    height: 48px;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
`;

const StyledImgDiv32pX = styled.img`
    width: 32px;
    height: 32px;
`;

const StyledButton48pxSquare = styled(Button)`
    width: 48px;
    height: 48px;
    padding: 0;
    min-width: 48px;
    min-height: 48px;
`;

export {
    PreviewPanel,
    StyledSymbolPaper,
    StyledSymbolText,
    StyledSymbolImage,
    StyledWidthInputField,
    StyledSliderContainer,
    StyledImageIconDiv,
    StyledImgDiv32pX,
    StyledButton48pxSquare,
    StyledBoxMarginTopBottom,
    StyledRadio,
};
