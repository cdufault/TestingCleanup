/*{
    "enum":[
        "person",
        "vessel",
        "facility",
        "organization",
        "event",
        "meteriel_ref",
        "materiel_nso",
        "materiel",
        "aircraft",
        "vehicle_nso",
        "device",
        "capability",
        "vessel_nso",
        "account",
        "aircraft_nso",
        "vessel_ref",
        "vehicle_ref",
        "vehicle",
        "technology",
        "aircraft_ref",
        "missile_ref",
        "missile_nro",
        "network"
    ]
}*/

export function getEntities(): string[] {
    const mockValues = [
        'person',
        'vessel',
        'facility',
        'organization',
        'event',
        'meteriel_ref',
        'materiel_nso',
        'materiel',
        'aircraft',
        'vehicle_nso',
        'device',
        'capability',
        'vessel_nso',
        'account',
        'aircraft_nso',
        'vessel_ref',
        'vehicle_ref',
        'vehicle',
        'technology',
        'aircraft_ref',
        'missile_ref',
        'missile_nro',
        'network',
    ];
    return mockValues;
}

export function getDetails(): string[] {
    const rnd = Math.floor(Math.random() * 3);
    const mockVals = [
        ['usage', 'country_code', 'country', 'activity_code_descr', 'place_name'],
        ['common_name', 'type', 'description', 'long_name', 'note', 'validation'],
        ['activity', 'district', 'province', 'short_name', 'street'],
    ];

    return mockVals[rnd];
}
