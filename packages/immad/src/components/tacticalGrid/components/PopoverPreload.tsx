import React from 'react';
import { StyledDialog, StyledPopoverBox } from '../styles';

//this is required to load the css for styled components before the window is popped out
const PopoverPreload = (): JSX.Element => {
    return (
        <div aria-hidden='true' style={{ display: 'none' }}>
            <StyledPopoverBox></StyledPopoverBox>
            <StyledDialog open={false}></StyledDialog>
        </div>
    );
};

export default PopoverPreload;
