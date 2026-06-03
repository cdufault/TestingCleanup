import React, { useContext, useEffect, useRef, useState } from 'react';
import { DragDropContext, Draggable, Droppable, DroppableProvided } from '@hello-pangea/dnd';

//arcgis imports
import SceneView from '@arcgis/core/views/SceneView';
import WebScene from '@arcgis/core/WebScene';
import Slide from '@arcgis/core/webscene/Slide';
import Collection from '@arcgis/core/core/Collection';
//icons
import BookmarkIcon from 'calcite-ui-icons-react/BookmarkIcon';
import PlusCircleIcon from 'calcite-ui-icons-react/PlusCircleIcon';

//material ui imports
import { IconButton, Popover } from '@mui/material';

//contexts
import { MapContext } from '../../../contexts/Map';
import { useSaveLoadContext } from '../../../contexts/SaveLoad';

//custom styles
import {
    StyledBookmarkButtonGroup,
    StyledEverythingDiv,
    StyledMenuAllDiv,
    StyledMenuItemCentered,
    StyledMenuListDiv,
} from './styles';

//helpers
import { useSnackbar } from 'notistack';
import BookmarkItem from './BookmarkItem';
import Camera from '@arcgis/core/Camera';
import WebMap from '@arcgis/core/WebMap';
import MapView from '@arcgis/core/views/MapView';
import Viewpoint from '@arcgis/core/Viewpoint';
import Point from '@arcgis/core/geometry/Point';
import { useAppSelector } from '../../../hooks/hooks';
import Layer from '@arcgis/core/layers/Layer';

const Bookmarks = (): JSX.Element => {
    const { getSceneView, getMapView } = useContext(MapContext);
    const activeView = useAppSelector((state) => state.webMapViewSlice.activeView);
    const panningSpeed = useAppSelector((state) => state.applicationSlice.panningSpeed);
    const saveLoadContext = useSaveLoadContext();
    const { enqueueSnackbar } = useSnackbar();

    const [slides, setSlides] = useState<Collection<Slide>>(new Collection<Slide>());
    const [splitMenuIsOpen, setSplitMenuIsOpen] = useState(false);
    const [bookmarksDisabled, setBookmarksDisabled] = useState(false);
    const [editableItemId, setEditableItemId] = useState<string>('');
    const [editingSlide, setEditingSlide] = useState<{ id: string; title: string } | null>(null);

    const bookmarkTitle = '';
    const webSceneRef = useRef<WebScene | WebMap>();
    const viewRef = useRef<SceneView | MapView>();
    const anchorRefForSplitButton = useRef<HTMLDivElement>(null);
    // Values taken from https://developers.arcgis.com/documentation/mapping-and-location-services/reference/zoom-levels-and-scale/
    // These are needed for legacy way we made bookmarks before this to work in 2D
    const scaleReference = [
        591657527.59, // Zoom 0
        295828763.8, // Zoom 1
        147914381.89, // Zoom 2
        73957190.95, // Zoom 3
        36978595.47, // Zoom 4
        18489297.74, // Zoom 5
        9244648.87, // Zoom 6
        4622324.43, // Zoom 7
        2311162.22, // Zoom 8
        1155581.11, // Zoom 9
        577790.55, // Zoom 10
        288895.28, // Zoom 11
        144447.64, // Zoom 12
        72223.82, // Zoom 13
        36111.91, // Zoom 14
        18055.95, // Zoom 15
        9027.98, // Zoom 16
        4513.99, // Zoom 17
        2256.99, // Zoom 18
        1128.49, // Zoom 19
        564.24, // Zoom 20
        282.124, // Zoom 21
        141.06, // Zoom 22
        70.53, // Zoom 23
    ];

    useEffect(() => {
        if (!saveLoadContext.isViewLoaded) return;
        let view: SceneView | MapView | undefined = getSceneView();
        if (view) {
            const webScene = view.map as WebScene;
            if (webScene) {
                webSceneRef.current = webScene;
                setSlides(webScene.presentation.slides.clone());
            }
        } else if (saveLoadContext.portalIdToLoad) {
            // for loading in 2D mode from landing page
            const webScene = new WebScene({
                portalItem: {
                    id: saveLoadContext.portalIdToLoad,
                },
            });
            if (webScene) {
                setSlidesFromScene(webScene);
            }
        }
        if (activeView === 'SCENE') {
            viewRef.current = view;
        } else {
            view = getMapView();
            if (view) {
                viewRef.current = view;
                const webMap = view.map as WebMap;
                if (webMap) {
                    webSceneRef.current = webMap;
                }
            }
        }
    }, [saveLoadContext.isViewLoaded, saveLoadContext.portalIdToLoad]);

    useEffect(() => {
        if (activeView === 'MAP') {
            const aMapView = getMapView();
            if (aMapView) {
                viewRef.current = aMapView;
            }
        } else {
            const aSceneView = getSceneView();
            if (aSceneView) {
                viewRef.current = aSceneView;
            }
            setBookmarksDisabled(false);
        }
    }, [activeView]);

    /**
     * When the user loads in via 2D from the landing page.
     * This will be called to load the scene and get the slides for that mission.
     * @param webScene webScene that has not been loaded yet
     */
    const setSlidesFromScene = async (webScene: WebScene) => {
        await webScene.load();
        if (webScene.presentation?.slides) {
            setSlides(webScene.presentation.slides.clone());
        }
    };

    /**
     * Collects the numeric service IDs of all currently visible sublayers for a single
     * layer. Used to populate `SlideVisibleLayer.sublayerIds` in `slide.visibleLayers`.
     *
     * - `MapImageLayer` → `allSublayers.items` is a flat Collection at all depths,
     *   so no recursion is needed and the full tree is captured in one pass.
     * - Other types (GroupLayer, etc.) → `sublayers.items` with recursive traversal
     *   via `collectVisibleSublayerIdsFromCollection`.
     *
     * @param layer - The parent layer to inspect.
     * @returns Array of numeric sublayer IDs that are currently visible.
     */
    const collectVisibleSublayerIds = (layer: Layer): number[] => {
        const layerAny = layer as any;
        const visibleIds: number[] = [];
        if (layerAny.allSublayers?.items?.length) {
            // MapImageLayer: flat list of all sublayers at every depth.
            layerAny.allSublayers.items.forEach((sublayer: any) => {
                if (sublayer.visible) visibleIds.push(sublayer.id);
            });
        } else if (layerAny.sublayers?.items?.length) {
            collectVisibleSublayerIdsFromCollection(layerAny.sublayers, visibleIds);
        }
        return visibleIds;
    };

    /**
     * Recursively collects numeric sublayer IDs from a sublayers collection.
     * Only used for layer types that do not expose `allSublayers` (i.e. not MapImageLayer).
     * @param sublayers - The ArcGIS sublayers collection object (has an `items` array).
     * @param visibleIds - Accumulator array that receives visible numeric sublayer IDs.
     */
    const collectVisibleSublayerIdsFromCollection = (sublayers: any, visibleIds: number[]) => {
        sublayers.items.forEach((sublayer: any) => {
            if (sublayer.visible) visibleIds.push(sublayer.id);
            if (sublayer.sublayers?.items?.length) {
                collectVisibleSublayerIdsFromCollection(sublayer.sublayers, visibleIds);
            }
        });
    };

    /**
     * Builds a `slide.visibleLayers`-compatible Collection by snapshotting the current
     * visibility state of all Operational layers and their sublayers.
     *
     * Only `map.layers` (operational layers) is iterated - basemap and ground layers
     * are intentionally excluded. This matches the ArcGIS `SlideVisibleLayer` spec,
     * which only references `WebScene.layers` or `Ground.layers` not basemap layers.
     * Basemap visibility is managed separately by the `slide.basemap` property
     *
     * Each entry matches the native `SlideVisibleLayer` shape: `{ id, sublayerIds? }`:
     * - Only **visible** layers are included (matching ArcGIS convention).
     * - `sublayerIds` (numeric service IDs of visible sublayers) is populated for layers
     *   that have sublayers; omitted for simple layers without sublayers.
     *
     * @param map - The WebMap or WebScene to inspect.
     * @returns A Collection of visible-layer entries ready to assign to `slide.visibleLayers`.
     */
    const buildSlideVisibleLayers = (map: WebMap | WebScene): Collection<any> => {
        const items: { id: string; sublayerIds?: number[] }[] = [];
        (map as any).layers.forEach((layer: Layer) => {
            if (!layer.visible) return;
            const layerAny = layer as any;
            const hasSublayers = !!(layerAny.allSublayers?.items?.length || layerAny.sublayers?.items?.length);
            items.push({
                id: layer.id,
                ...(hasSublayers && { sublayerIds: collectVisibleSublayerIds(layer) }),
            });
        });
        return new Collection(items);
    };

    /**
     * Restores sublayer visibility for a single layer from a numeric `sublayerIds` array
     * (the native `SlideVisibleLayer.sublayerIds` format).
     *
     * - `MapImageLayer` → sets visibility on `allSublayers.items` (flat, no recursion).
     * - Other types → sets visibility on `sublayers.items` recursively via
     *   `applySubLayerVisibilityFromCollection`.
     *
     * @param layer - The parent layer whose sublayers should be updated.
     * @param sublayerIds - Numeric service IDs of sublayers that should be visible.
     */
    const applySubLayerVisibility = (layer: Layer, sublayerIds: number[]) => {
        const layerAny = layer as any;
        if (layerAny.allSublayers?.items?.length) {
            layerAny.allSublayers.items.forEach((sublayer: any) => {
                sublayer.visible = sublayerIds.includes(sublayer.id);
            });
        } else if (layerAny.sublayers?.items?.length) {
            applySubLayerVisibilityFromCollection(layerAny.sublayers, sublayerIds);
        }
    };

    /**
     * Recursively restores sublayer visibility from a numeric ID list.
     * Only used for layer types without `allSublayers`.
     * @param sublayers - The ArcGIS sublayers collection object (has an `items` array).
     * @param sublayerIds - Numeric service IDs of sublayers that should be visible.
     */
    const applySubLayerVisibilityFromCollection = (sublayers: any, sublayerIds: number[]) => {
        sublayers.items.forEach((sublayer: any) => {
            sublayer.visible = sublayerIds.includes(sublayer.id);
            if (sublayer.sublayers?.items?.length) {
                applySubLayerVisibilityFromCollection(sublayer.sublayers, sublayerIds);
            }
        });
    };

    /**
     * Applies the full layer and sublayer visibility state from `slide.visibleLayers`
     * to the map's operational layers only.
     *
     * Only `map.layers` (operational layers) is iterated - basemap and ground layers
     * are intentionally left untouched. This prevents old bookmarks (which stored no
     * basemap ID's) from inadvertently hiding the basemap when applied
     *
     * - Layers absent from `visibleLayers` are hidden.
     * - Layers present in `visibleLayers` are shown; if their entry has a `sublayerIds`
     *   array, sublayer visibility is also restored via `applySubLayerVisibility`.
     * - If `sublayerIds` is absent on an entry (e.g. older bookmarks without sublayer
     * data), sublayer visibility is left unchanged for backward compatibility.
     *
     * @param map - The WebMap or WebScene to update.
     * @param visibleLayers - The `slide.visibleLayers` Collection to apply.
     */
    const applyVisibleLayersToMap = (map: WebMap | WebScene, visibleLayers: Collection<any>) => {
        const items = visibleLayers.items as Array<{ id: string; sublayerIds?: number[] | null }>;
        (map as any).layers.forEach((layer: Layer) => {
            const entry = items.find((item) => item.id === layer.id);
            layer.visible = !!entry;
            if (entry && Array.isArray(entry.sublayerIds)) {
                applySubLayerVisibility(layer, entry.sublayerIds);
            }
        });
    };

    /**
     * Crops and resizes an image to match the correct aspect ratio for thumbnails.
     * The function ensures the image maintains an aspect ratio of approximately 16:10
     * (195.19 × 122 pixels) by first cropping it and then resizing it.
     * @param {string} imageDataUrl - The base64 data URL of the image to process.
     * @returns {Promise<string>} - A promise that resolves to a base64 PNG data URL of the processed thumbnail.
     */
    const cropAndResizeThumbnail = async (imageDataUrl: string): Promise<string> => {
        const img = new Image();
        img.src = imageDataUrl;

        await new Promise((resolve) => (img.onload = resolve));

        // Target aspect ratio (195.19 / 122 ≈ 1.6)
        const targetAspectRatio = 195.19 / 122;
        let cropWidth = img.width;
        let cropHeight = img.height;

        // Adjust cropping dimensions to maintain the correct aspect ratio
        if (img.width / img.height > targetAspectRatio) {
            cropWidth = img.height * targetAspectRatio; // Crop width to fit height
        } else {
            cropHeight = img.width / targetAspectRatio; // Crop height to fit width
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set final thumbnail dimensions
        canvas.width = 195.19;
        canvas.height = 122;

        // Crop the center of the image and resize it to fit the thumbnail
        ctx?.drawImage(
            img,
            (img.width - cropWidth) / 2, // Center cropping horizontally
            (img.height - cropHeight) / 2, // Center cropping vertically
            cropWidth,
            cropHeight,
            0,
            0,
            canvas.width,
            canvas.height
        );

        // Return the processed image as a data URL
        return canvas.toDataURL('image/png');
    };

    /**
     * Create a new bookmark with the given title.
     * @param title Bookmark title
     */
    const createBookmark = async (title: string) => {
        if (!viewRef.current || !webSceneRef.current) return;
        if (viewRef.current.type === '3d') {
            const slide = await Slide.createFrom(viewRef.current);
            slide.title.text = title;
            const viewpoint = get3DViewpointFromView();
            if (viewpoint) {
                slide.viewpoint = viewpoint;
            }
            slide.visibleLayers = buildSlideVisibleLayers(viewRef.current.map as WebScene);
            webSceneRef.current.presentation.slides.add(slide, 0);
            setSlides(webSceneRef.current.presentation.slides.clone());
        } else {
            const mapView = viewRef.current as MapView;
            try {
                const resizedThumbnail = await get2DScreenShot(mapView);
                const slide = new Slide({
                    thumbnail: resizedThumbnail,
                    title: { text: title },
                    viewpoint: get2DViewpointForSlide(mapView),
                    visibleLayers: buildSlideVisibleLayers(mapView.map as WebMap),
                });
                webSceneRef.current.presentation.slides.add(slide, 0);
                setSlides(webSceneRef.current.presentation.slides.clone());
            } catch (error) {
                console.error('Error capturing screenshot creating 2D bookmark: ', error);
                enqueueSnackbar('Error creating 2D bookmark.', {
                    variant: 'error',
                });
            }
        }
    };

    /**
     * get the 3D viewpoint from the view
     */
    const get3DViewpointFromView = (): Viewpoint | undefined => {
        if (viewRef.current) {
            const viewpoint = viewRef.current.viewpoint.clone();
            // adjust scale  by cosine of latitude to account for distance as altitude moves away from the equator
            const latitude = viewRef.current.center.latitude;
            const scaleConversionFactor = Math.cos((latitude * Math.PI) / 180);
            viewpoint.scale /= scaleConversionFactor;
            return viewpoint;
        }
        return undefined;
    };

    /**
     * get 2D Viewpoint For Slide
     * @param mapView MapView object
     */
    const get2DViewpointForSlide = (mapView: MapView): Viewpoint => {
        const viewpoint = mapView.viewpoint.clone();
        // adjust scale  by cosine of latitude to account for distance as altitude moves away from the equator
        const latitude = mapView.center.latitude;
        const scaleConversionFactor = Math.cos((latitude * Math.PI) / 180);
        viewpoint.scale *= scaleConversionFactor;
        return viewpoint;
    };

    /**
     * get 2D screen shot
     * @param mapView MapView object
     */
    const get2DScreenShot = async (mapView: MapView) => {
        const screenshot = await mapView.takeScreenshot();
        return await cropAndResizeThumbnail(screenshot.dataUrl);
    };

    /**
     * Converts a SceneView Camera to a MapView Viewpoint in WGS84, computing an appropriate scale.
     * @param camera - The Camera from SceneView.
     * @returns A Viewpoint with correct rotation and target geometry.
     */
    const convertCameraToViewpointWGS84 = (camera: Camera): Viewpoint => {
        const zoomLevel = computeZoomLevelFromCameraWGS84(camera.fov, camera.position.z);
        const scale = getScaleForZoomLevel(zoomLevel);
        const viewpointRotation = (360 - camera.heading) % 360;

        return new Viewpoint({
            targetGeometry: new Point({
                x: camera.position.longitude, // WGS84 uses longitude for X
                y: camera.position.latitude, // WGS84 uses latitude for Y
                z: camera.position.z, // Preserve elevation if needed
                spatialReference: { wkid: 4326 },
            }),
            scale,
            rotation: viewpointRotation,
        });
    };

    /**
     * Computes a zoom level for 2D from a 3D camera's altitude and FOV in WGS84.
     * groundHeight = 2 × altitude × tan((FOV/2) X (π/180))
     * WGS84 (EPSG:4326) is a geographic coordinate system (GCS), meaning it does not use a constant scale like Web Mercator.
     * Scale in WGS84 depends on latitude, since one degree of longitude shrinks as you move toward the poles.
     * Meters per degree conversion is approximate:
     * 1 degree ≈ 111,319.49 meters ( at the equator )
     * This value shrinks with latitude due to the Earth's curvature.
     * You can adjust for latitude using:
     * Meters per degree = 111,319.49 × cos(latitude)
     * ArcGIS approximates zoom levels in WGS84, but resolutions must be manually adjusted due to lack of a direct tiling scheme.
     * @param fov camera FOV from 3D slide camera
     * @param altitude camera altitude from 3D slide camera
     */
    const computeZoomLevelFromCameraWGS84 = (fov: number, altitude: number): number => {
        // groundHeight= 2 × altitude × tan((FOV/2) X (π/180))
        const groundHeight = 2 * altitude * Math.tan((fov / 2) * (Math.PI / 180));
        // 40075017m = Earth's circumference in meters
        const zoomLevel = Math.round(Math.log2(40075017 / groundHeight) + 1.5);
        // magic number (1.5) to adjust zoom  level to close to needed value was found with trial and error
        return Math.max(0, Math.min(zoomLevel, 23)); // Clamp between zoom levels 0 and 23
    };

    /**
     * Converts a zoom level into an approximate map scale for WGS84.
     * @param zoomLevel the calculated zoom level as integer
     */
    const getScaleForZoomLevel = (zoomLevel: number): number => {
        return scaleReference[zoomLevel] || 591657527.59; // Default to Zoom 0 scale
    };

    /**
     * Navigates to the extent of the bookmark, showing only its visible layers.
     * @param slideId Identifier for the bookmark being navigated to.
     */
    const gotoBookmark = (slideId: string) => {
        if (webSceneRef.current && viewRef.current) {
            if (activeView === 'MAP') {
                const slideToUse = slides.find((slide: any) => slide.id === slideId);
                const visibleLayers = slideToUse?.visibleLayers ?? new Collection();
                applyVisibleLayersToMap(viewRef.current.map as WebMap, visibleLayers);
                const camera = slideToUse?.viewpoint?.camera;
                if (camera?.position?.z) {
                    const twoDViewpoint = convertCameraToViewpointWGS84(camera);
                    viewRef.current.goTo(twoDViewpoint);
                } else {
                    const zoomLevel = slideToUse ? scaleReference.indexOf(slideToUse.viewpoint.scale) : -1;
                    if (zoomLevel >= 0 && zoomLevel < 24) {
                        viewRef.current.goTo({ target: camera?.position, zoom: zoomLevel });
                    } else {
                        if (slideToUse) {
                            viewRef.current.goTo(slideToUse.viewpoint);
                        }
                    }
                }
            } else {
                // applyTo handles viewpoint animation; we also manually apply visibleLayers
                // to ensure sublayerIds are restored (4.x applyTo may not process sublayerIds).
                const slide = webSceneRef.current.presentation.slides.find((sld: Slide) => sld.id === slideId);
                slide.applyTo(viewRef.current, { speedFactor: panningSpeed });
                if (slide?.visibleLayers) {
                    applyVisibleLayersToMap(viewRef.current.map as WebScene, slide.visibleLayers);
                }
            }
        }
    };

    /**
     * Update the bookmark with current extent and visible layers.
     * @param slideId Identifier for the bookmark being updated.
     */
    const updateBookmarkView = async (slideId: string) => {
        if (webSceneRef.current && viewRef.current) {
            const slideToUpdate = webSceneRef.current.presentation.slides.find((sld: Slide) => sld.id === slideId);
            if (viewRef.current.type === '3d') {
                if (slideToUpdate) {
                    await slideToUpdate.updateFrom(viewRef.current);
                    const viewpoint = get3DViewpointFromView();
                    if (viewpoint) {
                        slideToUpdate.viewpoint = viewpoint;
                    }
                    slideToUpdate.visibleLayers = buildSlideVisibleLayers(viewRef.current.map as WebScene);
                    setSlides(webSceneRef.current?.presentation.slides.clone());
                }
            } else {
                const mapView = viewRef.current as MapView;
                try {
                    slideToUpdate.thumbnail = await get2DScreenShot(mapView);
                    slideToUpdate.viewpoint = get2DViewpointForSlide(mapView);
                    slideToUpdate.visibleLayers = buildSlideVisibleLayers(mapView.map as WebMap);
                    setSlides(webSceneRef.current.presentation.slides.clone());
                } catch (error) {
                    console.error('Error capturing screenshot creating 2D bookmark: ', error);
                    enqueueSnackbar('Error creating 2D bookmark.', {
                        variant: 'error',
                    });
                }
            }
            enqueueSnackbar('The current bookmark view and layers has been updated.', { variant: 'info' });
        }
    };

    /**
     * Update the bookmark with current title with passed in title.
     * @param slideId Identifier for the bookmark being updated.
     * @param newTitleText the new title for the bookmark
     */
    const updateBookmarkTitle = (slideId: string, newTitleText: string) => {
        if (webSceneRef.current) {
            const slide = webSceneRef.current.presentation.slides.find((sld: Slide) => sld.id === slideId);
            if (slide && slide.title.text !== newTitleText) {
                slide.title.text = newTitleText;
                setSlides(webSceneRef.current?.presentation.slides.clone());
                enqueueSnackbar('The current bookmark title has been updated.', { variant: 'info' });
            }
            setEditableItemId('');
        }
    };

    /**
     * Deletes the bookmark.
     * @param slideId Identifier for the bookmark being deleted.
     */
    const deleteBookmark = (slideId: string) => {
        if (webSceneRef.current) {
            const slides = webSceneRef.current.presentation.slides.filter((sld: Slide) => sld.id != slideId);
            webSceneRef.current.presentation.slides = slides;
            setSlides(slides);
            if (slides.length === 0) {
                setSplitMenuIsOpen(false);
            }
            enqueueSnackbar('The current bookmark has been deleted.', { variant: 'info' });
        }
    };

    /**
     * When a slide is edited this will find the right slide by ID and update the list.
     * @param id edited slides ID
     * @param newTitle the new title to set.
     */
    const handleEdit = (id: string, newTitle: string) => {
        setEditingSlide({ id, title: newTitle });
        setEditableItemId(id);
    };

    // button events
    const handleToggle = () => {
        setSplitMenuIsOpen((prevOpen) => !prevOpen);
    };

    const handleClose = () => {
        setSplitMenuIsOpen(false);
    };

    /**
     * Saves the newly created bookmark.
     */
    const saveNewBookmark = () => {
        if (bookmarkTitle?.trim()) {
            createBookmark(bookmarkTitle);
            enqueueSnackbar('Please Save Mission to save new bookmark', {
                variant: 'warning',
            });
        } else if (bookmarkTitle.trim() === '') {
            {
                createBookmark('Bookmark title...');
                enqueueSnackbar('Please Save Mission to save new bookmark', {
                    variant: 'warning',
                });
            }
        }
    };

    /**
     * Handles the reordering of bookmarks after a drag-and-drop operation
     * @param result The result object from the drag-and-drop operation.
     */
    const handleDragEnd = (result: any) => {
        const { source, destination } = result;

        // if dropped outside the list or in the same position, do nothing
        if (!destination || source.index === destination.index) {
            return;
        }

        // Get the slide being moved
        const slideToMove = slides.getItemAt(source.index);

        if (slideToMove && webSceneRef.current) {
            // Remove the slide from the source index
            slides.remove(slideToMove);

            // Add the slide at the destination index
            slides.add(slideToMove, destination.index);

            //update the state to reflect changes
            webSceneRef.current.presentation.slides = slides;
            setSlides(slides.clone());
        }
    };

    return (
        <>
            <StyledBookmarkButtonGroup
                ref={anchorRefForSplitButton}
                size='small'
                variant='outlined'
                title={bookmarksDisabled ? 'Bookmarks are not currently available in 2d' : undefined}
            >
                <IconButton title='Bookmarks' disabled={bookmarksDisabled} onClick={handleToggle}>
                    <BookmarkIcon size={16} />
                </IconButton>
            </StyledBookmarkButtonGroup>

            <Popover
                open={splitMenuIsOpen}
                onClose={handleClose}
                anchorEl={anchorRefForSplitButton.current}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
            >
                <StyledEverythingDiv id={'bookmark-window'}>
                    <StyledMenuItemCentered
                        onClick={() => {
                            saveNewBookmark();
                        }}
                        title={'Add new bookmark'}
                    >
                        <PlusCircleIcon />
                    </StyledMenuItemCentered>
                    <StyledMenuAllDiv id={'wrap-menu-all'}>
                        <StyledMenuListDiv id={'styled-menu-list-div'}>
                            <div id='menu-bug-preventing-div'>
                                <DragDropContext onDragEnd={handleDragEnd} isCombineEnabled={true}>
                                    {/*Typescript will give you errors but this still works and builds on Jenkins. */}
                                    <Droppable droppableId='bookmark-list' key={`droppable-${slides.length}`}>
                                        {(provided: DroppableProvided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                id='bookmark-list'
                                            >
                                                {slides.map((slide, index) => (
                                                    <Draggable key={slide.id} draggableId={slide.id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div ref={provided.innerRef} {...provided.draggableProps}>
                                                                <BookmarkItem
                                                                    indexValue={index}
                                                                    slide={slide}
                                                                    editableItemId={editableItemId}
                                                                    isDragging={snapshot.isDragging}
                                                                    dragHandleProps={provided.dragHandleProps}
                                                                    onEdit={(id, title) => {
                                                                        updateBookmarkTitle(id, title);
                                                                        setEditableItemId('');
                                                                    }}
                                                                    onGoto={gotoBookmark}
                                                                    onUpdate={updateBookmarkView}
                                                                    onDelete={deleteBookmark}
                                                                    editingSlideInfo={editingSlide}
                                                                    setEditingSlideTitle={setEditingSlide}
                                                                    setEditableItemId={(id) =>
                                                                        handleEdit(id, slide.title.text)
                                                                    }
                                                                />
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </DragDropContext>
                            </div>
                        </StyledMenuListDiv>
                    </StyledMenuAllDiv>
                </StyledEverythingDiv>
            </Popover>
        </>
    );
};

export default Bookmarks;
