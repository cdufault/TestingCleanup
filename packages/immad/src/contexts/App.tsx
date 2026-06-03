import React, { createContext } from 'react';
import PortalUser from '@arcgis/core/portal/PortalUser';

export interface AppProviderProps {
    children: JSX.Element[] | JSX.Element;
    portalUser: PortalUser;
    userRoles: UserRoles;
}

interface ContextProps {
    portalUser: PortalUser;
    userRoles: UserRoles;
}

// main application context
export const AppContext = createContext<ContextProps>({
    portalUser: new PortalUser(),
    userRoles: {
        Administrator: false,
        MissionManager: false,
        Analyst: false,
    },
});

// main application provider
export const AppProvider = ({ children, portalUser, userRoles }: AppProviderProps): JSX.Element => {
    const value = {
        portalUser,
        userRoles,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export interface UserRoles {
    Administrator: UserRoleStatus;
    MissionManager: UserRoleStatus;
    Analyst: UserRoleStatus;
}

export type UserRoleStatus = true | 'INSUFFICIENT_PRIVILIGES' | false;
