import React, { useContext, useState } from 'react';
import { IIMMADUser } from '../components/administrator/components/PortalUsersPage';

export interface AdminSettingsProviderProps {
    children: JSX.Element[] | JSX.Element;
}

/**
 * The type definition for the Table Header row
 */
export type HeadCellTypes = {
    id: string;
    numeric: boolean;
    disablePadding: boolean;
    label: string;
    sortEnabled: boolean;
};

/**
 * Interface for item to track the different filters
 */
export interface FiltersListItem {
    id: number;
    value: string;
}

export type IMMADGroupType = {
    groupName: string;
    groupId: string;
};

interface ContextProps {
    userBeingUpdated: boolean;
    setUserBeingUpdated: (value: boolean) => void;
    userSettingsUpdated: boolean;
    setUserSettingsUpdated: (value: boolean) => void;
    selectedFilterItem: FiltersListItem;
    setSelectedFilterItem: (value: FiltersListItem) => void;
    rowsPerPage: number;
    setRowsPerPage: (value: number) => void;
    tablePage: number;
    setTablePage: (value: number) => void;
    filteredUsers: IIMMADUser[];
    setFilteredUsers: (value: IIMMADUser[]) => void;
    selectedUsers: string[];
    setSelectedUsers: (_value: string[]) => void;
    tableOrderBy: string;
    setTableOrderBy: (_value: string) => void;
    enhancedTableHeadCells: HeadCellTypes[];
    setEnhancedTableHeadCells: (_value: HeadCellTypes[]) => void;
    tableOrder: 'asc' | 'desc';
    setTableOrder: (_value: 'asc' | 'desc') => void;
    totalNumberPortalUsers: number;
    setTotalNumberPortalUsers: (value: number) => void;
}

export const AdminSettingsContext = React.createContext<ContextProps>({
    userBeingUpdated: true,
    setUserBeingUpdated: (_value: boolean) => {
        return;
    },
    userSettingsUpdated: false,
    setUserSettingsUpdated: (_value: boolean) => {
        return;
    },
    rowsPerPage: 0,
    setRowsPerPage: (_value: number) => {
        return;
    },
    tablePage: 0,
    setTablePage: (_value: number) => {
        return;
    },
    filteredUsers: [],
    setFilteredUsers: (_value: IIMMADUser[]) => {
        return;
    },
    selectedUsers: [],
    setSelectedUsers: (_value: string[]) => {
        return;
    },
    tableOrderBy: '',
    setTableOrderBy: (_value: string) => {
        return;
    },
    enhancedTableHeadCells: [],
    setEnhancedTableHeadCells: (_value: HeadCellTypes[]) => {
        return;
    },
    tableOrder: 'asc',
    setTableOrder: (_value: 'asc' | 'desc') => {
        return;
    },
    totalNumberPortalUsers: 0,
    setTotalNumberPortalUsers: (_value: number) => {
        return;
    },
    selectedFilterItem: { id: 0, value: '' },
    setSelectedFilterItem: (_value: FiltersListItem) => {
        return;
    },
});

export function useAdminSettingsContext(): ContextProps {
    return useContext(AdminSettingsContext);
}

export function AdminSettingsProvider({ children }: AdminSettingsProviderProps): JSX.Element {
    const [userBeingUpdated, setUserBeingUpdated] = useState<boolean>(true);
    const [userSettingsUpdated, setUserSettingsUpdated] = useState<boolean>(false);
    const [rowsPerPage, setRowsPerPage] = useState<number>(5);
    const [tablePage, setTablePage] = useState<number>(0);
    const [filteredUsers, setFilteredUsers] = useState<IIMMADUser[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [tableOrderBy, setTableOrderBy] = useState('');
    const [enhancedTableHeadCells, setEnhancedTableHeadCells] = useState<HeadCellTypes[]>([]);
    const [tableOrder, setTableOrder] = useState<'asc' | 'desc'>('asc');
    const [totalNumberPortalUsers, setTotalNumberPortalUsers] = useState<number>(0);
    const [selectedFilterItem, setSelectedFilterItem] = useState<FiltersListItem>({ id: 0, value: '' });

    const value = {
        userBeingUpdated,
        setUserBeingUpdated,
        userSettingsUpdated,
        setUserSettingsUpdated,
        filteredUsers,
        setFilteredUsers,
        rowsPerPage,
        setRowsPerPage,
        tablePage,
        setTablePage,
        selectedUsers,
        setSelectedUsers,
        tableOrderBy,
        setTableOrderBy,
        enhancedTableHeadCells,
        setEnhancedTableHeadCells,
        tableOrder,
        setTableOrder,
        totalNumberPortalUsers,
        setTotalNumberPortalUsers,
        selectedFilterItem,
        setSelectedFilterItem,
    };

    return <AdminSettingsContext.Provider value={value}>{children} </AdminSettingsContext.Provider>;
}
