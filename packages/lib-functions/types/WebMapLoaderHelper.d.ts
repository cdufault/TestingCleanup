import Camera from '@arcgis/core/Camera';
/**
 * creates a target geometry point from a camera object.
 * @param camera
 */
export declare function getTargetGeometry(camera: Camera): __esri.Point;
/**
 * WebGL Support Information object. Returns information about the browser's WebGL support level.
 */
export interface WebGL3DSupportInfo {
    isWebGLSupported: boolean | undefined;
    resultMessage: string;
}
/**
 * Get the WebGL 3D support information for the current browser.
 * This function returns a WebGL3DSupportInfo object with the WebGL support status information.
 */
export declare function getWebGL3DSupportInfo(): WebGL3DSupportInfo;
