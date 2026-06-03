// React imports
import React, { useState, Fragment, useContext, ChangeEvent } from 'react';

// Component imports
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItemIcon from '@mui/material/ListItemIcon';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import FilterIcon from 'calcite-ui-icons-react/FilterIcon';
import { PopoverContent, PopoverListItem } from '../styles';
import { FilterGroups, ExtentType } from '../resources';

// Context imports
import { AppContext } from '../../../../contexts/App';
import { InlineSelect } from '../../../common';
import { MenuItem, Box } from '@mui/material';

interface FilterProps {
    filterGroups: FilterGroups;
    setFilterGroups: React.Dispatch<React.SetStateAction<FilterGroups>>;
    filterMyContent: boolean;
    setFilterMyContent: React.Dispatch<React.SetStateAction<boolean>>;
    filterCurrentMission: boolean;
    setFilterCurrentMission: React.Dispatch<React.SetStateAction<boolean>>;
    hasMission: boolean;
    filterExtent: boolean;
    setFilterExtent: React.Dispatch<React.SetStateAction<boolean>>;
    filterExtentType: ExtentType;
    setFilterExtentType: React.Dispatch<React.SetStateAction<ExtentType>>;
}

function Filter(props: FilterProps): JSX.Element {
    const { userRoles } = useContext(AppContext);

    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

    const {
        filterGroups,
        setFilterGroups,
        filterMyContent,
        setFilterMyContent,
        filterCurrentMission,
        setFilterCurrentMission,
        hasMission,
        filterExtent,
        setFilterExtent,
        filterExtentType,
        setFilterExtentType,
    } = props;

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleFilterGroupToggle = (param: keyof FilterGroups) => {
        setFilterGroups((groups) => {
            return {
                ...groups,
                [param]: !groups[param],
            };
        });
    };

    const handleFilterMyContentToggle = () => {
        setFilterMyContent((value) => !value);
    };

    const handleFilterCurrentMissionToggle = () => {
        setFilterCurrentMission((value) => !value);
    };

    const handleFilterExtentToggle = () => {
        setFilterExtent((value) => !value);
    };

    const handleFilterExtentTypeChange = (event: ChangeEvent<HTMLInputElement>) => {
        setFilterExtentType(parseInt(event.target.value) as ExtentType);
    };

    return (
        <Fragment>
            <Button
                variant='outlined'
                size='small'
                style={{ minWidth: 'auto', marginInlineEnd: '1rem', height: '41px' }}
                onClick={handleClick}
            >
                <FilterIcon size={16} />
            </Button>
            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
            >
                <PopoverContent elevation={0} variant='outlined'>
                    <List>
                        {userRoles.Administrator === true && createGroupListItem('Administrator', 'admin')}
                        {userRoles.MissionManager === true && createGroupListItem('Mission Manager', 'missionManager')}
                        {userRoles.Analyst === true && createGroupListItem('Analyst', 'analyst')}
                        <Divider />
                        <PopoverListItem button={true} onClick={handleFilterMyContentToggle}>
                            <ListItemIcon>
                                <Checkbox edge='start' tabIndex={-1} disableRipple checked={filterMyContent} />
                            </ListItemIcon>
                            <ListItemText primary='My Content' />
                        </PopoverListItem>
                        <Divider />
                        <PopoverListItem
                            button={true}
                            onClick={handleFilterCurrentMissionToggle}
                            disabled={!hasMission}
                        >
                            <ListItemIcon>
                                <Checkbox edge='start' tabIndex={-1} disableRipple checked={filterCurrentMission} />
                            </ListItemIcon>
                            <ListItemText primary='Current Mission' />
                        </PopoverListItem>
                        <Divider />

                        <PopoverListItem button={true} onClick={handleFilterExtentToggle}>
                            <ListItemIcon>
                                <Checkbox edge='start' tabIndex={-1} disableRipple checked={filterExtent} />
                            </ListItemIcon>
                            <ListItemText primary='Extent:' />
                            <Box
                                onClick={
                                    filterExtent
                                        ? (event) => {
                                              event.stopPropagation();
                                          }
                                        : undefined
                                }
                            >
                                <InlineSelect
                                    variant='outlined'
                                    color='secondary'
                                    value={hasMission ? filterExtentType : ExtentType.VIEW}
                                    onChange={handleFilterExtentTypeChange}
                                    disabled={!filterExtent}
                                >
                                    <MenuItem disabled={!hasMission} value={ExtentType.MISSION}>
                                        Current Mission
                                    </MenuItem>
                                    <MenuItem value={ExtentType.VIEW}>Active View</MenuItem>
                                </InlineSelect>
                            </Box>
                        </PopoverListItem>
                    </List>
                </PopoverContent>
            </Popover>
        </Fragment>
    );

    function createGroupListItem(text: string, group: keyof FilterGroups) {
        return (
            <PopoverListItem button={true} onClick={() => handleFilterGroupToggle(group)}>
                <ListItemIcon>
                    <Checkbox edge='start' tabIndex={-1} disableRipple checked={filterGroups[group]} />
                </ListItemIcon>
                <ListItemText primary={text} />
            </PopoverListItem>
        );
    }
}

export default Filter;
