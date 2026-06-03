import { Grid, IconButton } from '@mui/material';
import styled from 'styled-components';

const BannerContainer = styled.div`
    background-color: ${(props) => props.theme.bannerColor};
    color: ${(props) => props.theme.textColor};
`;

const ClassificationContainer = styled.div`
    display: flex;
    flex-direction: row;
    padding: 2px;
    font-size: smaller;
`;

const MissingClassificationButton = styled(IconButton)`
    color: #ffdf00;
    padding: 2px;
    margin-bottom: 2px;
`;

const BannerColumn = styled(Grid)`
    padding: 0 !important;
`;

export { BannerColumn, BannerContainer, ClassificationContainer, MissingClassificationButton };
