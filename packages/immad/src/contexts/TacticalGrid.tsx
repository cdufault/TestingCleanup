import React, { useContext, useEffect, useRef, useState } from 'react';
import { ColDef, ColumnApi, ColumnState, GridApi } from 'ag-grid-community';
import PortalUser from '@arcgis/core/portal/PortalUser';
import { ApplicationStateHelper } from '../helpers/ApplicationStateHelper';
import { IUserSaveState, ITacticalGridSettings, TacticalGridState } from '../interfaces/UserSaveState';
import { ConfigHelper } from '../helpers/configHelper';

export interface TacticalGridProviderProps {
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
    getUserGridState: (value: PortalUser, missionId: string) => void;
    saveUserGridState: (value: PortalUser, missionId: string, tgridSettings?: ITacticalGridSettings) => void;
    refreshRate: number | undefined;
    setRefreshRate: (value: number | undefined) => void;
    highlightTimeout: number | undefined;
    setHighlightTimeout: (value: number | undefined) => void;
    currentMissionId: string | undefined;
    setCurrentMissionId: (value: string | undefined) => void;
    gridColumnsWidthIsValid: undefined | boolean;
    setGridColumnsWidthIsValid: (_value: boolean | undefined) => void;
}

export const TacticalGridContext = React.createContext<ContextProps>({
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
    getUserGridState: (_value: PortalUser, _value1: string) => {
        return;
    },
    saveUserGridState: (_value: PortalUser, _value1: string, _value2?: ITacticalGridSettings) => {
        return;
    },
    refreshRate: undefined,
    setRefreshRate: (_value: number | undefined) => {
        return;
    },
    highlightTimeout: undefined,
    setHighlightTimeout: (_value: number | undefined) => {
        return;
    },
    currentMissionId: undefined,
    setCurrentMissionId: (_value: string | undefined) => {
        return;
    },
    gridColumnsWidthIsValid: undefined,
    setGridColumnsWidthIsValid: (_value: boolean | undefined) => {
        return;
    },
});

export function useTacticalGridContext(): ContextProps {
    return useContext(TacticalGridContext);
}

export function TacticalGridProvider({ children }: TacticalGridProviderProps): JSX.Element {
    const appConfig = ConfigHelper.getAppConfig();
    const [aliasNameToFieldNameMap, setAliasNameToFieldNameMap] = useState<Map<string, string> | undefined>();
    const [columnState, setColumnState] = useState<ColumnState[] | undefined>();
    const [filterState, setFilterState] = useState<any | undefined>();
    const [selectedRows, setSelectedRows] = useState<any[] | undefined>();
    const [colDefs, setColDefs] = useState<ColDef[] | undefined>();
    const [gridApi, setGridApi] = useState<GridApi>();
    const [gridColumnApi, setGridColumnApi] = useState<ColumnApi>();
    const [refreshRate, setRefreshRate] = useState<number | undefined>(appConfig.tacticalGrid.refreshIntervalInSeconds);
    const [currentMissionId, setCurrentMissionId] = useState<string | undefined>();
    const [highlightTimeout, setHighlightTimeout] = useState<number | undefined>(
        appConfig.tacticalGrid.recentHighlightTimeoutInMinutes
    );

    const columnStateRef = useRef<ColumnState[]>();
    const filterStateRef = useRef<ColDef[]>();

    //refresh rate and highlight timeout are placeholders, currently set to defaults from config
    const refreshRateRef = useRef<number>();
    const highlightTimeoutRef = useRef<number>();
    const [gridColumnsWidthIsValid, setGridColumnsWidthIsValid] = useState<boolean | undefined>();

    //maintains scope when saving new values
    useEffect(() => {
        if (columnState) {
            columnStateRef.current = columnState;
        }
        if (filterState) {
            filterStateRef.current = filterState;
        }
        if (refreshRate) {
            refreshRateRef.current = refreshRate;
        }
        if (highlightTimeout) {
            highlightTimeoutRef.current = highlightTimeout;
        }
    }, [columnState, filterState, refreshRate, highlightTimeout, currentMissionId]);

    /**
     * When the grid is rendered in a tab that is not active then column widths are set to 'minWidth'
     * value. If the grid or window is closed these values can get written to state and stick to the
     * grid in future renderings. Checks have been put in place to keep this from happening, this
     * is a backstop method if those checks failed.
     * This method checks for those bad column state widths and keeps the grid from applying them.
     * @param columnStateObj grid columns state
     * @returns
     */
    function validateGridColumnState(columnStateObj: any[]): boolean {
        let count = 0;
        columnStateObj.forEach((stateObj) => {
            //arbitrary - minWidth is currently set to 30, see getColumnDefinitions in FeatureLayerGrid.tsx
            let width = Number(stateObj.width);
            width < 40 && count++; //count the number of grid columns less than 40 px
        });
        if (columnStateObj && columnStateObj.length > 0) {
            let percentBad = count / columnStateObj.length;
            //how many bad columns do we need - defaulting to 80%
            return percentBad > 0.8 === false; //must be less than 80% to be considered valid
        }
        return false;
    }

    /**
     * Get the grid state that is saved in the portal application object
     * @param user current user
     * @param missionId current mission id
     */
    const getUserGridState = async (user: PortalUser, missionId: string) => {
        if (gridApi && gridColumnApi) {
            //get current user settings from portal
            const returnValue = await ApplicationStateHelper.getUserSavedState(user);
            if (returnValue && returnValue.tacticalGridState && Array.isArray(returnValue.tacticalGridState)) {
                const gridState = returnValue.tacticalGridState.find((state) => state.missionId === missionId);
                if (gridState?.properties.columnState) {
                    const columnStateObject = JSON.parse(gridState?.properties.columnState) as ColumnState[];
                    let columnWidthsAreValid = validateGridColumnState(columnStateObject);
                    if (columnWidthsAreValid) {
                        columnStateObject && setColumnState(columnStateObject);
                        gridColumnApi?.applyColumnState({ state: columnStateObject, applyOrder: true });
                    } else {
                        //clear the bad state so we don't save it when the grid closes, if the
                        //column state is not defined the grid will generate new column widths the next time it
                        //renders - based on the width of the column header text
                        setColumnState(undefined);
                    }
                    //set flag that will alert user that default widths are being used if necessary,
                    setGridColumnsWidthIsValid(columnWidthsAreValid);
                }
                if (gridState?.properties.filterState) {
                    const filterStateObject = JSON.parse(gridState?.properties.filterState);
                    filterStateObject && setFilterState(filterStateObject);
                    gridApi?.setFilterModel(filterStateObject);
                }

                //refresh rate and highlight timeout are placeholders, currently set to defaults from config
                // if (gridState.refreshRate) {
                //     const refreshStateObject = JSON.parse(gridState.refreshRate);
                //     refreshStateObject && setRefreshRate(refreshStateObject.value);
                // }
                // if (gridState.highlightTimeout) {
                //     const timeoutStateObject = JSON.parse(gridState.highlightTimeout);
                //     timeoutStateObject && setHighlightTimeout(timeoutStateObject.value);
                // }
            }
        }
    };

    /**
     * Save user specific setting for the tactical grid - settings apply on a per mission basis
     * @param user current portal user
     * @param missionId current mission id (group id)
     * @param tgridSettings settings for the tactical grid
     * @returns void
     */
    const saveUserGridState = async (
        user: PortalUser,
        missionId: string,
        tgridSettings: ITacticalGridSettings | undefined
    ) => {
        const newGridState = {
            missionId: missionId,
            properties: {
                columnState: columnStateRef.current ? JSON.stringify(columnStateRef.current) : undefined,
                filterState: filterStateRef.current ? JSON.stringify(filterStateRef.current) : undefined,
                refreshRate: refreshRateRef.current ? JSON.stringify({ value: refreshRateRef.current }) : undefined,
                highlightTimeout: highlightTimeoutRef?.current
                    ? JSON.stringify({ value: highlightTimeoutRef.current })
                    : undefined,
                tacticalGridSettings: tgridSettings,
            },
        } as TacticalGridState;

        const userState = await ApplicationStateHelper.getUserSavedState(user);
        if (!userState) {
            //no user state so create new user state and add tactical grid settings to it
            const userSettingsObject: IUserSaveState = {
                defaultWebSceneId: '',
                defaultWebMapId: '',
                workspaces: [],
                lastSavedMission: '',
                currentWorkspace: '',
                lastSavedPortalItemId: '',
                viewType: '',
                tacticalGridState: [newGridState],
            };
            return await ApplicationStateHelper.createSavedUserFeature(userSettingsObject);
        }

        //add tacticalGridState  array if not found
        if (!Array.isArray(userState.tacticalGridState)) {
            userState.tacticalGridState = [];
        }

        const gridStateIdx = userState.tacticalGridState?.findIndex((state) => state.missionId === missionId);
        if (gridStateIdx > -1) {
            //update existing grid setting in current user state
            userState.tacticalGridState[gridStateIdx] = newGridState;
        } else {
            //add new tactical grid settings to existing user state
            userState.tacticalGridState?.push(newGridState);
        }
        return await ApplicationStateHelper.updateSavedUserFeature(user.username, userState);
    };

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
        getUserGridState,
        saveUserGridState,
        refreshRate,
        setRefreshRate,
        highlightTimeout,
        setHighlightTimeout,
        currentMissionId,
        setCurrentMissionId,
        gridColumnsWidthIsValid,
        aliasNameToFieldNameMap,
        setAliasNameToFieldNameMap,
    };

    return <TacticalGridContext.Provider value={value}>{children} </TacticalGridContext.Provider>;
}
