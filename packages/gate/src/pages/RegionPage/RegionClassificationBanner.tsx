import React from 'react';
import Box from '@mui/material/Box';
import { CenterBox } from './MuiBoxStyles';
import { Typography } from '@mui/material';
import styled from '@emotion/styled';

const PlaceholderClassification = styled(CenterBox)`
    background-color: green;
    flex: 0 0 auto;
`;

/**Placeholder to represent the structure for data related to classification banner */
interface regionClassificationBannerProps {
    classification?: string;
}

/**A wrapper for the classification banner */
export const RegionClassificationBanner = (props: regionClassificationBannerProps): JSX.Element => {
    const { classification } = props;
    let defaultClassification = classification ?? 'Unclassified';
    return (
        <PlaceholderClassification>
            <Box>
                <Typography>{defaultClassification}</Typography>
            </Box>
        </PlaceholderClassification>
    );
};
export default RegionClassificationBanner;
