// React imports
import React from 'react';

// Component imports
import Grid from '@mui/material/Grid';
import { Alert, AlertTitle } from '@mui/material';

function MissionManager(props: { active: boolean }): JSX.Element {
    return (
        <Grid
            container
            justifyContent='center'
            alignItems='center'
            style={{ display: props.active ? undefined : 'none' }}
        >
            <Alert severity='info'>
                <AlertTitle>Not Yet Implemented</AlertTitle>
                This page has not been implemented yet.
            </Alert>
        </Grid>
    );
}

export default MissionManager;
