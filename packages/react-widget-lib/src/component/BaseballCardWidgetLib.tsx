import React, { Fragment, useEffect, useRef, useState } from "react";
import {
  Box,
  FormControlLabel,
  IconButton,
  Pagination,
  Switch,
} from "@mui/material";
import { BuildMapExtentFromScreenPoint } from "@stratcom/lib-functions";
import { Geometry, Point, Polygon, Polyline } from "@arcgis/core/geometry";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine.js";
import MapView from "@arcgis/core/views/MapView";
import SceneView from "@arcgis/core/views/SceneView";
import Feature from "@arcgis/core/widgets/Feature";
import FeatureSet from "@arcgis/core/rest/support/FeatureSet";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";
import CSVLayer from "@arcgis/core/layers/CSVLayer";
import ImageryLayer from "@arcgis/core/layers/ImageryLayer";
import ImageryTileLayer from "@arcgis/core/layers/ImageryTileLayer";
import OGCFeatureLayer from "@arcgis/core/layers/OGCFeatureLayer";
import PointCloudLayer from "@arcgis/core/layers/PointCloudLayer";
import StreamLayer from "@arcgis/core/layers/StreamLayer";
import WFSLayer from "@arcgis/core/layers/WFSLayer";
import SceneLayer from "@arcgis/core/layers/SceneLayer";
import Graphic from "@arcgis/core/Graphic";
import MagnifyGlassPlusIcon from "calcite-ui-icons-react/MagnifyingGlassPlusIcon";
import FlashIcon from "calcite-ui-icons-react/FlashIcon";
import styled from "@emotion/styled";

import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";

const StyledFlashIconButton = styled(IconButton)`
  padding-right: 15px;
`;

const StyledRootWidgetBox = styled(Box)`
  .esri-widget__heading {
    margin-left: 8px;
  }
  display: flex;
  flex-direction: column;
  max-height: 80vh;
`;

const StyledPaginationBox = styled(Box)`
  padding-top: 15px;
`;

const StyledBBCardWidgetBox = styled(Box)`
  padding-top: 15px;
  overflow: auto;
`;

/**
 * Props passed in to the Legend widget
 */
export interface BaseballCardWidgetProps {
  /**
   * Controls whether the active view is in 2D or 3D
   */
  activeView: "MAP" | "SCENE";

  /**
   * current mapView object
   */
  mapView: __esri.MapView | undefined;

  /**
   * current sceneView Object
   */
  sceneView: __esri.SceneView | undefined;

  /**
   * Callback that returns the map view
   */
  getMapView: () => __esri.MapView | undefined;

  /**
   * Callback that returns the scene view
   */
  getSceneView: () => __esri.SceneView | undefined;

  /**
   * speed of the goto animation
   */
  panningSpeed: number;

  /**
   * default amount of map scale to apply when the zoomTo button is clicked and the
   * current feature has a point geometry type
   */
  zoomScale: number;

  /**
   * array of object ids representing the selected/highlighted features on the map
   */
  selectedFeatures: number[];

  /**
   * the layer that is providing the selected/highlighted features
   */
  selectedLayer: __esri.Layer | undefined;

  /**
   * callback method to clear selected features
   * @returns void
   */
  clearSelectedFeaturesCallback: () => void;

  /**
   * fill color (RGP) values for the flash symbol graphic
   */
  flashGraphicColor: number[];
}

/**
 * Layer types supporting popups
 */
export type PopupSupportedLayer =
  | FeatureLayer
  | CSVLayer
  | GeoJSONLayer
  | ImageryLayer
  | ImageryTileLayer
  | OGCFeatureLayer
  | PointCloudLayer
  | SceneLayer
  | StreamLayer
  | WFSLayer;

/** Baseball card widget - supports custom popup templates and creates default ones when needed */
export const BaseballCardWidgetLib = (
  props: BaseballCardWidgetProps
): JSX.Element => {
  const {
    activeView,
    mapView,
    sceneView,
    getMapView,
    getSceneView,
    panningSpeed,
    zoomScale,
    selectedLayer,
    selectedFeatures,
    clearSelectedFeaturesCallback,
    flashGraphicColor,
  } = props;
  const [view, setView] = useState<MapView | SceneView | undefined>();
  const [featureBasket, setFeatureBasket] = useState<any[]>([]);
  const featureRef = useRef<Feature | undefined>();

  const htmlDivFeatureRef = useRef<HTMLDivElement>(null);
  const [defaultActiveFeatureGraphic] = useState({
    popupTemplate: {
      content: "Click a map feature to populate the Baseball Card.",
    },
  });
  const [selectedFeatureGraphics, setSelectedFeatureGraphics] = useState<
    any[] | undefined
  >();
  const [firstActiveFeatureGraphic, setFirstActiveFeatureGraphic] =
    useState<any>();
  const [paginationCount, setPaginationCount] = useState(0);
  const [page, setPage] = useState(0);
  const viewClickHandleRef = useRef<IHandle>();
  const defaultPopupStatusForSceneViewRef = useRef<boolean | undefined>();
  const defaultPopupStatusForMapViewRef = useRef<boolean | undefined>();
  const viewRef = useRef<MapView | SceneView | undefined>();
  const layersPopupStatusMapRef = useRef<Map<string, boolean>>();
  const supportMapImageRef = useRef<boolean>(false);
  const [supportMapImage, setSupportMapImage] = useState(false);
  const showPopupOnMapRef = useRef(true);
  const [showPopupOnMap, setShowPopupOnMap] = useState(true);
  const layerViewCreateHandleRef = useRef<IHandle>();
  const layerViewDestroyHandleRef = useRef<IHandle>();
  const graphicsLayerRef = useRef<GraphicsLayer | undefined>();
  const [canShowFlashButton, setCanShowFlashButton] = useState(false);

  useEffect(() => {
    selectedLayerChanged(selectedLayer);
  }, [selectedLayer]);

  useEffect(() => {
    selectedFeaturesChanged(selectedFeatures, selectedLayer);
  }, [selectedFeatures]);

  useEffect(() => {
    supportMapImageRef.current = false;
    return () => {
      cleanUpOnViewSwitch();
      resetLayerPopupStatusOnWidgetUnload();
    };
  }, []);

  useEffect(() => {
    supportMapImageRef.current = supportMapImage;
    if (supportMapImage) {
      clearSelectedFeaturesCallback();
    }
  }, [supportMapImage]);

  useEffect(() => {
    if (activeView === "MAP") {
      setView(getMapView());
    } else if (activeView === "SCENE") {
      setView(getSceneView());
    }
  }, [mapView, sceneView, activeView]);

  useEffect(() => {
    if (view) {
      /** it appears that the popup object on the view does not fully hydrate until the popup has been
       * displayed - here it is shown then removed in order to hydrate the view popup object
       */
      view.openPopup();
      view.closePopup();

      setPaginationCount(0);
      setPage(0);
      setShowPopupOnMap(true);
      setUpViewClickHandler(view);
      initKeyWidgetPropsOnViewChange(view);
      setFeatureBasket([]);
      setSelectedFeatureGraphics([]);
      defaultPopupStatusForSceneViewRef.current = view.popupEnabled;
      viewRef.current = view;

      layerViewCreateHandleRef.current = view.on(
        "layerview-create",
        (event) => {
          updatePopupStatusOnLayerAdded(event);
        }
      );
      layerViewDestroyHandleRef.current = view.on(
        "layerview-destroy",
        (event) => {
          resetPopupStatusOnLayerRemoved(event);
        }
      );

      if (view.popup.features) {
        setFeatureBasket([...view.popup.features]);
      }

      /* used for flashing features */
      const graphicsLayer = new GraphicsLayer({
        title: "__flash_graphics_",
        listMode: "hide"
      });
      graphicsLayerRef.current = graphicsLayer;
      view.map.add(graphicsLayer);

      return () => {
        cleanUpOnViewSwitch();
        layerViewDestroyHandleRef.current &&
          layerViewDestroyHandleRef.current.remove();
        layerViewCreateHandleRef.current &&
          layerViewCreateHandleRef.current.remove();

        if (graphicsLayerRef.current) {
          view.map.remove(graphicsLayerRef.current);
        }
      };
    }
  }, [view]);

  useEffect(() => {
    if (featureBasket) {
      console.debug(`popup features: ${featureBasket}`);
      setSelectedFeatureGraphics(featureBasket);
    }
  }, [featureBasket]);

  useEffect(() => {
    if (featureRef.current) {
      if (selectedFeatureGraphics && selectedFeatureGraphics.length > 0) {
        featureRef.current.graphic = selectedFeatureGraphics[0];
        setPaginationCount(selectedFeatureGraphics.length);
        setFirstActiveFeatureGraphic(selectedFeatureGraphics[0]);
      } else {
        setFirstActiveFeatureGraphic(defaultActiveFeatureGraphic);
        featureRef.current.graphic = defaultActiveFeatureGraphic as any;
        setPaginationCount(0);
      }
    }
  }, [selectedFeatureGraphics]);

  useEffect(() => {
    if (
      selectedFeatureGraphics &&
      selectedFeatureGraphics.length > 0 &&
      featureRef.current
    ) {
      featureRef.current.graphic = selectedFeatureGraphics[page - 1];
    }
  }, [page]);

  useEffect(() => {
    if (featureRef.current) {
      setPage(1); //reset page
    }
  }, [firstActiveFeatureGraphic]);

  useEffect(() => {
    if (showPopupOnMap) {
      showPopupOnMapRef.current = true;
      enableMapPopup(true);
    } else {
      /* don't leave an existing popup hanging on the map when they're turned off */
      view?.closePopup();
      showPopupOnMapRef.current = false;
      enableMapPopup(false);
    }
  }, [showPopupOnMap]);

  /**
   * Initialize the Feature widget props
   * @param currentView current view
   */
  const initKeyWidgetPropsOnViewChange = (
    currentView: MapView | SceneView | undefined
  ) => {
    if (currentView && htmlDivFeatureRef?.current) {
      defaultPopupStatusForMapViewRef.current = currentView.popupEnabled;
      setPaginationCount(0);
      if (featureRef.current) {
        featureRef.current.map = currentView.map;
        featureRef.current.spatialReference = currentView.spatialReference;
      } else {
        const defaultFeature = createFeatureWidget(
          currentView,
          htmlDivFeatureRef.current
        );
        featureRef.current = defaultFeature;
      }
    }
  };

  /**
   * Create a new instance of the Feature widget
   * @param view the current map view
   * @param container the HTML element where the card should be positioned
   * @returns a new Feature widget
   */
  const createFeatureWidget = (
    view: MapView | SceneView,
    container: HTMLDivElement
  ): Feature | undefined => {
    const defaultFeature = new Feature({
      graphic: defaultActiveFeatureGraphic,
      map: view.map,
      spatialReference: view.spatialReference,
      container: container,
      defaultPopupTemplateEnabled: true,
    });
    return defaultFeature;
  };

  /**
   * Support some map image and group layer by iterating thru nested layers which does not appear to be supported
   * by the out of the box Feature widget
   * @param currentView current view
   * @param screenPoint x,y click point in screen coordinates
   */
  const queryAllVisibleMapLayers = (currentView: any, screenPoint: any) => {
    currentView.map.allLayers.forEach((layer: any) => {
      if (layer.type === "image" || (layer.type === "wfs" && layer.visible)) {
        currentView.whenLayerView(layer).then((layerView: any) => {
          if (layer.capabilities?.operations?.supportsQuery) {
            executeSpatialQuery(currentView, layerView, screenPoint);
          }
        });
      } else if (layer.sublayers?.items) {
        const sublayers = layer.sublayers.items;
        sublayers.forEach((sublayer: any) => {
          if (sublayer.capabilities?.operations?.supportsQuery) {
            executeSpatialQuery(currentView, sublayer, screenPoint);
          }
        });
      }
    });
  };

  /**
   * Query layer for features that intersect the current screen point after it is converted to map coordinates
   * @param currentView current sceneview or mapview
   * @param layer layer to query
   * @param screenPoint x,y click point in screen coordinates
   */
  const executeSpatialQuery = async (
    currentView: SceneView | MapView,
    layer: any,
    screenPoint: any
  ) => {
    if (layer && currentView) {
      const expandedExtent = BuildMapExtentFromScreenPoint(
        currentView,
        screenPoint
      );
      expandedExtent &&
        layer
          .queryFeatures({
            geometry: expandedExtent as Geometry,
            spatialRelationship: "intersects",
            outFields: ["*"],
            returnGeometry: false,
          })
          .then((fset: FeatureSet) => {
            if (fset && fset.features && fset.features.length > 0) {
              setFeatureBasket([...featureBasket, ...fset.features]);
            }
          })
          .catch((err: Error) => {
            console.error(err);
            setFeatureBasket([]);
          });
    } else {
      console.error(
        `Error with layer: ${layer} or view: ${currentView}. Failed to generate a query extent.`
      );
    }
  };

  /**
   * Get state value from within a closure
   * @returns true if suppoting map image layers otherwise false
   */
  function getMapImageSupport() {
    if (supportMapImageRef?.current) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Check any layers added to the map for popup support and set their popup enabled to false if showPopupOnMap is
   * set to false and the layer supports popups - then add the layer name and default popup enabled status
   * to a collection
   * @param event layer view created event
   */
  function updatePopupStatusOnLayerAdded(
    event: __esri.ViewLayerviewCreateEvent
  ) {
    if (event.layer && layersPopupStatusMapRef.current) {
      const popupLayer = event.layer as PopupSupportedLayer;
      if (popupLayer) {
        layersPopupStatusMapRef.current.set(
          event.layer.title,
          popupLayer.popupEnabled
        );
        popupLayer.popupEnabled = showPopupOnMapRef.current;
      }
    }
  }

  /**
   * When layers are removed from the map check to see if it is in the collection of layers whose popup enabled
   * status has been updated and if so reset the status back to its original setting
   * @param event layer view destroy event
   */
  const resetPopupStatusOnLayerRemoved = (
    event: __esri.ViewLayerviewDestroyEvent
  ) => {
    if (event.layer && layersPopupStatusMapRef.current) {
      const popupStatus = layersPopupStatusMapRef.current.get(
        event.layer.title
      );
      const popupLayer = event.layer as PopupSupportedLayer;
      if (popupStatus !== undefined && popupLayer) {
        popupLayer.popupEnabled = popupStatus;
      }
    }
  };

  /**
   * Iterate thru all map layers and update popupEnabled if the layer supports popups optionally add
   * the layer name and default popup enabled status to a collection of layer names whose popups have been updated
   * @param popupEnabled set popup state to this value
   * @param captureState if true add the layer name and default state to a collection
   */
  function enableMapPopup(
    popupEnabled: boolean,
    captureState: boolean = false
  ) {
    if (view) {
      view.map.allLayers.forEach((layer: any) => {
        const popupLayer = layer as PopupSupportedLayer;
        if (popupLayer && layersPopupStatusMapRef.current) {
          //save the default popup state so it can be reset later on widget unload
          if (captureState) {
            layersPopupStatusMapRef.current?.set(
              popupLayer.title,
              popupLayer.popupEnabled
            );
          }
          popupLayer.popupEnabled = popupEnabled;
        }
      });
      view.popupEnabled = popupEnabled;
    }
  }

  /**
   * On load all layer popups are enabled and subsequently can be toggled on/off, this method called
   * on unload resets the layers popup status back to the default setting on the layer
   */
  const resetLayerPopupStatusOnWidgetUnload = () => {
    if (viewRef.current) {
      viewRef.current.map.allLayers.forEach((layer: any) => {
        const popupLayer = layer as PopupSupportedLayer;
        if (popupLayer) {
          const popupStatus = layersPopupStatusMapRef.current?.get(
            popupLayer.title
          );
          if (popupStatus !== undefined) {
            popupLayer.popupEnabled = popupStatus;
          }
        }
      });
    }
  };

  /**
   * Handle a change on the map's highlighted features
   * @param selected oids of highlighted features
   * @param selectedContextLayer layer to which the highlighted features belong - comes from the SelectionContext
   */
  const selectedFeaturesChanged = (
    selected: number[],
    selectedContextLayer: __esri.Layer | undefined
  ) => {
    const layer = selectedContextLayer as
      | FeatureLayer
      | SceneLayer
      | GeoJSONLayer
      | CSVLayer
      | WFSLayer;
    if (layer && selected.length > 0) {
      const query = layer.createQuery(); // Includes any existing definitionExpression
      query.objectIds = selected;
      query.returnGeometry = true;
      layer.queryFeatures(query).then((featureSet: FeatureSet) => {
        setFeatureBasket(featureSet.features);
      });
    } else {
      setFeatureBasket([]);
    }
  };

  /**
   * Clear the baseball card items when the layer changes and confirm that the layer's geometry type supports
   * flashing - point, polygon, polyline
   * @param selectedContextLayer layer selected in the SelectionContext
   */
  const selectedLayerChanged = (selectedContextLayer: __esri.Layer | undefined) => {
    setFeatureBasket([]);
    const anySelectedLayer = selectedContextLayer as any;
    if (
      anySelectedLayer &&
      anySelectedLayer.geometryType &&
      ['point', 'polygon', 'polyline'].includes(anySelectedLayer.geometryType) 
    ) {
      setCanShowFlashButton(true);
    } else {
      setCanShowFlashButton(false);
    }
  };

  /**
   * Set click event on the current map view.
   * @param view the current map view
   */
  const setUpViewClickHandler = async (view: any) => {
    if (view) {
      if (!layersPopupStatusMapRef.current) {
        layersPopupStatusMapRef.current = new Map<string, boolean>();
        enableMapPopup(true, true);
      }

      view.popupEnabled = true; //always turn on popups when the widget is called up
      viewClickHandleRef.current = view.on("click", async (event: any) => {
        const supportMapImageLayers = getMapImageSupport();
        if (supportMapImageLayers) {
          /* 
            NOTE: fetchFeatures seems to need the popup to show at least once 
            before it is hydrated - not sure why.
            These features are fetched from all of the LayerViews in the view. 
            In order to use this, a layer must already have an associated PopupTemplate and 
            have its popupEnabled. 
        */
          const graphicsResponse = await view.popup.fetchFeatures(event);
          const graphics = await graphicsResponse.allGraphicsPromise;

          const filteredGraphics = graphics?.filter((graphic: Graphic) => {
            if (graphic.layer) {
              //only show graphics for visible layers
              return graphic.layer.visible;
            }
            return true;
          });

          if (filteredGraphics && filteredGraphics.length > 0) {
            setFeatureBasket([...filteredGraphics]);
          }
        }
      });
    }
  };

  /**
   * Handle the click event on the pagination for the Feature widget.
   * @param event Feature widget pagination change
   * @param value current page index
   */
  const handleFeaturePaginationChange = (
    event: React.ChangeEvent<any>,
    value: number
  ) => {
    setPage(value);
  };

  /**
   * Cleanup resouces when switching between 2D and 3D views.
   */
  const cleanUpOnViewSwitch = () => {
    if (mapView) {
      if (defaultPopupStatusForMapViewRef.current !== undefined) {
        mapView.popupEnabled = defaultPopupStatusForMapViewRef.current;
      }
    }
    if (sceneView) {
      if (defaultPopupStatusForSceneViewRef.current !== undefined) {
        sceneView.popupEnabled = defaultPopupStatusForSceneViewRef.current;
      }
    }
    if (viewClickHandleRef.current) {
      viewClickHandleRef.current.remove();
    }
  };

  /**
   * Handler for checkbox indicating if map image layers should be supported
   * @param event checkbox checked event
   */
  const supportMapImageChangeHandler = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSupportMapImage(event.target.checked);
  };

  /**
   * Handler for checkbox indicating if popups should be displayed on the map
   * @param event checkbox checked event
   */
  const showPopupOnMapChangeHandler = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setShowPopupOnMap(event.target.checked);
  };

  /**
   * zoom the map to the current baseball card item
   */
  const zoomToCurrentItem = () => {
    zoomToFeatures(featureBasket);
  };

  /**
   * Zoom the map to the current baseball card item or to the extent of all the items
   * in the baseball card array/selection
   * @param zoomToExtentOfSelections if true zoom to the extent of the highlighted features otherwise
   * zoom only to the current baseball card item - defaults to false (current item only)
   */
  const zoomToFeatures = (
    featureOIDs: number[],
    zoomToExtentOfHightlightedFeatures: boolean = false
  ) => {
    if (view) {
      const options = {
        speedFactor: panningSpeed,
      };

      let features: any[] = [];
      if (zoomToExtentOfHightlightedFeatures) {
        features = featureOIDs;
      } else {
        features = [featureOIDs[page - 1]];
      }
      if (features) {
        view
          .goTo(features, options)
          .then(() => {
            // goTo tends to just pan the map if the view is zoomed out really far and the geometry is a single point
            if (
              features[0].geometry.type === "point" &&
              features.length === 1
            ) {
              const scale = Math.floor(view.scale / 2);
              view.scale = scale;
            }
          })
          .catch((error) => {
            console.error("Error zooming to feature.", error);
          });
      }
    }
  };

  /**
   * Create a polyline graphic
   * @param geometry polyline geometry to use for the graphic
   * @param fillColor graphic's fill color [R,G,B]
   * @returns a graphic or undefined
   */
  const createPolylineGraphic = (geometry: Polyline, fillColor: number[]): Graphic | undefined => {
    let lineGraphic;
    if (!geometry) {
      return lineGraphic;
    }
    const clonedGeometry = geometry.clone();
    const polyline = {
      type: "polyline",
      paths: clonedGeometry.paths,
    };
    const polylineGraphic = {
      type: "simple-line",
      color: fillColor,
      width: 6,
    };
    lineGraphic = new Graphic({
      geometry: polyline as Polyline,
      symbol: polylineGraphic,
    });
    return lineGraphic;
  };

  /**
   * Create a simple-marker graphic
   * @param geometry point geometry to use for the graphic
   * @param color graphic's fill and outline color [R,G,B]
   * @returns a graphic or undefined
   */
  const createPointGraphic = (
    geometry: Point,
    color: number[]
  ): Graphic | undefined => {
    let pointGraphic;
    const point = {
      type: "point",
      x: geometry.longitude,
      y: geometry.latitude,
    };
    const markerSymbol = {
      type: "simple-marker",
      color: color,
      outline: {
        color: color,
        width: 6,
      },
    };
    if (point) {
      pointGraphic = new Graphic({
        geometry: point as Geometry,
        symbol: markerSymbol,
      });
    }
    return pointGraphic;
  };

  /**
   * Create a simple-fill graphic
   * @param geometry polygon geometry to use for the graphic
   * @param fillColor graphic's fill color [R,G,B]
   * @returns a graphic or undefined
   */
  const createPolygonGraphic = (
    geometry: Polygon,
    fillColor: number[]
  ): Graphic | undefined => {
    let polygonGraphic;
    if (geometry) {
      const clonedGeom = geometry.clone();
      //graphic layer does not handle complex geometries
      const simpleGeom = geometryEngine.simplify(clonedGeom);
      const polygon = {
        type: "polygon",
        rings: (simpleGeom as Polygon).rings,
      };
      const fillSymbol = {
        type: "simple-fill",
        color: fillColor,
        width: 2,
      };
      polygonGraphic = new Graphic({
        geometry: polygon as Geometry,
        symbol: fillSymbol,
      });
    }
    return polygonGraphic;
  };

  /**
   * Handle the flash icon button click
   */
  const flashBaseballCardClickHandler = () => {
    const graphicsLayer = flashBaseballCardCurrentFeature(
      featureBasket[page - 1],
      flashGraphicColor,
      graphicsLayerRef.current,
      view
    );
    if (!graphicsLayerRef.current && graphicsLayer) {
      graphicsLayerRef.current = graphicsLayer;
    }
  };

  /**
   * Create a graphic and show it in a graphics layer (create the graphic layer if it does not exist) and then
   * dispose graphic and return the layer back to the caller.
   * @param featureToFlash feature to flash
   * @param graphicColor fill and outline color for the graphic [R,G,B]
   * @param graphicsLayer - may be undefined
   * @param currentView the current view
   */
  const flashBaseballCardCurrentFeature = (
    featureToFlash: any,
    graphicColor: number[],
    graphicsLayer: GraphicsLayer | undefined,
    currentView: MapView | SceneView | undefined
  ): GraphicsLayer | undefined => {
    let graphicToFlash;
    if (featureToFlash && featureToFlash.geometry) {
      try {
        if (featureToFlash.geometry.type === "point") {
          graphicToFlash = createPointGraphic(
            featureToFlash.geometry,
            graphicColor
          );
        } else if (featureToFlash.geometry.type === "polyline") {
          graphicToFlash = createPolylineGraphic(
            featureToFlash.geometry,
            graphicColor
          );
        } else if (featureToFlash.geometry.type === "polygon") {
          graphicToFlash = createPolygonGraphic(
            featureToFlash.geometry,
            graphicColor
          );
        } else {
          console.warn(
            "This geometry type is not supported when flashing: " +
              featureToFlash.geometry.type
          );
        }
      } catch (error) {
        console.error("Error creating flash graphic.", error);
      }

      if (graphicToFlash) {
        if (graphicsLayer) {
          graphicsLayer.add(graphicToFlash);
        } else {
          graphicsLayer = new GraphicsLayer({
            title: "__flash_graphics_",
          });
          currentView?.map.add(graphicsLayer);
        }

        setTimeout(() => {
          graphicsLayer?.removeAll();
        }, 2000);
      } else {
        console.warn("Failed to create a flash graphic.");
      }
    } else {
      console.debug(
        "Failed to flash feature. Missing feature or missing feature geometry. Feature:  ",
        featureToFlash
      );
    }
    return graphicsLayer;
  };

  return (
    <Fragment>
      <StyledRootWidgetBox>
        <div>
          {featureBasket && featureBasket.length > 0 && (
            <>
              <IconButton
                onClick={zoomToCurrentItem}
                title="Zoom to current card item."
              >
                <MagnifyGlassPlusIcon size={24} />
              </IconButton>
              {canShowFlashButton && (
                <StyledFlashIconButton
                  onClick={flashBaseballCardClickHandler}
                  title="Flash the current card item."
                >
                  <FlashIcon size={24} />
                </StyledFlashIconButton>
              )}
            </>
          )}
          <FormControlLabel
            control={
              <Switch
                checked={showPopupOnMap}
                title={"Check to show popups on the map for configured layers."}
                onChange={showPopupOnMapChangeHandler}
              />
            }
            label={"Show popup on map."}
          />
          <FormControlLabel
            control={
              <Switch
                title={"Check to support map image layers."}
                checked={supportMapImage}
                onChange={supportMapImageChangeHandler}
              />
            }
            label="Support map image layers."
          />
        </div>

        <StyledBBCardWidgetBox>
          <div ref={htmlDivFeatureRef}></div>
        </StyledBBCardWidgetBox>

        <StyledPaginationBox>
          {paginationCount > 1 && (
            <Pagination
              count={paginationCount}
              page={page}
              onChange={handleFeaturePaginationChange}
            />
          )}
        </StyledPaginationBox>
      </StyledRootWidgetBox>
    </Fragment>
  );
};