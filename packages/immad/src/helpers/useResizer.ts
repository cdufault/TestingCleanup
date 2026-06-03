import React, { useState, useLayoutEffect } from 'react';

import useResizeObserver from '@react-hook/resize-observer';

const useResizer = (target: React.RefObject<HTMLDivElement>): DOMRectReadOnly | undefined => {
    const [size, setSize] = useState<DOMRectReadOnly | undefined>(undefined);
    useLayoutEffect(() => {
        if (target && target.current) {
            setSize(target.current.getBoundingClientRect());
        }
    }, [target]);
    useResizeObserver(target.current, (entry) => setSize(entry.contentRect));
    return size;
};

export default useResizer;
