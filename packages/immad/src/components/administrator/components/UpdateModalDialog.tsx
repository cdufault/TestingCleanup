import React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import {
	StyledDivCentered,
	StyledDialogContent,
	StyledSuccessIcon,
	StyledCircularProgress,
} from "../styles";
import { useAdminSettingsContext } from "../../../contexts/AdminSettingsContext";
import { ConfigHelper } from "../../../helpers/configHelper";
import { joinLabel } from "../../../Constants";

/**
 * Interface to handle callback and input data coming from
 * where the modal dialog is initialized.
 */
interface UpdateModalDialogProps {
	handleClose: (result: boolean) => void;
	// handleCancel: (result: boolean) => void;
}

/**
 * A Modal Dialog to show progess of updates being done on IMMAD Users
 * @param props
 * @constructor
 */
export default function UpdateModalDialog(
	props: UpdateModalDialogProps,
): JSX.Element {
	const adminSettingsContext = useAdminSettingsContext();
	const [open, setOpen] = React.useState(true);
	const theme = useTheme();
	const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
	const { handleClose } = props;
	// Commented out sections here are place holders for next iteration of this tool set.
	// const { handleCancel } = props;

	// const handleClickOpen = () => {
	//     setOpen(true);
	// };

	const handleCloseClicked = (): void => {
		setOpen(false);
		handleClose(false);
	};
	// const handleCancelClicked = () => {
	//     setOpen(false);
	//     handleCancel(false);
	// };

	return (
		<Dialog
			disablebackdropclick={"true"}
			fullScreen={fullScreen}
			open={open}
			onClose={handleClose}
			aria-labelledby="responsive-dialog-title"
		>
			<DialogTitle id="responsive-dialog-title">{"Processing"}</DialogTitle>
			<StyledDialogContent>
				{adminSettingsContext.userBeingUpdated ? (
					<>
						<StyledDivCentered>
							<StyledCircularProgress color="secondary" size={60} />
						</StyledDivCentered>
						<StyledDivCentered>
							<DialogContentText>
								{joinLabel(
									"Updating",
									ConfigHelper.getAppConfig()?.appLabel ?? "",
									"User Types...",
								)}
							</DialogContentText>
						</StyledDivCentered>
					</>
				) : (
					<>
						<StyledDivCentered>
							<StyledSuccessIcon size={32} color={"var(--calcite-ui-info)"} />
						</StyledDivCentered>
						<StyledDivCentered>
							<DialogContentText>Complete!</DialogContentText>
						</StyledDivCentered>
					</>
				)}
			</StyledDialogContent>
			<DialogActions>
				<Button
					disabled={adminSettingsContext.userBeingUpdated}
					onClick={handleCloseClicked}
					variant="contained"
					color="secondary"
					autoFocus
				>
					OK
				</Button>
			</DialogActions>
		</Dialog>
	);
}
