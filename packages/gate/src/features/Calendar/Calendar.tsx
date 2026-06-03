import React, { useEffect, useMemo, useState } from 'react';
import CSS from 'csstype';
import './Calendar.css';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CaretLeftIcon from 'calcite-ui-icons-react/CaretLeftIcon';
import CaretRightIcon from 'calcite-ui-icons-react/CaretRightIcon';
// this ts-ignore needs to be here and the import needs to be single line since the react-calendar-timeline is not typed properly
// @ts-ignore
import Timeline, {
    Group,
    Item,
    TimelineItemRenderer,
    TimelineHeaders,
    SidebarHeader,
    DateHeader,
    // @ts-ignore
} from 'react-calendar-timeline';
import 'react-calendar-timeline/lib/Timeline.css';
import moment from 'moment';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { fetchFeaturesByNames } from './calendarPageSlice';
import CircularProgress from '@mui/material/CircularProgress';
import { ITimelineItem } from './CalendarHelper';
import { Button, Popover, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../data/store';

/**
 * Calendar card will contain the calendar related to the current landing page.
 * @constructor
 */
export default function Calendar() {
    const dispatch = useAppDispatch();
    const landingPageDataItems = useAppSelector((state) => state.landingPage.landingPageItems);
    const calendarFeatures = useAppSelector((state) => state.calendarPageSlice.calendarFeatures);
    const dynamicConfig = useAppSelector((state) => state.applicationSlice.gateDynamicConfig);
    const appConfig = useSelector((state: RootState) => state.applicationSlice.applicationConfig);
    const [visibleTimeStart, setVisibleTimeStart] = useState(moment().startOf('week').valueOf());
    const [selectedItem, setSelectedItem] = useState<ITimelineItem>();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    /**
     * Get the important anniversary color from the config and set it as a style to use as a
     * flag in the calendar.
     */
    const anniversaryColor = appConfig.importantAnniversaryColor;
    const anniversary: CSS.Properties = {
        backgroundColor: anniversaryColor,
    };

    /** switched to useMemo to timelineGroups and timelineItems values
     * since they are derived state values and this will reduce re-renders.
     * */
    const timelineGroups = useMemo(
        () =>
            landingPageDataItems?.regionCards.map((item, index) => ({
                id: index.toString(),
                title: item.regionName,
                groupLabelKey: item.regionName,
            })) || [],
        [landingPageDataItems]
    );

    const timelineItems = useMemo(
        () =>
            calendarFeatures.map((feature, index) => {
                const groupNumber = timelineGroups.findIndex((item) => item.title === feature.region_name);
                return {
                    id: index,
                    group: groupNumber,
                    title: feature.event_name,
                    start_time: feature.date_start,
                    end_time: feature.date_end,
                    comments: feature.comments,
                    description: feature.description,
                    participants: feature.participants,
                    classification: feature.classification,
                    importantAnniversary: feature.important_anniversary,
                };
            }),
        [calendarFeatures, timelineGroups]
    );
    useEffect(() => {
        if (timelineGroups.length > 0) {
            // when there are groups then use those names to get the items from the Calendar FeatureClass
            const names = timelineGroups.map((item) => {
                return item?.title;
            });
            if (names.length > 0 && dynamicConfig) {
                const portalItemId = dynamicConfig.gateCalendarFeatureClassId;
                dispatch(fetchFeaturesByNames({ names, portalItemId }));
            }
        }
    }, [timelineGroups, dynamicConfig, dispatch]);

    const handlePrevWeek = () => {
        setVisibleTimeStart(moment(visibleTimeStart).subtract(1, 'week').valueOf());
    };

    const handleNextWeek = () => {
        setVisibleTimeStart(moment(visibleTimeStart).add(1, 'week').valueOf());
    };

    const handleCanvasClick = (groupId: any, time: moment.MomentInput) => {
        // console.log('Canvas clicked', groupId, moment(time).format());
    };

    const handleCanvasDoubleClick = (groupId: any, time: moment.MomentInput) => {
        // console.log('Canvas double clicked', groupId, moment(time).format());
    };

    const handleCanvasContextMenu = (group: any, time: moment.MomentInput) => {
        // console.log('Canvas context menu', group, moment(time).format());
    };

    const handleItemClick = (itemId: number, _: any, time: moment.MomentInput) => {
        const theSelectedItem = timelineItems.find((item) => item.id === itemId);
        setSelectedItem(theSelectedItem);
    };

    const handleItemSelect = (itemId: string, _: any, time: moment.MomentInput) => {
        // console.log('Selected: ' + itemId, moment(time).format());
    };

    const handleItemDoubleClick = (itemId: string, _: any, time: moment.MomentInput) => {
        // console.log('Double Click: ' + itemId, moment(time).format());
    };

    const handleItemContextMenu = (itemId: string, _: any, time: moment.MomentInput) => {
        // console.log('Context Menu: ' + itemId, moment(time).format());
    };
    function convertClassification(classification: string) {
        switch (classification) {
            case 'unclassified':
                return '(U)';
            case 'confidential':
                return '(C)';
            case 'secret':
                return '(S)';
            case 'top secret':
                return '(TS)';
            default:
                return '';
        }
    }
    const ItemPopup = ({
        selectedItem,
        anchorEl,
        onClose,
    }: {
        selectedItem: any;
        anchorEl: HTMLElement | null;
        onClose: () => void;
    }) => {
        const open = Boolean(anchorEl);
        const id = open ? 'item-popup' : undefined;
        const startDate = moment(selectedItem.start_time).format('YYYY-MM-DD');
        const endDate = moment(selectedItem.end_time).format('YYYY-MM-DD');
        const classification = convertClassification(selectedItem?.classification?.toLowerCase());
        return (
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={onClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
            >
                <Typography sx={{ p: 2 }}>
                    {/* Display the metadata of the selected item */}
                    <h3>
                        {classification} {selectedItem.title}
                    </h3>
                    {selectedItem && (
                        <>
                            {startDate && <p>Start Date: {startDate}</p>}
                            {endDate && <p>End Date: {endDate}</p>}
                            {selectedItem.participants && <p>Participants: {selectedItem.participants}</p>}
                            {selectedItem.description && (
                                <p>
                                    {classification} Description: {selectedItem.description}
                                </p>
                            )}
                            {selectedItem.comments && (
                                <p>
                                    {classification} Comments: {selectedItem.comments}
                                </p>
                            )}
                            {/* Add any additional meta data you want to display */}
                        </>
                    )}
                </Typography>
            </Popover>
        );
    };
    const itemRenderer: TimelineItemRenderer<Item, Group> = ({
        //@ts-ignore
        item, //@ts-ignore
        itemContext, //@ts-ignore
        getItemProps, //@ts-ignore
        getResizeProps,
    }) => {
        const handleItemClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
            const itemId = item.id;
            const time = itemContext.selectedTime; // Handle item click logic here
            const selectedItem = timelineItems.find((item) => item.id === itemId);
            setAnchorEl(e.currentTarget);
            setSelectedItem(selectedItem);
        };
        return (
            <div {...getItemProps(item.itemProps)} onClick={handleItemClick}>
                <div className='custom-item' style={item.importantAnniversary ? anniversary : {}} title={item.title}>
                    {item.title}
                </div>
            </div>
        );
    };

    const groupRenderer = ({
        //@ts-ignore
        group,
    }) => (
        <div className='custom-group'>
            <div className='custom-group-title' title={group.title}>
                {group.title}
            </div>
        </div>
    );

    return (
        <>
            <Card>
                <CardContent>
                    {timelineGroups.length === 0 ? (
                        <div className='center-circular-progress'>
                            <CircularProgress />
                        </div>
                    ) : (
                        <div className='timeLineDiv'>
                            <Button
                                variant='outlined'
                                color='primary'
                                className='prevWeek'
                                onClick={handlePrevWeek}
                                title='Prev Week'
                                startIcon={<CaretLeftIcon />}
                            />
                            <Button
                                variant='outlined'
                                color='primary'
                                className='nextWeek'
                                onClick={handleNextWeek}
                                title='Next Week'
                                startIcon={<CaretRightIcon />}
                            />
                            <Timeline
                                className='gateTimeline'
                                itemTouchSendsClick={true}
                                groups={timelineGroups}
                                groupRenderer={groupRenderer}
                                items={timelineItems}
                                visibleTimeStart={visibleTimeStart}
                                // react-calendar-timeline sets column width based on start and end time; by switching
                                // to hours instead of days, a tiny bit of padding (time) can be added so header text is
                                // not cut off by the buttons and timeline end - 2 weeks is 336 hours
                                visibleTimeEnd={moment(visibleTimeStart).add(339, 'hours').valueOf()}
                                defaultTimeStart={moment().add(-12, 'hour')}
                                defaultTimeEnd={moment().add(12, 'hour')}
                                itemHeightRatio={0.75}
                                stackItems={true}
                                onCanvasClick={handleCanvasClick}
                                onCanvasDoubleClick={handleCanvasDoubleClick}
                                onCanvasContextMenu={handleCanvasContextMenu}
                                onItemClick={handleItemClick}
                                onItemSelect={handleItemSelect}
                                onItemContextMenu={handleItemContextMenu}
                                onItemDoubleClick={handleItemDoubleClick}
                                canMove={false}
                                canResize={false}
                                canSelect={true}
                                itemRenderer={itemRenderer}
                            >
                                <TimelineHeaders>
                                    <SidebarHeader></SidebarHeader>
                                    <DateHeader height={'50px'}></DateHeader>
                                </TimelineHeaders>
                            </Timeline>
                            {selectedItem && (
                                <ItemPopup
                                    selectedItem={selectedItem}
                                    anchorEl={anchorEl}
                                    onClose={() => {
                                        setAnchorEl(null);
                                        setSelectedItem(undefined);
                                    }}
                                />
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
