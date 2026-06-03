import React, { ChangeEvent, useContext, useEffect, useState } from 'react';

import { FieldGroup, InputField, InputLabel, WidgetContainer, WidgetContent, WidgetHeader } from '../common';

import { MenuItem, Typography } from '@mui/material';

import GateLandingPageDataEditor from './GateLandingPageDataEditor';
import GateAnalystCommentEditor from './GateAnalystCommentEditor';
import GateJ2AssessmentEditor from './GateJ2AssessmentEditor';
import GateRegionSummaryEditor from './GateRegionSummaryEditor';
import GateRegionVisibilityEditor from './GateRegionVisibilityEditor';
import GateWatchConEditor from './GateWatchConEditor';
import { useSaveLoadContext } from '../../contexts/SaveLoad';
import { getPortalItemData } from '../../helpers/portalItemsHelper';
import { ApplicationItem, getAllGATEApps, queryRegionForGlobalId } from './GateDataEditorHelper';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { ConfigHelper } from '../../helpers/configHelper';
import {
    AnalystCommentsQueryResult,
    categoryQueryResult,
    queryGateCategoriesFClassLib,
    QueryJ2AssessmentLib,
    QueryRegionSummaryLib,
    QueryTrendsLib,
    textDateVal,
} from '@stratcom/lib-functions';
import GateTabsEditor from './GateTabsEditor';
import { currentPortalUser, getPortalUserGroupsByUsername, getPortalGroupUsers } from '../../helpers/portalUsersHelper';
import { getMissionIdByTitle } from '../../helpers/missionHelper';
import { setApplicationItems, setMissionIsExercise } from './GateDataEditorSlice';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { AppContext } from '../../contexts/App';

/**Main UI for editing GATE data */
function GateDataEditor(): JSX.Element {
    const [selectedEditAction, setSelectedEditAction] = useState<string>('');
    const [landingPageQueryResults, setLandingPageQueryResults] = useState<categoryQueryResult[]>([]);
    const [selectedLandingPageQueryResult, setSelectedLandingPageQueryResult] = useState<
        categoryQueryResult | undefined
    >();
    const [category, setCategory] = useState<string>('');
    const [regionSummaryQueryResult, setRegionSummaryQueryResult] = useState<textDateVal | undefined>();
    const [j2SummaryQueryResult, setJ2SummaryQueryResult] = useState<textDateVal | undefined>();
    const [analystCommentQueryResult, setAnalystCommentQueryResult] = useState<
        AnalystCommentsQueryResult | undefined
    >();
    const [categoryIsDirty, setCategoryIsDirty] = useState<boolean>(true);
    const [regionSummaryIsDirty, setRegionSummaryIsDirty] = useState<boolean>(true);
    const [j2SummaryIsDirty, setJ2SummaryIsDirty] = useState<boolean>(true);
    const [positionOnPageIsDirty, setPositionOnPageIsDirty] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const appConfig = ConfigHelper.getAppConfig();
    const { missionSelect } = useSaveLoadContext();
    const [selectedMissionTitle, setSelectedMissionTitle] = useState<string>('');
    const [selectedAppId, setSelectedAppId] = useState<string>('');
    const [accessMessage, setAccessMessage] = useState<string>('');
    const [positionOnLandingPage, setPositionOnLandingPage] = useState<number>(99); //reverse sorted
    const [globalId, setGlobalId] = useState<string | undefined>('');
    const [cardIsVisibleOnLandingPage, setCardIsVisibleOnLandingPage] = useState<number>(-1);
    const [groupsCurrentUserIsMemberOf, setGroupsCurrentUserIsMemberOf] = useState<string[]>([]);
    const [groupTitleToIdMap] = useState<Map<string, string>>(new Map<string, string>());
    const { userRoles } = useContext(AppContext);
    const isAdminUser = userRoles.Administrator === true || userRoles.MissionManager === true;
    const [editActions, setEditActions] = useState<string[]>(['']);
    const [editingDisabled, setEditingDisabled] = useState<boolean>(false);
    const applicationItems = useAppSelector((state) => state.gateCalendarEditorSlice.applicationItems);
    const missionIsExercise = useAppSelector((state) => state.gateCalendarEditorSlice.missionIsExercise);
    const dispatch = useAppDispatch();

    const analystComments = appConfig.gate.analystComments;
    const landingPageData = appConfig.gate.landingPageData;
    const regionSummary = appConfig.gate.regionSummary;
    const j2Assessment = appConfig.gate.j2Assessment;
    const watchCon = appConfig.gate.watchConLabel;

    /** Any user can update any GATE group's item data except for visibility and tabs.
     * To update those two items the user must belong to the group.
     */
    useEffect(() => {
        getAllGATEApps(
            appConfig.portalUrl,
            appConfig.typekeywords.gateExercise,
            appConfig.typekeywords.gateMission,
            appConfig.oauthAppId
        ).then((appItems) => {
            //load GATE mission names into picklist alphabetically - ascending
            const sortedAppItems = appItems.sort((appItemsA: ApplicationItem, appItemsB: ApplicationItem) =>
                appItemsA.title.localeCompare(appItemsB.title)
            );
            //filter out any duplicates by ID
            const filteredApplicationItems = filterOutApplicationItemDuplicates(sortedAppItems);
            appItems && dispatch(setApplicationItems(filteredApplicationItems));
            const groupTitles: string[] = [];
            currentPortalUser().then((user: any) => {
                getPortalUserGroupsByUsername(user.username).then((groups: any[]) => {
                    groups.forEach((group: any) => {
                        groupTitles.push(group.title);
                        groupTitleToIdMap.set(group.title, group.id);
                    });
                    setGroupsCurrentUserIsMemberOf([...groupTitles]);
                });
            });
            setSelectedMissionTitle(missionSelect);
        });
    }, []);

    useEffect(() => {
        if (applicationItems && selectedMissionTitle !== '') {
            const currentlySelectedApp: any = applicationItems.find((item) => item.title === selectedMissionTitle);
            currentlySelectedApp && setSelectedAppId(currentlySelectedApp.id);
            if (!currentlySelectedApp) {
                setEditingDisabled(true);
                setErrorMessage('Current mission was not found in the GATE mission list.');
                return;
            }
        }
    }, [applicationItems, selectedMissionTitle]);

    useEffect(() => {
        if (selectedEditAction !== '' && selectedMissionTitle !== '') {
            if (selectedEditAction === landingPageData || selectedEditAction === analystComments) {
                setSelectedLandingPageQueryResult(undefined);
                fetchLandingPageData(globalId, selectedMissionTitle);
            }
            if (selectedEditAction === analystComments) {
                fetchAnalystComments(globalId, selectedMissionTitle);
            } else if (selectedEditAction === regionSummary) {
                fetchRegionSummary(globalId, selectedMissionTitle);
            } else if (selectedEditAction === j2Assessment) {
                fetchJ2Summary(globalId, selectedMissionTitle);
            } else if (selectedEditAction === 'Region Visibility') {
                queryGlobalId(selectedMissionTitle);
            } else if (selectedEditAction === watchCon) {
                setSelectedLandingPageQueryResult(undefined);
            }
        }
    }, [selectedEditAction]);

    useEffect(() => {
        if (landingPageQueryResults && landingPageQueryResults.length > 0) {
            if (!selectedLandingPageQueryResult) {
                setSelectedLandingPageQueryResult(landingPageQueryResults[0]);
            }
        }
    }, [landingPageQueryResults]);

    useEffect(() => {
        if (category !== '') {
            if (selectedEditAction === analystComments || selectedEditAction === regionSummary) {
                fetchAnalystComments(globalId);
            }
        }
    }, [category]);

    useEffect(() => {
        if (selectedLandingPageQueryResult) {
            setCategory(selectedLandingPageQueryResult.category);
        }
    }, [selectedLandingPageQueryResult]);

    useEffect(() => {
        if (selectedMissionTitle !== '' && selectedAppId) {
            queryGlobalId(selectedMissionTitle).then((r) => {
                if (r) {
                    setGlobalId(r);
                    setErrorMessage('');
                    setEditingDisabled(false);
                } else {
                    setEditingDisabled(true);
                    setErrorMessage("Editing is disabled.Request an Admin 'reset' the mission data.");
                    setAccessMessage(
                        "To enable editing on this mission ask an Admin to do a 'reset' on the mission data."
                    );
                }
            });
            calcEditPrivileges(selectedMissionTitle, groupsCurrentUserIsMemberOf, groupTitleToIdMap).then(
                (editActions) => {
                    setEditActions(editActions);
                }
            );
        } else {
            setEditActions(['']);
        }
        setSelectedEditAction('');
    }, [selectedMissionTitle, groupsCurrentUserIsMemberOf, selectedAppId]);

    useEffect(() => {
        if (positionOnPageIsDirty && selectedMissionTitle !== '') {
            const currentlySelectedMission: any = applicationItems.find((item) => item.title === selectedMissionTitle);
            queryMetadata(currentlySelectedMission.id).then((metadata: any) => {
                if (metadata?.appData.positionOnLandingPage) {
                    setPositionOnLandingPage(metadata.appData.positionOnLandingPage);
                } else {
                    setPositionOnLandingPage(99);
                }
            });
        }
    }, [positionOnPageIsDirty]);

    /**
     * Filter out duplicate application items from array.
     * @param array of Application Items
     */
    function filterOutApplicationItemDuplicates(array: ApplicationItem[]): ApplicationItem[] {
        const uniqueMap = new Map();
        array.forEach((item: ApplicationItem) => {
            uniqueMap.set(item.id, item);
        });
        return Array.from(uniqueMap.values());
    }

    /**
     * Determine which edit actions a user can access
     * @param missionTitle title of the selected group
     * @param groupNamesUserIsMemberOf array of group titles that the user is a member of
     * @param mappedGroupIds JS Map -> key: group.title, value: group.id
     * @returns an array of edit privileges (items the user can edit)
     */
    async function calcEditPrivileges(
        missionTitle: string,
        groupNamesUserIsMemberOf: string[],
        mappedGroupIds: Map<string, string>
    ): Promise<string[]> {
        const isMemberOfSelectedGroup = groupNamesUserIsMemberOf.find((name) => name === missionTitle);
        const currentUser = await currentPortalUser();
        let editActions: string[];

        const groupId = mappedGroupIds.get(missionTitle);
        if (!groupId) {
            console.warn(
                `Failed to determine if current user belongs to group: ${missionTitle}. Setting edit privileges to minimum.`
            );
        }
        const groupUsers = await getPortalGroupUsers(groupId ? groupId : '');
        const isAdminInSelectedMission = groupUsers.admins.find((name) => name === currentUser.username);

        if (isMemberOfSelectedGroup && isAdminInSelectedMission) {
            editActions = [
                landingPageData,
                analystComments,
                regionSummary,
                j2Assessment,
                'Region Visibility',
                'GATE Tabs',
                watchCon,
            ];
        } else {
            editActions = [
                //only members with mission access can edit visibility and tabs
                landingPageData,
                analystComments,
                regionSummary,
                j2Assessment,
            ];
        }
        updateUserMessages(isMemberOfSelectedGroup ? true : false);
        return editActions;
    }

    /**
     * Show message to user if they may face limited editing privileges
     * @param isGroupMember true if user is a member of the selected group otherwise false
     */
    function updateUserMessages(isGroupMember: boolean) {
        if (!isGroupMember) {
            !isAdminUser && setAccessMessage('You do not appear on the member list for this group.');
            //let IMMAD admins/mmgrs know why they can't edit everything
            isAdminUser && setAccessMessage('Limited editing privileges for non-group members.');
            const appItem = applicationItems.find((appObj: ApplicationItem) => appObj.title === selectedMissionTitle);
            if (appItem && appItem.access !== 'org') {
                setAccessMessage('Limited editing privileges. Application item is not shared with the org.');
            }
        } else {
            setAccessMessage('');
        }
    }

    /**
     * Handle change event on the mission select
     * @param event change event
     */
    function handleSelectedMissionTitleChanged(event: ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        setLandingPageQueryResults([]);
        setCategoryIsDirty(true); //clear any cached category data since the mission has changed
        setSelectedMissionTitle(value as string);
    }

    /**
     * Handle change event on the action select
     * @param event change event
     */
    function handleSelectedEditActionChanged(event: ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        setSelectedEditAction(value);
    }

    /**
     * Handle change event on the category select
     * @param event change event
     */
    async function handleSelectedCategoryChanged(event: ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        if (categoryIsDirty) {
            await fetchLandingPageData(globalId, selectedMissionTitle);
        }
        const cat = landingPageQueryResults.find((cat) => cat.category === value);
        cat && setSelectedLandingPageQueryResult(cat);
    }

    /**
     * Get the most recent comments for this regions landing page
     * @param globalId unique identifier for a data row in GATE
     * @param selectedMissionTitle The GATE mission title
     */
    async function fetchLandingPageData(globalId: string | undefined, selectedMissionTitle: string) {
        if (!globalId || globalId === '') {
            setLandingPageQueryResults([]);
            return;
        }
        const fLayerCategories = new FeatureLayer({
            portalItem: {
                id: missionIsExercise
                    ? appConfig.gate.exercise.exLandingPageFClassGuid
                    : appConfig.gate.landingPageFClassGuid,
            },
        });
        const keywords = missionIsExercise ? appConfig.typekeywords.gateExercise : appConfig.typekeywords.gateMission;
        const results = await queryGateCategoriesFClassLib(
            fLayerCategories,
            globalId,
            appConfig.portalUrl,
            keywords,
            selectedMissionTitle
        );
        setLandingPageQueryResults(results);
        setCategoryIsDirty(false);
    }

    /**
     * Get the most recent landing page data comments for this region
     * @param globalId unique identifier for a data row in GATE
     */
    async function fetchRegionSummary(globalId: string | undefined) {
        //aka HighInterestItems
        if (!globalId || globalId === '') {
            setRegionSummaryQueryResult({ textVal: '', dateVal: undefined });
            return;
        }
        if (regionSummaryIsDirty) {
            if (globalId) {
                const fLayerAnalystComments = new FeatureLayer({
                    portalItem: {
                        id: missionIsExercise
                            ? appConfig.gate.exercise.exAnalystCommentsFClassGuid
                            : appConfig.gate.analystCommentsFClassGuid,
                    },
                });
                await fLayerAnalystComments.load().then(async () => {
                    const results = await QueryRegionSummaryLib(fLayerAnalystComments, globalId ? globalId : '');
                    results && setRegionSummaryQueryResult(results);
                    results && setRegionSummaryIsDirty(false);
                });
            }
        }
    }

    /**
     * Get the most recent J2Summary comments for the region
     * @param globalId unique identifier for a data row in GATE
     */
    async function fetchJ2Summary(globalId: string | undefined) {
        //aka J2Assessment
        if (!globalId || globalId === '') {
            setJ2SummaryQueryResult({
                textVal: '',
                dateVal: undefined,
            });
            return;
        }
        if (j2SummaryIsDirty) {
            if (globalId) {
                const j2SummaryFLayer = new FeatureLayer({
                    portalItem: {
                        id: missionIsExercise
                            ? appConfig.gate.exercise.exJ2SummaryFClassGuid
                            : appConfig.gate.j2SummaryFClassGuid,
                    },
                });
                await j2SummaryFLayer.load().then(async () => {
                    const results = await QueryJ2AssessmentLib(j2SummaryFLayer, globalId ? globalId : '');
                    results && setJ2SummaryQueryResult(results);
                    results && setJ2SummaryIsDirty(false);
                });
            }
        }
    }

    /**
     * Get the most recent comments for this category
     * @param globalId unique identifier for a data row in GATE
     */
    async function fetchAnalystComments(globalId: string | undefined) {
        const defaultObj = {
            comment: '',
            date: new Date(Date.now()),
            category: '',
            human_readable_class: '',
        };

        if (!globalId || globalId === '') {
            //globalId = await queryGlobalId(selectedMissionTitle);
            setAnalystCommentQueryResult(defaultObj);
            return;
        }
        if (globalId) {
            const analystCommentsFtrLayer = new FeatureLayer({
                portalItem: {
                    id: missionIsExercise
                        ? appConfig.gate.exercise.exAnalystCommentsFClassGuid
                        : appConfig.gate.analystCommentsFClassGuid,
                },
            });
            const where = `region_guid = '${globalId.trim()}' AND topic = '${
                selectedLandingPageQueryResult?.category
            }' AND last_edited_date IS NOT NULL`;
            const results = await QueryTrendsLib(analystCommentsFtrLayer, where);

            if (results) {
                setAnalystCommentQueryResult(results);
            } else {
                setAnalystCommentQueryResult(defaultObj);
            }
        }
    }

    /**
     * Get the unique identifier for a data row in GATE
     * @param selectedMissionTitle mission title currently selected
     */
    async function queryGlobalId(selectedMissionTitle: string): Promise<string | undefined> {
        setErrorMessage('');
        //get the mission id from the application obj directly since non-group members are
        //not able to see the group
        //this call is for backwards compatability - will work for analysts belonging to the mission only
        let missionId = await getMissionIdByTitle(selectedMissionTitle);
        const selectedMissionAppObj: any = applicationItems.find((item) => item.title === selectedMissionTitle);
        const applicationObjId = selectedMissionAppObj?.id;
        let metadata: any = undefined;
        let globalId = undefined;
        if (applicationObjId) {
            metadata = await getPortalItemData(applicationObjId);
            metadata && dispatch(setMissionIsExercise(metadata.isExercise)); //metadata.appData.positionOnLandingPage
            if (metadata?.appData.positionOnLandingPage) {
                setPositionOnLandingPage(metadata.appData.positionOnLandingPage);
            } else {
                setPositionOnLandingPage(99);
            }
            const regionFLayer = new FeatureLayer({
                portalItem: {
                    id: metadata.isExercise
                        ? appConfig.gate.exercise.exRegionsFClassGuid
                        : appConfig.gate.regionsFClassGuid,
                },
            });

            //if analyst could not access the group object then get the id off of the application object
            //only works for newer missions, older missions did not get this value attached
            if (!missionId) {
                missionId = metadata.groupId;
            }
            if (missionId && missionId !== '') {
                const result = await queryRegionForGlobalId(regionFLayer, missionId);
                globalId = result.globalId;
                setCardIsVisibleOnLandingPage(result.isVisible);
            }
        } else {
            const message = 'Failed to find a mission id for mission: ' + selectedMissionTitle;
            setErrorMessage(message);
            console.error(message);
        }
        return globalId;
    }

    /**
     * Get the app data object defined for the mission
     * @param missionAppId portal item application object id for the mission/group
     * @returns app data defined on the group/mission application object
     */
    async function queryMetadata(missionAppId: string | undefined = undefined): Promise<any | undefined> {
        if (missionAppId) {
            getPortalItemData(missionAppId).then((result) => {
                return result;
            });
        } else {
            return undefined;
        }
    }

    /** UI */
    return (
        <WidgetContainer>
            <WidgetHeader position={'static'}>
                <InputLabel>Edit Mission Data</InputLabel>
            </WidgetHeader>
            <WidgetContent>
                <FieldGroup>
                    {applicationItems.length > 0 ? <Typography variant='caption'>Select A Mission</Typography> : ''}
                    <InputField
                        fullWidth
                        variant='outlined'
                        color='secondary'
                        select
                        required
                        value={selectedMissionTitle}
                        onChange={handleSelectedMissionTitleChanged}
                        helperText={accessMessage !== '' ? accessMessage : ''}
                    >
                        {applicationItems.map((appItem: ApplicationItem) => (
                            <MenuItem key={appItem.title} value={appItem.title}>
                                {appItem.title}
                            </MenuItem>
                        ))}
                    </InputField>
                </FieldGroup>
                <FieldGroup>
                    {!selectedEditAction ? <Typography variant='caption'>Select An Item to Edit</Typography> : ''}
                    <InputField
                        fullWidth
                        variant='outlined'
                        color='secondary'
                        select
                        error={errorMessage !== ''}
                        disabled={editingDisabled}
                        required
                        value={selectedEditAction}
                        onChange={handleSelectedEditActionChanged}
                        helperText={errorMessage !== '' ? errorMessage : ''}
                    >
                        {editActions.map((editAction) => (
                            <MenuItem key={editAction} value={editAction}>
                                {editAction === 'Region Visibility'
                                    ? selectedMissionTitle + ' - ' + editAction
                                    : editAction}
                            </MenuItem>
                        ))}
                    </InputField>
                </FieldGroup>

                {selectedEditAction &&
                    selectedEditAction !== j2Assessment &&
                    selectedEditAction !== regionSummary &&
                    selectedEditAction !== 'Region Visibility' &&
                    selectedEditAction !== 'GATE Tabs' &&
                    selectedEditAction !== watchCon && (
                        <FieldGroup>
                            <InputLabel>Category</InputLabel>
                            <InputField
                                fullWidth
                                variant='outlined'
                                color='secondary'
                                select
                                required
                                value={category}
                                onChange={handleSelectedCategoryChanged}
                            >
                                {landingPageQueryResults.map((queryResult) => (
                                    <MenuItem key={queryResult.category.trim()} value={queryResult.category.trim()}>
                                        {queryResult.category.trim()}
                                    </MenuItem>
                                ))}
                            </InputField>
                        </FieldGroup>
                    )}
                {selectedEditAction === landingPageData && selectedLandingPageQueryResult && globalId && (
                    <GateLandingPageDataEditor
                        regionGuid={globalId}
                        selectedCategory={selectedLandingPageQueryResult}
                        categoryName={category}
                        setIsDirty={setCategoryIsDirty}
                        missionIsExercise={missionIsExercise}
                    />
                )}
                {selectedEditAction === analystComments && analystCommentQueryResult && globalId && (
                    <GateAnalystCommentEditor
                        analystCommentQueryResult={analystCommentQueryResult}
                        regionName={selectedMissionTitle}
                        regionGuid={globalId}
                        category={category}
                        missionIsExercise={missionIsExercise}
                    />
                )}
                {selectedEditAction === regionSummary && globalId && (
                    <GateRegionSummaryEditor
                        summaryComments={regionSummaryQueryResult}
                        setIsDirty={setRegionSummaryIsDirty}
                        regionGuid={globalId}
                        missionIsExercise={missionIsExercise}
                    />
                )}
                {selectedEditAction === j2Assessment && globalId && (
                    <GateJ2AssessmentEditor
                        setIsDirty={setJ2SummaryIsDirty}
                        regionName={selectedMissionTitle}
                        j2AssessmentComments={j2SummaryQueryResult}
                        regionGuid={globalId}
                        missionIsExercise={missionIsExercise}
                    />
                )}
                {selectedEditAction === 'Region Visibility' && globalId && (
                    <GateRegionVisibilityEditor
                        setIsDirty={setJ2SummaryIsDirty}
                        positionOnPageIsDirty={setPositionOnPageIsDirty}
                        regionGuid={globalId}
                        regionName={selectedMissionTitle}
                        isVisible={cardIsVisibleOnLandingPage}
                        positionValue={positionOnLandingPage}
                        missionIsExercise={missionIsExercise}
                        currentlySelectedAppId={selectedAppId}
                    />
                )}
                {selectedEditAction === 'GATE Tabs' && (
                    <GateTabsEditor
                        regionGuid={globalId ? globalId : ''}
                        currentlySelectedMissionTitle={selectedMissionTitle}
                        currentlySelectedAppId={selectedAppId}
                    />
                )}
                {selectedEditAction === watchCon && globalId && (
                    <GateWatchConEditor missionTitle={selectedMissionTitle} currentlySelectedAppId={selectedAppId} />
                )}
            </WidgetContent>
        </WidgetContainer>
    );
}
export default GateDataEditor;
