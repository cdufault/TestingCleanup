import { ApplicationStateHelper } from '../../../helpers/ApplicationStateHelper';
import { currentPortalUser } from '../../../helpers/portalUsersHelper';
import { IUserSaveState } from '../../../interfaces/UserSaveState';
import { ToolbarToolType } from '../../../types/ToolbarTool';

import {IJsonModel, Model, Node, TabNode, TabSetNode} from 'flexlayout-react';
import {getMissionIdByTitle, getWebAppAndData} from "../../../helpers/missionHelper";
import {getGroupContentByGroupId} from "../../../helpers/portalGroupHelper";
import {IUpdateItemResponse} from "@esri/arcgis-rest-portal";
import {updatePortalWebApp} from "../../../helpers/portalItemsHelper";

/**
 * A LayoutHelper result object for returning information on asynchronous calls.
 */
export interface LayoutHelperResult {
    success: boolean;
    message: string;
    layout?: IJsonModel | null;
}

const getNodeByType = (type: ToolbarToolType, nodes: Node[]): Node | undefined => {
    if (nodes) {
        for (let index = 0; index < nodes.length; index++) {
            const node = nodes[index];
            if (node.getType() === 'tab' && (node as any).getComponent() === type) {
                return node;
            } else if (node.getType() === 'tabset' || node.getType() === 'row') {
                const found = getNodeByType(type, node.getChildren());
                if (found) return found;
            }
        }
    }
};

/**
 * Gets the preferred Tabset for the layout, avoiding the Map tabset to prevent the map from being obstructed.
 * The order of preference is as follows:
 * 1. The active (selected) Tabset, if it does not contain the Map.
 * 2. The first non-Map Tabset found in the node tree.
 * 3. Finally, the Map Tabset if there are no other Tabsets available.
 * @param layoutModel The FlexLayout Model on which to search for the tabset.
 * @returns The ID of the preferred tabset.
 */
const getPreferredTabset = (layoutModel: Model): string => {
    const containers: string[] = [];
    let mapTabset = '';

    const activeTabsetId = layoutModel.getActiveTabset()?.getId() ?? '';
    let activeTabsetIsNonMap = false;

    layoutModel.visitNodes((node) => {
        if (node.getType() === TabSetNode.TYPE) {
            const hasMapNode = node
                .getChildren()
                .some(
                    (node) =>
                        node.getType() === TabNode.TYPE && (node as TabNode).getComponent() === ToolbarToolType.Map
                );
            if (!hasMapNode) {
                if (activeTabsetId && activeTabsetId === node.getId()) {
                    activeTabsetIsNonMap = true;
                }

                containers.push(node.getId());
            } else {
                mapTabset = node.getId();
            }
        }
    });

    return activeTabsetIsNonMap ? activeTabsetId : containers.length > 0 ? containers[0] : mapTabset;
};

const getUserSavedState = async (): Promise<IUserSaveState> => {
    const user = await currentPortalUser();
    return await ApplicationStateHelper.getUserSavedState(user);
};

/**
 * Save Mission Layout to the Mission application object.
 * @param missionTitle The Title of the Mission in which to save the Layout object
 * @param layout An input FlexLayout JSON object, or null for no layout.
 * @return A result helper object with result status and message.
 */
const saveAsMissionLayout = async ( missionTitle : string, layout : IJsonModel | null ) : Promise<LayoutHelperResult> => {

    const helperResult : LayoutHelperResult = { success: false, message: 'Updating Mission Layout Failed.' };

    if(missionTitle !== null)
    {
        const missionId = await getMissionIdByTitle(missionTitle);

        if (missionId) {
            const groupContent = await getGroupContentByGroupId(missionId);
            const webApps = groupContent.filter((content) => content.type === 'Application');
            if (webApps && webApps.length > 0) {
                const webAppId: string = webApps[0].id;
                const data = await getWebAppAndData(missionId);
                data.layout = layout;

                try {
                    const result: IUpdateItemResponse = await updatePortalWebApp(webAppId, JSON.stringify(data));

                    //make snackbar appear success.
                    helperResult.message = result.success ? 'Updated Mission Layout Successfully' : 'Error Updating Mission Layout.';
                    helperResult.success = result.success;

                } catch (e) {
                    helperResult.message = 'Error Updating Mission Layout: ' + e.message;
                    helperResult.success = false;
                    console.error(e.message);
                }

                return helperResult;
            }
        }
        else {
            helperResult.message = "Error Updating Mission Layout. The Mission ID was not found.";
            console.error(helperResult.message);
        }
    }
    else {
        helperResult.message = "Error Updating Mission Layout. The input Mission cannot be null.";
    }
    return helperResult;
}

/**
 * Get Mission Layout from the Mission application object.
 * @param missionTitle The Title of the Mission in which to save the Layout object
 * @return A result helper object with result status and message.
 */
const getMissionLayout = async ( missionTitle: string ) : Promise<LayoutHelperResult> => {

    const helperResult : LayoutHelperResult = { success: false, message: "There was an error retrieving the Mission Layout data." };

    if(missionTitle !== null)
    {
        const missionId = await getMissionIdByTitle(missionTitle);

        if (missionId) {
            try {
                const data = await getWebAppAndData(missionId);

                if (data) {
                    helperResult.layout = data.layout;
                    helperResult.message = "Layout retrieved successfully.";
                    helperResult.success = true
                } else {
                    helperResult.success = false;
                }
            } catch(error) {
                helperResult.success = false;
                helperResult.message = error.message;
            }
        }
    }

    return helperResult;
}

/**
 * Save user layout
 * @param layoutJson
 */
const saveUserLayout = async (layoutJson: any | undefined): Promise<LayoutHelperResult> => {
    const user = await currentPortalUser();
    const savedState = await ApplicationStateHelper.getUserSavedState(user);
    // the createSavedUserFeature and updateSaveUserFeature do not return an ApplicationStateHelperResult,
    // so we create one
    const helperResult = { success: true, message: 'Save Layout Success' };
    if (savedState && user) {
        savedState.layout = layoutJson;
        const savedResult = await ApplicationStateHelper.updateSavedUserFeature(user.username, savedState);
        if (!savedResult.success) {
            helperResult.success = false;
            helperResult.message = `Error Saving Layout: ${savedResult.message}`;
        }
        return helperResult;
    } else if (!savedState && user) {
        // user has no entry in the savedState table,
        // so we create an empty one with layout included
        const userSavedState = {
            defaultWebSceneId: '',
            defaultWebMapId: '',
            workspaces: [],
            lastSavedMission: '',
            currentWorkspace: '',
            lastSavedPortalItemId: '',
            viewType: '',
            layout: layoutJson,
            manualClassifications: [],
        };

        const result = await ApplicationStateHelper.createSavedUserFeature(userSavedState);
        if (result !== 'true') {
            helperResult.success = false;
            helperResult.message = `Error Saving Layout: ${result}`;
        }
        return helperResult;
    } else {
        return { success: false, message: 'Error Saving Layout' };
    }
};

export { getNodeByType, getPreferredTabset, getUserSavedState, saveUserLayout, saveAsMissionLayout, getMissionLayout };
