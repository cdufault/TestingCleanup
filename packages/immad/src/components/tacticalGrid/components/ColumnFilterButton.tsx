// React imports
import React, { Fragment, useContext, useEffect, useRef, useState, MouseEvent } from 'react';

//Component imports
import ShowColumnIcon from 'calcite-ui-icons-react/ShowColumnIcon';
import { Button, ButtonGroup, Checkbox, Divider, FormControlLabel, MenuItem, MenuList, Popover } from '@mui/material';
import { TacticalGridContext } from '../../../contexts/TacticalGrid';
import { ColumnState } from 'ag-grid-community';
import { StyledPopoverBox } from '../styles';
import CaretDownIcon from 'calcite-ui-icons-react/CaretDownIcon';
import { splitButtonOptions } from '../resources';
import { useSnackbar } from 'notistack';

interface ColumnDisplay {
    id: string;
    visible: boolean;
}

function ColumnFilterButton(): JSX.Element {
    const { setColumnState, setFilterState, gridApi, gridColumnApi } = useContext(TacticalGridContext);
    const { enqueueSnackbar } = useSnackbar();

    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement>();
    const [allColumns, setAllColumns] = useState<ColumnDisplay[]>([]);
    const [isMixed, setIsMixed] = useState<boolean>();
    const open = Boolean(anchorEl);

    const anchorRefForSplitButton = useRef<HTMLDivElement>(null);
    const [splitMenuIsOpen, setSplitMenuIsOpen] = useState(false);

    useEffect(() => {
        if (anchorEl) {
            const allCols = gridColumnApi?.getAllGridColumns();
            const columns = allCols?.flatMap((col) => {
                return col.getId() != '0' ? { id: col.getId(), visible: col.isVisible() } : [];
            });
            columns && setAllColumns(columns as ColumnDisplay[]);
        }
    }, [anchorEl]);

    useEffect(() => {
        if (allColumns) {
            const hasFalse = allColumns.find((col) => col.visible === false);
            const hasTrue = allColumns.find((col) => col.visible === true);
            if (hasTrue && hasFalse) {
                setIsMixed(true);
            } else {
                setIsMixed(false);
            }
        }
    }, [allColumns]);

    //column menu popover events
    const onFilterButtonClick = (event: React.MouseEvent<HTMLButtonElement | MouseEvent>) => {
        setAnchorEl(event.currentTarget as HTMLButtonElement);
    };
    const onMenuClose = () => {
        setAnchorEl(undefined);
        setColumnState(gridColumnApi?.getColumnState() as ColumnState[]);
    };
    const onAllColumnsChange = (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
        //show or hide columns in grid
        const columnIds = allColumns?.map((col) => col.id) as string[];
        gridColumnApi?.setColumnsVisible(columnIds, checked);

        //update checkboxes
        const updatedColumns = allColumns?.map((col) => {
            return { id: col.id, visible: checked };
        });
        setAllColumns(updatedColumns);
    };
    const onColumnChange = (event: React.ChangeEvent<HTMLInputElement>, checked: boolean, colId: string) => {
        //update column in grid
        gridColumnApi?.setColumnVisible(colId, checked);
        //update checkbox
        const updatedColumns = allColumns.map((col) => (col.id === colId ? { ...col, visible: checked } : col));
        setAllColumns(updatedColumns);
    };

    //split button events
    function handleToggle() {
        setSplitMenuIsOpen((prevOpen) => !prevOpen);
    }
    function handleClose() {
        setSplitMenuIsOpen(false);
    }
    function handleMenuItemClick(index: number) {
        setSplitMenuIsOpen(false);

        switch (index) {
            case 0: // Reset column order, sizes, sort and value filters
                setFilterState(undefined);
                setColumnState(undefined);
                gridApi?.setFilterModel([]);
                gridColumnApi?.resetColumnState();
                gridColumnApi?.autoSizeAllColumns();
                enqueueSnackbar('Grid state successfully reset to default', { variant: 'success' });
                break;
            case 1: // Reset value filters
                setFilterState(undefined);
                gridApi?.setFilterModel([]);
                enqueueSnackbar('Column filters successfully reset to default', { variant: 'success' });
                break;
            case 2: // Reset column order, sizes and sort
                setColumnState(undefined);
                gridColumnApi?.resetColumnState();
                gridColumnApi?.autoSizeAllColumns();
                enqueueSnackbar('Column order, sizes and sort successfully reset to default', { variant: 'success' });
                break;
        }
    }

    return (
        <Fragment>
            <ButtonGroup variant='contained' color='primary' ref={anchorRefForSplitButton}>
                <Button size='medium' onClick={onFilterButtonClick} title='Turn Columns on/off'>
                    <ShowColumnIcon size={20} />
                </Button>
                <Button color='primary' size='small' onClick={handleToggle} title={'Remove Filters/Sorts'}>
                    <CaretDownIcon size={16} />
                </Button>
            </ButtonGroup>

            <Popover
                open={open}
                onClose={onMenuClose}
                anchorEl={anchorEl}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
            >
                <StyledPopoverBox>
                    <FormControlLabel
                        key='_ColumnActions'
                        label='All Columns'
                        control={
                            <Checkbox indeterminate={isMixed} defaultChecked={true} onChange={onAllColumnsChange} />
                        }
                    />
                    <Divider />
                    {allColumns?.map((col) => {
                        return (
                            <FormControlLabel
                                key={col.id}
                                label={col.id}
                                checked={col.visible}
                                control={
                                    <Checkbox
                                        onChange={(event, checked) => {
                                            onColumnChange(event, checked, col.id);
                                        }}
                                    />
                                }
                            />
                        );
                    })}
                </StyledPopoverBox>
            </Popover>

            <Popover
                open={splitMenuIsOpen}
                onClose={handleClose}
                anchorEl={anchorRefForSplitButton.current}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
            >
                <MenuList id='split-button-menu'>
                    {splitButtonOptions.map((option, index) => (
                        <div key={option.name} title={option.name}>
                            <MenuItem
                                key={option.name}
                                onClick={() => handleMenuItemClick(index)}
                                title={option.description}
                            >
                                {option.name}
                            </MenuItem>
                        </div>
                    ))}
                </MenuList>
            </Popover>
        </Fragment>
    );
}

export default ColumnFilterButton;
