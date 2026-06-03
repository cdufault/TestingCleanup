// React imports
import React, {useCallback, useContext, useEffect, useRef, useState} from 'react';

// Dependency imports
import FlexLayout, {Action, Actions, DockLocation, IJsonModel, Model} from 'flexlayout-react';
import TabNode from 'flexlayout-react/declarations/model/TabNode';

// Component imports
import WebMapView from '../webMap';
import DefaultComponent from './DefaultComponent';
import LayerList from '../widgets/layerList';
import LayerStyle from '../widgets/layerStyle';
import { Legend } from '@stratcom/react-widget-lib';
import MultiMeasure from '../widgets/multiMeasure';
import DataFeeds from '../widgets/dataFeeds';
import RKSSearch from '../widgets/rks';
import CustomTimeSlider from '../widgets/timeSlider';
import FeatureEditor from '../widgets/featureEditor';
import AnalyticCatalog from '../analyticCatalog';
import DoctrinalTemplateEditor from '../doctrinalTemplate';
import LayerFilter from '../widgets/layerFilter';
import LayerEllipse from '../widgets/layerEllipse';
import DisplaySettings from '../misc/DisplaySettings';
import FeatureTable from '../widgets/featureTable/FeatureTable';
import TacticalGrid from '../tacticalGrid';
import GateDataEditor from '../gate/GateDataEditor';
import ActivityCounts from '../gate/ActivityCounts';
import GateCalendarEditor from '../gate/GateCalendarEditor';
import ImmadOpsClockEditor from '../opsClock/ImmadOpsClockEditor';
import BaseballCardWrapper from '../widgets/baseballCard/BaseballCardWrapper';

// Style imports
import 'flexlayout-react/style/dark.css';
import { theme } from '../../styles/theme';
import { Container } from './styles';
import XIcon from 'calcite-ui-icons-react/XIcon';
import ArrowUpRightIcon from 'calcite-ui-icons-react/ArrowUpRightIcon';
import MaximizeIcon from 'calcite-ui-icons-react/MaximizeIcon';
import MinimizeIcon from 'calcite-ui-icons-react/MinimizeIcon';

// Type imports
import { ToolbarToolType } from '../../types/ToolbarTool';

// Context imports
import { ToolbarContext } from '../../contexts/Toolbar';
import { SubmittedJobsProvider } from '../../contexts/SubmittedJobs';
import { TacticalGridProvider } from '../../contexts/TacticalGrid';
import { useLayoutContext } from '../../contexts/LayoutContext';
import { ConfirmationDialogProvider } from '../../contexts/ConfirmationDialogContext';
import { MapContext } from '../../contexts/Map';

// Helper imports
import {
    getMissionLayout,
    getNodeByType,
    getPreferredTabset,
    getUserSavedState,
    LayoutHelperResult
} from './helpers/LayoutHelper';

import { useSnackbar } from 'notistack';
import {
    AddCalendarFeature,
    DeleteCalendarFeature,
    GateCalendarEvent,
    UpdateCalendarFeature,
} from '@stratcom/lib-functions';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { ConfigHelper } from '../../helpers/configHelper';
import {
    calculateNumberOfOccurrencesFromEnd,
    DeleteAllRecurringCalendarFeatures,
    getAllGATEApps,
    isLastDayOfMonth,
    lastDayOfCurrentMonth,
    UpdateRecurringCalendarFeatures,
} from '../gate/GateDataEditorHelper';
import { setApplicationItems } from '../gate/GateDataEditorSlice';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { CalendarFeatureGridContextProvider } from '../gate/calendarWidget/CalendarFeatureLayerGridContext';
import MissionLogWidget from '../missionLog/MissionLogWidget';
import {useSaveLoadContext} from "../../contexts/SaveLoad";
import {analystLayout} from "../analyst/resources";
import CircularProgress from "@mui/material/CircularProgress";
import {StyledCenterCircularProgressDiv} from "../home/components/missionCreate/styles";
import {IUserSaveState} from "../../interfaces/UserSaveState";

// Component
const Layout = (): JSX.Element => {

    const {
        setTGridCanRender,
        tools,
        selectedTools,
        addTool,
        removeTool,
        setSelectedTools,
        setAddTool,
        setRemoveTool,
    } = useContext(ToolbarContext);

    const layoutContext = useLayoutContext();

    const { missionSelect } = useSaveLoadContext();

    const { sceneView, mapView, activeView, getMapView, getSceneView } = useContext(MapContext);

    const { enqueueSnackbar } = useSnackbar();

    //add items to this array if the item should not support the popout feature
    const disablePopout: ToolbarToolType[] = [ToolbarToolType.RKSSearch, ToolbarToolType.FeatureTable];

    const appConfig = ConfigHelper.getAppConfig();
    const dispatch = useAppDispatch();

    // useRef for when layout is loading and only throw warnings on load
    const isLoading = useRef(false);
    const tgridIsFloated = useRef<boolean | undefined>();

    const [existingGateEvent] = useState<GateCalendarEvent>(getExistingEvent);
    const applicationItems = useAppSelector((state) => state.gateCalendarEditorSlice.applicationItems);
    const missionIsExercise = useAppSelector((state) => state.gateCalendarEditorSlice.missionIsExercise);
    const isUpdate = useAppSelector((state) => state.gateCalendarEditorSlice.isUpdate);

    const [layoutLoaded, setLayoutLoaded] = useState<boolean>(false);

    const loadDefaultLayout = useCallback(() => {
        layoutContext.setModel(FlexLayout.Model.fromJson(analystLayout as IJsonModel));
        isLoading.current = true;
        setLayoutLoaded(true);
        enqueueSnackbar("Default Layout has been applied.", {variant: 'success'});
    }, [enqueueSnackbar, layoutContext]);

    const handleLayoutError = (error : Error) => {
        enqueueSnackbar("Error retrieving the layout: " + error.message, { variant: 'error'});
        console.error(error.message);
    }

    /**
     * Loads the layout based on precedence.
     * Takes an input mission selection string for evaluating the layout
     * - If a custom layout exists, this is used
     * - Otherwise, if a Mission Layou exists, this is used
     * - Otherwise (or if there's an error), the Default Layout is used.
     * @param missionSelect The selected Mission title, or null if there's no selected mission
     */
    const asyncLoadLayout = async (missionSelect : string | null) => {
        const userSaveState : IUserSaveState = await getUserSavedState();

        if (userSaveState?.layout) {
            try {
                let layout: any;

                try {
                    layout = FlexLayout.Model.fromJson(userSaveState.layout);
                }
                catch(e) {
                    // try decoding from string, as occurs with older saved states
                    layout = FlexLayout.Model.fromJson(JSON.parse(userSaveState.layout as unknown as string));
                }

                if(layout) {
                    layoutContext.setModel(layout);
                    enqueueSnackbar("Custom Layout has been applied.", { variant: 'success'});
                    isLoading.current = true;
                    setLayoutLoaded(true);
                    return;
                }
            }
            catch(error) {
                handleLayoutError(error);
                // Fall through to next option (Mission layout) instead of applying a default layout
            }
        }

        if (missionSelect) {
            try {
                const result : LayoutHelperResult = await getMissionLayout(missionSelect);

                if (result.success && result.layout) {
                    layoutContext.setModel(FlexLayout.Model.fromJson(result.layout));
                    enqueueSnackbar("Mission Layout has been applied.", {variant: 'success'});
                    isLoading.current = true;
                    setLayoutLoaded(true);
                    return;
                }
            } catch(error) {
                handleLayoutError(error);
                // Fall through to next option (Default Layout)
            }
        }

        loadDefaultLayout();
    };

    /**
     * When Mission Select changes, the layout should be re-loaded based on precedence (custom, mission, and default, respectively)
     */
    useEffect(() => {
        setLayoutLoaded(false);
        asyncLoadLayout(missionSelect)
            .catch(error => {
            handleLayoutError(error);
            loadDefaultLayout();
        }).finally(()=>{
            setLayoutLoaded(true);
        });
    }, [missionSelect]);

    useEffect(() => {
        if (isLoading.current) {
            isLoading.current = false;
        }
    }, [layoutContext.model]);

    useEffect(() => {
        const enableItemToFloat = disablePopout.find((item) => item === addTool?.type);
        if (
            addTool &&
            addTool.type !== ToolbarToolType.Basemap &&
            addTool.type !== ToolbarToolType.CoordinateConversion
        ) {
            const { name, type } = addTool;
            layoutContext.model?.doAction(
                Actions.addNode(
                    {
                        type: 'tab',
                        name: name,
                        component: type,
                        enableFloat: !enableItemToFloat,
                    },
                    getPreferredTabset(layoutContext.model),
                    DockLocation.CENTER,
                    -1,
                    true
                )
            );
            setAddTool(undefined);
        }
    }, [addTool]);

    useEffect(() => {
        if (removeTool && removeTool.type !== ToolbarToolType.Basemap) {
            const { type } = removeTool;
            const childNodes = layoutContext.model?.getRoot().getChildren();
            if (childNodes?.length) {
                const node = getNodeByType(type, childNodes);
                if (node) {
                    layoutContext.model?.doAction(Actions.deleteTab(node.getId()));
                    setRemoveTool(undefined);
                }
            }
        }
    }, [removeTool]);

    useEffect(() => {
        getAllGATEApps(
            appConfig.portalUrl,
            appConfig.typekeywords.gateExercise,
            appConfig.typekeywords.gateMission,
            appConfig.oauthAppId
        ).then((appItems) => {
            appItems && dispatch(setApplicationItems(appItems));
        });
    }, []);

    const factory = (node: TabNode) => {
        const component = node.getComponent();
        if (component === ToolbarToolType.Default) {
            const name = node.getName();
            return <DefaultComponent key={name} />;
        } else if (component === ToolbarToolType.Map) {
            return <WebMapView />;
        } else if (component === ToolbarToolType.LayerList) {
            return <LayerList />;
        } else if (component === ToolbarToolType.FeatureTable) {
            return <FeatureTable />;
        } else if (component === ToolbarToolType.Legend) {
            return (
                <Legend
                    activeView={activeView}
                    getMapView={getMapView}
                    getSceneView={getSceneView}
                    mapView={mapView}
                    sceneView={sceneView}
                />
            );
        } else if (component === ToolbarToolType.Measure) {
            return <MultiMeasure />;
        } else if (component === ToolbarToolType.DataFeeds) {
            return <DataFeeds />;
        } else if (component === ToolbarToolType.RKSSearch) {
            return <RKSSearch />;
        } else if (component === ToolbarToolType.TimeSlider) {
            return <CustomTimeSlider />;
        } else if (component === ToolbarToolType.FeatureEditor) {
            return <FeatureEditor />;
        } else if (component === ToolbarToolType.TacticalGrid) {
            return <TacticalGrid />;
        } else if (component === ToolbarToolType.AnalyticCatalog) {
            return <AnalyticCatalog />;
        } else if (component === ToolbarToolType.DoctrinalTemplate_New) {
            return <DoctrinalTemplateEditor />;
        } else if (component === ToolbarToolType.LayerFilter) {
            return <LayerFilter />;
        } else if (component === ToolbarToolType.LayerEllipse) {
            return <LayerEllipse />;
        } else if (component === ToolbarToolType.DisplaySettings) {
            return <DisplaySettings />;
        } else if (component === ToolbarToolType.LayerStyle) {
            return <LayerStyle />;
        } else if (component === ToolbarToolType.GateDataEditor) {
            return <GateDataEditor />;
        } else if (component === ToolbarToolType.ActivityCounts) {
            return <ActivityCounts />;
        } else if (component === ToolbarToolType.GateCalendarEditor) {
            return (
                <GateCalendarEditor
                    onSubmit={CalendarSubmit}
                    regionItems={applicationItems}
                    onDelete={handleDeleteEvent}
                    editMode={isUpdate}
                    initialEvent={existingGateEvent}
                />
            );
        } else if (component === ToolbarToolType.OpsClock) {
            return <ImmadOpsClockEditor />;
        } else if (component === ToolbarToolType.BaseballCard) {
            return <BaseballCardWrapper />;
        } else if (component === ToolbarToolType.MissionLog) {
            return <MissionLogWidget />;
        }
    };

    async function CalendarSubmit(event: GateCalendarEvent): Promise<void> {
        const calendarFeatureLayer = new FeatureLayer({
            portalItem: {
                id: missionIsExercise ? appConfig.gate.exercise.exCalendarGuid : appConfig.gate.calendarGuid,
            },
        });
        // creating a new calendar event
        if (!isUpdate) {
            // recurrence check on event data
            if (event.recurring && event.numberOfOccurrences) {
                let occurrences: number | undefined = event.numberOfOccurrences;
                // if the number of occurrences was not manually set by the user, calculate the number based on the recurrence end date
                if (event.numberOfOccurrences === 1) {
                    occurrences = calculateNumberOfOccurrencesFromEnd(event);
                }
                let parentGUID = '';
                // track calendar event submission to display only one success message
                let eventSuccess = true;
                let isLastDay = false;
                if (occurrences) {
                    // submit calendar features based on the number of times the event is supposed to occur
                    for (let i = 0; i < occurrences; i++) {
                        // if this is the first event to come through, this is the master record and parent guid is set
                        if (i === 0) {
                            if (isLastDayOfMonth(event.startDate)) {
                                isLastDay = true;
                            }
                            const result = await AddCalendarFeature(event, calendarFeatureLayer);
                            const globalId = result?.addFeatureResults?.[0]?.globalId;
                            if (globalId) {
                                // add event was successful
                                parentGUID = globalId;
                            } else {
                                // add event was failure see log for more detail
                                eventSuccess = false;
                                const resultError = result?.addFeatureResults?.[0]?.error;
                                if (resultError) {
                                    console.error(resultError);
                                }

                                enqueueSnackbar('Calendar Event failed to add see console log for more details', {
                                    variant: 'error',
                                });
                                break;
                            }
                            // all other events coming through are child records but have the attached parent guid to connect
                        } else {
                            if (event.recurrenceType === 'yearly') {
                                // increments the dates for yearly recurrence based on the yearly recurrence pattern i.e. every x year(s)
                                const numberOfYears = parseInt(event.recurrencePattern);
                                event.startDate.setFullYear(event.startDate.getFullYear() + numberOfYears);
                                event.endDate.setFullYear(event.endDate.getFullYear() + numberOfYears);
                            } else if (event.recurrenceType === 'monthly') {
                                // increments the dates for monthly recurrence based on the monthly recurrence pattern i.e. every x month(s)
                                const numberOfMonths = parseInt(event.recurrencePattern);
                                const startTimeHours = event.startDate.getHours();
                                const endTimeHours = event.endDate.getHours();
                                const startTimeMinutes = event.startDate.getMinutes();
                                const endTimeMinutes = event.endDate.getMinutes();
                                const startTimeSeconds = event.startDate.getSeconds();
                                const endTimeSeconds = event.endDate.getSeconds();
                                const startTimeMSeconds = event.startDate.getMilliseconds();
                                const endTimeMSeconds = event.endDate.getMilliseconds();
                                if (isLastDay) {
                                    const newRecurrenceStart = new Date(event.startDate);
                                    const newRecurrenceEnd = new Date(event.endDate);
                                    // if the start and end are both on the last day of the month
                                    if (newRecurrenceStart.getDate() === newRecurrenceEnd.getDate()) {
                                        // Temporarily set the day to 1 to avoid month skipping issues
                                        newRecurrenceStart.setDate(1);
                                        newRecurrenceEnd.setDate(1);
                                        // increment by number of months
                                        newRecurrenceStart.setMonth(newRecurrenceStart.getMonth() + numberOfMonths);
                                        newRecurrenceEnd.setMonth(newRecurrenceEnd.getMonth() + numberOfMonths);
                                        // Set the date to the minimum of the original day or the last day of the new month
                                        newRecurrenceStart.setDate(
                                            Math.min(event.startDate.getDate(), newRecurrenceStart.getDate())
                                        );
                                        // Set the date to the minimum of the original day or the last day of the new month
                                        newRecurrenceEnd.setDate(
                                            Math.min(event.endDate.getDate(), newRecurrenceEnd.getDate())
                                        );
                                        // Calculate the last day of the month
                                        const lastDayOfMonth = lastDayOfCurrentMonth(newRecurrenceStart);
                                        // Manually build new start date if on last of the month to maintain time and set date
                                        const lastDayOfMonthStart = new Date(
                                            newRecurrenceStart.getFullYear(),
                                            newRecurrenceStart.getMonth(),
                                            lastDayOfMonth,
                                            startTimeHours,
                                            startTimeMinutes,
                                            startTimeSeconds,
                                            startTimeMSeconds
                                        );
                                        // Manually build new end date if on last of the month to maintain time and set date
                                        const lastDayOfMonthEnd = new Date(
                                            newRecurrenceStart.getFullYear(),
                                            newRecurrenceStart.getMonth(),
                                            lastDayOfMonth,
                                            endTimeHours,
                                            endTimeMinutes,
                                            endTimeSeconds,
                                            endTimeMSeconds
                                        );
                                        // if the new recurrence end date is already the last date, set the date
                                        if (newRecurrenceStart.getDate() >= lastDayOfMonthStart.getDate()) {
                                            event.startDate = newRecurrenceStart;
                                            event.endDate = newRecurrenceEnd;
                                        } else {
                                            // else, set the date as the last date of the month
                                            event.startDate = lastDayOfMonthStart;
                                            event.endDate = lastDayOfMonthEnd;
                                        }
                                    } else {
                                        // If the start and end dates are not on the same last day of month
                                        // Temporarily set the day to 1 to avoid month skipping issues
                                        newRecurrenceStart.setDate(1);
                                        // Increment by number of months
                                        newRecurrenceStart.setMonth(newRecurrenceStart.getMonth() + numberOfMonths);
                                        newRecurrenceEnd.setMonth(newRecurrenceEnd.getMonth() + numberOfMonths);
                                        // Set the date to the minimum of the original day or the last day of the new month
                                        newRecurrenceStart.setDate(
                                            Math.min(event.startDate.getDate(), newRecurrenceStart.getDate())
                                        );
                                        // Calculate the last date of the month
                                        const lastDayOfMonth = lastDayOfCurrentMonth(newRecurrenceStart);
                                        // Manually build new start date if on last of the month to maintain time and set date
                                        const lastDayOfMonthStart = new Date(
                                            newRecurrenceStart.getFullYear(),
                                            newRecurrenceStart.getMonth(),
                                            lastDayOfMonth,
                                            startTimeHours,
                                            startTimeMinutes,
                                            startTimeSeconds,
                                            startTimeMSeconds
                                        );
                                        // Manually build new end date if on last of the month to maintain time and set date
                                        const dayOfMonthEnd = new Date(
                                            newRecurrenceEnd.getFullYear(),
                                            newRecurrenceEnd.getMonth(),
                                            newRecurrenceEnd.getDate(),
                                            endTimeHours,
                                            endTimeMinutes,
                                            endTimeSeconds,
                                            endTimeMSeconds
                                        );
                                        // if the new recurrence end date is already the last date, set the date
                                        if (newRecurrenceStart.getDate() >= lastDayOfMonthStart.getDate()) {
                                            event.startDate = newRecurrenceStart;
                                            event.endDate = dayOfMonthEnd;
                                        } else {
                                            // else, set the date as the last date of the month
                                            event.startDate = lastDayOfMonthStart;
                                            event.endDate = dayOfMonthEnd;
                                        }
                                    }
                                } else {
                                    // if not the last day, increment months as normal
                                    event.startDate.setMonth(event.startDate.getMonth() + numberOfMonths);
                                    event.endDate.setMonth(event.endDate.getMonth() + numberOfMonths);
                                }
                            } else if (event.recurrenceType === 'weekly') {
                                // number of weeks to occur multiplied by 7 to increment by a week
                                const numberOfWeeks = parseInt(event.recurrencePattern) * 7;
                                event.startDate.setDate(event.startDate.getDate() + numberOfWeeks);
                                event.endDate.setDate(event.endDate.getDate() + numberOfWeeks);
                            }
                            event.isMasterRecord = false;
                            event.isChildRecord = true;
                            // parent guid assigned from the first/ master event created
                            event.parentGUID = parentGUID;
                            const result = await AddCalendarFeature(event, calendarFeatureLayer);
                            if (!result) {
                                // add event was failure see log for more detail
                                eventSuccess = false;
                                enqueueSnackbar('Calendar Event failed to add see console log for more details', {
                                    variant: 'error',
                                });
                            }
                        }
                    }
                }
                // if the event was successfully sent and added, show the success message
                if (eventSuccess) {
                    enqueueSnackbar('Calendar Event added successfully', { variant: 'info' });
                }
            } else {
                // if the event isn't recurring, add an event like normal
                AddCalendarFeature(event, calendarFeatureLayer).then((result) => {
                    if (result) {
                        // add event was successful
                        enqueueSnackbar('Calendar Event added successfully', { variant: 'info' });
                    } else {
                        // add event was failure see log for more detail
                        enqueueSnackbar('Calendar Event failed to add see console log for more details', {
                            variant: 'error',
                        });
                    }
                });
            }
        } else {
            // updating an existing event
            if (event.recurring && event.regionGUID !== null) {
                // if an event is recurring,and the master record is selected, update the entire series of events and the master record
                if (event.isMasterRecord) {
                    await UpdateRecurringCalendarFeatures(event, calendarFeatureLayer).then(async (result) => {
                        if (result) {
                            // update event was successful
                            enqueueSnackbar('Calendar Events updated successfully', { variant: 'info' });
                        } else {
                            // update event was failure see log for more detail
                            enqueueSnackbar('Calendar Events failed to update see console log for more details', {
                                variant: 'error',
                            });
                        }
                    });
                }
            } else {
                // if the event is not recurring and not part of a series, update the single event
                await UpdateCalendarFeature(event, calendarFeatureLayer).then((result) => {
                    if (result) {
                        // update event was successful
                        enqueueSnackbar('Calendar Event updated successfully', { variant: 'info' });
                    } else {
                        // update event was failure see log for more detail
                        enqueueSnackbar('Calendar Event failed to update see console log for more details', {
                            variant: 'error',
                        });
                    }
                });
            }
        }
    }

    async function handleDeleteEvent(event: GateCalendarEvent): Promise<void> {
        const calendarFeatureLayer = new FeatureLayer({
            portalItem: {
                id: missionIsExercise ? appConfig.gate.exercise.exCalendarGuid : appConfig.gate.calendarGuid,
            },
        });
        // recurrence check on event data
        if (event.recurring && event.regionGUID !== null) {
            // if an event is recurring,and the master record is selected, delete the entire series of events and the master record
            if (event.isMasterRecord) {
                await DeleteAllRecurringCalendarFeatures(event, calendarFeatureLayer).then((result) => {
                    DeleteCalendarFeature(event, calendarFeatureLayer).then((result) => {
                        if (result) {
                            // delete event was successful
                            enqueueSnackbar('Calendar Event deleted successfully', { variant: 'info' });
                        } else {
                            // delete event was failure see log for more detail
                            enqueueSnackbar('Calendar Event failed to delete see console log for more details', {
                                variant: 'error',
                            });
                        }
                    });
                });
            }
        } else {
            // if the event is not recurring and not part of a series, delete the single event
            DeleteCalendarFeature(event, calendarFeatureLayer).then((result) => {
                if (result) {
                    // delete event was successful
                    enqueueSnackbar('Calendar Event deleted successfully', { variant: 'info' });
                } else {
                    // delete event was failure see log for more detail
                    enqueueSnackbar('Calendar Event failed to delete see console log for more details', {
                        variant: 'error',
                    });
                }
            });
        }
    }

    function getExistingEvent(): GateCalendarEvent {
        // currently only gets a blank or empty event.
        // this will be enhanced in future tickets
        const defaultStartDate = new Date();
        defaultStartDate.setHours(0, 0, 0);
        const defaultEndDate = new Date();
        defaultEndDate.setHours(23, 59, 59);
        return {
            globalid: '',
            region: '',
            regionGUID: '',
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
            icod: undefined,
        };
    }
    /**
     * Update the visibility state of the tactical grid node when it's tab is activated or deactivated.
     * Used to prevent the grid from rendering when it is not visible - this prevents it from getting into a
     * bad state with the column widths which default to minWidth when rendering off screen
     * @param nodeId id of the currently selected/active tab node
     */
    function updateTGridVisibilityState(nodeId: string) {
        const childNodes = layoutContext.model?.getRoot().getChildren();
        const mapNode = getNodeByType(ToolbarToolType.Map, childNodes);
        if (mapNode && mapNode.getId() === nodeId) {
            //keeps the tactical grid from deselecting when panning the map and redrawing
            //when the map tab is the focused tab
            return; //don't fire update if it's the map node that is selected
        }
        const tgridNode = getNodeByType(ToolbarToolType.TacticalGrid, childNodes);
        const tgridNodeId = tgridNode?.getId();
        const isSelected = nodeId !== undefined && tgridNodeId === nodeId;

        tgridIsFloated.current && setTGridCanRender(true); // a floated grid can always render
        !tgridIsFloated.current && setTGridCanRender(isSelected); //render only if it's the selected tab
    }

    function handleModelChange(model: Model) {
        //rather than creating a new model from the JSON in the layoutContext useEffect just set the model that was
        //passed to this method
        layoutContext.setModel(model);
        //get the currently selected tab node id
        const tabsetNode = model.getActiveTabset();
        const selectedNode = tabsetNode?.getSelectedNode();
        const nodeId = selectedNode?.getId();

        //call any methods that need to update based on the currently selected node
        nodeId && updateTGridVisibilityState(nodeId);
    }

    /** Watches actions passed through the FlexLayout model */
    function handleOnAction(action: Action | undefined) {
        if (action && action.type === Actions.DELETE_TAB) {
            const node = layoutContext.model?.getNodeById(action.data.node) as TabNode;

            if (node) {
                const component = node.getComponent();
                const index = tools.findIndex((tool) => tool.type === component);
                if (index !== -1) {
                    setSelectedTools(selectedTools.filter((i) => i !== index));
                }
            }
        } else if (action && action.type === Actions.UNFLOAT_TAB) {
            const node = layoutContext.model?.getNodeById(action.data.node) as TabNode;

            // _attributes is supported but not by the public interface
            if (node && node.isFloating()) {
                const component = node.getComponent();
                const tool = tools.find((tool) => tool.type === component);
                if (tool?.type === ToolbarToolType.TacticalGrid) {
                    tgridIsFloated.current = false;
                }
                if (tool && isLoading.current) {
                    enqueueSnackbar(`${tool.name} is in a floating state but must be docked and floated out again.`, {
                        variant: 'warning',
                        persist: true,
                    });
                }
            }
        } else if (action && action.type === Actions.FLOAT_TAB) {
            const node = layoutContext.model?.getNodeById(action.data.node) as TabNode;

            // _attributes is supported but not by the public interface
            if (node && !node.isFloating()) {
                const component = node.getComponent();
                const tool = tools.find((tool) => tool.type === component);
                if (tool?.type === ToolbarToolType.TacticalGrid) {
                    tgridIsFloated.current = true;
                }
            }
        }
        return action;
    }

    return (
        <ConfirmationDialogProvider>
            <SubmittedJobsProvider>
                <TacticalGridProvider>
                    <CalendarFeatureGridContextProvider>
                        <Container>
                            { layoutLoaded ? <>
                                {selectedTools.length > 0 && (
                                    <FlexLayout.Layout
                                        model={layoutContext.model}
                                        factory={factory}
                                        onModelChange={handleModelChange}
                                        onAction={handleOnAction}
                                        icons={{
                                            close: <XIcon color={theme.palette.primary.contrastText} size={16}/>,
                                            popout: (
                                                <ArrowUpRightIcon color={theme.palette.primary.contrastText} size={16}/>
                                            ),
                                            maximize: <MaximizeIcon color={theme.palette.primary.contrastText}
                                                                    size={16}/>,
                                            restore: <MinimizeIcon color={theme.palette.primary.contrastText}
                                                                   size={16}/>,
                                        }}
                                    />
                                )}
                                {selectedTools.length === 0 && <div>Your workspace is currently empty.</div>}
                            </> :
                                <StyledCenterCircularProgressDiv >
                                    <CircularProgress size={'5rem'}/>
                                </StyledCenterCircularProgressDiv>
                            }
                            </Container>
                    </CalendarFeatureGridContextProvider>
                </TacticalGridProvider>
            </SubmittedJobsProvider>
        </ConfirmationDialogProvider>
    );
};

export default Layout;
