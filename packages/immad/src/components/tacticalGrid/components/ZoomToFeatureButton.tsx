// React imports
import React from 'react';

//Component imports
import MagnifyingGlassPlusIcon from 'calcite-ui-icons-react/MagnifyingGlassPlusIcon';
import IconButton from '@mui/material/IconButton/IconButton';
import TacticalGridActionMenu from './TacticalGridActionMenu';

interface ZoomButtonProps {
    context: any;
    data: any;
}

function ZoomToFeatureButton(props: ZoomButtonProps): JSX.Element {
    const { context, data } = props;

    return (
        //pass back the entire object - not just the data.objectId since there is not guarantee that the field with
        //the alias name objectid is the real OID field - click handler previously passsed back data.objectid
        <>
            <IconButton size='small' onClick={() => context.zoomToFeature(data)} title='Zoom to'>
                <MagnifyingGlassPlusIcon size={20} />
            </IconButton>
            <TacticalGridActionMenu fieldsData={data} />
        </>
    );
}

export default ZoomToFeatureButton;
