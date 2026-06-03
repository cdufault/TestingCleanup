import React, { useEffect } from 'react';
import Box from '@mui/material/Box';
import { Typography } from '@mui/material';
import { CenterBox, TabBox } from './MuiBoxStyles';

/**Shape of the props for MapPage */
interface MapPageProps {
    /**Portal item id for the region map */
    portalItemId?: string;
}

/**Template JSX for displaying the region default map in a flex layout tab */
export const MapPage = (props: MapPageProps): JSX.Element => {
    const { portalItemId } = props;

    useEffect(() => {
        if (portalItemId) {
            loadWebMap();
        }
    }, [portalItemId]);

    /**Load the map */
    async function loadWebMap() {
        //not implemented
    }
    return (
        <TabBox>
            <CenterBox>
                <Box sx={{ color: 'red' }}>
                    <Typography>Map Content</Typography>
                </Box>
            </CenterBox>
        </TabBox>
    );
};
