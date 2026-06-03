import React from 'react';
import LayerView from '@arcgis/core/views/layers/LayerView';
import ZoomToAction from '../components/common/ZoomToAction';
import View from '@arcgis/core/views/View';
import Layer from '@arcgis/core/layers/Layer';
import { useSnackbar } from 'notistack';
import promiseUtils from '@arcgis/core/core/promiseUtils';

interface ZoomToProviderProps {
    children: JSX.Element[] | JSX.Element;
}

interface ZoomToContextProps {
    addLayerToMapWithZoomAction: (view: View, layer: Layer) => void;
}

export const ZoomToContext = React.createContext<ZoomToContextProps>({
    addLayerToMapWithZoomAction: () => {
        return;
    },
});

export const ZoomToProvider = ({ children }: ZoomToProviderProps): JSX.Element => {
    const { enqueueSnackbar } = useSnackbar();

    function addLayerToMapWithZoomAction(view: View, layer: Layer) {
        view.whenLayerView(layer)
            .then((lv: LayerView) => {
                const handleError = (error: any) => {
                    if (promiseUtils.isAbortError(error)) {
                        console.error('Error zooming to layer: ', error);
                    } else {
                        console.error('Error zooming to layer: ', error);
                        enqueueSnackbar('Error zooming to layer.', { variant: 'error' });
                    }
                };
                enqueueSnackbar(`Layer ${lv.layer.title} Added to the map.`, {
                    variant: 'info',
                    action: <ZoomToAction layer={layer} view={view} onError={handleError} />,
                });
            })
            .catch((error) => {
                console.error('Error adding layer to the map: ', error);
                enqueueSnackbar('Error adding layer to the map.', { variant: 'error' });
                if (layer) {
                    view.map.remove(layer);
                }
            });
        view.map.add(layer);
    }

    const value = {
        addLayerToMapWithZoomAction,
    };

    return <ZoomToContext.Provider value={value}>{children}</ZoomToContext.Provider>;
};
