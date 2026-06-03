import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import {
    Box,
    Button,
    DialogContent,
    DialogTitle,
    Fade,
    IconButton,
    InputAdornment,
    MenuItem,
    Select,
    Tooltip,
} from '@mui/material';
import XIcon from 'calcite-ui-icons-react/XIcon';
import { FieldGroup, InputField } from '../../../common';
import { StyledInputLabel, URLContainer, WidgetModalDialog } from '../styles';
import { StyledButton, StyledButtonContainer, StyledFlexContainer } from '../../../layout/styles';
import BviCustomProperties from './BviCustomProperties';
import { BviProperties } from '../../../../interfaces/BviProperties';
import { ConfigHelper } from '../../../../helpers/configHelper';
import { getCapabilities } from '@arcgis/core/layers/ogc/wfsUtils';
import Extent from '@arcgis/core/geometry/Extent';
import { useSnackbar } from 'notistack';
import { bviLineStyle, bviPolygonStyle, bviProps, GeoJsonData } from '../../../../helpers/AddLayerByUrlHelper';
import RefreshIcon from 'calcite-ui-icons-react/RefreshIcon';

import WmsLayerListItems from './wmsLayerListItems';
import Collection from '@arcgis/core/core/Collection';
import WMSLayer from '@arcgis/core/layers/WMSLayer';
import WMSSublayer from '@arcgis/core/layers/support/WMSSublayer';

/**
 * Interface to handle callback and input data coming from
 * where the modal dialog is initialized.
 */
interface UrlInputDialogProps {
    handleClose: (props: {
        url: string;
        title: string;
        bviProps?: bviProps;
        wmsSubLayers?: __esri.Collection<__esri.WMSSublayer>;
    }) => void;
    handleCancel: (url: string) => void;
    url: string;
    open: boolean;
    type: string;
}

/**
 * Provides information about an individual feature type, or layer, found in the WFS service
 */
interface WFSFeatureType {
    typeName: string;
    name: string;
    title: string;
    description: string;
    extent?: Extent;
    namespacePrefix: string;
    namespaceUri: string;
    supportedSpatialReferences?: number[];
}

/**
 * Modal Dialog for getting a URL input from the user.
 * @param props UrlInputDialogProps
 * @constructor
 */
export default function UrlInputDialog(props: UrlInputDialogProps): JSX.Element {
    const { handleClose, handleCancel, open, type } = props;

    const appConfig = ConfigHelper.getAppConfig();
    const queryTypes = appConfig.dataFeed.queryTypes;
    const [url, setUrl] = useState(props.url);
    const [errorHelperText, setErrorHelperText] = useState<string>('');
    const [hasError, setHasError] = useState<boolean>(false);
    const [hasValidUrl, setHasValidUrl] = useState<boolean>(false);
    const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
    const [urlType, setUrlType] = useState<string>('service');
    const [layerTitle, setLayerTitle] = useState('GeoJSON_Layer');
    const [titleHidden, setTitleHidden] = useState<boolean>(true);

    const [bviFieldsHidden, setBviFieldsHidden] = useState<boolean>(true);
    const [bviProperties, setBviProperties] = useState<BviProperties>();
    const [bviQueryType, setBviQueryType] = useState<string>(queryTypes[0].url);
    const bviTimeInfo = useRef<__esri.TimeInfo | undefined>();
    const bviGeoJsonData = useRef<GeoJsonData[] | undefined>();
    const bviLineStyle = useRef<bviLineStyle | undefined>();
    const bviPolygonStyle = useRef<bviPolygonStyle | undefined>();

    const [isWFS, setIsWFS] = useState(false);
    const [isWMS, setIsWMS] = useState(false);
    const [featureTypes, setFeatureTypes] = useState<WFSFeatureType[]>([]);
    const [featureTypeName, setFeatureTypeName] = useState<string>('');
    const [wmsSublayers, setWmsSublayers] = useState<__esri.Collection<__esri.WMSSublayer>>(new Collection());
    const selectedWmsSublayers = useRef<Collection<WMSSublayer>>(new Collection());

    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        if (url) {
            setUrl(url);
        }
        setIsInitialLoad(true);
    }, []);

    useEffect(() => {
        if (open) {
            setUrlType(type);
        }
    }, [open]);

    useEffect(() => {
        if (urlType === 'bvi') {
            if (isInitialLoad) {
                setIsInitialLoad(false);
            }
            setUrl(bviQueryType.trim());
            bviTimeInfo.current = undefined;
            queryTypes.map((query) => {
                if (query.url === bviQueryType) {
                    bviTimeInfo.current = query.timeInfo;
                }
            });
        }
        bviTimeInfo.current = undefined;
        bviGeoJsonData.current = undefined;
        queryTypes.map((query) => {
            if (query.url === bviQueryType) {
                bviTimeInfo.current = query.timeInfo;
                bviGeoJsonData.current = query.geoJsonData;
                bviLineStyle.current = query.lineStyle;
                bviPolygonStyle.current = query.polygonStyle;
            }
        });
    }, [bviQueryType]);

    useEffect(() => {
        switch (urlType) {
            case 'service':
                if (url === bviQueryType) {
                    setIsInitialLoad(true);
                    setUrl('');
                }
                setTitleHidden(true);
                setBviFieldsHidden(true);
                setIsWFS(false);
                setIsWMS(false);
                break;
            case 'geojson':
                if (url === bviQueryType) {
                    setIsInitialLoad(true);
                    setUrl('');
                }
                setLayerTitle('GeoJSON_Layer');
                setTitleHidden(false);
                setBviFieldsHidden(true);
                setIsWFS(false);
                setIsWMS(false);
                break;
            case 'bvi':
                setLayerTitle('BVI_Layer');
                if (isInitialLoad) {
                    setIsInitialLoad(false);
                }
                setUrl(bviQueryType.trim());
                setTitleHidden(false);
                setBviFieldsHidden(false);
                setIsWFS(false);
                setIsWMS(false);
                break;
            case 'wfs':
                setTitleHidden(true);
                setBviFieldsHidden(true);
                setIsWFS(true);
                setIsWMS(false);
                if (isInitialLoad) {
                    setIsInitialLoad(false);
                }
                break;
            case 'wms':
                setTitleHidden(true);
                setBviFieldsHidden(true);
                setIsWMS(true);
                setIsWFS(false);
                if (isInitialLoad) {
                    setIsInitialLoad(false);
                }
                break;
            default:
                setTitleHidden(true);
                setBviFieldsHidden(true);
                setIsWFS(false);
                break;
        }
    }, [urlType]);

    useEffect(() => {
        if (url && isWFS) {
            const validUrl = isUrl(url);
            setHasValidUrl(validUrl);

            if (validUrl) {
                const timeoutId = setTimeout(() => {
                    handleGetCapabilities();
                }, 500);
                return () => clearTimeout(timeoutId);
            }
        }
    }, [url, isWFS]);

    /**
     *  When the url changes create the list of sublayers.
     */
    useEffect(() => {
        if (url && isWMS) {
            const validUrl = isUrl(url);
            setHasValidUrl(validUrl);

            if (validUrl) {
                const timeoutId = setTimeout(() => {
                    handleGetWmsSublayers();
                }, 500);
                return () => clearTimeout(timeoutId);
            }
        }
    }, [url, isWMS]);

    useEffect(() => {
        if (!hasValidUrl && url.length > 4) {
            setErrorHelperText('Invalid URL');
            setHasError(true);
        } else {
            setErrorHelperText('');
            setHasError(false);
        }
    }, [hasValidUrl]);

    useEffect(() => {
        if (featureTypes.length) {
            setFeatureTypeName(featureTypes[0].name);
        }
    }, [featureTypes]);

    const handleLoadClicked = () => {
        if (urlType === 'bvi') {
            const bviProps = {
                bviCustomProperties: bviProperties,
                bviTimeInfo: bviTimeInfo.current,
                bviGeoJsonData: bviGeoJsonData.current,
                bviPolygonStyle: bviPolygonStyle.current,
                bviLineStyle: bviLineStyle.current,
            };
            handleClose({ url: url, title: layerTitle, bviProps: bviProps });
        } else if (urlType === 'wfs') {
            handleClose({ url: url, title: featureTypeName });
        } else if (urlType === 'wms') {
            handleClose({ url: url, title: layerTitle, wmsSubLayers: selectedWmsSublayers.current });
        } else {
            handleClose({ url: url, title: layerTitle });
        }
    };

    const handleUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (isInitialLoad) {
            setIsInitialLoad(false);
        }
        setUrl(event.target.value.trim());
    };

    const handleClearUrl = () => {
        setUrl('');
    };

    const handleLayerTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setLayerTitle(event.target.value.trim());
    };

    const handleClearLayerTitle = () => {
        setLayerTitle('');
    };

    const handleCancelClick = () => {
        handleClearUrl();
        handleCancel('');
    };

    const handleGetCapabilities = async () => {
        try {
            const capabilities = await getCapabilities(url);

            if (capabilities.featureTypes.length) {
                setFeatureTypes(capabilities.featureTypes);
            } else {
                enqueueSnackbar('The WFS Feature Types could not be determined from the URL', { variant: 'warning' });
                setFeatureTypes([]);
            }
        } catch (error) {
            enqueueSnackbar('The WFS Feature Types could not be determined from the URL', { variant: 'warning' });
            setFeatureTypes([]);
        }
    };

    /**
     * Creates a list of sublayers the WMS layer contains. This list is used to create
     * the tree nodes displayed.
     */
    const handleGetWmsSublayers = async () => {
        //Call to get the WMS layer sublayers to populate the WMS layer select
        try {
            const layer = new WMSLayer({
                url: url,
            });
            await layer.load().then(() => {
                const subLayerList = new Collection();
                const allSublayers = layer.allSublayers.toArray();
                for (const subLayer of allSublayers) {
                    if (subLayer.title !== layer.title) {
                        subLayerList.add(subLayer);
                    }
                }
                setWmsSublayers(subLayerList);
            });
        } catch (error) {
            enqueueSnackbar('Unable to add layer to map', { variant: 'error' });
            console.error(error);
        }
    };

    const handleFeatureTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
        setFeatureTypeName(event.target.value as string);
    };

    /**
     * Handle selection of sublayers.
     * @param selectedWmsSubLayers
     */
    const handleSelectedWmsSubLayersChanged = (selectedWmsSubLayers: Collection<string>) => {
        const newSelectedWmsSubLayers = new Collection();
        const wmsItemsArray = wmsSublayers.toArray();
        for (const wmsSubLayer of wmsItemsArray) {
            if (selectedWmsSubLayers.includes(wmsSubLayer.title)) {
                newSelectedWmsSubLayers.add(wmsSubLayer);
            }
        }
        selectedWmsSublayers.current = newSelectedWmsSubLayers;
    };

    function isUrl(strValue: string) {
        try {
            // TODO: https:// passes initial validation
            new URL(strValue);
            return true;
        } catch {
            setHasValidUrl(false);
            return false;
        }
    }

    return (
        <WidgetModalDialog open={open} disableBackdropClick aria-labelledby='form-dialog-title'>
            <Fade in={open} timeout={100}>
                <div>
                    <DialogTitle id='form-dialog-title'>Add Layer by URL </DialogTitle>
                    <DialogContent>
                        <FieldGroup>
                            <Box hidden={titleHidden}>
                                <InputField
                                    helperText='Layer Title'
                                    variant='outlined'
                                    placeholder='Layer Title'
                                    fullWidth
                                    size='small'
                                    color='secondary'
                                    value={layerTitle}
                                    onChange={handleLayerTitleChange}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position='end'>
                                                <IconButton
                                                    onClick={handleClearLayerTitle}
                                                    disabled={layerTitle.length === 0}
                                                >
                                                    <XIcon size={16} />
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Box>
                        </FieldGroup>
                        <FieldGroup>
                            <Box hidden={bviFieldsHidden}>
                                <Select
                                    variant='outlined'
                                    color='secondary'
                                    title='Query Type'
                                    onChange={(evt) => {
                                        setBviQueryType(evt.target.value as string);
                                    }}
                                    value={bviQueryType}
                                >
                                    {queryTypes.map((query) => {
                                        return (
                                            <MenuItem key={query.url} value={query.url}>
                                                <div dangerouslySetInnerHTML={{ __html: query.name }} />
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </Box>
                        </FieldGroup>
                        <URLContainer>
                            <InputField
                                variant='outlined'
                                placeholder='URL to load'
                                fullWidth
                                size='small'
                                color='secondary'
                                value={url}
                                onChange={handleUrlChange}
                                error={hasError}
                                helperText={errorHelperText}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position='end'>
                                            <IconButton onClick={handleClearUrl} disabled={url.length === 0}>
                                                <XIcon size={16} />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            {isWFS && (
                                <Tooltip title='Refresh' placement='top'>
                                    <Button
                                        variant='contained'
                                        disabled={!hasValidUrl || featureTypes.length === 0}
                                        size='medium'
                                        color='secondary'
                                        onClick={handleGetCapabilities}
                                    >
                                        <RefreshIcon />
                                    </Button>
                                </Tooltip>
                            )}
                            {isWMS && (
                                <Tooltip title='Refresh' placement='top'>
                                    <Button
                                        variant='contained'
                                        disabled={!hasValidUrl}
                                        size='medium'
                                        color='secondary'
                                        onClick={handleGetWmsSublayers}
                                    >
                                        <RefreshIcon />
                                    </Button>
                                </Tooltip>
                            )}
                        </URLContainer>
                        <FieldGroup>
                            <Box hidden={!isWMS}>
                                <WmsLayerListItems
                                    onListChange={(selectedLayers: Collection<string>) => {
                                        handleSelectedWmsSubLayersChanged(selectedLayers);
                                    }}
                                    layerList={wmsSublayers}
                                ></WmsLayerListItems>
                            </Box>

                            <Box hidden={!isWFS || featureTypes.length === 0}>
                                <StyledFlexContainer>
                                    <StyledInputLabel>Feature Types:</StyledInputLabel>
                                    <Select
                                        autoWidth={true}
                                        color='secondary'
                                        displayEmpty={true}
                                        title='Feature Type'
                                        value={featureTypeName}
                                        variant='outlined'
                                        onChange={handleFeatureTypeChange}
                                    >
                                        <MenuItem disabled value=''>
                                            Feature Type
                                        </MenuItem>
                                        {featureTypes.map((feature) => {
                                            return (
                                                <MenuItem key={feature.name} value={feature.name}>
                                                    <div dangerouslySetInnerHTML={{ __html: feature.title }} />
                                                </MenuItem>
                                            );
                                        })}
                                    </Select>
                                </StyledFlexContainer>
                            </Box>
                        </FieldGroup>
                        <FieldGroup>
                            <Box hidden={bviFieldsHidden}>
                                <BviCustomProperties handleUpdate={setBviProperties}></BviCustomProperties>
                            </Box>
                        </FieldGroup>
                    </DialogContent>
                    <StyledButtonContainer>
                        <StyledButton variant='contained' color='primary' onClick={handleCancelClick}>
                            Cancel
                        </StyledButton>
                        <StyledButton
                            variant='contained'
                            color='secondary'
                            disabled={hasError || isInitialLoad}
                            onClick={handleLoadClicked}
                        >
                            Load
                        </StyledButton>
                    </StyledButtonContainer>
                </div>
            </Fade>
        </WidgetModalDialog>
    );
}
