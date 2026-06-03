import { MissionState } from '../../../contexts/missionStateReducer';

/**
 *
 * @param item item to find
 * @param mission current mission state data
 */
export function isAnalystAddedToMission(item: { id: string }, mission: MissionState): boolean {
    const userName = mission.analysts.find((analyst) => analyst?.id === item.id);
    return !!userName;
}
