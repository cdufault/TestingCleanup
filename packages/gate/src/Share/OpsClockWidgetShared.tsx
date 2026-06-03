import React from 'react';
import { OpsClockEditorWidgetLib } from '@stratcom/react-widget-lib';
import './opsClock.css';
import { OpsClockDataSerializable } from '@stratcom/react-widget-lib/types/OpsClockWidgetLib';

/**
 * The properties for the landing page branding object to build region-specific and landing-page specific branding.
 */
export interface opsClockSharedProps {
    clocks: OpsClockDataSerializable[];
}

/** Ops Clock shared from the React widget lib for GATE display */
export const OpsClockWidgetShared = (props: opsClockSharedProps): JSX.Element => {
    return (
        <>
            <div className='opsclocks-array'>
                <OpsClockEditorWidgetLib displayOnly={true} existingClocks={props.clocks} readonlyMode={true} />
            </div>
        </>
    );
};
