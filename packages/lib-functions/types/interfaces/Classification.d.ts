export interface Classification {
    id: number;
    label: string;
}
export interface ClassificationMarking {
    classification: string;
    banner: string;
    sciOptions?: string[];
    sapOptions?: string[];
    aeaOptions?: string[];
    fgiOptions?: string[];
    disseminationOptions?: string[];
    relToOptions?: string[];
}
export interface ClassificationItem {
    id: string;
    type: string;
    title: string;
    licenseInfo: string;
    portalHostname: string;
    classification: ClassificationMarking | null;
    manualClassification: ClassificationMarking | null;
}
