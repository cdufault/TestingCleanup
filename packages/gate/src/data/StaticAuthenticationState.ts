import { UserSession } from '@esri/arcgis-rest-auth';
import Portal from '@arcgis/core/portal/Portal';

/**
 * The interface to define what is held in the
 * AuthenticationState object.
 */
export interface AuthenticationState {
    userSessionState: UserSession;
    portalState: Portal;
}

/**Utility class to cache a copy of the arcgis/core/portal/Portal object and
 * the esri/arcgis-rest-auth UserSession object
 * */
export class StaticAuthenticationState {
    static authenticationState: AuthenticationState = <AuthenticationState>{};

    /**Return the userSession object */
    static getUserSessionState() {
        return this.authenticationState.userSessionState;
    }

    /**Set the UserSession Object as state */
    static setUserSessionState(state: UserSession) {
        this.authenticationState.userSessionState = state;
    }

    /**Set the Portal Object as state */
    static setPortalState(state: Portal) {
        this.authenticationState.portalState = state;
    }

    /**Return the Portal object */
    static getPortalState() {
        return this.authenticationState.portalState;
    }

    /**Return the full authenticationState object */
    static getAuthenticationState() {
        return this.authenticationState;
    }
}
