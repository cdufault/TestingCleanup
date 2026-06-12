import React from 'react';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer';
import SceneLayer from '@arcgis/core/layers/SceneLayer';
import StreamLayer from '@arcgis/core/layers/StreamLayer';
import WFSLayer from '@arcgis/core/layers/WFSLayer';
import UniqueValueInfo from '@arcgis/core/renderers/support/UniqueValueInfo';
import Renderer from '@arcgis/core/renderers/Renderer';
import * as colorRamps from '@arcgis/core/smartMapping/symbology/support/colorRamps';
import * as symbolUtils from '@arcgis/core/symbols/support/symbolUtils';
import MenuItem from '@mui/material/MenuItem';
import StatisticDefinition from '@arcgis/core/rest/support/StatisticDefinition';
import Query from '@arcgis/core/rest/support/Query';
import UniqueValueRenderer from '@arcgis/core/renderers/UniqueValueRenderer';
import Canvas from './ColorRamp';

export type StylableLayer = FeatureLayer | GeoJSONLayer | WFSLayer | SceneLayer | StreamLayer;

export type UniqueValueBlockProps = {
    fieldCount: string;
    uniqueValueInfo: UniqueValueInfo;
};

export interface GraphicsProps {
    onChange: (newRenderer: Renderer) => void;
    originalRenderer: Renderer;
    layer: StylableLayer;
}

export enum PointStyleEnum {
    circle = 'circle',
    cross = 'cross',
    square = 'square',
    x = 'x',
    diamond = 'diamond',
    triangle = 'triangle',
}

export interface PointGraphicsProps {
    onChange: (newRenderer: Renderer) => void;
    originalRenderer: Renderer;
    layer: StylableLayer;
}

export type PointObject3D = {
    name: string;
    href?: string | undefined;
    styleUrl?: string | undefined;
    thumbnailUrl?: string | undefined;
};

export enum PolygonStyleEnum {
    backwardDiagonal = 'backward-diagonal',
    cross = 'cross',
    diagonalCross = 'diagonal-cross',
    forwardDiagonal = 'forward-diagonal',
    horizontal = 'horizontal',
    vertical = 'vertical',
    solid = 'solid',
    none = 'none',
}

export enum LineStyleEnum {
    dash = 'dash',
    dashDot = 'dash-dot',
    dot = 'dot',
    longDash = 'long-dash',
    longDashDot = 'long-dash-dot',
    longDashDotDot = 'long-dash-dot-dot',
    none = 'none',
    shortDash = 'short-dash',
    shortDashDot = 'short-dash-dot',
    shortDashDotDot = 'short-dash-dot-dot',
    shortDot = 'short-dot',
    solid = 'solid',
}

export enum OutlineStyleEnum {
    dash = 'dash',
    dashDot = 'dash-dot',
    dot = 'dot',
    longDash = 'long-dash',
    longDashDot = 'long-dash-dot',
    longDashDotDot = 'long-dash-dot-dot',
    shortDash = 'short-dash',
    none = 'none',
    shortDashDot = 'short-dash-dot',
    shortDashDotDot = 'short-dash-dot-dot',
    shortDot = 'short-dot',
    solid = 'solid',
}

export type SelectionType = 'location' | 'attribute';

export const getColorRampMenuItems = (rampColorTag: string, rampShade: string): JSX.Element[] => {
    const ramps = colorRamps.byTag({ includedTags: [rampColorTag, rampShade] });
    return ramps.map((ramp) => {
        const colorDisplay = symbolUtils.renderColorRampPreviewHTML(ramp.colors, {
            align: 'horizontal',
            gradient: false,
            width: 1000,
        });
        const divContainer = document.createElement('div');
        divContainer.appendChild(colorDisplay);
        return (
            <MenuItem key={ramp.name + Math.random()} value={ramp.name}>
                <Canvas key={ramp.name + Math.random()} rampName={ramp.name}></Canvas>
            </MenuItem>
        );
    });
};

export const queryLayerStatistics = async (layer: StylableLayer, field: string): Promise<__esri.FeatureSet> => {
    if (layer.type !== 'stream') {
        // need to manually count the number of null features in the selected field
        const nullCountQuery = new Query();
        nullCountQuery.where = `${field} IS NULL`;
        nullCountQuery.outFields = [field];
        const queryOfNullFeatures = await layer.queryFeatures(nullCountQuery);
        const countOfNullFeatures = queryOfNullFeatures.features.length;
        const query = new Query();
        query.where = layer.definitionExpression ? layer.definitionExpression : '1=1';
        query.returnGeometry = false;
        query.outFields = [field];
        query.groupByFieldsForStatistics = [field];
        query.outStatistics = [
            new StatisticDefinition({
                onStatisticField: field,
                outStatisticFieldName: `${field}_count`,
                statisticType: 'count',
            }),
        ];
        const features = await layer.queryFeatures(query);
        // check within the returned features if there are any null values for the selected field
        // if there are null values, then assign the count outStatistic with the count from the null feature query
        for (let i = 0; i < features.features.length; i++) {
            const featureFieldInReturnedArray = features.features[i].attributes;
            if (featureFieldInReturnedArray[field] === null) {
                featureFieldInReturnedArray['count'] = countOfNullFeatures;
            }
        }
        return features;
    } else return new __esri.FeatureSet();
};

export const loadOriginalUniqueRenderer = async (
    originalRenderer: UniqueValueRenderer,
    layer: StylableLayer,
    setUniqueValueBlocks: (uniqueValueBlockProps: UniqueValueBlockProps[]) => void
): Promise<void> => {
    if (originalRenderer.field && layer.type !== 'stream') {
        const uniqueValueBlockProps: UniqueValueBlockProps[] = [];
        const uniqueValueInfos = originalRenderer.uniqueValueInfos;
        const results = await queryLayerStatistics(layer, originalRenderer.field);
        const outStatisticsCountFieldName = `${originalRenderer.field}_count`;
        for (let index = 0; index < results.features.length; index++) {
            const featureValue = results.features[index].attributes[originalRenderer.field];
            let matchedInfo: UniqueValueInfo | undefined;
            for (let k = 0; k < uniqueValueInfos.length; k++) {
                // Compare with type coercion: the renderer's `value` is often a string while
                // the feature attribute (e.g. an integer classification code) is a number, so a
                // strict === comparison would never match and the row would render empty.
                if (
                    uniqueValueInfos[k].value === featureValue ||
                    String(uniqueValueInfos[k].value) === String(featureValue)
                ) {
                    matchedInfo = uniqueValueInfos[k];
                    break;
                }
            }
            // Fall back to a fresh info carrying the feature's value so the row still shows the
            // value when the renderer has no matching entry, instead of reusing a stale/empty one.
            const uniqueValueInfo = matchedInfo ?? new UniqueValueInfo({ value: featureValue });
            const uvProp = {
                fieldCount: results.features[index].attributes[outStatisticsCountFieldName],
                uniqueValueInfo: uniqueValueInfo,
            };
            uniqueValueBlockProps.push(uvProp);
        }
        setUniqueValueBlocks(uniqueValueBlockProps);
    }
};
