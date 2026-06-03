import React, { ChangeEvent, useContext, useEffect, useRef, useState } from 'react';
import { DialogTitle, DialogContent, DialogActions, Typography, InputLabel, MenuItem, FormControlLabel, Radio, RadioGroup, ListItem, Checkbox, ListItemIcon, ListItemText, List, Box, Button, keyframes, Autocomplete, TextField } from '@mui/material';
import { ActionButton } from '../../common';
import { StyledBackdrop, StyledStratLeadSearchDialog } from '../styles';
import { WidgetContent, InputLabelInline, FieldGroup, InputField, InlineSelect } from '../../common/styles';
import { ConfigHelper } from '../../../helpers/configHelper';
import {
    getAllSystemsFromDashboardData,
} from '../../../helpers/smartHelper';
import {
    ellipseFieldMapping
} from '../../../helpers/missionHelper';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import {
    StratLead,
    helperCreateEllipseLayerProto,
    helperDrawFeaturesOnDemandProto,
} from '../../widgets/layerEllipse/helpers/ellipseHelpers';
import SceneView from '@arcgis/core/views/SceneView';
import { ZoomToContext } from '../../../contexts/ZoomToLayerContext';
import TreeView from '@mui/lab/TreeView';
import TreeItem from '@mui/lab/TreeItem';
import SmartUpdateRecordDialog from './SmartUpdateRecordDialog';
import CaretRightIcon from 'calcite-ui-icons-react/CaretRightIcon';
import CaretDownIcon from 'calcite-ui-icons-react/CaretDownIcon';
import CubeIcon from 'calcite-ui-icons-react/CubeIcon';
import MapView from '@arcgis/core/views/MapView';
import queryFeaturesFromMapLayer from '../helpers/mapHelper';

import { 
    ChildRecord,
    parseSmartRecords,
    findAllSystemsInGroup,
    filterSystemsByRecordStatus,
    processTimeValues,
    filterSystemsByLastUpdated,
    createTreeeViewData,
} from '../helpers/smartFilterHelper';
import { stratLeadDialogResult } from './StratLeadFormElements';
import { useSnackbar } from 'notistack';

/**Setting for the tactical grid */
export interface IStratLeadSearchSettings {
    rowHeight: string;
    visibleRowCount: string;
}

/**
 * props for SmartFilterDialog widget
 */
interface SmartFilterDialogProps {
    onClose: () => void;
    open: boolean;
    container?: HTMLElement | null;
    tacticalGridDashboardId: string;
    tacticalGridLayer: FeatureLayer | undefined;
    view: SceneView | undefined | MapView;
    ellipseFieldMappings: Map<string, ellipseFieldMapping>;
}

/**
 * Widget for diplaying and filtering SMART heirarchical data in a TreeView.
 * @param props widget props
 * @returns JSX.Element
 */
const SmartFilterDialog = (props: SmartFilterDialogProps): JSX.Element => {
    const { 
        tacticalGridDashboardId, 
        container, 
        open, 
        onClose, 
        view, 
        tacticalGridLayer, 
        ellipseFieldMappings 
    } = props;
    const appConfig = ConfigHelper.getAppConfig();

    const {
        getDashboardDataUrl, //url/smart/smartSearch?dashboard_id=did&record_active=false
        smartDashboardFieldName,
        fetchGetParamsFromConfig,
        recordActive,
        recordActiveFieldName,
        smartGUID,
        smartRecordPathFieldName,
        smartLastUpdatedDateFieldName,
        smartRecordIdFieldName,
        smartRecordTypeFieldName,
        smartRecordVersionFieldName,
    } = appConfig.smart;

    const [allSystemsInMissionDashboard, setAllSystemsInMissionDashboard] = useState<any[]>([]);
    const [recordPathNameToRecord_Map, setRecordPathNameToRecord_Map] = useState<Map<string, any>>(new Map<string, any>());
    const [filteredRecordPathNameToRecord_Map, setFilteredRecordPathNameToRecord_Map] = useState<Map<string, any>>(new Map<string, any>());
    const [showUpdateForm, setShowUpdateForm] = useState(false);
    const [selectedSystem, setSelectedSystem] = useState<any | undefined>();
    const [systemsInGroup, setSystemsInGroup] = useState<any[]>([]);
    const [selectedNodeId, setSelectedNodeId] = useState('');
    const [ellipseLayer, setEllipseLayer] = useState<FeatureLayer>();
    const { addLayerToMapWithZoomAction } = useContext(ZoomToContext);
    const destroyHandleRef = useRef<IHandle>();
    const [resultData, setResultData] = useState<ChildRecord>();
    const [filteredResultData, setFilteredResultData] = useState<ChildRecord>();
    const [showDeployed, setShowDeployed] = useState(false);
    const [showAll, setShowAll] = useState(true);
    const [temporalFilter, setTemporalFilter] = useState(false);
    const [pathNameToRecordPathArray, setPathNameToRecordPathArray] = useState<Map<string, any[]>>(new Map<string, any[]>());
    const [enableApplyTemporalFilter, setEnableApplyTemporalFilter] = useState(true);
    const [timeUnits, setTimeUnits] = useState<string>('minutes');
    const [timeQty, setTimeQty] = useState(1);
    const [filterByLastUpdated, setFilterByLastUpdated] = useState(false);
    const [expandedIds, setExpandedIds] = useState<string[]>();
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => { 
        //all the systems in the mission dashboard
        getAllSystemsFromDashboardData(
            getDashboardDataUrl,
            tacticalGridDashboardId,
            smartDashboardFieldName,
            recordActive,
            recordActiveFieldName,
            fetchGetParamsFromConfig
        )
            .then((allSystemsInMissionDashboard) => {
                setAllSystemsInMissionDashboard(allSystemsInMissionDashboard);
            })
            .catch((error) => {
                console.error(error); //log out error object for on-site debugging
            });
    }, []);

    useEffect(() => { 
        if(allSystemsInMissionDashboard && allSystemsInMissionDashboard.length > 0){
            const results = parseSmartRecords(allSystemsInMissionDashboard, smartRecordPathFieldName);
            setRecordPathNameToRecord_Map(results.recordPathNameToRecord_Map);
            const dataResult = createTreeeViewData(results.recordPathArray);
            setExpandedIds(dataResult.expandedIds);
            setResultData(dataResult.rootChild);
            setPathNameToRecordPathArray(results.recordPathNameToRecordPathArray_Map);
            if(results.recordPathNameToRecord_Map.size < 1 ||
                results.recordPathNameToRecordPathArray_Map.size < 1){
                enqueueSnackbar('Error rendering treeview. See log for details.', { variant: 'error' });
            }
        }
    }, [allSystemsInMissionDashboard]);

    useEffect(() => { 
        if(view && tacticalGridLayer){
            createEllipseLayer();
        }
    }, [tacticalGridLayer, view]);

    useEffect(() => {
        if(showDeployed && !showAll){
            const dataResults = filterSystemsByRecordStatus(recordPathNameToRecord_Map, pathNameToRecordPathArray);
            setFilteredRecordPathNameToRecord_Map(dataResults.systemNameToSystem);
            setFilteredResultData(dataResults.dataResult.rootChild);
            setExpandedIds(dataResults.dataResult.expandedIds);
            if(!dataResults.dataResult?.rootChild.children || dataResults.dataResult.rootChild.children?.length < 1){
                enqueueSnackbar('No matching records were found.', { variant: 'info' });
            }
        }
    },[showDeployed, showAll])

    useEffect(() => {
        if(filterByLastUpdated){
            const date:Date = processTimeValues(timeQty, timeUnits);
            const results = filterSystemsByLastUpdated(
                recordPathNameToRecord_Map, 
                pathNameToRecordPathArray, 
                date,
                smartLastUpdatedDateFieldName);
            setEnableApplyTemporalFilter(false);
            setFilteredRecordPathNameToRecord_Map(results.pathSegmentMap);
            setFilteredResultData(results.dataResult.rootChild);
            setExpandedIds(results.dataResult.expandedIds);
            console.debug(date);
            console.debug(results.dataResult);
            console.debug(results.pathSegmentMap);
            setFilterByLastUpdated(false);
            if(!results.dataResult?.rootChild.children || results.dataResult.rootChild.children?.length < 1){
                enqueueSnackbar('No matching records were found.', { variant: 'info' });
            }
        }
    },[filterByLastUpdated])

    useEffect(() => {
        setEnableApplyTemporalFilter(true);
    },[timeUnits, timeQty])

    useEffect(() => {
        if(showAll){
            setFilteredResultData(undefined);
        }
    },[showAll])

    useEffect(() => {
        if(selectedNodeId){
            const system = recordPathNameToRecord_Map.get(selectedNodeId);
            if(system){
                setSelectedSystem(system);
                const group = system[smartRecordTypeFieldName];
                const isGroup = group === 'group' ? true : false;
                if(isGroup){
                    const systems = Array.from(recordPathNameToRecord_Map.values());
                    const updatedSystemsInGroup = findAllSystemsInGroup(
                        system.guid, 
                        systems, 
                        smartRecordIdFieldName,
                        smartRecordVersionFieldName,
                        smartGUID,
                        smartRecordPathFieldName);
                    setSystemsInGroup(updatedSystemsInGroup);
                }
                else{
                    setSystemsInGroup([]);
                }
                drawSelected([system]);
            }
            else{
                setSelectedSystem(undefined);
            }    
        }
    },[selectedNodeId])

    /**
     * Convert selected systems to StratLead objects
     * @param selectedSystems system asssociated with the selected node in the treeview
     * @returns array of stratleads as any[]
     */
    const convertSelectedToStratLead = (selectedSystems:any[]):any[] => {
        const semiMajor = ellipseFieldMappings.get('semi-major');
        const semiMinor = ellipseFieldMappings.get('semi-minor');
        const stratLeads:any[] = selectedSystems.map(system => {
            return {
                semiMajor: system['record_location_semi_major'],
                semiMinor: system['record_location_semi_minor'],
                azimuth: system['record_location_orient'],
                semiMajorUnit: semiMajor ? semiMajor?.units : 'meters',
                semiMinorUnit: semiMinor ? semiMinor.units : 'meters',
                latitude: Number(system['record_location_latitude']),
                longitude: Number(system['record_location_longitude']),
                recordId: system['record_id'],
             } as any
        });
        return stratLeads;
    } 

    /**
     * Draw ellipse
     * @param selected selected treenode
     */
    async function drawSelected(selected:any[]){
        const stratLeads:StratLead[] = convertSelectedToStratLead(selected);
        await helperDrawFeaturesOnDemandProto(
            stratLeads,
            view,
            ellipseLayer
        );
        zoomToFeature(selected[0]);
    }

    /**
     * create ellipse layer
     */
    function createEllipseLayer() {
        if (tacticalGridLayer) {
            if (!ellipseLayer && view) {
                const newLayer = helperCreateEllipseLayerProto(tacticalGridLayer, view);
                view.map?.add(newLayer);
                newLayer.when(() => {
                    setEllipseLayer(newLayer);
                    if (view) {
                        addLayerToMapWithZoomAction(view, newLayer);
                    }
                });
                destroyHandleRef.current = newLayer.on('layerview-destroy', () => {
                    setEllipseLayer(undefined);
                });
            }
        }
    }

     /**
     * Zoom and pan map to the feature selected in the tactical grid
     * @param objectid oid of the selected tactical grid feature
     */
     const zoomToFeature = async (data: any) => {
        if(ellipseLayer && view){
            const recordId = data['record_id'];
            const results = await queryFeaturesFromMapLayer(recordId, ellipseLayer, 'recordId');
            results && results.features.length > 0 &&
                view.goTo(results.features, { speedFactor: appConfig.panningSpeed }).then(() => {
                    view.scale = appConfig.tacticalGrid.zoomViewScale;
                });  
        } 
    };

    /**
     * Handle tree node click event
     */
    const updateSelectedTreeItemClickHandler = async () => {
        try {
            const system = recordPathNameToRecord_Map.get(selectedNodeId);
            if(system){
                setSelectedSystem(system);
                const group = system[smartRecordTypeFieldName];
                const isGroup = group === 'group' ? true : false;
                if(isGroup){
                    const systems = Array.from(recordPathNameToRecord_Map.values());
                    const updatedSystemsInGroup = findAllSystemsInGroup(
                        system.guid, 
                        systems,
                        smartRecordIdFieldName, 
                        smartRecordVersionFieldName,
                        smartGUID,
                        smartRecordPathFieldName,);
                    setSystemsInGroup(updatedSystemsInGroup);
                }
                else{
                    setSystemsInGroup([]);
                }
            }

            setShowUpdateForm( val => !val);
        } catch (error) {
            console.error(error);
        }
    };

    /**
     * Handle dialog closing due to cancel button being clicked. Generic for now.
     */
    const handleDialogClose = () => {
        if(ellipseLayer){
            ellipseLayer.destroy();
        }
        if (destroyHandleRef && destroyHandleRef.current) {
            destroyHandleRef.current.remove();
        }
        onClose();
    };

    /**
     * Handle the treenode select event
     * @param event treenode selection event
     * @param nodeId id of the selected node
     */
    const handleTreeViewNodeSelect = (event: React.SyntheticEvent, nodeId: string) => {
        setSelectedNodeId(nodeId);
    }
 
    /**
     * Handle dialog close event
     */
    const closeSmartUpdateDialog = (result: stratLeadDialogResult) => {
        if (result.success) {
            enqueueSnackbar(result.message, { variant: 'success' });
        } else {
            result.status === 'warning' && enqueueSnackbar(result.message, { variant: 'warning' });
            result.status === 'info' && enqueueSnackbar(result.message, { variant: 'info' });
            result.status === 'error' && enqueueSnackbar(result.message, { variant: 'error' });
        }
        setShowUpdateForm(false);
    };

    /**
     * Handle radio element change event.
     * @param event change event
     */
    function onRadioFilterChangeHandler(event: ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        if(value === 'showAll'){
            setShowAll(true);
            setShowDeployed(false);
            setTemporalFilter(false);
        }
        else if (value === "showDeployed"){
            setShowDeployed(true);
            setTemporalFilter(false)
            setShowAll(false)
        }
        else if(value === 'temporalFilter'){
            setTemporalFilter(true);
            setShowAll(false);
            setShowDeployed(false);
            setFilterByLastUpdated(true);
        }
    }

    /**
     * Render the nodes in the treeview
     * @param node ChildRecord
     * @returns TreeView
     */
    const renderTree = (node:ChildRecord) => (
        <TreeItem key={node.id} nodeId={node.id} label={
            <Box sx={{display:'flex', alignItems: 'center'}}>
                <Typography variant="body1" sx={{fontSize:'1.33rem', paddingRight:'10px'}}>
                    {node.name}
                </Typography>
                { showAll && recordPathNameToRecord_Map.get(node.name) &&
                    <CubeIcon size={12} />
                }
                { !showAll && filteredRecordPathNameToRecord_Map.get(node.name) &&
                    <CubeIcon size={12} />
                }
            </Box>
        }>
            {Array.isArray(node.children) ? node.children.map((childNode) => renderTree(childNode)) : null}
        </TreeItem>
    )

    /**
     * handle time quantity input change
     */
    const updateTimeQty = (event: any) => {
        setTimeQty(Math.abs(event.target.value));
    }

    /**
     * handle apply time filter change
     */
    const handleApplyTimeFilter = () => {
        setFilterByLastUpdated(true);
    };
 
    return (
        <StyledStratLeadSearchDialog
            open={open}
            container={container}
            BackdropComponent={StyledBackdrop}
            fullWidth={true}
            maxWidth={'md'}
        >
            <DialogTitle>
                <Typography variant='h5'>
                    SMART Search
                </Typography>
            </DialogTitle>
            <DialogContent>
                <WidgetContent>
                    <div>
                    <FieldGroup $bottomgutter>
                        <InputLabel>Filter Systems By</InputLabel>
                        <RadioGroup name='loopRadioButton' onChange={onRadioFilterChangeHandler} row>
                            <FormControlLabel
                                control={<Radio />}
                                label='No Filter'
                                value='showAll'
                                title='Show all systems.'
                                checked={showAll}
                            ></FormControlLabel>
                            <FormControlLabel
                                control={<Radio />}
                                label='StratLead Issued'
                                value='showDeployed'
                                title='Show only deployed systems.'
                                checked={showDeployed}
                            ></FormControlLabel>
                            <FormControlLabel
                                control={<Radio />}
                                label='Last Updated'
                                value='temporalFilter'
                                title='Filter based on last updated.'
                                checked={temporalFilter}
                            ></FormControlLabel>
                            
                        </RadioGroup>
                    </FieldGroup>
                    { temporalFilter && 
                        <FieldGroup hidden={false}>
                            <InputField
                                variant='outlined'
                                size='small'
                                min={1}
                                max={200}
                                color='secondary'
                                type='number'
                                placeholder={'Time Quantity'}
                                title={'Time Quantity'}
                                onChange={updateTimeQty}
                                value={timeQty ? timeQty : ' '}
                            />
                            <InlineSelect
                                variant='outlined'
                                color='secondary'
                                onChange={(evt: ChangeEvent<{ name?: string; value: string }>) => {
                                    setTimeUnits(evt.target.value as string);
                                }}
                                value={timeUnits ? timeUnits : 'minutes'} 
                            >
                                <MenuItem value='minutes'>Minutes</MenuItem>
                                <MenuItem value='hours'>Hours</MenuItem>
                                <MenuItem value='days'>Days</MenuItem>
                                <MenuItem value='weeks'>Weeks</MenuItem>
                            </InlineSelect>
                            <ActionButton
                                sx={{marginLeft:'15px'}}
                                color='secondary'
                                variant='contained'
                                onClick={handleApplyTimeFilter}
                                disabled={!enableApplyTemporalFilter}
                            >
                                Apply Filter
                            </ActionButton>
                        </FieldGroup>
                    }
                      
                        {expandedIds &&
                        <TreeView
                            defaultExpandIcon={<CaretRightIcon />}
                            defaultCollapseIcon={<CaretDownIcon />}
                            defaultExpanded={expandedIds} 
                            sx={{minHeight:'500px', minWidth:"50%", marginTop: '15px'}}
                            onNodeSelect={handleTreeViewNodeSelect}
                        >
                            {
                                filteredResultData && 
                                    renderTree(filteredResultData) 
                            }
                            {
                                !filteredResultData && resultData &&
                                    renderTree(resultData)
                            }
                        </TreeView> }
                        {
                            showUpdateForm &&
                            <SmartUpdateRecordDialog
                                onClose={closeSmartUpdateDialog}
                                open={true}
                                dialogTitle={'Update SMART Data'}
                                container={container}
                                additonalFieldsToAdd={[...appConfig.smart.smartExtraSystemFieldsToAddToForm]}
                                tacticalGridDashboardId={tacticalGridDashboardId}
                                semiMajorFieldName={'record_location_semi_major'}
                                semiMinorFieldName={'record_location_semi_minor'}
                                radiusFieldName={'record_location_radius'}
                                selectedSystem={selectedSystem}
                                systemsInGroup={systemsInGroup}
                                allSystemsInMissionDashboard={allSystemsInMissionDashboard}
                         />
                        }''
                    </div>
                </WidgetContent>
            </DialogContent>
            <DialogActions>
                <InputLabelInline> 
                    <Typography variant='caption'></Typography>
                </InputLabelInline>
                <ActionButton
                    color='secondary'
                    variant='contained'
                    onClick={updateSelectedTreeItemClickHandler}
                    disabled={!selectedSystem}
                >
                    Update Selected
                </ActionButton>
                <ActionButton color='secondary' variant='contained' onClick={handleDialogClose}>
                    Close
                </ActionButton>
            </DialogActions>
        </StyledStratLeadSearchDialog>
    );
};
export default SmartFilterDialog;