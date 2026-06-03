import React, { ChangeEvent, useReducer, useState, useEffect } from 'react';
import { AppConfig } from '../../../../../interfaces/AppConfig';
import { MissionAction, MissionState } from '../../../../../contexts/missionStateReducer';
import { IItem } from '@esri/arcgis-rest-portal';
import {
    MissionsContainer,
    MissionCardContainer,
    MissionFilterContainer,
    ClearFilterButton,
    MissionCategoryContainer,
    SceneCountFormLabel,
    SceneCategoryColumn,
    SceneCardColumn,
    SceneCountBox,
    BoxFlex,
    CategoryLoadingBox,
} from '../../missions/styles';
import { InputField } from '../../../../common';
import { IconButton, InputAdornment, Typography } from '@mui/material';
import XIcon from 'calcite-ui-icons-react/XIcon';
import MagnifyingGlassIcon from 'calcite-ui-icons-react/MagnifyingGlassIcon';
import RecursiveTreeView, {
    RenderTree,
    findMatchingIds,
    filterNodes,
    ShowHighlight,
} from '../../../../recursiveTreeView/RecursiveTreeView';
import {
    initTreeViewState,
    recursiveTreeViewReducer,
    TreeViewActions,
} from '../../../../recursiveTreeView/RecursiveTreeViewReducer';
import { createTreeView, getContentCategories } from '../../../../recursiveTreeView/RecursiveTreeModel';
import { SortByOption } from './interfaces';
import { getPortalItems } from '../../../../../helpers/portalItemsHelper';
import { compareScenes } from './mapItemsModel';
export type SortDirection = 'ASC' | 'DESC';
import { getWebScenes, getGateMapItems } from '../../../../../hooks/missionHooks';
import PortalItemList from '../../../../../components/widgets/portalItemList';

const sortByOptions = [
    {
        id: 0,
        label: 'Title',
        sortField: 'title',
        fieldType: 'string',
    },
    {
        id: 1,
        label: 'Last Updated',
        sortField: 'modified',
        fieldType: 'number',
    },
    {
        id: 2,
        label: 'View Count',
        sortField: 'numViews',
        fieldType: 'number',
    },
];

const MapItems = (props: {
    dispatch: React.Dispatch<MissionAction>;
    state: MissionState;
    config: AppConfig;
    showOnlyGateMissions: boolean;
    typeKeywords: string;
}): JSX.Element => {
    const { dispatch, state, showOnlyGateMissions, typeKeywords } = props;
    const [treeViewState, treeViewReducerDispatch] = useReducer(recursiveTreeViewReducer, initTreeViewState);
    const [selectedCategories, setSelectedCategories] = useState<string>('');
    const [categoriesAreLoading, setCategoriesAreLoading] = useState<boolean>(true);
    const [scenesDisplayedInUI, setScenesDisplayedInUI] = useState<IItem[]>([]);
    const [categoryFilterValue, setCategoryFilterValue] = useState('');
    const [showCategorySelectedHighlight, setShowCategorySelectedHighlight] = useState<ShowHighlight>({ show: false });
    const [initLoadDone, setInitLoadDone] = useState(false);
    const maxRestResults = 99;
    const sortOrder: SortDirection = 'ASC';
    const sortBy: SortByOption = sortByOptions[0];
    const sceneSearchString = '';

    useEffect(() => {
        getInitialWebScenesFromPortal();
    }, []);
    useEffect(() => {
        if (state.gateMapType) {
            // this will only be 2D or 3D if a gate mission type is chosen.
            const isMaps = state.gateMapType === '2D';
            const isScenes = state.gateMapType !== '2D';
            getContentCategories(treeViewReducerDispatch, showOnlyGateMissions, typeKeywords, isScenes, isMaps);
        } else {
            // standard IMMAD will not use 2D web maps so this is the default for IMMAD.
            getContentCategories(treeViewReducerDispatch, showOnlyGateMissions, typeKeywords, true);
        }
    }, [state.gateMapType]);

    useEffect(() => {
        if (treeViewState.contentCategories && treeViewState.contentCategories.categorySchema.length) {
            createTreeView(
                treeViewState.contentCategories.categorySchema[0],
                treeViewState.categoryCount,
                treeViewState.flattenedCategories,
                treeViewState.nodeIds,
                treeViewReducerDispatch
            );
            setCategoriesAreLoading(false);
        }
    }, [treeViewState.contentCategories]);

    useEffect(() => {
        //sort in place if there is a category or search string filter already in place and result count was less than 100
        if (
            (selectedCategories !== '' || sceneSearchString !== '') &&
            scenesDisplayedInUI &&
            scenesDisplayedInUI.length < maxRestResults
        ) {
            sortScenes(scenesDisplayedInUI);
        } else {
            refreshWebScenesInUi();
        }
    }, [sortOrder, sortBy]);

    useEffect(() => {
        refreshWebScenesInUi();
    }, [sceneSearchString]);

    useEffect(() => {
        if (selectedCategories === '') {
            refreshWebScenesInUi();
        }
    }, [selectedCategories]);

    /**
     * Get all the web scenes based on new ui criteria ie- sortfield, sortOrder, and search string
     */
    async function refreshWebScenesInUi() {
        if (!initLoadDone) {
            return;
        }
        const itemType = state.gateMapType === '2D' ? 'Web Map' : 'Web Scene';
        const itemOwner = state.gateMapType === '2D' || state.gateMapType === '3D' ? state.currentUser : '*';
        const items = await getPortalItems(
            itemType,
            sceneSearchString,
            ['*'],
            selectedCategories,
            sortBy.sortField,
            sortOrder,
            itemOwner
        );
        setScenesDisplayedInUI(items);
    }

    async function locatePortalItem(categories: string): Promise<void> {
        const itemType = state.gateMapType === '2D' ? 'Web Map' : 'Web Scene';
        const itemOwner = state.gateMapType === '2D' || state.gateMapType === '3D' ? state.currentUser : '*';
        const items = await getPortalItems(
            itemType,
            sceneSearchString,
            ['*'],
            categories,
            sortBy.sortField,
            sortOrder,
            itemOwner
        );
        setScenesDisplayedInUI(items);
    }
    /**
     * Get the most recently created web scenes in portal - up to the limit of 100.
     * Sort scenes by the default selected sort option.
     */
    async function getInitialWebScenesFromPortal() {
        let response;
        //GATE users have access to the same scenes as IMMAD users
        if (state.gateMapType === '2D') {
            response = await getGateMapItems('2D', state.currentUser);
        } else {
            response = await getWebScenes();
        }

        const resultScenes = response ? response.results : [];
        setScenesDisplayedInUI([...resultScenes]);
        setInitLoadDone(true);
    }

    /**
     * Handler user typing text into the category search textfield
     * @param event textfield change event
     */
    const handleFilterCategoryValueChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.value.length === 0) {
            handleClearCategorySearch();
        } else {
            setCategoryFilterValue(event.target.value);
            const filteredCategories = Object.assign({}, treeViewState.categoryTree);
            const matchingIds: string[] = [];
            findMatchingIds(filteredCategories, event.target.value, matchingIds);

            if (filteredCategories.children) {
                filteredCategories.children = filterNodes(filteredCategories.children, matchingIds);
            }

            treeViewReducerDispatch({
                type: TreeViewActions.UPDATE_FILTERED_CATEGORY_TREE,
                payload: filteredCategories,
            });
        }
    };

    /**
     * Handle event when user clears out all text in the category search textfield
     */
    const handleClearCategorySearch = () => {
        setCategoryFilterValue('');
        treeViewReducerDispatch({
            type: TreeViewActions.UPDATE_FILTERED_CATEGORY_TREE,
            payload: treeViewState.categoryTree,
        });
    };

    /**
     * Handle event when user clicks a node in the category treeview
     * @param event select event on treeview
     * @param nodeId id of the selected node
     */
    const onChangeCategory = (event: React.SyntheticEvent, nodeId: string) => {
        setShowCategorySelectedHighlight({ show: true });
        const category: RenderTree | undefined = treeViewState.flattenedCategories.find((x) => x.id === nodeId);
        if (category && category.categories && initLoadDone) {
            setSelectedCategories(category.categories);
            locatePortalItem(category.categories);
        }
    };

    /**
     * Sort function on the array of scenes.
     * @param sceneArray array of scenes
     */
    function sortScenes(sceneArray: IItem[]) {
        const copiedArray = [...sceneArray];
        const sortedArray = copiedArray.sort((a, b) => {
            return compareScenes(a, b, sortBy.sortField, sortOrder, sortBy.fieldType);
        });
        setScenesDisplayedInUI([...sortedArray]);
    }

    /**
     * Handle event when user clicks the x icon to remove selected categories
     */
    const handleClearCategorySelectionFilter = () => {
        setShowCategorySelectedHighlight({ show: false });
        setSelectedCategories('');
    };

    /**
     * additional props needed to be passed to make the portalItemList widget work for map/scene selection
     * in the create/update mission workflow
     */
    const otherPortalItemListProps = {
        dispatch: dispatch,
        missionState: state,
    };

    return (
        <>
            <MissionsContainer>
                <SceneCategoryColumn>
                    <MissionFilterContainer>
                        <InputField
                            variant='outlined'
                            placeholder='Filter categories'
                            fullWidth
                            size='small'
                            color='secondary'
                            value={categoryFilterValue}
                            onChange={handleFilterCategoryValueChange}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position='end'>
                                        <IconButton
                                            onClick={handleClearCategorySearch}
                                            disabled={categoryFilterValue.length === 0}
                                        >
                                            <XIcon size={16} />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                                startAdornment: (
                                    <InputAdornment position='start'>
                                        <MagnifyingGlassIcon size={16} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </MissionFilterContainer>
                    <SceneCountBox>
                        <BoxFlex>
                            <ClearFilterButton
                                onClick={handleClearCategorySelectionFilter}
                                disabled={selectedCategories === ''}
                            >
                                <XIcon size={16} />
                                Clear Category Filter
                            </ClearFilterButton>
                        </BoxFlex>
                    </SceneCountBox>
                    <MissionCategoryContainer>
                        {categoriesAreLoading ? (
                            <CategoryLoadingBox>
                                <Typography variant='h6'>Loading Categories ...</Typography>
                            </CategoryLoadingBox>
                        ) : (
                            <RecursiveTreeView
                                nodes={treeViewState.filteredCategoryTree}
                                handleSelect={onChangeCategory}
                                expandedNodes={treeViewState.nodeIds}
                                showHighlightOnCategoryItem={showCategorySelectedHighlight}
                            />
                        )}
                    </MissionCategoryContainer>
                </SceneCategoryColumn>
                <SceneCardColumn>
                    <MissionCardContainer>
                        <PortalItemList
                            itemTypes={['Web Map', 'Web Scene']}
                            itemsPerPage={9}
                            tags={undefined}
                            useDataPaging={true}
                            siblingItemCounts={3}
                            isSpatial={false}
                            showFilter={true}
                            showSearch={true}
                            showSort={true}
                            cardActionsTemplate={undefined}
                            categories={selectedCategories}
                            otherFeedItemTypes={otherPortalItemListProps}
                            runFilterOnUserName={state.gateMapType === '2D'}
                        />
                    </MissionCardContainer>
                </SceneCardColumn>
            </MissionsContainer>
        </>
    );
};
export default MapItems;
