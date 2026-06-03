import { ImmadAnalyst } from '../../../../../hooks/missionHooks';
import { MissionAction } from '../../../../../contexts/missionStateReducer';

/**
 * Structure for creating a sort object.
 */
export interface SortByOption {
    id: number;
    label: string;
    sortField: string;
    fieldType?: string;
}

/**
 * Type for a function parameter that allows the analyst model to update state objects
 */
export type refreshGridType = (
    analystArray: ImmadAnalyst[],
    func: (analyst: ImmadAnalyst[], names: string[]) => void,
    dispatchFunc: React.Dispatch<MissionAction>,
    updateState: boolean
) => void;

/**
 * Sort direction
 */
export type SortDirection = 'ASC' | 'DESC';

/**
 * Type for a callback funtion that updates state variables for analysts.tsx
 */
export type refreshCallback = (analyst: ImmadAnalyst[], names: string[]) => void;
