import styled from 'styled-components';

import {
    Box,
    Card,
    CardActions,
    CardContent,
    CircularProgress,
    CardMedia,
    ListItem,
    Pagination,
    Paper,
    Typography,
} from '@mui/material';
import FolderArchiveIcon from 'calcite-ui-icons-react/FolderArchiveIcon';

interface IFullWidth {
    fullWidth?: boolean;
}

const StyledPagination = styled(Pagination)`
    && {
        .MuiPagination-ul {
            flex-wrap: nowrap;
        }
    }
`;

const StyledButtonWrapper = styled.div<IFullWidth>`
    position: relative;

    ${(props) =>
        props.fullWidth &&
        `
            width: 100%;
        `};
`;

const StyledButtonProgress = styled(CircularProgress)`
    position: absolute;
    top: 50%;
    left: 50%;
    margin-top: -12px;
    margin-left: -6px;
`;

const StyledPopoverContent = styled(Paper)`
    color: ${(props) => props.theme.palette.primary.contrastText};
    background: ${(props) => props.theme.palette.primary.main};
    box-shadow: ${(props) => props.theme.shadows[1]};
`;

const StyledPopoverListItem = styled(ListItem)`
    padding-top: 0;
    padding-bottom: 0;
    color: ${(props) => props.theme.palette.primary.contrastText};
`;

const StyledClassificationMarkingText = styled(Typography)`
    padding: 0rem 0.5rem;
    font-size: x-small;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const StyledCard = styled(Card)`
    flex: 1 0 345px;
    display: flex;
    flex-direction: column;
`;

const StyledCardContent = styled(CardContent)`
    flex-grow: 1;
    padding: 0.5rem;
`;

const StyledCardMedia = styled(CardMedia)`
    height: 110px;
    min-width: 100px;
    border-radius: 4px;
    margin-right: 5px;
    margin-bottom: 5px;
    &:hover {
        cursor: pointer;
    }
`;

const StyledCardActions = styled(CardActions)`
    width: 100%;
`;

const StyledCardContentBox = styled(Box)`
    height: 100px;
    width: 235px;
`;

const StyledLaunchIconBox = styled(Box)`
    margin-right: auto;
    &:hover {
        cursor: pointer;
    }
`;

const StyledItemStatusBox = styled(Box)`
    width: 100%;
    height: 16px;
    display: flex;
    justify-content: flex-end;
    text-align: center;
`;

const StyledStatusBox = styled(Box)`
    display: flex;
    justify-content: space-between;
`;

const StyledItemMarkingBox = styled(Box)`
    border-radius: 20px;
    display: inline-flex;
    margin-right: 6px;
    padding: 1px 3px;
`;

const StyledItemClassificationBox = styled(Box)`
    display: block;
    border-radius: 4px;
    text-align: right;
    max-width: 200px;
`;

const StyledItemCreatedByBox = styled(Box)`
    padding-left: 5px;
`;

const StyledViewCountBox = styled(Box)`
    padding-left: 5px;
`;

const StyledInlineFlexBox = styled(Box)`
    display: inline-flex;
`;

const StyledIconBox = styled(Box)`
    margin-right: 5px;
`;

const StyledSpanBlock = styled.span`
    display: block;
`;

const StyledSpanForEllipsis = styled.span`
    display: block;
    line-height: 0.5;
    margin-bottom: 0.3rem;
`;

const StyledSpanEmptyBlock = styled.span`
    display: block;
    min-height: 1.365rem;
`;

const StyledBoxDisplayFlex = styled(Box)`
    display: flex;
`;

const StyledTypographyMarginTop = styled(Typography)`
    margin-top: 5px;
`;

const StyledTopicIcon = styled(FolderArchiveIcon)`
    margin: 0.3rem 0.6rem 0 0;
`;

export {
    StyledPagination,
    StyledButtonWrapper,
    StyledButtonProgress,
    StyledClassificationMarkingText,
    StyledPopoverContent,
    StyledPopoverListItem,
    StyledCard,
    StyledCardContent,
    StyledCardMedia,
    StyledCardActions,
    StyledCardContentBox,
    StyledItemStatusBox,
    StyledItemMarkingBox,
    StyledItemClassificationBox,
    StyledItemCreatedByBox,
    StyledViewCountBox,
    StyledInlineFlexBox,
    StyledStatusBox,
    StyledIconBox,
    StyledLaunchIconBox,
    StyledSpanBlock,
    StyledSpanForEllipsis,
    StyledSpanEmptyBlock,
    StyledBoxDisplayFlex,
    StyledTypographyMarginTop,
    StyledTopicIcon,
};
