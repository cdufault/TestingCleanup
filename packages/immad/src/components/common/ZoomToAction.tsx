import View from '@arcgis/core/views/View';
import React from 'react';
import { ActionButton } from './index';
import MapView from '@arcgis/core/views/MapView';
import SceneView from '@arcgis/core/views/SceneView';
import Layer from '@arcgis/core/layers/Layer';
import { getLayerFullExtent } from '../../helpers/extentHelper';
import { ConfigHelper } from '../../helpers/configHelper';

/**
 * ActionButton supporting 'Zoom To' operation on a layer and a view.
 * @param props The input properties, a View and a Layer.
 */
export const ZoomToAction = (props: { view: View; layer: Layer; onError: (error: any) => void }): JSX.Element => {
    const { view, layer, onError } = props;
    const appConfig = ConfigHelper.getAppConfig();
    return (
        <React.Fragment>
            <ActionButton
                onClick={() => {
                    if (layer && view) {
                        if (view.type === '2d') {
                            const mapView = view as MapView;
                            const layerFullExtent = getLayerFullExtent(layer, mapView);
                            mapView.goTo(layerFullExtent.extent).catch((error) => {
                                onError(error);
                            });
                        } /* '3d' */ else {
                            const sceneView = view as SceneView;
                            const layerFullExtent = getLayerFullExtent(layer, sceneView);
                            sceneView
                                .goTo(layerFullExtent.extent, { speedFactor: appConfig.panningSpeed })
                                .catch((error) => {
                                    onError(error);
                                });
                        }
                    }
                }}
            >
                ZOOM TO
            </ActionButton>
        </React.Fragment>
    );
};

export default ZoomToAction;
