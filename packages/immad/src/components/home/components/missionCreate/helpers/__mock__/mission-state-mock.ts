import { MissionState } from '../../../../../../contexts/missionStateReducer';
//import WebScene from '@arcgis/core/WebScene';
//import SceneView from '@arcgis/core/views/SceneView';
//import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
//import Sketch from '@arcgis/core/widgets/Sketch';
//import Basemap from '@arcgis/core/Basemap';
import { IItem, IUser } from '@esri/arcgis-rest-portal';
////import Extent from '@arcgis/core/geometry/Extent';

export const userJohn: IUser = {
    username: 'jsmith',
    fullName: 'John Smith',
    firstName: 'John',
    lastName: 'Smith',
    description: 'Senior GIS Analyst for the city of Redlands.',
    tags: ['GIS Analyst', 'City of Redlands'],
    culture: 'en',
    region: 'US',
    units: 'metric',
    thumbnail: 'myProfile.jpg',
    created: 1258501046000,
    modified: 1290625562000,
    //id: "ggo",
    provider: 'arcgis',
};
export const webMappingItem: IItem = {
    id: 'webMappingItem1',
    numViews: 38,
    size: 38983,
    created: 99876543,
    modified: 8876543,
    owner: 'dbouwman',
    title: 'my fake item',
    description: 'yep its fake',
    snipped: 'so very fake',
    type: 'Web Mapping Application',
    typeKeywords: ['fake', 'kwds'],
    tags: ['fakey', 'mcfakepants'],
    properties: {
        key: 'somevalue',
    },
    data: {
        values: {
            key: 'value',
        },
    },
};
export const webToolItem: IItem = {
    id: 'webToolItem1',
    numViews: 38,
    size: 38983,
    created: 99876543,
    modified: 8876543,
    owner: 'dbouwman',
    title: 'my fake item',
    description: 'yep its fake',
    snipped: 'so very fake',
    type: 'Web Tool',
    typeKeywords: ['fake', 'kwds'],
    tags: ['fakey', 'mcfakepants'],
    properties: {
        key: 'somevalue',
    },
    data: {
        values: {
            key: 'value',
        },
    },
};

export const dataFeedItem: IItem = {
    id: 'dataFeedItem1',
    numViews: 38,
    size: 38983,
    created: 99876543,
    modified: 8876543,
    owner: 'dbouwman',
    title: 'my fake item',
    description: 'yep its fake',
    snipped: 'so very fake',
    type: 'Web Tool',
    typeKeywords: ['fake', 'kwds'],
    tags: ['fakey', 'mcfakepants'],
    properties: {
        key: 'somevalue',
    },
    data: {
        values: {
            key: 'value',
        },
    },
};

export const mockMission: MissionState = {
    name: 'Mock Mission',
    managerNames: 'Joe Smith, Bob Jones, Sandy Cross',
    region: 'West Region',
    description: 'A mock Mission',
    mapItem: undefined, //basemap or scene
    webTools: [webToolItem],
    analystNames: ['Carl', 'Steve', 'Joe'],
    analysts: [userJohn],
    extent: undefined,
    webScene: undefined,
    sceneView: undefined,
    gLayer: undefined,
    sketchWidget: undefined,
    dataFeeds: [dataFeedItem],
    portalGroupId: 'asdfa33993kdk3',
};
