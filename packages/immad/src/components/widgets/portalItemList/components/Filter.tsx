// React imports
import React, { useState, Fragment, useContext, ChangeEvent } from 'react';

// Component imports
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItemIcon from '@mui/material/ListItemIcon';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import FilterIcon from 'calcite-ui-icons-react/FilterIcon';
import { StyledPopoverContent, StyledPopoverListItem } from '../styles';
import { FilterGroups, ExtentType } from '../resources';

// Context imports
import { AppContext } from '../../../../contexts/App';
import { InlineSelect } from '../../../common';
import { MenuItem, Box, IconButton } from '@mui/material';

interface FilterProps {
    isSpatial: boolean;
    filterGroups: FilterGroups;
    setFilterGroups: React.Dispatch<React.SetStateAction<FilterGroups>>;
    filterMyContent: boolean;
    setFilterMyContent: React.Dispatch<React.SetStateAction<boolean>>;
    filterMyOrganization: boolean;
    setFilterMyOrganization: React.Dispatch<React.SetStateAction<boolean>>;
    filterCurrentMission: boolean;
    setFilterCurrentMission: React.Dispatch<React.SetStateAction<boolean>>;
    hasMission: boolean;
    filterExtent: boolean;
    setFilterExtent: React.Dispatch<React.SetStateAction<boolean>>;
    filterExtentType: ExtentType;
    setFilterExtentType: React.Dispatch<React.SetStateAction<ExtentType>>;

    /**new props added to extend the widget to support map/scene selection in the create/edit mission workflow */
    filterOnIMMADWebSceneTag?: boolean;
    filterOnIMMADWebMapTag?: boolean;
    filterByWebSceneOnly: boolean;
    setFilterByWebSceneOnly: React.Dispatch<React.SetStateAction<boolean>>;
    filterByWebMapOnly: boolean;
    setFilterWebMapOnly: React.Dispatch<React.SetStateAction<boolean>>;
    showFilterCurrentMission: boolean;
}

function Filter(props: FilterProps): JSX.Element {
    const { userRoles } = useContext(AppContext);

    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

    const {
        isSpatial,
        filterGroups,
        setFilterGroups,
        filterMyContent,
        setFilterMyContent,
        filterMyOrganization,
        setFilterMyOrganization,
        filterCurrentMission,
        setFilterCurrentMission,
        hasMission,
        filterExtent,
        setFilterExtent,
        filterExtentType,
        setFilterExtentType,
        filterOnIMMADWebSceneTag,
        filterOnIMMADWebMapTag,
        filterByWebSceneOnly,
        setFilterByWebSceneOnly,
        filterByWebMapOnly,
        setFilterWebMapOnly,
        showFilterCurrentMission,
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

    const handleFilterMyOrganizationToggle = () => {
        setFilterMyOrganization((value) => !value);
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

    /**
     * Toggle the filter by map tag value
     */
    const handleFilterWebMapOnlyToggle = () => {
        setFilterWebMapOnly((value) => !value);
    };

    /**
     * Toggle the filter by scene tag value
     */
    const handleFilterSceneTagToggle = () => {
        setFilterByWebSceneOnly((value) => !value);
    };

    return (
        <Fragment>
            <IconButton onClick={handleClick}>
                <FilterIcon size={16} />
            </IconButton>
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
                <StyledPopoverContent variant='outlined'>
                    <List>
                        {userRoles.Administrator === true && createGroupListItem('Administrator', 'admin')}
                        {userRoles.MissionManager === true && createGroupListItem('Mission Manager', 'missionManager')}
                        {userRoles.Analyst === true && createGroupListItem('Analyst', 'analyst')}
                        <Divider />
                        {filterOnIMMADWebMapTag && (
                            <StyledPopoverListItem button={true} onClick={handleFilterWebMapOnlyToggle}>
                                <ListItemIcon>
                                    <Checkbox
                                        color='secondary'
                                        edge='start'
                                        tabIndex={-1}
                                        disableRipple
                                        checked={filterByWebMapOnly}
                                    />
                                </ListItemIcon>
                                <ListItemText primary={'Web Maps only'} />
                            </StyledPopoverListItem>
                        )}
                        {filterOnIMMADWebSceneTag && (
                            <StyledPopoverListItem button={true} onClick={handleFilterSceneTagToggle}>
                                <ListItemIcon>
                                    <Checkbox
                                        color='secondary'
                                        edge='start'
                                        tabIndex={-1}
                                        disableRipple
                                        checked={filterByWebSceneOnly}
                                    />
                                </ListItemIcon>
                                <ListItemText primary={'Web Scenes only'} />
                            </StyledPopoverListItem>
                        )}
                        <StyledPopoverListItem button={true} onClick={handleFilterMyContentToggle}>
                            <ListItemIcon>
                                <Checkbox
                                    color='secondary'
                                    edge='start'
                                    tabIndex={-1}
                                    disableRipple
                                    checked={filterMyContent}
                                />
                            </ListItemIcon>
                            <ListItemText primary='My Content' />
                        </StyledPopoverListItem>
                        <StyledPopoverListItem button={true} onClick={handleFilterMyOrganizationToggle}>
                            <ListItemIcon>
                                <Checkbox
                                    color='secondary'
                                    edge='start'
                                    tabIndex={-1}
                                    disableRipple
                                    checked={filterMyOrganization}
                                />
                            </ListItemIcon>
                            <ListItemText primary='My Organization' />
                        </StyledPopoverListItem>
                        <Divider />
                        {showFilterCurrentMission && (
                            <div>
                                <StyledPopoverListItem
                                    button={true}
                                    onClick={handleFilterCurrentMissionToggle}
                                    disabled={!hasMission}
                                >
                                    <ListItemIcon>
                                        <Checkbox
                                            color='secondary'
                                            edge='start'
                                            tabIndex={-1}
                                            disableRipple
                                            checked={filterCurrentMission}
                                        />
                                    </ListItemIcon>
                                    <ListItemText primary='Current Mission' />
                                </StyledPopoverListItem>
                                <Divider color={'secondary'} />
                            </div>
                        )}
                        <Box hidden={!isSpatial}>
                            <StyledPopoverListItem button={true} onClick={handleFilterExtentToggle}>
                                <ListItemIcon>
                                    <Checkbox
                                        color='secondary'
                                        edge='start'
                                        tabIndex={-1}
                                        disableRipple
                                        checked={filterExtent}
                                    />
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
                            </StyledPopoverListItem>
                        </Box>
                    </List>
                </StyledPopoverContent>
            </Popover>
        </Fragment>
    );

    function createGroupListItem(text: string, group: keyof FilterGroups) {
        return (
            <StyledPopoverListItem button={true} onClick={() => handleFilterGroupToggle(group)}>
                <ListItemIcon>
                    <Checkbox
                        color='secondary'
                        edge='start'
                        tabIndex={-1}
                        disableRipple
                        checked={filterGroups[group]}
                    />
                </ListItemIcon>
                <ListItemText primary={text} />
            </StyledPopoverListItem>
        );
    }
}

export default Filter;
