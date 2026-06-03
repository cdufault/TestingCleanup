import React, { useRef } from 'react';

import { FlexLayoutFactory } from './FlexLayoutFactory';
import * as FlexLayout from 'flexlayout-react';

import { getCustomUpdateModelActionAttributes, defaultUpdateModelActionAttributes } from './FlexLayoutActions';

import { CenterBox } from './MuiBoxStyles';
import { theme } from '../../assets/theme';

import XIcon from 'calcite-ui-icons-react/XIcon';
import ArrowUpRightIcon from 'calcite-ui-icons-react/ArrowUpRightIcon';
import MaximizeIcon from 'calcite-ui-icons-react/MaximizeIcon';
import MinimizeIcon from 'calcite-ui-icons-react/MinimizeIcon';
import { Typography } from '@mui/material';

import './RegionPage.css';

import { ToolbarItem } from './RegionToolsHelper';
import { Model } from 'flexlayout-react';
import { AppDispatch, RootState } from '../../data/store';
import { useDispatch, useSelector } from 'react-redux';
import { setLayoutModelJson, setLayoutModel } from './ToolbarSlice';

/**Input props for RegionFlexLayoutView */
interface RegionFlexLayoutViewProps {
    regionId?: string;
    setSelectedToolbarItemIds?: React.Dispatch<React.SetStateAction<string[]>>;
    selectedToolbarItemIds?: string[];
    toolbarItems?: ToolbarItem[];
    regionJsonModel?: FlexLayout.Model;
}

/**The section of the region view that holds the map, toolbar, tools, and widgets*/
const RegionFlexLayoutView = (props: RegionFlexLayoutViewProps): JSX.Element => {
    const { regionId, toolbarItems, selectedToolbarItemIds, setSelectedToolbarItemIds } = props;

    /**Option configuration values that can be defined for the layout, not currently being used */
    const actionObjs = {
        ...getCustomUpdateModelActionAttributes(regionId), //special values for this layout only
        ...defaultUpdateModelActionAttributes, //values for all layouts
    };

    const flexLayoutRef = useRef<any>(null);
    const dispatch: AppDispatch = useDispatch();
    const regionModelLayoutFromSlice = useSelector((state: RootState) => state.toolbarSlice.layoutModel);

    /**
     * Intercept tab actions before they fully execute and take action as desired
     * @param action the action that generated the event
     * @returns either cancel the action by returning undefined or return the action to proceed
     */
    function onModelAction(action: any): any | undefined {
        if (
            action.type === 'FlexLayout_DeleteTab' &&
            toolbarItems &&
            setSelectedToolbarItemIds &&
            selectedToolbarItemIds
        ) {
            const command = toolbarItems.find((command: any) => command.id === action.data.node);
            if (command) {
                command.visible = false;
                const tempIds = [...selectedToolbarItemIds];
                tempIds.filter((id) => id !== command.id);
                setSelectedToolbarItemIds(tempIds);
            }
            !command && console.error('Unable to find command with id: ' + action.data.node);
            return action; //returning on this action allows for later adding other action handlers
        }
        return action;
    }

    function handleModelChange(model: Model) {
        //continue to update the model json so that when the save state is called it has the updated data
        //using model.toString intentionally instead of model.toJson to avoid breaking flexlayout
        dispatch(setLayoutModelJson(model.toString()));
        //rather than creating a new model from the JSON in the layoutContext useEffect just set the model that was
        //passed to this method
        dispatch(setLayoutModel(model));
    }

    return (
        <>
            {regionModelLayoutFromSlice && (
                <div>
                    <FlexLayout.Layout
                        ref={flexLayoutRef}
                        model={regionModelLayoutFromSlice}
                        onAction={onModelAction}
                        factory={FlexLayoutFactory}
                        icons={{
                            close: <XIcon color={theme.palette.primary.contrastText} size={16} />,
                            popout: <ArrowUpRightIcon color={theme.palette.primary.contrastText} size={16} />,
                            maximize: <MaximizeIcon color={theme.palette.primary.contrastText} size={16} />,
                            restore: <MinimizeIcon color={theme.palette.primary.contrastText} size={16} />,
                        }}
                        onModelChange={handleModelChange}
                    />
                </div>
            )}
            {!regionModelLayoutFromSlice && (
                <div>
                    <CenterBox>
                        <Typography>Unable to find JSON for the layout.</Typography>
                    </CenterBox>
                </div>
            )}
        </>
    );
};
export default RegionFlexLayoutView;
