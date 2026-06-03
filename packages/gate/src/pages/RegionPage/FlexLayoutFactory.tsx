import React from 'react';
import { AnalystCommentsWidget } from '../../Share/AnalystCommentsWidget';
import WebMapView from '../../features/Map/WebMapView';
import { AddNewTab } from './AddNewTab';
import { CountsWidgetShared } from '../../Share/CountsWidgetShared';
import { LegendWidgetShared } from '../../Share/LegendWidgetShared';

/**Flex layout factory for constructing the base tabs for the regions page view */
export function FlexLayoutFactory(node: any) {
    let component = node.getComponent();
    if (component === 'Activity Counts') {
        return <CountsWidgetShared />;
    } else if (component === 'Analyst Comments') {
        return <AnalystCommentsWidget />;
    } else if (component === 'Custom Tab') {
        return <AddNewTab />;
    } else if (component === 'Region Map') {
        return <WebMapView />;
    } else if (component === 'Legend') {
        return <LegendWidgetShared />;
    }
}
