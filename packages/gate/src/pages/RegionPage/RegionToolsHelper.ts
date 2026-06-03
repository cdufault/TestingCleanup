/**Props for an icon tool */
export interface IconProp {
    size?: number;
    color?: string;
    className?: string;
    children?: JSX.Element;
    [props: string]: any;
}

/**props for icon command/tool */
export interface ToolbarItem {
    /**id that identifies the command */
    id: string,
    /**the name of the component that the tool will display */
    component: string,
    /**name to put on the tab */
    name: string,
    /**should the tab be visible or hidden */
    visible: boolean,
    /**tooltip for the icon button */
    tooltip: string,
    /**icon do display */
    icon: JSX.Element 
}
/**This class will provide support for handling tool interaction in the region view */
