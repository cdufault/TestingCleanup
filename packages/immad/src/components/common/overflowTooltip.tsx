import React, { useRef, useEffect, useState } from 'react';
import Typography, { TypographyProps } from '@mui/material/Typography';
import { Tooltip } from '@mui/material';

// const LightTooltip = withStyles((theme) => ({
//     tooltip: {
//         backgroundColor: theme.palette.common.white,
//         color: 'rgba(0, 0, 0, 0.87)',
//         boxShadow: theme.shadows[1],
//         fontSize: '16px',
//     },
// }))(Tooltip);

interface Props {
    value: string;
    gutterBottom: boolean;
    variant: TypographyProps['variant'];
}

function OverflowTooltip(props: Props): JSX.Element {
    const textElementRef = useRef<HTMLDivElement>(null);
    const [hoverStatus, setHoverStatus] = useState(false);

    useEffect(() => {
        compareSize();
        window.addEventListener('resize', compareSize);

        return () => {
            window.removeEventListener('resize', compareSize);
        };
    }, []);

    function compareSize(): void {
        if (textElementRef.current) {
            const compare = textElementRef.current.scrollWidth > textElementRef.current.clientWidth;
            setHoverStatus(compare);
        }
    }

    return (
        <Tooltip title={props.value} disableHoverListener={!hoverStatus}>
            <Typography
                ref={textElementRef}
                style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                gutterBottom={props.gutterBottom}
                variant={props.variant}
            >
                {props.value}
            </Typography>
        </Tooltip>
    );
}

export default OverflowTooltip;
