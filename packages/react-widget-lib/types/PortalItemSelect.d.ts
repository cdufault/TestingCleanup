import PortalItem from "@arcgis/core/portal/PortalItem";
import Portal from "@arcgis/core/portal/Portal";
import {Theme} from "@emotion/react";

/**
 * Portal item select props.
 */
export interface PortalItemSelectProps
{
    theme?: Theme;

    /*
    References an active Portal
     */
    portal: Portal;

    /*
    Event handler which is called when the selected Portal item changes
     */
    onItemChange: (value: PortalItem | null) => void;

    /*
    A Portal item ID for initializing the Item select with a value.
     */
    portalItemID?: string;

    /*
    The label shown on the control
     */
    label?: string;

    /*
    The query filter to apply to the Portal Item select. For instance, the select can be limited to feature service items by
    adding "type: feature" as the query. This query filter will be applied in addition to the user's search.
     */
    query? : string;

    /*
    Disable the select control.
     */
    disabled?: boolean;
}

/**
 *  Component for searching for items in a Portal and displaying a list of options to the user.
 */
export declare const PortalItemSelect: (props: PortalItemSelectProps) => JSX.Element;
export {};