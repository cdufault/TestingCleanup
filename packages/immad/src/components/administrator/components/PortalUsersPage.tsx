// React imports
import React, { ChangeEvent, useEffect, useRef, useState } from "react";

// Context Imports
import {
	HeadCellTypes,
	useAdminSettingsContext,
	FiltersListItem,
	IMMADGroupType,
} from "../../../contexts/AdminSettingsContext";
// Component imports
import Typography from "@mui/material/Typography";
import { ConfigHelper } from "../../../helpers/configHelper";
import { ISearchResult, IUser } from "@esri/arcgis-rest-portal";
import { AccordionDetails, IconButton, InputAdornment } from "@mui/material";
import { InputField } from "../../common";
import XIcon from "calcite-ui-icons-react/XIcon";
import MagnifyingGlassIcon from "calcite-ui-icons-react/MagnifyingGlassIcon";
import EnhancedTable from "./EnhancedTable";
import FilterListItems from "./FilterListItems";
import {
	searchPortalUserByPartialUserName,
	getAllRoles,
	updatePortalUserRole,
	addUsersToGroupById,
	removeUsersFromPortalGroup,
	getPortalUserGroupsByUsername,
	updatePortalUserLicenceType,
} from "../../../helpers/portalUsersHelper";
// Style imports
import {
	StyledLeftSideDiv,
	StyledRightSideDiv,
	StyledSpaceBetweenRow,
	StyledSplitDivContainer,
	StyledMuiAccordionSummary,
	StyledRightButtonAccordionSummary,
	StyledMuiAccordion,
} from "../styles";
import Box from "@mui/material/Box";
import UpdateModalDialog from "./UpdateModalDialog";
import { findPortalGroupByTitle } from "../../../helpers/portalGroupHelper";
import { useSnackbar } from "notistack";
import { joinLabel } from "../../../Constants";

/**
 * Actions for elements in the Layer List.
 */
export enum IMMADRoles {
	"Admin" = 0,
	"Mission Manager" = 1,
	"Analyst" = 2,
	"Unassigned" = 3,
}

enum HeadCellIds {
	username = "username",
	lastLogin = "lastLogin",
	role = "immadRole",
}

/**
 * IMMADUser Interface to add immadRole to IUser object,
 */
export interface IIMMADUser extends IUser {
	immadRole: number;
	immadTempRole?: string;
}

/**
 * A sub component of the Administrator component that provides the
 * ability to display IMMAD and Portals users and sort them based on filters.
 * @constructor
 */
export default function PortalUsersPage(): JSX.Element {
	const filtersList = enumToFilterList();
	const adminSettingsContext = useAdminSettingsContext();
	const appConfig = ConfigHelper.getAppConfig();
	const { enqueueSnackbar } = useSnackbar();
	const [searchValue, setSearchValue] = useState("");
	const [openUpdateModalDialog, setOpenUpdateModalDialog] = useState(false);
	const [initialized, setInitialized] = useState(false);

	const currentFilter = useRef<FiltersListItem>({ id: 0, value: "" });
	const adminObject = useRef<IMMADGroupType | undefined>({
		groupName: "",
		groupId: "",
	});
	const missionManagerObject = useRef<IMMADGroupType | undefined>({
		groupName: "",
		groupId: "",
	});
	const analystObject = useRef<IMMADGroupType | undefined>({
		groupName: "",
		groupId: "",
	});

	const nonFilterQueryStartIndex = useRef<number>(0);
	const resetListTableOrderChanged = useRef<boolean>(false);
	const immadGroups = useRef<IMMADGroupType[]>([]);
	const lastQueryStartingIndex = useRef<number>(0);

	const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
		// call rest endpoint and set values to those in the state object
		// place holder for logic forth coming to update users will go here.

		// stops the page from closing the form
		event.preventDefault();
	};

	useEffect(() => {
		initializeRefObjects().then(() => {
			// set default settings for page.
			adminSettingsContext.setTableOrderBy(HeadCellIds.username);
			setTableHeadCells();
			updateAllUserData();
			setInitialized(true);
		});
	}, []);

	useEffect(() => {
		if (initialized) {
			if (immadGroups.current.length > 0) {
				updateTable();
			}
		}
	}, [
		adminSettingsContext.rowsPerPage,
		adminSettingsContext.tableOrderBy,
		adminSettingsContext.tablePage,
	]);

	useEffect(() => {
		if (initialized) {
			if (immadGroups.current.length > 0) {
				// possibly could use Typescript AbortController but need to read up on it
				let canceled = false;
				// added clean-up function with boolean flag to handle race conditions when
				// value is typed in to fast.
				// this will allow only the rendering of the last result.
				const fetchData = async () => {
					adminSettingsContext.setTablePage(0);
					if (currentFilter.current.id === 0) {
						// no filter replace users
						if (!canceled) {
							nonFilterQueryStartIndex.current = 0;
							getLoadedUsers(nonFilterQueryStartIndex.current).then(
								(loadedUsers) => {
									if (!canceled) {
										replaceFilteredUsers(loadedUsers);
									}
								},
							);
						}
					} else {
						// filter update by search
						if (!canceled) {
							handleFilterChanged(currentFilter.current);
						}
					}
				};
				fetchData();
				return () => {
					canceled = true;
				};
			}
		}
	}, [searchValue]);

	useEffect(() => {
		if (initialized) {
			if (immadGroups.current.length > 0) {
				// re-query with sort order.
				resetListTableOrderChanged.current = currentFilter.current.id === 0;
				updateTable();
			}
		}
	}, [adminSettingsContext.tableOrder]);

	useEffect(() => {
		if (initialized) {
			if (immadGroups.current.length > 0) {
				updateAllUserData();
			}
		}
	}, [adminSettingsContext.userSettingsUpdated]);

	function updateAllUserData() {
		updateTable();
		if (currentFilter.current.id === 0) {
			getLoadedUsersAfterRoleUpdate().then((loadedUsers) => {
				replaceFilteredUsers(loadedUsers);
			});
		} else {
			// filter update by search
			handleFilterChanged(currentFilter.current);
		}
	}

	async function getLoadedUsersAfterRoleUpdate() {
		// Get users from start of table to current place
		let loadedUsers;
		if (searchValue === "") {
			if (adminSettingsContext.tableOrderBy === "") {
				// for initial load and reloads of page only
				loadedUsers = await searchPortalUserByPartialUserName(
					"*",
					nonFilterQueryStartIndex.current - 1,
					adminSettingsContext.tableOrder,
					0,
					HeadCellIds.username,
				);
			} else {
				loadedUsers = await searchPortalUserByPartialUserName(
					"*",
					nonFilterQueryStartIndex.current - 1,
					adminSettingsContext.tableOrder,
					0,
					adminSettingsContext.tableOrderBy,
				);
			}
		} else {
			loadedUsers = await searchPortalUserByPartialUserName(
				searchValue,
				nonFilterQueryStartIndex.current - 1,
				adminSettingsContext.tableOrder,
				0,
				adminSettingsContext.tableOrderBy,
			);
			// check if searchValue is an exact match for a username in the loadedUsers results
			const singleValue = loadedUsers.results.filter(
				(user) => user.username?.toUpperCase() === searchValue.toUpperCase(),
			);
			if (singleValue.length > 0) {
				loadedUsers.results = singleValue;
			}
		}
		return loadedUsers;
	}

	function enumToFilterList() {
		const arrayObjects = [];
		for (const [propertyKey, propertyValue] of Object.entries(IMMADRoles)) {
			if (!Number.isNaN(Number(propertyKey))) {
				continue;
			}
			arrayObjects.push({ id: Number(propertyValue) + 1, value: propertyKey });
		}
		return arrayObjects;
	}

	function setTableHeadCells() {
		const headCells: HeadCellTypes[] = [
			{
				id: HeadCellIds.username,
				numeric: false,
				disablePadding: true,
				label: "User Name",
				sortEnabled: true,
			},
			{
				id: HeadCellIds.lastLogin,
				numeric: false,
				disablePadding: true,
				label: "Last Login",
				sortEnabled: true,
			},
			{
				id: HeadCellIds.role,
				numeric: false,
				disablePadding: true,
				label: joinLabel(appConfig?.appLabel ?? "", "User Type"),
				sortEnabled: false,
			},
		];
		adminSettingsContext.setEnhancedTableHeadCells(headCells);
	}

	/**
	 * Initializes the page to get all the information needed to
	 * get users and set their IMMAD roles appropriately
	 */
	async function initializeRefObjects() {
		const adminPromise = findPortalGroupByTitle(appConfig.roles.admin.tag).then(
			(adminGroupResult) => {
				immadGroups.current.push({
					groupName: appConfig.roles.admin.tag,
					groupId: adminGroupResult.item[0].id,
				});
			},
		);
		const missionManagerPromise = findPortalGroupByTitle(
			appConfig.roles.missionManager.tag,
		).then((missionManagerGroupResult) => {
			immadGroups.current.push({
				groupName: appConfig.roles.missionManager.tag,
				groupId: missionManagerGroupResult.item[0].id,
			});
		});
		const analystPromise = findPortalGroupByTitle(
			appConfig.roles.analyst.tag,
		).then((analystGroupResult) => {
			immadGroups.current.push({
				groupName: appConfig.roles.analyst.tag,
				groupId: analystGroupResult.item[0].id,
			});
		});
		await Promise.all([adminPromise, missionManagerPromise, analystPromise]);
		if (immadGroups.current) {
			adminObject.current = immadGroups.current.find(
				(element) => element.groupName === appConfig.roles.admin.tag,
			);
			missionManagerObject.current = immadGroups.current.find(
				(element) => element.groupName === appConfig.roles.missionManager.tag,
			);
			analystObject.current = immadGroups.current.find(
				(element) => element.groupName === appConfig.roles.analyst.tag,
			);
		}
	}

	function updateTable() {
		// check for filter if filter call filter function since page changed happened.
		if (currentFilter.current.id === 0) {
			if (
				adminSettingsContext.filteredUsers.length <
				adminSettingsContext.tablePage * adminSettingsContext.rowsPerPage + 1
			) {
				queryUpdateUsers();
			} else if (
				resetListTableOrderChanged.current ||
				adminSettingsContext.rowsPerPage >
					adminSettingsContext.filteredUsers.length
			) {
				resetListTableOrderChanged.current = false;
				queryReplaceUsers();
			}
		} else {
			// call filter selected.
			handleFilterChanged(currentFilter.current);
		}
	}

	function queryUpdateUsers() {
		getLoadedUsers(nonFilterQueryStartIndex.current).then((results) => {
			processQueryResult(results);
		});
	}

	async function replaceFilteredUsers(loadedUsers: ISearchResult<IUser>) {
		nonFilterQueryStartIndex.current = loadedUsers.nextStart;
		if (loadedUsers?.total !== undefined && loadedUsers?.total >= 0) {
			adminSettingsContext.setTotalNumberPortalUsers(loadedUsers.total);
		}
		const userItems: IIMMADUser[] = [];
		if (loadedUsers.results) {
			// create user objects here and then add to setFilteredUsers in the context
			for (const user of loadedUsers.results) {
				const userDataItem = updateUser(user);
				userItems.push(await userDataItem);
			}
			adminSettingsContext.setFilteredUsers(userItems);
			if (openUpdateModalDialog) {
				// send complete dialog
				adminSettingsContext.setUserBeingUpdated(false);
			}
		}
	}

	function queryReplaceUsers() {
		nonFilterQueryStartIndex.current = 0;
		getLoadedUsers(nonFilterQueryStartIndex.current).then((loadedUsers) => {
			replaceFilteredUsers(loadedUsers);
		});
	}

	function processQueryResult(loadedUsers: ISearchResult<IUser>) {
		nonFilterQueryStartIndex.current = loadedUsers.nextStart;
		if (loadedUsers?.total !== undefined && loadedUsers?.total >= 0) {
			adminSettingsContext.setTotalNumberPortalUsers(loadedUsers.total);
		}
		// create data for each user for display
		if (loadedUsers.results !== undefined) {
			enrichUsersWithIMMADRole(loadedUsers.results);
		}
	}

	async function enrichUsersWithIMMADRole(loadedUsers: IUser[]): Promise<void> {
		if (
			adminSettingsContext.filteredUsers.length <
			adminSettingsContext.tablePage * adminSettingsContext.rowsPerPage + 1
		) {
			const userItems: IIMMADUser[] =
				adminSettingsContext.filteredUsers.length > 0
					? adminSettingsContext.filteredUsers
					: [];
			if (loadedUsers) {
				// create user objects here and then add to setFilteredUsers in the context
				for (const user of loadedUsers) {
					const userDataItem = updateUser(user);
					userItems.push(await userDataItem);
				}
				const sortedValues: IIMMADUser[] = userItems.sort(
					compareValues(
						adminSettingsContext.tableOrderBy,
						adminSettingsContext.tableOrder,
					),
				);
				if (adminSettingsContext.filteredUsers.length > 0) {
					adminSettingsContext.setFilteredUsers([...sortedValues]);
				} else {
					adminSettingsContext.setFilteredUsers([...sortedValues]);
				}
			} else {
				console.log("Invalid item passed in to enrichUsersWithIMMADRole");
			}
		}
	}

	/**
	 * Adds the IMMAD role for the user passed in.
	 * @param user IUser object to update IMMAD role
	 */
	async function updateUser(user: IUser): Promise<IIMMADUser> {
		let role = IMMADRoles.Unassigned;
		if (user) {
			// get user's groups and look for IMMAD types by id's in groups instead.
			// 1 call per user instead of 3 per user to set role.
			const userGroups = await getPortalUserGroupsByUsername(user.username);
			const isAdmin = userGroups.find(
				(group) => group.id === adminObject.current?.groupId,
			);
			const isMissionManger = userGroups.find(
				(group) => group.id === missionManagerObject.current?.groupId,
			);
			const isAnalyst = userGroups.find(
				(group) => group.id === analystObject.current?.groupId,
			);
			if (isAdmin) {
				role = IMMADRoles["Admin"];
			} else if (isMissionManger) {
				role = IMMADRoles["Mission Manager"];
			} else if (isAnalyst) {
				role = IMMADRoles["Analyst"];
			}
		}
		return { ...user, immadRole: role };
	}

	const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
		setSearchValue(event.target.value);
	};

	const handleClearSearch = () => {
		setSearchValue("");
	};

	/**
	 * creates the query to get the set of Admin users
	 */
	async function adminFilter() {
		// search value is combination of user name in search and the
		// group to search in Id's
		let adminSearchValue = searchValue;
		if (adminObject.current) {
			adminSearchValue += "* group:" + adminObject.current.groupId;
		}
		setFilterQuery(adminSearchValue);
	}

	/**
	 * creates the query to get the set of Mission Manager users
	 */
	function missionManagerFilter() {
		// search value is combination of user name in search and the
		// group to search in Id's minus the groups with higher access
		let missionManagerSearchValue = searchValue;
		if (missionManagerObject.current) {
			missionManagerSearchValue +=
				"* group:" +
				missionManagerObject.current.groupId +
				" -group:" +
				adminObject.current?.groupId;
		}
		setFilterQuery(missionManagerSearchValue);
	}
	/**
	 * creates the query to get the set of Analyst users
	 */
	function analystFilter() {
		const analystTag = appConfig.roles.analyst.tag;
		const analystObject = immadGroups.current.find(
			(element) => element.groupName === analystTag,
		);
		// search value is combination of user name in search and the
		// group to search in Id's minus the groups with higher access
		let analystSearchValue = searchValue;
		if (analystObject) {
			analystSearchValue +=
				"* group:" +
				analystObject.groupId +
				" -group:" +
				adminObject.current?.groupId +
				" -group:" +
				missionManagerObject.current?.groupId;
		}
		setFilterQuery(analystSearchValue);
	}

	/**
	 * creates the query to get the set of inactive users
	 */
	function inactiveFilter() {
		// search value is combination of user name in search and
		// then subtract the analyst group to search in
		let analystSearchValue = searchValue;
		if (analystObject.current) {
			analystSearchValue += "* -group:" + analystObject.current.groupId;
		}
		setFilterQuery(analystSearchValue);
	}

	/**
	 * Dynamically updates the filters now based on the search values and the filter settings.
	 * @param searchValue will have text and groups to search and not search. ie.c -group:{idnottoquery} group:{idtoquery}
	 */
	function setFilterQuery(searchValue: string): void {
		let startingIndex = lastQueryStartingIndex.current;
		if (adminSettingsContext.tablePage !== 0) {
			const checkValue =
				adminSettingsContext.tablePage * adminSettingsContext.rowsPerPage;
			if (startingIndex !== checkValue + 1) {
				startingIndex = checkValue + 1;
			}
		} else {
			// set to 0
			startingIndex = adminSettingsContext.tablePage;
		}
		searchPortalUserByPartialUserName(
			searchValue,
			adminSettingsContext.rowsPerPage,
			adminSettingsContext.tableOrder,
			startingIndex,
			adminSettingsContext.tableOrderBy,
		).then((loadedUsers) => {
			if (
				adminSettingsContext.tablePage * adminSettingsContext.rowsPerPage ===
				0
			) {
				replaceFilteredUsers(loadedUsers);
			} else {
				processQueryResult(loadedUsers);
			}
		});
	}

	/**
	 * Clear all filters and get current list to fit the table.
	 */
	function clearFilters() {
		if (adminSettingsContext.tablePage !== 0) {
			adminSettingsContext.setTablePage(0);
		}
		adminSettingsContext.setFilteredUsers([]);
		queryReplaceUsers();
		updateAllUserData();
	}

	/**
	 * Compares to values from an array of objects with property key of propertyKey value passed in.
	 * This is for sorting arrays of objects whose values are either strings or numbers.
	 * @param propertyKey - Key value we want to sort by
	 * @param order - asc or desc for ascending or descending. Defaults to asc if not passed in.
	 */
	function compareValues(propertyKey: string, order: "asc" | "desc" = "asc") {
		// a and b are any on purpose as they can be any property from an object
		return function innerSort(a: any, b: any) {
			if (!a.hasOwnProperty(propertyKey) || !b.hasOwnProperty(propertyKey)) {
				// property doesn't exist on either object sort order remains the same
				return 0;
			}
			// The typeof operator is used to check the data type of property's value.
			// This allows the function to determine the proper way to sort the array.
			// eg. if the value of the specified property is a string, a toUpperCase method is used
			// so character casing is ignored when sorting.
			const varA =
				typeof a[propertyKey] === "string"
					? a[propertyKey].toUpperCase()
					: a[propertyKey];
			const varB =
				typeof b[propertyKey] === "string"
					? b[propertyKey].toUpperCase()
					: b[propertyKey];
			let comparison = 0;
			if (varA > varB) {
				comparison = 1;
			} else if (varA < varB) {
				comparison = -1;
			}
			return order === "desc" ? comparison * -1 : comparison;
		};
	}

	/**
	 * Get all the users based off search values or filters.
	 * @param startIndex Index of query to start search from.
	 */
	async function getLoadedUsers(startIndex: number) {
		let loadedUsers;
		if (searchValue === "") {
			if (adminSettingsContext.tableOrderBy === "") {
				// for initial load and reloads of page only
				loadedUsers = await searchPortalUserByPartialUserName(
					"*",
					adminSettingsContext.rowsPerPage,
					adminSettingsContext.tableOrder,
					startIndex,
					HeadCellIds.username,
				);
			} else {
				loadedUsers = await searchPortalUserByPartialUserName(
					"*",
					adminSettingsContext.rowsPerPage,
					adminSettingsContext.tableOrder,
					startIndex,
					adminSettingsContext.tableOrderBy,
				);
			}
		} else {
			loadedUsers = await searchPortalUserByPartialUserName(
				searchValue,
				adminSettingsContext.rowsPerPage,
				adminSettingsContext.tableOrder,
				startIndex,
				adminSettingsContext.tableOrderBy,
			);
			// check if searchValue is an exact match for a username in the loadedUsers results
			const singleValue = loadedUsers.results.filter(
				(user) => user.username?.toUpperCase() === searchValue.toUpperCase(),
			);
			if (singleValue.length > 0) {
				loadedUsers.results = singleValue;
			}
		}
		return loadedUsers;
	}

	/**
	 * Updates the filters or resets them
	 * @param item
	 */
	function handleFilterChanged(item: FiltersListItem): void {
		// update ref to current filter.
		adminSettingsContext.setSelectedFilterItem(item);
		currentFilter.current = item;
		switch (item.id) {
			case 1:
				adminFilter();
				break;
			case 2:
				missionManagerFilter();
				break;
			case 3:
				analystFilter();
				break;
			case 4:
				inactiveFilter();
				break;
			default:
				clearFilters();
				break;
		}

		if (openUpdateModalDialog) {
			// send complete dialog
			adminSettingsContext.setUserBeingUpdated(false);
		}
	}

	async function handleIndividualUserRoleChanged(
		event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
		userInfo: IIMMADUser,
	) {
		// show dialog progress
		adminSettingsContext.setUserBeingUpdated(true);
		setOpenUpdateModalDialog(true);

		if (userInfo.username) {
			// gets rid of type any being used to check the enum.
			// as keyof typeof IMMADRoles
			const eventInfo = event.target.value as keyof typeof IMMADRoles;
			let switchParam;
			let roleToChangeToName = "";
			const roles = await getAllRoles();
			if (IMMADRoles[eventInfo] === 0) {
				// Admin selected to change to
				roleToChangeToName = appConfig.roles.admin.tag;
				switchParam = 0;
			} else if (IMMADRoles[eventInfo] === 1) {
				//Mission Manager selected to change to
				switchParam = 1;
				roleToChangeToName = appConfig.roles.missionManager.tag;
			} else if (IMMADRoles[eventInfo] === 2) {
				// Analyst selected to change to
				switchParam = 2;
				roleToChangeToName = appConfig.roles.analyst.tag;
			} else if (IMMADRoles[eventInfo] === 3) {
				// Unassigned selected to change to
				// set to default role here which is viewer
				roleToChangeToName = "Viewer";
				switchParam = 3;
			}
			if (roleToChangeToName !== "") {
				// changes the names from IMAMD-Analyst to immadanalyst this accounts for if role is setup wrong on portal.
				const normalize = (str: string) =>
					str.toLowerCase().replace(/[-\s]/g, "");

				const role = roles.filter((aRole) => {
					return normalize(aRole.name) === normalize(roleToChangeToName);
				});

				if (role.length > 0) {
					// has viewer license and moving to be analyst
					// update user license to creatorUT and update role to analyst
					if (
						userInfo.userLicenseTypeId?.toLowerCase() === "viewerut" &&
						role[0].name.toLowerCase() !== "viewer"
					) {
						try {
							await updatePortalUserLicenceType(userInfo.username, false);
						} catch (exception_var) {
							console.error("Error updating license: " + exception_var);
						}
					} else if (
						userInfo.userLicenseTypeId?.toLowerCase() === "creatorut" &&
						role[0].name.toLowerCase().includes("viewer")
					) {
						try {
							await updatePortalUserLicenceType(userInfo.username, true);
						} catch (exception_var) {
							console.error("Error updating license: " + exception_var);
						}
					}
					try {
						await updatePortalUserRole(userInfo.username, role[0].id);
					} catch (exception_var) {
						console.error("Error updating userRole: " + exception_var);
					}

					// if result successful then add user to the group or groups needed
					// use group(s) id's then call

					const updateName = [userInfo.username];
					if (switchParam === 0) {
						immadGroups.current.forEach((item) => {
							addUsersToGroupById(item.groupId, updateName);
						});
					} else if (switchParam === 1) {
						immadGroups.current.forEach((group) => {
							if (
								group.groupName === appConfig.roles.missionManager.tag ||
								group.groupName === appConfig.roles.analyst.tag
							) {
								addUsersToGroupById(group.groupId, updateName);
							} else {
								removeUsersFromPortalGroup(group.groupId, updateName);
							}
						});
					} else if (switchParam === 2) {
						immadGroups.current.forEach((group) => {
							if (group.groupName === appConfig.roles.analyst.tag) {
								addUsersToGroupById(group.groupId, updateName);
							} else {
								removeUsersFromPortalGroup(group.groupId, updateName);
							}
						});
					} else if (switchParam === 3) {
						immadGroups.current.forEach((item) => {
							removeUsersFromPortalGroup(item.groupId, updateName);
						});
						// need to remove user from all mission groups that they are part.
						// used getMissionsForUser from portalUserHelper
						// then use removeUsersFromPortalGroup for each mission group.
					}
				}
				if (adminSettingsContext.userSettingsUpdated) {
					adminSettingsContext.setUserSettingsUpdated(false);
				} else {
					adminSettingsContext.setUserSettingsUpdated(true);
				}
			} else {
				console.warn(
					"No role found for update and user role will not be changed. Check that roles are configured properly.",
				);
				enqueueSnackbar(
					"No role found for update and user role will not be changed. Check that roles are configured properly.",
					{ variant: "warning" },
				);
			}
		}
	}

	function handleDialogClose(result: boolean) {
		console.debug(String(result), false);
		updateAllUserData();
		if (openUpdateModalDialog) {
			// send complete dialog
			setOpenUpdateModalDialog(false);
		}
	}

	// Place holder function for next iteration multiple changed
	// function handleDialogCancel(result: boolean) {
	//     if (openUpdateModalDialog) {
	//         // send complete dialog
	//         setOpenUpdateModalDialog(false);
	//     }
	// }

	return (
		<form onSubmit={handleSubmit}>
			<Typography variant="h4" gutterBottom={true}>
				User Settings
			</Typography>
			<StyledSplitDivContainer>
				<StyledLeftSideDiv>
					<StyledSpaceBetweenRow>
						<h3>Filters</h3>
					</StyledSpaceBetweenRow>
					<StyledMuiAccordion>
						<StyledMuiAccordionSummary
							aria-controls="filtersPanel-content"
							id="filtersPanel-header"
						>
							<Typography>
								{joinLabel(appConfig?.appLabel ?? "", "User Type")}
							</Typography>
							<Box
								display={currentFilter.current.id !== 0 ? "contents" : "none"}
							>
								<StyledRightButtonAccordionSummary
									variant="text"
									color="secondary"
									onClick={(event) => {
										event.stopPropagation();
										handleFilterChanged({ id: 0, value: "" });
									}}
								>
									CLEAR
								</StyledRightButtonAccordionSummary>
							</Box>
						</StyledMuiAccordionSummary>
						<AccordionDetails>
							<FilterListItems
								onFilterChange={handleFilterChanged}
								filtersList={filtersList}
							/>
						</AccordionDetails>
					</StyledMuiAccordion>
				</StyledLeftSideDiv>
				<StyledRightSideDiv className="main">
					<InputField
						variant="outlined"
						placeholder="Search by UserName, FirstName, or LastName"
						fullWidth
						size="small"
						color="secondary"
						value={searchValue}
						onChange={handleSearchChange}
						InputProps={{
							endAdornment: (
								<InputAdornment position="end">
									<IconButton
										onClick={handleClearSearch}
										disabled={searchValue.length === 0}
									>
										<XIcon size={16} />
									</IconButton>
								</InputAdornment>
							),
							startAdornment: (
								<InputAdornment position="start">
									<MagnifyingGlassIcon size={16} />
								</InputAdornment>
							),
						}}
					/>
					<EnhancedTable
						handleIndividualUserRoleChanged={handleIndividualUserRoleChanged}
					/>
				</StyledRightSideDiv>
			</StyledSplitDivContainer>
			{openUpdateModalDialog ? (
				<UpdateModalDialog
					handleClose={handleDialogClose}
					// place holder for next iteration
					// handleCancel={handleDialogCancel}
				/>
			) : (
				""
			)}
		</form>
	);
}
