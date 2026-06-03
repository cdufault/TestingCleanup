/**
 * License Info schema for the Portal classification tools classification.
 */
export interface PortalClassification {
    classification: string;
    banner: string;
    disseminationOptions?: string[];
    classificationDate: string;
    declassificationDate: string;
    fgiOptions?: string[];
    isRawSigint: boolean;
    isEvaluatedAndMinimized: boolean;
    isDisseminable: boolean;
    lacOptions: string[];
    topicOptions: string[];
    regionOptions: string[];
    relToOptions?: string[];
    sciOptions?: string[];
    classifiedBy: string;
}
