import React, { ChangeEvent, useContext, useEffect, useRef, useState } from 'react';
import { MapContext } from '../../../contexts/Map';
import MapView from '@arcgis/core/views/MapView';
import SceneView from '@arcgis/core/views/SceneView';
import TimeSlider from '@arcgis/core/widgets/TimeSlider';
import Layer from '@arcgis/core/layers/Layer';
import TimeExtent from '@arcgis/core/TimeExtent';
import TemporalLayer = __esri.TemporalLayer;
import {
    ActionButton,
    FieldGroup,
    InlineSelect,
    InputField,
    InputGroup,
    InputLabel,
    WidgetActions,
    WidgetContainer,
    WidgetContent,
} from '../../common';
import { Box, Checkbox, FormControlLabel, MenuItem, Radio, RadioGroup, Tooltip, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((_theme) => ({
    sliderNode: {
        minWidth: '700px',
        '& .esri-time-slider__slider': {
            backgroundColor: 'var(--calcite-ui-background)',
            '& .esri-slider': {
                backgroundColor: 'var(--calcite-ui-background)',
            },
        },
        '&.esri-time-slider--out-of-bounds .esri-time-slider__time-extent': {
            color: 'var(--calcite-ui-text-1)',
        },
        '&.esri-time-slider__mode--time-window .esri-slider__segment-0, &.esri-time-slider__mode--time-window .esri-slider__segment-2':
            {
                backgroundColor: 'transparent',
            },
        '&.esri-time-slider__mode--time-window .esri-slider__segment-1, & .esri-slider__thumb': {
            borderColor: 'rgba(255,255,255,.6)',
        },
    },
}));

function CustomTimeSlider(): JSX.Element {
    const classes = useStyles();
    const timeSliderNodeRef = useRef<HTMLDivElement>(null);

    const { mapViewInitialized, sceneViewInitialized, getMapView, getSceneView, activeView } = useContext(MapContext);
    const [view, setView] = useState<SceneView | MapView>();
    const viewRef = useRef<SceneView | MapView>();

    const [earliestStartDate, setEarliestStartDate] = useState<Date>();
    const [latestEndDate, setLatestEndDate] = useState<Date>();
    const layerViewCreateHandleRef = useRef<IHandle>();
    const layerViewDestroyHandleRef = useRef<IHandle>();

    const timeSliderRef = useRef<TimeSlider | undefined>(undefined);
    const defaultStopsObj = useRef({});
    const [stopsTimeUnit, setStopsTimeUnit] = useState('months');
    const [showTimeOnSlider, setShowTimeOnSlider] = useState(false);
    const [stopsValue, setStopsValue] = useState(1);
    const [customStopsChecked, setCustomStopsChecked] = useState(false);
    const [customStopsApplied, setCustomStopsApplied] = useState(false);
    const [loopPlayback, setLoopPlayback] = useState<boolean>(true);
    const [playbackSpeed, setPlaybackSpeed] = useState('1000');
    const [selectedMode, setSelectedMode] = useState<string>('time-window');

    const units = ['seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'years'];
    const timeSliderModes: string[] = ['time-window', 'instant', 'cumulative-from-start', 'cumulative-from-end'];
    const timeSliderModesDescription: string[] = [
        'The slider will show temporal data that falls within a given time range.',
        'The slider will show temporal data that falls on a single instance in time',
        'Similar to time-window but the start time is always pinned to the start of the slider.',
        'Similar to time-window but the end time is always pinned to the end of the slider',
    ];
    const [modeDescription, setModeDescription] = useState<string>(timeSliderModesDescription[0]);
    const [sliderAddedToUI, setSliderAddedToUI] = useState<boolean>(false);
    const visibleRef = useRef(false);
    const viewTimeExtentRef = useRef<TimeExtent | undefined>();
    const [enableStopsButton, setEnableStopsButton] = useState(true);

    /** run full destroy and clean up on component unmount */
    useEffect(() => {
        return () => {
            setSliderAddedToUI(false);
            visibleRef.current = false;
            cleanUp();
        };
    }, []);

    /**selectedMode, loopPlayback */
    useEffect(() => {
        if (timeSliderRef.current) {
            timeSliderRef.current.mode = selectedMode as
                | 'instant'
                | 'time-window'
                | 'cumulative-from-start'
                | 'cumulative-from-end'; //TimeSlider['mode'];
            timeSliderRef.current.loop = loopPlayback;
        }
    }, [selectedMode, loopPlayback]);

    /** mapViewInitialized, sceneViewInitialized, activeView*/
    useEffect(() => {
        let view;
        if (activeView === 'MAP' && mapViewInitialized) {
            view = getMapView();
            setView(view);
        } else if (activeView === 'SCENE' && sceneViewInitialized) {
            view = getSceneView();
            setView(view);
        }
    }, [mapViewInitialized, sceneViewInitialized, activeView]);

    /**view, timeSliderNodeRef.current */
    useEffect(() => {
        if (view && timeSliderNodeRef.current && timeSliderRef.current === undefined) {
            createTimeSlider();

            layerViewCreateHandleRef.current = view.on('layerview-create', (event) => {
                if (event.layer && (event.layer.timeInfo || event.layer.timeExtent)) {
                    syncTimeSliderExtentToViewExtent();
                }
            });
            layerViewDestroyHandleRef.current = view.on('layerview-destroy', () => {
                syncTimeSliderExtentToViewExtent();
            });

            viewRef.current = view;
        }
    }, [view, timeSliderNodeRef.current]);

    /** earliestStartDate, latestEndDate */
    useEffect(() => {
        if (timeSliderRef.current != null) {
            timeSliderRef.current.fullTimeExtent = new TimeExtent({
                start: earliestStartDate,
                end: latestEndDate,
            });
        }
    }, [earliestStartDate, latestEndDate]);

    /** manage removing when switching from 2D to 3D or vice versa */
    useEffect(() => {
        if (activeView) {
            setSliderAddedToUI(false);
            visibleRef.current = false;
        }
    }, [activeView]);

    /**
     * Remove items when user closes the time slider tab
     */
    function cleanUp() {
        if (viewRef.current) {
            viewRef.current.timeExtent = {} as TimeExtent; //reset view back to pre-slider view
        }
        if (timeSliderRef.current) {
            layerViewDestroyHandleRef.current && layerViewDestroyHandleRef.current.remove();
            layerViewCreateHandleRef.current && layerViewCreateHandleRef.current.remove();
            timeSliderRef.current.destroy();
            timeSliderRef.current = undefined;
        }
        viewTimeExtentRef.current = undefined;
    }

    /**
     * Update sliders extent to match extent of layers in map.
     */
    function syncTimeSliderExtentToViewExtent() {
        const fLayers = view?.map?.allLayers
            .filter((lyr) => {
                return (lyr as unknown as TemporalLayer) !== null;
            })
            .toArray();
        setTimeSliderExtent(fLayers ?? []);
    }

    /**
     *
     * @param fLayers Layers in the map of type feature. TODO: support image layers
     */
    function setTimeSliderExtent(fLayers: Layer[]) {
        let startDate: Date | undefined = undefined;
        let endDate: Date | undefined = undefined;
        let earliestStartDate: Date | undefined = undefined;
        let latestEndDate: Date | undefined = undefined;
        fLayers?.forEach((layer) => {
            // const fLayer = (layer as FeatureLayer) ?? (layer as ImageryLayer); //type feature add support for imagery
            const fLayer = layer as unknown as TemporalLayer;

            if (!fLayer) {
                return;
            }

            if (fLayer.useViewTime && (fLayer.timeExtent || fLayer.timeInfo?.fullTimeExtent)) {
                startDate = fLayer.timeExtent?.start ? fLayer.timeExtent.start : fLayer.timeInfo.fullTimeExtent.start;
                endDate = fLayer.timeExtent?.end ? fLayer.timeExtent.end : fLayer.timeInfo.fullTimeExtent.end;
            }
            if (startDate && endDate) {
                if (!earliestStartDate || startDate.getTime() <= earliestStartDate.getTime()) {
                    earliestStartDate = new Date(startDate.toString());
                }
                if (!latestEndDate || endDate.getTime() >= latestEndDate.getTime()) {
                    latestEndDate = new Date(endDate.toString());
                }
                startDate = undefined;
                endDate = undefined;
            }
        });
        if (earliestStartDate) {
            setEarliestStartDate(earliestStartDate);
        }
        if (latestEndDate) {
            setLatestEndDate(latestEndDate);
        }
    }

    /**
     * Set time slider stops
     */
    function applyCustomStops() {
        if (timeSliderRef.current && sliderAddedToUI) {
            timeSliderRef.current.stop();
            timeSliderRef.current.stops = {
                interval: {
                    value: stopsValue,
                    unit: stopsTimeUnit,
                } as __esri.TimeInterval,
            };
            setCustomStopsApplied(true);
            setEnableStopsButton(false);
            generateNewStartDate();
        }
    }

    /**
     * Get a new start date for re-positioning the start thumb on the time slider after a 'custom stop' is applied.
     */
    function generateNewStartDate() {
        if (timeSliderRef.current && timeSliderRef.current.mode === 'time-window') {
            const stopsInterval = timeSliderRef.current.stops as __esri.StopsByInterval; //custom stops only using StopsByInterval
            const interval = stopsInterval?.interval as __esri.TimeInterval;
            const timeUnit = interval?.unit;
            const timeValue = interval?.value;
            const currentEndDate = timeSliderRef.current.timeExtent.end.getTime();
            const newStartDateInMilli = calculateMilliSecondsDiff(timeUnit, timeValue, currentEndDate);

            const newStartDate = new Date(newStartDateInMilli);
            timeSliderRef.current.timeExtent = {
                start: newStartDate,
                end: timeSliderRef.current.timeExtent.end,
            } as TimeExtent;
        }
    }

    /**
     * Calculates the diff in milli seconds between the current end date on the slider and the value of the new stop (timeUnit, timeQty)
     * @param timeUnit seconds, minutes,etc
     * @param timeQty value ie 10, 15, etc
     * @param currentEndDateInMilli date in milliseconds
     */
    function calculateMilliSecondsDiff(timeUnit: string, timeQty: number, currentEndDateInMilli: number): number {
        const milliMin = 60 * 1000;
        const milliHour = milliMin * 60;
        const milliDay = milliHour * 24;
        const milliWeek = milliDay * 7;
        const milliMonth = milliDay * 30;
        const milliYear = milliDay * 365;

        let stopParamsToMilli = 1000; //default is seconds
        switch (timeUnit) {
            case 'minutes':
                stopParamsToMilli = milliMin;
                break;
            case 'hours':
                stopParamsToMilli = milliHour;
                break;
            case 'days':
                stopParamsToMilli = milliDay;
                break;
            case 'weeks':
                stopParamsToMilli = milliWeek;
                break;
            case 'months':
                stopParamsToMilli = milliMonth;
                break;
            case 'years':
                stopParamsToMilli = milliYear;
                break;
        }
        //find the difference between computed stop in milliseconds and the end date in milli to arrive at a new start date
        return currentEndDateInMilli - stopParamsToMilli * timeQty;
    }

    /**Remove time slider custom stops */
    function clearCustomStops() {
        if (timeSliderRef.current && sliderAddedToUI) {
            timeSliderRef.current.stop();
            timeSliderRef.current.stops = defaultStopsObj.current as __esri.StopsByCount; //default for this widget
            setCustomStopsApplied(false);
            setEnableStopsButton(true);
        }
    }

    /**Create the time slider widget */
    function createTimeSlider() {
        const slider = new TimeSlider({
            container: timeSliderNodeRef.current ?? '',
            mode: selectedMode as 'instant' | 'time-window' | 'cumulative-from-start' | 'cumulative-from-end',
            visible: false,
            timeVisible: showTimeOnSlider,
            loop: loopPlayback,
            playRate: parseInt(playbackSpeed),
        });
        timeSliderRef.current = slider;
        defaultStopsObj.current = slider.stops; //defaults to StopsByCount with a value of 10
    }

    function saveVisibleSliderState() {
        if (visibleRef.current) {
            //removing slider
            view?.ui.remove(timeSliderNodeRef.current as HTMLElement);
            if (timeSliderRef && timeSliderRef.current) {
                timeSliderRef.current.visible = false;
            }

            //localized cleanup when slider is removed from UI
            viewTimeExtentRef.current = view?.timeExtent;
            timeSliderRef.current.fullTimeExtent = null;
            timeSliderRef.current.view = null;
            view.timeExtent = null;

            setLatestEndDate(undefined);
            setEarliestStartDate(undefined);

            setSliderAddedToUI(false);
            visibleRef.current = false;
        }
    }

    /**Handle the click event on the Show TimeSlider/Hide TimeSlider button */
    function showHideTimeSliderBtnHandler() {
        if (timeSliderRef.current && view) {
            if (sliderAddedToUI) {
                //removing slider
                saveVisibleSliderState();
                return;
            } else {
                //adding slider
                timeSliderRef.current.view = view;
                if (view.timeExtent) {
                    viewTimeExtentRef.current = view.timeExtent; //capture current view timeExtent
                }
                view.ui.add(timeSliderNodeRef.current as HTMLElement, 'bottom-left');
                timeSliderRef.current.visible = true;

                syncTimeSliderExtentToViewExtent();
                if (viewTimeExtentRef.current) {
                    timeSliderRef.current.timeExtent = viewTimeExtentRef.current; //set slider to last saved time extent
                    view.timeExtent = viewTimeExtentRef.current; //set view to last saved time extent
                }
                setSliderAddedToUI(true);
                visibleRef.current = true;
            }
        }
    }

    /** Update the timeslider's mode*/
    function handleSelectedModeChanged(event: ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        timeSliderRef.current ? timeSliderRef.current.stop() : '';
        setSelectedMode(value);
        const index = timeSliderModes.findIndex((mode) => value == mode);
        setModeDescription(timeSliderModesDescription[index]);
    }

    /**Update the playback mode for the timeslider */
    function loopPlaybackChange(event: React.ChangeEvent<HTMLInputElement>) {
        const r = event.target.value; //playOnce, playLoop
        timeSliderRef.current ? timeSliderRef.current.stop() : '';
        if (r == 'playOnce') {
            setLoopPlayback(false);
        } else {
            setLoopPlayback(true);
        }
    }

    /**Update the timeslider's playback speed */
    const playbackSpeedChange = (event: ChangeEvent<HTMLInputElement>) => {
        const speedString = (event.target as HTMLInputElement).value;
        setPlaybackSpeed(speedString);
        const speed = parseInt(speedString);

        if (timeSliderRef.current) {
            timeSliderRef.current.stop();
            if (isNaN(speed)) {
                timeSliderRef.current.playRate = 1000;
            } else {
                timeSliderRef.current.playRate = speed;
            }
        }
    };

    /**Handle time units changes */
    const timeUnitsChanged = (event: ChangeEvent<HTMLInputElement>) => {
        setStopsTimeUnit(event.target.value);
        setEnableStopsButton(true);
    };

    const stopsValueChanged = (evt: ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(evt.target.value);
        setStopsValue(Math.abs(val));
        setEnableStopsButton(true);
    };

    /**Handle custom stops updated. */
    const enableCustomStopsChanged = (evt: ChangeEvent<HTMLInputElement>) => {
        const state = evt.target.checked;
        setEnableStopsButton(state);
        setCustomStopsChecked(state);
    };

    /**Handle show time changed. */
    const enableShowTimeChanged = (evt: ChangeEvent<HTMLInputElement>) => {
        timeSliderRef.current ? timeSliderRef.current.stop() : '';
        const state = evt.target.checked;
        timeSliderRef.current ? (timeSliderRef.current.timeVisible = state) : '';
        setShowTimeOnSlider(state);
    };

    /** UI */
    return (
        <WidgetContainer>
            <div ref={timeSliderNodeRef} className={classes.sliderNode} />
            <WidgetContent>
                <FieldGroup>
                    <InputLabel>Time Slider Mode</InputLabel>
                    <InputField
                        fullWidth
                        variant='outlined'
                        color='secondary'
                        select
                        required
                        value={selectedMode}
                        onChange={handleSelectedModeChanged}
                    >
                        {timeSliderModes.map((mode) => (
                            <MenuItem key={mode} value={mode}>
                                {mode}
                            </MenuItem>
                        ))}
                    </InputField>
                    <Box mt={0.5} fontWeight='fontWeightLight' fontStyle='italic'>
                        <Typography variant='caption'>{modeDescription}</Typography>
                    </Box>
                </FieldGroup>

                <FieldGroup $bottomgutter>
                    <InputLabel>Repeat Mode</InputLabel>
                    <RadioGroup name='loopRadioButton' onChange={loopPlaybackChange} row>
                        <FormControlLabel
                            control={<Radio />}
                            label='Loop'
                            value='playLoop'
                            title='Continuously loop the playback'
                            checked={loopPlayback}
                        />
                        <FormControlLabel
                            control={<Radio />}
                            label='Play Once'
                            value='playOnce'
                            title='Play once and then stop.'
                            checked={!loopPlayback}
                        />
                    </RadioGroup>
                </FieldGroup>

                <FieldGroup $bottomgutter>
                    <InputLabel>Playback Speed</InputLabel>
                    <RadioGroup name='speedRadioButton' value={playbackSpeed} onChange={playbackSpeedChange} row>
                        <FormControlLabel
                            control={<Radio />}
                            label='1x'
                            value='2000'
                            title='Updates every two seconds'
                        />
                        <FormControlLabel
                            control={<Radio />}
                            label='2x'
                            value='1500'
                            title='Updates every one and a half second.'
                        />
                        <FormControlLabel control={<Radio />} label='3x' value='1000' title='Updates once per second' />
                        <FormControlLabel
                            control={<Radio />}
                            label='4x'
                            value='500'
                            title='Updates every one half second.'
                        />
                    </RadioGroup>
                </FieldGroup>

                <FieldGroup>
                    <FormControlLabel
                        title='Show time on slider'
                        control={<Checkbox onChange={enableShowTimeChanged} checked={showTimeOnSlider} />}
                        label='Show Time on Slider'
                    />
                </FieldGroup>

                <FieldGroup>
                    <FormControlLabel
                        title='Define custom stops'
                        control={<Checkbox onChange={enableCustomStopsChanged} checked={customStopsChecked} />}
                        label='Define Custom Stops'
                    />
                </FieldGroup>

                {customStopsChecked ? (
                    <FieldGroup>
                        <InputLabel>Define a value and a unit. Warning: See tooltip on section below.</InputLabel>

                        <Tooltip
                            title='Settings that result in over 10000 increments on the TimeSlider will results in a default of 10 equal intervals. 
                    Do not break large time exents into small units. IE: Extents covering years should not be broken into minutes.'
                        >
                            <InputGroup>
                                <InputField
                                    variant='outlined'
                                    type='number'
                                    placeholder='Enter a number...'
                                    helperText='Select a value'
                                    onChange={stopsValueChanged}
                                    value={stopsValue}
                                    size='small'
                                    color='secondary'
                                    InputLabelProps={{ shrink: true }}
                                />

                                <InlineSelect
                                    fullWidth
                                    variant='outlined'
                                    value={stopsTimeUnit}
                                    onChange={timeUnitsChanged}
                                    color='secondary'
                                >
                                    {units.map((unit) => (
                                        <MenuItem key={unit} value={unit}>
                                            {unit}
                                        </MenuItem>
                                    ))}
                                </InlineSelect>
                            </InputGroup>
                        </Tooltip>
                    </FieldGroup>
                ) : (
                    ''
                )}
            </WidgetContent>

            <WidgetActions>
                {customStopsApplied ? (
                    <ActionButton
                        variant='contained'
                        color='secondary'
                        type='button'
                        title='Search RKS data.'
                        disabled={false}
                        onClick={clearCustomStops}
                    >
                        Clear Custom Stops
                    </ActionButton>
                ) : (
                    ''
                )}

                {customStopsChecked ? (
                    <ActionButton
                        variant='contained'
                        color='secondary'
                        type='button'
                        title='Search RKS data.'
                        disabled={!enableStopsButton}
                        onClick={applyCustomStops}
                    >
                        Apply Custom Stops
                    </ActionButton>
                ) : (
                    ''
                )}

                <ActionButton
                    variant='contained'
                    color='secondary'
                    type='button'
                    title='Display time slider.'
                    disabled={false}
                    onClick={showHideTimeSliderBtnHandler}
                >
                    {sliderAddedToUI ? 'Hide Time Slider' : 'Show Time Slider'}
                </ActionButton>
            </WidgetActions>
        </WidgetContainer>
    );
}

export default CustomTimeSlider;
