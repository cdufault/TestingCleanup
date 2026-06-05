// React imports
import React from 'react';

// Type imports
import { ToolbarTool, ToolbarToolType } from '../../types/ToolbarTool';

// Component imports
import LayersIcon from 'calcite-ui-icons-react/LayersIcon';
import LegendIcon from 'calcite-ui-icons-react/LegendIcon';
import MeasureIcon from 'calcite-ui-icons-react/MeasureIcon';
import FilterIcon from 'calcite-ui-icons-react/FilterIcon';
import BasemapIcon from 'calcite-ui-icons-react/BasemapIcon';
import DataMagnifyingGlassIcon from 'calcite-ui-icons-react/DataMagnifyingGlassIcon';
import SystemManagementIcon from 'calcite-ui-icons-react/SystemManagementIcon';
import GearIcon from 'calcite-ui-icons-react/GearIcon';
import EditorIcon from 'calcite-ui-icons-react/EditAttributesIcon';
import TableIcon from 'calcite-ui-icons-react/TableIcon';
import EllipsisCircleIcon from 'calcite-ui-icons-react/EllipsisCircleIcon';
import GateWayIcon from '../../images/24px/24px_gateway.png';
import TacticalGridIcon from '../../images/24px/24px_tactical-grid.png';
import DoctrinalTemplateIcon from '../../images/24px/24px_doctrinal-template.png';
import EventIcon from 'calcite-ui-icons-react/EventIcon';
import LayerGraphicsIcon from '../../images/32px/32px_layer-style_darkmode@3x.png';
import ActivityCountsIcon from '../../images/24px/24px_activity-counts_darkmode@3x.png';
import CoordinateConversionIcon from '../../images/24px/24px_coordinate-conversion_darkmode@3x.png';
import TimeSliderIcon from '../../images/32px/32px_timeslider_darkmode@3x.png';
import DataFeeds from '../../images/24px/24px_data-feeds_darkmode.png';
import OpsClockIcon from '../../images/24px/24px_ops-clock_darkmode@3x.png';
import PopupIcon from 'calcite-ui-icons-react/PopupIcon';
// @ts-ignore
import NotepadEdit24 from '@esri/calcite-ui-icons/icons/notepad-edit-24.svg';
import { StyledCalciteIcon } from '../menuBar/styles';
import {IJsonModel} from "flexlayout-react";
import { ConfigHelper } from '../../helpers/configHelper';

const ToolBarIconSize = 24;

export const getAnalystTools = (): ToolbarTool[] => {
    const gateLabel = ConfigHelper.getAppConfig()?.gate?.gateLabel ?? '';
    const gateWayLabel = `${gateLabel} WAY`.trim();
    const gateCalendarEditorLabel = `${gateLabel} Calendar Editor`.trim();

    return [
    {
        name: 'Mission Log',
        icon: <StyledCalciteIcon src={NotepadEdit24} />,
        selected: false,
        tooltip: 'Mission Log',
        type: ToolbarToolType.MissionLog,
    },
    {
        name: 'Layers',
        icon: <LayersIcon size={ToolBarIconSize} />,
        selected: true,
        tooltip: 'Layers',
        type: ToolbarToolType.LayerList,
    },
    {
        name: 'Legend',
        icon: <LegendIcon size={ToolBarIconSize} />,
        selected: true,
        tooltip: 'Legend',
        type: ToolbarToolType.Legend,
    },
    {
        name: 'Basemap',
        icon: <BasemapIcon size={ToolBarIconSize} />,
        selected: false,
        tooltip: 'Basemap',
        type: ToolbarToolType.Basemap,
    },
    {
        name: 'Coordinate Conversion',
        icon: (
            <img
                src={CoordinateConversionIcon}
                alt={'CoordinateConversion'}
                style={{ width: ToolBarIconSize, height: ToolBarIconSize }}
            />
        ),
        selected: false,
        tooltip: 'Coordinate Conversion',
        type: ToolbarToolType.CoordinateConversion,
    },
    {
        name: 'Measure',
        icon: <MeasureIcon size={ToolBarIconSize} />,
        selected: false,
        tooltip: 'Measure',
        type: ToolbarToolType.Measure,
    },
    {
        name: 'Time Slider',
        icon: (
            <img src={TimeSliderIcon} alt={'TimeSlider'} style={{ width: ToolBarIconSize, height: ToolBarIconSize }} />
        ),
        selected: false,
        tooltip: 'Time Slider',
        type: ToolbarToolType.TimeSlider,
    },
    {
        name: 'Data Feeds',
        icon: <img src={DataFeeds} alt={'DataFeeds'} style={{ width: ToolBarIconSize, height: ToolBarIconSize }} />,
        selected: false,
        tooltip: 'Data Feeds',
        type: ToolbarToolType.DataFeeds,
    },
    {
        name: 'RKS Search',
        icon: <DataMagnifyingGlassIcon size={ToolBarIconSize} />,
        selected: false,
        tooltip: 'RKS Search',
        type: ToolbarToolType.RKSSearch,
    },
    {
        name: 'Editor',
        icon: <EditorIcon size={ToolBarIconSize} />,
        selected: false,
        tooltip: 'Editor',
        type: ToolbarToolType.FeatureEditor,
    },
    {
        name: 'Feature Table',
        icon: <TableIcon size={ToolBarIconSize} />,
        selected: false,
        tooltip: 'Feature Table',
        type: ToolbarToolType.FeatureTable,
    },
    {
        name: 'Layer Style',
        icon: (
            <img
                src={LayerGraphicsIcon}
                alt={'LayerStyle'}
                style={{ width: ToolBarIconSize, height: ToolBarIconSize }}
            />
        ),
        selected: false,
        tooltip: 'Layer Style',
        type: ToolbarToolType.LayerStyle,
    },
    {
        name: 'Layer Filter',
        icon: <FilterIcon size={ToolBarIconSize} />,
        selected: false,
        tooltip: 'Layer Filter',
        type: ToolbarToolType.LayerFilter,
    },
    {
        name: 'Layer Ellipse',
        icon: <EllipsisCircleIcon size={ToolBarIconSize} />,
        selected: false,
        tooltip: 'Layer Ellipse',
        type: ToolbarToolType.LayerEllipse,
    },
    {
        name: 'Tactical Grid',
        icon: (
            <img
                src={TacticalGridIcon}
                alt={'TacticalGrid'}
                style={{ width: ToolBarIconSize, height: ToolBarIconSize }}
            />
        ),
        selected: false,
        tooltip: 'Tactical Grid',
        type: ToolbarToolType.TacticalGrid,
    },
    {
        name: 'Doctrinal Templates',
        icon: (
            <img
                src={DoctrinalTemplateIcon}
                alt={'DoctrinalTemplate'}
                style={{ width: ToolBarIconSize, height: ToolBarIconSize }}
            />
        ),
        selected: false,
        tooltip: 'Doctrinal Templates',
        type: ToolbarToolType.DoctrinalTemplate_New,
    },
    {
        name: 'Analytic Catalog',
        icon: <SystemManagementIcon size={ToolBarIconSize} />,
        selected: false,
        tooltip: 'Analytic Catalog',
        type: ToolbarToolType.AnalyticCatalog,
    },
    {
        name: gateWayLabel,
        icon: <img src={GateWayIcon} alt={'GATEWAY'} style={{ width: ToolBarIconSize, height: ToolBarIconSize }} />,
        selected: false,
        tooltip: gateWayLabel,
        type: ToolbarToolType.GateDataEditor,
    },
    {
        name: 'Activity Counts',
        icon: (
            <img
                src={ActivityCountsIcon}
                alt={'ActivityCounts'}
                style={{ width: ToolBarIconSize, height: ToolBarIconSize }}
            />
        ),
        selected: false,
        tooltip: 'Activity Counts',
        type: ToolbarToolType.ActivityCounts,
    },
    {
        name: gateCalendarEditorLabel,
        icon: <EventIcon size={ToolBarIconSize} />,
        selected: false,
        tooltip: gateCalendarEditorLabel,
        type: ToolbarToolType.GateCalendarEditor,
    },
    {
        name: 'Ops Clock',
        icon: <img src={OpsClockIcon} alt={'OpsClock'} style={{ width: ToolBarIconSize, height: ToolBarIconSize }} />,
        selected: false,
        tooltip: 'Ops Clock',
        type: ToolbarToolType.OpsClock,
    },
    {
        name: 'Baseball Card',
        icon: <PopupIcon size={ToolBarIconSize} />,
        selected: false,
        tooltip: 'Baseball Card',
        type: ToolbarToolType.BaseballCard,
    },
    {
        name: 'Display Settings',
        icon: <GearIcon size={ToolBarIconSize} />,
        selected: false,
        tooltip: 'Display Settings',
        type: ToolbarToolType.DisplaySettings,
    },
    ];
};

export const analystLayout: IJsonModel = {
    global: {
        tabEnableFloat: true,
        tabEnableRename: false,
    },
    layout: {
        type: 'row',
        weight: 100,
        children: [
            {
                type: 'tabset',
                weight: 57.83003741314805,
                selected: 0,
                children: [
                    {
                        type: 'tab',
                        name: 'Map',
                        enableFloat: false,
                        enableClose: false,
                        component: ToolbarToolType.Map,
                    },
                ],
            },
            {
                type: 'tabset',
                id: 'widgetstabset',
                weight: 42.16996258685195,
                selected: 0,
                children: [
                    {
                        type: 'tab',
                        name: 'Layers',
                        component: ToolbarToolType.LayerList,
                    },
                    {
                        type: 'tab',
                        name: 'Legend',
                        component: ToolbarToolType.Legend,
                    },
                ],
            },
        ],
    },
    borders: [],
};
