import React, { useRef, useState } from 'react';

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
    // Collect the ids of every node that has children so the whole tree can be expanded.
    const collectExpandableIds = (node: RenderTree, ids: string[] = []): string[] => {
        if (Array.isArray(node.children) && node.children.length) {
            ids.push(node.id);
            node.children.forEach((child) => collectExpandableIds(child, ids));
        }
        return ids;
    };

    // Initialise the expanded set lazily from the current tree so that, on mount, the
    // tree is ALREADY fully expanded. This is important for selection: the selected
    // node must exist in the DOM when MUI applies the `Mui-selected` styling. If we
    // expanded via an effect (after mount) instead, a selected child inside a still
    // collapsed parent would not receive the highlight.
    const [expandedNodes, setExpandedNodes] = useState<string[]>(() => collectExpandableIds(props.nodes));

    // Bump a version whenever the tree (props.nodes) is rebuilt. The version is used as the
    // TreeView key so it remounts on each rebuild. Combined with the lazy-initialised
    // expanded state above, the remounted tree comes up fully expanded with the controlled
    // `selected` value applied - keeping the previously selected node highlighted.
    const treeVersion = useRef(0);
    const previousNodes = useRef(props.nodes);
    if (previousNodes.current !== props.nodes) {
        previousNodes.current = props.nodes;
        treeVersion.current += 1;
    }

    const renderTree = (nodes: RenderTree) => (
        <TreeItem key={nodes.id} nodeId={nodes.id} label={nodes.name}>
            {Array.isArray(nodes.children) ? nodes.children.map((node) => renderTree(node)) : null}
        </TreeItem>
    );

    const handleToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
        setExpandedNodes(nodeIds);
    };

    const showHighlight = showHighlightOnCategoryItem?.show === undefined ? true : showHighlightOnCategoryItem?.show;
    return (
        <TreeView
            key={treeVersion.current}
            className={`${showHighlight ? classes.root : classes.rootNoHighlight}`}
            defaultExpandIcon={<CaretRightIcon />}
            defaultCollapseIcon={<CaretDownIcon />}
            expanded={expandedNodes}
            onNodeSelect={props.handleSelect}
            onNodeToggle={handleToggle}
            selected={props.selectedNode}
        >
            {renderTree(props.nodes)}
        </TreeView>
    );
};

export default RecursiveTreeView;
