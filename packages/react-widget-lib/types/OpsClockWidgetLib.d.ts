import React from "react";

/**OpsClockWidget data */
export interface OpsClockData {
    /** ID of the clock */
    id: number;
    /** Name of the clock */
    name: string;
    /** GMT offset for the clock */
    offset: number;
    /** Current time for the clock */
    currentTime: Date;
    /** Edit mode active for editing clocks */
    editMode?: boolean;
    /** Update function for name */
    onUpdateName?: (newName: string) => void;
    /** Update function for GMT offset */
    onUpdateOffset?: (newOffset: number) => void;
    /** Readonly clock format returned */
    readOnly?: boolean;
}
export declare const Clock: (props: OpsClockData) => React.JSX.Element;
/** Describes the Ops Clock interface but serializable for the slice */
export interface AddOpsClockTile {
    /** ID of the clock */
    addClockFunction: () => void;
}
/** Tile button for adding an ops clock
 * @param props properties for the add ops clock tile button
 */
export declare const AddOpsClockTile: (props: AddOpsClockTile) => React.JSX.Element;
/** Describes the Ops Clock interface but serializable for the slice */
export interface OpsClockDataSerializable {
    /** ID of the clock */
    id: number;
    /** Name of the clock */
    name: string;
    /** GMT offset for the clock */
    offset: number;
    /** Current time for the clock */
    currentTime: number;
}
export interface OpsClockEditorWidgetProps {
    /** Event handler which is called when the clocks list changes to save edits */
    onClocksSave?: (value: OpsClockDataSerializable[]) => void;
    /** A list of existing clocks can be passed in for editing */
    existingClocks?: OpsClockDataSerializable[];
    /** Display clocks only or display editor */
    displayOnly?: boolean;
    /** Maximum number of clocks to add */
    maximumNumberOfClocks?: number;
    /** Read only mode active for all clocks */
    readonlyMode?: boolean;
    /** GATE Configuration page display */
    gateConfigurationMode?: boolean;
}
/** Interface for editing ops clocks overall container of the clocks */
export declare const OpsClockEditorWidgetLib: (props: OpsClockEditorWidgetProps) => React.JSX.Element;
