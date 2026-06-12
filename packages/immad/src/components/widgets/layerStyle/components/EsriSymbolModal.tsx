import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';

import { DialogContent, DialogTitle, Grid, MenuItem, Select, Tooltip } from '@mui/material';

import { StyledButton48pxSquare, StyledImageIconDiv, StyledImgDiv32pX } from '../styles';
import { useAppDispatch, useAppSelector } from '../../../../hooks/hooks';
import {
    fetchStylesData,
    setPortalStyleItems2d,
    setPortalStyleItems3d,
    setSelectedWebStyleType,
} from '../WebStylesSlice';
import { getGroupContentByGroupId } from '../../../../helpers/portalGroupHelper';
import { getPortalItemData } from '../../../../helpers/portalItemsHelper';
import { InputLabel } from '../../../common';
import { StyledFieldGroupSelect } from '../../../administrator/styles';
import centeredCube from '../../../../images/24px/centeredCube.png';
import centeredCone from '../../../../images/24px/centeredCone.png';
import centeredSphere from '../../../../images/24px/centeredSphere.png';
import diamondCentered from '../../../../images/24px/diamondCentered.png';
import invertedCone from '../../../../images/24px/invertedCone.png';
import standingCylinder from '../../../../images/24px/standingCylinder.png';
import tetrahedron from '../../../../images/24px/tetrahedron.png';
import { StyledDialogActions, StyledWidgetModalDialog } from '../../../menuBar/styles';
import { RightButton } from '../../../layout/styles';

/**
 * Props to populate and sync the modal with the calling object.
 */
interface EsriSymbolModalProps {
    open: boolean;
    onClose: (selectedSymbol: EsriSymbol | null) => void;
    markerType: string;
    selectedWebStyleType: string;
    layerGeometryType?: string;
}

/**
 * Value label for each type of symbols for the user to select from.
 * The label is the human readable while the value is the key
 */
interface SymbolSetType {
    value: string;
    label: string;
}

/**
 * Esri Symbol interface for basic Web Styles and Default portal styles.
 */
export interface EsriSymbol {
    type: string;
    label: string;
    icon: React.ReactNode;
    name: string;
    href: string;
    styleUrl: string;
    webStyleSymbol: string;
    thumbnailUrl: string;
}
const EsriSymbolModal: React.FC<EsriSymbolModalProps> = (props) => {
    const { open, onClose, markerType, layerGeometryType } = props;
    const dispatch = useAppDispatch();
    const { stylesGroupDataGuid, twoDStylesGroupDataGuid, portalStyleItems2d, portalStyleItems3d } = useAppSelector(
        (state) => state.webStylesSlice
    );
    const AppConfig = useAppSelector((state) => state.applicationSlice);
    const [selectedWebstyleType, setSelectedWebstyleType] = useState<string>(props.selectedWebStyleType);
    const [selectedSymbol, setSelectedSymbol] = useState<EsriSymbol | null>(null);
    const [symbolTypes, setSymbolTypes] = useState<SymbolSetType[]>([]);
    const [enableSelectButton, setEnableSelectButton] = useState<boolean>(true);
    const [symbolData, setSymbolData] = useState<Record<string, EsriSymbol[]> | null>();
    const symbolItemType = (() => {
        const normalizedGeometryType = layerGeometryType?.toLowerCase();
        if (normalizedGeometryType === 'polygon' || normalizedGeometryType === 'extent') {
            return 'polygonSymbol';
        }
        if (normalizedGeometryType === 'polyline' || normalizedGeometryType === 'line') {
            return 'lineSymbol';
        }
        return 'pointSymbol';
    })();
    const Basic3D = {
        Basic3D: [
            {
                type: 'primitiveCone',
                label: 'Cone',
                icon: <StyledImgDiv32pX src={centeredCone} alt={'test'} />,
                name: 'cone',
                href: '',
                styleUrl: '',
                webStyleSymbol: 'symbol',
                thumbnailUrl: centeredCone,
            },
            {
                type: 'primitiveInvertedCone',
                label: 'InvertedCone',
                icon: <StyledImgDiv32pX src={invertedCone} alt={'test'} />,
                name: 'inverted-cone',
                href: '',
                styleUrl: '',
                webStyleSymbol: 'symbol',
                thumbnailUrl: invertedCone,
            },
            {
                type: 'primitiveCube',
                label: 'Cube',
                icon: <StyledImgDiv32pX src={centeredCube} alt={'test'} />,
                name: 'cube',
                href: '',
                styleUrl: '',
                webStyleSymbol: 'symbol',
                thumbnailUrl: centeredCube,
            },
            {
                type: 'primitiveSphere',
                label: 'Sphere',
                icon: <StyledImgDiv32pX src={centeredSphere} alt={'test'} />,
                name: 'sphere',
                href: '',
                styleUrl: '',
                webStyleSymbol: 'symbol',
                thumbnailUrl: centeredSphere,
            },
            {
                type: 'primitiveDiamond',
                label: 'Diamond',
                icon: <StyledImgDiv32pX src={diamondCentered} alt={'test'} />,
                name: 'diamond',
                href: '',
                styleUrl: '',
                webStyleSymbol: 'symbol',
                thumbnailUrl: diamondCentered,
            },
            {
                type: 'primitiveCylinder',
                label: 'Cylinder',
                icon: <StyledImgDiv32pX src={standingCylinder} alt={'test'} />,
                name: 'cylinder',
                href: '',
                styleUrl: '',
                webStyleSymbol: 'symbol',
                thumbnailUrl: standingCylinder,
            },
            {
                type: 'primitiveTetrahedron',
                label: 'Tetrahedron',
                icon: <StyledImgDiv32pX src={tetrahedron} alt={'test'} />,
                name: 'tetrahedron',
                href: '',
                styleUrl: '',
                webStyleSymbol: 'symbol',
                thumbnailUrl: tetrahedron,
            },
        ],
    };

    useEffect(() => {
        setSymbolData(symbolItemType === 'pointSymbol' ? Basic3D : {});
    }, [symbolItemType]);

    useEffect(() => {
        // to help speed up initial IMMAD loading dispatch async thunk when the component mounts
        if (!portalStyleItems2d?.length || !portalStyleItems3d?.length) {
            dispatch(fetchStylesData());
        }
    }, [dispatch]);

    useEffect(() => {
        if (stylesGroupDataGuid && twoDStylesGroupDataGuid) {
            setSymbolStylesInState(twoDStylesGroupDataGuid, stylesGroupDataGuid);
        }
    }, [stylesGroupDataGuid, twoDStylesGroupDataGuid]);

    useEffect(() => {
        // Filter symbols when portal items are available
        if (portalStyleItems2d && portalStyleItems3d) {
            filterStylesToSymbols();
        }
    }, [portalStyleItems2d, portalStyleItems3d]);

    useEffect(() => {
        // when switching between 2d and 3d clear out symbol data
        if (markerType) {
            setSymbolData(symbolItemType === 'pointSymbol' ? Basic3D : {});
        }
    }, [markerType, symbolItemType]);

    /**
     * this function is to filter the style objects into symbols.
     *  used useCallback here as this only needs to run if the entire component is rerendered.
     */
    const filterStylesToSymbols = useCallback(async () => {
        const isPointLayer = symbolItemType === 'pointSymbol';
        // The dropdown for the currently-selected markerType. Basic3D is only relevant for 3D points.
        const types: SymbolSetType[] =
            markerType === '3d' && isPointLayer ? [{ value: 'Basic3D', label: 'Basic' }] : [];

        // The 2D vs 3D distinction is determined PER-SYMBOL via each style item's
        // `dimensionality` field (see setSymbolDataByTypes), NOT by which portal group the
        // item came from or by its item-level typeKeywords (e.g. `web2d`). Custom web styles
        // published from ArcGIS Pro frequently carry keywords that don't match the simple
        // 2D/3D bucketing, which previously caused them to be mis-categorized or dropped.
        // We therefore consider items from both groups and let the per-symbol filter decide.
        const combinedItems = [...(portalStyleItems2d ?? []), ...(portalStyleItems3d ?? [])];
        const seenItemIds = new Set<string>();

        for (const item of combinedItems) {
            if (!item || seenItemIds.has(item.id)) {
                continue;
            }
            seenItemIds.add(item.id);
            if (item.title?.toLowerCase() === 'pins') {
                continue;
            }
            const matchedSymbolCount = await setSymbolDataByTypes(item);
            if (matchedSymbolCount > 0) {
                const type = { value: item.title, label: item.title };
                if (!types.some((existing) => existing.value === type.value)) {
                    types.push(type);
                }
            }
        }
        setSymbolTypes(types);
    }, [portalStyleItems2d, portalStyleItems3d, markerType, symbolItemType]);

    /**
     * This function will set the symbol data by types.
     * This also accounts for the default symbols generated by portal and both
     * 2D and 3D published web styles.
     * @param item
     */
    async function setSymbolDataByTypes(item: any): Promise<number> {
        if (item) {
            if (item.title?.toLowerCase() === 'pins') {
                return 0;
            }
            const results = await getPortalItemData(item.id); //.then((results) => {
            const portalItems = Array.from(new Set(results?.items ?? []));
            const updatedKey = item.title;

            const matchesMarkerDimensionality = (symbol: any): boolean => {
                const dimensionality = (symbol?.dimensionality ?? '').toString().toLowerCase();
                // Esri web styles describe 2D symbols as 'flat' and 3D symbols as 'volumetric'.
                // Some styles may instead use '2d'/'3d' directly. Map both conventions to the
                // marker toggle. If a symbol omits dimensionality, include it rather than
                // silently dropping it (e.g. older/custom Pro styles).
                if (dimensionality === '') {
                    return true;
                }
                if (markerType.toLowerCase() === '2d') {
                    return dimensionality === 'flat' || dimensionality === '2d';
                }
                return dimensionality === 'volumetric' || dimensionality === '3d';
            };

            const stratcomSymbolsMore = portalItems
                ?.map((symbol: any) => {
                    if (symbol.itemType === symbolItemType && matchesMarkerDimensionality(symbol)) {
                        // if there is a spaces in the name this fixes the href issue of not loading it properly
                        const thumbnailHref = symbol.thumbnail.href.replace(/ /g, '%20').replace(/^\.\//, '/');
                        const updatedSymbolHref = thumbnailHref.startsWith('http')
                            ? thumbnailHref
                            : AppConfig.portalUrl + '/sharing/rest/content/items/' + item.id + thumbnailHref;

                        if (item.title.toLowerCase() === 'shapes') {
                            return {
                                type: symbol.name,
                                label: symbol.title,
                                icon: (
                                    <StyledImageIconDiv
                                        style={{
                                            filter: 'brightness(0) invert(1)',
                                            backgroundImage: `url(${updatedSymbolHref})`,
                                        }}
                                    />
                                ),
                                name: symbol.name,
                                href:
                                    AppConfig.portalUrl +
                                    '/sharing/rest/content/items/' +
                                    item.id +
                                    '/resources/styles/gltf/resource/' +
                                    symbol.name +
                                    '.glb',
                                styleUrl: AppConfig.portalUrl + '/sharing/rest/content/items/' + item.id + '/data',
                                webStyleSymbol: symbol,
                                thumbnailUrl: updatedSymbolHref,
                            };
                        } else {
                            return {
                                type: symbol.name,
                                label: symbol.title,
                                icon: (
                                    <StyledImageIconDiv
                                        style={{
                                            backgroundImage: `url(${updatedSymbolHref})`,
                                        }}
                                    />
                                ),
                                name: symbol.name,
                                href:
                                    AppConfig.portalUrl +
                                    '/sharing/rest/content/items/' +
                                    item.id +
                                    '/resources/styles/gltf/resource/' +
                                    symbol.name +
                                    '.glb',
                                styleUrl: AppConfig.portalUrl + '/sharing/rest/content/items/' + item.id + '/data',
                                webStyleSymbol: symbol,
                                thumbnailUrl: updatedSymbolHref,
                            };
                        }
                    } else {
                        return null;
                    }
                })
                .filter(Boolean);

            if (stratcomSymbolsMore && stratcomSymbolsMore.length > 0) {
                setSymbolData((prevSymbolData) => ({
                    ...prevSymbolData,
                    [updatedKey]: stratcomSymbolsMore,
                }));
            }
            return stratcomSymbolsMore?.length ?? 0;
        }
        return 0;
    }

    /**
     * This will take the groupId's for both the 2D web style group and the
     * 3D web style group and set them in application state
     * @param groupId2d Group ID for 2D web style group
     * @param groupId3d Group ID for 3D web style group
     */
    const setSymbolStylesInState = async (groupId2d: string, groupId3d: string): Promise<void> => {
        const items2d = await getGroupContentByGroupId(groupId2d);
        const items3d = await getGroupContentByGroupId(groupId3d);
        if (items2d) {
            dispatch(setPortalStyleItems2d(items2d));
        }
        if (items3d) {
            dispatch(setPortalStyleItems3d(items3d));
        }
    };

    /**
     * Handle the type change in the select
     * @param event
     */
    const handleTypeChange = (event: any) => {
        const theSelectedTypeValue = event.target.value as string;
        setSelectedSymbol(null); // Reset selected symbol when type changes
        setSelectedWebstyleType(theSelectedTypeValue);
        dispatch(setSelectedWebStyleType(theSelectedTypeValue));
        setEnableSelectButton(true);
    };

    /**
     * Handle symbol click in dialog
     * @param symbol
     */
    const handleSymbolClick = (symbol: EsriSymbol) => {
        setSelectedSymbol(symbol);
        setEnableSelectButton(false);
    };

    /**
     * handle select button clicked.
     */
    const handleSelectClick = () => {
        onClose(selectedSymbol);
    };

    /**
     * Handle onClose event of the Dialog.
     * Reason in the dialog helps to make the user select a button, with out it they can click outside of the
     * dialog and it will cancel the dialog.
     * @param event Standard on close event
     * @param reason MUI has a backdrop or escapekeyDown built in
     */
    const handleOnClose = (event: ChangeEvent<HTMLInputElement>, reason: string) => {
        // check if it was clickedoutside this will prevent cancel by clicking outside the modal.
        if (reason !== 'backdropClick') {
            onClose(null);
        }
    };

    return (
        <StyledWidgetModalDialog open={open} onClose={handleOnClose}>
            <DialogTitle>Esri Symbol Selector</DialogTitle>
            <DialogContent>
                <StyledFieldGroupSelect>
                    <InputLabel id='region-name-select-label' className='form-label'>
                        Select Symbol Type
                    </InputLabel>
                    <Select value={selectedWebstyleType} onChange={handleTypeChange} fullWidth>
                        {symbolTypes?.map((symbolType) => (
                            <MenuItem key={symbolType.value} value={symbolType.value}>
                                {symbolType.label}
                            </MenuItem>
                        ))}
                    </Select>
                </StyledFieldGroupSelect>

                {selectedWebstyleType && symbolData && symbolData[selectedWebstyleType] ? (
                    <Grid container spacing={2} mt={2}>
                        {symbolData[selectedWebstyleType].map((symbol) => (
                            <Grid item key={symbol.type}>
                                <Tooltip title={symbol.label} arrow>
                                    <StyledButton48pxSquare
                                        onClick={() => handleSymbolClick(symbol)}
                                        variant={selectedSymbol?.type === symbol?.type ? 'contained' : 'outlined'}
                                    >
                                        {symbol.icon}
                                    </StyledButton48pxSquare>
                                </Tooltip>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <p>Loading Symbols...</p>
                )}
            </DialogContent>
            <StyledDialogActions>
                <RightButton variant='contained' color='primary' onClick={() => onClose(null)}>
                    Cancel
                </RightButton>
                <RightButton
                    variant='contained'
                    color='secondary'
                    onClick={handleSelectClick}
                    disabled={enableSelectButton}
                >
                    Select
                </RightButton>
            </StyledDialogActions>
        </StyledWidgetModalDialog>
    );
};
export default EsriSymbolModal;
