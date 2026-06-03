export enum RowStatusEnum {
    'ISSUING_STRATLEAD' = 'issuing stratlead',
    'ISSUED_STRATLEAD' = 'issued stratlead',
    'UPDATING_STRATLEAD' = 'updating stratlead',
    'UPDATED_STRATLEAD' = 'updated stratlead',
    'EVALUATING' = 'evaluating',
    'NO_ACTION' = 'no action',
    'CLEAR_STATUS' = 'clear status',
    'ISSUE' = 'issue',
    'UPDATE_ALL' = 'update all',

    'UPDATED_STRATLEAD_TIME' = 'update time',
    'UPDATING_STRATLEAD_TIME' = 'updating time',
    'UPDATED_STRATLEAD_LOCATION' = 'update location',
    'UPDATING_STRATLEAD_LOCATION' = 'updating location',
    'UPDATED_STRATLEAD_SOURCE' = 'update source',
    'UPDATING_STRATLEAD_SOURCE' = 'updating source',
}

export interface QuickFilterOption {
    id: string;
    label: string;
    value: string;
}
export const splitButtonOptions = [
    { name: 'Reset Grid', description: 'Remove filters, reset column sizes, order and sort' },
    { name: 'Reset Filters', description: 'Reset filters' },
    { name: 'Reset Columns', description: 'Reset column sizes, order and sort' },
];
