/**
 * This set of tests prototypes test that call the ArcGIS Rest API
 */

import { addSelectionHandlersToView } from './mapHelper';
import { SelectionMode } from '../contexts/FeatureSelectionContext';

import MapView from '@arcgis/core/views/MapView';

const mock_on = jest.fn();
const mock_hitTest = jest.fn();

jest.mock('@arcgis/core/views/MapView', () => {
    return jest.fn().mockImplementation(() => {
        return {
            on: mock_on,
            hitTest: mock_hitTest,
        };
    });
});

function handleSelectFeatures(
    view: __esri.MapView | __esri.SceneView,
    layer: __esri.Layer,
    ids: number[],
    selectionMode?: SelectionMode
) {
    console.log(
        `select features - view: ${view.type} layer: ${layer.title} ids: ${JSON.stringify(
            ids
        )} selectionMode: ${selectionMode}`
    );
}

function handleClearSelection() {
    console.log('clear selection');
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('helpers/mapHelper', () => {
    test('Add click and key Handlers to View', async () => {
        const mapView = new MapView();

        addSelectionHandlersToView(
            mapView,
            () => SelectionMode.NewSelectionSet,
            (mode) => mode,
            handleSelectFeatures,
            handleClearSelection
        );

        expect(mock_on).toHaveBeenCalledTimes(3);
        expect(mock_on).toHaveBeenNthCalledWith(1, 'click', expect.any(Function));
        expect(mock_on).toHaveBeenNthCalledWith(2, 'key-up', expect.any(Function));
        expect(mock_on).toHaveBeenNthCalledWith(3, 'key-down', expect.any(Function));
    });
});
