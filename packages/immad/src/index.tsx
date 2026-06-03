import React from 'react';
import * as ReactDOM from 'react-dom/client';
import esriConfig from '@arcgis/core/config';

import Main from './components/main';
import { AppProvider, UserRoles } from './contexts/App';
import { InitializationFailed } from './components/alerts';
import { ConfigHelper } from './helpers/configHelper';
import { loadPortalUser } from '@stratcom/lib-functions';
import { getRoleStatus } from './helpers/userHelper';
import { Provider } from 'react-redux';
import { store } from './data/store';
import { setWholeApplicationConfig } from './ApplicationSlice';
import {
    updateImmadAdminUserNames,
    updateImmadMMgrsUserNames,
} from './components/home/components/missionCreate/MissionCreationSlice';
import { getMMgrAndAdminUserNames } from './hooks/missionHooks';
import {
    setRMTData,
    setGateApplicationId,
    updateSavedStateConfig,
    setRMTMessageTable,
} from './components/administrator/components/AdminSettingsSlice';

async function loadConfigs() {
    const appConfig = await ConfigHelper.loadAppConfig();
    if (!appConfig) throw new Error('App Config did not load correctly.');

    const portalConfig = await ConfigHelper.loadAppConfigFromPortal();
    if (!portalConfig) console.warn('No portal config found. Please set it in settings.');

    store.dispatch(setWholeApplicationConfig(appConfig));

    if (portalConfig) {
        store.dispatch(setRMTData(portalConfig.rmtData ?? ''));
        store.dispatch(updateSavedStateConfig(portalConfig.savedState ?? { itemId: '' }));
        store.dispatch(setGateApplicationId(portalConfig.gateAppPortalItemId ?? ''));
        store.dispatch(setRMTMessageTable(portalConfig.rmtMessageTableId ?? ''));

        if (!portalConfig.gateAppPortalItemId) {
            console.warn('No GATE application portal item ID found in the portal config. Check admin settings.');
        }
        if (!portalConfig.savedState || portalConfig.savedState.itemId === '') {
            console.warn('No GATE Saved State item ID found in the portal config. Check admin settings.');
        }
    }

    return { appConfig, portalConfig };
}

function configureEsri(appConfig: any) {
    esriConfig.portalUrl = appConfig.portalUrl;
    esriConfig.assetsPath = './assets';
    esriConfig.kmlServiceUrl = `${appConfig.portalUrl}/sharing/kml`;
}

async function fetchUserRoles(appConfig: any, portalUser: any): Promise<UserRoles> {
    const { admin, missionManager, analyst } = appConfig.roles;
    const [Administrator, MissionManager, Analyst] = await Promise.all([
        getRoleStatus(portalUser, admin.tag, admin.privileges),
        getRoleStatus(portalUser, missionManager.tag, missionManager.privileges),
        getRoleStatus(portalUser, analyst.tag, analyst.privileges),
    ]);

    return { Administrator, MissionManager, Analyst };
}

async function fetchAndStoreUserLists() {
    const result = await getMMgrAndAdminUserNames();

    const uniqueAdmins = Array.from(new Set([...result.admins.users, result.admins.owner, ...result.admins.admins]));
    store.dispatch(updateImmadAdminUserNames(uniqueAdmins));

    const uniqueMissionManagers = Array.from(
        new Set([...result.missionMgrs.users, result.missionMgrs.owner, ...result.missionMgrs.admins])
    );
    store.dispatch(updateImmadMMgrsUserNames(uniqueMissionManagers));
}

async function init() {
    const rootElement = document.getElementById('root');
    if (!rootElement) throw new Error('Cannot find root HTML element');

    const root = ReactDOM.createRoot(rootElement);
    const { appConfig } = await loadConfigs();

    configureEsri(appConfig);

    const portalUser = await loadPortalUser();
    if (!portalUser) throw new Error('User not logged into Portal.');

    const userRoles = await fetchUserRoles(appConfig, portalUser);
    await fetchAndStoreUserLists();
    root.render(
        <AppProvider portalUser={portalUser} userRoles={userRoles}>
            <Provider store={store}>
                <Main />
            </Provider>
        </AppProvider>
    );
}

init().catch((error) => {
    console.error(error);
    const rootElement = document.getElementById('root');
    if (rootElement) {
        ReactDOM.createRoot(rootElement).render(<InitializationFailed />);
    }
});
