// React imports
import React, { useState, useEffect } from 'react';

// Component imports
import { UserRoles } from '../../../contexts/App';

import { Grid, ToggleButtonGroup } from '@mui/material';

// Type imports
import { ToolsetType } from '../../../types/ToolsetType';

// Style imports
import { ToggleButton } from '../styles';
import { useHistory } from 'react-router-dom';

interface Props {
    userRoles: UserRoles;
    handleToolsetChange: (newToolset: ToolsetType) => void;
}

// Component
const ToolsetToggle = (props: Props): JSX.Element => {
    // State
    const history = useHistory();
    const [toolset, setToolset] = useState<ToolsetType>(ToolsetType.undefined);
    const [activeToolsets, setActiveToolsets] = useState({
        analyst: false,
    });

    // Effects
    const { userRoles } = props;
    useEffect(() => {
        setActiveToolsets({
            analyst: userRoles.Analyst !== false,
        });
        setToolset(ToolsetType.ANALYST);
        props.handleToolsetChange(ToolsetType.ANALYST);
    }, [userRoles]);

    // Event Handles
    const handleToolsetChange = (event: any, newToolset: ToolsetType) => {
        // ensure a tool is always selected
        if (newToolset !== null) {
            if (newToolset === 0) {
                history.push({
                    pathname: '/administration',
                    state: {
                        active: true,
                    },
                });
            } else {
                setToolset(newToolset);
                props.handleToolsetChange(newToolset);
            }
        }
    };

    // Component
    return (
        <Grid container spacing={1} alignItems='center'>
            <Grid item>
                <ToggleButtonGroup
                    value={toolset}
                    onChange={handleToolsetChange}
                    exclusive
                    size='small'
                    aria-label='Toolsets'
                >
                    {activeToolsets.analyst && (
                        <ToggleButton value={ToolsetType.ANALYST} aria-label='Analyst Tools'>
                            Analyst
                        </ToggleButton>
                    )}
                </ToggleButtonGroup>
            </Grid>
        </Grid>
    );
};

export default ToolsetToggle;
