import EsriSearch from "@arcgis/core/widgets/Search";
import SearchSource from "@arcgis/core/widgets/Search/SearchSource";
import LayerSearchSource from "@arcgis/core/widgets/Search/LayerSearchSource";
import LocatorSearchSource from "@arcgis/core/widgets/Search/LocatorSearchSource";
import MapView from "@arcgis/core/views/MapView";
import SceneView from "@arcgis/core/views/SceneView";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import MapImageLayer from "@arcgis/core/layers/MapImageLayer";

/**
 * Interface for parameters passed into the search tool.
 */ export interface searchConfig {
  includeGeocoder: boolean;
  name: string;
  allPlaceholder: string;
  geocoderUrl: string;
  position:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "manual"
    | "bottom-leading"
    | "bottom-trailing"
    | "top-leading"
    | "top-trailing"
    | undefined;
  minSuggestCharacters: number; // minimum characters to start showing suggestions
}

/**
 * Initialize the search tool and place it on the map.
 * This initializes the Search tool with the geocoder from the config
 * as well as all feature layers currently on the map.
 * @param view
 * @param searchConfig
 */
export async function initSearch(
  view: MapView | SceneView,
  searchConfig: searchConfig
) {
  if (view) {
    const sources = await getSources(view, searchConfig);
    const esriSearch = new EsriSearch({
      view: view,
      sources: sources,
      includeDefaultSources: false,
      allPlaceholder: searchConfig.allPlaceholder,
      minSuggestCharacters: 1,
    });
    view.ui.add({
      component: esriSearch,
      position: searchConfig.position,
      index: 0,
    });
    (view as any).searchWidget = esriSearch;
  }
}

/**
 * Builds an array of SearchSources based on the layers loaded on the map.
 * Currently only includes the default geocoder and Feature Layers.
 * Additional layer types to be added in the future
 * @param view
 * @param searchConfig
 */
export async function getSources(
  view: MapView | SceneView,
  searchConfig: searchConfig
): Promise<SearchSource[]> {
  const sources: SearchSource[] = [];
  const layerSources: LayerSearchSource[] = [];
  if (searchConfig.includeGeocoder) {
    sources.push(
      new LocatorSearchSource({
        name: searchConfig.name,
        placeholder: searchConfig.allPlaceholder,
        url: searchConfig.geocoderUrl,
        maxResults: 10,
        maxSuggestions: 10,
        minSuggestCharacters: 1,
      })
    );
  }

  const mapLayerSources = view.map.allLayers.toArray();
  for (const mapLayer of mapLayerSources) {
    await mapLayer.load().then(async () => {
      if (mapLayer.type === "map-image") {
        const mapImageLayer = mapLayer as MapImageLayer;
        if (mapImageLayer.sublayers.length) {
          for (const mapServiceLayer of mapImageLayer.sublayers) {
            const fieldNames: string[] = [];
            if (mapServiceLayer.fields) {
              for (const field of mapServiceLayer.fields) {
                if (field.type === "string") fieldNames.push(field.name);
              }
            }
            const mapServiceFeatureLayer =
              await mapServiceLayer.createFeatureLayer();
            sources.push(
              new LayerSearchSource({
                exactMatch: false,
                placeholder: searchConfig.allPlaceholder,
                layer: mapServiceFeatureLayer,
                maxResults: 10,
                maxSuggestions: 10,
                name: mapServiceLayer.title,
                searchFields: fieldNames,
                outFields: ["*"],
                minSuggestCharacters: 1,
              })
            );
          }
        }
      }

      if (mapLayer.type === "feature") {
        const mapFeatureLayer = mapLayer as FeatureLayer;
        const fieldNames: string[] = [];
        if (mapFeatureLayer.fields) {
          for (const field of mapFeatureLayer.fields) {
            if (field.type === "string") fieldNames.push(field.name);
          }
        }
        sources.push(
          new LayerSearchSource({
            exactMatch: false,
            placeholder: searchConfig.allPlaceholder,
            layer: mapFeatureLayer,
            maxResults: 10,
            maxSuggestions: 10,
            name: mapFeatureLayer.title,
            searchFields: fieldNames,
            outFields: ["*"],
            minSuggestCharacters: 1,
          })
        );
      }
    });
  }

  return sources;
}

/**
 *
 * @param view the MapView or SceneVIew
 * @param searchConfig
 */
export async function updateSearchSources(
  view: MapView | SceneView,
  searchConfig: searchConfig
): Promise<void> {
  const searchWidget = (view as any).searchWidget || null;
  const sources = await getSources(view, searchConfig);
  if (searchWidget) {
    console.debug("search widget found:", searchWidget);
    searchWidget.sources = sources;

    // force the widget to refresh
    view.ui.remove(searchWidget);
    view.ui.add({ component: searchWidget, position: "top-left", index: 0 });
    (view as any).searchWidget = searchWidget;
  }
}
