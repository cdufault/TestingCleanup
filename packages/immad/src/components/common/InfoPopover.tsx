import React, { useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import InformationIcon from 'calcite-ui-icons-react/InformationIcon';
import styled from 'styled-components';
import { PopoverCardContent } from './styles';

/**
 * Typography component styled to support newline characters.
 */
const MultiLineTypography = styled(Typography)`
    white-space: pre-line;
`;

/**
 * The root popover element used as the anchor when the popover is displayed.
 */
const PopoverRoot = styled.div`
    height: 100%;
`;

/**
 * Styled Box with centered vertical alignment.
 */
const CenteredBox = styled(Box)`
    box-sizing: border-box;
    display: flex;
    height: 100%;
    vertical-align: middle;
`;

/**
 * Styled icon button with all padding removed.
 */
const CompactIconButton = styled(IconButton)`
    padding: 0px;
`;

/**
 * Defines the available properties used by the InfoPopover component.
 */
interface InfoPopoverProps {
    description: string;
    id?: string;
    size?: number;
}

/**
 * Generic popover component that displays an info button on the screen that generates
 * a textual popout when clicked.
 * @param props Properties for the InfoPopover of type InfoPopoverProps
 */
export default function InfoPopover(props: InfoPopoverProps): JSX.Element {
    const { description, id, size } = props;

    const anchorRef = useRef<HTMLDivElement>(null);

    const [open, setOpen] = useState<boolean>(false);

    return (
        <PopoverRoot ref={anchorRef}>
            <CenteredBox>
                <CompactIconButton onClick={() => setOpen(true)}>
                    <InformationIcon size={size} />
                </CompactIconButton>
            </CenteredBox>
            <Popover
                id={id}
                open={open}
                anchorEl={anchorRef.current}
                onClose={() => setOpen(false)}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
            >
                <Card>
                    <PopoverCardContent variant='outlined'>
                        <MultiLineTypography>{description}</MultiLineTypography>
                    </PopoverCardContent>
                </Card>
            </Popover>
        </PopoverRoot>
    );
}
