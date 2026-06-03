import React, { ChangeEvent } from 'react';
import { IconButton, InputAdornment } from '@mui/material';
import MagnifyingGlassIcon from 'calcite-ui-icons-react/MagnifyingGlassIcon';
import { SearchBox } from '../../missions/styles';
import { InputField } from '../../../../common';
import XIcon from 'calcite-ui-icons-react/XIcon';

interface SearchInputsInterface {
    handleFilterChange: (event: ChangeEvent<HTMLInputElement>) => void;
    handleClearFilter: () => void;
    filterString: string;
    placeHolderString: string;
}

const SearchTextBox = (searchInputProps: SearchInputsInterface): JSX.Element => {
    const { handleFilterChange, handleClearFilter, filterString, placeHolderString } = { ...searchInputProps };

    return (
        <>
            <SearchBox>
                <InputField
                    variant='outlined'
                    placeholder={placeHolderString}
                    fullWidth
                    size='small'
                    color='secondary'
                    value={filterString}
                    onChange={handleFilterChange}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position='end'>
                                <IconButton onClick={handleClearFilter} disabled={filterString.length === 0}>
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
        </>
    );
};

export default SearchTextBox;
