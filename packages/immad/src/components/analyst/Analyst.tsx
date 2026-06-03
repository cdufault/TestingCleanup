// React imports
import React from 'react';

// Context imports
import { ToolbarProvider } from '../../contexts/Toolbar';

// Component imports
import Layout from '../layout';
import Toolbar from '../toolbar';
import Grid from '@mui/material/Grid';

// Resource imports
import { analystTools } from './resources';

function Analyst(props: { active: boolean }): JSX.Element {
    return (
        <Grid container direction='row' wrap='nowrap' style={{ display: props.active ? undefined : 'none' }}>
            <ToolbarProvider tools={analystTools}>
                <Toolbar />
                <Layout />
            </ToolbarProvider>
        </Grid>
    );
}

export default Analyst;
