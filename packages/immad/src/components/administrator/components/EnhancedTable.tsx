import React, { ChangeEvent } from 'react';

// Context Imports
import { useAdminSettingsContext } from '../../../contexts/AdminSettingsContext';

import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import Paper from '@mui/material/Paper';
import TableCell from '@mui/material/TableCell';
import TableSortLabel from '@mui/material/TableSortLabel';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TablePagination from '@mui/material/TablePagination';
import { StyledFlexTypography, StyledMuiTableCell } from '../styles';
import { IMMADRoles, IIMMADUser } from './PortalUsersPage';
import { MenuItem } from '@mui/material';
import { InputField } from '../../common';

/**
 * Defines the input properties required by the EnhancedTableHead component.
 */
interface EnhancedTableHeadProps {
    onSelectAllClick(event: React.ChangeEvent<HTMLInputElement>): void;
    order: 'asc' | 'desc';
    orderBy: string;
    numSelected: number;
    rowCount: number;
    onRequestSort(property: string): void;
}

/** *
 * A sub component of the EnhancedTable component that provides the
 * ability for IMMAD to create a sortable table.
 * @param props
 * @constructor
 */
function EnhancedTableHead(props: EnhancedTableHeadProps): JSX.Element {
    const { onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort } = props;
    const adminSettingsContext = useAdminSettingsContext();

    return (
        <TableHead>
            <TableRow>
                <TableCell padding='checkbox'>
                    <Checkbox
                        color='primary'
                        indeterminate={numSelected > 0 && numSelected < rowCount}
                        checked={rowCount > 0 && numSelected === rowCount}
                        onChange={onSelectAllClick}
                        inputProps={{
                            'aria-label': 'select all users',
                        }}
                    />
                </TableCell>
                {adminSettingsContext.enhancedTableHeadCells.map((headCell) =>
                    headCell.sortEnabled ? (
                        <TableCell
                            key={headCell.id}
                            align={headCell.numeric ? 'right' : 'left'}
                            // In MUI 5 default is deprecated use normal instead for padding
                            padding={headCell.disablePadding ? 'none' : 'default'}
                            sortDirection={orderBy === headCell.id ? order : false}
                        >
                            <TableSortLabel
                                active={orderBy === headCell.id}
                                direction={orderBy === headCell.id ? order : 'asc'}
                                onClick={() => {
                                    onRequestSort(headCell.id);
                                }}
                            >
                                {headCell.label}
                                {orderBy === headCell.id ? <Box component='span' /> : null}
                            </TableSortLabel>
                        </TableCell>
                    ) : (
                        <TableCell
                            key={headCell.id}
                            align={headCell.numeric ? 'right' : 'left'}
                            // In MUI 5 default is deprecated use normal instead for padding
                            padding={headCell.disablePadding ? 'none' : 'default'}
                        >
                            {headCell.label}
                        </TableCell>
                    )
                )}
            </TableRow>
        </TableHead>
    );
}

/**
 * Defines the input properties required by the EnhancedTableToolbar component.
 */
interface EnhancedTableToolbarProps {
    numSelected: number;
    totalNumberOfUsers: number;
}

/**
 * A sub component of the EnhancedTable component that provides the
 * ability for IMMAD to display number selected above the table.
 * @param props
 * @constructor
 */
const EnhancedTableToolbar = (props: EnhancedTableToolbarProps) => {
    const { numSelected, totalNumberOfUsers } = props;
    return (
        <Toolbar>
            {numSelected > 0 ? (
                <StyledFlexTypography color='inherit' variant='subtitle1'>
                    {numSelected} selected of {totalNumberOfUsers}
                </StyledFlexTypography>
            ) : (
                <StyledFlexTypography variant='h6' id='tableTitle' />
            )}
        </Toolbar>
    );
};

interface EnhancedTableProps {
    handleIndividualUserRoleChanged(
        event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
        userInfo: IIMMADUser
    ): void;
}

/**
 * A sub component of the PortalUsersPage component that provides the
 * ability for IMMAD to create a table that is sortable and selectable.
 * @constructor
 */
export default function EnhancedTable(props: EnhancedTableProps): JSX.Element {
    const adminSettingsContext = useAdminSettingsContext();
    const immadRolesArray = arrayFromEnum(IMMADRoles);
    const immadRolesMenuItems = immadRolesArray.map((mode) => (
        <MenuItem key={mode} value={mode}>
            {mode}
        </MenuItem>
    ));

    const handleRequestSort = (property: string) => {
        // sort changed reset page to first
        adminSettingsContext.setTablePage(0);
        // make request to server with sort order and page number to get list of users back.
        const isAsc = adminSettingsContext.tableOrderBy === property && adminSettingsContext.tableOrder === 'asc';
        adminSettingsContext.setTableOrder(isAsc ? 'desc' : 'asc');
        if (property !== adminSettingsContext.tableOrderBy) {
            adminSettingsContext.setTableOrderBy(property);
        }
    };
    const handleSelectUsersCurrentPageClick = (event: React.ChangeEvent<HTMLInputElement>) => {
        // if selected has length then toggle off selection.
        if (event.target?.checked && adminSettingsContext.selectedUsers.length === 0) {
            // sort row, slice size, then map to get the selected.
            // replace this with a query to portal that will come back sorted the right way
            const orderedRowsSelection = adminSettingsContext.filteredUsers
                .slice()
                // .sort(getComparator(adminSettingsContext.tableOrder, adminSettingsContext.tableOrderBy))
                .slice(
                    adminSettingsContext.tablePage * adminSettingsContext.rowsPerPage,
                    adminSettingsContext.rowsPerPage * (adminSettingsContext.tablePage + 1)
                )
                .map((item: IIMMADUser) => item.username ?? '');
            adminSettingsContext.setSelectedUsers(orderedRowsSelection);
            return;
        }
        // set to none selected
        adminSettingsContext.setSelectedUsers([]);
    };
    const handleClick = (username: string) => {
        const selectedIndex = adminSettingsContext.selectedUsers.indexOf(username);
        const newSelected: string[] = [...adminSettingsContext.selectedUsers];
        if (selectedIndex === -1) {
            newSelected.push(username);
        } else {
            newSelected.splice(selectedIndex, 1);
        }
        adminSettingsContext.setSelectedUsers(newSelected);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        adminSettingsContext.setRowsPerPage(parseInt(event.target.value, 10));
        adminSettingsContext.setTablePage(0);
    };

    const handleChangePage = (event: unknown, pageNumber: number) => {
        adminSettingsContext.setTablePage(pageNumber);
        adminSettingsContext.setSelectedUsers([]);
    };
    const isSelected = (username: string) => adminSettingsContext.selectedUsers.indexOf(username) !== -1;

    async function handleSelectValueChanged(
        event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
        userInfo: IIMMADUser
    ) {
        props.handleIndividualUserRoleChanged(event, userInfo);
    }

    function arrayFromEnum(enumObject: typeof IMMADRoles) {
        const all = [];
        for (const key in enumObject) {
            const value = enumObject[key];
            if (typeof value === 'string') {
                all.push(enumObject[key]);
            }
        }
        return all;
    }

    function getUserCustomSelect(userInfo: IIMMADUser, isItemSelected: boolean) {
        return (
            <InputField
                fullWidth
                variant='outlined'
                color='secondary'
                select
                required
                disabled={isItemSelected}
                value={IMMADRoles[userInfo.immadRole]}
                onClick={(e) => e.stopPropagation()}
                onChange={(e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
                    handleSelectValueChanged(e, userInfo);
                }}
            >
                {immadRolesMenuItems}
            </InputField>
        );
    }

    return (
        <Box>
            <Paper>
                <EnhancedTableToolbar
                    totalNumberOfUsers={adminSettingsContext.totalNumberPortalUsers}
                    numSelected={adminSettingsContext.selectedUsers.length}
                />
                <TableContainer>
                    <Table aria-labelledby='tableTitle' size='small'>
                        <EnhancedTableHead
                            numSelected={adminSettingsContext.selectedUsers.length}
                            order={adminSettingsContext.tableOrder}
                            orderBy={adminSettingsContext.tableOrderBy}
                            onSelectAllClick={handleSelectUsersCurrentPageClick}
                            onRequestSort={handleRequestSort}
                            rowCount={adminSettingsContext.filteredUsers.length}
                        />
                        <TableBody>
                            {adminSettingsContext.filteredUsers
                                .slice()
                                .slice(
                                    adminSettingsContext.tablePage * adminSettingsContext.rowsPerPage,
                                    adminSettingsContext.tablePage * adminSettingsContext.rowsPerPage +
                                        adminSettingsContext.rowsPerPage
                                )
                                .map((row, index) => {
                                    const isItemSelected = isSelected(row.username ?? '');
                                    const labelId = `enhanced-table-checkbox-${index}`;
                                    return (
                                        <TableRow
                                            hover
                                            onClick={() => handleClick(row.username ?? '')}
                                            role='checkbox'
                                            aria-checked={isItemSelected}
                                            tabIndex={-1}
                                            key={row.username}
                                            selected={isItemSelected}
                                        >
                                            <TableCell padding='checkbox'>
                                                <Checkbox
                                                    color='secondary'
                                                    checked={isItemSelected}
                                                    inputProps={{
                                                        'aria-labelledby': labelId,
                                                    }}
                                                />
                                            </TableCell>
                                            <StyledMuiTableCell component='th' id={labelId} scope='row'>
                                                {row.username}
                                            </StyledMuiTableCell>
                                            <StyledMuiTableCell>
                                                {row.lastLogin === undefined || row.lastLogin === 0
                                                    ? 'Never'
                                                    : new Date(row.lastLogin).toUTCString()}
                                            </StyledMuiTableCell>
                                            <StyledMuiTableCell>
                                                {getUserCustomSelect(row, isItemSelected)}
                                            </StyledMuiTableCell>
                                        </TableRow>
                                    );
                                })}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component='div'
                    count={adminSettingsContext.totalNumberPortalUsers}
                    rowsPerPage={adminSettingsContext.rowsPerPage}
                    page={adminSettingsContext.tablePage}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>
        </Box>
    );
}
