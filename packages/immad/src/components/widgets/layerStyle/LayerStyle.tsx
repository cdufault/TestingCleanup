// React imports
import React, { useContext, useEffect, useState } from 'react';
import {
    ActionButton,
    InputGroup,
    InputLabel,
    WidgetActions,
    WidgetContainer,
    WidgetContent,
    WidgetHeader,
} from '../../common';

import LayerSelect from '../../common/layerSelect';
import PointGraphics from './components/PointGraphics';
import PolygonGraphics from './components/PolygonGraphics';
import LineGraphics from './components/LineGraphics';
import { MapContext } from '../../../contexts/Map';
import { SimpleRenderer } from '@arcgis/core/renderers';
import Renderer from '@arcgis/core/renderers/Renderer';
import FeatureLayer = __esri.FeatureLayer;

import StreamLayer = __esri.StreamLayer;
import SceneLayer = __esri.SceneLayer;
import WFSLayer = __esri.WFSLayer;
import GeoJSONLayer = __esri.GeoJSONLayer;
import { useSnackbar } from 'notistack';
import { useAppSelector } from '../../../hooks/hooks';

const LayerStyle = (): JSX.Element => {
    type StylableLayer = FeatureLayer | GeoJSONLayer | WFSLayer | SceneLayer | StreamLayer;
    const { enqueueSnackbar } = useSnackbar();
    const styleSelectionType = useAppSelector((state) => state.webStylesSlice.styleSelectionType);
    const [selectedLayer, setSelectedLayer] = useState<StylableLayer | undefined>();
    const [geomType, setGeomType] = useState<string | undefined>();
    const [noneActive, setNoneActive] = useState<boolean>(false);
    const [pointActive, setPointActive] = useState<boolean>(false);
    const [lineActive, setLineActive] = useState<boolean>(false);
    const [polygonActive, setPolygonActive] = useState<boolean>(false);
    const [newPointRenderer, setNewPointRenderer] = useState<Renderer>();
    const [newMultiPointRenderer, setNewMultiPointRenderer] = useState<Renderer>();
    const [newPolygonRenderer, setNewPolygonRenderer] = useState<Renderer>();
    const [newLineRenderer, setNewLineRenderer] = useState<Renderer>();
    const [currentViewType, setCurrentViewType] = useState<'SCENE' | 'MAP'>('SCENE');

    const { map, activeView } = useContext(MapContext);

    /*
        The list of types that can be styled by the JSAPI.
     */
    const compatibleTypes = ['feature', 'geojson', 'wfs', 'scene', 'stream'];

    useEffect(() => {
        if (activeView) {
            setCurrentViewType(activeView);
        }
    }, [activeView]);

    //When a layer is selected update the input form for the selected layer type.
    useEffect(() => {
        if (selectedLayer && compatibleTypes.includes(selectedLayer.type)) {
            const stylableLayer = selectedLayer as unknown as StylableLayer;
            const geomType = stylableLayer.geometryType;
            switch (geomType) {
                case 'point':
                    setGeomType('Point');
                    setPointActive(true);
                    setPolygonActive(false);
                    setLineActive(false);
                    setNoneActive(false);
                    break;
                case 'polygon':
                    setGeomType('Polygon');
                    setPointActive(false);
                    setPolygonActive(true);
                    setLineActive(false);
                    setNoneActive(false);
                    break;
                case 'polyline':
                    setGeomType('Line');
                    setPointActive(false);
                    setPolygonActive(false);
                    setLineActive(true);
                    setNoneActive(false);
                    break;
                default:
                    setGeomType(undefined);
                    setPointActive(false);
                    setPolygonActive(false);
                    setLineActive(false);
                    setNoneActive(true);
                    break;
            }
        } else {
            setGeomType(undefined);
            setPointActive(false);
            setPolygonActive(false);
            setLineActive(false);
            setNoneActive(true);
        }
    }, [selectedLayer]);

    /**
     * Handle Apply Graphic will apply the symbol to the layer
     */
    const handleApplyGraphic = async (): Promise<void> => {
        const pointRenderer = styleSelectionType === 'attribute' ? newMultiPointRenderer : newPointRenderer;
        if (currentViewType === 'MAP' && pointRenderer?.symbol?.type.includes('3d')) {
            enqueueSnackbar('3D marker types can not be applied in a 2D map.', { variant: 'warning' });
        }
        if (selectedLayer && map) {
            if (geomType === 'Point' && pointRenderer) {
                selectedLayer.renderer = pointRenderer;
            } else if (geomType === 'Line' && newLineRenderer) {
                selectedLayer.renderer = newLineRenderer;
            } else if (geomType === 'Polygon' && newPolygonRenderer) {
                selectedLayer.renderer = newPolygonRenderer;
            }
        }
    };

    /**
     * Handle layer select change
     * @param layer layer selected
     */
    const handleLayerSelectChange = async (layer: any): Promise<void> => {
        setNoneActive(false);
        setSelectedLayer(layer as StylableLayer);
    };

    return (
        <WidgetContainer>
            <React.Fragment>
                <WidgetHeader position='static'>
                    <InputGroup>
                        <LayerSelect
                            map={map}
                            required={false}
                            title='Filter Layer'
                            onChange={handleLayerSelectChange}
                            layerTypeFilter={(lyr): boolean => {
                                return compatibleTypes.includes(lyr.type);
                            }}
                            includeSublayersAsFeatureLayers={false}
                        />
                    </InputGroup>
                </WidgetHeader>
            </React.Fragment>
            <React.Fragment>
                <WidgetContent elevation={0}>
                    {pointActive && selectedLayer ? (
                        <PointGraphics
                            layer={selectedLayer}
                            originalRenderer={selectedLayer.renderer as SimpleRenderer}
                            onChange={(newRenderer) => {
                                if (styleSelectionType === 'location') {
                                    setNewPointRenderer(newRenderer);
                                } else {
                                    setNewMultiPointRenderer(newRenderer);
                                }
                            }}
                        />
                    ) : (
                        ''
                    )}
                    {polygonActive && selectedLayer ? (
                        <PolygonGraphics
                            originalRenderer={selectedLayer.renderer}
                            layer={selectedLayer}
                            onChange={(newRenderer) => {
                                setNewPolygonRenderer(newRenderer);
                            }}
                        />
                    ) : (
                        ''
                    )}
                    {lineActive && selectedLayer ? (
                        <LineGraphics
                            originalRenderer={selectedLayer.renderer}
                            layer={selectedLayer}
                            onChange={(newRenderer) => {
                                setNewLineRenderer(newRenderer);
                            }}
                        />
                    ) : (
                        ''
                    )}
                    {selectedLayer && noneActive ? <InputLabel>Layer Type Not Supported</InputLabel> : ''}
                </WidgetContent>
            </React.Fragment>
            <React.Fragment>
                <WidgetActions>
                    <ActionButton
                        variant='contained'
                        color='secondary'
                        type='button'
                        title='Apply Graphic'
                        disabled={noneActive}
                        onClick={handleApplyGraphic}
                    >
                        Apply
                    </ActionButton>
                </WidgetActions>
            </React.Fragment>
        </WidgetContainer>
    );
};
export default LayerStyle;
