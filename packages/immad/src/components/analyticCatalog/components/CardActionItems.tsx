// React imports
import React from 'react';
import PortalItem from '@arcgis/core/portal/PortalItem';
import { ButtonWrapper } from '../styles';
import { Button } from '@mui/material';

interface CardActionItemsProps {
    item?: PortalItem;
    setSelectedTool?: React.Dispatch<React.SetStateAction<PortalItem>>;
}

function CardActionItems(props: CardActionItemsProps): JSX.Element {
    const { item, setSelectedTool } = props;

    const handleOpen = () => {
        item && setSelectedTool && setSelectedTool(item);
    };

    return (
        <ButtonWrapper fullWidth>
            <Button color='secondary' variant='contained' fullWidth disabled={!item?.loaded} onClick={handleOpen}>
                Open
            </Button>
        </ButtonWrapper>
    );
}

export default CardActionItems;
