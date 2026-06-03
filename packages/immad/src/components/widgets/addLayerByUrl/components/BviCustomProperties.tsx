import React, { useContext, useEffect, useState } from 'react';
import { Checkbox, MenuItem, Select, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import InfoPopover from '../../../common/InfoPopover';
import { ConfigHelper } from '../../../../helpers/configHelper';
import { MapContext } from '../../../../contexts/Map';
import { BviProperties } from '../../../../interfaces/BviProperties';

/**
 * Interface to handle callback and input data coming from
 * where the modal dialog is initialized.
 */
interface BviCustomPropertiesProps {
    handleUpdate: (properties: BviProperties) => void;
}

/**
 * Table to get BVI Custom Property input from the user.
 * @param props BviCustomPropertiesProps
 * @constructor
 */
export default function BviCustomProperties(props: BviCustomPropertiesProps): JSX.Element {
    const appConfig = ConfigHelper.getAppConfig();
    const groupNames = appConfig.dataFeed.groupNames;
    const { handleUpdate } = props;
    const [includeStart, setIncludeStart] = useState(true);
    const [includeEnd, setIncludeEnd] = useState(true);
    const [includeGroup, setIncludeGroup] = useState(true);
    const [start, setStart] = useState<Date | null>();
    const [end, setEnd] = useState<Date | null>();
    const [group, setGroup] = useState<string>(groupNames[0]);

    const { activeView, getMapView, getSceneView } = useContext(MapContext);

    useEffect(() => {
        const view = activeView === 'MAP' ? getMapView() : getSceneView();
        const timeExtent = view?.timeExtent;
        if (timeExtent) {
            // If there's a time extent specified in the map, initialize the start/end to that
            setStart(timeExtent.start);
            setEnd(timeExtent.end);
        }
    }, [activeView]);

    useEffect(() => {
        const updatedProperties = { format: 'Geojson' } as BviProperties;
        if (includeStart && start) {
            updatedProperties.start = start.toISOString();
        }
        if (includeEnd && end) {
            updatedProperties.end = end.toISOString();
        }
        if (includeGroup) {
            updatedProperties.group = group;
        }
        handleUpdate(updatedProperties);
    }, [includeStart, includeEnd, includeGroup, start, end, group]);

    return (
        <>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell padding='checkbox' variant='head'>
                            ENABLE
                        </TableCell>
                        <TableCell variant='head'>PROPERTY</TableCell>
                        <TableCell variant='head'>VALUE</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <TableCell padding='checkbox'>
                            <Checkbox
                                onChange={(event) => {
                                    setIncludeStart(event.target.checked);
                                }}
                                checked={includeStart}
                            />
                        </TableCell>
                        <TableCell>
                            StartTime <InfoPopover description='Starting Time' />
                        </TableCell>
                        <TableCell>
                            <DatePicker
                                selected={start}
                                disabled={!includeStart}
                                onChange={(date) => setStart(date)}
                                dateFormat={"yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"}
                                showTimeSelect
                                timeFormat={'HH:mm'}
                                openToDate={new Date()}
                                timeIntervals={15}
                            />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell padding='checkbox'>
                            <Checkbox
                                onChange={(event) => {
                                    setIncludeEnd(event.target.checked);
                                }}
                                checked={includeEnd}
                            />
                        </TableCell>
                        <TableCell>
                            EndTime <InfoPopover description='Ending Time' />
                        </TableCell>
                        <TableCell>
                            <DatePicker
                                selected={end}
                                disabled={!includeEnd}
                                onChange={(date) => setEnd(date)}
                                dateFormat={"yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"}
                                showTimeSelect
                                timeFormat={'HH:mm'}
                                timeIntervals={15}
                            />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell padding='checkbox'>
                            <Checkbox
                                onChange={(event) => {
                                    setIncludeGroup(event.target.checked);
                                }}
                                checked={includeGroup}
                            />
                        </TableCell>
                        <TableCell>
                            Group <InfoPopover description='Satellite Name' />
                        </TableCell>
                        <TableCell>
                            <Select
                                variant='outlined'
                                color='secondary'
                                title='Group Name'
                                onChange={(evt) => {
                                    setGroup(evt.target.value as string);
                                }}
                                value={group}
                                disabled={!includeGroup}
                            >
                                {groupNames.map((group) => {
                                    return (
                                        <MenuItem key={group} value={group}>
                                            <div dangerouslySetInnerHTML={{ __html: group }} />
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </>
    );
}
