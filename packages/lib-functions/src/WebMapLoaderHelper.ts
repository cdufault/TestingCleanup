import Camera from '@arcgis/core/Camera';
import { Point } from '@arcgis/core/geometry';
// @ts-ignore
import { getWebGLCapabilities, check } from "@arcgis/core/views/webgl/capabilities";
import SceneView from "@arcgis/core/views/SceneView";
import WebScene from "@arcgis/core/WebScene";

/**
 * creates a target geometry point from a camera object.
 * @param camera
 */
export function getTargetGeometry(camera: Camera): __esri.Point {
    //Create a new Point geometry object for camera's position
    const cameraPoint = new Point({
        x: camera.position.x,
        y: camera.position.y,
        spatialReference: {
            wkid: camera.position.spatialReference.wkid,
        },
    });

    // Calculate target point based on heading and tilt values
    const offsetX = Math.sin(camera.heading) * Math.cos(camera.tilt);
    const offsetY = Math.cos(camera.heading) * Math.cos(camera.tilt);
    const offsetZ = -Math.sin(camera.tilt);

    const targetX = cameraPoint.x + offsetX;
    const targetY = cameraPoint.y + offsetY;
    return new Point({
        x: targetX,
        y: targetY,
        z: offsetZ,
        spatialReference: {
            wkid: camera.position.spatialReference.wkid,
        },
    });
}


/**
 * WebGL Support Information object. Returns information about the browser's WebGL support level.
 */
export interface WebGL3DSupportInfo
{
    isWebGLSupported : boolean | undefined;
    resultMessage : string;
}

/**
 * Get the WebGL 3D support information for the current browser.
 * This function returns a WebGL3DSupportInfo object with the WebGL support status information.
 */
export function getWebGL3DSupportInfo(): WebGL3DSupportInfo {
    const webgl : any = getWebGLCapabilities();

    if(!webgl.available) {
        return {
            isWebGLSupported : false,
            resultMessage: "WebGL2 is required but not supported."
        } as WebGL3DSupportInfo;
    }

    if(webgl.majorPerformanceCaveat) {
        return {
            isWebGLSupported : false,
            resultMessage: "Your WebGL implementation doesn't seem to support hardware accelerated rendering."
        } as WebGL3DSupportInfo;
    }

    if(!webgl.supportsHighPrecisionFragment) {
        return {
            isWebGLSupported : false,
            resultMessage: "WebGL support for high precision fragment shaders is required but not supported."
        } as WebGL3DSupportInfo;
    }

    if(!webgl.supportsVertexShaderSamplers) {
        return {
            isWebGLSupported : false,
            resultMessage: "WebGL support for vertex shader samplers is required but not supported."
        } as WebGL3DSupportInfo;
    }

    return {
        isWebGLSupported : true,
        resultMessage: ""
    } as WebGL3DSupportInfo;
}