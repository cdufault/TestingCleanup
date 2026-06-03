import styled from 'styled-components';
import BasePagination from '@mui/material/Pagination';
import { Box, CircularProgress, DialogActions, ListItem, Paper } from '@mui/material';

interface IFullWidth {
    fullWidth?: boolean;
}

const Pagination = styled(BasePagination)`
    && {
        .MuiPagination-ul {
            flex-wrap: nowrap;
        }
    }
`;

const ButtonWrapper = styled.div<IFullWidth>`
    position: relative;

    ${(props) =>
        props.fullWidth &&
        `
            width: 100%;
        `};
`;

const ButtonProgress = styled(CircularProgress)`
    position: absolute;
    top: 50%;
    left: 50%;
    margin-top: -12px;
    margin-left: -6px;
`;

const PopoverContent = styled(Paper)`
    background: ${(props) => props.theme.palette.primary.main};
    box-shadow: ${(props) => props.theme.shadows[1]};
`;

const PopoverListItem = styled(ListItem)`
    padding-top: 0;
    padding-bottom: 0;
`;

const WidgetDialogActions = styled(DialogActions)`
    padding-right: 0px;
`;

const FeatureTypesContainer = styled(Box)`
    display: flex;
`;

export {
    Pagination,
    ButtonWrapper,
    ButtonProgress,
    PopoverContent,
    PopoverListItem,
    WidgetDialogActions,
    FeatureTypesContainer,
};
