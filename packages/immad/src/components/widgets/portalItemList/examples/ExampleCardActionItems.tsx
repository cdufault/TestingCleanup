// React imports
import React from 'react';
import PortalItem from '@arcgis/core/portal/PortalItem';
import { StyledButtonWrapper } from '../styles';
import { Button } from '@mui/material';

/**
 * @param item this property can be optional but must exist, it is set by the card
 * @description any other props are optional and will be passed through, unmodified, from the card
 */
interface CardActionItemsProps {
    item?: PortalItem;
    setSelectedToolName?: React.Dispatch<React.SetStateAction<string>>;
}

function CardActionItems(props: CardActionItemsProps): JSX.Element {
    const { item, setSelectedToolName } = props;
    const { url, title } = item ? item : { url: '', title: '' };

    const handleViewInPortal = () => {
        window.open(url, '_blank');
    };

    const handleOpen = () => {
        setSelectedToolName && setSelectedToolName(title);
    };

    return (
        //contained by <CardActions> in the PortalItemCard UI
        <StyledButtonWrapper fullWidth>
            <Button variant='contained' color='secondary' onClick={handleViewInPortal}>
                View in Portal
            </Button>
            <Button variant='contained' color='secondary' onClick={handleOpen}>
                Open
            </Button>
        </StyledButtonWrapper>
    );
}

export default CardActionItems;
