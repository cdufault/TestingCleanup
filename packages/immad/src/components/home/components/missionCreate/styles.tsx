import styled from 'styled-components';

import Typography from '@mui/material/Typography';
import MuiStepper from '@mui/material/Stepper';
import MuiButton from '@mui/material/Button';
import CardMedia from '@mui/material/CardMedia';
import FilePitemxIcon from 'calcite-ui-icons-react/FilePitemxIcon';
import FolderArchiveIcon from 'calcite-ui-icons-react/FolderArchiveIcon';
import { Autocomplete, Box, Card, CardActions, CardContent, Slider } from '@mui/material';
import { FieldGroup } from '../../../common';
import { StyledTextButton } from '../../styles';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    padding: 1rem;
    overflow: hidden;
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    margin-block-end: 1rem;
    padding-block-end: 1rem;
    border-block-end: 1px solid rgba(255, 255, 255, 0.15);
`;

const Title = styled(Typography)`
    margin-inline-start: 1.5rem;
`;

const Section = styled.section`
    display: flex;
    width: 100%;
    height: 100%;
    overflow: hidden;
`;

const Aside = styled.aside`
    width: 20rem;
`;

const Stepper = styled(MuiStepper)`
    background: transparent;

    & .MuiStepIcon-root {
        color: ${(props) => props.theme.palette.primary.main};
    }

    & .MuiStepIcon-root.MuiStepIcon-active {
        color: ${(props) => props.theme.palette.secondary.main};
    }

    & .MuiStepIcon-root.MuiStepIcon-completed {
        color: ${(props) => props.theme.palette.success.main};
    }
`;

const FormView = styled.form`
    display: flex;
    flex-direction: column;
    width: 85%;
    height: 100%;
`;

const StepView = styled.div`
    width: 100%;
    overflow: auto;
    margin-block-end: 1rem;
    background: ${(props) => props.theme.palette.primary.dark};
    display: flex;
    flex-direction: column;
    flex: 1;
`;

const Actions = styled.div`
    display: flex;
    justify-content: flex-end;
    width: 100%;
    gap: 0.5rem;
`;

const Button = styled(MuiButton)`
    margin-inline-start: 1rem;
`;

const StyledStratLeadExpirationContainer = styled.div`
    display: flex;
    flex: 1;
    flex-wrap: nowrap;
    margin: 5px;
    justify-content: space-evenly;
`;

const StyledStratLeadExpirationSliderContainer = styled.div`
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    margin-right: 15px;
`;

const StyledExpirationSlider = styled(Slider)`
    color: #90caf9;
`;

const StyledCardMediaPng = styled(CardMedia)`
    height: 100px;
    width: 100px;
`;

const StyledMissionIcon = styled(FilePitemxIcon)`
    margin: 0 0.6rem 0 0;
`;

const StyledTopicIcon = styled(FolderArchiveIcon)`
    margin: 0.3rem 0.6rem 0 0;
`;

const StyledSpanBlock = styled.span`
    display: block;
`;

const StyledSpanForEllipsis = styled.span`
    display: block;
    line-height: 1;
    margin-bottom: 0.3rem;
`;

const StyledSpanEmptyBlock = styled.span`
    display: block;
    min-height: 1.365rem;
`;

const StyledCardRoot = styled(Card)`
    display: flex;
    width: 380px;
    flex-direction: column;
    margin: 20px 10px 10px 10px;
    height: 245px;
    border: 1px solid white;
`;

const StyledHeadingDiv = styled.div`
    display: flex;
    flex-direction: row;
`;

const StyledBoxCardHeader = styled(Box)`
    display: flex;
    flex-direction: column;
    margin: 16px 16px 10px 10px;
    width: 70%;
`;

const StyledTypographyTitle = styled(Typography)`
    font-weight: 600;
`;

const StyledTypographyMarginTop = styled(Typography)`
    margin-top: 5px;
`;

const StyledCardContentNoTopPadding = styled(CardContent)`
    padding-top: 0;
`;

const StyledCardActions = styled(CardActions)`
    padding: 0 8px 8px 16px;
`;

const StyledBoxAnalystGridParentDisplayFlex = styled(Box)`
    display: flex;
    height: 90%;
    width: 100%;
    justify-content: space-between;
    padding: 4px;
`;

const StyledBoxAllAnalystGrid = styled(Box)`
    height: 100%;
    width: 70%;
`;

const StyledBoxFullWidth = styled(Box)`
    width: 100%;
    display: flex;
    justify-content: flex-start;
`;

const StyledBoxDisplayFlex = styled(Box)`
    display: flex;
`;

const StyledBoxSelectedAnalystGrid = styled(Box)`
    height: 100%;
    width: 29%;
`;

const StyledBox50PWideGrid = styled(Box)`
    height: 300px;
    width: 50%;
    margin-top: 1.5rem;
    margin-bottom: 2.5rem;
`;

const MissionCreationOutput = styled(Box)`
    width: 80%;
    margin: 10px 0 0 40px;
`;

const StyledBoxCategoryContainer = styled(Box)`
    margin: 0;
    min-width: 120px;
    max-width: 800px;
`;

const StyledMissionEditButton = styled(Button)`
    margin-top: -4px;
`;

const StyledShiftButtonsToLeftSideOfDialogDiv = styled.div`
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
`;

const StyledButtonRightMargin = styled(Button)`
    margin-right: 10px;
`;

const StyledAutocomplete = styled(Autocomplete)`
    margin-top: -5px;
    min-width: 200px;
    height: 30px;
`;

const StyledCenterCircularProgressDiv = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: inherit;
`;

const StyledFieldGroupFixedSize = styled(FieldGroup)`
    padding-left: 5px;
    padding-right: 5px;
`;

const StyledFlexDiv = styled.div`
    display: flex;
`;

const StyledButtonsDiv = styled.div`
    padding: 0 5px 0 5px;
    gap: 20px;
    display: flex;
    flex-direction: column;
`;

const StyledTextExerciseButton = styled(Button)<{ variant: 'contained' | 'outlined' }>`
    color: ${({ variant }) => (variant === 'outlined' ? '#d3b343' : 'black')};
    background-color: ${({ variant }) => (variant === 'contained' ? '#d3b343' : '#04a6d')};
    border-radius: 33.33px;
    border: ${({ variant }) => (variant === 'outlined' ? '1px solid #d3b343' : 'none')};

    &:hover {
        background-color: ${({ variant }) => (variant === 'contained' ? '#d3b343' : '#3D445B')};
    }
    width: 215px;
`;

const StyledTextCreateButton = styled(Button)<{ variant: 'contained' | 'outlined' }>`
    color: ${({ variant }) => (variant === 'contained' ? 'white' : '#0daeff')};
    background-color: ${({ variant }) => (variant === 'contained' ? '#0daeff' : '#04a6d')};
    border-radius: 33.33px;
    border: ${({ variant }) => (variant === 'outlined' ? '1px solid #0daeff' : 'none')};

    &:hover {
        background-color: ${({ variant }) => (variant === 'contained' ? '#034a6d' : '#3D445B')};
    }
    width: 215px;
`;

const StyledAcivityCountsButtons = styled(StyledTextButton)`
    width: 80%;
`;

export {
    Container,
    Header,
    Title,
    Section,
    Aside,
    Stepper,
    FormView,
    StepView,
    Actions,
    Button,
    StyledStratLeadExpirationContainer,
    StyledStratLeadExpirationSliderContainer,
    StyledExpirationSlider,
    StyledCardMediaPng,
    StyledMissionIcon,
    StyledTopicIcon,
    StyledSpanBlock,
    StyledSpanForEllipsis,
    StyledCardRoot,
    StyledHeadingDiv,
    StyledBoxCardHeader,
    StyledSpanEmptyBlock,
    StyledTypographyTitle,
    StyledTypographyMarginTop,
    StyledCardContentNoTopPadding,
    StyledCardActions,
    StyledBoxAnalystGridParentDisplayFlex,
    StyledBoxAllAnalystGrid,
    StyledBox50PWideGrid,
    StyledBoxFullWidth,
    StyledBoxDisplayFlex,
    StyledBoxSelectedAnalystGrid,
    MissionCreationOutput,
    StyledBoxCategoryContainer,
    StyledMissionEditButton,
    StyledShiftButtonsToLeftSideOfDialogDiv,
    StyledButtonRightMargin,
    StyledAutocomplete,
    StyledCenterCircularProgressDiv,
    StyledFieldGroupFixedSize,
    StyledFlexDiv,
    StyledButtonsDiv,
    StyledTextExerciseButton,
    StyledTextCreateButton,
    StyledAcivityCountsButtons,
};
