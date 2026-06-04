import React, { useEffect, useState } from "react";
import { useAppSelector } from "../../hooks/hooks";
import { useNavigate } from "react-router-dom";
import "./ConfigurationPage.css";
import { updateFormData } from "./FormDataSlice";
import {
	Box,
	Button,
	FormControl,
	FormGroup,
	FormLabel,
	TextField,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import {
	GateDynamicConfig,
	setGateConfigured,
	setGateDynamicConfig,
} from "../../ApplicationSlice";
import {
	findAPortalItemById,
	getPortalItemDataById,
	Logger,
	updatePortalWebApp,
} from "@stratcom/lib-functions";
import {
	OpsClockEditorWidgetLib,
	PortalItemSelect,
} from "@stratcom/react-widget-lib";
import { StaticAuthenticationState } from "../../data/StaticAuthenticationState";
import { ThemeProvider } from "@emotion/react";
import { theme } from "../../assets/theme";
import Portal from "@arcgis/core/portal/Portal";
import PortalItem from "@arcgis/core/portal/PortalItem";
import { RootState } from "../../data/store";
import { DEFAULT_SYSTEM_HIGH_CLASSIFICATION } from "../../Constants";
import { OpsClockDataSerializable } from "@stratcom/react-widget-lib/types/OpsClockWidgetLib";
import { joinLabel } from "../../Constants";

export default function ConfigurationForm() {
	const [formData, setFormData] = useState<GateDynamicConfig>(
		useAppSelector((state) => state.formDataSlice),
	);
	const [formErrors, setFormErrors] = useState<GateDynamicConfig>(
		{} as GateDynamicConfig,
	);
	const [isFormValid, setIsFormValid] = useState<boolean>(true);
	const userSession = StaticAuthenticationState.getUserSessionState();
	const portal = StaticAuthenticationState.getPortalState();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const appConfig = useSelector(
		(state: RootState) => state.applicationSlice.applicationConfig,
	);
	const appLabel = appConfig?.appLabel ?? "";
	const [existingClocksList, setExistingClocksList] = useState<
		OpsClockDataSerializable[]
	>([]);
	const defaultClock: OpsClockDataSerializable[] = [
		{
			id: Date.now(),
			name: "STRATCOM",
			offset: -6,
			currentTime: Date.now(),
		},
	];

	useEffect(() => {
		// Handles edge cases for submit button enabling.
		if (Object.keys(formErrors).length !== 0) {
			// checks on when form text boxes get updated values
			setFormValidation(formData); // result not needed here
		} else if (
			!formData.regionFeatureClassId ||
			!formData.landingPageCategoriesFeatureClassId ||
			!formData.gateCalendarFeatureClassId ||
			!formData.j2SummaryFeatureClassId ||
			!formData.analystCommentsFeatureClassId ||
			!formData.sourcesFeatureClassId
		) {
			setIsFormValid(false);
		} else {
			// sets default clock if no ops clocks edited and ops clock object does not exist currently
			if (
				formData.opsClockList === undefined ||
				formData.opsClockList.length === 0
			) {
				setFormData({
					...formData,
					opsClockList: defaultClock,
				});
			}
			setIsFormValid(true);
		}
	}, [formData, formErrors]);

	useEffect(() => {
		// if gate is configured and there is data then get the data for the form.
		if (appConfig) {
			getPortalItemDataById(
				appConfig.appPortalId,
				portal.url,
				appConfig.oauthAppId,
			).then((itemData) => {
				if (itemData && itemData.configurationData) {
					// get data from portal but use default values if entry doesn't yet exist on the portal
					setFormData((prevState) => ({
						...prevState,
						...itemData.configurationData,
					}));
					// existing ops clocks need to be set here from the config data to prevent a race condition with the
					// new auto save functionality in the gate config page clock editor
					setExistingClocksList(itemData.configurationData.opsClockList);
				}
			});
		}
	}, [appConfig]);

	useEffect(() => {
		setFormData({
			...formData,
			systemHighClassification: DEFAULT_SYSTEM_HIGH_CLASSIFICATION,
			brandingTitleAlias: "GATE",
			brandingSubtitleAlias: "application",
			brandingLogo: `logo192.png`,
		});
	}, []);

	/**
	 * Handles the submit button clicked operations
	 * @param event
	 */
	async function handleSubmit(event: any) {
		event.preventDefault();
		dispatch(updateFormData(formData));
		// take form data and create json
		// add json to the application object
		const itemData = {
			configurationData: {
				...formData,
			},
		};
		const errors = await setFormValidation(itemData.configurationData);
		if (Object.keys(errors).length === 0) {
			if (appConfig) {
				const result = await updatePortalWebApp(
					appConfig.appPortalId,
					JSON.stringify(itemData),
					userSession,
					portal.restUrl,
				);
				if (!result?.success) {
					Logger.log(
						"Error Occurred updating GATE application.",
						"ERROR",
						result,
					);
					navigate("/error", {
						state: "Error Occurred updating GATE application.",
					});
				}
				dispatch(setGateDynamicConfig(itemData.configurationData));
				dispatch(setGateConfigured(true));
				navigate("/");
				// needed for first load of the application
				window.location.reload();
			}
		} else {
			console.error("Errors: ", errors);
		}
	}

	/**
	 * Checks if every field has a value. If so then checks if those GUIDs are
	 * in the Portal.
	 * @param configurationData to validate
	 */
	async function validateInputs(configurationData: GateDynamicConfig) {
		const errors = {} as GateDynamicConfig;
		if (
			!formData.regionFeatureClassId ||
			!formData.landingPageCategoriesFeatureClassId ||
			!formData.gateCalendarFeatureClassId ||
			!formData.j2SummaryFeatureClassId ||
			!formData.analystCommentsFeatureClassId ||
			!formData.sourcesFeatureClassId ||
			!formData.j2AssessmentAlias ||
			!formData.analystCommentsAlias ||
			!formData.brandingTitleAlias ||
			!formData.brandingSubtitleAlias ||
			!formData.brandingLogo ||
			!formData.analystCommentsAlias ||
			!formData.highInterestEventCardTitle ||
			!formData.presentationModeUpdateIntervalMinutes ||
			!formData.carouselPagingUpdateIntervalMinutes ||
			!formData.landingPageUpdateIntervalInMinutes ||
			!formData.updateFrequencyForAnalystCommentCategoryInMinutes ||
			!formData.systemHighClassification ||
			!formData.lowActivitySnapshotCategoryColor ||
			!formData.moderateActivitySnapshotCategoryColor ||
			!formData.highActivitySnapshotCategoryColor
		) {
			setIsFormValid(false);
		}
		if (!configurationData.regionFeatureClassId) {
			errors.regionFeatureClassId = "ID Required for Region FeatureClass Id";
		} else {
			const result = await isValidFeatureServiceGuid(
				configurationData.regionFeatureClassId,
			);
			if (!result) {
				errors.regionFeatureClassId =
					"Invalid Value for Region FeatureClass Id";
			}
		}
		if (!configurationData.landingPageCategoriesFeatureClassId) {
			errors.landingPageCategoriesFeatureClassId =
				"ID Required for Landing Page Categories FeatureClass Id";
		} else {
			const result = await isValidFeatureServiceGuid(
				configurationData.landingPageCategoriesFeatureClassId,
			);
			if (!result) {
				errors.landingPageCategoriesFeatureClassId =
					"Invalid Value for Landing Page Categories FeatureClass Id";
			}
		}
		if (!configurationData.gateCalendarFeatureClassId) {
			errors.gateCalendarFeatureClassId = joinLabel(
				"ID Required for",
				appLabel,
				"Calendar FeatureClass Id",
			);
		} else {
			const result = await isValidFeatureServiceGuid(
				configurationData.gateCalendarFeatureClassId,
			);
			if (!result) {
				errors.gateCalendarFeatureClassId = joinLabel(
					"Invalid Value for",
					appLabel,
					"Calendar FeatureClass Id",
				);
			}
		}
		if (!configurationData.j2SummaryFeatureClassId) {
			errors.j2SummaryFeatureClassId =
				"ID Required for J2 Summary FeatureClass Id";
		} else {
			const result = await isValidFeatureServiceGuid(
				configurationData.j2SummaryFeatureClassId,
			);
			if (!result) {
				errors.j2SummaryFeatureClassId =
					"Invalid Value for J2 Summary FeatureClass Id";
			}
		}
		if (!configurationData.sourcesFeatureClassId) {
			errors.sourcesFeatureClassId = "ID Required for Sources FeatureClass Id";
		} else {
			const result = await isValidFeatureServiceGuid(
				configurationData.sourcesFeatureClassId,
			);
			if (!result) {
				errors.sourcesFeatureClassId =
					"Invalid Value for Sources FeatureClass Id";
			}
		}
		if (!configurationData.analystCommentsFeatureClassId) {
			errors.analystCommentsFeatureClassId =
				"ID Required for Analyst Comments FeatureClass Id";
		} else {
			const result = await isValidFeatureServiceGuid(
				configurationData.analystCommentsFeatureClassId,
			);
			if (!result) {
				errors.analystCommentsFeatureClassId =
					"Invalid Value for Analyst Comments FeatureClass Id";
			}
		}
		if (configurationData.analystCommentsAlias === "") {
			errors.analystCommentsAlias =
				"A Value is required for Analyst Comments Alias";
		}
		if (configurationData.j2AssessmentAlias === "") {
			errors.j2AssessmentAlias = "A Value is required for J2 Assessment Alias";
		}
		if (configurationData.highInterestEventCardTitle === "") {
			errors.highInterestEventCardTitle =
				"A title is required for High Interest Events";
		}
		if (configurationData.systemHighClassification === "") {
			errors.systemHighClassification =
				"A classification is required for System High Classification";
		}
		if (configurationData.brandingTitleAlias === "") {
			errors.brandingTitleAlias =
				"A Value is required for Branding Title Alias";
		}
		if (configurationData.brandingSubtitleAlias === "") {
			errors.brandingSubtitleAlias =
				"A Value is required for Branding Subtitle Alias";
		}
		if (configurationData.brandingLogo === "") {
			errors.brandingLogo = "A Value is required for Branding Logo path";
		}
		if (
			configurationData.presentationModeUpdateIntervalMinutes === undefined ||
			(configurationData.presentationModeUpdateIntervalMinutes as unknown as number) <=
				0 ||
			configurationData.presentationModeUpdateIntervalMinutes === ""
		) {
			errors.presentationModeUpdateIntervalMinutes =
				"A Value is required for Presentation Update Interval and can not be 0 or less";
		}
		if (
			configurationData.carouselPagingUpdateIntervalMinutes === undefined ||
			(configurationData.carouselPagingUpdateIntervalMinutes as unknown as number) <=
				0 ||
			configurationData.carouselPagingUpdateIntervalMinutes === ""
		) {
			errors.carouselPagingUpdateIntervalMinutes =
				"A Value is required for Carousel Paging Update Interval and can not be 0 or less";
		}
		if (
			configurationData.landingPageUpdateIntervalInMinutes === undefined ||
			(configurationData.landingPageUpdateIntervalInMinutes as unknown as number) <=
				0 ||
			configurationData.landingPageUpdateIntervalInMinutes === ""
		) {
			errors.landingPageUpdateIntervalInMinutes =
				"A Value is required for Landing Page Update Interval and can not be 0 or less";
		}
		if (
			configurationData.updateFrequencyForAnalystCommentCategoryInMinutes ===
				undefined ||
			(configurationData.updateFrequencyForAnalystCommentCategoryInMinutes as unknown as number) <=
				0 ||
			configurationData.updateFrequencyForAnalystCommentCategoryInMinutes === ""
		) {
			errors.updateFrequencyForAnalystCommentCategoryInMinutes =
				"A Value is required for Analyst Comment Update Interval and can not be 0 or less";
		}
		if (!configurationData.lowActivitySnapshotCategoryColor) {
			errors.lowActivitySnapshotCategoryColor =
				"Low Activity Catagory Color must be selected";
		}
		if (!configurationData.moderateActivitySnapshotCategoryColor) {
			errors.moderateActivitySnapshotCategoryColor =
				"Moderate Activity Catagory Color must be selected";
		}
		if (!configurationData.highActivitySnapshotCategoryColor) {
			errors.highActivitySnapshotCategoryColor =
				"High Activity Catagory Color must be selected";
		}
		return errors;
	}

	/**
	 * Validates the inputs and sets the Errors and updates if the form is valid
	 * @param formData to validate
	 */
	async function setFormValidation(formData: GateDynamicConfig) {
		return await validateInputs(formData).then((errors: GateDynamicConfig) => {
			setFormErrors(errors);
			setIsFormValid(Object.keys(errors).length === 0);
			return errors;
		});
	}

	/**
	 * Handle on change event of text fields.
	 * @param event
	 */
	function handleOnChange(event: any) {
		setFormData({ ...formData, [event.target.name]: event.target.value });
	}

	/**
	 * Handle on change event of each PortalItemSelect component.
	 * @param portalItem The Portal item selected in the component.
	 * @param parameterName The parameter name associated with the PortalItemSelect.
	 */
	function handlePortalItemChange(
		portalItem: PortalItem | null,
		parameterName: string,
	) {
		setFormData({
			...formData,
			[parameterName]: portalItem ? portalItem.id : "",
		});
	}

	/**
	 * Handle save event of Ops Clock component.
	 */
	function handleOpsClockSave(clocks: OpsClockDataSerializable[]) {
		setFormData({ ...formData, opsClockList: clocks });
	}

	/**
	 * Checks if guild values exists on portal
	 * @param guidValue
	 */
	async function isValidFeatureServiceGuid(guidValue: string) {
		let isValid = false;
		if (guidValue) {
			const result = await findAPortalItemById(
				guidValue,
				portal.url,
				appConfig.oauthAppId,
			);
			if (result) {
				isValid = true;
			}
		}
		return isValid;
	}

	return (
		<ThemeProvider theme={theme}>
			<Box className="gate-config-container">
				<Box className="gate-config-header-container">
					<h1>{joinLabel(appLabel, "Configuration Settings")}</h1>
				</Box>
				<div className="gate-input-group">
					<Box className={"gate-ops-clock-settings"}>
						<OpsClockEditorWidgetLib
							onClocksSave={handleOpsClockSave}
							existingClocks={existingClocksList}
							displayOnly={false}
							maximumNumberOfClocks={5}
							gateConfigurationMode={true}
						/>
					</Box>
					<Box className={"gate-input-field"}>
						<PortalItemSelect
							theme={theme}
							portal={Portal.getDefault() as Portal}
							label={"Region FeatureClass *"}
							query={"type: 'feature'"}
							portalItemID={formData.regionFeatureClassId}
							onItemChange={(item: PortalItem | null) => {
								handlePortalItemChange(item, "regionFeatureClassId");
							}}
						/>
					</Box>
					<Box className={"gate-input-field"}>
						<PortalItemSelect
							theme={theme}
							portal={Portal.getDefault() as Portal}
							label={"Landing Page Categories FeatureClass *"}
							query={"type: 'feature'"}
							portalItemID={formData.landingPageCategoriesFeatureClassId}
							onItemChange={(item: PortalItem | null) => {
								handlePortalItemChange(
									item,
									"landingPageCategoriesFeatureClassId",
								);
							}}
						/>
					</Box>
					<Box className={"gate-input-field"}>
						<PortalItemSelect
							theme={theme}
							portal={Portal.getDefault() as Portal}
							label={joinLabel(appLabel, "Calendar FeatureClass *")}
							query={"type: 'feature'"}
							portalItemID={formData.gateCalendarFeatureClassId}
							onItemChange={(item: PortalItem | null) => {
								handlePortalItemChange(item, "gateCalendarFeatureClassId");
							}}
						/>
					</Box>
					<Box className={"gate-input-field"}>
						<PortalItemSelect
							theme={theme}
							portal={Portal.getDefault() as Portal}
							label={"J2 Summary FeatureClass *"}
							query={"type: 'feature'"}
							portalItemID={formData.j2SummaryFeatureClassId}
							onItemChange={(item: PortalItem | null) => {
								handlePortalItemChange(item, "j2SummaryFeatureClassId");
							}}
						/>
					</Box>
					<Box className={"gate-input-field"}>
						<PortalItemSelect
							theme={theme}
							portal={Portal.getDefault() as Portal}
							label={"Analyst Comments FeatureClass *"}
							query={"type: 'feature'"}
							portalItemID={formData.analystCommentsFeatureClassId}
							onItemChange={(item: PortalItem | null) => {
								handlePortalItemChange(item, "analystCommentsFeatureClassId");
							}}
						/>
					</Box>
					<Box className={"gate-input-field"}>
						<PortalItemSelect
							theme={theme}
							portal={Portal.getDefault() as Portal}
							label={"Sources FeatureClass *"}
							query={"type: 'feature'"}
							portalItemID={formData.sourcesFeatureClassId}
							onItemChange={(item: PortalItem | null) => {
								handlePortalItemChange(item, "sourcesFeatureClassId");
							}}
						/>
					</Box>
					<Box className={"gate-input-field"}>
						<TextField
							className="gate-config-form-text-field"
							fullWidth
							required={true}
							key={"analystCommentsAlias"}
							label={"Analyst Comments Alias"}
							name={"analystCommentsAlias"}
							variant="outlined"
							error={Boolean(formErrors.analystCommentsAlias)}
							helperText={formErrors.analystCommentsAlias}
							value={formData.analystCommentsAlias}
							onChange={handleOnChange}
						/>
					</Box>
					<Box className={"gate-input-field"}>
						<TextField
							className="gate-config-form-text-field"
							fullWidth
							required={true}
							key={"j2AssessmentAlias"}
							label={"J2Assessment Alias"}
							name={"j2AssessmentAlias"}
							variant="outlined"
							error={Boolean(formErrors.j2AssessmentAlias)}
							helperText={formErrors.j2AssessmentAlias}
							value={formData.j2AssessmentAlias}
							onChange={handleOnChange}
						/>
					</Box>
					<Box className={"gate-input-field"}>
						<TextField
							className="gate-config-form-text-field"
							fullWidth
							required={true}
							key={"brandingTitleAlias"}
							label={"Branding Title Alias"}
							name={"brandingTitleAlias"}
							variant="outlined"
							error={Boolean(formErrors.brandingTitleAlias)}
							helperText={formErrors.brandingTitleAlias}
							value={formData.brandingTitleAlias}
							onChange={handleOnChange}
						/>
					</Box>
					<Box className={"gate-input-field"}>
						<TextField
							className="gate-config-form-text-field"
							fullWidth
							required={true}
							key={"brandingSubtitleAlias"}
							label={"Branding Subtitle Alias"}
							name={"brandingSubtitleAlias"}
							variant="outlined"
							error={Boolean(formErrors.brandingSubtitleAlias)}
							helperText={formErrors.brandingSubtitleAlias}
							value={formData.brandingSubtitleAlias}
							onChange={handleOnChange}
						/>
					</Box>
					<Box className={"gate-input-field"}>
						<TextField
							className="gate-config-form-text-field"
							fullWidth
							required={true}
							key={"brandingLogo"}
							label={"Landing Page Logo File Path"}
							name={"brandingLogo"}
							variant="outlined"
							error={Boolean(formErrors.brandingLogo)}
							helperText={"i.e. images/logo.png"}
							value={formData.brandingLogo}
							onChange={handleOnChange}
						/>
					</Box>
					<Box className={"gate-input-field"}>
						<TextField
							className="gate-config-form-text-field"
							fullWidth
							required={true}
							key={"highInterestEventCardTitle"}
							label={"High Interest Event Card Title"}
							name={"highInterestEventCardTitle"}
							variant="outlined"
							error={Boolean(formErrors.highInterestEventCardTitle)}
							helperText={formErrors.highInterestEventCardTitle}
							value={formData.highInterestEventCardTitle}
							onChange={handleOnChange}
						/>
					</Box>
					<Box className={"gate-input-field"}>
						<TextField
							className="gate-config-form-text-field"
							fullWidth
							required={true}
							key={"systemHighClassification"}
							label={"System High Classification"}
							name={"systemHighClassification"}
							variant="outlined"
							error={Boolean(formErrors.systemHighClassification)}
							helperText={formErrors.systemHighClassification}
							value={formData.systemHighClassification}
							onChange={handleOnChange}
						/>
					</Box>
					<Box className={"gate-input-field"}>
						<TextField
							type="number"
							className="gate-config-form-text-field"
							fullWidth
							required={true}
							key={"presentationModeUpdateIntervalMinutes"}
							label={"Presentation Mode Update Interval in Minutes"}
							name={"presentationModeUpdateIntervalMinutes"}
							variant="outlined"
							error={Boolean(formErrors.presentationModeUpdateIntervalMinutes)}
							helperText={formErrors.presentationModeUpdateIntervalMinutes}
							value={formData.presentationModeUpdateIntervalMinutes}
							onChange={handleOnChange}
							InputLabelProps={{ shrink: true }}
						/>
					</Box>
					<Box className={"gate-input-field"}>
						<TextField
							type="number"
							className="gate-config-form-text-field"
							fullWidth
							required={true}
							key={"carouselPagingUpdateIntervalMinutes"}
							label={"Carousel Paging Update Interval Minutes"}
							name={"carouselPagingUpdateIntervalMinutes"}
							variant="outlined"
							error={Boolean(formErrors.carouselPagingUpdateIntervalMinutes)}
							helperText={formErrors.carouselPagingUpdateIntervalMinutes}
							value={formData.carouselPagingUpdateIntervalMinutes}
							onChange={handleOnChange}
							InputLabelProps={{ shrink: true }}
						/>
					</Box>
					<Box className={"gate-input-field"}>
						<TextField
							type="number"
							className="gate-config-form-text-field"
							fullWidth
							required={true}
							key={"landingPageUpdateIntervalInMinutes"}
							label={"Landing Page Update Interval in Minutes"}
							name={"landingPageUpdateIntervalInMinutes"}
							variant="outlined"
							error={Boolean(formErrors.landingPageUpdateIntervalInMinutes)}
							helperText={formErrors.landingPageUpdateIntervalInMinutes}
							value={formData.landingPageUpdateIntervalInMinutes}
							onChange={handleOnChange}
							InputLabelProps={{ shrink: true }}
						/>
					</Box>
					<Box className={"gate-input-field"}>
						<TextField
							type="number"
							className="gate-config-form-text-field"
							fullWidth
							required={true}
							key={"updateFrequencyForAnalystCommentCategoryInMinutes"}
							label={"Update Frequency For Analyst Comment Category In Minutes"}
							name={"updateFrequencyForAnalystCommentCategoryInMinutes"}
							variant="outlined"
							error={Boolean(
								formErrors.updateFrequencyForAnalystCommentCategoryInMinutes,
							)}
							helperText={
								formErrors.updateFrequencyForAnalystCommentCategoryInMinutes
							}
							value={formData.updateFrequencyForAnalystCommentCategoryInMinutes}
							onChange={handleOnChange}
							InputLabelProps={{ shrink: true }}
						/>
					</Box>
					<Box className="gate-input-field category-colors-container">
						<FormControl
							component="fieldset"
							className="category-colors"
							error={
								Boolean(formErrors.lowActivitySnapshotCategoryColor) ||
								Boolean(formErrors.moderateActivitySnapshotCategoryColor) ||
								Boolean(formErrors.highActivitySnapshotCategoryColor)
							}
						>
							<FormLabel component="legend">
								&nbsp;&nbsp;Activity Snapshot Category Level Colors
								*&nbsp;&nbsp;
							</FormLabel>
							<FormGroup row>
								<FormControl
									component="fieldset"
									error={Boolean(formErrors.highActivitySnapshotCategoryColor)}
								>
									<FormLabel component="legend">
										&nbsp;&nbsp;High *&nbsp;&nbsp;
									</FormLabel>
									<FormGroup row>
										<input
											type="color"
											onChange={handleOnChange}
											name="highActivitySnapshotCategoryColor"
											value={formData.highActivitySnapshotCategoryColor}
										/>
									</FormGroup>
									<FormLabel component="legend" className="color-hex-code">
										{formData.highActivitySnapshotCategoryColor}
									</FormLabel>
								</FormControl>
								<FormControl
									component="fieldset"
									className="fieldset"
									style={{ marginLeft: "12.5%", marginRight: "12.5%" }}
									error={Boolean(
										formErrors.moderateActivitySnapshotCategoryColor,
									)}
								>
									<FormLabel component="legend">
										&nbsp;&nbsp;Moderate *&nbsp;&nbsp;
									</FormLabel>
									<FormGroup row>
										<input
											type="color"
											onChange={handleOnChange}
											name="moderateActivitySnapshotCategoryColor"
											value={formData.moderateActivitySnapshotCategoryColor}
										/>
									</FormGroup>
									<FormLabel component="legend" className="color-hex-code">
										{formData.moderateActivitySnapshotCategoryColor}
									</FormLabel>
								</FormControl>
								<FormControl
									component="fieldset"
									error={Boolean(formErrors.lowActivitySnapshotCategoryColor)}
								>
									<FormLabel component="legend">
										&nbsp;&nbsp;Low *&nbsp;&nbsp;
									</FormLabel>
									<FormGroup row>
										<input
											type="color"
											onChange={handleOnChange}
											name="lowActivitySnapshotCategoryColor"
											value={formData.lowActivitySnapshotCategoryColor}
										/>
									</FormGroup>
									<FormLabel component="legend" className="color-hex-code">
										{formData.lowActivitySnapshotCategoryColor}
									</FormLabel>
								</FormControl>
							</FormGroup>
							{Boolean(formErrors.lowActivitySnapshotCategoryColor) ||
							Boolean(formErrors.moderateActivitySnapshotCategoryColor) ||
							Boolean(formErrors.highActivitySnapshotCategoryColor) ? (
								<FormLabel
									component="legend"
									className="category-colors-error-message"
								>
									{formErrors.lowActivitySnapshotCategoryColor}
									{formErrors.moderateActivitySnapshotCategoryColor}
									{formErrors.highActivitySnapshotCategoryColor}
								</FormLabel>
							) : (
								<></>
							)}
						</FormControl>
					</Box>
				</div>
				<Box sx={{ marginTop: "30px", marginBottom: "100px" }}>
					<Button
						className="submit-button"
						variant="contained"
						type="submit"
						title="Submit Values"
						onClick={handleSubmit}
						disabled={!isFormValid}
					>
						Submit
					</Button>
				</Box>
			</Box>
		</ThemeProvider>
	);
}
