import React, { ChangeEvent, useContext, useEffect, useRef, useState } from 'react';
import { StratLeadExpiration } from '../../../../tacticalGrid/interfaces/StratLead';
import {
    StyledBox50PWideGrid,
    StyledBoxCategoryContainer,
    StyledButtonsDiv,
    StyledExpirationSlider,
    StyledFlexDiv,
    StyledStratLeadExpirationContainer,
    StyledStratLeadExpirationSliderContainer,
    StyledTextCreateButton,
    StyledTextExerciseButton,
} from '../styles';
import { Actions, MissionAction, MissionState, TGridToSmartMapping } from '../../../../../contexts/missionStateReducer';
import { currentPortalUser } from '../../../../../helpers/portalUsersHelper';
import { hydrateMissionState, loadJsonFromFile } from '../helpers/missionCreationViewModel';
import { IItem } from '@esri/arcgis-rest-portal';
import { Box, Checkbox, Chip, FormControlLabel, Input, ListItemText, MenuItem, Typography } from '@mui/material';
import { getTacticalGridLayers } from '../../../../../hooks/missionHooks';
import { AppContext } from '../../../../../contexts/App';
import { ContentCategories, ContentCategory, getCategoryContent } from '../../../../../helpers/portalHelper';
import RecursiveTreeView, { RenderTree } from '../../../../recursiveTreeView/RecursiveTreeView';
import { FieldGroup, InputField, WidgetContainer, WidgetContent } from '../../../../common';
import {
    ActionButton,
    InlineSelectNoMargin,
    InputFieldInlineWMargin,
    InputFieldInlineWMargin350,
    InputLabelWMargin,
    ManagerMenuItem,
} from '../../../../common/styles';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import Field from '@arcgis/core/layers/support/Field';
import { ConfigHelper } from '../../../../../helpers/configHelper';
import { useSnackbar } from 'notistack';
import { getDashboardSmartFields } from '../../../../../helpers/smartHelper';
import ActivityCountsForm from './ActivityCountsForm';
import { gateColumnHeaderObject } from '@stratcom/lib-functions';
import { useAppDispatch, useAppSelector } from '../../../../../hooks/hooks';
import { RootState } from '../../../../../data/store';
import { hashCode } from '../../../../recursiveTreeView/RecursiveTreeModel';
import { StyledIconButtonWithBadge, StyledPencilBadge } from '../../../styles';
import EditAttributesIcon from 'calcite-ui-icons-react/EditAttributesIcon';

import { updateIsEditSession } from '../MissionCreationSlice';

import { MinusCircleFilled } from '../../../../../images/24px/MinusCircleFilled';
import { CheckCircleFilled } from '../../../../../images/24px/CheckCircleFilled';
import { checkIsUserInGroup } from '@stratcom/lib-functions';
import { UserSession } from '@esri/arcgis-rest-auth';

/**
 * Types of roles for ellipse fields.
 */
export type ellipseRoleType = 'azimuth' | 'semi-major' | 'semi-minor';

/**
 * Types for MUI Button variant.
 */
export type muiButtonVariant = 'contained' | 'outlined' | 'text' | undefined;

/**
 * Data structure for the columns in the grid that holds the mappings between the Tactical grid and SMART
 */
const fieldMappingGridColumns: GridColDef[] = [
    {
        field: 'tacticalGridFieldName',
        headerName: 'Tactical Grid Field Name',
        width: 300,
        editable: false,
    },
    {
        field: 'systemFieldName',
        headerName: 'SMART Data Field Name',
        width: 300,
        editable: false,
    },
    {
        field: 'mapped',
        headerName: 'Mapped',
        width: 300,
        editable: false,
    },
];

const MissionData = (props: {
    dispatch: React.Dispatch<MissionAction>;
    missionState: MissionState;
    missionToUpdate: IItem | undefined;
}): JSX.Element => {
    const { dispatch, missionState, missionToUpdate } = props;
    const useDispatch = useAppDispatch();
    const isEditSession = useAppSelector((state) => state.missionCreationSlice.isEditSession);
    const gateAdminGroupId = useAppSelector((state) => state.applicationSlice.gate.gateAdminGroupId);
    const portalUrl = useAppSelector((state) => state.applicationSlice.portalUrl);
    const userSession = UserSession;
    const [missionName, setMissionName] = useState('');
    const [description, setDescription] = useState('');
    const [categories, setCategories] = useState<RenderTree[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [updatedStateFromOtherMission, setUpdatedStateFromOtherMission] = useState(false);

    const [tacticalGridLayerFields, setTacticalGridLayerFields] = useState<Field[] | undefined>();
    const [tacticalGridSelectedField, setTacticalGridSelectedField] = useState<string>('');
    const [smartDataField, setSmartDataField] = useState<string>('');
    const [smartMapFields, setSmartMapFields] = useState<string[]>([]);
    const [mappedFieldsDataGridData, setMappedFieldsDataGridData] = useState<TGridToSmartMapping[]>([]);
    const [mappedFieldsDataGridSelection, setMappedFieldsDataGridSelection] = useState<string[]>([]);

    const [managerNames, setManagerNames] = useState<string[]>([]);
    const [mmgrsAndAdmins, setMmgrAndAdmins] = useState<string[]>([]);
    const [currentUserName, setCurrentUserName] = useState('');

    const missionDescr = useRef('');
    const container = useRef<HTMLDivElement>(null);
    const missionMgrs = useRef('');
    const missionCategories = useRef<RenderTree[]>([]);
    const missionSelectedCategory = useRef<string>('');
    const missionExpandedCategories = useRef<RenderTree[]>([]);
    const { portalUser } = useContext(AppContext);

    // categories
    const defaultCategory = { id: 'Categories', name: 'Categories' };
    const [contentCategories, setContentCategories] = useState<ContentCategories>();
    const [flattenedCategories, setFlattenedCategories] = useState<RenderTree[]>([]);
    const [categoryTree, setCategoryTree] = useState<RenderTree>(defaultCategory);

    const [nodeIds, setNodeIds] = useState<string[]>([]);
    const [selectedTacticalGridLayerName, setSelectedTacticalGridLayerName] = useState<string>('');
    const [tacticalGridLayerObj, setTacticalGridLayersObj] = useState<{ id: string; title: string }[]>();

    const appConfig = ConfigHelper.getAppConfig();

    // these are all associated to the custom stratlead expiration values
    const defaultStratLeadExpiration = { id: '', label: '', expirationTime: -1, color: '#a9a9a9' };
    const defaultStratLeadExpirations =
        missionState.stratLeadExpirations?.length > 0
            ? missionState.stratLeadExpirations
            : (appConfig.tacticalGrid.stratLeadExpiration as StratLeadExpiration[]);
    const [stratLeadExpirationLow, setStratLeadExpirationLow] = useState(defaultStratLeadExpiration.expirationTime);
    const [stratLeadExpirationMedium, setStratLeadExpirationMedium] = useState(
        defaultStratLeadExpiration.expirationTime
    );
    const [stratLeadExpirationHigh, setStratLeadExpirationHigh] = useState(defaultStratLeadExpiration.expirationTime);
    const stratLeadLow = useRef<StratLeadExpiration>(defaultStratLeadExpiration);
    const stratLeadMedium = useRef<StratLeadExpiration>(defaultStratLeadExpiration);
    const stratLeadHigh = useRef<StratLeadExpiration>(defaultStratLeadExpiration);
    const maxExpiration = appConfig.tacticalGrid.stratLeadMaxExpiration ?? 100;

    const [ellipseUnit, setEllipseUnit] = useState<string>('kilometers');
    const [supportsEllipse, setSupportsEllipse] = useState<boolean>(false);
    const [ellipseRole, setEllipseRole] = useState<ellipseRoleType>('azimuth');
    const [isMappingEllipseFields, setIsMappingEllipseFields] = useState<boolean>(false);
    const [supportsEllipseUnits, setSupportsEllipseUnits] = useState<boolean>(false);
    const defaultExpirationsFromConfigFile = useRef<StratLeadExpiration[]>([]);
    const { enqueueSnackbar } = useSnackbar();

    const [countsWidgetJson, setCountsWidgetJson] = useState<string>('');
    const countsWJson = useRef('');
    const [showActivityCountsFormOpen, setShowActivityCountsFormOpen] = useState<boolean>(false);
    const [displayConfigureCountsButton, setDisplayConfigureCountsButton] = useState<boolean>(false);
    const [backupActivityCountsJson, setBackupActivityCountsJson] = useState<string>('');
    const [missionNameOnLoad, setMissionNameOnLoad] = useState<string | undefined>();
    const [isExerciseVariant, setIsExerciseVariant] = useState<muiButtonVariant>('outlined');
    const [isExerciseMessage, setIsExerciseMessage] = useState<string>('Create as Exercise');
    const [isGateMissionMessage, setIsGateMissionMessage] = useState<string>('Create as Gate Mission');
    const [isConfiguredForGate, setIsConfiguredForGate] = useState<boolean>(missionState.gateMapType === '3D');
    const [isConfiguredForTacticalGrid, setIsConfiguredForTacticalGrid] = useState<boolean>(false);
    const [isActivityCountsConfigured, setIsActivityCountsConfigured] = useState<boolean>(false);
    const [activityCountsButtonMessage, setActivityCountsButtonMessage] = useState<string>(
        'Configure Activity Counts, using default values.'
    );
    const [isCopyMissionAsExercise, setIsCopyMissionAsExercise] = useState<boolean>(false);
    const [isCopyMissionAsExerciseVariant, setIsCopyMissionAsExerciseVariant] = useState<muiButtonVariant>('outlined');
    const [isConfiguredForTacticalGridVariant, setIsConfiguredForTacticalGridVariant] =
        useState<muiButtonVariant>('outlined');
    const [isGateVariant, setIsGateVariant] = useState<muiButtonVariant>(
        missionState.gateMapType === '3D' ? 'contained' : 'outlined'
    );
    const [columnNames, setColumnNames] = useState<gateColumnHeaderObject | undefined>(
        missionState.gateMissionColumnNames
    );

    const immadAdminNames: string[] = useAppSelector(
        (state: RootState) => state.missionCreationSlice.immadAdminUserNames
    );
    const immadMMgrNames = useAppSelector((state: RootState) => state.missionCreationSlice.immadMissionMgrUserNames);
    const isGateHydrated = missionToUpdate ? !!missionState.gateMapType : true;

    // Initial setup and mission hydration
    useEffect(() => {
        //save the expirations values in the appConfig into an object
        try {
            defaultExpirationsFromConfigFile.current = JSON.parse(
                JSON.stringify(appConfig.tacticalGrid.stratLeadExpiration)
            ) as StratLeadExpiration[];
        } catch (error: any) {
            console.error(error);
        }

        if (defaultStratLeadExpirations.length > 0) {
            copyExpirationValuesToState(defaultStratLeadExpirations);
        }

        getCurrentPortalUser();
        getMMgrAndAdminNames();
        getCategories();
        //reloading does not wipe state -- so we can navigate backwards in our workflow
        if (missionToUpdate && missionState.name === '') {
            //To hydrate an existing mission we need a missionToUpdate and a missing/empty missionState name.
            runHydrateMissionState();
            useDispatch(updateIsEditSession(true));
        } else {
            if (missionToUpdate) {
                useDispatch(updateIsEditSession(true));
            } else {
                useDispatch(updateIsEditSession(false));
            }
            //otherwise update UI from state which will be empty on create new unless we're navigating backwards through the workflow
            setMissionName(missionState.name ?? '');
            dispatch({
                type: Actions.UPDATE_DASHBOARD_ID,
                payload: missionState.dashboardId ?? '',
            });
            setDescription(missionState.description ?? '');
            setCountsWidgetJson(missionState.countsWidgetJson);
            countsWJson.current = missionState.countsWidgetJson;
            missionDescr.current = missionState.description ?? '';
            setManagerNames(
                missionState.managerNames ? missionState.managerNames.split(',').map((name) => name.trim()) : []
            );
            missionMgrs.current = missionState.managerNames ?? '';
            setCategories(missionState.categories ?? []);
            missionCategories.current = missionState.categories ?? [];
            setSelectedCategory(missionState.selectedCategory ?? '');
            missionSelectedCategory.current = missionState.selectedCategory ?? '';
            missionExpandedCategories.current = missionState.expandedCategories ?? [];
        }
        isUserAGateAdmin();
    }, []);

    useEffect(() => {
        // if in edit and isConfiguredForGate display buttons
        if (isEditSession && isConfiguredForGate) {
            setDisplayConfigureCountsButton(true);
        } else {
            // if gateMapType is undefined it is a IMMAD mission in edit do not display the
            // gate configuration buttons.
            setDisplayConfigureCountsButton(false);
        }
    }, [isEditSession]);

    useEffect(() => {
        const gateConfigured = missionState.gateMapType === '3D';
        setIsConfiguredForGate(gateConfigured);

        const shouldShow =
            (isEditSession && gateConfigured) || (!missionToUpdate && missionState.isImmadAdmin && gateConfigured);
        setDisplayConfigureCountsButton(shouldShow);
        if (missionToUpdate && isConfiguredForGate && missionState.gateMapType) {
            setIsGateMissionMessage('Gate Mission');
        }
    }, [missionState.gateMapType, isEditSession, missionToUpdate, missionState.isImmadAdmin]);

    useEffect(() => {
        if (mmgrsAndAdmins.length > 0) {
            //wait for mmgrsAndAdmins to populate
            if (currentUserName != '') {
                if (missionState.managerNames) {
                    const missionManagerArray = missionState.managerNames.split(',').map((mgr) => mgr.trim());
                    const currentManager = missionManagerArray.find(
                        (managerName) => managerName.trim() === currentUserName.trim()
                    ); //is user already a mgr on this mission
                    if (currentManager) {
                        setManagerNames(missionManagerArray);
                    } else {
                        missionManagerArray.push(currentUserName); //add current user as a group manager
                        setManagerNames(missionManagerArray);
                    }
                    missionMgrs.current = missionManagerArray.join(', ');
                } else {
                    setManagerNames([currentUserName]); //temp until async resolve, unless they failed
                }
                if (updatedStateFromOtherMission && missionState) {
                    setMissionName(missionState.name ?? '');
                    dispatch({
                        type: Actions.UPDATE_DASHBOARD_ID,
                        payload: missionState.dashboardId ?? '',
                    });
                    setDescription(missionState.description ?? '');
                    missionDescr.current = missionState.description ?? '';
                    setCountsWidgetJson(missionState.countsWidgetJson);
                    countsWJson.current = missionState.countsWidgetJson;
                    setSelectedCategory(missionState.selectedCategory ? missionState.selectedCategory : '');
                    missionSelectedCategory.current = missionState.selectedCategory
                        ? missionState.selectedCategory
                        : '';
                    //update expirations in UI after updating from previous mission state
                    copyExpirationValuesToState(missionState.stratLeadExpirations);
                }
            }
        }
    }, [currentUserName, mmgrsAndAdmins, updatedStateFromOtherMission]);
    useEffect(() => {
        stratLeadLow.current.expirationTime = stratLeadExpirationLow;
        stratLeadMedium.current.expirationTime = stratLeadExpirationMedium;
        stratLeadHigh.current.expirationTime = stratLeadExpirationHigh;
        dispatch({
            type: Actions.UPDATE_METADATA,
            payload: {
                name: missionName,
                description: missionDescr.current,
                countsWidgetJson: countsWJson.current,
                managerNames:
                    managerNames.length > 0 ? managerNames.join(', ') : missionMgrs.current ? missionMgrs.current : '',
                categories: missionCategories.current,
                selectedCategory: missionSelectedCategory.current,
                expandedCategories: missionExpandedCategories.current,
                stratLeadExpirations: [stratLeadLow.current, stratLeadMedium.current, stratLeadHigh.current],
            },
        });
    }, [
        missionName,
        description,
        countsWidgetJson,
        managerNames,
        categories,
        selectedCategory,
        stratLeadExpirationLow,
        stratLeadExpirationMedium,
        stratLeadExpirationHigh,
        flattenedCategories,
    ]);

    useEffect(() => {
        if (contentCategories && contentCategories.categorySchema.length) {
            setCategoryContent(contentCategories.categorySchema[0]);
        }
    }, [contentCategories]);

    useEffect(() => {
        if (columnNames) {
            if (JSON.stringify(columnNames) !== JSON.stringify(missionState.gateMissionColumnNames)) {
                dispatch({
                    type: Actions.UPDATE_MISSION_REGION_COLUMN_JSON,
                    payload: columnNames,
                });
            }
        }
    }, [columnNames]);

    useEffect((): void => {
        if (missionState.gateMissionColumnNames) {
            setColumnNames(missionState.gateMissionColumnNames);
        }
    }, [missionState.gateMissionColumnNames]);

    useEffect(() => {
        if (tacticalGridLayerFields) {
            validateSmartToTacticalGridFieldMapping();
        }
    }, [tacticalGridLayerFields]);

    useEffect(() => {
        dispatch({
            type: Actions.UPDATE_GATE_MAP_TYPE,
            payload: isConfiguredForGate ? '3D' : undefined,
        });
        if (isConfiguredForGate) {
            if (missionState.countsWidgetJson === '') {
                loadDefaultTemplateJson(); //get from file system
            }
        }
        if (isConfiguredForGate) {
            setIsGateVariant('contained');
            setIsGateMissionMessage('Gate Mission');
            setDisplayConfigureCountsButton(true);
        } else {
            setIsGateVariant('outlined');
            setIsGateMissionMessage('Create as Gate Mission');
            setDisplayConfigureCountsButton(false);
        }
    }, [isConfiguredForGate]);

    useEffect(() => {
        if (mappedFieldsDataGridData) {
            dispatch({
                type: Actions.UPDATE_TGRID_TO_SMART_FIELD_MAPPING,
                payload: mappedFieldsDataGridData,
            });
        }
    }, [mappedFieldsDataGridData]);

    useEffect(() => {
        if (selectedTacticalGridLayerName !== '') {
            const obj = tacticalGridLayerObj?.find((layer) => layer.title === selectedTacticalGridLayerName);
            obj && dispatch({ type: Actions.TACTICAL_GRID_LAYER_GUID, payload: obj.id });
            obj && dispatch({ type: Actions.UPDATE_TACTICAL_GRID_LAYER_NAME, payload: obj.title });

            addFLayerFieldsToSelect(selectedTacticalGridLayerName);
        }
    }, [selectedTacticalGridLayerName]);

    useEffect(() => {
        if (missionState.tacticalGridLayerGuid && selectedTacticalGridLayerName === '') {
            fetchTacticalGridLayers(missionState.tacticalGridLayerGuid);
        }
    }, [missionState.tacticalGridLayerGuid]);

    useEffect(() => {
        calcEllipseFieldState();
        if (smartDataField === '') {
            setSupportsEllipse(false);
        }
    }, [smartDataField, ellipseRole]);

    useEffect(() => {
        if (showActivityCountsFormOpen) {
            onActivityCountsFormOpen();
        }
    }, [showActivityCountsFormOpen]);

    useEffect(() => {
        updateMissionNameInCountsJson(missionName);
    }, [missionName]);

    useEffect(() => {
        if (isConfiguredForTacticalGrid) {
            fetchTacticalGridLayers(missionState.tacticalGridLayerGuid);
        }
        dispatch({ type: Actions.SUPPORT_TACTICAL_GRID, payload: isConfiguredForTacticalGrid });
    }, [isConfiguredForTacticalGrid]);

    useEffect(() => {
        if (isCopyMissionAsExercise) {
            //archive the mission name at time of load in case the user cancels the copy and makes this an update
            setMissionNameOnLoad(missionName);
            setMissionName('');

            dispatch({
                type: Actions.UPDATE_IS_EXERCISE,
                payload: true,
            });
            dispatch({
                type: Actions.UPDATE_MISSION_IS_COPY,
                payload: true,
            });
            enqueueSnackbar(`The mission name must be updated.`, {
                variant: 'warning',
                anchorOrigin: {
                    vertical: 'top',
                    horizontal: 'center',
                },
            });
            if (isConfiguredForGate) {
                setDisplayConfigureCountsButton(true);
            }
            setIsCopyMissionAsExerciseVariant('contained');
        } else {
            //revert back to mission name at the time of load since user no longer  wants to make a copy
            missionNameOnLoad && setMissionName(missionNameOnLoad);

            dispatch({
                type: Actions.UPDATE_IS_EXERCISE,
                payload: false,
            });
            dispatch({
                type: Actions.UPDATE_MISSION_IS_COPY,
                payload: false,
            });
            setIsCopyMissionAsExerciseVariant('outlined');
        }
    }, [isCopyMissionAsExercise]);

    const isUserAGateAdmin = async (): Promise<void> => {
        if (portalUser?.username) {
            const isUserInGroup = await checkIsUserInGroup(
                gateAdminGroupId,
                portalUser.username,
                userSession,
                portalUrl
            );
            dispatch({
                type: Actions.UPDATE_IS_IMMAD_ADMIN,
                payload: isUserInGroup,
            });
        }
    };

    /**
     * Update the UI state by making a copy of the expiration values -- updating the reference changes the
     * config values that may be used again in the code in this section
     * @param expirationValues array of expiration values of type StratLeadExpiration
     */
    const copyExpirationValuesToState = (expirationValues: StratLeadExpiration[]) => {
        if (!expirationValues) {
            return;
        }
        try {
            const low: StratLeadExpiration | undefined = expirationValues.find((item) => item.id === 'low');
            const medium: StratLeadExpiration | undefined = expirationValues.find((item) => item.id === 'medium');
            const high: StratLeadExpiration | undefined = expirationValues.find((item) => item.id === 'high');
            if (low) {
                stratLeadLow.current = JSON.parse(JSON.stringify(low));
                setStratLeadExpirationLow(low.expirationTime);
            }

            if (medium) {
                stratLeadMedium.current = JSON.parse(JSON.stringify(medium));
                setStratLeadExpirationMedium(medium.expirationTime);
            }

            if (high) {
                stratLeadHigh.current = JSON.parse(JSON.stringify(high));
                setStratLeadExpirationHigh(high.expirationTime);
            }
        } catch (error: any) {
            console.error(error);
        }
    };

    /**
     * Handle the check change on the use custom expirations checkbox
     * @param value checked state true or false
     */
    const supportCustomStratLeadExpiration = (value: boolean) => {
        dispatch({ type: Actions.SUPPORTS_CUSTOM_STRATLEAD_EXPIRATION, payload: value });
        if (!value) {
            //reset to appConfig default when unchecked
            copyExpirationValuesToState(defaultExpirationsFromConfigFile.current);
        }
    };

    /**
     * Get the current portal user
     */
    const getCurrentPortalUser = async () => {
        const result = await currentPortalUser();
        if (result.username) {
            setCurrentUserName(result.username);
            dispatch({
                type: Actions.UPDATE_CURRENT_USER,
                payload: result.username,
            });
        }
    };

    const onBlurDashboardId = () => {
        getSmartMappedFields();
    };

    const getSmartMappedFields = async () => {
        const smartFields = await getDashboardSmartFields(
            appConfig.smart.getDashboardDataUrl,
            missionState.dashboardId,
            appConfig.smart.fetchGetParamsFromConfig
        );
        if (!smartFields || smartFields.length < 1) {
            setSmartMapFields(appConfig.smart?.mappableFields ?? []);
        } else {
            setSmartMapFields([...smartFields]);
        }
    };

    const getCategories = async () => {
        const result = (await getCategoryContent()) as unknown as ContentCategories;

        if (result) {
            setContentCategories(result);
        }
    };

    const setCategoryContent = (node: ContentCategory) => {
        let categoryList: RenderTree = defaultCategory;
        const flattenedCategoryList: RenderTree[] = flattenedCategories;
        const nodeIdList: string[] = nodeIds;

        if (node && node.categories) {
            const categoryListStr = JSON.stringify(node)
                .replaceAll(`"title":`, `"name":`)
                .replaceAll(`"categories":`, `"children":`);

            categoryList = JSON.parse(categoryListStr);

            categoryList.id = hashCode('Categories');
            nodeIdList.push(categoryList.id);
            categoryList.name = 'Categories';

            flattenedCategoryList.push(categoryList);

            if (categoryList.children) {
                for (let child of categoryList.children) {
                    child = updateTreeData(child, categoryList.id);
                    nodeIdList.push(child.id);
                    flattenedCategoryList.push(child);
                }
            }
        }

        setCategoryTree(categoryList ? categoryList : defaultCategory);
        setNodeIds(nodeIdList);
        setFlattenedCategories(flattenedCategoryList);
        missionCategories.current = flattenedCategories;
    };

    /**
     * When updating a mission this method sets the state for the mission which includes pulling metadata stored in the application object.
     */
    const runHydrateMissionState = async () => {
        if (missionToUpdate != undefined) {
            await hydrateMissionState(dispatch, missionToUpdate);
            setUpdatedStateFromOtherMission(true);
        }
    };

    /**
     * Get the Mission managers and admins defined in the Portal.
     */
    const getMMgrAndAdminNames = async () => {
        const adminsMMgrs = [...immadAdminNames, ...immadMMgrNames];
        const set = new Set(adminsMMgrs);
        const adminsMMgrsArray = Array.from(set).sort();
        setMmgrAndAdmins(adminsMMgrsArray);
    };

    const onChangeName = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMissionName(event.target.value);
    };

    const onChangeDashboardId = (event: React.ChangeEvent<HTMLInputElement>) => {
        dispatch({
            type: Actions.UPDATE_DASHBOARD_ID,
            payload: event.target.value,
        });
    };

    const onChangeDescription = (event: React.ChangeEvent<HTMLInputElement>) => {
        setDescription(event.target.value);
        missionDescr.current = event.target.value;
    };

    /**
     * A custom event handler that is passes to the TreeView widget to implement custom behavior when a tree item
     * selection is changed.
     * @param event event object on the treeview
     * @param nodeId id of the selected node
     */
    const onChangeCategory = (event: React.SyntheticEvent, nodeId: string) => {
        const categoryList: RenderTree[] = [];
        let category: RenderTree | undefined = defaultCategory;

        if (categoryTree && categoryTree.children) {
            category = flattenedCategories.find((x) => x.id === nodeId);

            if (category) {
                missionSelectedCategory.current = category.id;
                //selectedCategory appears to only be a flag that causes the tree to redraw on change
                //hence if the same node was repeated clicked the tree was not redrawing - fixes si-2066
                selectedCategory === category.id ? setSelectedCategory('') : setSelectedCategory(category.id);
            }

            while (category) {
                if (category.parentId) {
                    categoryList.push(category);
                    const parentId: string = category.parentId;
                    category = flattenedCategories.find((x) => x.id === parentId);
                } else {
                    category = undefined;
                }
            }

            missionExpandedCategories.current = categoryList;
        }
    };

    const updateTreeData = (node: RenderTree, parentId: string): RenderTree => {
        const flattenedCategoryList = flattenedCategories;
        const nodeIdList = nodeIds;

        node.id = hashCode(`${parentId}_${node.name}`.replaceAll(' ', '_'));
        nodeIdList.push(node.id);
        node.parentId = parentId;
        if (node.children && node.children.length) {
            for (let child of node.children) {
                child = updateTreeData(child, node.id);
                nodeIdList.push(child.id);
                flattenedCategoryList.push(child);
            }
        }

        setNodeIds(nodeIdList);
        setFlattenedCategories(flattenedCategoryList);
        return node;
    };

    const MenuProps = {
        PaperProps: {
            style: {
                maxHeight: 300,
                width: 550,
            },
        },
    };

    /**
     * Helper function that calculates the Gate Mission Button config
     * @param missionToUpdate
     * @param missionState
     * @param isEditSession
     * @param isConfiguredForGate
     * @param isGateVariant
     * @param isGateMissionMessage
     */
    const getGateMissionButtonConfig = (
        missionToUpdate: IItem | undefined,
        missionState: MissionState,
        isEditSession: boolean,
        isConfiguredForGate: boolean,
        isGateVariant: muiButtonVariant,
        isGateMissionMessage: string
    ) => {
        if (!missionToUpdate && missionState.isImmadAdmin) {
            return {
                label: isGateMissionMessage,
                title: 'Create Gate Mission',
                variant: isGateVariant,
                show: true,
            };
        }
        if (missionToUpdate && isConfiguredForGate) {
            return {
                label: 'Gate Mission',
                title: 'Update Gate Mission',
                variant: 'contained' as muiButtonVariant,
                show: true,
            };
        }
        return {
            label: '',
            title: '',
            variant: 'outlined' as muiButtonVariant,
            show: false,
        };
    };

    /**
     * Update the reducer state when make a gate mission button is pressed
     */
    const handleGateTypeSelection = () => {
        if (missionToUpdate) {
            return;
        }
        if (isConfiguredForGate) {
            setIsConfiguredForGate(false);
        } else {
            setIsConfiguredForGate(true);
        }
        if (!isEditSession) {
            clearPreviousSelections();
        }
    };

    const clearPreviousSelections = () => {
        dispatch({
            //clear any previously selected mission scenes if user navigates back to data page and changes GATE mission checkbox
            type: Actions.UPDATE_WEBSCENE,
            payload: { item: undefined },
        });
        dispatch({
            //clear any previously selected analysts if user navigates back to data page and changes GATE mission checkbox
            type: Actions.UPDATE_ANALYST_NAMES,
            payload: { item: [] },
        });
    };

    const handleIsExerciseChanged = () => {
        const value = isExerciseVariant === 'outlined';
        handleIsExerciseCheckedChange(value);
    };

    /**
     * Update the reducer state for isExercise
     */
    const handleIsExerciseCheckedChange = (value: boolean) => {
        if (value) {
            dispatch({
                type: Actions.UPDATE_IS_EXERCISE,
                payload: true,
            });
            setIsExerciseVariant('contained');
            setIsExerciseMessage('Exercise Mission');
        } else {
            dispatch({
                type: Actions.UPDATE_IS_EXERCISE,
                payload: false,
            });
            setIsExerciseVariant('outlined');
            setIsExerciseMessage('Create as Exercise');
        }
    };

    /**
     * Update the reducer state for isExercise
     */
    const handleCopyMissionCheckedChange = () => {
        // toggle copy and do the work in a useEffect
        if (isCopyMissionAsExercise) {
            setIsCopyMissionAsExercise(false);
        } else {
            setIsCopyMissionAsExercise(true);
        }
    };

    const handleSelectChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        const mgrs = event.target.value as string[];
        setManagerNames(mgrs);
        missionMgrs.current = mgrs.join(', ');
    };

    /**
     * Create objects that represents a field mapping between a tactical grid field and a SMART field
     * @param mappingSourceArray tactical grid to smart field mappings
     * @returns
     */
    const createFieldMappings = (mappingSourceArray: TGridToSmartMapping[]): TGridToSmartMapping[] => {
        const newMapping: TGridToSmartMapping[] = [];
        mappingSourceArray.forEach((mapping: TGridToSmartMapping) => {
            const fMapping = createFieldMapping(
                mapping.tacticalGridFieldName,
                mapping.systemFieldName,
                true,
                mapping.ellipseUnit ? mapping.ellipseUnit : '',
                mapping.ellipseRole ? mapping.ellipseRole : ''
            );
            newMapping.push(fMapping);
        });
        return newMapping;
    };

    /**
     * Get all the feature layers with the tactical grid tag.
     * @param tGridLayerGuid an id of the tactical grid layer - can be an empty string if one is not defined - to set as the default
     */
    const fetchTacticalGridLayers = async (tGridLayerGuid = ''): Promise<void> => {
        const tGridLayerObj = await getTacticalGridLayers();
        const tGridFeatureLayers = tGridLayerObj.layers.filter((layer: any) => {
            return layer.type === 'Feature Service';
        });
        const defaultMappings = appConfig.tacticalGrid.defaultFieldMappings;
        setTacticalGridLayersObj(tGridFeatureLayers);
        let newMapping: TGridToSmartMapping[] = [];
        if (tGridLayerObj && tGridLayerObj.layers && tGridLayerObj.layers.length > 0) {
            if (tGridLayerGuid) {
                //updating with a prev tactical grid layer
                if (missionState.tacticalGridToSMARTFieldMappings?.length > 0) {
                    newMapping = createFieldMappings(missionState.tacticalGridToSMARTFieldMappings);
                } else {
                    newMapping = createFieldMappings(defaultMappings);
                }
            } else if (!tGridLayerGuid) {
                //updating but no existing tactical grid layer
                newMapping = createFieldMappings(defaultMappings);
            }

            addItemToMappedFields(newMapping);
            const usableLayerId = tGridLayerGuid || appConfig.tacticalGrid.dataLayerId;
            const selected = tGridLayerObj.layers.find((lyr) => lyr.id === usableLayerId);
            selected && setSelectedTacticalGridLayerName(selected.title);
        } else {
            setSelectedTacticalGridLayerName('');
        }
    };

    /**
     * Build up a dynamic string expression with separators.
     * @param value string value
     * @param separator separator between strings
     */
    const addToString = (value: string, separator: string): string => {
        if (value === undefined || value === '') {
            return '';
        } else {
            return `${separator}${value}`.trim();
        }
    };
    /**
     * Define a field mapping object that represents the connection between smart and a layer file
     * @param gridField tactical grid field
     * @param smartField smart system data field
     * @param ableToMap true if both fields are found in their respective data otherwise false
     * @param ellipseUnit the unit for the ellipse value
     * @param ellipseRole the role for the ellipse field semi-major, semi-minor, or azimuth
     * @param supportsEllipse true unless method is being called by the Create new mapping button click handler
     */
    const createFieldMapping = (
        gridField: string,
        smartField: string,
        ableToMap = true,
        ellipseUnit = '',
        ellipseRole = '',
        supportsEllipse = true
    ): TGridToSmartMapping => {
        const tgridField = gridField.replace(/\s/g, '');

        let mapped = ableToMap ? 'yes' : 'no';
        const role = ellipseRole && supportsEllipse ? ellipseRole : '';
        const unit = ellipseUnit && supportsEllipse ? ellipseUnit : '';
        if (role && role !== '') {
            mapped = addToString(mapped, '').trim() + addToString(role, ',').trim() + addToString(unit, ',').trim();
        }

        return {
            id: `${tgridField.trim()}`,
            systemFieldName: smartField,
            tacticalGridFieldName: gridField,
            mapped: mapped.trim(),
            ellipseRole: role,
            ellipseUnit: unit,
        };
    };

    /**
     * Handle support tactical grid checkbox change.
     */
    const supportTacticalGridCheckHandler = () => {
        if (isConfiguredForTacticalGrid) {
            setIsConfiguredForTacticalGrid(false);
            setIsConfiguredForTacticalGridVariant('outlined');
        } else {
            setIsConfiguredForTacticalGrid(true);
            setIsConfiguredForTacticalGridVariant('contained');
        }
    };

    /**
     * Handle support tactical grid checkbox change.
     * @param value true or false
     */
    const mapTacticalGridToSMARTCheckHandler = (value: boolean) => {
        //populate the fields picklist when checked - generally it populates on the dashboard id field's onBlur event
        if (smartMapFields?.length < 1) {
            //use cas: editing an existing tactical grid mission and no onBlur is called on the dashboard id TextField
            getSmartMappedFields();
        }
        dispatch({ type: Actions.UPDATE_SUPPORTS_TGRID_TO_SMART_MAPPING, payload: value });
    };

    /**
     * Handle support ellipse checkbox change.
     * @param value true or false if not checked
     */
    const supportsEllipseCheckChanged = (value: boolean) => {
        setSupportsEllipse(value);
    };

    /**
     * Handle when map tactical grid layer field changes.
     * @param event change event
     */
    const tacticalGridSelectedFieldChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTacticalGridSelectedField(event.target.value);
        //supports setting smart fields when doing and update to a mission
        //when creating a mission the smart fields are set on the dashboard id TextField onBlur event
        //when the dashboard id field is set when updating a mission we don't get the onBlur fired
        if (missionState.dashboardId && missionToUpdate && smartMapFields && smartMapFields.length < 1) {
            getSmartMappedFields();
        }
    };

    /**
     * Handle when map smart data field changes.
     * @param event change event
     */
    const smartDataSelectedFieldChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSmartDataField(event.target.value);
    };

    /**
     * Handle ellipse role select change
     * @param event change event
     */
    const tacticalGridEllipseSelectedRoleChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
        const val = event.target.value;

        setEllipseRole(val as ellipseRoleType);
    };

    /**
     * Handle ellipse unit select change
     * @param event change event
     */
    const tacticalGridEllipseSelectedUnitChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEllipseUnit(event.target.value);
    };

    /**
     * Handle tactical grid layers select change.
     * @param event change event
     */
    const tacticalGridLayerChanged = (event: ChangeEvent<HTMLInputElement>) => {
        setSelectedTacticalGridLayerName(event.target.value);
    };

    // The methods below track the values of the sliders and adjust the min/max dynamically
    const handleLowExpirationChange = (event: any, newValue: number) => {
        setStratLeadExpirationLow(newValue);

        if (newValue === stratLeadExpirationMedium) {
            setStratLeadExpirationMedium(newValue + 1);
        }
    };

    const handleMediumExpirationChange = (event: any, newValue: number) => {
        setStratLeadExpirationMedium(newValue);

        if (newValue === stratLeadExpirationHigh) {
            setStratLeadExpirationHigh(newValue + 1);
        }
    };

    const handleHighExpirationChange = (event: any, newValue: number) => {
        setStratLeadExpirationHigh(newValue);
    };

    /**
     * Find all portal feature layers with the tactical grid tag
     * @param searchedForId the title of the layer that should be visible in the select
     */
    const addFLayerFieldsToSelect = (searchedForId: string) => {
        const obj: any | undefined = tacticalGridLayerObj?.find((obj) => obj.title === searchedForId);
        if (!obj) {
            return;
        }
        const featureLayer = new FeatureLayer({ portalItem: { id: obj.id } });
        featureLayer
            .load()
            .then(() => {
                setTacticalGridLayerFields(featureLayer.fields);
            })
            .catch((error) => {
                console.error(error);
            });
    };

    /**
     * Handle selection change on the field mapping datagrid
     * @param selectedFieldNamesArray array of selected user names
     */
    const fieldMappingDataGridSelectionChanged = (selectedFieldNamesArray: any) => {
        setMappedFieldsDataGridSelection([...selectedFieldNamesArray]);
    };

    /**
     * Handle button click that adds a new field mapping to the datagrid
     */
    const handleAddToMappingGrid = () => {
        const row: TGridToSmartMapping = createFieldMapping(
            tacticalGridSelectedField,
            smartDataField,
            true,
            ellipseUnit && supportsEllipseUnits ? ellipseUnit : '',
            ellipseRole ? ellipseRole : '',
            supportsEllipse
        );

        let hasDuplicateRole = false;
        if (ellipseRole && supportsEllipse && mappedFieldsDataGridData.find((row) => row.ellipseRole === ellipseRole)) {
            hasDuplicateRole = true;
        }
        if (!hasDuplicateRole) {
            addItemToMappedFields([row]);
            setSmartDataField('');
        } else {
            enqueueSnackbar(
                `The ellipse role '${ellipseRole}' has already been assigned to a mapped field. Please remove the previous mapping or selected a different role.`,
                { variant: 'error' }
            );
        }
    };

    /**
     * Handle button click that removes a field mapping from the datagrid
     */
    const handleDeleteFromFieldMappingDataGrid = () => {
        let currentItems = [...mappedFieldsDataGridData];
        mappedFieldsDataGridSelection.forEach((id) => {
            const items = currentItems.filter((item) => {
                const itemId = item.id.replace(/\s/g, '');
                return itemId !== id;
            });
            if (items) {
                currentItems = [...items];
            }
        });
        setMappedFieldsDataGridData([...currentItems]);
    };

    /**
     * Add item after checking and removing any existing items with the same key - avoids duplicate items
     * @param newItems field mapping object
     */
    const addItemToMappedFields = (newItems: TGridToSmartMapping[]) => {
        let nonDuplicates = [...mappedFieldsDataGridData];
        newItems.forEach((item) => {
            const f = nonDuplicates.filter((mItem) => mItem.id !== item.id);
            nonDuplicates = [...f];
        });
        setMappedFieldsDataGridData([...newItems, ...nonDuplicates]);
    };

    /**
     * When the target layer changes this method reviews the currently defined mappings and flags any items that
     * do not have a corresponding attribute name found in the new layer. The flag will appear in  the 'Unable to Map' grid column.
     */
    const validateSmartToTacticalGridFieldMapping = () => {
        const gridObj: TGridToSmartMapping[] = [];
        mappedFieldsDataGridData.forEach((mapping) => {
            const found = tacticalGridLayerFields?.find(
                (gridField) => gridField.name === mapping.tacticalGridFieldName
            );
            if (!found) {
                mapping.mapped = 'no';
            } else {
                mapping.mapped = 'yes';
            }
            gridObj.push(mapping);
        });
        const newMapping: TGridToSmartMapping[] = [];
        gridObj.forEach((obj) => {
            const nMap =
                obj.mapped === 'yes'
                    ? createFieldMapping(
                          obj.tacticalGridFieldName,
                          obj.systemFieldName,
                          true,
                          obj.ellipseUnit ? obj.ellipseUnit : '',
                          obj.ellipseRole ? obj.ellipseRole : ''
                      )
                    : createFieldMapping(
                          obj.tacticalGridFieldName,
                          obj.systemFieldName,
                          false,
                          obj.ellipseUnit ? obj.ellipseUnit : '',
                          obj.ellipseRole ? obj.ellipseRole : ''
                      );
            newMapping.push(nMap);
        });
        addItemToMappedFields(newMapping);
    };

    /**
     * Generate variables for updating UI state related to mapping ellipse fields for tactical grid
     */
    const calcEllipseFieldState = () => {
        if (ellipseRole === 'semi-minor' || ellipseRole === 'semi-major') {
            setIsMappingEllipseFields(true);
            setSupportsEllipseUnits(true);
        }
        if (ellipseRole === 'azimuth') {
            setIsMappingEllipseFields(true);
            setSupportsEllipseUnits(false);
        }
    };

    const onBlurMissionName = () => {
        if (managerNames && managerNames.length < 2 && !missionToUpdate) {
            enqueueSnackbar(`It is highly recommended to assign at least two managers to the mission.`, {
                variant: 'warning',
            });
        }
        setMissionName((name) => name.trim());
    };

    /**
     *Validate that a JSON string is valid json. Log and show error message
     *if the JSON fails to parse.
     * @param jsonData JSON to validate
     */
    const parseJson = (jsonData: any): any | undefined => {
        let parseError = false;
        let res = undefined;
        try {
            if (countsWidgetJson !== '') {
                res = JSON.parse(jsonData);
            }
        } catch (exception) {
            console.error('Error parsing JSON. Error: ' + JSON.stringify(exception));
            parseError = true;
        }
        if (parseError) {
            enqueueSnackbar(`The JSON contains an error. Please edit before continuing.`, {
                variant: 'error',
                anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'center',
                },
            });
        }
        return res;
    };

    /**
     * Load the template JSON from the file system
     */
    const loadDefaultTemplateJson = async () => {
        await loadActivityCountsJsonDef(); //get from file system
    };

    /**
     * Handle click event to show the input for adding/or editing the JSON for the activity counts widget
     */
    const configureGateLinkClicked = async () => {
        if (missionState.countsWidgetJson === '') {
            await loadDefaultTemplateJson();
        }
        setShowActivityCountsFormOpen(true);
    };

    /**
     * Look on the file system for the activity counts JSON def template
     */
    const loadActivityCountsJsonDef = async () => {
        const template = await loadJsonFromFile('activityCountsDef.json');
        if (template) {
            const jsonString = JSON.stringify(template, undefined, 5); //prettify
            countsWJson.current = jsonString;
            setCountsWidgetJson(jsonString); //this will trigger an update to missionState
            return;
        }
        console.error('Failed to find the activity counts  JSON def on the file system.');
        countsWJson.current = '';
        setCountsWidgetJson('');
    };

    /**Handle event when form to enter JSON opens. */
    const onActivityCountsFormOpen = () => {
        setBackupActivityCountsJson(
            missionState.countsWidgetJson !== '' ? missionState.countsWidgetJson : countsWidgetJson
        );
    };

    /**
     * Handle dialog that handles input JSON for the activity counts closing event.
     * @param event change event attached to the textarea in the dialog
     */
    const onChangeCountsWJson = (event: React.ChangeEvent<HTMLInputElement>) => {
        setBackupActivityCountsJson(event.target.value);
    };

    const [countsJsonObj, setCountsJsonObj] = useState<any>();
    const updateMissionNameInCountsJson = (name: string) => {
        if (countsJsonObj && displayConfigureCountsButton && countsWidgetJson) {
            countsJsonObj.regionname = name;
            const jsonString = JSON.stringify(countsJsonObj);

            countsWJson.current = jsonString;
            setCountsWidgetJson(jsonString);
        }
    };

    /**
     * Handle dialog that handles input JSON for the activity counts closing event.
     */
    const onActivityCountsFormClose = (json: string) => {
        setShowActivityCountsFormOpen(false);
        const parsedJson = parseJson(json);
        if (parsedJson) {
            setCountsJsonObj(parsedJson);
        }

        countsWJson.current = json;
        setCountsWidgetJson(json);
        setBackupActivityCountsJson('foo');
        setIsGateVariant('contained');
        // set value here to show that save was clicked in the check mark is to be used
        if (!isActivityCountsConfigured) {
            setIsActivityCountsConfigured(true);
        }
        setActivityCountsButtonMessage('Activity Counts configured, click to edit.');
    };

    /**
     * Handle dialog that handles input JSON for the activity counts cancel event.
     */
    const onActivityCountsFormCancel = () => {
        setShowActivityCountsFormOpen(false);
        setBackupActivityCountsJson('');
        // set value here to show default template stet
        if (isActivityCountsConfigured) {
            setIsActivityCountsConfigured(false);
        }
        setActivityCountsButtonMessage('Configure Activity Counts, currently using last configured or default values.');
    };

    const userCanCreateGate = missionState.gateMapType && missionState.isImmadAdmin;
    const userCanSeeCopyBtn = userCanCreateGate || !missionState.gateMapType;
    const gateButton = getGateMissionButtonConfig(
        missionToUpdate,
        missionState,
        isEditSession,
        isConfiguredForGate,
        isGateVariant,
        isGateMissionMessage
    );

    return (
        <WidgetContainer ref={container}>
            <WidgetContent>
                <FieldGroup>
                    <InputLabelWMargin>Mission Name</InputLabelWMargin>
                    <InputField
                        InputProps={{ readOnly: missionToUpdate && !missionState.missionIsCopy }}
                        fullWidth
                        variant='outlined'
                        color='secondary'
                        required
                        value={missionName}
                        onChange={onChangeName}
                        onBlur={onBlurMissionName}
                        autoComplete='off'
                    />
                </FieldGroup>
                <FieldGroup>
                    <InputLabelWMargin>Mission Managers</InputLabelWMargin>
                    <InlineSelectNoMargin
                        multiple
                        variant='outlined'
                        value={managerNames}
                        onChange={handleSelectChange}
                        placeholder='Mission Managers'
                        label='Mission Mgr'
                        input={<Input />}
                        renderValue={(selected: string[]) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: '15px', rowGap: '5px' }}>
                                {selected.map((val) => (
                                    <Chip label={val} variant='outlined' key={val} />
                                ))}
                            </Box>
                        )}
                        MenuProps={MenuProps}
                    >
                        {mmgrsAndAdmins.map((name) => (
                            <ManagerMenuItem key={name} value={name}>
                                <Checkbox checked={managerNames.indexOf(name) > -1} />
                                <ListItemText primary={name} />
                            </ManagerMenuItem>
                        ))}
                    </InlineSelectNoMargin>
                </FieldGroup>
                <FieldGroup>
                    <InputLabelWMargin>Mission Summary</InputLabelWMargin>
                    <InputField
                        multiline
                        variant='outlined'
                        required
                        title={missionToUpdate ? '' : 'Max 250 characters'}
                        placeholder='Summary Text - maximum 250 characters'
                        inputProps={{ maxLength: 250 }}
                        minRows={4}
                        fullWidth
                        value={description}
                        autoComplete='off'
                        onChange={onChangeDescription}
                        helperText={'Required'}
                    />
                </FieldGroup>
                <StyledButtonsDiv className='buttons-div'>
                    <FieldGroup $bottomgutter>
                        {missionState.isExerciseWhenLoaded && (
                            <Typography sx={{ paddingLeft: '0px', marginTop: '15px', color: 'red' }}>
                                THIS MISSION HAS BEEN DESIGNATED AN EXERCISE MISSION
                            </Typography>
                        )}
                    </FieldGroup>

                    {!missionState.isExerciseWhenLoaded && !missionToUpdate && (
                        <div className='excersie-button-div'>
                            <StyledTextExerciseButton
                                title={'Create Mission as Exercise'}
                                variant={isExerciseVariant}
                                onClick={handleIsExerciseChanged}
                                size={'medium'}
                            >
                                {isExerciseMessage}
                            </StyledTextExerciseButton>
                        </div>
                    )}
                    {missionToUpdate && !missionState.isExerciseWhenLoaded && userCanSeeCopyBtn && (
                        <StyledTextExerciseButton
                            title={'COPY this mission and make a new Exercise Mission'}
                            variant={isCopyMissionAsExerciseVariant}
                            onClick={handleCopyMissionCheckedChange}
                            size={'medium'}
                        >
                            {'Copy as Exercise'}
                        </StyledTextExerciseButton>
                    )}
                    <StyledFlexDiv className='flex-rows-div'>
                        {isGateHydrated && gateButton.show && (
                            <StyledTextCreateButton
                                title={gateButton.title}
                                variant={gateButton.variant}
                                onClick={handleGateTypeSelection}
                                size={'medium'}
                            >
                                {gateButton.label}
                            </StyledTextCreateButton>
                        )}
                        {displayConfigureCountsButton ? (
                            <StyledIconButtonWithBadge
                                onClick={configureGateLinkClicked}
                                title={activityCountsButtonMessage}
                                size={'medium'}
                                variant={'contained'}
                            >
                                <EditAttributesIcon fontSize={'xs'} />
                                <StyledPencilBadge
                                    badgeContent={
                                        isActivityCountsConfigured ? (
                                            <CheckCircleFilled checkColor={'white'} />
                                        ) : (
                                            <MinusCircleFilled minusColor={'white'} />
                                        )
                                    }
                                    overlap='circular'
                                    configured={isConfiguredForGate}
                                />
                            </StyledIconButtonWithBadge>
                        ) : (
                            ''
                        )}
                    </StyledFlexDiv>
                    {showActivityCountsFormOpen && (
                        <ActivityCountsForm
                            onCancel={onActivityCountsFormCancel}
                            countsWidgetJson={backupActivityCountsJson}
                            onClose={onActivityCountsFormClose}
                            container={container.current}
                            onChangeCountsWJson={onChangeCountsWJson}
                            missionName={missionName}
                        />
                    )}
                    <div className='tactical-grid-button-div'>
                        <StyledTextCreateButton
                            title={'Support Tactical Grid '}
                            variant={isConfiguredForTacticalGridVariant}
                            onClick={supportTacticalGridCheckHandler}
                            size={'medium'}
                        >
                            Support Tactical Grid
                        </StyledTextCreateButton>
                    </div>
                </StyledButtonsDiv>
                {missionState.supportsTacticalGrid ? (
                    <>
                        <FieldGroup>
                            <InputLabelWMargin>Dashboard Id</InputLabelWMargin>
                            <InputField
                                required
                                helperText={'Required'}
                                fullWidth
                                variant='outlined'
                                color='secondary'
                                onBlur={onBlurDashboardId}
                                value={missionState.dashboardId}
                                onChange={onChangeDashboardId}
                                autoComplete='off'
                            />
                        </FieldGroup>
                        <FieldGroup>
                            <InputLabelWMargin>Tactical Grid Layer</InputLabelWMargin>
                            <InputField
                                fullWidth
                                variant='outlined'
                                color='secondary'
                                select
                                required
                                helperText={'Required'}
                                value={selectedTacticalGridLayerName}
                                onChange={tacticalGridLayerChanged}
                            >
                                {tacticalGridLayerObj && tacticalGridLayerObj?.length > 0 ? (
                                    tacticalGridLayerObj?.map((val) => (
                                        <MenuItem key={`${val.id}`} value={val.title}>
                                            {val.title}
                                        </MenuItem>
                                    ))
                                ) : (
                                    <MenuItem key='nogridlayersfound'>No tactical grid layers found</MenuItem>
                                )}
                            </InputField>
                        </FieldGroup>
                        <FieldGroup>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={missionState.supportsCustomStratLeadExpiration}
                                        onChange={(evt) => supportCustomStratLeadExpiration(evt.target.checked)}
                                    />
                                }
                                label='Set Custom StratLead Expiration (hrs)'
                            />
                        </FieldGroup>
                        {missionState.supportsCustomStratLeadExpiration && defaultStratLeadExpirations.length > 0 ? (
                            <FieldGroup>
                                <InputLabelWMargin>Set STRATLEAD Expiration</InputLabelWMargin>
                                <StyledStratLeadExpirationContainer>
                                    <StyledStratLeadExpirationSliderContainer>
                                        <Typography>{`Low 0 - ${stratLeadExpirationLow}`}</Typography>
                                        <StyledExpirationSlider
                                            value={stratLeadExpirationLow}
                                            valueLabelDisplay='auto'
                                            step={1}
                                            onChange={handleLowExpirationChange}
                                            min={1}
                                            max={stratLeadExpirationMedium}
                                        />
                                    </StyledStratLeadExpirationSliderContainer>
                                    <StyledStratLeadExpirationSliderContainer>
                                        <Typography>{`Medium ${
                                            stratLeadExpirationLow + 1
                                        } - ${stratLeadExpirationMedium}`}</Typography>
                                        <StyledExpirationSlider
                                            value={stratLeadExpirationMedium}
                                            valueLabelDisplay='auto'
                                            step={1}
                                            onChange={handleMediumExpirationChange}
                                            min={stratLeadExpirationLow + 1}
                                            max={stratLeadExpirationHigh}
                                        />
                                    </StyledStratLeadExpirationSliderContainer>
                                    <StyledStratLeadExpirationSliderContainer>
                                        <Typography>{`High ${stratLeadExpirationMedium + 1} - ${
                                            stratLeadExpirationHigh + 1
                                        }`}</Typography>
                                        <StyledExpirationSlider
                                            value={stratLeadExpirationHigh}
                                            valueLabelDisplay='auto'
                                            step={1}
                                            onChange={handleHighExpirationChange}
                                            min={stratLeadExpirationMedium + 1}
                                            max={maxExpiration}
                                        />
                                    </StyledStratLeadExpirationSliderContainer>
                                </StyledStratLeadExpirationContainer>
                            </FieldGroup>
                        ) : (
                            ''
                        )}

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={missionState.supportsMappedGridFieldsToSMARTFields}
                                    onChange={(evt) => mapTacticalGridToSMARTCheckHandler(evt.target.checked)}
                                />
                            }
                            label='Map SMART Fields to Tactical Grid Fields'
                        />

                        {missionState.supportsMappedGridFieldsToSMARTFields && selectedTacticalGridLayerName !== '' ? (
                            <FieldGroup>
                                <InputFieldInlineWMargin350
                                    variant='outlined'
                                    disabled={mappedFieldsDataGridSelection.length > 0}
                                    select
                                    size='small'
                                    color='secondary'
                                    value={tacticalGridSelectedField}
                                    onChange={tacticalGridSelectedFieldChanged}
                                    label='Tactical Grid Layer Field'
                                    autoComplete='off'
                                >
                                    {tacticalGridLayerFields && tacticalGridLayerFields?.length > 0 ? (
                                        tacticalGridLayerFields?.map((field) => (
                                            <MenuItem key={field.name.replace(/\s/g, '')} value={field.name}>
                                                {field.name}
                                            </MenuItem>
                                        ))
                                    ) : (
                                        <MenuItem key='nolayerfieldsfound'>No fields found</MenuItem>
                                    )}
                                </InputFieldInlineWMargin350>
                                <Typography component='span'>maps to:</Typography>
                                <InputField
                                    variant='outlined'
                                    select
                                    style={{ width: 300, marginLeft: 15 }}
                                    color='secondary'
                                    size='small'
                                    disabled={mappedFieldsDataGridSelection.length > 0}
                                    value={smartDataField}
                                    onChange={smartDataSelectedFieldChanged}
                                    autoComplete='off'
                                    label='SMART Field'
                                >
                                    {smartMapFields && smartMapFields?.length > 0 ? (
                                        smartMapFields?.map((field: string) => (
                                            <MenuItem key={field.replace(/\s/g, '')} value={field}>
                                                {field}
                                            </MenuItem>
                                        ))
                                    ) : (
                                        <MenuItem key='nolayerfieldsfound'>No fields found</MenuItem>
                                    )}
                                </InputField>
                                {smartDataField !== '' ? (
                                    <FormControlLabel
                                        style={{ marginLeft: 15 }}
                                        control={
                                            <Checkbox
                                                checked={supportsEllipse}
                                                onChange={(evt) => supportsEllipseCheckChanged(evt.target.checked)}
                                            />
                                        }
                                        label='Field Supports Ellipse'
                                    />
                                ) : (
                                    ''
                                )}
                                {isMappingEllipseFields ? (
                                    <>
                                        {supportsEllipse ? (
                                            <>
                                                <InputFieldInlineWMargin
                                                    variant='outlined'
                                                    disabled={mappedFieldsDataGridSelection.length > 0}
                                                    select
                                                    size='small'
                                                    color='secondary'
                                                    value={ellipseRole}
                                                    onChange={tacticalGridEllipseSelectedRoleChanged}
                                                    label='Role'
                                                    autoComplete='off'
                                                >
                                                    {['semi-minor', 'semi-major', 'azimuth'].map((ellipseRole) => (
                                                        <MenuItem
                                                            key={ellipseRole.replace(/\s/g, '')}
                                                            value={ellipseRole.replace(/\s/g, '')}
                                                        >
                                                            {ellipseRole}
                                                        </MenuItem>
                                                    ))}
                                                </InputFieldInlineWMargin>
                                                {supportsEllipseUnits ? (
                                                    <InputFieldInlineWMargin
                                                        variant='outlined'
                                                        disabled={mappedFieldsDataGridSelection.length > 0}
                                                        select
                                                        size='small'
                                                        color='secondary'
                                                        value={ellipseUnit}
                                                        onChange={tacticalGridEllipseSelectedUnitChanged}
                                                        label='Unit'
                                                        autoComplete='off'
                                                    >
                                                        {[
                                                            'nautical miles',
                                                            'kilometers',
                                                            'miles',
                                                            'feet',
                                                            'meters',
                                                        ].map((ellipseUnit) => (
                                                            <MenuItem
                                                                key={ellipseUnit.replace(/\s/g, '')}
                                                                value={ellipseUnit.replace(/\s/g, '')}
                                                            >
                                                                {ellipseUnit}
                                                            </MenuItem>
                                                        ))}
                                                    </InputFieldInlineWMargin>
                                                ) : (
                                                    ''
                                                )}
                                            </>
                                        ) : (
                                            ''
                                        )}
                                    </>
                                ) : (
                                    ''
                                )}

                                {mappedFieldsDataGridSelection.length > 0 ? (
                                    <ActionButton
                                        onClick={handleDeleteFromFieldMappingDataGrid}
                                        variant='contained'
                                        color='secondary'
                                        disabled={
                                            (tacticalGridSelectedField === '' || smartDataField === '') &&
                                            mappedFieldsDataGridSelection.length < 1
                                        }
                                    >
                                        Delete Selected From Grid
                                    </ActionButton>
                                ) : (
                                    ''
                                )}
                                {mappedFieldsDataGridSelection.length === 0 ? (
                                    <ActionButton
                                        onClick={handleAddToMappingGrid}
                                        variant='contained'
                                        color='secondary'
                                        disabled={tacticalGridSelectedField === '' || smartDataField === ''}
                                    >
                                        Add New Mapping To Grid
                                    </ActionButton>
                                ) : (
                                    ''
                                )}

                                <StyledBox50PWideGrid>
                                    <Box>
                                        <Typography variant='subtitle2' align='left'>
                                            Mapped Fields
                                        </Typography>
                                    </Box>
                                    <DataGrid
                                        rows={missionState.tacticalGridToSMARTFieldMappings}
                                        columns={fieldMappingGridColumns}
                                        pageSize={8}
                                        checkboxSelection
                                        disableColumnFilter
                                        hideFooterSelectedRowCount
                                        loading={false}
                                        rowsPerPageOptions={[8]}
                                        onSelectionModelChange={fieldMappingDataGridSelectionChanged}
                                        selectionModel={mappedFieldsDataGridSelection}
                                    />
                                </StyledBox50PWideGrid>
                            </FieldGroup>
                        ) : (
                            ''
                        )}
                    </>
                ) : (
                    ''
                )}

                <FieldGroup>
                    <StyledBoxCategoryContainer>
                        <RecursiveTreeView
                            expandedNodes={[missionState.selectedCategory]}
                            categories={[...missionCategories.current]}
                            handleSelect={onChangeCategory}
                            nodes={categoryTree}
                            selectedNode={missionSelectedCategory.current}
                        />
                    </StyledBoxCategoryContainer>
                </FieldGroup>
            </WidgetContent>
        </WidgetContainer>
    );
};

export default MissionData;
