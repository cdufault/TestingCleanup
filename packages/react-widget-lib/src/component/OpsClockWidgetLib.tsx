import React, { useEffect, useState } from "react";
import styled from "@emotion/styled";
import "dseg/css/dseg.css";
import moment from "moment-timezone";
import {
  Box,
  Button,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
  Grid,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import PlusCircleIcon from "calcite-ui-icons-react/PlusCircleIcon";
import X from "calcite-ui-icons-react/XIcon";
import PencilIcon from "calcite-ui-icons-react/PencilIcon";
import CheckCircleIcon from "calcite-ui-icons-react/CheckCircleIcon";

const StyledOpsClockDiv = styled.div`
  display: flex;
  flex-wrap: nowrap;
  flex-direction: row;
  gap: 6px;
  overflow-x: auto;
`;

const StyledAddClockButton = styled(IconButton)`
  color: #00aaff;
`;

const StyledMaxClocksAlert = styled(Alert)`
  color: #ffffff;
`;

const StyledDeleteClockButton = styled(IconButton)`
  color: #00aaff;
  max-width: 30px;
  min-width: 30px;
  min-height: 30px;
  max-height: 30px;
  margin-top: -5px;
  margin-left: -30px;
`;

const StyledAddClockButtonDiv = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #292d3f;
  height: 80px;
  width: 135px;
  border-radius: 5px;
  margin-left: 5px;
  margin-top: 5px;
  margin-bottom: 5px;
`;

const StyledEditSaveClockButtonDiv = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #292d3f;
  height: 80px;
  width: 30px;
  border-radius: 5px;
  margin-right: 5px;
  margin-top: 5px;
  margin-bottom: 5px;
`;

const StyledEditSaveClockButton = styled(IconButton)`
  color: #00aaff;
  height: 80px;
`;

/** Styles bundled with widget - needed to keep styles displaying in immad and gate from widget lib */
const StyledOpsClockTile = styled(Box)`
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  background-color: #292d3f;
  height: 80px;
  width: 135px;
  border-radius: 5px;
  padding-top: 8px;
  padding-bottom: 5px;
  margin: 5px;
`;

const StyledOpsClockTimeDisplay = styled.div`
  font-size: 24px;
  display: flex;
  text-shadow: 0 0 3px #b6b6b6;
  font-family: "DSEG7-Classic";
  margin-bottom: 5px;
  font-style: italic;
  padding-bottom: 2px;
`;

const StyledOpsClockTextInputBox = styled(Box)`
  display: flex;
  align-items: center;
  flex-direction: row;
  justify-content: center;
`;

const StyledOpsClockTextInput = styled(TextField)`
  color: #ffffff;
  max-height: 24px;
  width: 130px;
  border-radius: 5px;
  & .MuiInputBase-input.Mui-disabled {
    -webkit-text-fill-color: #ffffff;
  }
`;

const StyledOpsClockUTCSelectAndDateDiv = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const StyledOpsClockDate = styled(Typography)`
  display: flex;
  color: #ffffff;
  font-size: 14px;
  text-shadow: 0 0 3px #b6b6b6;
  font-family: Roboto Mono, monospace;
  padding-top: 5px;
  justify-content: center;
  align-items: center;
`;

const StyledTimeOffsetMenu = styled(Menu)`
  max-height: 300px;
`;

const StyledTimeOffsetMenuItem = styled(MenuItem)`
  font-size: 11px;
  margin-right: -5px;
  margin-bottom: -8px;
  justify-content: right;
`;

const StyledTimeOffsetButton = styled(Button)`
  max-width: 30px;
  min-width: 30px;
  height: 10px;
  margin-left: 4px;
  color: #ffffff;
  text-shadow: 0 0 3px #b6b6b6;
  font-size: 12px;
  font-family: Roboto Mono, monospace;
  margin-top: 5px;
  font-weight: 200;
  &:disabled {
    -webkit-text-fill-color: #ffffff;
  }
`;

const StyledSpacerBox = styled(Box)`
  width: 2rem;
`;




// Styling the clock tile container using CSS Grid
const StyledClockTileReadonly = styled(Box)`
  display: grid;
  gap: 6px; // Small gap between rows
  background-color: transparent;
  width: 200px;
  justify-items: center;
  /* OPS Clock Glow */
  text-shadow: 0 0 6px #fff;
`;

const StyledBoxNameOffsetSectionReadOnly = styled(Box)`
  display: flex;
  justify-content: space-between;
  column-gap: 10px;
  height: auto;
  width: 163px;
`;
const StyledBoxClockNameReadOnly = styled(Box)`
  text-align: left;
  font-size: 14px;
  font-weight: 400px;
  font-family: Roboto Mono, monospace;
`;
const StyledBoxClockOffsetReadOnly = styled(Box)`
  text-align: right;
  font-size: 14px;
  font-weight: 100px;
  font-family: Roboto Mono, monospace;
`;

// Styling the time and date container for Read Only
const StyledTimeAndDateContainerReadOnly = styled(Box)`
  display: flex;
  justify-content: space-between; // Pushes the clockDate to the right
  align-items: flex-start; // Vertically centers clockDate with Time
  height: auto; // Sets the height of Time
  gap: 10px;
`;
// Styling the time container for Read Only
const StyledTimeContainerReadOnly = styled(Box)`
  font-family: "DSEG7-Classic";
  flex-grow: 1;
  text-align: left;
  font-size: 36px;
`;
// Styling the date container for Read Only
const StyledDateContainerReadOnly = styled(Box)`
  font-family: Roboto Mono, monospace;
  font-weight: 600;
  text-align: center;
  font-size: 16px;
  height: auto;
  padding: 3px 0px;
`;

// Styling the date container for Read Only
const StyledMappedClocks = styled.div`
  display: flex;
  flex-direction: row;
`;

/**OpsClockWidget data */
export interface OpsClockData {
  /** ID of the clock */
  id: number;
  /** Name of the clock */
  name: string;
  /** GMT offset for the clock */
  offset: number;
  /** Current time for the clock */
  currentTime: Date;
  /** Edit mode active for editing clocks */
  editMode?: boolean;
  /** Update function for name */
  onUpdateName?: (newName: string) => void;
  /** Update function for GMT offset */
  onUpdateOffset?: (newOffset: number) => void;
  /** Readonly clock format returned */
  readOnly?: boolean;
}

// Define your array of timezones
const timezones = [
  { offset: -12, city: "Fiji", timezone: "Etc/GMT+12" },
  { offset: -11, city: "Nome", timezone: "Pacific/Niue" },
  { offset: -10, city: "Hawaii", timezone: "Pacific/Honolulu" },
  { offset: -9, city: "Juneau", timezone: "America/Anchorage" },
  { offset: -8, city: "Los Angeles", timezone: "America/Los_Angeles" },
  { offset: -7, city: "Denver", timezone: "America/Denver" },
  { offset: -6, city: "Chicago", timezone: "America/Chicago" },
  { offset: -5, city: "New York", timezone: "America/New_York" },
  { offset: -4, city: "Nova Scotia", timezone: "America/Halifax" },
  { offset: -3, city: "Argentina", timezone: "America/Argentina/Buenos_Aires" },
  { offset: -2, city: "Greenland", timezone: "America/Noronha" },
  { offset: -1, city: "Portugal", timezone: "Atlantic/Azores" },
  { offset: 0, city: "Greenwich", timezone: "Etc/UTC" },
  { offset: 1, city: "Paris", timezone: "Europe/Paris" },
  { offset: 2, city: "Athens", timezone: "Europe/Athens" },
  { offset: 3, city: "Moscow", timezone: "Europe/Moscow" },
  { offset: 4, city: "Afghanistan", timezone: "Asia/Dubai" },
  { offset: 5, city: "New Delhi", timezone: "Asia/Karachi" },
  { offset: 6, city: "Bangladesh", timezone: "Asia/Dhaka" },
  { offset: 7, city: "Bangkok", timezone: "Asia/Bangkok" },
  { offset: 8, city: "Beijing", timezone: "Asia/Shanghai" },
  { offset: 9, city: "Tokyo", timezone: "Asia/Tokyo" },
  { offset: 10, city: "Sydney", timezone: "Australia/Sydney" },
  { offset: 11, city: "Solomon Islands", timezone: "Pacific/Guadalcanal" },
  { offset: 12, city: "New Zealand", timezone: "Pacific/Auckland" },
];
export const Clock = (props: OpsClockData) => {
  const { onUpdateName, onUpdateOffset, currentTime, readOnly } = props;
  const [clockName, setClockName] = useState<string>(props.name);
  const [gmtOffset, setGmtOffset] = useState<number>(props.offset);
  const [clockDate, setClockDate] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [shortGmtOffset, setShortGmtOffset] = useState<string>(
    `${gmtOffset >= 0 ? "+" + gmtOffset : gmtOffset}`
  );
  const [twoDigitGmtOffset, setTwoDigitGmtOffset] = useState<string>(
    (gmtOffset >= 0 ? "+" : "-") +
      Math.abs(gmtOffset).toString().padStart(2, "0")
  );
  const isEditMode = props.editMode;
  const [clockId, setClockId] = useState<number>(props.id);
  const [borderColor, setBorderColor] = useState<string>("transparent");
  const [clockNameTooltip, setClockNameTooltip] = useState<string>("");

  /** Sets a plus sign when loading in a non-negative gmt offset value and sends offset update to editor */
  useEffect(() => {
    if (gmtOffset >= 0) {
      setShortGmtOffset("+" + gmtOffset);
    }
    handleUpdateOffset();
    updateClockDate();
  }, [gmtOffset]);

  /** Sets the border color when editing the clocks to highlight editable elements */
  useEffect(() => {
    if (isEditMode) {
      setBorderColor("2px solid #00aaff");
      setClockNameTooltip("Edit Clock Name");
    } else {
      setBorderColor("2px solid transparent");
      setClockNameTooltip("");
    }
  }, [isEditMode]);

  /** Sends name update to editor */
  useEffect(() => {
    handleUpdateName();
  }, [clockName]);

  /** Calculates day and month based on current clock time and offset */
  const updateClockDate = () => {
    setClockDate(getFormattedDate(selectedTimezone, currentTime));
  };

  const getFormattedDate = (timezone: string, currentTime: Date) => {
    return moment(currentTime).tz(timezone).format("MMM DD").toUpperCase();
  };

  /** Sets clock name and increments clock id if existing to prevent workspace clocks changing default
   * @param event name of the clock changed in text input
   */
  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setClockName(event.target.value);
    setClockId(clockId + 1);
  };

  /** Callback to send name update to editor for saving and increments clock id if existing to prevent workspace clocks changing default */
  const handleUpdateName = () => {
    if (onUpdateName) {
      onUpdateName(clockName);
      setClockId(clockId + 1);
    }
  };

  /** Callback to send offset update to editor for saving and increments clock id if existing to prevent workspace clocks changing default*/
  const handleUpdateOffset = () => {
    if (onUpdateOffset) {
      onUpdateOffset(gmtOffset);
      setClockId(clockId + 1);
    }
  };

  /** Sets offset value of gmt for the clock display and increments clock id if existing to prevent workspace clocks changing default
   * @param value input from select element
   */
  const handleOffsetChange = (value: number) => {
    const formattedOffset = Math.abs(value).toString().padStart(2, "0");
    setGmtOffset(value);
    if (value > 0) {
      setShortGmtOffset("+" + value);
    } else if (value < 0) {
      setShortGmtOffset("" + value);
    } else {
      setShortGmtOffset("+0");
    }
    setClockId(clockId + 1);
    setTwoDigitGmtOffset((value >= 0 ? "+" : "-") + formattedOffset);
    handleOffsetMenuClose();
  };

  /** Handle click of offset menu button to open select menu
   * @param event click event
   */
  const handleOffsetMenuButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setMenuOpen(!menuOpen);
    setAnchorEl(event.currentTarget);
  };

  /** Handle close of offset menu button */
  const handleOffsetMenuClose = () => {
    setMenuOpen(!menuOpen);
    setAnchorEl(null);
  };

  /**
   * Get formatted time with daylight savings accounted for
   * @param timezone
   * @param currentTime
   */
  const getFormattedTime = (timezone: string, currentTime: Date) => {
    // use moment-timezone to get time in the specified timezone, accounting for daylight savings
    return moment(currentTime).tz(timezone).format("HH:mm");
  };

  // Use moment-timezone to calculate time and date, accounting for daylight savings
  const selectedTimezone =
    timezones.find((tz) => tz.offset === gmtOffset)?.timezone || "Etc/UTC";

  return (
    <>
      {readOnly ? (
        <StyledClockTileReadonly>
          <StyledBoxNameOffsetSectionReadOnly>
            {/* Top left: clockName */}
            <StyledBoxClockNameReadOnly>
              {clockName.toUpperCase()}
            </StyledBoxClockNameReadOnly>
            {/* Top right: shortGmtOffset */}
            <StyledBoxClockOffsetReadOnly>
              {twoDigitGmtOffset}
            </StyledBoxClockOffsetReadOnly>
          </StyledBoxNameOffsetSectionReadOnly>
          {/* Bottom row: formatted time and clockDate */}
          <StyledTimeAndDateContainerReadOnly>
            {/* current time on the left */}
            <StyledTimeContainerReadOnly>
              {getFormattedTime(selectedTimezone, currentTime)}
            </StyledTimeContainerReadOnly>
            {/* clockDate on the right */}
            <StyledDateContainerReadOnly>
              {clockDate}
            </StyledDateContainerReadOnly>
          </StyledTimeAndDateContainerReadOnly>
        </StyledClockTileReadonly>
      ) : (
        <StyledOpsClockTile>
          <StyledOpsClockUTCSelectAndDateDiv>
            <Box>
              <Tooltip title={"Change UTC"}>
                <StyledTimeOffsetButton
                  onClick={handleOffsetMenuButtonClick}
                  aria-controls={menuOpen ? "basic-menu" : undefined}
                  aria-haspopup="true"
                  aria-expanded={menuOpen ? "true" : undefined}
                  disabled={!isEditMode}
                  sx={{
                    border: `${borderColor}`,
                  }}
                >
                  {shortGmtOffset}
                </StyledTimeOffsetButton>
              </Tooltip>
            </Box>
            <StyledTimeOffsetMenu
              open={menuOpen}
              anchorEl={anchorEl}
              onClose={handleOffsetMenuClose}
            >
              {timezones.map((tz) => (
                <StyledTimeOffsetMenuItem
                  key={tz.offset}
                  dense
                  onClick={() => handleOffsetChange(tz.offset)}
                >
                  UTC{tz.offset >= 0 ? `+${tz.offset}` : tz.offset}: ({tz.city})
                </StyledTimeOffsetMenuItem>
              ))}
            </StyledTimeOffsetMenu>
            <Box>
              <StyledOpsClockDate>{clockDate}</StyledOpsClockDate>
            </Box>
            <StyledSpacerBox></StyledSpacerBox>
          </StyledOpsClockUTCSelectAndDateDiv>
          <StyledOpsClockTextInputBox>
            <Tooltip title={clockNameTooltip}>
              <StyledOpsClockTextInput
                variant={"standard"}
                fullWidth={true}
                InputProps={{
                  disableUnderline: true,
                  style: {
                    fontSize: 14,
                    color: "#FFFFFF",
                  },
                }}
                inputProps={{
                  maxLength: 15,
                  style: {
                    textAlign: "center",
                    textShadow: "0 0 3px #b6b6b6",
                    fontFamily: " Mono, monospace",
                  },
                }}
                size="small"
                value={clockName.toUpperCase()}
                onChange={handleNameChange}
                disabled={!isEditMode}
                sx={{
                  border: `${borderColor}`,
                }}
              />
            </Tooltip>
          </StyledOpsClockTextInputBox>
          <StyledOpsClockTimeDisplay>
            {getFormattedTime(selectedTimezone, currentTime)}
          </StyledOpsClockTimeDisplay>
        </StyledOpsClockTile>
      )}
    </>
  );
};

/** Describes the Ops Clock interface but serializable for the slice */
export interface AddOpsClockTile {
  /** ID of the clock */
  addClockFunction: () => void;
}

/** Tile button for adding an ops clock
 * @param props properties for the add ops clock tile button
 */
export const AddOpsClockTile = (props: AddOpsClockTile) => {
  const { addClockFunction } = props;
  return (
    <Tooltip title={"Add Clock"}>
      <StyledAddClockButtonDiv>
        <StyledAddClockButton onClick={addClockFunction} size="small">
          <PlusCircleIcon size={24} />
        </StyledAddClockButton>
      </StyledAddClockButtonDiv>
    </Tooltip>
  );
};

/** Describes the Ops Clock interface but serializable for the slice */
export interface OpsClockDataSerializable {
  /** ID of the clock */
  id: number;
  /** Name of the clock */
  name: string;
  /** GMT offset for the clock */
  offset: number;
  /** Current time for the clock */
  currentTime: number;
}

export interface OpsClockEditorWidgetProps {
  /** Event handler which is called when the clocks list changes to save edits */
  onClocksSave?: (value: OpsClockDataSerializable[]) => void;
  /** A list of existing clocks can be passed in for editing */
  existingClocks?: OpsClockDataSerializable[];
  /** Display clocks only or display editor */
  displayOnly?: boolean;
  /** Maximum number of clocks to add */
  maximumNumberOfClocks?: number;
  /** Read only mode active for all clocks */
  readonlyMode?: boolean;
  /** GATE Configuration page display */
  gateConfigurationMode?: boolean;
}

/** Interface for editing ops clocks overall container of the clocks */
export const OpsClockEditorWidgetLib = (props: OpsClockEditorWidgetProps) => {
  const {
    onClocksSave,
    existingClocks,
    displayOnly = false,
    readonlyMode = false,
    maximumNumberOfClocks,
    gateConfigurationMode = false,
  } = props;
  const [clockTime, setClockTime] = useState<Date>(new Date());
  const [editMode, setEditMode] = useState<boolean>(false);
  const defaultClock: OpsClockData = {
    id: Date.now(),
    name: "STRATCOM",
    offset: -6,
    currentTime: clockTime,
    editMode: editMode,
  };
  const [clocksList, setClocksList] = useState<OpsClockData[]>([defaultClock]);
  const [editSaveButtonTooltip, setEditSaveButtonTooltip] =
    useState<string>("Edit Clocks");
  const [maxClocksReached, setMaxClocksReached] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");

  /** Timer for clocks */
  useEffect(() => {
    const timer = setInterval(() => {
      setClockTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  /** Sets clock list with existing clocks if passed in and has clocks
   * If existing clocks is not greater than 0, sets the clocks list to the default clock */
  useEffect(() => {
    if (existingClocks) {
      if (existingClocks.length > 0) {
        formatClocksFromSlice(existingClocks);
      } else {
        setClocksList([defaultClock]);
      }
    } else {
      setClocksList([defaultClock]);
    }
  }, [existingClocks]);

  /** Tracks edit mode vs save mode for widget */
  useEffect(() => {
    if (editMode) {
      setEditSaveButtonTooltip("Apply Edits");
      if (onClocksSave) {
        formatClocksToSlice(clocksList);
      }
    } else {
      setEditSaveButtonTooltip("Edit Clocks");
    }
  }, [editMode]);

  /** Sets edit mode to true if using gate configuration page clock editor */
  useEffect(() => {
    if (gateConfigurationMode) {
      setEditMode(true);
    }
  }, [gateConfigurationMode]);

  /** Automatically save clocks if clock editor is on gate configuration page - no need for a save button */
  useEffect(() => {
    if (gateConfigurationMode && clocksList) {
      const clocksCopy = clocksList.slice();
      formatClocksToSlice(clocksCopy);
    }
  }, [clocksList]);

  /** Function to format clock data to import from the slice
   * @param existingClocks list of Ops Clocks
   */
  const formatClocksFromSlice = (
    existingClocks: OpsClockDataSerializable[]
  ) => {
    if (existingClocks) {
      const clocksWithTime = existingClocks.map((clock) => ({
        ...clock,
        id: clock.id,
        name: clock.name,
        offset: clock.offset,
        currentTime: clockTime,
      }));
      setClocksList(clocksWithTime);
    }
  };

  /** Function to format clock data to be stored in the slice
   * @param clocksList list of Ops Clocks
   */
  const formatClocksToSlice = (clocksList: OpsClockData[]) => {
    if (clocksList) {
      const clocksWithoutTime = clocksList.map((clock) => ({
        ...clock,
        id: clock.id,
        name: clock.name,
        offset: clock.offset,
        currentTime: clockTime.getTime(),
      }));
      if (onClocksSave && clocksWithoutTime) {
        onClocksSave(clocksWithoutTime);
      }
    }
  };

  /** Function to add a new clock */
  const addClock = () => {
    const newClock: OpsClockData = {
      id: Date.now(),
      name: `Clock ${clocksList.length + 1}`,
      offset: 0,
      currentTime: clockTime,
      editMode: editMode,
      onUpdateName: (newName) => handleUpdateName(newClock.id, newName),
      onUpdateOffset: (newOffset) => handleUpdateOffset(newClock.id, newOffset),
    };
    if (maximumNumberOfClocks && clocksList.length < maximumNumberOfClocks) {
      setClocksList([...clocksList, newClock]);
      setMaxClocksReached(false);
    } else if (!maximumNumberOfClocks) {
      setClocksList([...clocksList, newClock]);
      setMaxClocksReached(false);
    } else {
      setMaxClocksReached(true);
      setSnackbarMessage("Maximum number of clocks reached.");
    }
  };

  /** Function to delete a clock
   * @param id identifier of the selected clock
   */
  const deleteClock = (id: number) => {
    setClocksList(clocksList.filter((clock) => clock.id !== id));
  };

  /** Updated clock name to editor for saving
   * @param id identifier of the selected clock
   * @param newName updated name for the selected clock
   */
  const handleUpdateName = (id: number, newName: string) => {
    const updatedClockList = clocksList.map((clock) =>
      clock.id === id ? { ...clock, name: newName } : clock
    );
    setClocksList(updatedClockList);
  };

  /** Updated clock offset to editor for saving
   * @param id identifier of the selected clock
   * @param newOffset updated offset for the selected clock
   */
  const handleUpdateOffset = (id: number, newOffset: number) => {
    const updatedClockList = clocksList.map((clock) =>
      clock.id === id ? { ...clock, offset: newOffset } : clock
    );
    setClocksList(updatedClockList);
  };

  /** Click handler for setting save vs edit mode */
  const handleEditSaveButtonClick = () => {
    if (onClocksSave) {
      formatClocksToSlice(clocksList);
    }
    setEditMode(!editMode);
  };

  /** Close handler to close the max clocks snackbar notice */
  const handleClose = () => {
    setMaxClocksReached(false);
  };

  /** Special styling for the GATE configuration page to have add clock tiles be static and no edit/ save buttons */
  const gateConfigurationPageSetup = () => {
    if (maximumNumberOfClocks) {
      const buildAddClockTileList = Array.from({
        length: maximumNumberOfClocks - clocksList.length,
      });
      return (
        <StyledOpsClockDiv>
          <Grid container direction="row">
            {clocksList.map((clock) => (
              <StyledMappedClocks key={clock.id}>
                <Clock
                  id={clock.id}
                  name={clock.name}
                  offset={clock.offset}
                  currentTime={clockTime}
                  editMode={editMode}
                  onUpdateName={(newName) =>
                    handleUpdateName(clock.id, newName)
                  }
                  onUpdateOffset={(newOffset) =>
                    handleUpdateOffset(clock.id, newOffset)
                  }
                />
                {editMode && (
                  <Tooltip title={"Delete Clock"}>
                    <StyledDeleteClockButton
                      onClick={() => deleteClock(clock.id)}
                      disableRipple={true}
                    >
                      <X size={16} />
                    </StyledDeleteClockButton>
                  </Tooltip>
                )}
              </StyledMappedClocks>
            ))}
            {buildAddClockTileList.map(() => (
              <AddOpsClockTile addClockFunction={addClock} />
            ))}
          </Grid>
        </StyledOpsClockDiv>
      );
    }
  };

  return (
    <>
    <style>{`
      .clocks::-webkit-scrollbar {
        background-color: #282c34;
        height: 5px;
      }
      .clocks::-webkit-scrollbar-thumb {
        background: #404455;
        border-radius: 10px;
      }
    `}
    </style>
    <StyledOpsClockDiv className="clocks">
      {readonlyMode ? (
        <>
          {clocksList.map((clock) => (
            <StyledMappedClocks key={clock.id}>
              <Clock
                id={clock.id}
                name={clock.name}
                offset={clock.offset}
                currentTime={clockTime}
                editMode={editMode}
                onUpdateName={(newName) => handleUpdateName(clock.id, newName)}
                onUpdateOffset={(newOffset) =>
                  handleUpdateOffset(clock.id, newOffset)
                }
                readOnly={readonlyMode}
              />
            </StyledMappedClocks>
          ))}
        </>
      ) : (
        <>
          {displayOnly ? (
            <Grid container direction="row">
              {clocksList.map((clock) => (
                <StyledMappedClocks key={clock.id}>
                  <Clock
                    id={clock.id}
                    name={clock.name}
                    offset={clock.offset}
                    currentTime={clockTime}
                    editMode={editMode}
                    onUpdateName={(newName) =>
                      handleUpdateName(clock.id, newName)
                    }
                    onUpdateOffset={(newOffset) =>
                      handleUpdateOffset(clock.id, newOffset)
                    }
                  />
                </StyledMappedClocks>
              ))}
            </Grid>
          ) : (
            <>
              {gateConfigurationMode ? (
                gateConfigurationPageSetup()
              ) : (
                <>
                  <Grid container direction="row">
                    <StyledEditSaveClockButtonDiv>
                      <Tooltip title={editSaveButtonTooltip}>
                        <StyledEditSaveClockButton
                          onClick={() => handleEditSaveButtonClick()}
                        >
                          {editMode && <CheckCircleIcon size={24} />}
                          {!editMode && <PencilIcon size={24} />}
                        </StyledEditSaveClockButton>
                      </Tooltip>
                    </StyledEditSaveClockButtonDiv>
                    {clocksList.map((clock) => (
                      <StyledMappedClocks key={clock.id}>
                        <Clock
                          id={clock.id}
                          name={clock.name}
                          offset={clock.offset}
                          currentTime={clockTime}
                          editMode={editMode}
                          onUpdateName={(newName) =>
                            handleUpdateName(clock.id, newName)
                          }
                          onUpdateOffset={(newOffset) =>
                            handleUpdateOffset(clock.id, newOffset)
                          }
                        />
                        {editMode && (
                          <Tooltip title={"Delete Clock"}>
                            <StyledDeleteClockButton
                              onClick={() => deleteClock(clock.id)}
                              disableRipple={true}
                            >
                              <X size={16} />
                            </StyledDeleteClockButton>
                          </Tooltip>
                        )}
                      </StyledMappedClocks>
                    ))}
                    {editMode && (
                      <Tooltip title={"Add Clock"}>
                        <StyledAddClockButtonDiv>
                          <StyledAddClockButton onClick={addClock} size="small">
                            <PlusCircleIcon size={24} />
                          </StyledAddClockButton>
                        </StyledAddClockButtonDiv>
                      </Tooltip>
                    )}
                  </Grid>
                  <Snackbar
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    open={maxClocksReached}
                    onClose={handleClose}
                    autoHideDuration={5000}
                  >
                    <StyledMaxClocksAlert
                      onClose={handleClose}
                      variant={"filled"}
                      severity={"info"}
                    >
                      {snackbarMessage}
                    </StyledMaxClocksAlert>
                  </Snackbar>
                </>
              )}
            </>
          )}
        </>
      )}
    </StyledOpsClockDiv>
    </>
  );
};
