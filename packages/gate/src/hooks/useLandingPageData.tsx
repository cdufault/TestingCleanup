import {
    findAppByKeywordAndType,
    regionQueryResult,
    retrieveRegionItemData,
    CountLayersCache,
    IRegionSummary,
} from '@stratcom/lib-functions';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../data/store';
import { queryCategories, queryRegions, queryRegionSummary } from '../pages/LandingPage/LandingPageHelper';
import { ILandingPageItems, setLandingPageApps } from '../pages/LandingPage/landingPageSlice';
import { useAppSelector } from './hooks';
import { SceneMapping, setWebsceneMappings } from '../features/Map/MapViewSlice';
import { setApplicationLoading } from '../ApplicationSlice';
import { getRegionGlobalIdFromFtrClass } from '../Share/TrendsWidgetHelper';

/**
 * Shape of the return object when useLandingPageData is done processing,
 */
interface IStatus {
    /**Indicates if loading is still in progress */
    isLoadingAppData: boolean;

    /**Holds the error object if the fetch fails */
    appDataError?: Error;

    /**The return data array within the object*/
    landingPageData?: ILandingPageItems;
}

/**Extends the IStatus with a method to re-fetch data when needed */
export interface ILandingPageAppData extends IStatus {
    refreshRegionAppData: () => void;
}

/**Custom hook for fetching data required to run and display the landing page region cards view */
export function useLandingPageData(): ILandingPageAppData {
    const [status, setStatus] = useState<IStatus>({ isLoadingAppData: false });
    const [portalUrl, setPortalUrl] = useState<string>();
    const appConfig = useSelector((state: RootState) => state.applicationSlice.applicationConfig);
    const dynamicConfig = useSelector((state: RootState) => state.applicationSlice.gateDynamicConfig);
    const gateTypeKeywords = useSelector((state: RootState) => state.applicationSlice.gateRegionAppTypeKeywords);
    const gateConfigured = useAppSelector((state) => state.applicationSlice.gateConfigured);
    const dispatch: AppDispatch = useDispatch();
    const landingPageUpdateIntervalInMinutes = useAppSelector(
        (state: RootState) => state.applicationSlice.gateDynamicConfig.landingPageUpdateIntervalInMinutes
    );

    /**maps Key:mission_name  | value:application_data  - and is cached until the update interval fires*/
    const [appDataMapFinal, setAppDataMapFinal] = useState<any[] | undefined>();

    useEffect(() => {
        if (appConfig && !portalUrl) {
            setPortalUrl(appConfig.portalUrl);
        }
    }, [appConfig]);

    useEffect(() => {
        if (gateConfigured && portalUrl && landingPageUpdateIntervalInMinutes > -1) {
            if (portalUrl && dynamicConfig) {
                setStatus({ isLoadingAppData: true });
                getLandingPageData();
            }
        }
    }, [portalUrl, dynamicConfig, landingPageUpdateIntervalInMinutes]);

    useEffect(() => {
        let interval: NodeJS.Timer | undefined = undefined;
        if (appDataMapFinal && appDataMapFinal.length > 0 && landingPageUpdateIntervalInMinutes > -1) {
            interval = setInterval(refreshRegionAppData, (landingPageUpdateIntervalInMinutes as number) * 60 * 1000);
        }
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [appDataMapFinal]);

    /**
     * Retrieve the config data for this regionId using the portalItemId
     */
    async function getLandingPageData() {
        if (!dynamicConfig.regionFeatureClassId || !dynamicConfig.landingPageCategoriesFeatureClassId) {
            let obj = {
                regionFClassId: dynamicConfig.regionFeatureClassId,
                categoryFClassId: dynamicConfig.landingPageCategoriesFeatureClassId,
            };
            let message = 'Missing dynamicConfig item ids.';
            console.error(`${message} See attached object.`, obj);
            let data: ILandingPageItems = {
                regionCards: [],
            };
            const error = new Error(message + JSON.stringify(obj));
            console.error('Error loading landing page data.', error);
            setStatus({ isLoadingAppData: false, landingPageData: data, appDataError: error });
            return;
        }

        const appDataMap: any[] = [];
        let sceneMappings: SceneMapping[] = [];
        let regionCards: any[] = [];
        let regions: regionQueryResult[] = [];
        await queryRegions(dynamicConfig.regionFeatureClassId).then((result) => {
            regions = result;
        });

        let resultsFindAllApps: any;
        if (portalUrl) {
            resultsFindAllApps = await findAppByKeywordAndType(portalUrl, gateTypeKeywords, appConfig.oauthAppId);
            console.debug('resultsFindAllApps', resultsFindAllApps);
        }

        await Promise.all(
            regions.map(async (region) => {
                //TODO: convert to a for loop to execute queries sequentially
                let positionOnPage = 999;
                let rows: any[] = [];
                let selectedRegionApp: any | undefined;
                if (portalUrl) {
                    selectedRegionApp = resultsFindAllApps?.results.find(
                        (result: any) => result.title === region.region_name
                    );
                    console.debug('selectedRegionApp', selectedRegionApp);
                    if (selectedRegionApp) {
                        ///TODO get all ids on a single query and find per region
                        const globalId = await getRegionGlobalIdFromFtrClass(
                            region.mission_id,
                            dynamicConfig.regionFeatureClassId
                        );
                        //data needed for ordering cards and card items located on the application object
                        const itemData = await retrieveRegionItemData(
                            selectedRegionApp?.id,
                            portalUrl,
                            appConfig.oauthAppId
                        );
                        sceneMappings.push({
                            missionName: region.region_name.trim(),
                            scenePortalItemId: itemData.defaultViewId ? itemData.defaultViewId : '',
                        });
                        const appData = itemData?.appData;
                        appData.appId = selectedRegionApp?.id;
                        appData.regionFtrClassGlobalId = globalId;
                        appData.columnCardHeaders = itemData?.GateRegionCardColumnHeaders;

                        CountLayersCache.addConfig(region.region_name.trim(), appData);

                        appDataMap.push({ key: region.region_name.trim(), value: appData });

                        positionOnPage = appData?.positionOnLandingPage ? appData.positionOnLandingPage : 99; //reversed sort
                        rows = appData?.rows ? appData.rows : [];

                        const regionSummary: IRegionSummary | undefined = await queryRegionSummary(
                            dynamicConfig.analystCommentsFeatureClassId,
                            region.guid
                        );
                        await queryCategories(
                            dynamicConfig.landingPageCategoriesFeatureClassId,
                            region.guid,
                            portalUrl,
                            gateTypeKeywords,
                            region.region_name,
                            appConfig.oauthAppId
                        )
                            .then((result: any) => {
                                let newMappings = result.map((res: any) => {
                                    let appDataRow = rows.find((row: any) => row.rowLabel === res.category);
                                    let position = appDataRow ? appDataRow.positionInTable : 99; //reversed sort
                                    return {
                                        id: res.region_guid,
                                        category: res.category,
                                        catLevel: res.category_level,
                                        catConfidence: res.category_confidence,
                                        catComments: res.comment,
                                        positionOnCard: position,
                                        icodDate: res.icod,
                                    };
                                });
                                regionCards.push({
                                    regionName: region.region_name.trim(),
                                    regionCardRows: newMappings,
                                    summaryStatement: regionSummary ? regionSummary.summary : '',
                                    summaryIcod: regionSummary ? regionSummary.icod : undefined,
                                    mission_id: region.mission_id,
                                    positionOnPage: positionOnPage,
                                });
                            })
                            .catch((error: any) => {
                                console.error('Error querying categories: ', error);
                            });
                    } else {
                        console.error(`Failed to find an app for the selected region: ${region.region_name}`);
                    }
                } //end if portalURL
            }) //end map
        ); //end promise all
        const data: ILandingPageItems = {
            regionCards: regionCards,
        };
        if (regionCards.length > 0 && sceneMappings.length > 0) {
            dispatch(setWebsceneMappings(sceneMappings));
        } else {
            console.log('no region cards');
            dispatch(setApplicationLoading(false));
        }
        dispatch(setLandingPageApps(appDataMap));
        setAppDataMapFinal(appDataMap);
        setStatus({ isLoadingAppData: false, landingPageData: data, appDataError: undefined });
    }

    /**
     * Re-fetch the data.
     */
    const refreshRegionAppData = function () {
        setStatus({ isLoadingAppData: true, landingPageData: undefined });
        getLandingPageData();
    };

    return { ...status, refreshRegionAppData };
}
