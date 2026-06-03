import MapView from '@arcgis/core/views/MapView';
import SceneView from '@arcgis/core/views/SceneView';
import WebScene from '@arcgis/core/WebScene';

/**
 * Describes components of the state for the view
 */
export interface ViewState {
    /**Portal item for the webscene */
    portalItemId: string;

    /**Current view object */
    currentView: SceneView | MapView;

    /**Current web scene */
    currentWebScene: WebScene | undefined;
}

/**Utility class to cache a copy of the data related to the view */
export class StaticViewState {
    static viewState: ViewState;
    static cache = new Map<string, ViewState>();

    /**Return the view state object */
    static getViewState(): ViewState {
        return this.viewState;
    }

    /**
     * Cache a copy of the view state into a map with the webscene portal id as the key
     * @param state the view state object
     */
    static updateViewState(state: ViewState, viewType: string): void {
        this.cache.set(state.portalItemId + '_' + viewType, state);
        this.viewState = state;
    }

    /**
     * Given a portal item id find a view state object in the map with the same key
     * @param portalItemId id of the portal item id for the webscene
     */
    static getCachedView(portalItemId: string, viewType: string): ViewState | undefined {
        const key = portalItemId + '_' + viewType;
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        return undefined;
    }
}
