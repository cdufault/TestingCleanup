import React, { useEffect, useRef } from 'react';

import TreeItem from '@mui/lab/TreeItem/TreeItem';
import TreeView from '@mui/lab/TreeView/TreeView';

import CaretDownIcon from 'calcite-ui-icons-react/CaretDownIcon';
import CaretRightIcon from 'calcite-ui-icons-react/CaretRightIcon';

// Styles
import { useStyles } from './styles';

/**
 * This is the interface for the object used to populate the tree view
 */
export interface RenderTree {
    id: string;
    parentId?: string;
    name: string;
    children?: RenderTree[];
    count?: number;
    categories?: string;
}

export interface ShowHighlight {
    show: boolean;
}

/**
 * Nodes should follow the interface above and have to be passed in for the treeviw to have options
 * also pass in the handleClick which is handled in the component passing it in
 */
interface RecursiveTreeViewProps {
    expandedNodes?: string[];
    categories?: RenderTree[];
    nodes: RenderTree;
    selectedNode?: string;
    handleSelect: (event: React.SyntheticEvent, nodeId: string) => void;
    showHighlightOnCategoryItem?: ShowHighlight;
}

export const findMatchingIds = (node: RenderTree, searchTerm: string, matchingIds: string[]): boolean => {
    let isMatching = node.name.toLowerCase().includes(searchTerm.toLowerCase());

    if (Array.isArray(node.children)) {
        node.children.forEach((child) => {
            const hasMatchingChild = findMatchingIds(child, searchTerm, matchingIds);
            isMatching = isMatching || hasMatchingChild;
        });
    }

    if (isMatching) {
        matchingIds.push(node.id);
    }

    return isMatching;
};

export const filterNodes = (nodes: RenderTree[], ids: string[]): RenderTree[] => {
    return nodes
        .filter((item) => ids.indexOf(item.id) > -1)
        .map((item) => ({
            ...item,
            children: item.children ? filterNodes(item.children, ids) : [],
        }));
};

// Component
const RecursiveTreeView = (props: RecursiveTreeViewProps): JSX.Element => {
    const showHighlightOnCategoryItem: ShowHighlight | undefined = props.showHighlightOnCategoryItem; //prop is a state object on caller
    const classes = useStyles();
    const expandedNodes = useRef<string[]>(props.selectedNode ? [props.selectedNode] : props.expandedNodes ?? []);

    useEffect(() => {
        if (props.selectedNode && props.selectedNode !== '') {
            getExpanedNodes(props.selectedNode);
        }
    }, [props.selectedNode]);

    const getExpanedNodes = (nodeId: string): void => {
        if (props.categories) {
            const node = props.categories.find((item: RenderTree) => {
                return item.id === nodeId;
            });
            if (node?.parentId) {
                const parentId = node.parentId;
                expandedNodes.current = [...expandedNodes.current, parentId];
                getExpanedNodes(parentId);
            }
        }
    };

    const renderTree = (nodes: RenderTree) => (
        <TreeItem key={nodes.id} nodeId={nodes.id} label={nodes.name}>
            {Array.isArray(nodes.children) ? nodes.children.map((node) => renderTree(node)) : null}
        </TreeItem>
    );

    const handleToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
        expandedNodes.current = nodeIds.length !== 0 ? nodeIds : [];
    };

    const showHighlight = showHighlightOnCategoryItem?.show === undefined ? true : showHighlightOnCategoryItem?.show;
    return (
        <TreeView
            className={`${showHighlight ? classes.root : classes.rootNoHighlight}`}
            defaultExpandIcon={<CaretRightIcon />}
            defaultCollapseIcon={<CaretDownIcon />}
            expanded={expandedNodes.current}
            onNodeSelect={props.handleSelect}
            onNodeToggle={handleToggle}
            selected={props.selectedNode}
        >
            {renderTree(props.nodes)}
        </TreeView>
    );
};

export default RecursiveTreeView;
