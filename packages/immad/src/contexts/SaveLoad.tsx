import React, { useContext, useState } from 'react';
import { MenuItem } from '@mui/material';
import { DEFAULT_MISSION, DEFAULT_VIEW } from '../data/savedState';
import { ConfigHelper } from '../helpers/configHelper';

export interface SaveLoadProviderProps {
    children: JSX.Element[] | JSX.Element;
}

interface ContextProps {
    viewSelect: string;
    missionSelect: string;
    disabledViewSelect: boolean;
    setDisabledViewSelect: React.Dispatch<React.SetStateAction<boolean>>;
    missionValues: JSX.Element[];
    setMissionValues: React.Dispatch<React.SetStateAction<JSX.Element[]>>;
    workspaceValues: JSX.Element[];
    setWorkspaceValues: React.Dispatch<React.SetStateAction<JSX.Element[]>>;
    disabledMissionSelect: boolean;
    setDisabledMissionSelect: React.Dispatch<React.SetStateAction<boolean>>;
    setViewSelect: (value: string) => void;
    setMissionSelect: (value: string) => void;
    isViewLoaded: boolean;
    setIsViewLoaded: React.Dispatch<React.SetStateAction<boolean>>;
    portalIdToLoad: string;
    setPortalIdToLoad: (value: string) => void;
    isStateSaved: boolean;
    setIsStateSaved: React.Dispatch<React.SetStateAction<boolean>>;
    isGroupMgrOrOwner: boolean;
    setIsGroupMgrOrOwner: React.Dispatch<React.SetStateAction<boolean>>;
    saveButtonSelectIndex: number;
    setSaveButtonSelectIndex: (value: number) => void;
}

export const SaveLoadContext = React.createContext<ContextProps>({
    viewSelect: '',
    missionSelect: '',
    disabledViewSelect: false,
    setDisabledViewSelect: (_value: boolean) => {
        return;
    },
    disabledMissionSelect: false,
    setDisabledMissionSelect: (_value: boolean) => {
        return;
    },
    missionValues: [],
    setMissionValues: (_value: JSX.Element[]) => {
        return;
    },
    workspaceValues: [],
    setWorkspaceValues: (_value: JSX.Element[]) => {
        return;
    },
    setViewSelect: (_value: string) => {
        return;
    },
    setMissionSelect: (_value: string) => {
        return;
    },
    isViewLoaded: false,
    setIsViewLoaded: (_value: boolean) => {
        return;
    },
    isStateSaved: true,
    setIsStateSaved: (_value: boolean) => {
        return;
    },
    portalIdToLoad: '',
    setPortalIdToLoad: (_value: string) => {
        return;
    },
    isGroupMgrOrOwner: true,
    setIsGroupMgrOrOwner: (_value: boolean) => {
        return;
    },
    saveButtonSelectIndex: 0,
    setSaveButtonSelectIndex: (_value: number) => {
        return;
    },
});

export function useSaveLoadContext(): ContextProps {
    return useContext(SaveLoadContext);
}

// rename SaveLoad
export function SaveLoadProvider({ children }: SaveLoadProviderProps): JSX.Element {
    const appConfig = ConfigHelper.getAppConfig();
    const [viewSelect, setViewSelect] = useState<string>(DEFAULT_VIEW);
    const [missionSelect, setMissionSelect] = useState<string>(DEFAULT_MISSION);
    const [disabledViewSelect, setDisabledViewSelect] = useState(false);
    const [disabledMissionSelect, setDisabledMissionSelect] = useState(false);
    const [isViewLoaded, setIsViewLoaded] = useState(false);
    const [isStateSaved, setIsStateSaved] = useState(true);
    const [portalIdToLoad, setPortalIdToLoad] = useState('');
    const [isGroupMgrOrOwner, setIsGroupMgrOrOwner] = useState<boolean>(false);
    const [saveButtonSelectIndex, setSaveButtonSelectIndex] = useState(0);

    const [missionValues, setMissionValues] = useState<JSX.Element[]>([
        <MenuItem key={appConfig.defaultWebSceneId} value={DEFAULT_MISSION}>
            IMMAD Default
        </MenuItem>,
    ]);
    const [workspaceValues, setWorkspaceValues] = useState<JSX.Element[]>([
        <MenuItem key={DEFAULT_VIEW} value={DEFAULT_VIEW}>
            Default
        </MenuItem>,
    ]);

    const value = {
        viewSelect,
        missionSelect,
        missionValues,
        setMissionValues,
        workspaceValues,
        setWorkspaceValues,
        setViewSelect,
        setMissionSelect,
        disabledViewSelect,
        setDisabledViewSelect,
        disabledMissionSelect,
        setDisabledMissionSelect,
        isViewLoaded,
        setIsViewLoaded,
        isStateSaved,
        setIsStateSaved,
        portalIdToLoad,
        setPortalIdToLoad,
        isGroupMgrOrOwner,
        setIsGroupMgrOrOwner,
        saveButtonSelectIndex,
        setSaveButtonSelectIndex,
    };

    return <SaveLoadContext.Provider value={value}>{children} </SaveLoadContext.Provider>;
}
