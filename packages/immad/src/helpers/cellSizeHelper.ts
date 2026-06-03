import { SpatialReference } from '@arcgis/core/geometry';
import { extendedSpatialReferenceInfo } from '@arcgis/core/geometry/geometryEngine';

class CellSizeHelper {
    static getSrUnits(inSr: SpatialReference): string {
        let units = 'unknown';
        if (inSr.isGeographic) {
            units = 'DEGREES';
        } else if (inSr.isWebMercator) {
            units = 'METERS';
        } else {
            try {
                const srInfo = extendedSpatialReferenceInfo(inSr);
                switch (srInfo.unitID) {
                    case 9001:
                        units = 'METERS';
                        break;
                    case 9002:
                        units = 'FEET';
                        break;
                }
            } catch {
                //assume degrees for unprojected data
                units = 'DEGREES';
            }
        }
        return units;
    }

    static convertCellSizeToSrUnits(value: number, fromUnits: string, toUnits: string): number {
        //conversion is currently using a latitude of 0, which assumes latitude = longitude and 1 degree = 111111 meters
        //the is essentially calculating cell size based on the cell height
        let returnVal = value;
        switch (fromUnits) {
            case 'METERS':
                switch (toUnits) {
                    case 'DEGREES':
                        returnVal = this._convertMetersToDegrees(value, 0);
                        break;
                    case 'FEET':
                        returnVal = value * 0.3048;
                        break;
                }
                break;
            case 'DEGREES':
                switch (toUnits) {
                    case 'METERS':
                        returnVal = this._convertDegreesToMeters(value, 0);
                        break;
                    case 'FEET':
                        returnVal = this._convertDegreesToFeet(value, 0);
                        break;
                }
                break;
            case 'FEET':
                switch (toUnits) {
                    case 'METERS':
                        returnVal = value / 0.3048;
                        break;
                    case 'DEGREES':
                        returnVal = this._convertFeetToDegrees(value, 0);
                        break;
                }
                break;
        }
        return returnVal;
    }

    private static _convertDegreesToFeet(degrees: number, latitude: number) {
        const metersPerDegree = this._getMetersPerDegreeOfLongitude(latitude);
        return degrees * (metersPerDegree / 0.3048);
    }

    private static _convertFeetToDegrees(feet: number, latitude: number) {
        const metersPerDegree = this._getMetersPerDegreeOfLongitude(latitude);
        return feet / (metersPerDegree / 0.3048);
    }

    private static _convertDegreesToMeters(degrees: number, latitude: number) {
        const metersPerDegree = this._getMetersPerDegreeOfLongitude(latitude);
        return degrees * metersPerDegree;
    }

    private static _convertMetersToDegrees(meters: number, latitude: number) {
        const metersPerDegree = this._getMetersPerDegreeOfLongitude(latitude);
        return meters / metersPerDegree;
    }

    private static _getMetersPerDegreeOfLongitude(latitude: number) {
        const metersPerDegreeOfLatitude = 111111;
        const latInRadians = latitude * (Math.PI / 180);
        return metersPerDegreeOfLatitude * Math.cos(latInRadians);
    }
}

export default CellSizeHelper;
