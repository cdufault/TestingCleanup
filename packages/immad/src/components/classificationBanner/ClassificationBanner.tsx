import { BannerColumn, BannerContainer, ClassificationContainer } from './styles';
import React, { useContext, useEffect, useState } from 'react';
import { ConfigHelper } from '../../helpers/configHelper';
import { Grid } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { RootState } from '../../data/store';
import { ClassificationMarking } from '@stratcom/lib-functions/types/interfaces/Classification';
import {
    getBannerColor,
    getDefaultClassificationMarking,
    getDefaultManualClassification,
    updateClassificationCalculation,
} from '@stratcom/lib-functions';
import {
    addClassificationItem,
    removeClassificationItem,
    resetClassification,
    setClassificationItems,
    setClassificationMarking,
    setHasUnknownClassification,
} from './ClassificationSlice';
import { useSaveLoadContext } from '../../contexts/SaveLoad';
import { MapContext } from '../../contexts/Map';
import { getUserSavedState } from '../layout/helpers/LayoutHelper';
import { ClassificationItem, createClassificationItem } from './interfaces/ClassificationItem';
import { WorkSpaceItem } from '../../interfaces/UserSaveState';
import { getMissionIdByTitle, getWebAppAndData } from '../../helpers/missionHelper';
import Layer from '@arcgis/core/layers/Layer';
import PortalItem from '@arcgis/core/portal/PortalItem';
import CollectionChangeEvent = __esri.CollectionChangeEvent;
import WebScene from '@arcgis/core/WebScene';
import WebMap from '@arcgis/core/WebMap';

export const ClassificationBanner = (): JSX.Element => {
    const dispatch = useAppDispatch();
    const saveLoadContext = useSaveLoadContext();
    const classificationItems = useAppSelector((state: RootState) => state.classificationSlice.classificationItems);
    const hasUnknownClassification = useAppSelector(
        (state: RootState) => state.classificationSlice.hasUnknownClassification
    );
    const isDynamicClassificationEnabled = useAppSelector(
        (state: RootState) => state.classificationSlice.isDynamicClassificationEnabled
    );
    const appConfig = ConfigHelper.getAppConfig();
    const classificationMarking = useAppSelector((state: RootState) => state.classificationSlice.classificationMarking);
    const [bannerColor, setBannerColor] = useState<string>();
    const [bannerTextColor, setBannerTextColor] = useState<string>();
    const [bannerText, setBannerText] = useState<string>();
    const { map } = useContext(MapContext);
    const { isViewLoaded, viewSelect } = useSaveLoadContext();
    const defaultClassificationMarking = getDefaultClassificationMarking();
    const [workspaceItem, setWorkspaceItem] = useState<WorkSpaceItem>();
    const [mapChanged, setMapChanged] = useState<boolean>(false);

    const defaultBannerColor = getBannerColor(defaultClassificationMarking, appConfig.portalItemList.classifications);

    /* The following types are ignored by the Classification Banner evaluation */
    const ignoredLayerTypes: string[] = ['graphics', 'unknown', 'unsupported'];

    useEffect(() => {
        try {
            if (classificationItems != null && classificationItems.length > 0) {
                const marking = updateClassificationCalculation(classificationItems, appConfig.classificationBanner);
                if (!marking) {
                    dispatch(setHasUnknownClassification(true));
                    dispatch(setClassificationMarking(null));
                } else {
                    dispatch(setHasUnknownClassification(false));
                    dispatch(setClassificationMarking(marking));
                }
            } else {
                // handles initial landing page load
                dispatch(setHasUnknownClassification(true));
                dispatch(setClassificationMarking(null));
            }
        } catch (e) {
            console.error(e.message, e);
        }
    }, [classificationItems]);

    /**
     * Wait until the map is fully loaded to start the classification process.
     */
    useEffect(() => {
        if (isViewLoaded) {
            getUserSavedState().then((userSavedState) => {
                if (userSavedState.workspaces) {
                    const userWorkspaceItem = userSavedState.workspaces.find(
                        (workspaceItem) => workspaceItem.workspaceId === userSavedState.currentWorkspace
                    );
                    if (workspaceItem !== userWorkspaceItem) {
                        setWorkspaceItem(userWorkspaceItem);
                    }
                }
            });
            if (map) {
                const handle = map.allLayers.on('change', handleLayersChange);
                createClassificationItem(map as WebScene | WebMap).then(async (item) => {
                    // Find and remove old items, replacing old classification.
                    const oldItems = classificationItems.filter((item) => item.type === 'webscene');
                    if (oldItems.length > 0) {
                        for (const oldItem of oldItems) {
                            dispatch(removeClassificationItem(oldItem));
                        }
                        const firstItem = oldItems[0];

                        // set any manual classification if it exists
                        item.manualClassification = firstItem.manualClassification;
                    }

                    dispatch(addClassificationItem(item));
                    if (mapChanged) {
                        const promises = map.allLayers
                            .filter((layer) => !ignoredLayerTypes.includes(layer.type))
                            .map(async (layer: Layer) => {
                                await initialLoadLayer(layer);
                            });
                        Promise.all(promises)
                            .then(() => {
                                setMapChanged(false);
                            })
                            .catch((error) => {
                                console.error(error);
                            });
                    }
                });
                return () => {
                    handle?.remove();
                };
            }
        }
    }, [isViewLoaded, map]);

    /**
     * Refreshes the classification item list when the Map changes
     */
    useEffect(() => {
        setMapChanged(true);
        if (classificationItems.length !== 0) {
            dispatch(resetClassification());
        }
    }, [map]);

    useEffect(() => {
        if (!mapChanged) {
            if (viewSelect === 'viewDefault') {
                updateDefaultManualClassification();
            } else if (workspaceItem) {
                updateWorkspaceManualClassification();
            }
        }
    }, [mapChanged, workspaceItem]);

    useEffect(() => {
        if (classificationMarking && !hasUnknownClassification && isDynamicClassificationEnabled) {
            setBannerText(classificationMarking.banner);
            const bannerColor = getBannerColor(classificationMarking, appConfig.portalItemList.classifications);
            setBannerColor(bannerColor.backgroundColor);
            setBannerTextColor(bannerColor.textColor);
        } else {
            setBannerColor(defaultBannerColor.backgroundColor);
            setBannerTextColor(defaultBannerColor.textColor);
            setBannerText(appConfig.classificationBanner);
        }
    }, [hasUnknownClassification, isDynamicClassificationEnabled, classificationMarking]);

    /**
     * initial load the layers
     */
    const initialLoadLayer = async (layer: Layer): Promise<void> => {
        const item = await createClassificationItem(layer);
        dispatch(addClassificationItem(item));
    };

    /**
     * update the default manual classification item
     */
    const updateDefaultManualClassification = async (): Promise<void> => {
        const missionId = await getMissionIdByTitle(saveLoadContext.missionSelect);
        if (missionId) {
            const data = await getWebAppAndData(missionId);
            const updatedArray = await getDefaultManualClassification(classificationItems, data);
            if (JSON.stringify(updatedArray) !== JSON.stringify(classificationItems)) {
                dispatch(setClassificationItems(updatedArray));
            }
        }
    };

    /**
     * Checks the mission workspace for manual classifications from mission analyst state table, if it has one.
     * Then this sets those values on the appropriate classification items.
     */
    const updateWorkspaceManualClassification = async (): Promise<void> => {
        const updatedClassificationItems = classificationItems.map((item) => {
            if (workspaceItem) {
                const manualClassificationInfo = workspaceItem.manualClassifications?.find(
                    (classification) => classification.layerId === item.id
                );
                if (manualClassificationInfo && manualClassificationInfo.licenseInfo) {
                    return {
                        ...item,
                        manualClassification: manualClassificationInfo.licenseInfo as unknown as ClassificationMarking,
                    };
                }
            }
            return item;
        });
        dispatch(setClassificationItems(updatedClassificationItems));
    };

    /**
     * Checks if all layers in the map are fully loaded; returns true when all layers are loaded
     * @param map The map object in the mission and its layers
     */
    const areAllLayersLoaded = async (map: __esri.Map) => {
        // all layers in map object
        const layers = map.layers.toArray();
        // array of promises for each layer's loading status
        const loadPromises = layers.map((layer) => {
            return layer.load();
        });
        // promise resolves and returns true when all layers are loaded
        return (
            Promise.all(loadPromises)
                .then(() => {
                    return true;
                })
                // if any layers fail to load, return false
                .catch((error) => {
                    console.error('Error loading layers: ', error);
                    return false;
                })
        );
    };

    /**
     * Event handler for the ArcGIS JSAPI layer change event.
     * @param e Takes a collection change event of Layer objects.
     */
    const handleLayersChange = async (e: CollectionChangeEvent<Layer>) => {
        try {
            const added: Layer[] = e.added?.filter((layer) => !ignoredLayerTypes.includes(layer.type)) ?? [];
            const removed: Layer[] = e.removed ?? [];
            removed
                .filter((layer) => !ignoredLayerTypes.includes(layer.type))
                .forEach((layer) => {
                    const portalItem = layer.get('portalItem') as PortalItem;
                    if (portalItem) {
                        dispatch(removeClassificationItem(portalItem));
                    } else {
                        dispatch(removeClassificationItem(layer));
                    }
                });
            if (added.length > 0) {
                if (added && map) {
                    // check if all layers including newly added layers are loaded before creating classification items
                    await areAllLayersLoaded(map)
                        .then(async (allLayersLoaded) => {
                            if (allLayersLoaded) {
                                await createClassificationItems(added, classificationItems);
                            }
                        })
                        .catch((error) => {
                            console.error('Error loading layers: ', error);
                        });
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    /**
     * Creates classification items from a list of layers (if they do not already exist) and adds them to the item list.
     * @param layers A list of layers to process
     * @param previousItems The previous items list to compare against. Matching items (by item id) will not be re-created.
     */
    const createClassificationItems = async (layers: __esri.Layer[], previousItems: ClassificationItem[] = []) => {
        const promises = layers.map(async (layer) => {
            const existingItem = previousItems.find(
                (classItem) => classItem.type === 'layer' && classItem.id === layer.id
            );
            if (!existingItem) {
                try {
                    const item = await createClassificationItem(layer);
                    const idx = classificationItems.findIndex(
                        (classItem) => classItem.type === 'layer' && classItem.id === item.id
                    );
                    if (idx !== -1) {
                        await updateClassificationItem(item, idx);
                    } else {
                        dispatch(addClassificationItem(item));
                    }
                } catch (error) {
                    console.error(error);
                }
            }
        });
        await Promise.all(promises);
    };

    /**
     * Update a classification item to replace to original item with the item passed in.
     * It will update the classificationItem at the index passed in
     * @param item the updated classification item
     * @param index the location in the current classification items to overwrite
     */
    const updateClassificationItem = async (item: ClassificationItem, index: number) => {
        if (index >= 0) {
            const inserted = [...classificationItems];
            inserted[index] = item;
            dispatch(setClassificationItems(inserted));
        }
    };

    return (
        <BannerContainer theme={{ bannerColor: bannerColor, textColor: bannerTextColor }}>
            <Grid container component='footer' spacing={1} alignItems='center' justifyContent='space-between'>
                <BannerColumn item style={{ flex: 1, justifyContent: 'center' }}>
                    <ClassificationContainer>{bannerText}</ClassificationContainer>
                </BannerColumn>
            </Grid>
        </BannerContainer>
    );
};

export default ClassificationBanner;
