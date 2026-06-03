import React, { useCallback, useEffect, useState } from 'react';
import { FieldGroup, InputField, InputLabel } from '../common';
import EsriConfig from '@arcgis/core/config';
import { Button, Checkbox, Stack, Tab, Tabs } from '@mui/material';
import { useSnackbar } from 'notistack';
import { getPortalItemData } from '../../helpers/portalItemsHelper';
import { updatePortalItem } from '../../helpers/portalItemsHelper';
import { findPortalGroupByTitle } from '../../helpers/portalGroupHelper';

/**input props */
interface GateTabsEditorProps {
    /**unique identifier to map this data to */
    regionGuid: string;
    /**currently selected mission */
    currentlySelectedMissionTitle: string;
    /**mission / group application objid for the selected mission */
    currentlySelectedAppId: string;
}

interface GateTabInfo {
    id: number;
    visible: boolean;
    url: string;
    title: string;
}

/**
 * Gate tab Props
 */
interface GateTabProps {
    index: number;
    tabInfo: GateTabInfo;
    updateTabs: (tabInfo: GateTabInfo, index: number) => void;
}

function GateTab(props: GateTabProps): JSX.Element {
    const { tabInfo, updateTabs, index } = props;

    const [title, setTitle] = useState<string>(tabInfo.title);
    const [url, setUrl] = useState<string>(tabInfo.url);
    const [visible, setVisible] = useState<boolean>(tabInfo.visible);

    const [urlError, setUrlError] = useState<string>('');

    useEffect(() => {
        try {
            new URL(url);
            setUrlError('');
        } catch (e) {
            setUrlError(e.message);
        }
    }, [url]);

    const handleTitleChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(event.target.value);
    };
    const handleUrlChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUrl(event.target.value);
    };
    const handleVisibleChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
        setVisible(event.target.checked);
    };

    return (
        <FieldGroup onBlur={() => updateTabs({ id: tabInfo.id, title: title, url: url, visible: visible }, index)}>
            <InputLabel>Title</InputLabel>
            <InputField
                fullWidth
                variant='outlined'
                value={title}
                error={!title || title.length === 0}
                onChange={handleTitleChanged}
            ></InputField>
            <InputLabel>URL</InputLabel>
            <InputField
                fullWidth
                variant='outlined'
                value={url}
                error={!!urlError}
                onChange={handleUrlChanged}
            ></InputField>
            <FieldGroup>
                <InputLabel>Visible</InputLabel>
                <Checkbox checked={visible} onChange={handleVisibleChanged} />
            </FieldGroup>
        </FieldGroup>
    );
}

/**UI for updating GATE summary data - a column on the landing page data row */
function GateTabsEditor(props: GateTabsEditorProps): JSX.Element {
    const { currentlySelectedMissionTitle, currentlySelectedAppId } = props;
    const [missionTabs, setMissionTabs] = useState<GateTabInfo[]>([]);

    const { enqueueSnackbar } = useSnackbar();

    const [tabValue, setTabValue] = useState<number>(0);

    const [missionAppObjId, setMissionId] = useState<string>();

    /**
     * Generates a unique ID from the tabInfos available.
     * @param tabInfos
     */
    const generateId = (tabInfos: GateTabInfo[]) => {
        let id = 1;
        for (const tabInfo of tabInfos) {
            id += tabInfo.id;
        }
        return id;
    };

    useEffect(() => {
        if (currentlySelectedAppId !== '') {
            setMissionId(currentlySelectedAppId);
        }
    }, [currentlySelectedAppId]);

    useEffect(() => {
        refreshTabData();
    }, [missionAppObjId]);

    function refreshTabData() {
        if (missionAppObjId) {
            getPortalItemData(missionAppObjId).then((data: any) => {
                if (data?.appData?.tabs) {
                    setMissionTabs(data?.appData?.tabs as GateTabInfo[]);
                }
            });
        }
    }

    const updateGateMissionTabs = async (appObjId: string, gateTabInfos: GateTabInfo[], missionTitle: string) => {
        const result: any = await getPortalItemData(appObjId);
        if (result) {
            delete result.tabs;
            result.appData.tabs = gateTabInfos;
            const groupSearchResult: any = await findPortalGroupByTitle(missionTitle);
            let owner: string = '';
            if (groupSearchResult.success) {
                owner = groupSearchResult.item[0].owner;
            }
            const data = {
                id: appObjId,
                text: JSON.stringify(result),
                owner: owner,
            };
            const obj = await updatePortalItem(data);
            return obj.success;
        }
        return false;
    };

    const handleCreateNewTab = useCallback(
        (event: React.SyntheticEvent) => {
            setMissionTabs((data) => {
                const id = generateId(data);
                return [
                    ...data,
                    {
                        id: id,
                        title: 'New Tab',
                        url: EsriConfig.portalUrl,
                        visible: true,
                    } as GateTabInfo,
                ];
            });
            setTabValue(missionTabs.length);
        },
        [missionTabs]
    );

    /**Handle the save button click */
    const saveButtonClickHandler = useCallback(() => {
        if (missionTabs && missionAppObjId) {
            updateGateMissionTabs(missionAppObjId, missionTabs, currentlySelectedMissionTitle)
                .then((result) => {
                    if (result) {
                        enqueueSnackbar('Mission Tabs were successfully saved.', { variant: 'success' });
                        refreshTabData();
                    } else {
                        enqueueSnackbar('Error saving Mission Tabs.', { variant: 'error' });
                    }
                })
                .catch((error) => {
                    enqueueSnackbar('Error saving Mission Tabs: ' + error.message, { variant: 'error' });
                });
        }
    }, [missionTabs, missionAppObjId]);

    const moveElement = (from: number, to: number, array: GateTabInfo[]) => {
        const x = from < 0 ? 0 : from > array.length - 1 ? array.length - 1 : from;
        const y = to < 0 ? 0 : to > array.length - 1 ? array.length - 1 : to;
        const newArray = [...array];
        let tmp = newArray[x];
        newArray[x] = newArray[y];
        newArray[y] = tmp;
        return [...newArray];
    };

    const handleChange = (event: React.SyntheticEvent, newValue: number) => setTabValue(newValue);

    const handleMoveTabLeft = (event: React.SyntheticEvent) => {
        if (missionTabs.length > 0) {
            const elements = moveElement(tabValue, tabValue - 1, missionTabs);
            setMissionTabs(elements);
            setTabValue(tabValue - 1 < 0 ? 0 : tabValue - 1);
        }
    };

    const handleMoveTabRight = (event: React.SyntheticEvent) => {
        if (missionTabs.length > 0) {
            const elements = moveElement(tabValue, tabValue + 1, missionTabs);
            setMissionTabs(elements);
            setTabValue(tabValue + 1 > elements.length - 1 ? elements.length - 1 : tabValue + 1);
        }
    };

    const handleRemoveTab = (event: React.SyntheticEvent) => {
        if (missionTabs.length > 0) {
            setMissionTabs((elements) => [...elements.slice(0, tabValue), ...elements.slice(tabValue + 1)]);
            setTabValue(tabValue - 1 < 0 ? 0 : tabValue - 1);
        }
    };

    const handleUpdateTabs = (tabInfo: GateTabInfo, index: number) => {
        missionTabs[index] = tabInfo;
        setMissionTabs([...missionTabs]);
    };
    /** UI */
    return (
        <>
            <Stack>
                {missionTabs && missionTabs.length > 0 && (
                    <>
                        <Tabs value={tabValue} onChange={handleChange}>
                            {missionTabs.map((tabInfo, index) => (
                                <Tab key={index + '_' + missionTabs.length} value={index} label={tabInfo.title} />
                            ))}
                        </Tabs>

                        {missionTabs.map((tabInfo, index) => (
                            <div key={index + '_' + missionTabs.length} hidden={tabValue !== index}>
                                <GateTab index={index} tabInfo={tabInfo} updateTabs={handleUpdateTabs} />
                            </div>
                        ))}
                    </>
                )}

                <InputLabel>Actions</InputLabel>
                <FieldGroup>
                    <Button variant={'outlined'} onClick={handleCreateNewTab}>
                        Add New
                    </Button>

                    {tabValue >= 0 && (
                        <>
                            <Button variant={'outlined'} onClick={handleRemoveTab}>
                                Remove
                            </Button>
                            <Button variant={'outlined'} onClick={handleMoveTabLeft}>
                                Move Left
                            </Button>
                            <Button variant={'outlined'} onClick={handleMoveTabRight}>
                                Move Right
                            </Button>
                        </>
                    )}

                    <Button variant={'contained'} color={'secondary'} onClick={saveButtonClickHandler}>
                        Save Tabs
                    </Button>
                </FieldGroup>
            </Stack>
        </>
    );
}
export default GateTabsEditor;
