import React, { useEffect, useState } from 'react';
import { Box, FormControlLabel, Checkbox } from '@mui/material';

import { WidgetActions, ActionButton, CheckBoxGroup } from '../../../common';

interface dataTableHeaderProps {
    addToMap?: boolean;
    selectedFeatures?: __esri.Graphic[] | [];
    loggerMethod?: (message: string, isError?: boolean) => void | undefined;

    featureCount?: number;
    refreshedGrid: boolean;
    addDataToMapFunc?: () => Promise<boolean>; //() => void | undefined;
    zoomToFeaturesFunc?: () => void | undefined;
    toggleMapSelectionFunc?: (toggle: boolean) => void | undefined;
    layerViewIsConnected: boolean;
}

function DataTableHeader(props: dataTableHeaderProps): JSX.Element {
    const {
        addDataToMapFunc,
        toggleMapSelectionFunc,
        selectedFeatures,
        addToMap,
        featureCount,
        refreshedGrid,
        zoomToFeaturesFunc,
        layerViewIsConnected,
    } = props;

    const [addedToMap, setAddedToMap] = useState(false);
    const [highlightOn, setHighlightOn] = useState(false);

    useEffect(() => {
        if (refreshedGrid == true) {
            setAddedToMap(false);
        }
    }, [refreshedGrid]);

    useEffect(() => {
        if (!layerViewIsConnected) {
            if (toggleMapSelectionFunc) {
                toggleMapSelectionFunc(false);
            }
            setHighlightOn(false);
        }
    }, [layerViewIsConnected]);

    /**
     * Handle add data to map button click
     */
    function addDataToMapClickHandler() {
        if (addDataToMapFunc != null) {
            addDataToMapFunc();
            setAddedToMap(true);
        }
    }

    /**
     * Handle toggling hightlight on and off
     * @param event Event
     */
    function highlightSelectedHandler(event: React.ChangeEvent<HTMLInputElement>) {
        if (toggleMapSelection) {
            if (event.target.checked && toggleMapSelectionFunc != undefined) {
                toggleMapSelectionFunc(true);
                setHighlightOn(true);
                return;
            }
            if (toggleMapSelectionFunc != undefined) {
                toggleMapSelectionFunc(false);
                setHighlightOn(false);
            }
        }
    }

    const toggleMapSelection = toggleMapSelectionFunc && addedToMap ? true : false;
    const queryFeatureCount = featureCount ? featureCount : 0;
    const canNotAddToMap = addedToMap && layerViewIsConnected; //conditions that allow ftr table to be added to the map
    return (
        <Box>
            <WidgetActions>
                {toggleMapSelection ? (
                    <CheckBoxGroup>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={highlightOn}
                                    onChange={highlightSelectedHandler}
                                    disabled={!layerViewIsConnected}
                                />
                            }
                            label='Highlight Selected'
                        />
                    </CheckBoxGroup>
                ) : (
                    ''
                )}

                {addedToMap ? (
                    <ActionButton
                        variant='contained'
                        color='secondary'
                        type='button'
                        title='Zoom map to the extent of the datagrid selection'
                        disabled={selectedFeatures == undefined || selectedFeatures.length < 1 || !layerViewIsConnected}
                        onClick={zoomToFeaturesFunc}
                    >
                        Zoom Map to Selection
                    </ActionButton>
                ) : (
                    ''
                )}
                {addToMap ? (
                    <ActionButton
                        variant='contained'
                        color='secondary'
                        type='button'
                        title='Add search results to the map.'
                        disabled={queryFeatureCount < 1 || canNotAddToMap}
                        onClick={addDataToMapClickHandler}
                    >
                        Add Data to Map
                    </ActionButton>
                ) : (
                    ''
                )}
            </WidgetActions>
        </Box>
    );
}

export default DataTableHeader;
