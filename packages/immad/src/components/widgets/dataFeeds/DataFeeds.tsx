// React imports
import React from 'react';
// Component imports
import { WidgetContainer } from '../../common';
import PortalItemList from '../portalItemList';
import CardActionItems from './components/CardActionItems';

/**
 * DataFeeds widget
 * @constructor
 */
function DataFeeds(): JSX.Element {
    const itemsPerPage = 12;
    return (
        <WidgetContainer>
            <PortalItemList
                isSpatial={true}
                showFilter={true}
                showSearch={true}
                showSort={true}
                itemTypes={[
                    'Feature Service',
                    'Image Service',
                    'Scene Service',
                    'Layer',
                    'Map Service',
                    'Feature Collection',
                    'Stream Service',
                    'KML',
                    'Vector Tile Service',
                    'WMS',
                    'WFS',
                    'WMTS',
                ]}
                itemsPerPage={itemsPerPage}
                //tags={}
                cardActionsTemplate={<CardActionItems />}
            />
        </WidgetContainer>
    );
}

export default DataFeeds;
