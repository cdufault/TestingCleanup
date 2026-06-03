import SearchSource from "@arcgis/core/widgets/Search/SearchSource";
import MapView from "@arcgis/core/views/MapView";
import SceneView from "@arcgis/core/views/SceneView";
/**
 * Interface for parameters passed into the search tool.
 */ export interface searchConfig {
    includeGeocoder: boolean;
    name: string;
    allPlaceholder: string;
    geocoderUrl: string;
    position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "manual" | "bottom-leading" | "bottom-trailing" | "top-leading" | "top-trailing" | undefined;
    minSuggestCharacters: number;
}
/**
 * Initialize the search tool and place it on the map.
 * This initializes the Search tool with the geocoder from the config
 * as well as all feature layers currently on the map.
 * @param view
 * @param searchConfig
 */
export declare function initSearch(view: MapView | SceneView, searchConfig: searchConfig): Promise<void>;
/**
 * Builds an array of SearchSources based on the layers loaded on the map.
 * Currently only includes the default geocoder and Feature Layers.
 * Additional layer types to be added in the future
 * @param view
 * @param searchConfig
 */
export declare function getSources(view: MapView | SceneView, searchConfig: searchConfig): Promise<SearchSource[]>;
/**
 *
 * @param view the MapView or SceneVIew
 * @param searchConfig
 */
export declare function updateSearchSources(view: MapView | SceneView, searchConfig: searchConfig): Promise<void>;
