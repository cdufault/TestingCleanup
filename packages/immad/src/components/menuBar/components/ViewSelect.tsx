// React imports
import React from 'react';

// Component imports
import { Grid, FormControl, Select, Hidden } from '@mui/material';

// Context Imports
import { useSaveLoadContext } from '../../../contexts/SaveLoad';

// Component
const ViewSelect = (): JSX.Element => {
    const saveLoadContext = useSaveLoadContext();

    const handleMissionChange = (event: any) => {
        saveLoadContext.setMissionSelect(event.target.value);
        console.debug('mission switched', false);
    };

    const handleViewChange = (event: any) => {
        saveLoadContext.setViewSelect(event.target.value);
        console.debug('view switched', false);
    };

    return (
        <Grid container columnSpacing={1} alignItems='center'>
            <Hidden smDown>
                <Grid item>
                    <Grid container columnSpacing={1} alignItems='center'>
                        <Grid item>Mission</Grid>
                        <Grid item>
                            <FormControl variant='outlined' disabled={saveLoadContext.disabledMissionSelect}>
                                <Select
                                    value={saveLoadContext.missionSelect}
                                    renderValue={(value: string) => {
                                        if (value.length > 20) {
                                            return `${value.substring(0, 17)}...`;
                                        }
                                        return value;
                                    }}
                                    onChange={handleMissionChange}
                                    title={'Select Mission to work on.'}
                                >
                                    {saveLoadContext.missionValues}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Grid>
            </Hidden>
            <Grid item>
                <Grid container columnSpacing={1} alignItems='center'>
                    <Grid item>Map</Grid>
                    <Grid item>
                        <FormControl variant='outlined' disabled={saveLoadContext.disabledViewSelect}>
                            <Select
                                // MenuProps={{ classes: { paper: classes.menuPaper } }}
                                value={saveLoadContext.viewSelect}
                                onChange={handleViewChange}
                                title='Select desired workspace.'
                            >
                                {saveLoadContext.workspaceValues}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
};

export default ViewSelect;
