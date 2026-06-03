import React, { useContext, useEffect, useRef, useState } from 'react';
import { ColDef, ColumnApi, ColumnState, GridApi } from 'ag-grid-community';

export interface CalendarFeatureGridProviderProps {
    children: JSX.Element[] | JSX.Element;
}

interface ContextProps {
    aliasNameToFieldNameMap: Map<string, string> | undefined;
    setAliasNameToFieldNameMap: (value: Map<string, string> | undefined) => void;
    columnState: ColumnState[] | undefined;
    setColumnState: (value: ColumnState[] | undefined) => void;
    filterState: any | undefined;
    setFilterState: (value: any | undefined) => void;
    selectedRows: any[] | undefined;
    setSelectedRows: (value: any[] | undefined) => void;
    colDefs: ColDef[] | undefined;
    setColDefs: (value: ColDef[] | undefined) => void;
    gridApi: GridApi | undefined;
    setGridApi: (value: GridApi | undefined) => void;
    gridColumnApi: ColumnApi | undefined;
    setGridColumnApi: (value: ColumnApi | undefined) => void;
}

export const CalendarFeatureGridContext = React.createContext<ContextProps>({
    aliasNameToFieldNameMap: undefined,
    setAliasNameToFieldNameMap: (_value: Map<string, string> | undefined) => {
        return;
    },
    columnState: undefined,
    setColumnState: (_value: ColumnState[] | undefined) => {
        return;
    },
    filterState: undefined,
    setFilterState: (_value: any | undefined) => {
        return;
    },
    selectedRows: undefined,
    setSelectedRows: (_value: any[]) => {
        return;
    },
    colDefs: undefined,
    setColDefs: (_value: ColDef[] | undefined) => {
        return;
    },
    gridApi: undefined,
    setGridApi: (_value: GridApi) => {
        return;
    },
    gridColumnApi: undefined,
    setGridColumnApi: (_value: ColumnApi) => {
        return;
    },
});

export function useCalendarFeatureGridContext(): ContextProps {
    return useContext(CalendarFeatureGridContext);
}

export function CalendarFeatureGridContextProvider({ children }: CalendarFeatureGridProviderProps): JSX.Element {
    const [aliasNameToFieldNameMap, setAliasNameToFieldNameMap] = useState<Map<string, string> | undefined>();
    const [columnState, setColumnState] = useState<ColumnState[] | undefined>();
    const [filterState, setFilterState] = useState<any | undefined>();
    const [selectedRows, setSelectedRows] = useState<any[] | undefined>();
    const [colDefs, setColDefs] = useState<ColDef[] | undefined>();
    const [gridApi, setGridApi] = useState<GridApi>();
    const [gridColumnApi, setGridColumnApi] = useState<ColumnApi>();
    const columnStateRef = useRef<ColumnState[]>();
    const filterStateRef = useRef<ColDef[]>();

    //maintains scope when saving new values
    useEffect(() => {
        if (columnState) {
            columnStateRef.current = columnState;
        }
        if (filterState) {
            filterStateRef.current = filterState;
        }
    }, [columnState, filterState]);

    const value = {
        columnState,
        setColumnState,
        filterState,
        setFilterState,
        selectedRows,
        setSelectedRows,
        colDefs,
        setColDefs,
        gridApi,
        setGridApi,
        gridColumnApi,
        setGridColumnApi,
        aliasNameToFieldNameMap,
        setAliasNameToFieldNameMap,
    };

    return <CalendarFeatureGridContext.Provider value={value}>{children} </CalendarFeatureGridContext.Provider>;
}
