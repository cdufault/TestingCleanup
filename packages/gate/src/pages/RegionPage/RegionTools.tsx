import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import HomeIcon from 'calcite-ui-icons-react/HomeIcon';
import { Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../data/store';
import { setRegionDisplayMode } from '../../ApplicationSlice';
import { setCountWidgetInitialized, setLegendInitializedId } from '../../features/Map/MapViewSlice';

const HomeIconButton = styled(IconButton)`
    color: white;
    width: 60px;
`;

/**Describes the props that may need to be passed to the tools in the regions view toolbar */
interface ToolProps {
    color?: string;
    height?: number | string;
    width?: number;
    tooltip?: string;
    enabled: boolean;
    nodeId?: string;
}

export const HomeCommand = (props: ToolProps): JSX.Element => {
    const dispatch: AppDispatch = useDispatch();
    const { tooltip } = props;

    /**
     * sets display state back to the default when btn is visible - btn is not shown in presentation mode
     */
    function homeClickHandler() {
        dispatch(setCountWidgetInitialized(false));
        dispatch(setRegionDisplayMode('Standard'));
    }

    return (
        <Tooltip title={tooltip} className='tooltip-home-button'>
            <HomeIconButton size='large' onClick={homeClickHandler}>
                <Link to={'/'} style={{ color: 'white', display: 'flex' }}>
                    <HomeIcon />
                </Link>
            </HomeIconButton>
        </Tooltip>
    );
};
