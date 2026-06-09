import "./assets/index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { store } from "./data/store";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import "@arcgis/core/assets/esri/themes/dark/main.css";
import {
	setApplicationConfig,
	setBasenameText,
	setGateConfigured,
	setGateDynamicConfig,
	setVersionText,
} from "./ApplicationSlice";
import esriConfig from "@arcgis/core/config";
import {
	DefaultPortal,
	getPortalItemDataById,
	getPortalUserSession,
} from "@stratcom/lib-functions";
import { StaticAuthenticationState } from "./data/StaticAuthenticationState";
import ErrorPage from "./pages/ErrorPage/ErrorPage";
import { findGateWebApp } from "./pages/LandingPage/LandingPageHelper";
import { applyLabelPlaceholders } from "./helpers/applyLabelPlaceholders";
import * as process from "process";

const element = document.getElementById("root");
const root = ReactDOM.createRoot(element!);

async function init() {
	let errorMessage = "Unknown Error Occurred.";
	try {
		let basename = "";
		if (process.env.NODE_ENV === "production") {
			const pathName = window.location.pathname;
			const pathParts = pathName.split("/").filter(Boolean);
			const basenameIndex = pathParts.findIndex(
				(part) =>
					part === process.env.REACT_APP_EXERCISE_BASENAME ||
					part === process.env.REACT_APP_BASENAME,
			);
			if (basenameIndex !== -1) {
				basename = `/${pathParts.slice(0, basenameIndex + 1).join("/")}`;
			}
			const requestBasename = await fetch(basename);
			const basenameText = requestBasename.url;
			//updates the basename for branding logo setting
			store.dispatch(setBasenameText(basenameText));
		}
		// extra level of error handling to give better messages and an error page
		try {
			// let appConfig = await ConfigFileHelper.getAppConfig();
			// since the config JSON is always in the root folder this and
			// this is a single page applications this will always work no
			// matter what the path this code is called with
			const configPath = `${basename}/config.json`;
			const assetsPath = `${basename}/assets`;

			/**support version text file - using existing pattern for finding files in app root */
			const versionPath = `${basename}/version.txt`;
			const requestVersion = await fetch(versionPath);
			const versionText = await requestVersion.text();
			store.dispatch(setVersionText(versionText));

			const request = await fetch(configPath);
			const appConfig = await request.json();
			applyLabelPlaceholders(appConfig);
			document.title = appConfig.appLabel ?? "";
			store.dispatch(setApplicationConfig(appConfig));
			const portalUrl = appConfig.portalUrl;
			const oauthAppId = appConfig.oauthAppId;
			try {
				const portal = await DefaultPortal.getTheDefaultPortal(portalUrl);
				if (!portal) {
					return new Error(
						"Unable to get the Default Portal from portalUrl = " + portalUrl,
					);
				}
				const userSession = await getPortalUserSession(portalUrl, oauthAppId);
				if (!userSession) {
					return new Error(
						"Unable to get the userSession from Portal using portalUrl = " +
							portalUrl,
					);
				}
				StaticAuthenticationState.setPortalState(portal);
				StaticAuthenticationState.setUserSessionState(userSession);

				const gateWebApp = await findGateWebApp(
					appConfig.appPortalId,
					appConfig.portalUrl,
					appConfig.oauthAppId,
				);
				if (gateWebApp) {
					// get data if it exists, if not go to configuration page by not setting configured to true
					const itemData = await getPortalItemDataById(
						gateWebApp.id,
						portalUrl,
						appConfig.oauthAppId,
					);
					if (itemData && itemData.configurationData) {
						store.dispatch(setGateDynamicConfig(itemData.configurationData));
						store.dispatch(setGateConfigured(true));
					} else {
						store.dispatch(setGateConfigured(false));
					}
				} else {
					store.dispatch(setGateConfigured(false));
				}

				// set assets path
				esriConfig.assetsPath = assetsPath;

				// set portal url
				esriConfig.portalUrl = portalUrl;

				//set the kml service url
				esriConfig.kmlServiceUrl = `${portalUrl}/sharing/kml`;
			} catch (e) {
				errorMessage =
					"Error occurred initializing the app see object for more details.";
				throw e;
			}
		} catch (fetchError) {
			errorMessage = "Error occurred fetching the app config.";
			throw fetchError;
		}
		// this code detects if in production or dev mode and sets the basename accordingly for routes
		// when in production it will be 'gate' in dev it will be ''

		root.render(
			<React.StrictMode>
				<BrowserRouter basename={basename}>
					<Provider store={store}>
						<App />
					</Provider>
				</BrowserRouter>
			</React.StrictMode>,
		);
	} catch (error) {
		console.error(errorMessage, error);
		root.render(<ErrorPage error={errorMessage} />);
	}
}

init().catch((e) => console.error("Error occurred", e));
