import {
    CategoryAggregations,
    ContentCategories,
    ContentCategory,
    getCategoryContent,
    getCategoryCounts,
} from '../../helpers/portalHelper';

import { RenderTree } from './RecursiveTreeView';
import { TreeViewAction, TreeViewActions } from './RecursiveTreeViewReducer';

/**
 * Get counts of Missions or Web Scenes sorted by categories. When isScenes or isMaps is true this will display
 * counts of maps / scenes with categories set properly
 * @param showOnlyGateMissions true if only return GATE items
 * @param typeKeywords the typeKeywords to search for
 * @param isScenes is optional that defaults to false will return categories that apply to scenes not missions
 * @param isMaps is optional that defaults to false will return categories that apply to maps not missions
 */
export async function getModelCategoryCounts(
    showOnlyGateMissions: boolean,
    typeKeywords: string,
    isScenes = false,
    isMaps = false
): Promise<CategoryAggregations[]> {
    let counts;
    if (isScenes) {
        counts = await getCategoryCounts(showOnlyGateMissions, typeKeywords, isScenes);
    } else if (isMaps) {
        counts = await getCategoryCounts(showOnlyGateMissions, typeKeywords, isScenes, isMaps);
    } else {
        counts = await getCategoryCounts(showOnlyGateMissions, typeKeywords);
    }
    return counts;
}

/**
 * Get the content for the categories.
 */
export async function getModelCategoryContent(): Promise<ContentCategories> {
    return (await getCategoryContent()) as unknown as ContentCategories;
}

export const defaultCategory = { id: '', name: '' };

/**
 * Generated unique ids for tree nodes
 * @param hashStr a hash string
 */
export const hashCode = (hashStr: string): string => {
    let hash = 0;

    if (hashStr.length === 0) {
        return hash.toString();
    }

    for (let i = 0; i < hashStr.length; i++) {
        const char = hashStr.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }

    return Math.abs(hash).toString();
};

/**
 * Get the counts for a specific category.
 * @param categories categories
 * @param categoryCount category counts
 */
export const getCategoryCount = (categories: string, categoryCount: CategoryAggregations[]): number => {
    let count = 0;
    const item = categoryCount.find((category) => category.value.toLowerCase() === categories.toLowerCase());
    if (item) {
        count = item.count;
    }
    return count;
};

/**
 * Create a treeview component
 * @param node category node
 * @param categoryCount number of items in category
 * @param flattenedCategories flattened categories
 * @param nodeIds ids of nodes
 * @param dispatch function to update reducer state
 */
export const createTreeView = (
    node: ContentCategory,
    categoryCount: CategoryAggregations[],
    flattenedCategories: RenderTree[],
    nodeIds: string[],
    dispatch: React.Dispatch<TreeViewAction>
): void => {
    let categoryList: RenderTree = defaultCategory;
    const flattenedCategoryList: RenderTree[] = flattenedCategories;
    const nodeIdList: string[] = nodeIds;

    if (node && node.categories) {
        const categoryListStr = JSON.stringify(node)
            .replaceAll(`"title":`, `"name":`)
            .replaceAll(`"categories":`, `"children":`);

        categoryList = JSON.parse(categoryListStr);

        categoryList.id = hashCode(categoryList.name);
        categoryList.categories = `/${categoryList.name}`;
        categoryList.count = getCategoryCount(categoryList.categories, categoryCount);

        if (categoryList && categoryList.count > 0) {
            categoryList.name = `${categoryList.name} (${categoryList.count})`;
        }
        nodeIdList.push(categoryList.id);

        flattenedCategoryList.push(categoryList);

        if (categoryList.children) {
            for (let child of categoryList.children) {
                child = updateTreeData(child, categoryList, categoryCount, flattenedCategories, nodeIds, dispatch);
                nodeIdList.push(child.id);
                flattenedCategoryList.push(child);
            }
        }
    }

    const filteredCategoryList = Object.assign({}, categoryList);
    dispatch({
        type: TreeViewActions.UPDATE_CATEGORY_TREE,
        payload: categoryList ? categoryList : defaultCategory,
    });
    dispatch({
        type: TreeViewActions.UPDATE_FILTERED_CATEGORY_TREE,
        payload: filteredCategoryList ? filteredCategoryList : defaultCategory,
    });
    dispatch({
        type: TreeViewActions.UPDATE_NODEIDS,
        payload: nodeIdList,
    });
    dispatch({
        type: TreeViewActions.UPDATE_FLATTENED_CATEGORIES,
        payload: flattenedCategoryList,
    });
};

/**
 * Update a treeview component
 * @param node category node
 * @param parent parent tree
 * @param categoryCount number of items in category
 * @param flattenedCategories flattened categories
 * @param nodeIds ids of nodes
 * @param dispatch function to update reducer state
 */
export const updateTreeData = (
    node: RenderTree,
    parent: RenderTree,
    categoryCount: CategoryAggregations[],
    flattenedCategories: RenderTree[],
    nodeIds: string[],
    dispatch: React.Dispatch<TreeViewAction>
): RenderTree => {
    const flattenedCategoryList = flattenedCategories;
    const nodeIdList = nodeIds;
    node.id = hashCode(parent.id ? `${parent.id}_${node.name}` : `${node.name}`);
    node.categories = `${parent.categories}/${node.name}`;
    node.count = getCategoryCount(node.categories, categoryCount);
    if (node.count > 0) {
        node.name = `${node.name} (${node.count})`;
    }
    node.parentId = parent.id;
    nodeIdList.push(node.id);
    if (node.children && node.children.length) {
        for (let child of node.children) {
            child = updateTreeData(child, node, categoryCount, flattenedCategories, nodeIds, dispatch);
            nodeIdList.push(child.id);
            flattenedCategoryList.push(child);
        }
    }

    dispatch({
        type: TreeViewActions.UPDATE_NODEIDS,
        payload: nodeIdList,
    });
    dispatch({
        type: TreeViewActions.UPDATE_FLATTENED_CATEGORIES,
        payload: flattenedCategoryList,
    });
    return node;
};

/**
 * Gets the content categories.
 * @param dispatch function to update reducer state
 * @param showOnlyGateMissions true if only return GATE items
 * @param typeKeywords typeKeywords to use in the search
 * @param isScene will pull back counts for web scenes
 * @param isMaps will pull back counts for web map
 */
export const getContentCategories = async (
    dispatch: React.Dispatch<TreeViewAction>,
    showOnlyGateMissions: boolean,
    typeKeywords: string,
    isScene = false,
    isMaps = false
): Promise<void> => {
    const counts = await getModelCategoryCounts(showOnlyGateMissions, typeKeywords, isScene, isMaps);
    const result = (await getModelCategoryContent()) as unknown as ContentCategories;
    if (counts) {
        dispatch({
            type: TreeViewActions.UPDATE_CATEGORY_COUNT,
            payload: counts,
        });
    }
    if (result) {
        dispatch({
            type: TreeViewActions.UPDATE_CONTENT_CATEGORIES,
            payload: result,
        });
    }
};
