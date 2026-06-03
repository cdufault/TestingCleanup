import React, { createContext, useState } from 'react';

// Type imports
import { ToolbarTool } from '../types/ToolbarTool';

interface ToolbarProviderProps {
    tools: ToolbarTool[];
    children: JSX.Element[] | JSX.Element;
}

interface ContextProps {
    tools: ToolbarTool[];
    selectedTools: number[];
    addTool: ToolbarTool | undefined;
    removeTool: ToolbarTool | undefined;
    setSelectedTools: React.Dispatch<React.SetStateAction<number[]>>;
    setAddTool: React.Dispatch<React.SetStateAction<ToolbarTool | undefined>>;
    setRemoveTool: React.Dispatch<React.SetStateAction<ToolbarTool | undefined>>;
    tGridCanRender: boolean | undefined;
    setTGridCanRender: (value: boolean | undefined) => void;
}

// map context
export const ToolbarContext = createContext<ContextProps>({
    tools: [],
    selectedTools: [],
    addTool: undefined,
    removeTool: undefined,
    setSelectedTools: (_value: number[]) => {
        return;
    },
    setAddTool: (_value: ToolbarTool | undefined) => {
        return;
    },
    setRemoveTool: (_value: ToolbarTool | undefined) => {
        return;
    },
    tGridCanRender: undefined,
    setTGridCanRender: (_value: boolean | undefined) => {
        return;
    },
});

// toolbar provider
export const ToolbarProvider = ({ tools, children }: ToolbarProviderProps): JSX.Element => {
    const [selectedTools, setSelectedTools] = useState(
        tools.filter((tool) => tool.selected).map((tool, index) => index)
    );
    const [addTool, setAddTool] = useState<ToolbarTool>();
    const [removeTool, setRemoveTool] = useState<ToolbarTool>();
    const [tGridCanRender, setTGridCanRender] = useState<boolean | undefined>();
    const value = {
        tools,
        selectedTools,
        addTool,
        removeTool,
        setSelectedTools,
        setAddTool,
        setRemoveTool,
        tGridCanRender,
        setTGridCanRender,
    };

    return <ToolbarContext.Provider value={value}>{children}</ToolbarContext.Provider>;
};
