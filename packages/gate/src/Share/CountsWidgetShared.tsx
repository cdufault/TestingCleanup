import React, { useEffect, useMemo, useState }  from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../data/store';
import { CountWidgetLib } from '@stratcom/react-widget-lib';
import { setCountWidgetInitialized } from '../features/Map/MapViewSlice';
import { CountLayersCache, LayerCacheObj  } from '@stratcom/lib-functions';

/**Counts widget initial template, will likely need props to support this widget as a shared library item */
export const CountsWidgetShared = (): JSX.Element => {
    const portalUrl = useSelector((state: RootState) => state.applicationSlice.applicationConfig.portalUrl);
    const gateTypeKeywords = useSelector((state: RootState) => state.applicationSlice.gateRegionAppTypeKeywords);
    const currentDisplayMode = useSelector((state: RootState) => state.applicationSlice.regionDisplayMode);
    const categoryRowColors = useSelector(
        (state: RootState) => state.applicationSlice.applicationConfig.countWidgetRowColors
    );
    /**regionName should map to the name of the region and the regionName param in the JSON def that is
     * stored on the group/mission application object
     */
    const landingPageAppData = useSelector((state:RootState) => state.landingPage.appData); 
    const regionName = useSelector((state: RootState) => state.regionSlice.regionName);
    const useCachedFtrLayer = useSelector((state: RootState) => state.applicationSlice.applicationConfig.useClientSideFeatures);
    const countWidgetInitialized = useSelector((state: RootState) => state.mapViewSlice.countsWidgetInitialzied);
    const dispatch: AppDispatch = useDispatch();

    const [appData,] = useState<any>(landingPageAppData);
    const appConfig = useSelector((state: RootState) => state.applicationSlice.applicationConfig);
   
    const countsLoaded =  () => {
        if (!countWidgetInitialized) {
            dispatch(setCountWidgetInitialized(true));
        }
    }

    const lastUpdatedFieldName = useSelector(
        (state: RootState) => state.applicationSlice.applicationConfig.lastUpdatedFieldName
    );
    const executeCountQueriesSequentially = useSelector(
        (state: RootState) => state.applicationSlice.applicationConfig.executeCountQueriesSequentially
    );
    
    /**retrieve the cached layer object for this mission if it is present */
    const FindCachedFtrLayerObjs = () => {
        if(useCachedFtrLayer){
            let cachedLayerObjs = CountLayersCache.getCountLayerObjs(regionName);
            return cachedLayerObjs;
        }
    }

    const FindRegionData = () => {
        const v = appData?.find((data:any) => {
            if(data.key === regionName){
                return data.value;
            }
        })
        return v;
    }
    const regionData:any = useMemo(() => FindRegionData(),[regionName]);
    const cachedFeatureLayerObjs:LayerCacheObj[] | undefined = useMemo(() => FindCachedFtrLayerObjs(), [useCachedFtrLayer]);

    return (
        <>
            <CountWidgetLib
                portalUrl={portalUrl}
                gateTypeKeywords={gateTypeKeywords}
                currentDisplayMode={currentDisplayMode}
                categoryRowColors={categoryRowColors}
                regionName={regionName}
                countsCallbackFunc={countsLoaded}
                appData={regionData?.value}
                lastUpdatedFieldName={lastUpdatedFieldName}
                executeCountQueriesSequentially={executeCountQueriesSequentially}
                cachedFeatureLayer={cachedFeatureLayerObjs}
                oauthAppId={appConfig.oauthAppId}
            />
        </>
    );
};
