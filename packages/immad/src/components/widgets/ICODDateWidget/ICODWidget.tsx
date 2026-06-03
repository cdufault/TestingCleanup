import React, { useEffect, useState } from 'react';
import {
    StyledDatePickerGateWay,
    StyledDatePickerGateWayRequired,
    IcodLabelContainer,
    StyledIcodHintText,
    StyledIcodLabelText,
    StyledIcodButton,
    StyledIcodButtonText,
    StyledIcodErrorText,
} from '../../gate/gateStyles';
import { FieldGroup } from '../../common';
import ArrowDownRightIcon from 'calcite-ui-icons-react/ArrowDownRightIcon';

/**input props */
interface ICODWidgetProps {
    selectedDate: Date | undefined;
    onDateChange: (date: Date) => void;
    required?: boolean; // required is an optional prop that defaults to false
    // maximum number of minutes supported = Date.now().getMinutes() + minutesToAddToMaxTime (default is 15)
    minutesToAddToMaxTime?: number;
    savedDate?: Date | undefined;
}

const ICODWidget: React.FC<ICODWidgetProps> = (props) => {
    const { selectedDate, onDateChange, required = false, minutesToAddToMaxTime = 15, savedDate } = props;
    const timeInterval = 15;

    //assumption is that every instance of this widget will require these properties to be set
    const [maxDate, setMaxDate] = useState<Date>(new Date(Date.now()));
    const [minimumTime] = useState<Date>(new Date(0, 0, 0, 0, 0));
    const [maximumTime, setMaximumTime] = useState<Date>(new Date(0, 0, 0, 23, 45));

    const [selectedDateIsToday, setSelectedDateIsToday] = useState<boolean>(false);
    const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>();
    const [selectedDateString, setSelectedDateString] = useState<string>('');
    const [fulfilled, setFulfilled] = useState<boolean>(false);

    /** Sets the maximum time able to set/ select for today's date in UTC */
    useEffect(() => {
        if (selectedDateIsToday) {
            setMaxTime(new Date(Date.now()));
        }
    }, [selectedDateIsToday]);

    /** If there is an existing date selected, use that */
    useEffect(() => {
        if (selectedDate) {
            setSelectedCalendarDate(selectedDate);
            setFulfilled(true);
        }
    }, [selectedDate]);

    /**
     * If there is an existing date on the mission object, set the ICOD button text to the existing date
     * If there isn't an existing date on the mission object, then set the button text to today's date
     */
    useEffect(() => {
        if (savedDate) {
            formatDateToString(savedDate);
        } else {
            const today = new Date(Date.now());
            formatDateToString(today);
        }
    }, [savedDate]);

    /**
     * When existing date is today normalize the minutes and hours to ensure they are within the threshold of
     * the current time - no greater than 15 - 30 minutes
     * @param selDate selected date in the calendar
     * @param interval numeric value to normalize minutes
     * @returns values from upper limit on hours and minutes
     */
    function normalizeTimeForTodaysDate(selDate: Date, interval: number): { hours: number; minutes: number } {
        const today = new Date(Date.now());
        //hours and minutes can't exceed the current time
        const hours = selDate.getUTCHours() > today.getUTCHours() ? today.getUTCHours() : selDate.getUTCHours();
        const minutesVal =
            selDate.getUTCMinutes() > today.getUTCMinutes() ? today.getUTCMinutes() : selDate.getUTCMinutes();
        //round the value down to nearest timeInterval increment - defaults 0, 15, 30, 45
        const minutes = Math.floor(minutesVal / interval) * interval;
        return { hours, minutes };
    }

    /**
     * Set maxHours date, and maxMinutes date values to be used by the date/time picker widget
     * @param date date selected by the user
     */
    function setMaxTime(date: Date) {
        //when calculated minutes exceeds 60 roll up to the next hour but not into the next day
        const calcMins =
            date.getUTCMinutes() + minutesToAddToMaxTime >= 60 ? 15 : date.getUTCMinutes() + minutesToAddToMaxTime;
        const calcHours =
            date.getUTCMinutes() + minutesToAddToMaxTime >= 60 ? date.getUTCHours() + 1 : date.getUTCHours();
        const maxHours = calcHours > 23 ? 23 : calcHours; //stop here - roll back to 23
        const maxMins = calcHours > 23 ? 45 : calcMins; //stop here - roll back to 45
        setMaximumTime(new Date(0, 0, 0, maxHours, maxMins));
    }

    /**
     * Are two dates within the same year, month, and date (1-31) - time is not factored into the comparison
     * @param dateA date one
     * @param dateB date two
     * @returns true if the dates have the same monthIndex, dayIndex, and year otherwise return false
     */
    function isDateToday(dateA: Date, dateB: Date) {
        const selectedDay = dateA.getUTCDate();
        const selectedMonth = dateA.getUTCMonth();
        const selectedYear = dateA.getUTCFullYear();

        const maxDay = dateB.getUTCDate();
        const maxMonth = dateB.getUTCMonth();
        const maxYear = dateB.getUTCFullYear();
        return selectedDay === maxDay && selectedMonth === maxMonth && selectedYear === maxYear;
    }

    /**
     * Called when the calendar's date (1-31) is changed
     * @param selDate the calendar's selected date
     */
    function onDateChangeHandler(selDate: Date | null) {
        if (selDate) {
            const today = new Date(Date.now());
            const isToday = isDateToday(today, selDate);
            if (isToday) {
                setSelectedDateIsToday(true);
                const { hours, minutes } = normalizeTimeForTodaysDate(selDate, timeInterval);

                setSelectedCalendarDate(
                    new Date(selDate.getUTCFullYear(), selDate.getUTCMonth(), selDate.getUTCDate(), hours, minutes)
                );
            } else {
                setSelectedDateIsToday(false);
                setMaximumTime(new Date(0, 0, 0, 23, 45));
                setSelectedCalendarDate(selDate);
            }
            setFulfilled(true);
        }
    }

    /**
     * Called when the calendar is opened
     */
    function onCalendarOpenHandler() {
        setMaxDate(new Date(Date.now()));
    }

    /**
     * Called when the calendar is closed
     */
    function onCalendarCloseHandler() {
        selectedCalendarDate && onDateChange(selectedCalendarDate);
    }

    /**
     * Called when the calendar's month is changed
     * @param selDate the calendar's selected date
     */
    function onMonthChangeHandler(selDate: Date | null) {
        if (selDate) {
            /**
             * There is a date-picker bug (or quirky behaviour): after a date is changed in the widget the
             * event handler for the month change will pass a date value without any time
             * data even though time is defined in the widget - this 'if' checks for this and when found
             * it re-attaches the cached hours and minutes back to the date
             */
            if (
                selDate.getUTCHours() === 0 &&
                selDate.getUTCMinutes() === 0 &&
                selectedCalendarDate?.getUTCHours() !== 0 &&
                selectedCalendarDate?.getUTCMinutes() !== 0
            ) {
                selDate = new Date(
                    selDate.getUTCFullYear(),
                    selDate.getUTCMonth(),
                    selDate.getUTCDate(),
                    selectedCalendarDate?.getUTCHours() ?? 0,
                    selectedCalendarDate?.getUTCMinutes() ?? 0
                );
            }

            const today = new Date(Date.now());
            const isToday = isDateToday(today, selDate);
            if (isToday) {
                setSelectedDateIsToday(true);
                onDateChangeHandler(selDate);
            } else {
                //if month change results in a date > than today for the current month/year - roll back to today's date
                if (
                    selDate.getUTCDate() > today.getUTCDate() &&
                    selDate.getUTCMonth() === today.getUTCMonth() &&
                    selDate.getUTCFullYear() === today.getUTCFullYear()
                ) {
                    const todaysDate = today.getUTCDate(); //extracted here for clarity
                    setSelectedDateIsToday(true);
                    onDateChangeHandler(
                        new Date(
                            selDate.getUTCFullYear(),
                            selDate.getUTCMonth(),
                            todaysDate,
                            selDate.getUTCHours(),
                            selDate.getUTCMinutes()
                        )
                    );
                } else {
                    setSelectedDateIsToday(false);
                    onDateChangeHandler(selDate);
                }
            }
        }
    }

    /**
     * Format Date object to string for display in the ICOD button
     * @param date date selected by the user
     */
    function formatDateToString(date: Date) {
        const monthAbbreviations = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        let dateDay = date.getUTCDate().toString();
        let dateHours = date.getUTCHours().toString();
        let dateMinutes = date.getUTCMinutes().toString();
        const dateMonth = date.getUTCMonth();
        const dateYear = date.getUTCFullYear().toString();
        if (date.getUTCDate() < 10) {
            dateDay = '0' + date.getUTCDate().toString();
        }
        if (date.getUTCHours() < 10) {
            dateHours = '0' + date.getUTCHours().toString();
        }
        if (date.getUTCMinutes() < 10) {
            dateMinutes = '0' + date.getUTCMinutes().toString();
        }
        const dateString = dateDay + dateHours + dateMinutes + 'Z' + monthAbbreviations[dateMonth] + dateYear + ' ';
        setSelectedDateString(dateString);
    }

    /**
     * Called when the existing ICOD button is clicked - updates the required date information
     */
    function onIcodButtonClick() {
        if (savedDate) {
            setSelectedCalendarDate(savedDate);
            savedDate && onDateChange(savedDate);
        } else {
            const today = new Date(Date.now());
            setSelectedCalendarDate(today);
            today && onDateChange(today);
        }
        setFulfilled(true);
    }

    return (
        <FieldGroup>
            <IcodLabelContainer>
                <StyledIcodLabelText htmlFor='startDateTime' className='form-label' title='Intelligence Cut-off Date'>
                    ICOD
                </StyledIcodLabelText>
                <StyledIcodButton
                    variant={'outlined'}
                    endIcon={<ArrowDownRightIcon size={16} />}
                    onClick={onIcodButtonClick}
                >
                    <StyledIcodButtonText>{selectedDateString}</StyledIcodButtonText>
                </StyledIcodButton>
                <StyledIcodHintText>Click previous ICOD date to populate</StyledIcodHintText>
            </IcodLabelContainer>
            <div>
                {required && !fulfilled ? (
                    <div>
                        <StyledDatePickerGateWayRequired
                            id='startDateTime'
                            required={required} // Use the passed-in required value
                            title='Intelligence Cut-off Date'
                            dateFormat={"ddHHmm'Z'MMMyyyy"}
                            showTimeSelect
                            disableKeyboardNavigation
                            timeFormat='HH:mm'
                            selected={selectedCalendarDate}
                            timeIntervals={timeInterval}
                            maxDate={maxDate}
                            maxTime={maximumTime}
                            minTime={minimumTime}
                            onCalendarOpen={onCalendarOpenHandler}
                            onChange={onDateChangeHandler}
                            onMonthChange={onMonthChangeHandler}
                            onCalendarClose={onCalendarCloseHandler}
                        />
                        <StyledIcodErrorText>ICOD required</StyledIcodErrorText>
                    </div>
                ) : (
                    <StyledDatePickerGateWay
                        id='startDateTime'
                        required={required} // Use the passed-in required value
                        title='Intelligence Cut-off Date'
                        dateFormat={"ddHHmm'Z'MMMyyyy"}
                        showTimeSelect
                        disableKeyboardNavigation
                        timeFormat='HH:mm'
                        selected={selectedCalendarDate}
                        timeIntervals={timeInterval}
                        maxDate={maxDate}
                        maxTime={maximumTime}
                        minTime={minimumTime}
                        onCalendarOpen={onCalendarOpenHandler}
                        onChange={onDateChangeHandler}
                        onMonthChange={onMonthChangeHandler}
                        onCalendarClose={onCalendarCloseHandler}
                    />
                )}
            </div>
        </FieldGroup>
    );
};

export default ICODWidget;
