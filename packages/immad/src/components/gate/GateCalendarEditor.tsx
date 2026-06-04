import React, { ChangeEvent, useEffect, useState } from 'react';
import {
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    FormControl,
    FormControlLabel,
    MenuItem,
    Radio,
    RadioGroup,
    Select,
    SelectChangeEvent,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import TextInput from '../common/TextInput';
import {
    ActionButton,
    ActionButtonBox,
    FieldGroup,
    FixedWidgetActions,
    InputField,
    InputLabel,
    WidgetButtonBox,
    WidgetContainer,
    WidgetHeader,
} from '../common/styles';
import { RightButton } from '../layout/styles';
import { ApplicationItem, getAllGATEApps, queryCalendar } from './GateDataEditorHelper';
import { DatePickerContainer, StyledDatePickerGate } from './gateStyles';
import { StyledEditCalendarEventDiv } from './calendarWidget/styles';
import { GateCalendarEvent, GateCalendarEventSerializable, getPortalItemDataById } from '@stratcom/lib-functions';
import { useSnackbar } from 'notistack';
import { useSaveLoadContext } from '../../contexts/SaveLoad';
import { ConfigHelper } from '../../helpers/configHelper';
import { joinLabel } from '../../Constants';
import {
    setApplicationItems,
    setIsUpdate,
    setMissionIsExercise,
    setSelectedEventToEdit,
    setCurrentMissionName,
} from './GateDataEditorSlice';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import CalendarFeatureLayerGrid from './calendarWidget/CalendarFeatureLayerGrid';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import ICODWidget from '../widgets/ICODDateWidget/ICODWidget';

/** Props for the GateCalendarEditor component.*/
interface GateCalendarEditorProps {
    onSubmit: (event: GateCalendarEvent) => void;
    regionItems: ApplicationItem[];
    onDelete?: (event: GateCalendarEvent) => void;
    editMode?: boolean;
    initialEvent?: GateCalendarEvent;
}

const defaultStartDate = new Date();
defaultStartDate.setHours(0, 0, 0);
const defaultEndDate = new Date();
defaultEndDate.setHours(23, 59, 59);

const emptyCalendarEvent: GateCalendarEvent = {
    region: '',
    regionGUID: '',
    globalid: '',
    eventName: '',
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    location: null,
    description: '',
    participants: [],
    recurring: false,
    recurrenceType: null,
    recurrencePattern: null,
    recurrenceEndDate: null,
    numberOfOccurrences: 1,
    isChildRecord: false,
    isMasterRecord: false,
    parentGUID: null,
    lengthInDays: 0,
    importantAnniversary: false,
    comments: '',
    classification: 'Unclassified',
    highlight: false,
    initialDate: new Date(),
    alternateCalendar: null,
    isEndAfterOccurrencesChecked: false,
    icod: undefined,
};

const emptyGridSerializableEvent: GateCalendarEventSerializable = {
    region_name: '',
    objectid: '',
    globalid: '',
    event_name: '',
    date_start: 0,
    date_end: 0,
    location: null,
    description: '',
    participants: '',
    recurring: 0,
    initial_date: 0,
    recurrence_type: null,
    recurrence_pattern: null,
    recurrence_end_date: null,
    number_of_occurrences: 0,
    is_child_record: 0,
    is_master_record: 0,
    parent_guid: null,
    number_of_days: 0,
    important_anniversary: 0,
    comments: '',
    classification: 'Unclassified',
    highlight: false,
    alternate_calendar: null,
    icod: undefined,
};

/** The Gate Calendar editor Component */
function GateCalendarEditor(props: GateCalendarEditorProps): JSX.Element {
    const { initialEvent, onDelete, onSubmit, regionItems } = props;
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();
    const [gateCalendarEvent, setGateCalendarEvent] = useState<GateCalendarEvent>(initialEvent ?? emptyCalendarEvent);
    const [validRegionName, setValidRegionName] = useState<boolean>(false);
    const [validEventName, setValidEventName] = useState<boolean>(false);
    const [validDates, setValidDates] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [selectedAppId, setSelectedAppId] = useState<string>('');
    const [numberOfOccurrencesRadio, setNumberOfOccurrencesRadio] = useState<boolean | undefined>(
        emptyCalendarEvent.isEndAfterOccurrencesChecked
    );
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
    const [showEventSearch, setShowEventSearch] = useState<boolean>(false);
    const [calendarFeatureLayer, setCalendarFeatureLayer] = useState<FeatureLayer>();
    const applicationItems = useAppSelector((state) => state.gateCalendarEditorSlice.applicationItems);
    const { missionSelect } = useSaveLoadContext();
    const { enqueueSnackbar } = useSnackbar();
    const dispatch = useAppDispatch();
    const appConfig = ConfigHelper.getAppConfig();
    const selectedEventToEdit = useAppSelector((state) => state.gateCalendarEditorSlice.selectedEventToEdit);
    let calendarFeatureLayerId = appConfig.gate.calendarGuid;
    const isUpdate = useAppSelector((state) => state.gateCalendarEditorSlice.isUpdate);
    const deleteFutureEvents = useAppSelector((state) => state.gateCalendarEditorSlice.deleteFutureEvents);
    const updateFutureEvents = useAppSelector((state) => state.gateCalendarEditorSlice.updateFutureEvents);
    const [endAfterOccurrences, setEndAfterOccurrences] = useState<number>(20);
    const [icodDate, setICODDate] = useState<Date | undefined>();
    const [savedIcodDate, setSavedIcodDate] = useState<Date | undefined>();
    const currentMissionName = useAppSelector((state) => state.gateCalendarEditorSlice.currentMissionName);
    const [recurringCheckboxTooltip, setRecurringCheckboxTooltip] = useState<string>('');
    const [disableRecurringCheckbox, setDisableRecurringCheckbox] = useState<boolean>(false);
    const [updateButtonText, setUpdateButtonText] = useState<string>('');
    const [deleteButtonText, setDeleteButtonText] = useState<string>('');

    /** Any user can update any GATE group's item data except for visibility and tabs.
     * To update those two items the user must belong to the group.
     */
    useEffect(() => {
        getAllGATEApps(
            appConfig.portalUrl,
            appConfig.typekeywords.gateExercise,
            appConfig.typekeywords.gateMission,
            appConfig.oauthAppId
        ).then((appItems) => {
            appItems && dispatch(setApplicationItems(appItems));
        });
        fetchData();
        dispatch(setSelectedEventToEdit(emptyGridSerializableEvent));
    }, []);

    useEffect(() => {
        if (initialEvent) {
            setStartDate(initialEvent.startDate);
            setEndDate(initialEvent.endDate);
        } else {
            setStartDate(defaultStartDate);
            setEndDate(defaultEndDate);
        }
    }, []);

    useEffect(() => {
        if (gateCalendarEvent) {
            validateRequiredValues();
        }
    }, [gateCalendarEvent]);

    useEffect(() => {
        if (deleteFutureEvents) {
            handleDelete();
        }
    }, [deleteFutureEvents]);

    useEffect(() => {
        if (updateFutureEvents) {
            handleSubmit();
        }
    }, [updateFutureEvents]);

    useEffect(() => {
        if (selectedEventToEdit.objectid !== '') {
            const convertedStartDate = new Date(selectedEventToEdit.date_start);
            const convertedEndDate = new Date(selectedEventToEdit.date_end);
            const convertedInitialDate = new Date(selectedEventToEdit.initial_date);
            const icodSelectedDate = selectedEventToEdit.icod ? new Date(selectedEventToEdit.icod) : undefined;
            setICODDate(icodSelectedDate);
            setSavedIcodDate(icodSelectedDate);
            setStartDate(convertedStartDate);
            setEndDate(convertedEndDate);
            let convertedRecurrenceEndDate = null;
            if (selectedEventToEdit.recurrence_end_date && selectedEventToEdit.recurring) {
                convertedRecurrenceEndDate = new Date(selectedEventToEdit.recurrence_end_date);
            }
            setGateCalendarEvent({
                ...gateCalendarEvent,
                region: selectedEventToEdit.region_name,
                regionGUID: selectedEventToEdit.objectid,
                globalid: selectedEventToEdit.globalid,
                eventName: selectedEventToEdit.event_name,
                location: selectedEventToEdit.location,
                description: selectedEventToEdit.description,
                recurrenceType: selectedEventToEdit.recurrence_type,
                recurrencePattern: selectedEventToEdit.recurrence_pattern,
                numberOfOccurrences: selectedEventToEdit.number_of_occurrences,
                parentGUID: selectedEventToEdit.parent_guid,
                lengthInDays: selectedEventToEdit.number_of_days,
                comments: selectedEventToEdit.comments,
                participants: [selectedEventToEdit.participants],
                classification: selectedEventToEdit.classification,
                highlight: selectedEventToEdit.highlight,
                alternateCalendar: selectedEventToEdit.alternate_calendar,
                importantAnniversary: selectedEventToEdit.important_anniversary === 1,
                recurring: selectedEventToEdit.recurring === 1,
                isChildRecord: selectedEventToEdit.is_child_record === 1,
                isMasterRecord: selectedEventToEdit.is_master_record === 1,
                startDate: convertedStartDate,
                endDate: convertedEndDate,
                initialDate: convertedInitialDate,
                recurrenceEndDate: convertedRecurrenceEndDate,
                icod: icodSelectedDate,
            });
            dispatch(setIsUpdate(true));
        } else {
            handleFormReset();
        }
        if (selectedEventToEdit.is_master_record === 1) {
            enqueueSnackbar(
                'Recurring event parent selected. Any updates or delete actions will apply to all events in the series.',
                { variant: 'warning' }
            );
        }
        handleUpdateButtonText();
        handleDeleteButtonText();
        // sets the radio button based on setting from selected event
        if (selectedEventToEdit.number_of_occurrences > 1) {
            setNumberOfOccurrencesRadio(true);
        } else {
            setNumberOfOccurrencesRadio(false);
        }
    }, [selectedEventToEdit]);

    useEffect(() => {
        dispatch(setCurrentMissionName(missionSelect));
        setGateCalendarEvent({ ...gateCalendarEvent, region: missionSelect });
    }, [missionSelect]);

    useEffect(() => {
        if (isUpdate && selectedEventToEdit.recurring === 0) {
            setDisableRecurringCheckbox(true);
            setRecurringCheckboxTooltip('Cannot make existing event recurring. Create a new recurring event series.');
        } else {
            setDisableRecurringCheckbox(false);
            setRecurringCheckboxTooltip('');
        }
    }, [isUpdate, selectedEventToEdit]);

    useEffect(() => {
        fetchData();
    }, [selectedAppId]);

    useEffect(() => {
        if (applicationItems && currentMissionName !== '') {
            const currentlySelectedApp: any = applicationItems.find((item) => item.title === currentMissionName);
            const regionGuid = regionItems.find((item) => item.title === currentMissionName);
            if (currentlySelectedApp && regionGuid) {
                setGateCalendarEvent({
                    ...gateCalendarEvent,
                    region: currentMissionName,
                    regionGUID: regionGuid?.id,
                });
                setSelectedAppId(currentlySelectedApp.id);
            } else {
                console.error('Invalid mission title', currentMissionName);
                setErrorMessage(
                    !currentlySelectedApp
                        ? joinLabel('The currently selected mission was not found in the', appConfig?.gate?.gateLabel ?? '', 'mission list.')
                        : ''
                );
            }
        }
    }, [applicationItems, currentMissionName]);

    useEffect(() => {
        if (gateCalendarEvent.recurrenceType !== null) {
            // setting default of 1 year, 1 month, 1 week
            setGateCalendarEvent({
                ...gateCalendarEvent,
                recurrencePattern: '1',
            });
        }
        if (gateCalendarEvent.recurrenceType === 'monthly') {
            setEndAfterOccurrences(200);
        } else if (gateCalendarEvent.recurrenceType === 'weekly') {
            setEndAfterOccurrences(1000);
        }
    }, [gateCalendarEvent.recurrenceType]);

    /**
     * Handle searching of the calendar feature layer based on the ID
     */
    const fetchData = async () => {
        if (selectedAppId) {
            const metadata = await getPortalItemDataById(selectedAppId, appConfig.portalUrl, appConfig.oauthAppId);
            if (metadata.isExercise) {
                dispatch(setMissionIsExercise(true));
                calendarFeatureLayerId = appConfig.gate.exercise.exCalendarGuid;
            } else {
                dispatch(setMissionIsExercise(false));
            }
            await queryCalendar(calendarFeatureLayerId).then((layer) => {
                setCalendarFeatureLayer(layer);
            });
        }
    };

    /**
     * Handle resetting of the form to empty values after submit
     */
    const handleFormReset = () => {
        if (currentMissionName !== '') {
            const regionGuid = regionItems.find((item) => item.title === currentMissionName);
            if (regionGuid) {
                defaultStartDate.setHours(0, 0, 0);
                defaultEndDate.setHours(23, 59, 59);
                setStartDate(defaultStartDate);
                setEndDate(defaultEndDate);
                setGateCalendarEvent({
                    ...emptyCalendarEvent,
                    region: currentMissionName,
                    regionGUID: regionGuid.id,
                    startDate: defaultStartDate,
                    endDate: defaultEndDate,
                });
            }
        } else {
            defaultStartDate.setHours(0, 0, 0);
            defaultEndDate.setHours(23, 59, 59);
            setGateCalendarEvent(emptyCalendarEvent);
            setStartDate(defaultStartDate);
            setEndDate(defaultEndDate);
        }
        setICODDate(undefined);
        defaultStartDate.setHours(0, 0, 0);
        defaultEndDate.setHours(23, 59, 59);
        dispatch(setIsUpdate(false));
        setShowEventSearch(false);
        setNumberOfOccurrencesRadio(false);
    };
    /**
     * Handle Submit of new event to feature class callback
     */
    const handleSubmit = () => {
        validateRequiredValues();
        if (!validRegionName && !validEventName && !validDates) {
            onSubmit(gateCalendarEvent);
            handleFormReset();
        }
    };

    /**
     * Handle validation of event required fields
     */
    const validateRequiredValues = () => {
        if (gateCalendarEvent.region === '') {
            setValidRegionName(true);
        } else {
            setValidRegionName(false);
        }
        if (gateCalendarEvent.eventName === '') {
            setValidEventName(true);
        } else {
            setValidEventName(false);
        }
        if (startDate && endDate && startDate > endDate) {
            setValidDates(true);
        } else {
            setValidDates(false);
        }
    };

    /**
     * Handle click event on Delete button.
     * Opens Delete Confirmation dialog.
     */
    const handleDelete = () => {
        setIsDeleteDialogOpen(true);
    };

    /**
     * Handle when Cancel button is clicked on Delete Confirmation dialog.
     */
    const handleDeleteEventCancelClick = () => {
        setIsDeleteDialogOpen(false);
    };

    /**
     * Handle when OK button is clicked on Delete Confirmation dialog.
     */
    const handleDeleteEventOKClick = () => {
        setIsDeleteDialogOpen(false);
        if (onDelete) {
            onDelete(gateCalendarEvent);
        }
        handleFormReset();
    };

    /**
     * Handle click event on edit button
     * Finds the calendar feature layer and opens dialog
     */
    const handleEditButtonClicked = () => {
        setShowEventSearch(!showEventSearch);
    };

    /**
     * Handle change event on the length in days change
     * @param value the value to replace the length of days with
     */
    const handleLengthInDaysChange = (value: string) => {
        const newLengthInDays = value !== '' ? parseInt(value) : 0;
        const newEndDate = new Date(startDate);
        if (newEndDate && newLengthInDays >= 0) {
            newEndDate.setDate(newEndDate.getDate() + newLengthInDays);
            if (!isNaN(newEndDate.getTime())) {
                // just update end date as this length grows or shrinks
                setEndDate(newEndDate);
                setGateCalendarEvent({
                    ...gateCalendarEvent,
                    lengthInDays: newLengthInDays >= 0 ? newLengthInDays : 0,
                    endDate: newEndDate,
                });
            } else {
                enqueueSnackbar('Invalid Date. Length of days is too long.', { variant: 'error' });
            }
        }
    };

    /**
     * Handle change event on the start date
     * @param newStartDate new start date and time selected
     */
    const handleStartDateChange = (newStartDate: Date) => {
        const lengthInDays = gateCalendarEvent.lengthInDays;
        setStartDate(newStartDate);
        const newEndDate = new Date(newStartDate);
        if (lengthInDays > 0 && endDate) {
            const timeDifference = endDate.getTime() - newStartDate.getTime();
            const newLengthInDays = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
            if (!isNaN(endDate.getTime())) {
                // as long as end date is valid update both start and length of days
                setGateCalendarEvent({
                    ...gateCalendarEvent,
                    startDate: newStartDate,
                    lengthInDays: newLengthInDays > 0 ? newLengthInDays : 0,
                });
            } else {
                // Handle invalid date if needed
                enqueueSnackbar('Invalid Date. Length of days is too long.', { variant: 'error' });
            }
        } else {
            // do not update end date if length in days is 0
            if (lengthInDays === 0 && endDate && newStartDate > endDate) {
                newEndDate.setHours(23, 59, 59, 999); // set time to 23:59:59
                setEndDate(newEndDate);
                const timeDifference = newEndDate.getTime() - newStartDate.getTime();
                const newLengthInDays = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
                setGateCalendarEvent({
                    ...gateCalendarEvent,
                    startDate: newStartDate,
                    endDate: newEndDate,
                    lengthInDays: newLengthInDays > 0 ? newLengthInDays : 0,
                });
            } else {
                // update length in days if it goes to an older start date
                const timeDifference = endDate.getTime() - newStartDate.getTime();
                const newLengthInDays = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
                setGateCalendarEvent({
                    ...gateCalendarEvent,
                    startDate: newStartDate,
                    lengthInDays: newLengthInDays > 0 ? newLengthInDays : 0,
                });
            }
        }
    };

    /**
     * Handle change event on the end date
     * @param newEndDate new end date and time selected
     */
    const handleEndDateChange = (newEndDate: Date) => {
        const start = new Date(startDate);
        const timeDifference = newEndDate.getTime() - start.getTime();
        const newLengthInDays = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        const adjustedEndDate = new Date(start.getTime() + newLengthInDays * (1000 * 60 * 60 * 24));

        setEndDate(newEndDate);

        if (newLengthInDays === 0) {
            setGateCalendarEvent({
                ...gateCalendarEvent,
                endDate: newEndDate,
                lengthInDays: newLengthInDays > 0 ? newLengthInDays : 0,
            });
        } else {
            setGateCalendarEvent({
                ...gateCalendarEvent,
                endDate: adjustedEndDate,
                lengthInDays: newLengthInDays > 0 ? newLengthInDays : 0,
            });
        }
    };

    /**
     * Handle change event on the mission title
     * @param event change event
     */
    const handleSelectedMissionTitleChanged = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        const regionGuid = regionItems.find((item) => item.title === value);
        if (value && regionGuid) {
            setGateCalendarEvent({ ...gateCalendarEvent, region: event.target.value, regionGUID: regionGuid?.id });
            dispatch(setCurrentMissionName(value as string));
        } else {
            console.error('Invalid mission title', value);
        }
    };
    /**
     * Handle change event on the participants
     * @param event change event
     */
    const handleParticipantsChange = (event: ChangeEvent<HTMLInputElement>) => {
        const inputValue = event.target.value;
        const participantsArray = inputValue.split(',').map((participant: string) => participant);
        setGateCalendarEvent({
            ...gateCalendarEvent,
            participants: participantsArray,
        });
    };
    /**
     * Handle change event on the participants lose focus
     */
    const handleParticipantsLoseFocus = () => {
        const participantsArray = gateCalendarEvent.participants.map((participant: string) => participant.trim());
        setGateCalendarEvent({
            ...gateCalendarEvent,
            participants: participantsArray,
        });
    };

    /**
     * Handle change event on the recurrence end date
     * @param newRecurrenceEndDate new end date and time selected
     */
    const handleRecurrenceEndDateChange = (newRecurrenceEndDate: Date) => {
        setGateCalendarEvent({
            ...gateCalendarEvent,
            recurrenceEndDate: newRecurrenceEndDate,
        });
    };

    /**
     * Handle change event to implement recurrence options
     * @param event change event
     */
    const setRecurrence = (event: React.ChangeEvent<HTMLInputElement>) => {
        setGateCalendarEvent({
            ...gateCalendarEvent,
            recurring: event.target.checked,
            isMasterRecord: event.target.checked,
        });
    };

    /**
     * Handle setting the default recurrence end date
     * @param start starting date of the event
     */
    const calculateDefaultRecurrenceEnd = (start: Date | undefined) => {
        if (start) {
            const defaultRecurrenceEnd = new Date(start);
            if (gateCalendarEvent.recurrenceType === 'yearly') {
                defaultRecurrenceEnd.setFullYear(start.getFullYear() + 10);
                setGateCalendarEvent({
                    ...gateCalendarEvent,
                    recurrenceEndDate: defaultRecurrenceEnd,
                });
            } else if (gateCalendarEvent.recurrenceType === 'monthly') {
                defaultRecurrenceEnd.setMonth(start.getMonth() + 12);
                setGateCalendarEvent({
                    ...gateCalendarEvent,
                    recurrenceEndDate: defaultRecurrenceEnd,
                });
            } else if (gateCalendarEvent.recurrenceType === 'weekly') {
                defaultRecurrenceEnd.setDate(start.getDate() + 7 * 4);
                setGateCalendarEvent({
                    ...gateCalendarEvent,
                    recurrenceEndDate: defaultRecurrenceEnd,
                });
            }
            return defaultRecurrenceEnd;
        }
    };

    /**
     * Handle change event on the number of occurrences input; when this is selected and changed, the occurrences flag
     * is set to true so the number of occurrences calculation will NOT run when the event is submitted.
     * @param value change event passed in
     */
    const handleNumberOfOccurrencesChange = (value: string) => {
        const newOccurrences = value !== '' ? parseInt(value) : 1;
        setGateCalendarEvent({
            ...gateCalendarEvent,
            numberOfOccurrences: newOccurrences,
            isEndAfterOccurrencesChecked: true,
        });
    };

    /**
     * Handle change event on the recurrence pattern, occur every n years in this case
     * @param event change event
     */
    const handleNumberOfYearsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setGateCalendarEvent({
            ...gateCalendarEvent,
            recurrencePattern: event.target.value,
        });
    };

    /**
     * Handle change event on the recurrence pattern, occur every n months in this case
     * @param event change event
     */
    const handleNumberOfMonthsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setGateCalendarEvent({
            ...gateCalendarEvent,
            recurrencePattern: event.target.value,
        });
    };

    /**
     * Handle change event on the recurrence pattern, occur every n weeks in this case
     * @param event change event
     */
    const handleNumberOfWeeksChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setGateCalendarEvent({
            ...gateCalendarEvent,
            recurrencePattern: event.target.value,
        });
    };

    // commenting out and retaining in case of rollback
    // const handleSetDeleteFutureEvents = () => {
    //     dispatch(setDeleteFutureEvents(true));
    // };

    // commenting out and retaining in case of rollback
    // const handleSetUpdateFutureEvents = () => {
    //     dispatch(setUpdateFutureEvents(true));
    // };

    /**
     * Handle the calendar date change
     * @param newDate user selected date
     */
    const handleIcodDateChange = (newDate: Date) => {
        setICODDate(newDate);
        setGateCalendarEvent({
            ...gateCalendarEvent,
            icod: newDate,
        });
    };

    /**
     * Handles display and some default setting of recurrence options based on recurrence type
     */
    const recurrenceTypeOptions = (recurrenceType: string | null) => {
        if (recurrenceType === 'yearly') {
            return (
                <>
                    <Box display='flex' flexDirection='row' alignItems='center'>
                        <InputLabel>Recur every </InputLabel>
                        <TextField
                            inputProps={{ type: 'number', min: 1, max: 20 }}
                            size={'small'}
                            value={gateCalendarEvent.recurrencePattern}
                            sx={{ marginLeft: 2, marginRight: 2 }}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                handleNumberOfYearsChange(e);
                            }}
                        />
                        <InputLabel> year(s)</InputLabel>
                    </Box>
                    <RadioGroup defaultValue='onDate'>
                        <DatePickerContainer>
                            <FormControlLabel value='onDate' control={<Radio />} label='On: ' />
                            <StyledDatePickerGate
                                id={'recurrenceDateTime'}
                                dateFormat={'MMMM d'}
                                selected={startDate}
                                showMonthDropdown
                                disableKeyboardNavigation
                                onChange={(date: Date) => {
                                    if (date) {
                                        handleStartDateChange(date);
                                    }
                                }}
                            ></StyledDatePickerGate>
                        </DatePickerContainer>
                        {/*keep comments - future ticket to complete this piece*/}
                        {/*<FormControlLabel value='onTheSpecificDay' control={<Radio />} label='On the: ' />*/}
                    </RadioGroup>
                </>
            );
        } else if (recurrenceType === 'monthly') {
            return (
                <>
                    <Box display='flex' flexDirection='row' alignItems='center'>
                        <InputLabel>Recur every </InputLabel>
                        <TextField
                            inputProps={{ type: 'number', min: 1, max: 11 }}
                            size={'small'}
                            value={gateCalendarEvent.recurrencePattern}
                            sx={{ marginLeft: 2, marginRight: 2 }}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                handleNumberOfMonthsChange(e);
                            }}
                        />
                        <InputLabel> month(s)</InputLabel>
                    </Box>
                    <RadioGroup defaultValue='onDate'>
                        <DatePickerContainer>
                            <FormControlLabel value='onDate' control={<Radio />} label='On: ' />
                            <StyledDatePickerGate
                                id={'recurrenceDateTime'}
                                dateFormat={'MMMM d'}
                                selected={startDate}
                                showMonthDropdown
                                disableKeyboardNavigation
                                onChange={(date: Date) => {
                                    if (date) {
                                        handleStartDateChange(date);
                                    }
                                }}
                            ></StyledDatePickerGate>
                        </DatePickerContainer>
                        {/*keep comments - future ticket to complete this piece*/}
                        {/*<FormControlLabel value='onTheSpecificDay' control={<Radio />} label='On the: ' />*/}
                    </RadioGroup>
                </>
            );
        } else if (recurrenceType === 'weekly') {
            return (
                <>
                    <Box display='flex' flexDirection='row' alignItems='center'>
                        <InputLabel>Recur every </InputLabel>
                        <TextField
                            inputProps={{ type: 'number', min: 1, max: 51 }}
                            size={'small'}
                            value={gateCalendarEvent.recurrencePattern}
                            sx={{ marginLeft: 2, marginRight: 2 }}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                handleNumberOfWeeksChange(e);
                            }}
                        />
                        <InputLabel> week(s)</InputLabel>
                    </Box>
                    <RadioGroup defaultValue='onDate'>
                        <DatePickerContainer>
                            <FormControlLabel value='onDate' control={<Radio />} label='On: ' />
                            <StyledDatePickerGate
                                id={'recurrenceDateTime'}
                                dateFormat={'MMMM d'}
                                selected={startDate}
                                showMonthDropdown
                                disableKeyboardNavigation
                                onChange={(date: Date) => {
                                    if (date) {
                                        handleStartDateChange(date);
                                    }
                                }}
                            ></StyledDatePickerGate>
                        </DatePickerContainer>
                        {/*keep comments - future ticket to complete this piece*/}
                        {/*<FormControlLabel value='onTheSpecificDay' control={<Radio />} label='On the: ' />*/}
                    </RadioGroup>
                </>
            );
        }
    };

    /**
     * Handles setting of update button text depending on if selected event is recurring or not
     */
    const handleUpdateButtonText = () => {
        if (selectedEventToEdit.recurring === 1 && selectedEventToEdit.is_master_record === 1) {
            setUpdateButtonText('Update All Events');
        } else {
            setUpdateButtonText('Update');
        }
        // {/* Commenting this code out to fit the requirements of the ticket but keeping
        // in case a rollback is needed for displaying/ updating single child events */}
        // {/*{selectedEventToEdit.recurring === 1 &&*/}
        // {/*    selectedEventToEdit.is_master_record === 0 && (*/}
        // {/*        <MenuItem onClick={handleSetUpdateFutureEvents}>*/}
        // {/*            All following events*/}
        // {/*        </MenuItem>*/}
        // {/*    )}*/}
    };

    /**
     * Handles setting of delete button text depending on if selected event is recurring or not
     */
    const handleDeleteButtonText = () => {
        if (selectedEventToEdit.recurring === 1 && selectedEventToEdit.is_master_record === 1) {
            setDeleteButtonText('Delete All Events');
        } else {
            setDeleteButtonText('Delete');
        }
        // {/* Commenting this code out to fit the requirements of the ticket but keeping
        // in case a rollback is needed for displaying/ deleting single child events */}
        // {/*{selectedEventToEdit.recurring === 1 &&*/}
        // {/*    selectedEventToEdit.is_master_record === 0 && (*/}
        // {/*        <MenuItem onClick={handleSetDeleteFutureEvents}>*/}
        // {/*            All following events*/}
        // {/*        </MenuItem>*/}
        // {/*    )}*/}
    };

    return (
        <div style={{ marginBottom: '60px' }}>
            <Dialog open={isDeleteDialogOpen}>
                <DialogContent>{joinLabel('Are you sure you would like to delete this', appConfig?.gate?.gateLabel ?? '', 'Calendar Event?')}</DialogContent>
                <DialogActions>
                    <RightButton color='primary' variant='contained' onClick={handleDeleteEventCancelClick}>
                        Cancel
                    </RightButton>
                    <RightButton color='secondary' variant='contained' onClick={handleDeleteEventOKClick}>
                        OK
                    </RightButton>
                </DialogActions>
            </Dialog>
            <WidgetHeader position={'static'}>
                <InputLabel>{joinLabel(appConfig?.gate?.gateLabel ?? '', 'Calendar Editor Widget')}</InputLabel>
            </WidgetHeader>
            <WidgetContainer>
                <FieldGroup>
                    {applicationItems.length > 0 ? <Typography variant='caption'>Select A Mission</Typography> : ''}
                    <InputField
                        fullWidth
                        variant='outlined'
                        color='secondary'
                        select
                        required
                        error={errorMessage !== ''}
                        value={currentMissionName}
                        onChange={handleSelectedMissionTitleChanged}
                        helperText={errorMessage !== '' ? errorMessage : ''}
                    >
                        {applicationItems.map((appItem: ApplicationItem) => (
                            <MenuItem key={appItem.title} value={appItem.title}>
                                {appItem.title}
                            </MenuItem>
                        ))}
                    </InputField>
                </FieldGroup>
                <Button
                    variant='contained'
                    style={{ marginTop: 10 }}
                    onClick={() => {
                        handleEditButtonClicked();
                    }}
                >
                    Edit Existing Event
                </Button>
                {showEventSearch && calendarFeatureLayer && (
                    <StyledEditCalendarEventDiv>
                        <CalendarFeatureLayerGrid featureLayer={calendarFeatureLayer} />
                    </StyledEditCalendarEventDiv>
                )}
                <WidgetContainer>
                    <TextInput
                        label='Event Name'
                        fieldName='Event Name'
                        fieldValue={gateCalendarEvent.eventName}
                        placeHolder='Enter event name...'
                        error={validEventName}
                        helperText={validEventName ? 'Event Name Required' : ''}
                        changeInput={(e: ChangeEvent<HTMLInputElement>) => {
                            setGateCalendarEvent({ ...gateCalendarEvent, eventName: e.target.value });
                            validateRequiredValues();
                        }}
                    />
                    <DatePickerContainer>
                        <InputLabel htmlFor={'startDateTime'} className='form-label'>
                            Start Date/Time
                        </InputLabel>
                        <StyledDatePickerGate
                            id={'startDateTime'}
                            dateFormat={"yyyy-MM-dd'T'HH:mm'Z'"}
                            showTimeSelect
                            timeFormat={'HH:mm'}
                            selected={startDate}
                            timeIntervals={15}
                            disableKeyboardNavigation
                            onChange={(date: Date) => {
                                if (date) {
                                    handleStartDateChange(date);
                                }
                            }}
                        ></StyledDatePickerGate>

                        <InputLabel htmlFor={'end-date-time'} className='form-label'>
                            End Date/Time
                        </InputLabel>
                        <StyledDatePickerGate
                            id={'end-date-time'}
                            dateFormat={"yyyy-MM-dd'T'HH:mm'Z'"}
                            showTimeSelect
                            timeFormat={'HH:mm'}
                            selected={endDate}
                            timeIntervals={15}
                            disableKeyboardNavigation
                            onChange={(date: Date) => {
                                if (date) {
                                    handleEndDateChange(date);
                                }
                            }}
                        ></StyledDatePickerGate>
                    </DatePickerContainer>
                    <InputLabel htmlFor={'numberDays'} className='form-label'>
                        Length in Days
                    </InputLabel>
                    <TextField
                        id='numberDays'
                        type='number'
                        fullWidth
                        value={gateCalendarEvent.lengthInDays?.toString()}
                        required
                        error={validDates}
                        helperText={validDates ? 'Invalid Dates. Need date range 0 or greater in days.' : ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleLengthInDaysChange(e.target.value)}
                    />
                    <TextInput
                        label='Location'
                        fieldName='Location'
                        fieldValue={gateCalendarEvent.location || ''}
                        placeHolder='Enter location...'
                        changeInput={(e: ChangeEvent<HTMLInputElement>) =>
                            setGateCalendarEvent({ ...gateCalendarEvent, location: e.target.value })
                        }
                    />
                    <TextInput
                        label='Description'
                        multiLine={true}
                        fieldName='Description'
                        placeHolder='Enter description...'
                        fieldValue={gateCalendarEvent?.description}
                        changeInput={(e: ChangeEvent<HTMLInputElement>) =>
                            setGateCalendarEvent({ ...gateCalendarEvent, description: e.target.value })
                        }
                    />
                    <InputLabel id='comments-text-field' className='form-label' shrink={true}>
                        Comments
                    </InputLabel>
                    <TextField
                        id='comments-text-field'
                        multiline
                        rows={4} // You can adjust the number of rows
                        variant='outlined'
                        value={gateCalendarEvent.comments}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setGateCalendarEvent({ ...gateCalendarEvent, comments: e.target.value })
                        }
                        fullWidth
                        placeholder='Enter your comments...'
                    />

                    <TextInput
                        label='Participants'
                        multiLine={true}
                        fieldName='Participants'
                        helperText='Enter participants names separated by ","'
                        placeHolder='Enter participants...'
                        fieldValue={gateCalendarEvent.participants.join(',')}
                        changeInput={handleParticipantsChange}
                        onBlur={handleParticipantsLoseFocus}
                    />
                    {/* recurrence portion */}
                    <Tooltip title={recurringCheckboxTooltip} placement={'bottom-start'}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={gateCalendarEvent.recurring}
                                    onChange={setRecurrence}
                                    disabled={disableRecurringCheckbox}
                                />
                            }
                            label='Recurring Event'
                        />
                    </Tooltip>
                    {gateCalendarEvent.recurring && (
                        <>
                            <Box marginBottom={2}>
                                <FormControl>
                                    <InputLabel>Repeat every </InputLabel>
                                    <Select
                                        id='recurrence-type-select'
                                        value={gateCalendarEvent.recurrenceType ? gateCalendarEvent.recurrenceType : ''}
                                        onChange={(e) =>
                                            setGateCalendarEvent({
                                                ...gateCalendarEvent,
                                                recurrenceType: e.target.value,
                                            })
                                        }
                                    >
                                        <MenuItem value='yearly'>Year</MenuItem>
                                        <MenuItem value='monthly'>Month</MenuItem>
                                        <MenuItem value='weekly'>Week</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </>
                    )}
                    {gateCalendarEvent.recurring && recurrenceTypeOptions(gateCalendarEvent.recurrenceType)}
                    {gateCalendarEvent.recurring && (
                        <Box>
                            <InputLabel htmlFor={'recurrenceEndDate'} className='form-label'>
                                Choose End Date
                            </InputLabel>
                            <RadioGroup
                                value={numberOfOccurrencesRadio ? 'afterNumOccurrences' : 'endOn'}
                                onChange={() => setNumberOfOccurrencesRadio(!numberOfOccurrencesRadio)}
                            >
                                <DatePickerContainer>
                                    <FormControlLabel value='endOn' control={<Radio />} label='End on: ' />
                                    <StyledDatePickerGate
                                        id={'recurrenceEndDate'}
                                        dateFormat={'yyyy-MM-dd'}
                                        selected={
                                            gateCalendarEvent.recurrenceEndDate
                                                ? gateCalendarEvent.recurrenceEndDate
                                                : calculateDefaultRecurrenceEnd(startDate)
                                        }
                                        showMonthDropdown
                                        showYearDropdown
                                        dropdownMode={'select'}
                                        disabledKeyboardNavigation
                                        disabled={numberOfOccurrencesRadio}
                                        onChange={(date: Date) => {
                                            handleRecurrenceEndDateChange(date);
                                        }}
                                    ></StyledDatePickerGate>
                                </DatePickerContainer>
                                <Box display='flex' flexDirection='row' alignItems='center'>
                                    <FormControlLabel
                                        value='afterNumOccurrences'
                                        control={<Radio />}
                                        label='End after '
                                    />
                                    <TextField
                                        id={'numberOfOccurrencesInput'}
                                        disabled={!numberOfOccurrencesRadio}
                                        type='number'
                                        inputProps={{ min: 1, max: endAfterOccurrences }}
                                        size={'small'}
                                        value={gateCalendarEvent.numberOfOccurrences?.toString()}
                                        sx={{ marginRight: 2 }}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                            handleNumberOfOccurrencesChange(e.target.value);
                                        }}
                                    />
                                    <InputLabel>occurrence(s)</InputLabel>
                                </Box>
                            </RadioGroup>
                        </Box>
                    )}
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={gateCalendarEvent.importantAnniversary}
                                onChange={(event) =>
                                    setGateCalendarEvent({
                                        ...gateCalendarEvent,
                                        importantAnniversary: event.target.checked,
                                    })
                                }
                            />
                        }
                        label='Important Anniversary'
                    />
                    <FormControl fullWidth sx={{ pb: '16.5px' }}>
                        <InputLabel id='classification-select-label' className='form-label'>
                            Classification
                        </InputLabel>
                        <Select
                            value={gateCalendarEvent.classification}
                            onChange={(e: SelectChangeEvent) =>
                                setGateCalendarEvent({ ...gateCalendarEvent, classification: e.target.value as string })
                            }
                            id='classification-select'
                            labelId='classification-select-labels'
                        >
                            <MenuItem value='Unclassified'>Unclassified</MenuItem>
                            <MenuItem value='Confidential'>Confidential</MenuItem>
                            <MenuItem value='Secret'>Secret</MenuItem>
                            <MenuItem value='Top Secret'>Top Secret</MenuItem>
                        </Select>
                    </FormControl>
                    <ICODWidget onDateChange={handleIcodDateChange} selectedDate={icodDate} savedDate={savedIcodDate} />

                    <FixedWidgetActions>
                        <WidgetButtonBox>
                            {isUpdate && (
                                <ActionButtonBox>
                                    <ActionButton
                                        id={'delete-button'}
                                        variant={'contained'}
                                        color={'error'}
                                        onClick={handleDelete}
                                        size={'small'}
                                    >
                                        {deleteButtonText}
                                    </ActionButton>
                                </ActionButtonBox>
                            )}
                            <ActionButtonBox>
                                <ActionButton
                                    onClick={handleFormReset}
                                    variant={'outlined'}
                                    color={'secondary'}
                                    size={'small'}
                                >
                                    Clear Form
                                </ActionButton>
                            </ActionButtonBox>
                            {isUpdate && (
                                <>
                                    <ActionButton
                                        id={'update-button'}
                                        variant={'contained'}
                                        color={'secondary'}
                                        onClick={handleSubmit}
                                        size={'small'}
                                    >
                                        {updateButtonText}
                                    </ActionButton>
                                </>
                            )}
                            <ActionButtonBox>
                                {!isUpdate && (
                                    <ActionButtonBox>
                                        <ActionButton
                                            variant={'contained'}
                                            color={'secondary'}
                                            onClick={handleSubmit}
                                            size={'small'}
                                        >
                                            Create Event
                                        </ActionButton>
                                    </ActionButtonBox>
                                )}
                            </ActionButtonBox>
                        </WidgetButtonBox>
                    </FixedWidgetActions>
                </WidgetContainer>
            </WidgetContainer>
        </div>
    );
}
export default GateCalendarEditor;
