import { TabsetTypes } from './FlexLayoutJson';
import * as FlexLayout from 'flexlayout-react';
import { ToolbarItem } from './RegionToolsHelper';

/**object holding props for adding and removing tabs*/
interface ActionItem {
    /**'add' or 'remove' */
    action: string;
    /**toolbar button metadata */
    toolbarItem: any;
    /**parent node */
    rootNodeId: string;
    /**number of tabs in the layout */
    rootNodeTabCount: number;
}

/**
 * Given the current state of a command - add or remove the tab
 * @param actionItem props for adding or removing a tab
 * @param regionJsonModel the flex layout json data model
 */
export function updateTabAction(actionItem: ActionItem, regionJsonModel: FlexLayout.Model) {
    if (actionItem) {
        if (actionItem.action === 'add') {
            addNewTab(
                actionItem.toolbarItem.component,
                actionItem.toolbarItem.name,
                actionItem.toolbarItem.id,
                actionItem.rootNodeId,
                actionItem.rootNodeTabCount,
                regionJsonModel
            );
        } else if (actionItem.action === 'remove') {
            removeTab(actionItem.toolbarItem.id, regionJsonModel);
        }
        console.debug(`After command execution:${JSON.stringify(regionJsonModel?.toJson())}`, regionJsonModel);
    }
}

/**
 * Rename a flex layout tab
 * @param regionJsonModel JSON model for the flex layout
 * @param toolbarItemId a toolbar item identifier
 * @param newName the new name for the tab
 */
export function renameTab(regionJsonModel: FlexLayout.Model, toolbarItemId: string, newName: string) {
    if (regionJsonModel) {
        const node = regionJsonModel?.getNodeById(toolbarItemId);
        if (node) {
            regionJsonModel.doAction(FlexLayout.Actions.renameTab(node.getId(), newName));
        }
    }
}

/**
 * Add a new tab to the flex-layout
 * @param component the component that the tab will render
 * @param name name of the tab that will display at the top
 * @param componentName name of the component
 * @param parentId id of the tab that will be the parent
 * @param tabCount number of tabs currently rendered on the page
 * @param regionJsonModel the flex layout json data model
 */
function addNewTab(
    component: string,
    name: string,
    componentName: string,
    parentId: string,
    tabCount: number,
    regionJsonModel: FlexLayout.Model
) {
    let dockLocation: FlexLayout.DockLocation = FlexLayout.DockLocation.LEFT;

    if (!parentId) {
        parentId = TabsetTypes.Maps;
        dockLocation = FlexLayout.DockLocation.LEFT;
    }
    if (componentName === TabsetTypes.CountsTabset) {
        if (tabCount === 1) {
            dockLocation = FlexLayout.DockLocation.LEFT; //map only
        } else if (tabCount > 2) {
            dockLocation = FlexLayout.DockLocation.CENTER;
        } else {
            dockLocation = FlexLayout.DockLocation.TOP; //add to non-map tab
        }
    } else if (componentName === TabsetTypes.AnalystCommentsTabset) {
        if (tabCount === 1) {
            dockLocation = FlexLayout.DockLocation.LEFT; //map only
        } else if (tabCount > 2) {
            dockLocation = FlexLayout.DockLocation.CENTER;
        } else {
            dockLocation = FlexLayout.DockLocation.BOTTOM; //add to non-map tab
        }
    } else {
        if (tabCount === 1) {
            dockLocation = FlexLayout.DockLocation.LEFT; //map only
        } else {
            dockLocation = FlexLayout.DockLocation.CENTER; //add to non-map tab
        }
    }

    if (regionJsonModel) {
        regionJsonModel.doAction(
            FlexLayout.Actions.addNode(
                {
                    type: 'tab',
                    component: component,
                    name: name,
                    id: componentName,
                    enableClose: true,
                },
                parentId,
                dockLocation,
                -1
            )
        );
    }
}

/**
 * Remove a tab from the flex-layout
 * @param tabNodeId id of the tab node
 * @param regionJsonModel the flex layout json data model
 */
function removeTab(tabNodeId: string, regionJsonModel: FlexLayout.Model) {
    regionJsonModel && regionJsonModel.doAction(FlexLayout.Actions.deleteTab(tabNodeId));
}

/**
 * Determine if the command clicked requires adding a tab or removing a tab
 * @param toolbarItem toolbar item that was clicked
 * @param regionJsonModel the flex layout json data model
 * @returns an actionItem with the props needed for adding or removing a tab
 */
export function defineToolbarItemAction(
    toolbarItem: ToolbarItem,
    regionJsonModel: FlexLayout.Model
): ActionItem | undefined {
    let rootNode = findRootParentTab(regionJsonModel);
    console.debug(`Before command execution:${JSON.stringify(regionJsonModel?.toJson())}`, regionJsonModel);
    let action = '';
    let actionItem: ActionItem | undefined = undefined;
    const node = regionJsonModel?.getNodeById(toolbarItem.id);
    if (node) {
        if (!toolbarItem.visible) {
            action = 'remove';
            actionItem = {
                action: 'remove',
                toolbarItem: toolbarItem,
                rootNodeId: rootNode.parentId,
                rootNodeTabCount: rootNode.tabCount,
            };
        }
        if (toolbarItem.visible) {
            actionItem = {
                action: 'add',
                toolbarItem: toolbarItem,
                rootNodeId: rootNode.parentId,
                rootNodeTabCount: rootNode.tabCount,
            };
        }
    } else {
        //no node
        if (toolbarItem.visible) {
            actionItem = {
                action: 'add',
                toolbarItem: toolbarItem,
                rootNodeId: rootNode.parentId,
                rootNodeTabCount: rootNode.tabCount,
            };
        }
    }
    return actionItem;
}

/**
 * Find the current flex-layout root - top most component of type 'tabset'
 * @param regionJsonModel the flex layout json data model
 * @returns {parentId: string | undefined, tabCount: number}
 */
function findRootParentTab(regionJsonModel: FlexLayout.Model): { parentId: string; tabCount: number } {
    let tabIds: { id: string; type: string }[] = [];
    let tabCount = 0;
    regionJsonModel &&
        regionJsonModel.visitNodes((node, level) => {
            const nodeType = node.getType();
            nodeType === 'tab' && tabCount++;
            tabIds.push({
                id: node.getId(),
                type: nodeType,
            });
        });

    let root: any = tabIds.find((node) => node.type === 'tabset');
    let parentId = root ? root.id : undefined;
    return { parentId, tabCount };
}
