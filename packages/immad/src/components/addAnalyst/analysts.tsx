import React, { ChangeEvent, useEffect, useState } from "react";
import { ImmadAnalyst, useAnalysts } from "../../hooks/missionHooks";
import { Box, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { AppConfig } from "../../interfaces/AppConfig";

import SearchTextBox from "../home/components/missionCreate/views/Search";
import SortBox from "../home/components/missionCreate/views/Sort";
import { refreshCallback } from "../home/components/missionCreate/views/interfaces";
import {
	filterGridBasedOnSearchString,
	refreshGridModel,
	sortAnalysts,
	updateAnalystRoleInMission,
	updateAnalystRoleInFilteredMissionView,
	updateUserRoleBasedOnType,
} from "./AnalystModel";
import { InputGroup } from "../common";
import {
	StyledBoxAnalystGridParentDisplayFlex,
	StyledBoxAllAnalystGrid,
	StyledBoxSelectedAnalystGrid,
} from "../home/components/missionCreate/styles";
import { getPortalGroupUsers } from "../../helpers/portalUsersHelper";
import { RootState } from "../../data/store";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { updateAnalystsInTheMission } from "../home/components/missionCreate/MissionCreationSlice";
import { joinLabel } from "../../Constants";

const allAnalystsGridColumns: GridColDef[] = [
	{
		field: "id",
		headerName: "User Name",
		width: 450,
		editable: false,
	},
	{
		field: "lastLogin",
		headerName: "Last Login",
		width: 550,
		editable: false,
	},
];

const selectedAnalystsGridColumns: GridColDef[] = [
	{
		field: "id",
		headerName: "User Name",
		width: 390,
		editable: false,
	},
];

interface SortByOption {
	id: number;
	label: string;
	sortField: string;
}

export type SortDirection = "ASC" | "DESC";

const sortByOptions = [
	{
		id: 0,
		label: "User Name",
		sortField: "id",
	},
];

const Analysts = (props: {
	groupId: string;
	analystUpdateCallback: (userNamesInMission: string[]) => void;
	config: AppConfig;
	resetAnalysts?: boolean;
	mgrsNamesInCreateMissionReducer?: string[];
}): JSX.Element => {
	const {
		groupId,
		analystUpdateCallback,
		mgrsNamesInCreateMissionReducer,
		resetAnalysts,
	} = props;
	const { users } = useAnalysts(); //portal users from the analyst group - ImmadAnalyst
	const [allImmadAnalysts, setAllImmadAnalysts] = useState<ImmadAnalyst[]>([]);

	const [userNamesAddedToMission, setUserNamesAddedToMission] = useState<
		string[]
	>([]); //users added to mission + group admins

	const [usersInGrid, setUsersInGrid] = useState<ImmadAnalyst[]>([]); //analysts displayed in the all analysts grid
	const [usersAddedToMissionInGrid, setUsersAddedToMissionInGrid] = useState<
		ImmadAnalyst[]
	>([]); //objs displayed in the selected users grid

	const [filterString, setFilterString] = useState<string>("");
	const [filterApplied, setFilterApplied] = useState<boolean>(false);

	const [sortOrder, setSortOrder] = useState<SortDirection>("ASC");
	const [sortBy, setSortBy] = useState<SortByOption>(sortByOptions[0]);
	const [filterStringCleared, setFilterStringCleared] = useState<boolean>(true);
	const appDispatch = useAppDispatch();

	const immadAdminNames = useAppSelector(
		(state: RootState) => state.missionCreationSlice.immadAdminUserNames,
	);
	const usersAddedViaGrid = useAppSelector(
		(state: RootState) => state.missionCreationSlice.analystsInTheMission,
	);
	const [existingGroupManagers, setExistingGroupManagers] = useState<string[]>(
		[],
	);
	const [allAnalysts, setAllAnalysts] = useState<string[] | undefined>();
	const [page, setPage] = useState<number>(0);
	const pageSize = 8;

	useEffect(() => {
		if (
			allAnalysts &&
			users &&
			users.length > 0 &&
			immadAdminNames &&
			immadAdminNames.length > 0
		) {
			updateUsers();
		}
	}, [users, immadAdminNames, existingGroupManagers, allAnalysts]);

	/**
	 * Get all the users currently assigned to the mission/group excluding mgrs and owner
	 * @returns array of user names assigned to mission or an empty array
	 */
	function getAllCurrentUsersAssignedToMission(): string[] {
		if (usersAddedViaGrid && !resetAnalysts) {
			return [...usersAddedViaGrid];
		} else if (allAnalysts) {
			return [...allAnalysts];
		} else {
			return [];
		}
	}

	/**
	 * Sort out users/analysts from admins
	 */
	async function updateUsers() {
		//users assigned to the analyst group which includes analysts, mission mgrs, and admins
		const allImmadUserObjects = [...users];

		//find users in the admin group + users added as admins if doing a mission edit +
		//users added as admins via the missionData UI
		let mgrs: string[] = [];
		if (mgrsNamesInCreateMissionReducer) {
			mgrs = [...mgrsNamesInCreateMissionReducer];
		}
		if (existingGroupManagers) {
			mgrs = [...mgrs, ...existingGroupManagers]; //can't remove an existing mgr from the analyst ui
		}
		const allAdmins = [...mgrs, ...immadAdminNames];
		const adminsSet = new Set(allAdmins); //eliminate duplicates
		const adminsArray = Array.from(adminsSet);

		const analysts: string[] = getAllCurrentUsersAssignedToMission();
		updateUserRoleBasedOnType(allImmadUserObjects, analysts, "analyst");
		updateUserRoleBasedOnType(
			allImmadUserObjects,
			adminsArray ? adminsArray : [],
			"manager",
		);

		refreshGridModel(users, tempRefreshGrid, analystUpdateCallback, true);

		//don't list users with manager role (admins) in the grid
		const analystUsers = users.filter((user) => user.userRole !== "manager");
		setAllImmadAnalysts(analystUsers); //data rows for the all analyst grid
		setUsersInGrid(analystUsers);
	}

	useEffect(() => {
		if (filterString != "") {
			setFilterStringCleared(false);
			setUsersInGrid(
				filterGridBasedOnSearchString(
					filterString,
					allImmadAnalysts,
					userNamesAddedToMission,
				),
			);
			if (!filterApplied) setFilterApplied(true);
		} else {
			if (filterApplied) {
				setFilterStringCleared(true);
			}
		}
	}, [filterString]);

	useEffect(() => {
		if (usersInGrid && usersInGrid.length > 0) {
			sort();
		}
	}, [sortOrder, sortBy]);

	useEffect(() => {
		if (usersInGrid && usersInGrid.length > 0 && !filterApplied) {
			sort();
		}
	}, [filterApplied]);

	useEffect(() => {
		if (filterString === "" && filterApplied) {
			clearFilter();
		}
	}, [filterStringCleared]);

	useEffect(() => {
		if (groupId && groupId.length > 0) {
			getPortalGroupUsers(groupId).then((result) => {
				if (!mgrsNamesInCreateMissionReducer) {
					//coming from UI in mission creation workflow
					setExistingGroupManagers([...result.admins]);
				}

				setAllAnalysts([...result.users]);
			});
		} else {
			//creating new mission so there is no existing group id
			setAllAnalysts([]);
		}
	}, [groupId]);

	/**
	 * Callback method for the model to use to flag updates are needed for the view state objects
	 * @param missionMembers all analysts in the datagrid -- maps to the grid's current data model
	 * @param userNamesInMission selected analyst names -- maps to grid selection model
	 */
	const tempRefreshGrid: refreshCallback = (
		missionMembers: ImmadAnalyst[],
		userNamesInMission: string[],
	) => {
		setUserNamesAddedToMission(userNamesInMission); //all analysts datagrid selection model
		setUsersAddedToMissionInGrid(missionMembers); //selected analysts datagrid rows
	};

	/**
	 * Handle clear filter icon click event
	 */
	const handleClearFilter = () => {
		clearFilter();
	};

	/**
	 * Handle keypress in the search textbox.
	 * @param event keypress event
	 */
	const handleFilterChange = (event: ChangeEvent<HTMLInputElement>) => {
		const searchTerm = event.target.value;
		setFilterString(searchTerm);
	};

	/**
	 * Remove the applied filter on the datagrid and show all the analysts
	 */
	function clearFilter() {
		if (filterString != "") {
			setFilterString("");
		}
		setUsersInGrid([...allImmadAnalysts]);
		setFilterApplied(false);
		refreshGridModel(
			allImmadAnalysts,
			tempRefreshGrid,
			analystUpdateCallback,
			true,
		);
	}

	/**
	 * Handle click or sort order icon.
	 */
	const handleSortOrderChange = async () => {
		const sortDirection = sortOrder === "ASC" ? "DESC" : "ASC";
		setSortOrder(sortDirection);
	};

	/**
	 * handle click on sort field pick list
	 * @param sortByVal event object
	 */
	const handleSortChange = async (sortByVal: string) => {
		const sortBy = sortByOptions?.find(
			(item) => item.id === parseInt(sortByVal),
		);
		if (sortBy) setSortBy(sortBy);
	};

	/**
	 * Sort function on the array of analysts.
	 */
	function sort() {
		const copiedArray = [...usersInGrid];
		const sortedArray = copiedArray.sort((a, b) => {
			return sortAnalysts(a, b, sortBy.sortField, sortOrder);
		});
		setUsersInGrid([...sortedArray]);
	}

	const isLoading = allImmadAnalysts && allImmadAnalysts.length < 1;

	const currentPageRows = usersInGrid.slice(
		page * pageSize,
		(page + 1) * pageSize,
	);

	const currentPageRowIds = currentPageRows.map((row) => row.id);

	/**
	 * Handles row/ analyst selection in grid
	 * @param newSelection a new selection from the grid
	 */
	const handleSelectionModelChange = (newSelection: any[]) => {
		const newSet = new Set(userNamesAddedToMission);
		// prevents select all check from selecting all records in the table - only selects all on current page
		const selectedOnPage = new Set(
			newSelection.filter((id) => currentPageRowIds.includes(id)),
		);
		// Preserves any previously selected records when adding new selections
		for (const id of currentPageRowIds) {
			newSet.delete(id);
		}
		for (const id of selectedOnPage) {
			newSet.add(id);
		}
		// final collection of selected rows
		const finalSet = Array.from(newSet);
		if (filterApplied) {
			updateAnalystRoleInFilteredMissionView(
				usersInGrid,
				finalSet,
				"analyst",
				allImmadAnalysts,
				tempRefreshGrid,
				analystUpdateCallback,
			);
			return;
		}
		updateAnalystRoleInMission(allImmadAnalysts, finalSet, "analyst");
		refreshGridModel(
			allImmadAnalysts,
			tempRefreshGrid,
			analystUpdateCallback,
			true,
		);
		appDispatch(updateAnalystsInTheMission(finalSet));
	};

	return (
		<>
			<InputGroup>
				<SearchTextBox
					handleFilterChange={handleFilterChange}
					handleClearFilter={handleClearFilter}
					filterString={filterString}
					placeHolderString="Search by username."
				/>
				<SortBox
					handleSortChange={handleSortChange}
					sortBy={sortBy}
					sortByOptions={sortByOptions}
					handleSortOrderChange={handleSortOrderChange}
					sortOrder={sortOrder}
				/>
			</InputGroup>
			<StyledBoxAnalystGridParentDisplayFlex>
				<StyledBoxAllAnalystGrid>
					<Box>
						<Typography variant="subtitle2" align="center">
							{joinLabel("All", props.config?.appLabel ?? "", "Analysts")}
						</Typography>
					</Box>
					<DataGrid
						rows={usersInGrid}
						columns={allAnalystsGridColumns}
						pageSize={pageSize}
						checkboxSelection
						disableColumnFilter
						hideFooterSelectedRowCount
						loading={isLoading}
						onSelectionModelChange={handleSelectionModelChange}
						selectionModel={userNamesAddedToMission}
						rowsPerPageOptions={[pageSize]}
						page={page}
						onPageChange={(newPage) => setPage(newPage)}
					/>
				</StyledBoxAllAnalystGrid>
				<StyledBoxSelectedAnalystGrid>
					<Box>
						<Typography variant="subtitle2" align="center">
							Analysts Added to Mission
						</Typography>
					</Box>
					<DataGrid
						rows={usersAddedToMissionInGrid}
						columns={selectedAnalystsGridColumns}
						pageSize={pageSize}
						disableColumnFilter
						hideFooterSelectedRowCount
						loading={isLoading}
						rowsPerPageOptions={[pageSize]}
					/>
				</StyledBoxSelectedAnalystGrid>
			</StyledBoxAnalystGridParentDisplayFlex>
		</>
	);
};
export default Analysts;
