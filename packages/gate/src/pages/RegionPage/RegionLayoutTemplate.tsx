import React, { useEffect, useState } from 'react';
import '../../assets/dark.css';
import RegionTabView from './RegionTabView';
import { useDispatch, useSelector } from 'react-redux';
import { setRegionName } from './RegionSlice';
import { AppDispatch, RootState } from '../../data/store';
import { useRegionAppData } from '../../hooks/useRegionAppData';
import { useSearchParams } from 'react-router-dom';
import { CenterBox } from './MuiBoxStyles';
import { setActiveViewType, setViewObjPortalItemId } from '../../features/Map/MapViewSlice';
import { Snackbar } from '@mui/material';
import './RegionPage.css';
import LandingPageBranding from '../LandingPage/LandingPageBranding';
import { findAppByKeywordAndType, retrieveRegionItemData } from '@stratcom/lib-functions';
import { OpsClockDataSerializable } from '@stratcom/react-widget-lib/types/OpsClockWidgetLib';
import { setLayoutModel, setLayoutModelJson } from './ToolbarSlice';
import * as FlexLayout from 'flexlayout-react';

/**Function is the endpoint for the route region/:regionId/:viewType. It is the parent of the regions page.
 * It is expected that a region identifier will be passed in the URL
 * Routes without a URL parameter should load the landing page
 * Routes with a URL of region/:viewType should go to RunPresentationMode
 */
const RegionLayoutTemplate = (): JSX.Element => {
    const dispatch: AppDispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const regionId = searchParams.get('regionId');
    const appConfig = useSelector((state: RootState) => state.applicationSlice.applicationConfig);
    const webSceneToMissionNameMappings = useSelector((state: RootState) => state.mapViewSlice.websceneMappings);
    const portalUrl = useSelector((state: RootState) => state.applicationSlice.applicationConfig.portalUrl);
    const gateTypeKeywords = useSelector((state: RootState) => state.applicationSlice.gateRegionAppTypeKeywords);
    const [clocks, setClocks] = useState<OpsClockDataSerializable[]>([]);

    let viewType: string | null = searchParams.get('viewType');
    if (viewType !== '2d' && viewType !== '3d' && viewType !== '2D' && viewType !== '3D') {
        console.error(`Wrong view type in query string: ${viewType} is not value.`);
        viewType = null;
    }

    const { isLoadingAppData, appDataError } = useRegionAppData();

    useEffect(() => {
        if (webSceneToMissionNameMappings && webSceneToMissionNameMappings.length > 0 && regionId) {
            const currentMapping = webSceneToMissionNameMappings.find((mapping) => mapping.missionName === regionId);
            dispatch(
                setViewObjPortalItemId({
                    id: currentMapping?.scenePortalItemId,
                    name: currentMapping?.missionName,
                })
            );
        }
    }, [webSceneToMissionNameMappings, regionId]);

    useEffect(() => {
        if (regionId && dispatch) {
            dispatch(setRegionName(regionId)); //update state slice regionId
        }
    }, [regionId, dispatch]);

    useEffect(() => {
        if (viewType && dispatch) {
            const type = viewType === '2D' || viewType === '2d' ? 'MAP' : 'SCENE';
            dispatch(setActiveViewType(type)); //update slice regionId
        }
    }, [viewType, dispatch]);

    useEffect(() => {
        // if gate is configured and there is data then get the data for the form.
        if (regionId) {
            updateSelectedRegionData(portalUrl, gateTypeKeywords, regionId);
        }
    }, [regionId]);

    /**Display any error message returned from useRegionAppData */
    function showError() {
        return <CenterBox>Error Loading Application Configuration.</CenterBox>;
    }

    /**
     * update the associated data for the current region -- called every time a new region is designated
     * updates the ops clock viewer for the region
     * @param portalUrl url to the portal
     * @param gateTypeKeywords gate typekeywords for application searches
     * @param regionName name of the current region
     */
    async function updateSelectedRegionData(portalUrl: string, gateTypeKeywords: string, regionName: string) {
        let resultsFindAllApps: any;
        if (portalUrl) {
            resultsFindAllApps = await findAppByKeywordAndType(portalUrl, gateTypeKeywords, appConfig.oauthAppId);
        }
        let selectedRegionApp: any | undefined;
        if (portalUrl) {
            selectedRegionApp = resultsFindAllApps?.results.find((result: any) => result.title === regionName);
            if (selectedRegionApp) {
                const itemData = await retrieveRegionItemData(selectedRegionApp?.id, portalUrl, appConfig.oauthAppId);
                if (itemData) {
                    setClocks(itemData.opsClocks);
                    // updates json layout when switching regions
                    if (itemData.jsonLayout) {
                        const formattedJsonLayout = JSON.parse(itemData.jsonLayout.regionModelLayoutJson);
                        const model = FlexLayout.Model.fromJson(formattedJsonLayout);
                        dispatch(setLayoutModelJson(formattedJsonLayout));
                        dispatch(setLayoutModel(model));
                    }
                }
            }
        }
    }

    return (
        <div className='region-container'>
            {appDataError && showError()}
            {regionId && regionId !== 'No Id Set' ? (
                <>
                    <LandingPageBranding clocks={clocks} />
                    <RegionTabView regionId={regionId} viewType={viewType} />
                </>
            ) : (
                <div>Id not set</div>
            )}
            <Snackbar
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                open={isLoadingAppData}
                message='Loading Application Configuration...'
            />
        </div>
    );
};

export default RegionLayoutTemplate;
