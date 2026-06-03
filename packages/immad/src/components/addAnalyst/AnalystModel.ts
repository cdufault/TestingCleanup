import { ImmadAnalyst, userRoleType } from '../../hooks/missionHooks';
import { refreshCallback, SortDirection } from '../home/components/missionCreate/views/interfaces';

/**
 * Set the analysts role based on their membership in the group as an analyst or manager.
 * @param analysts ImmadAnalsyt array
 * @param userNames usernames of group members
 * @param roleType analyst's role type
 */
export function updateUserRoleBasedOnType(analysts: ImmadAnalyst[], userNames: string[], roleType: userRoleType): void {
    userNames.forEach((userName) => {
        const foundUser = analysts.find((analyst) => analyst.id === userName);
        if (foundUser) {
            foundUser.userRole = roleType;
        }
    });
}

/**
 * Iterate allImmadAnalysts and get those tagged as manager or analsyt and set them as the selected analsyts datagrid rows then extract thier usernames
 * into an array and set that as the selection model for the all anaslyst datagrid.
 *
 * @param analystArray ImmadAnalsyt array
 * @param func  callback funtion method should call when done to update the datagrid state props
 * @param analystUpdateCallback callback to update the mission analysts in the mission
 * @param updateState boolean as to whether or not to update the state when done
 */
export function refreshGridModel(
    analystArray: ImmadAnalyst[],
    func: refreshCallback,
    analystUpdateCallback: (userNamesInMission: string[]) => void,
    updateState = true
): void {
    const missionMembers = getMissionMgrsAndAnalysts(analystArray);
    const userNamesInMission = missionMembers.map((user) => user.id);

    func(missionMembers, userNamesInMission);
    if (updateState) {
        analystUpdateCallback(userNamesInMission);
    }
}

/**
 * Find all analysts and managers in the allImmadAnalysts array.
 * @param analystsArray immad analysts
 */
function getMissionMgrsAndAnalysts(analystsArray: ImmadAnalyst[]): ImmadAnalyst[] {
    return analystsArray.filter((analyst) => {
        return analyst.userRole === 'analyst' || analyst.userRole === 'manager';
    });
}

/**
 * Update analsyts role to userRoleType for all usernames in the selectedUsernamesInGrid array
 * @param immadAnalysts immad analsys
 * @param selectedUserNamesInGrid user names currently selected in the grid
 * @param roleType add this role type to analysts matching a name in the selection array
 */
export function updateAnalystRoleInMission(
    immadAnalysts: ImmadAnalyst[],
    selectedUserNamesInGrid: string[],
    roleType: userRoleType
): ImmadAnalyst[] {
    const copyArray = [...immadAnalysts];
    if (selectedUserNamesInGrid.length > 0) {
        immadAnalysts.forEach((analyst) => {
            const foundAnalystName = selectedUserNamesInGrid.find((analystName) => analyst.id === analystName);
            if (foundAnalystName && analyst.userRole !== 'manager') {
                analyst.userRole = roleType;
            } else if (!foundAnalystName && analyst.userRole !== 'manager') {
                analyst.userRole = '';
            }
        });
    }
    else{
        immadAnalysts.forEach((analyst) =>  analyst.userRole = '');
    }
    return [...copyArray];
}

/**
 * Filter the datagrid items to only items containing the filter text.
 * @param filterString text typed into the search
 * @param allImmadAnalysts backing array of immad analysts
 * @param userNamesAddedToMission user names in the grid selection model
 * @param hideMangersInFilteredView option to hide manager names in the datagrid -- previously mgrs were not shown in this view
 */
export function filterGridBasedOnSearchString(
    filterString: string,
    allImmadAnalysts: ImmadAnalyst[],
    userNamesAddedToMission: string[],
    hideMangersInFilteredView = false
): ImmadAnalyst[] {
    let usersInGrid = [];
    usersInGrid = allImmadAnalysts.filter((analyst) => {
        //filter out non-matching along with all analysts that have been added to the mission.
        if (hideMangersInFilteredView) {
            if (
                analyst.id.toLowerCase().includes(filterString.toLowerCase()) &&
                userNamesAddedToMission.findIndex((name) => name.toLowerCase() === analyst.id.toLowerCase()) === -1
            ) {
                return analyst;
            }
        } else {
            if (analyst.id.toLowerCase().includes(filterString.toLowerCase())) {
                return analyst;
            }
        }
    });

    return usersInGrid;
}

/**
 *After an analyst has been added or removed this method updates the model data supporting the grid to reflect those changes.
 * @param usersInFilteredGrid users in the filtered grid
 * @param selectedAnalystNamesInGrid current grid selection of analyst names
 * @param roleType analyst's role : manager or analyst
 * @param allImmadAnalysts backing array of all the immad analysts
 * @param func  callback funtion method should call when done to update the datagrid state props
 * @param dispatchFunc update the state reducer that holds mission creation state
 *
 */
export function updateAnalystRoleInFilteredMissionView(
    usersInFilteredGrid: ImmadAnalyst[],
    selectedAnalystNamesInGrid: string[],
    roleType: userRoleType,
    allImmadAnalysts: ImmadAnalyst[],
    func: refreshCallback,
    analystUpdateCallback: (userNamesInMission : string[])=>void
): void {
    if (selectedAnalystNamesInGrid.length < 1) {
        return;
    }
    usersInFilteredGrid.forEach((analystInFilteredGrid) => {
        const foundAnalystName = selectedAnalystNamesInGrid.find(
            (analystName) => analystInFilteredGrid.id === analystName
        );
        if (foundAnalystName && analystInFilteredGrid.userRole !== 'manager') {
            const analyst = allImmadAnalysts.find((a) => a.id === foundAnalystName);
            if (analyst) analyst.userRole = roleType;
            analystInFilteredGrid.userRole = roleType;
        } else if (!foundAnalystName && analystInFilteredGrid.userRole !== 'manager') {
            analystInFilteredGrid.userRole = '';
            const analyst = allImmadAnalysts.find((a) => a.id === analystInFilteredGrid.id);
            if (analyst) analyst.userRole = '';
        }
    });
    refreshGridModel(allImmadAnalysts, func, analystUpdateCallback, true);
}

/**
 * Sort ImmadAnalyst type objects
 * @param a analyst A
 * @param b analyst B
 * @param searchField object property to search on
 * @param dir sort direction
 */
export function sortAnalysts(
    a: ImmadAnalyst,
    b: ImmadAnalyst,
    searchField: string,
    dir: SortDirection = 'ASC'
): number {
    if (!a || !b) {
        return 1;
    }

    const propA = a[searchField as keyof ImmadAnalyst] ? a[searchField as keyof ImmadAnalyst] : 'zzzz'; //push empty fields to the end
    const propB = b[searchField as keyof ImmadAnalyst] ? b[searchField as keyof ImmadAnalyst] : 'zzzz';
    if (propA && propB && propA.toLowerCase().trim() >= propB.toLowerCase().trim()) {
        if (dir === 'ASC') {
            return 1;
        } else {
            return -1;
        }
    } else if (dir === 'ASC') {
        return -1;
    }
    return 1;
}
