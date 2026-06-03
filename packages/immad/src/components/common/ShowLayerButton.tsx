import React from 'react';

import { ActionButton } from './index';
import Map from '@arcgis/core/Map';

export const ShowLayerButton = (props: { map: Map; layerId: string }): JSX.Element => {
    const { map, layerId } = props;
    return (
        <ActionButton
            variant='outlined'
            onClick={() => {
                if (map) {
                    const lyr = map.findLayerById(layerId);
                    if (lyr) {
                        lyr.visible = true;
                    }
                }
            }}
        >
            Show Layer
        </ActionButton>
    );
};
export default ShowLayerButton;
