import { Geometry } from '@arcgis/core/geometry';
import MapView from '@arcgis/core/views/MapView';
import SceneView from '@arcgis/core/views/SceneView';
/**
 * Add a small extent around the clicked point to help with the spatial query
 * @param currentView current sceneview or mapview
 * @param screenPoint clicked location on the map in screen coordinates NOTE: a point feature converted with view.toScreen()
 * may not work in a 3D environment
 * @param expandFactor the factor by which the default click point's bounding box (pixelDistance) should be
 * expanded,  defaults to 2
 * @param pixelDistance base bounding box size in pixels around the screen click point, defaults to 3 which creates
 * a 7 x 7 sq pixel block (3 to the right, top, left, bottom of the click point)
 * @returns undefined or an extent Geometry based on input screen point
 */
export declare function BuildMapExtentFromScreenPoint(currentView: MapView | SceneView, screenPoint: any, expandFactor?: number, pixelDistance?: number): Geometry | undefined;
