import { useEffect, useState } from 'react';

import { AuthenticationState, StaticAuthenticationState } from '../data/StaticAuthenticationState';

/**
 * Retrieves the individual authentication state objects that are stored within.
 * This hook allows the user to get the  arcgis/core/portal/Portal object and
 * the esri/arcgis-rest-auth UserSession object stored when the application first
 * logs in. NOTE: This hook is not made to set but only get the current sessions items
 * */
export function useStaticAuthenticationState() {
    const [authenticationState, setAuthenticationState] = useState<AuthenticationState>();

    function getUserSessionState() {
        return StaticAuthenticationState.getUserSessionState();
    }

    function getPortalState() {
        return StaticAuthenticationState.getPortalState();
    }

    useEffect(() => {
        if (!authenticationState) {
            const authState = StaticAuthenticationState.getAuthenticationState();
            setAuthenticationState(authState);
        }
    }, []);
    return {
        getPortalState: getPortalState,
        getUserSessionState: getUserSessionState,
    };
}
