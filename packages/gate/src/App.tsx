import React, { useEffect } from 'react';
import LandingPage from './pages/LandingPage/LandingPage';
import Missing from './pages/MissingPage/Missing';
import RegionLayoutTemplate from './pages/RegionPage/RegionLayoutTemplate';
import ErrorPage from './pages/ErrorPage/ErrorPage';
import { RunPresentationMode } from './pages/RegionPage/RunPresentationMode';
import { Route, Routes } from 'react-router-dom';
import Layout from './features/Layout/Layout';
import { useLandingPageData } from './hooks/useLandingPageData';
import { useSelector } from 'react-redux';
import { RootState } from './data/store';
import { setError, setLandingPageItems } from './pages/LandingPage/landingPageSlice';
import ConfigurationPage from './pages/ConfigurationPage/ConfigurationPage';
import { useAppDispatch } from './hooks/hooks';
import { CountLayersCache } from '@stratcom/lib-functions';
import { SnackbarProvider } from 'notistack';

export default function App() {
    /**load resources that nested routes loaded directly into the browser URL will need */
    const { landingPageData, appDataError } = useLandingPageData();
    const dispatch = useAppDispatch();
    const lastUpdatedFieldName = useSelector(
        (state: RootState) => state.applicationSlice.applicationConfig.lastUpdatedFieldName
    );

    const useClientSideFeatures = useSelector(
        (state: RootState) => state.applicationSlice.applicationConfig.useClientSideFeatures
    );
    const dataCacheUpdateFrequencyInSeconds = useSelector(
        (state: RootState) => state.applicationSlice.applicationConfig.clientSideDataCacheUpdateFrequencyInSeconds
    );
    const applicationLoading = useSelector((state: RootState) => state.applicationSlice.applicationLoading);

    useEffect(() => {
        if (landingPageData) {
            dispatch(setLandingPageItems(landingPageData));
        }
        if (appDataError) {
            dispatch(setError(appDataError));
        }
    }, [landingPageData]);

    //moved the update interval to the uselandingPageData.tsx to support landing page updates when running in presentation mode

    useEffect(() => {
        if (!applicationLoading) {
            console.log('application loading completed');
            if (useClientSideFeatures) {
                CountLayersCache.processAllConfigs(lastUpdatedFieldName, dataCacheUpdateFrequencyInSeconds);
                CountLayersCache.start();
            }
        }
    }, [applicationLoading]);
    return (
        <div>
            <SnackbarProvider />
            <Routes>
                <Route path='/' element={<Layout />}>
                    <Route index element={<LandingPage />} />
                    <Route path='presentation' element={<RunPresentationMode />} />
                    <Route path='region' element={<RegionLayoutTemplate />} />
                </Route>
                <Route path='error' element={<ErrorPage />} />
                <Route path='popout.html' element={<></>} />
                <Route path='configuration' element={<ConfigurationPage />} />
                <Route path='*' element={<Missing />} />
            </Routes>
        </div>
    );
}
