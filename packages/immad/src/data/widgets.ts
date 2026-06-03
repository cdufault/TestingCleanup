import MapView from '@arcgis/core/views/MapView';
import SceneView from '@arcgis/core/views/SceneView';
import Point from '@arcgis/core/geometry/Point';
import Format from '@arcgis/core/widgets/CoordinateConversion/support/Format';
import * as webMercatorUtils from '@arcgis/core/geometry/support/webMercatorUtils';
import CoordinateConversion from '@arcgis/core/widgets/CoordinateConversion';
import Compass from '@arcgis/core/widgets/Compass';
import ScaleBar from '@arcgis/core/widgets/ScaleBar';
import BasemapGallery from '@arcgis/core/widgets/BasemapGallery';

import ViewSwitcher from '../components/widgets/viewSwitcher/ViewSwitcher';
import Conversion from '@arcgis/core/widgets/CoordinateConversion/support/Conversion';

export function initCompass(view: MapView): void {
    const compass = new Compass({
        view,
    });
    view.ui.add(compass, 'top-left');
}

export function initCoordinateConversion(currentView: MapView | SceneView, is3D: boolean): void {
    const coords = new CoordinateConversion({
        view: currentView,
        id: 'coords',
    });

    if (is3D) {
        const numberSearchPattern = /-?\d+[.]?\d*/;
        // add XYZ format for 3D to include elevation
        const xyzFormat = new Format({
            name: 'XYZ',
            conversionInfo: {
                // @ts-ignore
                convert: function (point: Point) {
                    const returnPoint = point.spatialReference.isWGS84
                        ? point
                        : (webMercatorUtils.webMercatorToGeographic(point) as Point);
                    const x = returnPoint.x.toFixed(6);
                    const y = returnPoint.y.toFixed(6);
                    const z = returnPoint.z.toFixed(4);
                    return {
                        location: returnPoint,
                        coordinate: `${x}°, ${y}°, ${z}`,
                    };
                },
                // @ts-ignore
                reverseConvert: function (str: string) {
                    const parts = str.split(',');
                    return new Point({
                        x: parseFloat(parts[0]),
                        y: parseFloat(parts[1]),
                        z: parseFloat(parts[2]),
                        spatialReference: { wkid: 4326 },
                    });
                },
            },
            coordinateSegments: [
                {
                    alias: 'X',
                    description: 'Longitude',
                    searchPattern: numberSearchPattern,
                },
                {
                    alias: 'Y',
                    description: 'Latitude',
                    searchPattern: numberSearchPattern,
                },
                {
                    alias: 'Z',
                    description: 'Elevation',
                    searchPattern: numberSearchPattern,
                },
            ],
            defaultPattern: 'X°, Y°, Z',
        });
        // add ddz in meters format for 3D to include elevation
        const ddzFormat = new Format({
            name: 'DDZ_M',
            conversionInfo: {
                // @ts-ignore
                convert: function (point: Point) {
                    const returnPoint = point.spatialReference.isWGS84
                        ? point
                        : (webMercatorUtils.webMercatorToGeographic(point) as Point);

                    const x = returnPoint.x.toFixed(6);
                    const y = returnPoint.y.toFixed(6);
                    const z = returnPoint.z.toFixed(4);
                    return {
                        location: returnPoint,
                        coordinate: `${y}°, ${x}°, ${z}m `,
                    };
                },
                // @ts-ignore
                reverseConvert: function (str: string) {
                    const parts = str.split(',');
                    return new Point({
                        x: parseFloat(parts[1]),
                        y: parseFloat(parts[0]),
                        z: parseFloat(parts[2]),
                        spatialReference: { wkid: 4326 },
                    });
                },
            },
            coordinateSegments: [
                {
                    alias: 'X',
                    description: 'Degrees Longitude',
                    searchPattern: /-?\d+[\.]?\d*/,
                },

                {
                    alias: 'Y',
                    description: 'Degrees Latitude',
                    searchPattern: /-?\d+[\.]?\d*/,
                },
                {
                    alias: 'Z',
                    description: 'Elevation',
                    searchPattern: /-?\d+[.]?\d*/,
                },
            ],
            defaultPattern: 'Y°, X°, Zm',
        });

        // add DDz feet format for 3D to include elevation
        const ddzFeetFormat = new Format({
            name: 'DDZ_FT',
            conversionInfo: {
                // @ts-ignore
                convert: function (point: Point) {
                    const returnPoint = point.spatialReference.isWGS84
                        ? point
                        : (webMercatorUtils.webMercatorToGeographic(point) as Point);

                    const x = returnPoint.x.toFixed(6);
                    const y = returnPoint.y.toFixed(6);
                    const z = (returnPoint.z * 3.28084).toFixed(4);
                    return {
                        location: returnPoint,
                        coordinate: `${y}°, ${x}°, ${z}ft `,
                    };
                },
                // @ts-ignore
                reverseConvert: function (str: string) {
                    const parts = str.split(',');
                    return new Point({
                        x: parseFloat(parts[1]),
                        y: parseFloat(parts[0]),
                        z: parseFloat(parts[2]) / 3.2808,
                        spatialReference: { wkid: 4326 },
                    });
                },
            },
            coordinateSegments: [
                {
                    alias: 'X',
                    description: 'Degrees Longitude',
                    searchPattern: /-?\d+[\.]?\d*/,
                },

                {
                    alias: 'Y',
                    description: 'Degrees Latitude',
                    searchPattern: /-?\d+[\.]?\d*/,
                },
                {
                    alias: 'Z',
                    description: 'Elevation',
                    searchPattern: /-?\d+[.]?\d*/,
                },
            ],
            defaultPattern: 'Y°, X°, Zft',
        });
        // add STRATDMS format for 2d with no elevation.
        const STRATDMS = new Format({
            name: 'STRATDMS',
            conversionInfo: {
                // @ts-ignore
                convert: function (point: Point) {
                    const returnPoint = point.spatialReference.isWGS84
                        ? point
                        : (webMercatorUtils.webMercatorToGeographic(point) as Point);
                    const xNum = returnPoint.x;
                    let x = Math.trunc(xNum).toFixed(0);
                    const cNum = (xNum - Math.trunc(xNum)) * 60;
                    const c = Math.trunc(Math.abs(cNum)).toFixed(0).padStart(2, '0');
                    const dNum = (cNum - Math.trunc(cNum)) * 60;
                    const d = Math.abs(dNum).toFixed(0).padStart(2, '0');
                    const yNum = returnPoint.y;
                    let y = Math.trunc(yNum).toFixed(0);
                    const aNum = (yNum - Math.trunc(yNum)) * 60;
                    let a = Math.trunc(Math.abs(aNum)).toFixed(0).padStart(2, '0');
                    const bNum = (aNum - Math.trunc(aNum)) * 60;
                    let b = Math.abs(bNum).toFixed(0).padStart(2, '0');

                    // This if statement rounds up the b number from 60 to 0 and the corresponding a value to the next number.
                    // It is to correct the problem of values displaying 365860N0961660W instead of 365900N0961700W.
                    if (b == '60') {
                        b = '00';
                        a = (parseInt(a) + 1).toString();
                    }

                    let northing = 'N';
                    let easting = 'E';
                    if (yNum < 0) {
                        northing = 'S';
                        y = y.replace('-', '');
                    }
                    if (xNum < 0) {
                        easting = 'W';
                        x = x.replace('-', '');
                    }
                    x = x.padStart(3, '0');
                    y = y.padStart(2, '0');

                    const reportValue = `${y}${a}${b}${northing}${x}${c}${d}${easting}`;
                    return {
                        location: returnPoint,
                        coordinate: reportValue,
                    };
                },

                // @ts-ignore
                reverseConvert: function (str: string) {
                    // example coordinate is 010101N0010101E
                    // break apart by 2,2,2,1,3,2,2,1
                    let fullY = str.substring(0, 7);
                    let fullX = str.substring(7).trim();
                    // check if entered string contains S or W for coordinate quadrant
                    const southing = fullY.search('S');
                    const westing = fullX.search('W');
                    // break up y a and b to recombine them to dd
                    let yDegrees = parseFloat(fullY.substring(0, 2));
                    let yMinutes = parseFloat(fullY.substring(2, 4));
                    let ySeconds = parseFloat(fullY.substring(4, 6));
                    // break up x c and d to recombine them to dd
                    let xDegrees = parseFloat(fullX.substring(0, 3));
                    let xMinutes = parseFloat(fullX.substring(3, 5));
                    let xSeconds = parseFloat(fullX.substring(5, 7));
                    // if S is found in the entered string, make the coordinate negative and shift the string parsing
                    if (southing !== -1) {
                        fullY = '-' + fullY;
                        yDegrees = parseFloat(fullY.substring(0, 3));
                        yMinutes = parseFloat(fullY.substring(3, 5));
                        ySeconds = parseFloat(fullY.substring(5, 8));
                    }
                    // if W is found in the entered string, make the coordinate negative and shift the string parsing
                    if (westing !== -1) {
                        fullX = '-' + fullX;
                        xDegrees = parseFloat(fullX.substring(0, 4));
                        xMinutes = parseFloat(fullX.substring(4, 6));
                        xSeconds = parseFloat(fullX.substring(6, 8));
                    }
                    // combine the degree segments
                    return new Point({
                        y: yDegrees + yMinutes / 60 + ySeconds / 3600,
                        x: xDegrees + xMinutes / 60 + xSeconds / 3600,
                        spatialReference: { wkid: 4326 },
                    });
                },
            },
            coordinateSegments: [
                {
                    alias: 'Y',
                    description: 'Degrees Latitude',
                    searchPattern: /\d{1,2}(?=.*?\s+.*?[N|S|N|S])/i,
                },
                {
                    alias: 'A',
                    description: 'Minutes Latitude',
                    searchPattern: /\d{1,2}(?=.*?[N|S|N|S])/i,
                },
                {
                    alias: 'B',
                    description: 'Seconds Latitude',
                    searchPattern: /\d{1,2}[\.|\.]?\d*(?=.*?[N|S|N|S])/i,
                },
                {
                    alias: 'N',
                    description: 'north/south indicator',
                    searchPattern: /N|S|N|S/i,
                },
                {
                    alias: 'X',
                    description: 'Degrees Longitude',
                    searchPattern: /\d{1,3}(?=.*?\s+.*?[E|W|E|W])/i,
                },
                {
                    alias: 'C',
                    description: 'Minutes Longitude',
                    searchPattern: /\d{1,2}(?=.*?[E|W|E|W])/i,
                },
                {
                    alias: 'D',
                    description: 'Seconds Longitude',
                    searchPattern: /\d{1,2}[\.|\.]?\d*(?=.*?[E|W|E|W])/i,
                },
                {
                    alias: 'E',
                    description: 'east/west indicator',
                    searchPattern: /E|W|E|W/i,
                },
            ],
            defaultPattern: 'YABNXCDE',
        });

        // add DMS with z meters format for 3D to include elevation
        const dmsMetersFormat = new Format({
            name: 'DMS_M',
            conversionInfo: {
                // @ts-ignore
                convert: function (point: Point) {
                    const returnPoint = point.spatialReference.isWGS84
                        ? point
                        : (webMercatorUtils.webMercatorToGeographic(point) as Point);
                    const xNum = returnPoint.x;
                    const x = Math.trunc(xNum).toFixed(0);
                    const cNum = (xNum - Math.trunc(xNum)) * 60;
                    const c = Math.trunc(cNum).toFixed(0);
                    const dNum = (cNum - Math.trunc(cNum)) * 60;
                    const d = dNum.toFixed(4);
                    const yNum = returnPoint.y;
                    const y = Math.trunc(yNum).toFixed(0);
                    const aNum = (yNum - Math.trunc(yNum)) * 60;
                    const a = Math.trunc(aNum).toFixed(0);
                    const bNum = (aNum - Math.trunc(aNum)) * 60;
                    const b = bNum.toFixed(4);
                    const z = returnPoint.z.toFixed(4);

                    let northing = 'N';
                    let easting = 'E';

                    if (parseFloat(y) < 0) {
                        northing = 'S';
                    }
                    if (parseFloat(x) < 0) {
                        easting = 'W';
                    }
                    return {
                        location: returnPoint,
                        // coordinate: 'Y°‎ A\' B\\"N, X°‎ C\' D\\"E"\n\' ${z}'
                        coordinate: `${y}° ${a}\\' ${b}\\"${northing}, ${x}° ${c}\\' ${d}\\"${easting}, ${z}m `,
                    };
                },
                // @ts-ignore
                reverseConvert: function (str: string) {
                    const parts = str.split(',');
                    const fullY = parts[0].trim();
                    const fullX = parts[1].trim();
                    const fullZ = parts[2].trim();

                    // break up y a and b recombine them to dd
                    const yString = fullY.split(' ');
                    const yDegrees = parseFloat(yString[0]);
                    const yMinutes = parseFloat(yString[1]);
                    const ySeconds = parseFloat(yString[2].substring(0, yString[2].indexOf('"')));
                    // break up x c and d recombine them to dd
                    const xString = fullX.split(' ').map(function (item) {
                        return item.trim();
                    });
                    const xDegrees = parseFloat(xString[0]);
                    const xMinutes = parseFloat(xString[1]);
                    const xSeconds = parseFloat(xString[2].substring(0, xString[2].indexOf('"')));

                    // remove m from Z and it is in meters
                    let zInMeters = 0.0;
                    if (fullZ.endsWith('m')) {
                        zInMeters = parseFloat(fullZ.substring(0, fullZ.lastIndexOf('m')));
                    } else {
                        zInMeters = parseFloat(fullZ);
                    }
                    return new Point({
                        y: yDegrees + yMinutes / 60 + ySeconds / 3600,
                        x: xDegrees + xMinutes / 60 + xSeconds / 3600,
                        z: zInMeters,
                        spatialReference: { wkid: 4326 },
                    });
                },
            },
            coordinateSegments: [
                {
                    alias: 'Y',
                    description: 'Degrees Latitude',
                    searchPattern: /\d{1,2}(?=.*?\s+.*?[N|S|N|S])/i,
                },
                {
                    alias: 'A',
                    description: 'Minutes Latitude',
                    searchPattern: /\d{1,2}(?=.*?[N|S|N|S])/i,
                },
                {
                    alias: 'B',
                    description: 'Seconds Latitude',
                    searchPattern: /\d{1,2}[\.|\.]?\d*(?=.*?[N|S|N|S])/i,
                },
                {
                    alias: 'N',
                    description: 'north/south indicator',
                    searchPattern: /N|S|N|S/i,
                },
                {
                    alias: 'X',
                    description: 'Degrees Longitude',
                    searchPattern: /\d{1,3}(?=.*?\s+.*?[E|W|E|W])/i,
                },
                {
                    alias: 'C',
                    description: 'Minutes Longitude',
                    searchPattern: /\d{1,2}(?=.*?[E|W|E|W])/i,
                },
                {
                    alias: 'D',
                    description: 'Seconds Longitude',
                    searchPattern: /\d{1,2}[\.|\.]?\d*(?=.*?[E|W|E|W])/i,
                },
                {
                    alias: 'E',
                    description: 'east/west indicator',
                    searchPattern: /E|W|E|W/i,
                },
                {
                    alias: 'Z',
                    description: 'Elevation',
                    searchPattern: /-?\d+[.]?\d*/,
                },
            ],
            defaultPattern: 'Y°‎ A\' B"N, X°‎ C\' D"E, Z m',
        });
        // add DMS in feet format for 3D to include elevation
        const dmsFeetFormat = new Format({
            name: 'DMS_FT',
            conversionInfo: {
                // @ts-ignore
                convert: function (point: Point) {
                    const returnPoint = point.spatialReference.isWGS84
                        ? point
                        : (webMercatorUtils.webMercatorToGeographic(point) as Point);
                    const xNum = returnPoint.x;
                    const x = Math.trunc(xNum).toFixed(0);
                    const cNum = (xNum - Math.trunc(xNum)) * 60;
                    const c = Math.trunc(cNum).toFixed(0);
                    const dNum = (cNum - Math.trunc(cNum)) * 60;
                    const d = dNum.toFixed(4);
                    const yNum = returnPoint.y;
                    const y = Math.trunc(yNum).toFixed(0);
                    const aNum = (yNum - Math.trunc(yNum)) * 60;
                    const a = Math.trunc(aNum).toFixed(0);
                    const bNum = (aNum - Math.trunc(aNum)) * 60;
                    const b = bNum.toFixed(4);
                    const z = (returnPoint.z * 3.28084).toFixed(4);

                    let northing = 'N';
                    let easting = 'E';

                    if (parseFloat(y) < 0) {
                        northing = 'S';
                    }
                    if (parseFloat(x) < 0) {
                        easting = 'W';
                    }
                    return {
                        location: returnPoint,
                        // coordinate: 'Y°‎ A\' B\\"N, X°‎ C\' D\\"E"\n\' ${z}'
                        coordinate: `${y}° ${a}\\' ${b}\\"${northing}, ${x}° ${c}\\' ${d}\\"${easting}, ${z}ft `,
                    };
                },
                // @ts-ignore
                reverseConvert: function (str: string) {
                    const parts = str.split(',');
                    const fullY = parts[0].trim();
                    const fullX = parts[1].trim();
                    const fullZ = parts[2].trim();

                    // break up y a and b recombine them to dd
                    const yString = fullY.split(' ');
                    const yDegrees = parseFloat(yString[0]);
                    const yMinutes = parseFloat(yString[1]);
                    const ySeconds = parseFloat(yString[2].substring(0, yString[2].indexOf('"')));
                    // break up x c and d recombine them to dd
                    const xString = fullX.split(' ').map(function (item) {
                        return item.trim();
                    });
                    const xDegrees = parseFloat(xString[0]);
                    const xMinutes = parseFloat(xString[1]);
                    const xSeconds = parseFloat(xString[2].substring(0, xString[2].indexOf('"')));
                    // remove ft from Z and convert back to meters
                    let zInFeet = 0.0;
                    if (fullZ.endsWith('ft')) {
                        zInFeet = parseFloat(fullZ.substring(0, fullZ.lastIndexOf('ft')));
                    } else {
                        zInFeet = parseFloat(fullZ);
                    }

                    return new Point({
                        y: yDegrees + yMinutes / 60 + ySeconds / 3600,
                        x: xDegrees + xMinutes / 60 + xSeconds / 3600,
                        z: zInFeet / 3.28084,
                        spatialReference: { wkid: 4326 },
                    });
                },
            },
            coordinateSegments: [
                {
                    alias: 'Y',
                    description: 'Degrees Latitude',
                    searchPattern: /\d{1,2}(?=.*?\s+.*?[N|S|N|S])/i,
                },
                {
                    alias: 'A',
                    description: 'Minutes Latitude',
                    searchPattern: /\d{1,2}(?=.*?[N|S|N|S])/i,
                },
                {
                    alias: 'B',
                    description: 'Seconds Latitude',
                    searchPattern: /\d{1,2}[\.|\.]?\d*(?=.*?[N|S|N|S])/i,
                },
                {
                    alias: 'N',
                    description: 'north/south indicator',
                    searchPattern: /N|S|N|S/i,
                },
                {
                    alias: 'X',
                    description: 'Degrees Longitude',
                    searchPattern: /\d{1,3}(?=.*?\s+.*?[E|W|E|W])/i,
                },
                {
                    alias: 'C',
                    description: 'Minutes Longitude',
                    searchPattern: /\d{1,2}(?=.*?[E|W|E|W])/i,
                },
                {
                    alias: 'D',
                    description: 'Seconds Longitude',
                    searchPattern: /\d{1,2}[\.|\.]?\d*(?=.*?[E|W|E|W])/i,
                },
                {
                    alias: 'E',
                    description: 'east/west indicator',
                    searchPattern: /E|W|E|W/i,
                },
                {
                    alias: 'Z',
                    description: 'Elevation',
                    searchPattern: /-?\d+[.]?\d*/,
                },
            ],
            defaultPattern: 'Y°‎ A\' B"N, X°‎ C\' D"E, Z ft',
        });
        // add DD format for 3D mode - needed to override northing and easting bug in coordinate conversion widget
        const dd = new Format({
            name: 'DD',
            conversionInfo: {
                // @ts-ignore
                convert: function (point: Point) {
                    const returnPoint = point.spatialReference.isWGS84
                        ? point
                        : (webMercatorUtils.webMercatorToGeographic(point) as Point);

                    const x = returnPoint.x.toFixed(6);
                    const y = returnPoint.y.toFixed(6);

                    return {
                        location: returnPoint,
                        coordinate: `${y}, ${x}`,
                    };
                },
                // @ts-ignore
                reverseConvert: function (str: string) {
                    const parts = str.split(',');
                    return new Point({
                        x: parseFloat(parts[1]),
                        y: parseFloat(parts[0]),
                        spatialReference: { wkid: 4326 },
                    });
                },
            },
            coordinateSegments: [
                {
                    alias: 'X',
                    description: 'Degrees Longitude',
                    searchPattern: /-?\d+[\.]?\d*/,
                },

                {
                    alias: 'Y',
                    description: 'Degrees Latitude',
                    searchPattern: /-?\d+[\.]?\d*/,
                },
            ],
            defaultPattern: 'Y°, X°',
        });
        coords.formats.remove(coords.formats.find((f) => f.name === 'dd'));
        coords.formats.add(dd);
        coords.conversions.removeAll();
        coords.conversions.add(new Conversion({ format: dd }));
        coords.formats.add(dmsFeetFormat);
        coords.formats.add(dmsMetersFormat);
        coords.formats.add(ddzFeetFormat);
        coords.formats.add(ddzFormat);
        coords.formats.add(xyzFormat);
        coords.formats.add(STRATDMS);
    } else {
        // add STRATDMS format for 2d with no elevation.
        const STRATDMS = new Format({
            name: 'STRATDMS',
            conversionInfo: {
                // @ts-ignore
                convert: function (point: Point) {
                    const returnPoint = point.spatialReference.isWGS84
                        ? point
                        : (webMercatorUtils.webMercatorToGeographic(point) as Point);
                    const xNum = returnPoint.x;
                    let x = Math.trunc(xNum).toFixed(0);
                    const cNum = (xNum - Math.trunc(xNum)) * 60;
                    const c = Math.trunc(Math.abs(cNum)).toFixed(0).padStart(2, '0');
                    const dNum = (cNum - Math.trunc(cNum)) * 60;
                    const d = Math.abs(dNum).toFixed(0).padStart(2, '0');
                    const yNum = returnPoint.y;
                    let y = Math.trunc(yNum).toFixed(0);
                    const aNum = (yNum - Math.trunc(yNum)) * 60;
                    let a = Math.trunc(Math.abs(aNum)).toFixed(0).padStart(2, '0');
                    const bNum = (aNum - Math.trunc(aNum)) * 60;
                    let b = Math.abs(bNum).toFixed(0).padStart(2, '0');

                    // This if statement rounds up the b number from 60 to 0 and the corresponding a value to the next number.
                    // It is to correct the problem of values displaying 365860N0961660W instead of 365900N0961700W.
                    if (b == '60') {
                        b = '00';
                        a = (parseInt(a) + 1).toString();
                    }

                    let northing = 'N';
                    let easting = 'E';
                    if (yNum < 0) {
                        northing = 'S';
                        y = y.replace('-', '');
                    }
                    if (xNum < 0) {
                        easting = 'W';
                        x = x.replace('-', '');
                    }
                    x = x.padStart(3, '0');
                    y = y.padStart(2, '0');
                    const reportValue = `${y}${a}${b}${northing}${x}${c}${d}${easting}`;
                    return {
                        location: returnPoint,
                        coordinate: reportValue,
                    };
                },

                // @ts-ignore
                reverseConvert: function (str: string) {
                    // example coordinate is 010101N0010101E
                    // break apart by 2,2,2,1,3,2,2,1
                    let fullY = str.substring(0, 7);
                    let fullX = str.substring(7).trim();
                    // check if entered string contains S or W for coordinate quadrant
                    const southing = fullY.search('S');
                    const westing = fullX.search('W');
                    // break up y a and b to recombine them to dd
                    let yDegrees = parseFloat(fullY.substring(0, 2));
                    let yMinutes = parseFloat(fullY.substring(2, 4));
                    let ySeconds = parseFloat(fullY.substring(4, 6));
                    // break up x c and d to recombine them to dd
                    let xDegrees = parseFloat(fullX.substring(0, 3));
                    let xMinutes = parseFloat(fullX.substring(3, 5));
                    let xSeconds = parseFloat(fullX.substring(5, 7));
                    // if S is found in the entered string, make the coordinate negative and shift the string parsing
                    if (southing !== -1) {
                        fullY = '-' + fullY;
                        yDegrees = parseFloat(fullY.substring(0, 3));
                        yMinutes = parseFloat(fullY.substring(3, 5));
                        ySeconds = parseFloat(fullY.substring(5, 8));
                    }
                    // if W is found in the entered string, make the coordinate negative and shift the string parsing
                    if (westing !== -1) {
                        fullX = '-' + fullX;
                        xDegrees = parseFloat(fullX.substring(0, 4));
                        xMinutes = parseFloat(fullX.substring(4, 6));
                        xSeconds = parseFloat(fullX.substring(6, 8));
                    }
                    // combine the degree segments
                    return new Point({
                        y: yDegrees + yMinutes / 60 + ySeconds / 3600,
                        x: xDegrees + xMinutes / 60 + xSeconds / 3600,
                        spatialReference: { wkid: 4326 },
                    });
                },
            },
            coordinateSegments: [
                {
                    alias: 'Y',
                    description: 'Degrees Latitude',
                    searchPattern: /\d{1,2}(?=.*?\s+.*?[N|S|N|S])/i,
                },
                {
                    alias: 'A',
                    description: 'Minutes Latitude',
                    searchPattern: /\d{1,2}(?=.*?[N|S|N|S])/i,
                },
                {
                    alias: 'B',
                    description: 'Seconds Latitude',
                    searchPattern: /\d{1,2}[\.|\.]?\d*(?=.*?[N|S|N|S])/i,
                },
                {
                    alias: 'N',
                    description: 'north/south indicator',
                    searchPattern: /N|S|N|S/i,
                },
                {
                    alias: 'X',
                    description: 'Degrees Longitude',
                    searchPattern: /\d{1,3}(?=.*?\s+.*?[E|W|E|W])/i,
                },
                {
                    alias: 'C',
                    description: 'Minutes Longitude',
                    searchPattern: /\d{1,2}(?=.*?[E|W|E|W])/i,
                },
                {
                    alias: 'D',
                    description: 'Seconds Longitude',
                    searchPattern: /\d{1,2}[\.|\.]?\d*(?=.*?[E|W|E|W])/i,
                },
                {
                    alias: 'E',
                    description: 'east/west indicator',
                    searchPattern: /E|W|E|W/i,
                },
            ],
            defaultPattern: 'YABNXCDE',
        });

        // add DD format for 2D mode - needed to override northing and easting bug in coordinate conversion widget
        const dd = new Format({
            name: 'DD',
            conversionInfo: {
                // @ts-ignore
                convert: function (point: Point) {
                    const returnPoint = point.spatialReference.isWGS84
                        ? point
                        : (webMercatorUtils.webMercatorToGeographic(point) as Point);

                    const x = returnPoint.x.toFixed(6);
                    const y = returnPoint.y.toFixed(6);

                    return {
                        location: returnPoint,
                        coordinate: `${y}, ${x}`,
                    };
                },
                // @ts-ignore
                reverseConvert: function (str: string) {
                    const parts = str.split(',');
                    return new Point({
                        x: parseFloat(parts[1]),
                        y: parseFloat(parts[0]),
                        spatialReference: { wkid: 4326 },
                    });
                },
            },
            coordinateSegments: [
                {
                    alias: 'X',
                    description: 'Degrees Longitude',
                    searchPattern: /-?\d+[\.]?\d*/,
                },

                {
                    alias: 'Y',
                    description: 'Degrees Latitude',
                    searchPattern: /-?\d+[\.]?\d*/,
                },
            ],
            defaultPattern: 'Y°, X°',
        });
        coords.formats.remove(coords.formats.find((f) => f.name === 'dd'));
        coords.formats.add(dd);
        coords.conversions.removeAll();
        coords.conversions.add(new Conversion({ format: dd }));
        coords.formats.add(STRATDMS);
    }

    const coordinateBtn = document.querySelector('[title="Coordinate Conversion"]');
    coordinateBtn?.addEventListener('click', function () {
        handleCoordinateButtonClick(currentView, coords);
    });
}

export function handleCoordinateButtonClick(activeView: MapView | SceneView, coords?: CoordinateConversion): void {
    if (coords) {
        const coordsRef = activeView.ui.find('coords');

        if (!coordsRef) {
            activeView.ui.add(coords, {
                position: 'bottom-right',
            });
        } else {
            activeView.ui.remove(coordsRef);
            coords.mode = 'live';
        }
    }
}

/**
 * Initializes the ViewSwitcher widget and embeds it inside the active view's UI.
 * Also restores essential UI widgets like BasemapGallery and CoordinateConversion **if they were enabled before switching views**.
 * @param activeView - The currently active view (MapView or SceneView).
 * @param inactiveView - The view that is currently inactive.
 */
export function initViewSwitcher(activeView: MapView | SceneView, inactiveView: MapView | SceneView): void {
    console.debug('Initializing ViewSwitcher on', activeView.type.toUpperCase());

    // First, remove any existing ViewSwitcher from **both** views
    const existingSwitcherActive = activeView.ui.find('viewSwitcher');
    if (existingSwitcherActive) {
        activeView.ui.remove(existingSwitcherActive);
    }

    const existingSwitcherInactive = inactiveView.ui.find('viewSwitcher');
    if (existingSwitcherInactive) {
        inactiveView.ui.remove(existingSwitcherInactive);
    }

    // Create and add the ViewSwitcher **only once**
    const switcher = new ViewSwitcher({
        activeView,
        inactiveView,
        onViewChange: (newActiveView, newInactiveView) => {
            console.debug('Switching Views to', newActiveView.type.toUpperCase());
            initViewSwitcher(newActiveView, newInactiveView);
        },
    });

    // explicitly assign an ID to the ViewSwitcher
    switcher.id = 'viewSwitcher';

    activeView.ui.add(switcher, {
        position: 'top-right',
        index: 0,
    });

    // Check if BasemapGallery was selected before switching
    const basemapBtn = document.querySelector('[title="Basemap"]') as HTMLButtonElement;
    const isBasemapSelected = basemapBtn?.classList.contains('Mui-selected') ?? false;
    if (isBasemapSelected && !activeView.ui.find('basemapGallery')) {
        const widget = new BasemapGallery({ view: activeView, id: 'basemapGallery' });
        activeView.ui.add(widget, 'top-right');
    }

    // Check if CoordinateConversion was selected before switching
    const coordBtn = document.querySelector('[title="Coordinate Conversion"]') as HTMLButtonElement;
    const isCoordsSelected = coordBtn?.classList.contains('Mui-selected') ?? false;
    if (isCoordsSelected && !activeView.ui.find('coords')) {
        const widget = new CoordinateConversion({ view: activeView, id: 'coords' });
        activeView.ui.add(widget, 'bottom-right');
    }

    console.debug('ViewSwitcher initialized on', activeView.type.toUpperCase());
}

/**
 * Initializes the Basemap Gallery widget and adds it to a specific view.
 * @param view View on which to attach the basemap gallery
 */
export function initBasemapGallery(view: MapView | SceneView): void {
    const basemapBtn = document.querySelector('[title="Basemap"]');
    const basemapGallery = new BasemapGallery({
        view,
        id: 'basemapGallery',
    });

    basemapBtn?.addEventListener('click', () => {
        const basemapGalleryRef = view.ui.find('basemapGallery');

        if (!basemapGalleryRef) {
            view.ui.add(basemapGallery, {
                position: 'top-right',
            });
        } else {
            view.ui.remove(basemapGalleryRef);
        }
    });
}

/**
 * Initialize a Scale bar widget and add it to a view
 * @param view
 */
export function initScaleBar(view: MapView): void {
    const scalebar = new ScaleBar({
        view,
    });
    view.ui.add(scalebar, 'bottom-left');
}
