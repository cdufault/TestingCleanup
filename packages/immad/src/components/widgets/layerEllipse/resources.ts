import { ChangeEvent } from 'react';

/**
 * EllipseInfo property type
 */
export interface EllipseInfo {
    enabled: boolean;
    semiMajorField: string;
    semiMinorField: string;
    azimuthField: string;
    mode: string;
    ellipseLayerId: string;
    pointLayerId: string;
}

/**
 * Props for field name select
 */
export interface FieldNameSelectProps {
    value: string;
    onChange: (evt: ChangeEvent<HTMLInputElement>) => void;
    label: string;
    name: string;
    title: string;
}
