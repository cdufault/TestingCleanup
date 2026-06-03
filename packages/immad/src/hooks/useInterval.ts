import { useEffect, useRef } from 'react';

export function useInterval(callback: () => void, delay: number, isActive?: boolean): void {
    const savedCallback = useRef(callback);
    const id = useRef<number>();

    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        function tick() {
            savedCallback.current();
        }
        if (delay && isActive) {
            tick();
            id.current = setInterval(tick, delay);
            return () => {
                clearInterval(id.current);
            };
        } else if (!isActive && id.current) {
            clearInterval(id.current);
        }
    }, [callback, delay, isActive]);
}
