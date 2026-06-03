import { bviLineStyle, bviPolygonStyle, GeoJsonData } from '../helpers/AddLayerByUrlHelper';
import UniqueValueRenderer from '@arcgis/core/renderers/UniqueValueRenderer';
import RasterColormapRenderer from '@arcgis/core/renderers/RasterColormapRenderer';
import { AnalyticsGPTool } from './AnalyticsGPTypes';
import { OpsClockData } from '@stratcom/react-widget-lib/types/OpsClockWidgetLib';

export interface AppConfig {
    portalConfigItemId: string;
    portalUrl: string;
    oauthAppId: string;
    elevationUrl: string;
    classificationBanner: string;
    areClassificationMarkingsFake: boolean;
    version: string;
    defaultWebMapId: string;
    defaultWebSceneId: string;
    symbolItemId: string;
    emptyWebSceneTemplateId?: string;
    outputDebugMessages: boolean;
    panningSpeed: number;
    defaultElevationMode: string;
    immadVersion: string;
    flashGraphicColor: number[];
    gate: {
        gateAdminGroupId: string;
        analystComments: string;
        landingPageData: string;
        regionSummary: string;
        j2Assessment: string;
        regionsFClassGuid: string;
        landingPageFClassGuid: string;
        j2SummaryFClassGuid: string;
        j2SummaryFields: string[];
        analystCommentsFClassGuid: string;
        calendarGuid: string;
        sourcesGuid: string;
        queryForGateApplication: string;
        watchConLabel: string;
        lastUpdatedFieldName: string;
        executeCountQueriesSequentially: boolean;
        exercise: {
            exRegionsFClassGuid: string;
            exLandingPageFClassGuid: string;
            exJ2SummaryFClassGuid: string;
            exAnalystCommentsFClassGuid: string;
            exCalendarGuid: string;
            exSourcesGuid: string;
        };
        dynamicLayerServiceId: string;
        dynamicLayerServicePollIntervalMins: number;
        dynamicLayerServiceDefaultExpirationTimeHrs: number;
        dynamicFeatureServiceTemplate: any;
        dynamicLayerServiceTemplate: any;
    };
    tags: {
        webmap: string;
        webscene: string;
        group: string;
        user: string;
        webTool: string;
        gpTool: string;
        dataFeed: string;
        mission: string;
        missionData: string;
        application: string;
        tacticalGrid: string;
        exerciseFClass: string;
    };
    types: {
        webMappingApplication: string;
        application: string;
        featureService: string;
        webScene: string;
        geoprocessingService: string;
        webTool: string;
        webMap: string;
    };
    countWidgetRowColors: string[];
    typekeywords: {
        immadMission: string;
        gateMission: string;
        gateExercise: string;
        immadExercise: string;
    };
    smart: {
        getDashboardDataUrl: string;
        getSystemsJsonUrl: string;
        recordUploadUrl: string;
        getRecordByIdUrl: string;
        useLiveDashboards: boolean;
        runningInCIGT: boolean;
        recordActive: boolean;
        smartRecordUploadRecordIdsParam: string;
        recordActiveFieldName: string;
        testDashboardId: string;
        smartRecordVersionFieldName: string;
        smartRadiusFieldName: string;
        smartSystemIdFieldName: string;
        smartGroupIdFieldName: string;
        smartDashboardFieldName: string;
        smartRecordIdFieldName: string;
        smartRecordTypeFieldName: string;
        smartUpdateTrackingIdKey: string;
        smartRecordStatusFromFieldName: string;
        smartRecordEventDateFieldName: string;
        smartFormSystemCheckboxLabelFieldName: string;
        smartRecordPathFieldName: string;
        smartGUID: string;
        smartSystemRecordType: string;
        smartGroupRecordType: string;
        smartLastUpdatedByFieldName: string;
        smartLastUpdatedDateFieldName: string;
        smartFieldsToNotUpdateWhenUpdatingTheGroup: string[];
        smartLocationFieldNames: string[];
        smartExtraSystemFieldsToAddToForm: Array<{
            classification: string;
            default_value: string;
            name: string;
            order: number;
            title: string;
            type: string;
            values: string;
            required: boolean;
        }>;
        smartUpdatePostParams: any[];
        mappableFields: string[];
        fetchPostParamsFromConfig: {
            method: string;
            mode: string;
            body: Record<string, any>;
            headers: Record<string, string>;
        };
        fetchGetParamsFromConfig: {
            method: string;
            mode: string;
            headers: Record<string, string>;
        };
        fieldsWithNumericValues: string[];
        useXMLHttpPost: boolean;
        useEncodeURIComponent: boolean;
        updateOnVersionConflict: boolean;
        errorOnVersionConflict: boolean;
        showErrorOnRadiusCalcFailure: boolean;
        nullableFields: string[];
    };
    rks: {
        integerFields: string[];
        testSearchUrl: string;
        entityMetaDataUrl: string;
        detailSearchUrl: string;
        entityDetailMetaDataUrl: string;
        operatorGroupSearchUrl: string;
        runDebug: boolean;
        detailsSearchMaxRecordCount: number;
        entityDetailsSearch: {
            datasets: string[];
            entityId: string[];
            detailType: string[];
            elementType: string[];
            searchOptions: {
                sort: string;
                order: string;
                scrollId: string;
                from: number;
                size: number;
            };
        };
    };
    roles: {
        tag: string;
        admin: {
            tag: string;
            privileges: string[];
        };
        missionManager: {
            tag: string;
            privileges: string[];
        };
        analyst: {
            tag: string;
            privileges: string[];
        };
    };
    analyticCatalog: {
        tool_tag: string[];
    };
    portalItemList: {
        maxRecordCountWhenPaging: number;
        classifications: Array<{
            name: string;
            backgroundColor: string;
            textColor: string;
        }>;
    };
    remoteView: {
        wsUri: string;
        metadataUrl: string;
        pollDelay: number;
    };
    dataFeed: {
        mainRestUrl: string;
        queryTypes: Array<{
            name: string;
            value: string;
            url: string;
            timeInfo: __esri.TimeInfo;
            geoJsonData: GeoJsonData[];
            polygonStyle: bviPolygonStyle;
            lineStyle: bviLineStyle;
        }>;
        groupNames: string[];
    };
    settings: {
        disableSceneLighting: boolean;
        disableAtmosphere: boolean;
    };
    sketch: {
        defaultSymbol: {
            size: number;
            color: number[];
            outline: {
                color: number[];
                width: number;
            };
        };
    };
    doctrinalTemplate: {
        renderer: UniqueValueRenderer | RasterColormapRenderer;
    };
    remapUrls: boolean;
    urlRemapRules: Array<{
        url: string;
        remapUrl: string;
    }>;
    refreshIntervalsInMinutes: number[];
    tacticalGrid: {
        dataLayerId: string;
        statusField: string;
        recentHighlightTimeoutInMinutes: number;
        refreshIntervalInSeconds: number;
        stratLeadCompareField: string;
        stratLeadExpirationUnitLabel: string;
        zoomViewScale: number;
        stratLeadExpiration: Array<{
            id: string;
            label: string;
            expirationTime: number;
            color: string;
        }>;
        stratLeadMaxExpiration: number;
        maximumSelectedRowsAllowed: number;
        defaultFieldMappings: Array<{
            tacticalGridFieldName: string;
            systemFieldName: string;
            ellipseRole?: string;
            ellipseUnit?: string;
        }>;
        quickFilters: Array<{
            id: string;
            label: string;
            value: string;
        }>;
    };
    layerEllipse: {
        semi_major_fields: string[];
        semi_minor_fields: string[];
        azimuth_fields: string[];
    };
    analyticsSettings: AnalyticsGPTool[];
    search: {
        includeGeocoder: boolean;
        name: string;
        allPlaceholder: string;
        url: string;
    };
    opsClocks: OpsClockData[];
    missionMessages: Array<{
        rmtType: string;
        codes: Array<{
            type: string;
            codeAlias: string;
            queryLabels: string[];
        }>;
    }>;
}
