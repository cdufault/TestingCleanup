import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import MapView from '@arcgis/core/views/MapView';
import SceneView from '@arcgis/core/views/SceneView';
import FeatureSet from '@arcgis/core/rest/support/FeatureSet';
import Query from '@arcgis/core/rest/support/Query';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import { Geometry, Point, Polygon, Polyline } from '@arcgis/core/geometry';
import Graphic from '@arcgis/core/Graphic';
import * as geometryEngine from '@arcgis/core/geometry/geometryEngine';
import { GridColDef } from '@mui/x-data-grid';
import { NewtMessage } from './MissionLogSlice';
// @ts-ignore
import CaretDown from '@esri/calcite-ui-icons/icons/caret-down-24.svg';
// @ts-ignore
import CaretLeft from '@esri/calcite-ui-icons/icons/caret-left-24.svg';
// @ts-ignore
import CaretUp from '@esri/calcite-ui-icons/icons/caret-up-24.svg';
import { ExpandedState } from './components/CollapsibleMissionHeader';

/**
 * Zoom to feature
 * @param featureLayerPortalItemId portal item id
 * @param oids array of oid values
 * @param panningSpeed panning speed - useSelector((state: RootState) => state.applicationSlice.panningSpeed);
 * @param view map or scene view
 */
export async function zoomToNewtData(
    featureLayerPortalItemId: string,
    oids: number[],
    panningSpeed: number,
    view: MapView | SceneView
) {
    const featureLayer = new FeatureLayer({
        portalItem: {
            id: featureLayerPortalItemId,
        },
    });
    const options = {
        speedFactor: panningSpeed,
    };

    const query = {
        objectIds: oids,
        returnGeometry: true,
    } as Query;

    featureLayer.queryFeatures(query).then((featureSet: FeatureSet) => {
        view.goTo(featureSet.features, options)
            .then(() => {
                if (featureSet.features[0].geometry.type === 'point' && featureSet.features.length === 1) {
                    view.scale = Math.floor(view.scale / 2);
                }
            })
            .catch((error) => {
                if (error.name !== 'AbortError') {
                    console.error('Error zooming to selection.', error);
                }
            });
    });
}

/**
 * Create a polyline graphic
 * @param geometry polyline geometry to use for the graphic
 * @param fillColor graphic's fill color [R,G,B]
 * @returns a graphic or undefined
 */
const createPolylineGraphic = (geometry: Polyline, fillColor: number[]): Graphic | undefined => {
    let lineGraphic;
    if (geometry) {
        const clonedGeometry = geometry.clone();
        const polyline = {
            type: 'polyline',
            paths: clonedGeometry.paths,
        };
        const polylineGraphic = {
            type: 'simple-line',
            color: fillColor,
            width: 6,
        };
        lineGraphic = new Graphic({
            geometry: polyline as Polyline,
            symbol: polylineGraphic,
        });
    }
    return lineGraphic;
};

/**
 * Create a simple-marker graphic
 * @param geometry point geometry to use for the graphic
 * @param color graphic's fill and outline color [R,G,B]
 * @returns a graphic or undefined
 */
const createPointGraphic = (geometry: Point, color: number[]): Graphic | undefined => {
    let pointGraphic;
    const point = {
        type: 'point',
        x: geometry.longitude,
        y: geometry.latitude,
    };
    const markerSymbol = {
        type: 'simple-marker',
        color: color,
        outline: {
            color: color,
            width: 6,
        },
    };
    if (point) {
        pointGraphic = new Graphic({
            geometry: point as Geometry,
            symbol: markerSymbol,
        });
    }
    return pointGraphic;
};

/**
 * Create a simple-fill graphic
 * @param geometry polygon geometry to use for the graphic
 * @param fillColor graphic's fill color [R,G,B]
 * @returns a graphic or undefined
 */
const createPolygonGraphic = (geometry: Polygon, fillColor: number[]): Graphic | undefined => {
    let polygonGraphic;
    if (geometry) {
        const clonedGeom = geometry.clone();
        //graphic layer does not handle complex geometries
        const simpleGeom = geometryEngine.simplify(clonedGeom);
        const polygon = {
            type: 'polygon',
            rings: (simpleGeom as Polygon).rings,
        };
        const fillSymbol = {
            type: 'simple-fill',
            color: fillColor,
            width: 2,
        };
        polygonGraphic = new Graphic({
            geometry: polygon as Geometry,
            symbol: fillSymbol,
        });
    }
    return polygonGraphic;
};

/**
 *
 * @param featureLayerPortalItemId
 * @param oids
 * @param graphicColor
 * @param graphicsLayer
 * @param currentView
 * @param flashDuration
 */
export async function flashNewtData(
    featureLayerPortalItemId: string,
    oids: number[],
    graphicColor: number[],
    graphicsLayer: GraphicsLayer | undefined,
    currentView: MapView | SceneView | undefined,
    flashDuration: number
) {
    //Get the feature to flash

    const color = [...graphicColor];
    color.push(0.25);
    const featureLayer = new FeatureLayer({
        portalItem: {
            id: featureLayerPortalItemId,
        },
    });
    const query = {
        objectIds: oids,
        returnGeometry: true,
    } as Query;

    const features = await featureLayer.queryFeatures(query);
    const featureToFlash = features.features[0];

    let graphicToFlash;
    if (featureToFlash && featureToFlash.geometry) {
        try {
            if (featureToFlash.geometry.type === 'point') {
                graphicToFlash = createPointGraphic(featureToFlash.geometry as Point, graphicColor);
            } else if (featureToFlash.geometry.type === 'polyline') {
                graphicToFlash = createPolylineGraphic(featureToFlash.geometry as Polyline, graphicColor);
            } else if (featureToFlash.geometry.type === 'polygon') {
                graphicToFlash = createPolygonGraphic(featureToFlash.geometry as Polygon, color);
            } else {
                console.warn('This geometry type is not supported when flashing: ' + featureToFlash.geometry.type);
            }
        } catch (error) {
            console.error('Error creating flash graphic.', error);
        }

        if (graphicToFlash) {
            graphicsLayer?.add(graphicToFlash);
            setTimeout(() => {
                graphicsLayer?.removeAll();
            }, flashDuration.valueOf());
        } else {
            console.warn('Failed to create a flash graphic.');
        }
    } else {
        console.debug(
            'Failed to flash feature. Missing feature or missing feature geometry. Feature:  ',
            featureToFlash
        );
    }
}

/**
 * Convert a Julian date to the ICOD date format
 * @param julianDateString
 * @param testYear use to test leap year - test variable only
 * @returns date formated in the ICOD data formate DDHHMMZYYYY or undefined if any value was out of range
 */
export function convertJulian(julianDateString: string, testYear: number | undefined = undefined): string | undefined {
    const convertedDate = getDate(julianDateString, testYear);
    if (convertedDate) return formatDateToICODString(convertedDate);
    else return undefined;
}

/**
 * convert message date string to a Date object
 * @param julianDateString
 * @param testYear
 */
function getDate(julianDateString: string, testYear: number | undefined = undefined): Date | undefined {
    if (julianDateString.trim().length > 7 || julianDateString.trim().length < 7) {
        console.error('Julian date string was not in the correct format. Must be 7 characters: ', julianDateString);
        return undefined;
    }
    const datePartString = julianDateString.substring(0, 3);
    const timePartString = julianDateString.substring(3);
    const datePartNumber = Number(datePartString);

    let today = new Date(Date.now());
    if (testYear) {
        today = new Date(testYear, today.getMonth(), today.getDate());
    }
    const yr = today.getFullYear();
    const base = new Date(yr, 0, 0); //12/31/yr-1

    const milli = base.setDate(base.getDate() + datePartNumber);
    const convertedDate = new Date(milli);

    const hourString = timePartString.substring(0, 2);
    const hours = Number(hourString);
    const minuteString = timePartString.substring(2);
    const minutes = Number(minuteString);
    convertedDate.setHours(hours, minutes);
    return convertedDate;
}

/**
 * Format date value to ICOD type string
 * @param date date value
 * @returns ICOD date format DDHHMMZYYYY
 */
export function formatDateToICODString(date: Date): string {
    const days = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    return `${days}${hours}${minutes}Z${month}${year}`;
}

/**
 *  Creates the grid column definitions for the line items in each message. This is used to
 *  create the table of line items displayed to the user.
 * @param message
 */
export function createGridColumnDefinitions(message: NewtMessage): GridColDef[] {
    const columnDefinitions: GridColDef[] = [];
    if (message.value?.length) {
        for (const attribute in message.value[0]) {
            if (
                attribute.toUpperCase() !== 'OBJECTID' &&
                attribute.toUpperCase() !== 'ORIG_FID' &&
                attribute.toUpperCase() !== 'SHAPE__LENGTH' &&
                attribute.toUpperCase() !== 'SHAPE__AREA'
            ) {
                const colDef = {
                    field: attribute,
                    headerName: attribute,
                };
                columnDefinitions.push(colDef);
            }
        }
    }
    return columnDefinitions;
}

/**
 * Add original unparsed message into the Mission Log feature table
 * @param message incoming message for a mission log message feature
 * @param featureLayer featureLayer for mission log data
 */
export async function AddMissionLogMessageFeature(
    message: string,
    featureLayer: __esri.FeatureLayer
): Promise<__esri.EditsResult | void> {
    // separates message into individual lines in an array
    const messageToLinesArray = message.split('\n');
    // grab header - first line in array
    const originalHeader = messageToLinesArray[0];
    //grab the julian date from the header
    const headerDate = originalHeader.split('/')[5];
    const messageDate = getDate(headerDate);
    const dataRow = {
        header: originalHeader,
        message_date: messageDate?.valueOf(),
        full_message: message,
    };
    const newFeature = new Graphic({
        attributes: dataRow,
    });
    return await featureLayer
        .applyEdits({
            addFeatures: [newFeature],
        })
        .catch((error: Error) => {
            console.error('Error sending mission log message to mission log feature table.', error);
        });
}

export async function RemoveMissionLogMessageFeature(
    objectId: number,
    featureLayer: __esri.FeatureLayer
): Promise<__esri.EditsResult | void> {
    return await featureLayer
        .applyEdits({
            deleteFeatures: [{ objectId: objectId }],
        })
        .catch((error: Error) => {
            console.error('Error deleting mission log message from mission log feature table.', error);
        });
}

/**
 * Get the Icon based on expanded state
 * @param state
 */
export const getExpandIcon = (state: ExpandedState) => {
    switch (state) {
        case 'closed':
            return CaretDown;
        case 'expandedAll':
            return CaretLeft;
        case 'collapsedDetails':
            return CaretUp;
        default:
            return CaretDown;
    }
};
