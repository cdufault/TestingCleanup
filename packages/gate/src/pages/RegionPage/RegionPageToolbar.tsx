import React, { useEffect, useState } from 'react';
import * as FlexLayout from 'flexlayout-react';

import { TabsetTypes } from './FlexLayoutJson';

import { ToggleButtonGroup, Tooltip } from '@mui/material';

import { defineToolbarItemAction, updateTabAction, renameTab } from './RegionViewHelper';
import { useAppSelector } from '../../hooks/hooks';
import './RegionPage.css';
import { ToolbarItem } from './RegionToolsHelper';

import { GateAnalystCommentIcon } from '../../images/GateAnalystCommentIcon';
import { ActivityCountsIcon } from '../../images/ActivityCountsIcon';

import LegendIcon from 'calcite-ui-icons-react/LegendIcon';
import GalleryIcon from 'calcite-ui-icons-react/GalleryIcon';
import SelectCategoryIcon from 'calcite-ui-icons-react/SelectCategoryIcon';

import {
    StyledRegionPageToolbarResetButton,
    StyledRegionPageToolbarSaveButton,
    StyledRegionPageToolbarToggleButton,
} from './MuiBoxStyles';
import { getPortalGroupMembers } from '@stratcom/lib-functions';
import { StaticAuthenticationState } from '../../data/StaticAuthenticationState';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../data/store';
import { setSaveLayoutClicked, setResetLayoutClicked } from './ToolbarSlice';

const iconCommands: ToolbarItem[] = [
    {
        id: TabsetTypes.CountsTabset,
        component: 'Activity Counts',
        name: 'Activity Counts',
        visible: true,
        tooltip: 'Activity Counts',
        icon: <ActivityCountsIcon />,
    },
    {
        id: TabsetTypes.AnalystCommentsTabset,
        component: 'Analyst Comments',
        name: 'Analyst Comments',
        visible: true,
        tooltip: 'Analyst Comments',
        icon: <GateAnalystCommentIcon />,
    },
    {
        id: TabsetTypes.LegendTabset,
        component: 'Legend',
        name: 'Legend',
        visible: true,
        tooltip: 'Legend',
        icon: <LegendIcon />,
    },
    /*{ keep for future reference
        id: 'Custom Tab',
        component: "Custom Tab",
        name: "Test Only Tab",
        visible: false,
        tooltip: "Test tab only.",
        icon: <GlobeIcon  color={theme.palette.primary.contrastText} />
    } */
];

interface IRegionToolbarProps {
    setSelectedToolbarItemIds: React.Dispatch<React.SetStateAction<string[]>>;
    setToolbarItems: React.Dispatch<React.SetStateAction<ToolbarItem[]>>;
    toolbarItems: ToolbarItem[];
    selectedToolbarItemIds: string[];
    regionJsonModel: FlexLayout.Model;
}

const RegionPageToolbar = (props: IRegionToolbarProps): JSX.Element => {
    const { regionJsonModel, setToolbarItems, setSelectedToolbarItemIds, toolbarItems, selectedToolbarItemIds } = props;
    setToolbarItems(iconCommands);

    const gateDynamicConfig = useAppSelector((state) => state.applicationSlice.gateDynamicConfig);

    const [clickedToolbarItem, setClickedToolbarItem] = useState<ToolbarItem | undefined>();
    const userSession = StaticAuthenticationState.getUserSessionState();
    const portal = StaticAuthenticationState.getPortalState();
    const thePortal = StaticAuthenticationState.getPortalState();
    const user = thePortal.user;
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const appConfig = useSelector((state: RootState) => state.applicationSlice.applicationConfig);
    const dispatch: AppDispatch = useDispatch();
    const jsonLayoutFromSlice = useSelector((state: RootState) => state.toolbarSlice.layoutModel);
    const displayMode = useSelector((state: RootState) => state.applicationSlice.regionDisplayMode);

    useEffect(() => {
        () => {
            setToolbarItems([]);
            setClickedToolbarItem(undefined);
            setSelectedToolbarItemIds([]);
        };
    }, []);

    useEffect(() => {
        isUserAdmin();
        if (regionJsonModel && toolbarItems) {
            const analystCommentTBItem = toolbarItems.find((tbItem) => tbItem.component === 'Analyst Comments');
            if (analystCommentTBItem) {
                const newName = gateDynamicConfig.analystCommentsAlias;
                if (newName && newName !== '') {
                    analystCommentTBItem.name = newName;
                    renameTab(regionJsonModel, analystCommentTBItem.id, newName);
                }
            }
        }
    }, [regionJsonModel, toolbarItems]);

    useEffect(() => {
        if (jsonLayoutFromSlice && toolbarItems) {
            // due to flex layout being a 'dead zone' of sorts, manual resetting of button selections/ highlights in the
            // toolbar is needed
            const analystCommentTBItem = toolbarItems.find((tbItem) => tbItem.component === 'Analyst Comments');
            const activityCountsTBItem = toolbarItems.find((tbItem) => tbItem.component === 'Activity Counts');
            const legendTBItem = toolbarItems.find((tbItem) => tbItem.component === 'Legend');
            // @ts-ignore
            if (jsonLayoutFromSlice._idMap.legendtabset === undefined && legendTBItem) {
                legendTBItem.visible = false;
            }
            // @ts-ignore
            if (jsonLayoutFromSlice._idMap.legendtabset && legendTBItem) {
                legendTBItem.visible = true;
            }
            // @ts-ignore
            if (jsonLayoutFromSlice._idMap.analystcommentstabset === undefined && analystCommentTBItem) {
                analystCommentTBItem.visible = false;
            }
            // @ts-ignore
            if (jsonLayoutFromSlice._idMap.analystcommentstabset && analystCommentTBItem) {
                analystCommentTBItem.visible = true;
            }
            // @ts-ignore
            if (jsonLayoutFromSlice._idMap.countstabset === undefined && activityCountsTBItem) {
                activityCountsTBItem.visible = false;
            }
            // @ts-ignore
            if (jsonLayoutFromSlice._idMap.countstabset && activityCountsTBItem) {
                activityCountsTBItem.visible = true;
            }
        }
    }, [jsonLayoutFromSlice]);

    useEffect(() => {
        if (clickedToolbarItem && regionJsonModel) {
            const actionItem = defineToolbarItemAction(clickedToolbarItem, regionJsonModel);
            actionItem && updateTabAction(actionItem, regionJsonModel);
            setClickedToolbarItem(undefined);
        }
    }, [clickedToolbarItem]);

    async function isUserAdmin() {
        const adminGroupMembers = await getPortalGroupMembers(portal.restUrl, userSession, appConfig.gateAdminGroupId);
        const groupMembers = [...adminGroupMembers.users, ...adminGroupMembers.admins];
        const isAdmin = groupMembers.includes(user.username);
        setIsAdmin(isAdmin);
    }

    /**
     * Handle the selection event on a toolbar item button
     * @param e event item
     * @param id id of the toolbar item selected
     */
    function handleToolbarItemBtnClick(e: any, id: string) {
        const updatedItems = [...toolbarItems];
        const clickedItem: any = updatedItems.find((command) => command.id === id);
        if (clickedItem) {
            const currentVis = clickedItem.visible;
            // keep reset layout button highlighted - doesn't need to be visible/invisible
            clickedItem.visible = !currentVis;
            setToolbarItems(updatedItems);
            setClickedToolbarItem(clickedItem);
        } else {
            // manually checking incoming id as reset and save buttons are not in the main toolbar
            if (id === 'savelayout') {
                dispatch(setSaveLayoutClicked(true));
            } else if (id === 'resetlayout') {
                dispatch(setResetLayoutClicked(true));
            }
        }
    }

    /**
     * Handle a toolbar item selection change
     * @param e event
     * @param selectedButtonIds array of tab ids selected
     */
    function toolbarItemCommandChange(e: any, selectedButtonIds: string[]) {
        setSelectedToolbarItemIds(selectedButtonIds);
    }

    function createButtonItems(iconObj: ToolbarItem, index: number) {
        return (
            <Tooltip title={iconObj.tooltip} key={index} placement='right' className='styled-buttons'>
                <StyledRegionPageToolbarToggleButton
                    value={iconObj.id}
                    onClick={(e) => handleToolbarItemBtnClick(e, iconObj.id)}
                    selected={iconObj.visible}
                    className='toolbar-buttons'
                >
                    {iconObj.icon}
                </StyledRegionPageToolbarToggleButton>
            </Tooltip>
        );
    }

    return (
        <>
            <div className='buttongroups-container'>
                <div className='region-toolbar'>
                    <ToggleButtonGroup
                        orientation='vertical'
                        value={selectedToolbarItemIds}
                        onChange={toolbarItemCommandChange}
                    >
                        {toolbarItems.map((iconObj, index) => createButtonItems(iconObj, index))}
                    </ToggleButtonGroup>
                </div>
                <div className='reset-toolbar'>
                    <ToggleButtonGroup orientation='vertical'>
                        {isAdmin ? (
                            <div>
                                <Tooltip title={'Reset Layout to Default'} placement='right' className='styled-buttons'>
                                    <StyledRegionPageToolbarResetButton
                                        value={'resetlayout'}
                                        onClick={(e) => handleToolbarItemBtnClick(e, 'resetlayout')}
                                        className='toolbar-buttons'
                                    >
                                        <GalleryIcon />
                                    </StyledRegionPageToolbarResetButton>
                                </Tooltip>
                                <Tooltip title={'Save Layout as Default'} placement='right' className='styled-buttons'>
                                    <StyledRegionPageToolbarSaveButton
                                        value={'savelayout'}
                                        onClick={(e) => handleToolbarItemBtnClick(e, 'savelayout')}
                                        className='toolbar-buttons'
                                        disabled={displayMode === 'Presentation'}
                                    >
                                        <SelectCategoryIcon />
                                    </StyledRegionPageToolbarSaveButton>
                                </Tooltip>
                            </div>
                        ) : (
                            <Tooltip title={'Reset Layout to Default'} placement='right' className='styled-buttons'>
                                <StyledRegionPageToolbarResetButton
                                    value={'resetlayout'}
                                    onClick={(e) => handleToolbarItemBtnClick(e, 'resetlayout')}
                                    className='toolbar-buttons'
                                >
                                    <GalleryIcon />
                                </StyledRegionPageToolbarResetButton>
                            </Tooltip>
                        )}
                    </ToggleButtonGroup>
                </div>
            </div>
        </>
    );
};
export default RegionPageToolbar;
