export interface LayerDefinitionType {
    layerDefinition: {
        drawingInfo: {
            renderer: {
                type: string;
                stretchType: string;
                colorRamp: ColorRampType;
            };
        };
    };
}

export interface ColorRampType {
    type: string;
    colorRamps: ColorRamp[];
}

export interface ColorRamp {
    type: string;
    algorithm: string;
    fromColor: number[];
    toColor: number[];
}
