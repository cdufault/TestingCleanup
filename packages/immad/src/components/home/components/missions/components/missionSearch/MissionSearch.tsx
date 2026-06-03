import React, { ChangeEvent, useEffect } from 'react';

// Styles
import { SearchBox } from './styles';

// Material UI
import { InputAdornment, IconButton } from '@mui/material';

// Calcite Icons
import MagnifyingGlassIcon from 'calcite-ui-icons-react/MagnifyingGlassIcon';
import XIcon from 'calcite-ui-icons-react/XIcon';

// Types
import { InputField } from '../../../../../common';
import { IItem } from '@esri/arcgis-rest-portal';

interface MissionSearchProps {
    missions: IItem[];
    searchValue: string;
    originalMissionCount?: number;
    clearSearch: () => void;
    handleSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
    setFilterApplied: (filterApplied: boolean) => void;
    setFilteredMissions: (filteredMissions: IItem[]) => void;
    setMissionCount?: (label: string) => void;
}

const MissionSearch = (props: MissionSearchProps): JSX.Element => {
    const {
        missions,
        searchValue,
        originalMissionCount,
        clearSearch,
        handleSearchChange,
        setFilterApplied,
        setFilteredMissions,
        setMissionCount,
    } = props;

    useEffect(() => {
        filterMissions(searchValue);
    }, [missions]);

    useEffect(() => {
        filterMissions(searchValue);
    }, [searchValue]);

    const filterMissions = (searchTerm: string) => {
        const missionsArray = Array.from(missions);
        let filteredMissions = missionsArray;
        if (searchValue !== '') {
            filteredMissions = missionsArray.filter((mission) => {
                if (mission.title.toLowerCase().includes(searchTerm.trim().toLowerCase())) {
                    return mission;
                }
            });
        }
        setFilteredMissions(filteredMissions);
        setFilterApplied(searchValue !== '');
        if (setMissionCount) {
            setMissionCount(`${filteredMissions.length} of ${originalMissionCount ?? 0} Missions`);
        }
    };

    return (
        <SearchBox>
            <InputField
                variant='outlined'
                placeholder='Search by mission name'
                fullWidth
                size='small'
                color='secondary'
                value={searchValue}
                onChange={handleSearchChange}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position='end'>
                            <IconButton onClick={clearSearch} disabled={searchValue.length === 0}>
                                <XIcon size={16} />
                            </IconButton>
                        </InputAdornment>
                    ),
                    startAdornment: (
                        <InputAdornment position='start'>
                            <MagnifyingGlassIcon size={16} />
                        </InputAdornment>
                    ),
                }}
            />
        </SearchBox>
    );
};

export default MissionSearch;
