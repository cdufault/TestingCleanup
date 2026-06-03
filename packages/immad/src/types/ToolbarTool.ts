export interface ToolbarTool {
    name: string;
    tooltip: string;
    icon: JSX.Element;
    selected: boolean;
    type: ToolbarToolType;
}

export enum ToolbarToolType {
    Map = 'map',
    Legend = 'legend',
    LayerList = 'layerList',
    FeatureTable = 'featureTable',
    Measure = 'measure',
    Default = 'default',
    DataFeeds = 'dataFeeds',
    RouteFinder = 'routeFinder',
    DoctrinalTemplate = 'doctrinalTemplate',
    DoctrinalTemplate_New = 'doctrinalTemplate_new',
    Basemap = 'basemap',
    RKSSearch = 'rksSearch',
    TimeSlider = 'timeSlider',
    FeatureEditor = 'featureEditor',
    AnalyticCatalog = 'analyticCatalog',
    TacticalGrid = 'tacticalGrid',
    LayerFilter = 'layerFilter',
    LayerEllipse = 'layerEllipse',
    DisplaySettings = 'displaySettings',
    LayerStyle = 'layerStyle',
    CoordinateConversion = 'coordinateConversion',
    GateDataEditor = 'gateDataEditor',
    ActivityCounts = 'activityCounts',
    GateCalendarEditor = 'gateCalendarEditor',
    OpsClock = 'opsClock',
    BaseballCard = 'baseballCard',
    MissionLog = 'missionLog',
}
