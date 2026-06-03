// React imports
import React, { useContext, useEffect, useState } from 'react';
import { TabNode } from 'flexlayout-react';

// Component imports
import { Tooltip } from '@mui/material';

// Style imports
import {
    Paper,
    ToggleButton,
    StyledToggleButtonGroup,
    StyledToolbarDrawer,
    StyledIconButtonToolbarDrawer,
} from './styles';

// Type imports
import { ToolbarToolType } from '../../types/ToolbarTool';

// Context imports
import { ToolbarContext } from '../../contexts/Toolbar';
import { useLayoutContext } from '../../contexts/LayoutContext';
import { LogHelper } from '../../helpers/logHelper';

import CaretRightIcon from 'calcite-ui-icons-react/CaretRightIcon';
import CaretLeftIcon from 'calcite-ui-icons-react/CaretLeftIcon';

// Component
const Toolbar = (): JSX.Element => {
    const { tools, selectedTools, setSelectedTools, setAddTool, setRemoveTool } = useContext(ToolbarContext);
    const layoutContext = useLayoutContext();
    const [hideToolbar, setHideToolbar] = useState<boolean>(false);
    const [toolbarDrawerTooltip, setToolbarDrawerTooltip] = useState<string>('Close Toolbar');

    useEffect(() => {
        if (hideToolbar) {
            setToolbarDrawerTooltip('Open Toolbar');
        } else {
            setToolbarDrawerTooltip('Close Toolbar');
        }
    }, [hideToolbar]);

    useEffect(() => {
        if (layoutContext.model) {
            try {
                const layoutTools: number[] = [];
                // add all of the widgets from the saved layout to the selected tools
                layoutContext.model.visitNodes((node) => {
                    if (node.getType() === TabNode.TYPE) {
                        const component = (node as TabNode)?.getComponent();
                        if (component) {
                            const index = tools.findIndex((tool) => tool.type === component);
                            if (index > -1) {
                                layoutTools.push(index);
                            }
                        }
                    }
                });
                setSelectedTools(layoutTools);
            } catch (e) {
                LogHelper.log(e.message, true);
            }
        }
    }, [layoutContext.model]);

    const handleToolToggle = (evt: React.MouseEvent<HTMLElement>, newTools: number[]) => {
        const index = Number((evt.currentTarget as any).value);
        const tool = tools[index];
        if (tool.type !== ToolbarToolType.Map) {
            if (newTools.length > selectedTools.length) {
                setAddTool(tool);
            } else {
                setRemoveTool(tool);
            }
            setSelectedTools(newTools);
        }
    };

    const handleToolbarHideToggle = () => {
        setHideToolbar(!hideToolbar);
    };

    return (
        <>
            {!hideToolbar && (
                <Paper elevation={0}>
                    {tools && (
                        <>
                            <StyledToggleButtonGroup
                                orientation='vertical'
                                value={selectedTools}
                                onChange={handleToolToggle}
                                hidden={hideToolbar}
                            >
                                {tools.map((tool, index) => {
                                    return (
                                        <ToggleButton
                                            key={index}
                                            aria-label={tool.name}
                                            value={index}
                                            title={tool.tooltip}
                                            size='small'
                                        >
                                            {tool.icon}
                                        </ToggleButton>
                                    );
                                })}
                            </StyledToggleButtonGroup>
                        </>
                    )}
                </Paper>
            )}
            <StyledToolbarDrawer>
                <Tooltip title={toolbarDrawerTooltip} placement={'right'}>
                    <StyledIconButtonToolbarDrawer size={'small'} onClick={handleToolbarHideToggle}>
                        {hideToolbar ? <CaretRightIcon /> : <CaretLeftIcon />}
                    </StyledIconButtonToolbarDrawer>
                </Tooltip>
            </StyledToolbarDrawer>
        </>
    );
};

export default Toolbar;
