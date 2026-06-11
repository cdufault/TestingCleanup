// React imports
import React, { ChangeEvent, useContext, useEffect, useReducer, useState } from 'react';
import { useMissions } from '../../../../hooks/missionHooks';
import PortalMission from '../missionCreate/views/portalMission';
import { currentPortalUser } from '../../../../helpers/portalUsersHelper';

// Context imports
import { AppContext } from '../../../../contexts/App';
import { DEFAULT_MISSION } from '../../../../data/savedState';

import { IItem } from '@esri/arcgis-rest-portal';
import { InputField, InputGroup } from '../../../common';

// Component imports
import MissionCreate from '../missionCreate';
import RecursiveTreeView, {
    filterNodes,
    findMatchingIds,
    RenderTree,
    ShowHighlight,
} from '../../../recursiveTreeView/RecursiveTreeView';

import { createTreeView, getContentCategories } from '../../../recursiveTreeView/RecursiveTreeModel';
import {
    initTreeViewState,
    recursiveTreeViewReducer,
    TreeViewActions,
} from '../../../recursiveTreeView/RecursiveTreeViewReducer';

import MissionSearch from '../missions/components/missionSearch';

// Style imports
import { Box, Button, IconButton, InputAdornment, MenuItem, ToggleButton, ToggleButtonGroup } from '@mui/material';
import PlusIcon from 'calcite-ui-icons-react/PlusIcon';
import MagnifyingGlassIcon from 'calcite-ui-icons-react/MagnifyingGlassIcon';
import SortAscendingArrowIcon from 'calcite-ui-icons-react/SortAscendingArrowIcon';
import SortDescendingArrowIcon from 'calcite-ui-icons-react/SortDescendingArrowIcon';
import XIcon from 'calcite-ui-icons-react/XIcon';
import { StyledLink } from '../../styles';
('');
import {
    ClearFilterButton,
    Container,
    DefaultBox,
    Header,
    MissionCardColumn,
    MissionCardContainer,
    MissionCategoryColumn,
    MissionCategoryContainer,
    MissionCountContainer,
    MissionCountFormLabel,
    MissionFilterContainer,
    MissionsContainer,
    SortByBox,
    SortByLabel,
    VerticalLine,
} from './styles';

import { deletePortalItems, getMissionList } from '../../../../helpers/portalItemsHelper';
import { ConfigHelper } from '../../../../helpers/configHelper';
import { SortDirection } from '../../../widgets/portalItemList/resources';
import { deletePortalGroup, getGroupContentByGroupId } from '../../../../helpers/portalGroupHelper';
import { useSnackbar } from 'notistack';
import {
    getPortalItemDataById,
    queryGateRegionFClassForGlobalIdLib,
    updateRegionVisibilityFeature,
} from '@stratcom/lib-functions';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { useAppSelector } from '../../../../hooks/hooks';
import { setWebGlErrorMessage } from '../../../webMap/WebMapViewSlice';

enum SortByValue {
    Title,
    Modified,
    ViewCount,
}

interface SortByOption {
    id: number;
    label: string;
    sortField: string;
}

// Component
const Mission = (): JSX.Element => {
    const appConfig = ConfigHelper.getAppConfig();
    const appContext = useContext(AppContext);
    const [createActive, setCreateActive] = useState(false);
    const [selectedMission, setSelectedMission] = useState<IItem | undefined>(undefined);
    const [currentUserName, setCurrentUserName] = useState<string>('');
    const [showOnlyGateMissions, setShowOnlyGateMissions] = useState<boolean>(false);
    const [missionViewType, setMissionViewType] = useState<string>('production');
    const [typeKeywords, setTypeKeywords] = useState<string>(appConfig.typekeywords.immadMission);
    const { missions, filteredMissions, filterApplied, setFilterApplied, setFilteredMissions, setMissions } =
        useMissions();
    const { enqueueSnackbar } = useSnackbar();
    const [treeViewState, reducerDispatch] = useReducer(recursiveTreeViewReducer, initTreeViewState);
    const [filterValue, setFilterValue] = useState('');
    const [missionCount, setMissionCount] = useState<string>();
    const [showCategorySelectedHighlight, setShowCategorySelectedHighlight] = useState<ShowHighlight>({ show: false });
    const [selectedCategoryNodeId, setSelectedCategoryNodeId] = useState<string>('');
    const [originalMissionCount, setOriginalMissionCount] = useState(-1);

    const is2dOnlyActive = useAppSelector((state) => state.webMapViewSlice.is2dOnlyActive);
    const webGlErrorMessage = useAppSelector((state) => state.webMapViewSlice.webGlErrorMessage);

    /**
     * Fields that can used in a search for missions
     */
    const sortByOptions = [
        {
            id: SortByValue.Title,
            label: SortByValue[SortByValue.Title],
            sortField: SortByValue[SortByValue.Title].toLowerCase(),
        },
        {
            id: SortByValue.Modified,
            label: 'Date Modified',
            sortField: SortByValue[SortByValue.Modified].toLowerCase(),
        },
        {
            id: SortByValue.ViewCount,
            label: 'View Count',
            sortField: 'num-views',
        },
    ];

    const [sortBy, setSortBy] = useState<SortByOption>(sortByOptions[0]);
    const [selectedCategories, setSelectedCategories] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<SortDirection>('ASC');
    const [searchValue, setSearchValue] = useState('');

    useEffect(() => {
        if (is2dOnlyActive) {
            enqueueSnackbar(`${webGlErrorMessage} Opening missions in 3D has been disabled.`, {
                variant: 'warning',
                autoHideDuration: 12000,
            });
        }
        getMissions(showOnlyGateMissions, typeKeywords, '', true);
    }, []);

    useEffect(() => {
        if (missionViewType) {
            calcTypeKeywords();
        }
    }, [showOnlyGateMissions, missionViewType]);

    useEffect(() => {
        if (typeKeywords !== '') {
            refreshMissions(showOnlyGateMissions, typeKeywords);
            // Recompute the category counts so the tree numbers reflect the
            // currently selected GATE-only / production-vs-exercise filters.
            getContentCategories(reducerDispatch, showOnlyGateMissions, typeKeywords);
        }
    }, [typeKeywords]);

    useEffect(() => {
        getCurrentUser();
    }, []);

    useEffect(() => {
        if (selectedMission && selectedMission.id) {
            setCreateActive(true);
        }
    }, [selectedMission]);

    useEffect(() => {
        setMissionCount(`${missions.length} of ${missions.length} Missions`);
        if (treeViewState.contentCategories && treeViewState.contentCategories.categorySchema.length) {
            // Pass fresh arrays so the tree is rebuilt from scratch on each refresh
            // (createTreeView pushes onto these, which would otherwise accumulate/duplicate).
            createTreeView(
                treeViewState.contentCategories.categorySchema[0],
                treeViewState.categoryCount,
                [],
                [],
                reducerDispatch
            );
        }
    }, [treeViewState.contentCategories]);

    useEffect(() => {
        if (originalMissionCount >= 0) {
            setMissionCount(`${missions.length} of ${originalMissionCount} Missions`);
        }
    }, [originalMissionCount, missions]);

    const getMissions = async (
        gateOnly = showOnlyGateMissions,
        typeKeywordsValue = typeKeywords,
        categories = selectedCategories,
        refresh = false
    ) => {
        const missions = await getMissionList(
            categories,
            sortBy.sortField,
            sortOrder,
            gateOnly,
            typeKeywordsValue
        );
        if (originalMissionCount === -1 || refresh) {
            const unfilteredMissions =
                categories === ''
                    ? missions
                    : await getMissionList('', sortBy.sortField, sortOrder, gateOnly, typeKeywordsValue);

            setOriginalMissionCount(unfilteredMissions.length);
        }
        setMissions(missions);
    };

    const refreshMissions = (gateOnly: boolean, typeKeywords: string) => {
        if (gateOnly) {
            setShowOnlyGateMissions(true);
        } else {
            setShowOnlyGateMissions(false);
        }
        setMissions([]);
        getMissions(gateOnly, typeKeywords, selectedCategories, true);
    };

    const clearSearch = () => {
        setSearchValue('');
    };

    const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
        const searchTerm = event.target.value;
        setSearchValue(searchTerm);
    };

    const defaultButtonClicked = () => {
        sessionStorage.setItem('first_time', '1');
    };

    /**
     * Get the current user
     */
    const getCurrentUser = async () => {
        const user = await currentPortalUser();
        if (user.username) {
            setCurrentUserName(user.username);
        }
    };

    /**
     * Handle the category tree selection change
     * @param event change event
     */
    const handleFilterCategories = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.value.length === 0) {
            handleClearFilter();
        } else {
            setFilterValue(event.target.value);

            const filteredCategories = Object.assign({}, treeViewState.categoryTree);
            const matchingIds: string[] = [];
            findMatchingIds(filteredCategories, event.target.value, matchingIds);

            if (filteredCategories.children) {
                filteredCategories.children = filterNodes(filteredCategories.children, matchingIds);
            }

            reducerDispatch({
                type: TreeViewActions.UPDATE_FILTERED_CATEGORY_TREE,
                payload: filteredCategories,
            });
        }
    };

    /**
     * Clear the treeview filter
     */
    const handleClearFilter = () => {
        setFilterValue('');

        reducerDispatch({
            type: TreeViewActions.UPDATE_FILTERED_CATEGORY_TREE,
            payload: treeViewState.categoryTree,
        });
    };

    /**
     * Handle the create mission button click
     */
    const handleToggleCreate = async () => {
        setSelectedMission(undefined);
        // refresh missions in case one was created
        refreshMissions(showOnlyGateMissions, typeKeywords);
        // refresh content categories as one may be assigned to a new mission.
        await getContentCategories(reducerDispatch, showOnlyGateMissions, typeKeywords);
        if (createActive) {
            setCreateActive(false);
        } else {
            setCreateActive(true);
        }
    };

    /**
     * Handle the delete mission click
     */
    const handleDelete = async (mission: IItem) => {
        const applicationItemId = await deleteMission(mission.id);
        setSelectedMission(undefined);
        if (applicationItemId !== '') {
            try {
                const updatedMissions = await getMissionList(
                    selectedCategories,
                    sortBy.sortField,
                    sortOrder,
                    showOnlyGateMissions,
                    typeKeywords
                );
                // ensure the mission was removed for the list and not part of what is in state.
                if (mission && updatedMissions.length > 0) {
                    const missionIndex = updatedMissions.findIndex((item) => item.id === applicationItemId);
                    if (missionIndex !== -1) {
                        updatedMissions.splice(missionIndex, 1);
                        setMissions(updatedMissions);
                    } else if (missions !== updatedMissions) {
                        setMissions([...updatedMissions]);
                    } else {
                        refreshMissions(showOnlyGateMissions, typeKeywords);
                    }
                }
            } catch (error) {
                console.error(error.message());
            }
        }
    };

    /**
     * Once a mission has been deleted the region table entry for the mission needs to turn off the visibility
     * @param regionGuid mission guid
     * @param missionIsExercise true if this is an exercise
     * @returns Promise<boolean | undefined>
     */
    async function turnOffMissionVisibility(
        regionGuid: string,
        missionIsExercise: boolean
    ): Promise<boolean | undefined> {
        //1 is hide ??
        const regionsFLayer = new FeatureLayer({
            portalItem: {
                id: missionIsExercise ? appConfig.gate.exercise.exRegionsFClassGuid : appConfig.gate.regionsFClassGuid,
            },
        });

        if (regionsFLayer) {
            await regionsFLayer
                .load()
                .then(async (r) => {
                    const globalId = await queryGateRegionFClassForGlobalIdLib(regionsFLayer, regionGuid);
                    if (globalId) {
                        let success = await updateRegionVisibilityFeature(regionsFLayer, 0, globalId);
                        !success && console.error('Failed to update the region visibility in the Regions ftr class.');
                        return success;
                    }
                    return false;
                })
                .catch((error) => {
                    console.error(error);
                    return false;
                });
        } else {
            return false;
        }
    }

    /**
     * Delete mission and its related artifacts
     * @param portalGroupId group id
     * @returns Promise<string> applicationItem?.id ?? ''
     */
    async function deleteMission(portalGroupId: string): Promise<string> {
        try {
            const missionItems = await getGroupContentByGroupId(portalGroupId);
            // filter items where type is either 'application' or 'web scene'
            const itemsToDelete = missionItems.filter(
                (item) => item.type.toLowerCase() === 'application' || item.type.toLowerCase() === 'web scene'
            );
            // get id's of all items in the itemsToDelete array.
            const itemIdValuesToDelete = itemsToDelete.map((item) => item.id);
            // only has to search 2 values to get item to remove from missions list.
            const applicationItem = itemsToDelete.find((item) => item.type.toLowerCase() === 'application');

            if (applicationItem) {
                const metadata = await getPortalItemDataById(
                    applicationItem?.id,
                    appConfig.portalUrl,
                    appConfig.oauthAppId
                );
                metadata?.gateMapType && (await turnOffMissionVisibility(portalGroupId, metadata.isExercise));
            }

            const deleteItemsResult = await deletePortalItems(itemIdValuesToDelete);
            if (deleteItemsResult) {
                const deleteGroupResult = await deletePortalGroup(portalGroupId);
                if (deleteGroupResult) {
                    enqueueSnackbar('Mission Delete Successful.', { variant: 'success' });
                } else {
                    enqueueSnackbar('Mission Delete Failed. See console for more details.', { variant: 'error' });
                }
            } else {
                enqueueSnackbar('Mission Delete Failed. See console for more details.', { variant: 'error' });
            }
            // need to return the application ID to verify it is not still in the mission lists.
            return applicationItem?.id ?? '';
        } catch (error) {
            console.error(error.message);
            return '';
        }
    }

    /**
     * Handle sort by field change
     * @param sortByVal current select value
     */
    const handleSortChange = async (sortByVal: string) => {
        const sortBy = sortByOptions?.find((item) => item.id === parseInt(sortByVal));

        if (sortBy) {
            setSortBy(sortBy);

            const missions = await getMissionList(
                selectedCategories,
                sortBy.sortField,
                sortOrder,
                showOnlyGateMissions,
                typeKeywords
            );
            setMissions(missions);
        }
    };

    /**
     * Handle sort direction change
     */
    const handleSortOrderChange = async () => {
        const sortDirection = sortOrder === 'ASC' ? 'DESC' : 'ASC';
        setSortOrder(sortDirection);

        const missions = await getMissionList(
            selectedCategories,
            sortBy.sortField,
            sortDirection,
            showOnlyGateMissions,
            typeKeywords
        );
        setMissions(missions);
    };

    /**
     * Handle selection change on the category treeview
     * @param event selection change event on treeview node
     * @param nodeId selected node id
     */
    const onChangeCategory = async (event: React.SyntheticEvent, nodeId: string) => {
        setShowCategorySelectedHighlight({ show: true });
        setSelectedCategoryNodeId(nodeId);
        const category: RenderTree | undefined = treeViewState.flattenedCategories.find((x) => x.id === nodeId);

        const sortField = sortBy ? sortBy.sortField : 'title';

        if (category && category.categories) {
            const missions = await getMissionList(
                category.categories,
                sortField,
                sortOrder,
                showOnlyGateMissions,
                typeKeywords
            );
            setFilterApplied(false);
            setMissions(missions);
            setSelectedCategories(category.categories);
        }
    };

    /**
     * Remove the current filter and apply the original/default filter
     */
    const resetFilter = async () => {
        const missions = await getMissionList('', sortBy.sortField, sortOrder, showOnlyGateMissions, typeKeywords);

        setSelectedCategories('');
        setMissions(missions);
        setMissionCount(`${missions.length} of ${missions.length} Missions`);
        setFilterApplied(false);
        setShowCategorySelectedHighlight({ show: false });
        setSelectedCategoryNodeId('');
        handleClearFilter();
        clearSearch();
    };

    const isAnalyst =
        appContext &&
        appContext.userRoles &&
        !appContext.userRoles.Administrator &&
        !appContext.userRoles.MissionManager;

    /**
     * Handle the togglebutton click on which missions to view GATE or All
     * @param event toggle button click event
     * @param viewTypeFilter 'viewAll' or 'viewGateOnly'
     */
    function handleMissionTypeInputChange(event: React.MouseEvent<HTMLElement>, viewTypeFilter: string | null) {
        if (viewTypeFilter) {
            clearCategorySelection();
            setShowOnlyGateMissions(viewTypeFilter !== 'viewAll');
        }
    }

    /**
     * Handle the togglebutton click on whether to view 'production' or 'exercise' missions
     * @param event toggle button click event
     * @param viewTypeFilter type of missions to view 'production' or 'exercise'
     */
    function missionViewTypeChanged(event: React.MouseEvent<HTMLElement>, viewTypeFilter: string | null) {
        if (viewTypeFilter) {
            clearCategorySelection();
            setMissionViewType(viewTypeFilter);
        }
    }

    /**
     * Clear any selected category in the tree so toggling a button starts with no selection.
     */
    function clearCategorySelection() {
        setSelectedCategories('');
        setSelectedCategoryNodeId('');
        setShowCategorySelectedHighlight({ show: false });
    }

    /**
     * retrieve the appropriate typekeyword from the config based on current state
     */
    function calcTypeKeywords() {
        let keyword;
        if (showOnlyGateMissions) {
            if (missionViewType === 'production') {
                keyword = appConfig.typekeywords.gateMission;
            } else {
                keyword = appConfig.typekeywords.gateExercise;
            }
        } else {
            if (missionViewType === 'production') {
                keyword = appConfig.typekeywords.immadMission;
            } else {
                keyword = appConfig.typekeywords.immadExercise;
            }
        }
        setTypeKeywords(keyword);
    }

    return (
        <>
            {!createActive && (
                <Container>
                    <Header>
                        <InputGroup>
                            <DefaultBox>
                                {!isAnalyst ? (
                                    <Button variant="contained" color="secondary" onClick={handleToggleCreate}>
                                        <PlusIcon size={16} /> Create Mission
                                    </Button>
                                ) : (
                                    ''
                                )}
                            </DefaultBox>
                            <DefaultBox>
                                <StyledLink
                                    to={{
                                        pathname: '/workspace',
                                        state: {
                                            value: {
                                                title: DEFAULT_MISSION,
                                                id: appConfig.defaultWebSceneId,
                                            },
                                            timeStamp: new Date(),
                                            viewType: '3D',
                                        },
                                    }}
                                >
                                    <Button variant="contained" color="secondary" onClick={defaultButtonClicked}>
                                        Default Workspace
                                    </Button>
                                </StyledLink>
                            </DefaultBox>
                            <MissionSearch
                                missions={missions}
                                originalMissionCount={originalMissionCount}
                                searchValue={searchValue}
                                clearSearch={clearSearch}
                                handleSearchChange={handleSearchChange}
                                setFilterApplied={setFilterApplied}
                                setFilteredMissions={setFilteredMissions}
                                setMissionCount={setMissionCount}
                            />
                            <SortByBox>
                                <SortByLabel>Sort By</SortByLabel>
                                <InputField
                                    variant="outlined"
                                    select
                                    color="secondary"
                                    title="Sort By"
                                    value={sortBy.id}
                                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                        handleSortChange(event.target.value);
                                    }}
                                >
                                    {sortByOptions?.map((item) => {
                                        const key = item.id;
                                        return (
                                            <MenuItem value={key} key={key}>
                                                {item.label}
                                            </MenuItem>
                                        );
                                    })}
                                </InputField>
                                <IconButton onClick={handleSortOrderChange}>
                                    {sortOrder === 'ASC' ? (
                                        <SortAscendingArrowIcon size={16} />
                                    ) : (
                                        <SortDescendingArrowIcon size={16} />
                                    )}
                                </IconButton>
                            </SortByBox>
                        </InputGroup>
                    </Header>
                    <MissionsContainer>
                        <MissionCategoryColumn>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <ToggleButtonGroup
                                    sx={{ paddingLeft: '0px', paddingBottom: '10px' }}
                                    onChange={missionViewTypeChanged}
                                    value={missionViewType}
                                    exclusive={true}
                                >
                                    <ToggleButton value="production">Production</ToggleButton>
                                    <ToggleButton value="exercise">Exercise</ToggleButton>
                                </ToggleButtonGroup>
                                <ToggleButtonGroup
                                    sx={{ paddingLeft: '25px', paddingBottom: '10px' }}
                                    onChange={handleMissionTypeInputChange}
                                    value={showOnlyGateMissions ? 'viewGateOnly' : 'viewAll'}
                                    exclusive={true}
                                >
                                    <ToggleButton value="viewGateOnly">
                                        {ConfigHelper.getAppConfig()?.gate?.gateLabel ?? ''}
                                    </ToggleButton>
                                    <ToggleButton value="viewAll">{'ALL'}</ToggleButton>
                                </ToggleButtonGroup>
                            </Box>
                            <MissionFilterContainer>
                                <InputField
                                    variant="outlined"
                                    placeholder="Filter categories"
                                    fullWidth
                                    size="small"
                                    color="secondary"
                                    value={filterValue}
                                    onChange={handleFilterCategories}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={handleClearFilter}
                                                    disabled={filterValue.length === 0}
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
                            </MissionFilterContainer>
                            <MissionCategoryContainer>
                                <RecursiveTreeView
                                    nodes={treeViewState.filteredCategoryTree}
                                    handleSelect={onChangeCategory}
                                    expandedNodes={treeViewState.nodeIds}
                                    selectedNode={selectedCategoryNodeId}
                                    showHighlightOnCategoryItem={showCategorySelectedHighlight}
                                />
                            </MissionCategoryContainer>
                        </MissionCategoryColumn>
                        <MissionCardColumn>
                            <MissionCountContainer>
                                <MissionCountFormLabel>{missionCount}</MissionCountFormLabel>
                                <VerticalLine />
                                <ClearFilterButton
                                    onClick={resetFilter}
                                    disabled={selectedCategories === '' && !filterApplied}
                                >
                                    <XIcon size={16} />
                                    Clear Filter
                                </ClearFilterButton>
                            </MissionCountContainer>
                            <MissionCardContainer>
                                {!filterApplied
                                    ? missions && missions.length
                                        ? missions.map((mission) => {
                                              return (
                                                  <div key={mission.id}>
                                                      <PortalMission
                                                          currentMission={mission}
                                                          setSelected={setSelectedMission}
                                                          currentUserName={currentUserName}
                                                          deleted={handleDelete}
                                                      />
                                                  </div>
                                              );
                                          })
                                        : ''
                                    : filteredMissions && filteredMissions.length
                                    ? filteredMissions.map((mission) => {
                                          return (
                                              <div key={mission.id}>
                                                  <PortalMission
                                                      currentMission={mission}
                                                      setSelected={setSelectedMission}
                                                      currentUserName={currentUserName}
                                                      deleted={handleDelete}
                                                  />
                                              </div>
                                          );
                                      })
                                    : ''}
                            </MissionCardContainer>
                        </MissionCardColumn>
                    </MissionsContainer>
                </Container>
            )}

            {createActive && (
                <MissionCreate
                    handleReturn={handleToggleCreate}
                    selectedMission={selectedMission}
                    showOnlyGateMissions={showOnlyGateMissions}
                    typeKeywords={typeKeywords}
                />
            )}
        </>
    );
};

export default Mission;
