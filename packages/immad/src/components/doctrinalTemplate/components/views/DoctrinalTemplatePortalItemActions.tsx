import React, { useContext, useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import RasterFunctionTemplate from '../../api/RasterFunctionTemplate';
import { convertRFTToImageryLayer, remapAndTokenizeRFT } from '../../helpers/rasterFunctionTemplateHelper';
import { applyDoctrinalTemplateLayerStyling, defaultUniqueValueRenderer } from '../../helpers/doctrinalTemplateHelper';
import { AppContext } from '../../../../contexts/App';
import ZoomToAction from '../../../common/ZoomToAction';
import LayerView = __esri.LayerView;
import PortalItem = __esri.PortalItem;
import View = __esri.View;
import ImageryLayer = __esri.ImageryLayer;
import { ConfigHelper } from '../../../../helpers/configHelper';

/**
 * Provides properties for the Doctrinal Template item card.
 */
interface DoctrinalTemplatePortalActionItemsProps {
    item?: PortalItem;
    view?: View;
    onEdit: (item: PortalItem) => void;
}

/**
 * A sub component of the PortalItemList component that provides the
 * actions a user can perform on an existing a doctrinal template.
 */
export const DoctrinalTemplatePortalItemActions = (props: DoctrinalTemplatePortalActionItemsProps): JSX.Element => {
    const { item, view, onEdit } = props;

    const appConfig = ConfigHelper.getAppConfig();

    const { portalUser } = useContext(AppContext);

    const [addLayerError, setAddLayerError] = useState<string | null>(null);

    const [hideEdit, setHideEdit] = useState<boolean>(true);

    const [isAdded, setIsAdded] = useState<boolean>(false);

    const [layer, setLayer] = useState<ImageryLayer | null>();

    const { enqueueSnackbar } = useSnackbar();

    const executeEdit = async (portalItem: PortalItem) => {
        if (portalItem.sourceJSON.properties.Template) {
            onEdit(portalItem);
        } else {
            enqueueSnackbar('Cannot edit this doctrinal template.', {
                variant: 'error',
            });
        }
    };

    const executePreview = async (portalItem: PortalItem) => {
        if (layer) {
            view?.map.remove(layer);
            setLayer(null);
        } else {
            try {
                let rft: RasterFunctionTemplate = await portalItem.fetchData('json');
                rft = await remapAndTokenizeRFT(rft);

                const layer = (await convertRFTToImageryLayer(rft)) as ImageryLayer;

                if (portalItem.sourceJSON.properties && portalItem.sourceJSON.properties.Template) {
                    layer.renderer = appConfig?.doctrinalTemplate?.renderer;
                    applyDoctrinalTemplateLayerStyling(layer);
                }

                setLayer(layer);
            } catch (error) {
                console.error(error);
                enqueueSnackbar('Error adding layer to the map.', {
                    variant: 'error',
                });
                setAddLayerError('ERROR');
            }
        }
    };

    const updateEditState = () => {
        if (item && item.sourceJSON.properties?.Template) {
            setHideEdit(false);
        } else {
            setHideEdit(true);
        }
    };

    useEffect(() => {
        updateEditState();
    }, []);

    useEffect(() => {
        updateEditState();
    }, [portalUser]);

    useEffect(() => {
        if (layer) {
            AddImageryLayerToMap(layer);
        } else {
            setIsAdded(false);
        }
        return () => {
            // do not remove layer
        };
    }, [layer, view]);

    const AddImageryLayerToMap = async (layer: ImageryLayer) => {
        if (view) {
            await layer.load();
            layer.renderer = layer.renderer ?? defaultUniqueValueRenderer;
            view.map.add(layer);
            view.whenLayerView(layer)
                .then((lv: LayerView) => {
                    setIsAdded(true);

                    const handleError = (error: any) => {
                        console.error('Error zooming to layer: ' + error);
                        enqueueSnackbar('Error zooming to layer.', { variant: 'error' });
                    };

                    enqueueSnackbar(`Layer ${lv.layer.title} Added`, {
                        variant: 'info',
                        action: <ZoomToAction layer={layer} view={view} onError={handleError} />,
                    });
                })
                .catch((error) => {
                    console.error(error);
                    setAddLayerError('ERROR');
                });
        }
    };

    return (
        <Box width='100%' display='flex' boxSizing='border-box'>
            <Box display={hideEdit ? 'none' : 'block'}>
                <Button
                    color='secondary'
                    variant='contained'
                    title='Edit'
                    onClick={() => {
                        item && executeEdit(item);
                    }}
                >
                    EDIT
                </Button>
            </Box>
            <Box flexGrow={1} />
            <Box>
                <Button
                    color='secondary'
                    disabled={addLayerError !== null}
                    variant={isAdded ? 'outlined' : 'contained'}
                    title='Add the doctrinal template rule set results as a layer to the map display.'
                    onClick={() => {
                        item && executePreview(item);
                    }}
                >
                    {addLayerError ? 'ERROR' : isAdded ? 'REMOVE LAYER' : 'ADD LAYER'}
                </Button>
            </Box>
        </Box>
    );
};

export default DoctrinalTemplatePortalItemActions;
