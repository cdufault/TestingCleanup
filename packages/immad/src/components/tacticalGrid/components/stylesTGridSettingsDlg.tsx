import styled from 'styled-components';
import { IconButton } from '@mui/material';

const HamburgerIconButtonDiv = styled(IconButton)`
    color: white;
    padding-left: 0px;
    margin-top: 12px;
    margin-left: 5px;
`;

const IconButtonDiv = styled(IconButton)`
    color: white;
    padding-left: 0px;
    padding-right: 10px;
`;
const NoIconDiv = styled(IconButton)`
    color: white;
    padding-left: 0px;
    padding-right: 20px;
`;

const TwoColumnGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    margin-bottom: 10px;
`;

const ContentBody = styled.div`
    min-width: 8rem;
`;

export { TwoColumnGrid, HamburgerIconButtonDiv, IconButtonDiv, NoIconDiv, ContentBody };
