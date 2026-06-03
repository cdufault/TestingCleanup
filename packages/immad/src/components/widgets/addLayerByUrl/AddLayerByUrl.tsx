// React imports
import { Menu, MenuItem } from '@mui/material';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { LogHelper } from '../../../helpers/logHelper';

// Component imports
import {
    addArcGisService,
    addGeoJson,
    addWFSLayer,
    addWMSLayer,
    bviLineStyle,
    bviPolygonStyle,
    bviProps,
    GeoJsonData,
} from '../../../helpers/AddLayerByUrlHelper';
import UrlInputDialog from './components/UrlInputDialog';
import { useSnackbar } from 'notistack';
import { MapContext } from '../../../contexts/Map';
import { ZoomToContext } from '../../../contexts/ZoomToLayerContext';
import { BviProperties } from '../../../interfaces/BviProperties';
import CaretDownIcon from 'calcite-ui-icons-react/CaretDownIcon';
import { Button } from '@mui/material';
import Collection from '@arcgis/core/core/Collection';
import WMSSubLayer from '@arcgis/core/layers/support/WMSSublayer';

/**
 * DataFeeds widget
 * @constructor
 */
function AddLayerByUrl(): JSX.Element {
    const [openUrlDialog, setOpenUrlDialog] = useState(false);
    const [urlDialogValue, setUrlDialogValue] = useState<string>('');
    const { activeView, getMapView, getSceneView } = useContext(MapContext);
    const { addLayerToMapWithZoomAction } = useContext(ZoomToContext);

    const urlDialogTitle = useRef<string>('');
    const [urlDialogType, setUrlDialogType] = useState<string>('service');
    const urlDialogCustomProperties = useRef<BviProperties>();
    const urlDialogTimeInfo = useRef<__esri.TimeInfo | undefined>();
    const urlDialogGeoJsonData = useRef<GeoJsonData[] | undefined>();
    const bviCustomPolygonStyle = useRef<bviPolygonStyle | undefined>();
    const bviCustomLineStyle = useRef<bviLineStyle | undefined>();
    const wmsSelectedSubLayers = useRef<Collection<WMSSubLayer>>(new Collection());
    const { enqueueSnackbar } = useSnackbar();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);

    const serviceSelectType = [
        { key: 'service', value: 'service', display: 'ArcGIS Service' },
        { key: 'bvi', value: 'bvi', display: 'BVI' },
        { key: 'geojson', value: 'geojson', display: 'GeoJSON' },
        { key: 'wfs', value: 'wfs', display: 'WFS' },
        { key: 'wms', value: 'wms', display: 'WMS' },
    ];

    useEffect(() => {
        if (urlDialogValue.length > 0) {
            urlDialogValueChanged();
        }
    }, [urlDialogValue]);

    const handleDialogClose = (props: {
        url: string;
        title: string;
        bviProps?: bviProps;
        wmsSubLayers?: Collection<WMSSubLayer>;
    }) => {
        urlDialogTitle.current = props.title;
        if (props.wmsSubLayers?.length) {
            wmsSelectedSubLayers.current = props.wmsSubLayers;
        } else {
            wmsSelectedSubLayers.current = new Collection();
        }
        if (props.bviProps?.bviCustomProperties) {
            urlDialogCustomProperties.current = props.bviProps.bviCustomProperties;
        } else {
            urlDialogCustomProperties.current = {};
        }
        if (props.bviProps?.bviTimeInfo) {
            urlDialogTimeInfo.current = props.bviProps.bviTimeInfo;
        } else {
            urlDialogTimeInfo.current = undefined;
        }
        if (props.bviProps?.bviGeoJsonData) {
            urlDialogGeoJsonData.current = props.bviProps.bviGeoJsonData;
        } else {
            urlDialogGeoJsonData.current = undefined;
        }
        if (props.bviProps?.bviPolygonStyle) {
            bviCustomPolygonStyle.current = props.bviProps.bviPolygonStyle;
        } else {
            bviCustomPolygonStyle.current = undefined;
        }
        if (props.bviProps?.bviLineStyle) {
            bviCustomLineStyle.current = props.bviProps.bviLineStyle;
        } else {
            bviCustomLineStyle.current = undefined;
        }
        if (props.url === urlDialogValue) {
            const endSpace = /\s$/;
            //if the user adds the same layer twice in row react does not recognize the change/fire the useEffect
            //this code either adds or removes a space at the end of the url so that react will recognize it as a new value
            if (endSpace.test(props.url)) {
                setUrlDialogValue(props.url.trim());
            } else {
                setUrlDialogValue(props.url + ' ');
            }
        } else {
            setUrlDialogValue(props.url);
        }
        setOpenUrlDialog(false);
    };

    const handleDialogCancel = () => {
        setOpenUrlDialog(false);
    };

    function urlDialogValueChanged() {
        let currentView;
        if (activeView === 'MAP') {
            currentView = getMapView();
        } else {
            currentView = getSceneView();
        }
        if (urlDialogValue !== '' && currentView) {
            switch (urlDialogType) {
                case 'service':
                    // call to verify it is a valid ESRI rest endpoint.
                    addArcGisService({
                        urlDialogValue,
                        currentView,
                        addLayerToMapWithZoomAction,
                        enqueueSnackbar,
                    });
                    break;
                case 'bvi':
                case 'geojson':
                    const bviProperties = {
                        bviCustomProperties: urlDialogCustomProperties.current,
                        bviTimeInfo: urlDialogTimeInfo.current,
                        bviGeoJsonData: urlDialogGeoJsonData.current,
                        bviPolygonStyle: bviCustomPolygonStyle.current,
                        bviLineStyle: bviCustomLineStyle.current,
                    };

                    // call to verify it is a valid URL and get the fields for the popup template.
                    addGeoJson({
                        urlDialogValue: urlDialogValue.trim(),
                        urlDialogTitle: urlDialogTitle.current,
                        currentView: currentView,
                        addLayerToMapWithZoomAction: addLayerToMapWithZoomAction,
                        enqueueSnackbar: enqueueSnackbar,
                        bviProps: bviProperties,
                    });
                    break;
                case 'wfs':
                    addWFSLayer({
                        url: urlDialogValue.trim(),
                        name: urlDialogTitle.current,
                        currentView: currentView,
                        enqueueSnackbar: enqueueSnackbar,
                    });
                    break;
                case 'wms':
                    addWMSLayer({
                        url: urlDialogValue.trim(),
                        name: urlDialogTitle.current,
                        selectedSubLayers: wmsSelectedSubLayers.current,
                        currentView: currentView,
                        enqueueSnackbar: enqueueSnackbar,
                    });
                    break;
            }
        } else if (urlDialogValue !== '') {
            //If we have a url but no view inform the user that the layer could not be loaded.
            enqueueSnackbar('Unable to add layer to map', { variant: 'error' });
            LogHelper.log('Unable to add layer to map', true);
        }
    }

    const handleMenuClick = (event: { currentTarget: React.SetStateAction<HTMLElement | null> }) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleMenuSelection = (event: { currentTarget: { id: React.SetStateAction<string> } }) => {
        setAnchorEl(null);
        setUrlDialogType(event.currentTarget.id);
        setOpenUrlDialog(true);
    };

    return (
        <>
            <Button onClick={handleMenuClick} title='Add layer by URL.' endIcon={<CaretDownIcon size={16} />}>
                Add Layer
            </Button>
            <Menu
                open={openMenu}
                anchorEl={anchorEl}
                getContentAnchorEl={null}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                onClose={handleMenuClose}
            >
                {serviceSelectType.map((choice) => {
                    return (
                        <MenuItem key={choice.key} id={choice.value} onClick={handleMenuSelection}>
                            <div dangerouslySetInnerHTML={{ __html: choice.display }} />
                        </MenuItem>
                    );
                })}
            </Menu>
            <UrlInputDialog
                handleClose={handleDialogClose}
                handleCancel={handleDialogCancel}
                url={urlDialogValue}
                open={openUrlDialog}
                type={urlDialogType}
            />
        </>
    );
}

export default AddLayerByUrl;
