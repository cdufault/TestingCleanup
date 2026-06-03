import { List, ListItem, Checkbox, ListItemIcon, ListItemText, FormControlLabel, Typography } from '@mui/material';
import React, { SetStateAction, useEffect, useState } from 'react';
import { SystemType } from './StratLeadFormElements';

/**
 * Input props for this this UI piece
 */
interface ShowRelatedSystemsProps {
    selectedSystems: SystemType[];
    setSelectedSystems: React.Dispatch<SetStateAction<SystemType[]>>;
    systemsInGroup: SystemType[];
}

/**
 * Use the last or most 40 chars of the sytem path values
 * @param props props from the selected item
 */
const ShowRelatedSystems = (props: ShowRelatedSystemsProps): JSX.Element => {
    const { systemsInGroup, selectedSystems, setSelectedSystems } = props;
    const [isCheckAll, setIsCheckAll] = useState<boolean>(false);
    const [allSystems, setAllSystems] = useState<SystemType[]>([]);

    useEffect(() => {
        initForm();
    }, []);

    useEffect(() => {
        if (selectedSystems.length > 0 && selectedSystems.length === allSystems.length) {
            !isCheckAll && setIsCheckAll(true);
        } else {
            isCheckAll && setIsCheckAll(false);
        }
    }, [allSystems, selectedSystems]);

    /**
     * Setup the UI
     */
    const initForm = async () => {
        const systemArray = systemsInGroup ?? [...systemsInGroup];
        if (systemArray !== undefined && systemArray.length > 0) {
            setAllSystems(
                systemArray.map((field: any) => {
                    return {
                        systemName: field.systemName as string,
                        isGroup: field.isGroup,
                        recordId: field.recordId,
                        recordPath: field.recordPath,
                        recordVersion: field.recordVersion,
                        guid: field.guid
                    };
                })
            );
        } else {
            setAllSystems([...[]]);
        }
    };

    /**
     * Checkbox check all handler.
     * @param _event event
     */
    const onAllCheckboxChange = (_event: any) => {
        setIsCheckAll(!isCheckAll);
        allSystems &&
            setSelectedSystems(
                allSystems.map((system) => {
                    return {
                        systemName: system.systemName,
                        isGroup: system.isGroup,
                        recordId: system.recordId,
                        recordPath: system.recordPath,
                        recordVersion: system.recordVersion,
                        guid: system.guid,
                    };
                })
            );
        if (isCheckAll) {
            setSelectedSystems([]);
        }
    };

    /**
     * Checkbox changed handler.
     * @param event event
     */
    const onCheckboxChange = (event: any) => {
        const { id, name, checked } = event.target;
        const system = allSystems.find((system) => system.recordId === id);
        if (system) {
            const isGroup = system.isGroup;
            selectedSystems &&
                setSelectedSystems([
                    ...selectedSystems,
                    {
                        systemName: system.systemName,
                        isGroup: isGroup,
                        recordId: system.recordId,
                        recordPath: system.recordPath,
                        recordVersion: system.recordVersion,
                        guid: system.guid
                    },
                ]);
        }

        if (!checked) {
            selectedSystems && setSelectedSystems(selectedSystems.filter((item) => item.systemName != name));
        }
    };

    function calcSystemName(recordPath: string): string {
        if (recordPath && recordPath != '') {
            if (recordPath.length < 40) {
                return recordPath;
            } else {
                return recordPath.substring(recordPath.length - 40);
            }
        } else {
            return recordPath;
        }
    }

    return (
        <>
            {allSystems && allSystems.length > 0 ? (
                <>
                    <FormControlLabel
                        control={
                            <Checkbox
                                id={'selectAll'}
                                name={'selectAll'}
                                checked={isCheckAll}
                                onChange={onAllCheckboxChange}
                            />
                        }
                        label='Check/Uncheck All Systems to Update'
                    />
                    <List>
                        {allSystems.map((system, index) => {
                            return (
                                <ListItem key={index} dense>
                                    <ListItemIcon>
                                        <Checkbox
                                            name={system.systemName}
                                            id={system.recordId}
                                            checked={selectedSystems?.some(
                                                (selectedSystem) => selectedSystem.systemName === system.systemName
                                            )}
                                            onChange={onCheckboxChange}
                                            size='small'
                                        />
                                    </ListItemIcon>

                                    {system.isGroup === true ? (
                                        <ListItemText>
                                            <Typography sx={{color:'white'}}>{calcSystemName(system.systemName)}</Typography>
                                        </ListItemText>
                                    ) : (
                                        <ListItemText>
                                            <Typography color='textSecondary'>
                                                {calcSystemName(system.systemName)}
                                            </Typography>
                                        </ListItemText>
                                    )}
                                </ListItem>
                            );
                        })}
                    </List>
                </>
            ) : (
                <Typography>This is a system or an empty group. </Typography>
            )}
        </>
    );
};
export default ShowRelatedSystems;
