/**
 * Provides mapping from an esri unit definition to a standard string
 */
export enum EsriUnitsEnum {
    esriInches = 'inches',
    esriFeet = 'feet',
    esriYards = 'yards',
    esriMiles = 'miles',
    esriNauticalMiles = 'nauticalmiles',
    esriMillimeters = 'millimeters',
    esriCentimeters = 'centimeters',
    esriDecimeters = 'decimeters',
    esriMeters = 'meters',
    esriKilometers = 'kilometers',
}

export function getStandardUnitFromEsriUnit(esriUnit: string): string {
    return (EsriUnitsEnum as any)[esriUnit];
}
