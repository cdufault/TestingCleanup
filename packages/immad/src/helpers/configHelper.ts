import { AppConfig } from "../interfaces/AppConfig";
import {
	ConfigFileHelper,
	getPortalItemDataById,
} from "@stratcom/lib-functions";
import { GateDynamicConfig } from "../components/administrator/components/GateDynamicConfig";
import Portal from "@arcgis/core/portal/Portal";
import PortalItem from "@arcgis/core/portal/PortalItem";
import { PortalAppSettings } from "src/interfaces/AnalyticsGPTypes";
import { applyLabelPlaceholders } from "./applyLabelPlaceholders";

/**
 * Helper class for dynamic configuration objects in GATE and IMMAD. Methods for loading and saving GATE/IMMAD documents.
 */
export class ConfigHelper {
	private static appConfigPortal: PortalAppSettings;
	private static appVersion: string;
	private static appConfig: AppConfig;

	/**
	 * Do not move to lib.
	 * This function needs to be called at application startup to assist bootstrapping the application.
	 * Application initialization will fail gracefully if this file in not found.
	 * Calls the library function to load up the app config json file from the application root folder.
	 * Returns the app config file as a JSON object.
	 */
	static async loadAppConfig(): Promise<AppConfig> {
		if (!this.appConfig) {
			try {
				this.appConfig = await ConfigFileHelper.loadAppConfigFile(
					"config.json",
				);
				applyLabelPlaceholders(
					this.appConfig as unknown as Record<string, unknown>,
				);
			} catch (error) {
				console.error("Error getting App Config", error);
			}
		}
		return this.appConfig;
	}

	/**Return a cached version of the application config file */
	static getAppConfig(): AppConfig {
		return this.appConfig;
	}

	/**
	 * Get the version text file in the root of the application
	 * Return the version text
	 */
	static async loadAppVersion(): Promise<string> {
		if (!this.appVersion) {
			this.appVersion = "";
			this.appVersion = await ConfigFileHelper.loadAppVersion("version.txt");
		}
		return this.appVersion;
	}

	/**
	 * Return a cached version of the version text file.
	 */
	static getAppVersion(): string {
		return this.appVersion;
	}

	/**Return a cached version of the portal config object */
	static getAppConfigPortal(): PortalAppSettings {
		return this.appConfigPortal;
	}

	/**
	 * Get the portal config object from the application's default portal
	 * Return the portal config object
	 */
	static async loadAppConfigFromPortal(): Promise<PortalAppSettings> {
		const appConfig = this.getAppConfig();
		if (!appConfig) {
			console.error(
				"Error trying to loadAppConfigFromPortal in configHelper.ts. Unable to find appConfig json.",
			);
		}
		this.appConfigPortal = await ConfigFileHelper.loadAppConfigFromPortal(
			appConfig ? appConfig?.portalUrl : "",
			appConfig ? appConfig?.oauthAppId : "",
		);
		return this.appConfigPortal;
	}

	/**
	 * Loads the GATE configuration from Portal. This is separate from the IMMAD configuration and is accessible to GATE clients.
	 * @param gateAppPortalId the GATE application portal item id
	 */
	static async loadGateAppConfigFromPortal(
		gateAppPortalId: string,
	): Promise<GateDynamicConfig> {
		const appConfig: AppConfig = this.getAppConfig();
		const oauthId = appConfig.oauthAppId;
		const portal = await Portal.getDefault().load();

		!gateAppPortalId &&
			console.error("Failed to find a GATE application portal item id.");
		const jsonData = await getPortalItemDataById(
			gateAppPortalId,
			portal.url,
			oauthId,
		);
		return jsonData.configurationData
			? (jsonData.configurationData as GateDynamicConfig)
			: (jsonData as GateDynamicConfig);
	}
}
