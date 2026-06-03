import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { addRegionSlices, IRegionSlice } from '../pages/RegionPage/RegionSlice';
import { RootState } from '../data/store';
import { useAppSelector } from './hooks';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../data/store';

function createDataItem(regionName: string, mission_id: string, sceneId: string): IRegionSlice {
    return {
        regionName: regionName,
        regionId: mission_id,
        portalMapItemId3D: sceneId,
        regionTitle: 'BarBar Two',
        regionDefaultMapUrl: '',
        customTools: [{ id: 'custom tool two' }],
        customTabs: [
            {
                name: 'custom tab two',
                url: 'url to item',
            },
        ],
        countWidgetProps: {
            featureClassUrl: 'counts 2 URL',
        },
        trendsWidgetProps: {
            featureClassUrl: 'trends 2 URL',
        },
        regionJsonModel: undefined,
    };
}

/**Shape of the return object when useRegionAppData is done processing,
 * this interface is used for other custom hook workflows that fetch and return data
 */
interface IStatus {
    /**Indicates if loading is still in progress */
    isLoadingAppData: boolean;

    /**Holds the error object if the fetch fails */
    appDataError?: Error;

    /**The return data array within the object*/
    regionSliceData?: IRegionSlice[];
}

/**Extends the IStatus with a method to re-fetch data when needed */
export interface IRegionsAppData extends IStatus {
    refreshRegionAppData: () => void;
}

/**Custom hook for fetching data required to run and display the Regions view */
export function useRegionAppData(): IRegionsAppData {
    const landingPageData = useAppSelector((state) => state.landingPage.landingPageItems);
    const [status, setStatus] = useState<IStatus>({ isLoadingAppData: false });
    const [portalUrl, setPortalUrl] = useState<string>();
    const [portalAppId, setPortalAppId] = useState<string>();
    const appConfig = useSelector((state: RootState) => state.applicationSlice.applicationConfig);
    const regionSlices = useSelector((state: RootState) => state.regionSlice.regionSlices);
    const dispatch: AppDispatch = useDispatch();
    const sceneMappings = useAppSelector((state) => state.mapViewSlice.websceneMappings);

    useEffect(() => {
        if (appConfig) {
            setPortalUrl(appConfig.portalUrl);
            setPortalAppId('appConfig.portalItemAppDataId'); //will revisit this param later
        }
    }, [appConfig]);

    const [regionAppData, setRegionAppData] = useState<IRegionSlice[]>([]);

    useEffect(() => {
        if (regionAppData.length > 0) {
            returnAppData();
        }
    }, [regionAppData]);

    useEffect(() => {
        if (portalAppId && portalUrl && landingPageData && regionSlices && regionSlices.length === 0) {
            setStatus({ isLoadingAppData: true });
            if (landingPageData.regionCards.length > 0 && regionSlices.length !== landingPageData.regionCards.length) {
                addSceneIdToAppData(landingPageData, portalUrl).then((data) => {
                    setRegionAppData(data);
                    setStatus({ isLoadingAppData: true });
                });
            }
        }
        if (regionSlices && regionSlices.length > 0) {
            setRegionAppData(regionSlices);
        }
    }, [portalUrl, portalAppId, landingPageData]);

    /**
     * Get the region/mission scene and set it into the state object
     * @param regionAppData date from the Regions feature class being pulled from the regions state slice
     * @param portalUrl url to portal
     */
    async function addSceneIdToAppData(regionAppData: any, portalUrl: string): Promise<any> {
        let regionData: any[] = [];
        await Promise.all(
            regionAppData.regionCards.map(async (card: any) => {
                if (card.mission_id) {
                    const sceneRef = sceneMappings.find((scene) => scene.missionName === card.regionName);
                    let dataItem = createDataItem(
                        card.regionName,
                        card.mission_id ? card.mission_id : '',
                        sceneRef ? sceneRef.scenePortalItemId : ''
                    );
                    console.debug(`sceneID: ${sceneRef}`);
                    regionData.push(dataItem);
                }
            })
        );
        dispatch(addRegionSlices(regionData));
        return regionData;
    }
    /**
     * Fetch the config data for this regionId using the portalItemId
     */
    async function returnAppData() {
        //will use this later: next task
        console.debug(`regionAppData: ${regionAppData}`);
        setStatus({ isLoadingAppData: false, regionSliceData: regionAppData });
    }

    /**
     * Re-fetch the data.
     */
    const refreshRegionAppData = function () {
        setStatus({ isLoadingAppData: true, regionSliceData: [] });
        returnAppData();
    };

    return { ...status, refreshRegionAppData };
}
