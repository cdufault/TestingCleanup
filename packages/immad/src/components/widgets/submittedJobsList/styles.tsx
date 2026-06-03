import { Box, Card, CardContent, CardHeader, Typography } from '@mui/material';
import styled from 'styled-components';

const JobCard = styled(Card)`
    margin: ${1};
`;

const JobCardHeader = styled(CardHeader)`
    text-align: ${'center'};
    padding: ${1};
`;

const JobCardContent = styled(CardContent)`
    padding: ${1};
`;

const JobText = styled(Typography)`
    display: ${'inline-block'};
    padding: ${1};
`;

const CenterBox = styled(Box)`
    display: ${'flex'};
    align-items: ${'center'};
`;

const StyledJobStatusBox = styled(Box)`
    border: ${'1px solid white'};
    color: ${(props) => props.theme.palette.common.white};
    background-color: ${(props) => props.theme.palette.primary.main};
    padding: ${'3px'};
    height: ${'200px'};
    overflow: ${'auto'};
    width: ${'100%'};
`;

const StyledJobResultsBox = styled(Box)`
    display: ${'flex'};
    flex-direction: ${'row'};
    padding: ${'3px'};
`;

const StyledBlockBox = styled(Box)`
    display: ${'block'};
`;
const StyledFlexBox = styled(Box)`
    display: ${'flex'};
`;
const StyledFlexGrowBox = styled(Box)`
    display: ${'flex'};
    flex-grow: ${1};
`;
const StyledGrowBox = styled(Box)`
    flex-grow: ${1};
`;
const StyledFullWidthBox = styled(Box)`
    width: ${'100%'};
`;
const StyledPaddedBox = styled(Box)`
    padding-right: ${0.5};
`;

export {
    JobCard,
    JobCardHeader,
    JobCardContent,
    JobText,
    CenterBox,
    StyledJobStatusBox,
    StyledJobResultsBox,
    StyledBlockBox,
    StyledFlexBox,
    StyledFlexGrowBox,
    StyledFullWidthBox,
    StyledPaddedBox,
    StyledGrowBox,
};
