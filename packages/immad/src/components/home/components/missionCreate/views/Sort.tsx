import React from 'react';
import { InputField } from '../../../../common';
import { IconButton, MenuItem } from '@mui/material';
import { SortByBox, SortByLabel } from '../../missions/styles';
import SortAscendingArrowIcon from 'calcite-ui-icons-react/SortAscendingArrowIcon';
import SortDescendingArrowIcon from 'calcite-ui-icons-react/SortDescendingArrowIcon';
import { SortByOption, SortDirection } from './interfaces';

interface SortPropsInterface {
    handleSortChange: (e: string) => Promise<void>;
    handleSortOrderChange: () => Promise<void>;
    sortOrder: SortDirection;
    sortByOptions: SortByOption[];
    sortBy: SortByOption;
}

const SortBox = (sortInputProps: SortPropsInterface): JSX.Element => {
    const { handleSortChange, handleSortOrderChange, sortBy, sortOrder, sortByOptions } = { ...sortInputProps };

    return (
        <>
            <SortByBox>
                <SortByLabel>Sort By</SortByLabel>
                <InputField
                    variant='outlined'
                    select
                    color='secondary'
                    title='Sort By'
                    value={sortBy.id}
                    onChange={(event) => {
                        handleSortChange(event.target.value);
                    }}
                >
                    {sortByOptions?.map((item) => {
                        const key = item.id;
                        return (
                            <MenuItem value={key} key={key}>
                                {item.label}
                            </MenuItem>
                        );
                    })}
                </InputField>
                <IconButton onClick={handleSortOrderChange}>
                    {sortOrder === 'ASC' ? <SortAscendingArrowIcon size={16} /> : <SortDescendingArrowIcon size={16} />}
                </IconButton>
            </SortByBox>
        </>
    );
};

export default SortBox;
