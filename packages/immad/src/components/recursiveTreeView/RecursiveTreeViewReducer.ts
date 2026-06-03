import { RenderTree } from './RecursiveTreeView';
import { CategoryAggregations, ContentCategories } from '../../helpers/portalHelper';

/**
 * Tree view state object attributes to track
 */
export interface TreeViewState {
    categoryTree: RenderTree;
    filteredCategoryTree: RenderTree;
    nodeIds: string[];
    flattenedCategories: RenderTree[];
    categoryCount: CategoryAggregations[];
    contentCategories?: ContentCategories;
}

/**
 * Actions that the reducer can perform
 */
export const TreeViewActions = {
    UPDATE_CATEGORY_TREE: 'update_category_tree',
    UPDATE_FILTERED_CATEGORY_TREE: 'update_filterd_category',
    UPDATE_NODEIDS: 'update_nodeids',
    UPDATE_FLATTENED_CATEGORIES: 'update_flattened_categories',
    UPDATE_CATEGORY_COUNT: 'update_category_count',
    UPDATE_CONTENT_CATEGORIES: 'update_content_categories',
};

/**
 * Format of a reducer object -- data coming into the reducer function
 */
export interface TreeViewAction {
    type: string;
    payload: any | any[];
}

/**
 * Initial state of the reducer data object
 */
export const initTreeViewState: TreeViewState = {
    categoryTree: { id: '', name: '' },
    filteredCategoryTree: { id: '', name: '' },
    nodeIds: [],
    flattenedCategories: [],
    categoryCount: [],
    contentCategories: undefined,
};

/**
 *
 * @param state current state object
 * @param action action to take along with the associated data to apply
 */
export function recursiveTreeViewReducer(state: TreeViewState, action: TreeViewAction): TreeViewState {
    switch (action.type) {
        case TreeViewActions.UPDATE_CATEGORY_TREE:
            return { ...state, categoryTree: action.payload };
        case TreeViewActions.UPDATE_FILTERED_CATEGORY_TREE:
            return { ...state, filteredCategoryTree: action.payload };
        case TreeViewActions.UPDATE_NODEIDS:
            return { ...state, nodeIds: [...action.payload] };
        case TreeViewActions.UPDATE_FLATTENED_CATEGORIES:
            return { ...state, flattenedCategories: [...action.payload] };
        case TreeViewActions.UPDATE_CATEGORY_COUNT:
            return { ...state, categoryCount: [...action.payload] };
        case TreeViewActions.UPDATE_CONTENT_CATEGORIES:
            return { ...state, contentCategories: action.payload };
        default:
            return state;
    }
}
