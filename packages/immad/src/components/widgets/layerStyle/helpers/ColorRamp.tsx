import React, { useEffect, useRef } from 'react';
import colorRamps = require('@arcgis/core/smartMapping/symbology/support/colorRamps');

interface ColorRampProps {
    rampName: string;
}

const ColorRamp = (props: ColorRampProps): JSX.Element => {
    const { rampName } = props;
    const canvasRef = useRef(null);
    useEffect(() => {
        const colors = colorRamps.byName(rampName).colors;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        for (let i = 0; i < 6; i++) {
            context.fillStyle = colors[i];
            context.fillRect(i * 25, 0, 25, 35);
        }
    }, []);

    return <canvas ref={canvasRef} height='35' width='150' />;
};

export default ColorRamp;
