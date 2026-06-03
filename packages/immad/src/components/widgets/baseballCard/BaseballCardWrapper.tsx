import React, { useContext, useEffect, useState } from 'react';

//styles
import { StyledBaseballCardWrapperDiv } from './styles';

//contexts
import { MapContext } from '../../../contexts/Map';
import { FeatureSelectionContext } from '../../../contexts/FeatureSelectionContext';

//helpers
import { BaseballCardWidgetLib } from '@stratcom/react-widget-lib/src/component/BaseballCardWidgetLib';
import { RootState } from '../../../data/store';
import { useSelector } from 'react-redux';

const BaseballCardWrapper = (): JSX.Element => {
    const { activeView, mapView, sceneView, getMapView, getSceneView } = useContext(MapContext);
    const panningSpeed = useSelector((state: RootState) => state.applicationSlice.panningSpeed);
    const zoomScale = useSelector((state: RootState) => state.applicationSlice.tacticalGrid.zoomViewScale);
    const { selectionLayer, featureSelection, clearSelection } = useContext(FeatureSelectionContext);
    const [selectedLayer, setSelectedLayer] = useState<__esri.Layer | undefined>();
    const [selectedFeatures, setSelectedFeatures] = useState<number[]>([]);
    const flashGraphicColor = useSelector((state: RootState) => state.applicationSlice.flashGraphicColor);

    useEffect(() => {
        setSelectedLayer(selectionLayer);
    }, [selectionLayer]);

    useEffect(() => {
        setSelectedFeatures(featureSelection);
    }, [featureSelection]);

    /**
     * Callback passed to the baseball card widget to enable clearing the selected/highlighted features
     */
    function clearSelectedFeatures() {
        clearSelection();
    }

    return (
        <>
            <StyledBaseballCardWrapperDiv>
                <BaseballCardWidgetLib
                    activeView={activeView}
                    mapView={mapView}
                    sceneView={sceneView}
                    getMapView={getMapView}
                    getSceneView={getSceneView}
                    panningSpeed={panningSpeed}
                    zoomScale={zoomScale}
                    selectedLayer={selectedLayer}
                    selectedFeatures={selectedFeatures}
                    clearSelectedFeaturesCallback={clearSelectedFeatures}
                    flashGraphicColor={flashGraphicColor}
                />
            </StyledBaseballCardWrapperDiv>
        </>
    );
};

export default BaseballCardWrapper;