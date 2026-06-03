import { useLayoutEffect, useRef } from 'react';
import { withRouter } from 'react-router-dom';

const RefreshListener = withRouter(({ location }) => {
    const previousPath = useRef(location.pathname);

    useLayoutEffect(() => {
        // When transitioning from '/administrator' to '/'
        if (previousPath.current === '/administrator' && location.pathname === '/') {
            window.location.reload();
        }
        previousPath.current = location.pathname;
    }, [location.pathname]);

    return null;
});

export default RefreshListener;
