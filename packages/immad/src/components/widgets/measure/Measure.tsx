// React imports
import React, { useContext, useEffect, useRef, useState } from 'react';

// Context imports
import { MapContext } from '../../../contexts/Map';

// Component imports
import { Tab, Tabs } from '@mui/material';
import DistanceMeasurement2D from '@arcgis/core/widgets/DistanceMeasurement2D';
import AreaMeasurement2D from '@arcgis/core/widgets/AreaMeasurement2D';
import DirectLineMeasurement3D from '@arcgis/core/widgets/DirectLineMeasurement3D';
import AreaMeasurement3D from '@arcgis/core/widgets/AreaMeasurement3D';

import { ActionButton, WidgetContainer, WidgetHeader } from '../../common';
import { getPortalUserProperties, ImmadDisplaySettings, UserProperties } from '../../../helpers/portalUsersHelper';

import { MeasureWidgetContent } from './styles';

function Measure(): JSX.Element {
    const mapLineMeasureRef = useRef<HTMLDivElement>(null);
    const mapAreaMeasureRef = useRef<HTMLDivElement>(null);
    const sceneLineMeasureRef = useRef<HTMLDivElement>(null);
    const sceneAreaMeasureRef = useRef<HTMLDivElement>(null);
    const [userProperties, setUserProperties] = useState<UserProperties>();

    const [tabValue, setTabValue] = useState(0);
    const [hasLine, setHasLine] = useState(false);
    const [hasArea, setHasArea] = useState(false);
    const [mapLineMeasure, setMapLineMeasure] = useState<DistanceMeasurement2D>();
    const [mapAreaMeasure, setMapAreaMeasure] = useState<AreaMeasurement2D>();
    const [sceneLineMeasure, setSceneLineMeasure] = useState<DirectLineMeasurement3D>();
    const [sceneAreaMeasure, setSceneAreaMeasure] = useState<AreaMeasurement3D>();

    const { mapViewInitialized, sceneViewInitialized, activeView, getMapView, getSceneView, activeEditor } =
        useContext(MapContext);

    const loadUserProperties = async () => {
        const result = await getPortalUserProperties();
        if (result) {
            if (!result.immadDisplaySettings) {
                result.immadDisplaySettings = {
                    distanceUnit: 'imperial',
                    areaUnit: 'imperial',
                    defaultPopupEnabled: true,
                    lightingEnabled: false,
                    listenForConnection: true,
                    addToLayerList: true,
                    pollDelay: 5,
                };
            }
            setUserProperties(result);
        } else {
            //If no results set the default properties
            const properties: UserProperties = {
                immadDisplaySettings: {
                    distanceUnit: 'imperial',
                    areaUnit: 'imperial',
                    defaultPopupEnabled: true,
                    lightingEnabled: false,
                    listenForConnection: true,
                    addToLayerList: true,
                    pollDelay: 5,
                },
            };
            setUserProperties(properties);
        }
    };

    useEffect(() => {
        loadUserProperties();
    }, []);

    useEffect(() => {
        if (mapViewInitialized && userProperties) {
            const view = getMapView();
            if (view && mapLineMeasureRef.current) {
                const measure = new DistanceMeasurement2D({
                    view,
                    container: mapLineMeasureRef.current,
                    unit: userProperties.immadDisplaySettings.distanceUnit,
                });
                measure.watch('viewModel.state', (val) => {
                    if (val === 'disabled') {
                        measure.viewModel.clear();
                    }

                    setHasLine(val === 'measuring' || val === 'measured');
                });
                const container = measure.container as HTMLElement;
                container.addEventListener('click', () => {
                    if (activeEditor) {
                        activeEditor.cancelWorkflow();
                        measure.viewModel.start();
                    }
                });
                setMapLineMeasure(measure);
            }
            if (view && mapAreaMeasureRef.current) {
                const measure = new AreaMeasurement2D({
                    view,
                    container: mapAreaMeasureRef.current,
                    unit: userProperties.immadDisplaySettings.areaUnit,
                });
                measure.watch('viewModel.state', (val) => {
                    if (val === 'disabled') {
                        measure.viewModel.clear();
                    }

                    setHasArea(val === 'measuring' || val === 'measured');
                });
                const container = measure.container as HTMLElement;
                container.addEventListener('click', () => {
                    if (activeEditor) {
                        activeEditor.cancelWorkflow();
                        measure.viewModel.start();
                    }
                });
                setMapAreaMeasure(measure);
            }
        }
    }, [mapViewInitialized, userProperties]);

    useEffect(() => {
        if (sceneViewInitialized && userProperties) {
            const view = getSceneView();
            if (view && sceneLineMeasureRef.current) {
                const measure = new DirectLineMeasurement3D({
                    view,
                    container: sceneLineMeasureRef.current,
                    unit: userProperties.immadDisplaySettings.distanceUnit,
                });
                measure.watch('viewModel.state', (val) => {
                    if (val === 'disabled') {
                        measure.viewModel.clear();
                    }

                    setHasLine(val === 'measuring' || val === 'measured');
                });
                const container = measure.container as HTMLElement;
                container.addEventListener('click', () => {
                    if (activeEditor) {
                        activeEditor.cancelWorkflow();
                        measure.viewModel.start();
                    }
                });
                setSceneLineMeasure(measure);
            }
            if (view && sceneAreaMeasureRef.current) {
                const measure = new AreaMeasurement3D({
                    view,
                    container: sceneAreaMeasureRef.current,
                    unit: userProperties.immadDisplaySettings.areaUnit,
                });
                measure.watch('viewModel.state', (val) => {
                    if (val === 'disabled') {
                        measure.viewModel.clear();
                    }

                    setHasArea(val === 'measuring' || val === 'measured');
                });
                const container = measure.container as HTMLElement;
                container.addEventListener('click', () => {
                    if (activeEditor) {
                        activeEditor.cancelWorkflow();
                        measure.viewModel.start();
                    }
                });
                setSceneAreaMeasure(measure);
            }
        }
    }, [sceneViewInitialized, userProperties]);

    useEffect(() => {
        const buttons = document.getElementsByTagName('button');
        const measureButton = Array.from(buttons).find((button) => button.title.toLowerCase() === 'measure');
        if (measureButton && ((mapLineMeasure && mapAreaMeasure) || (sceneLineMeasure && sceneAreaMeasure))) {
            measureButton.addEventListener('click', handleToolToggleClear);
        }

        const tabButtons = document.getElementsByClassName('flexlayout__tab_button--selected');
        const tabButton = Array.from(tabButtons).find((button) => button.outerHTML.includes('Measure'));
        if (tabButton && ((mapLineMeasure && mapAreaMeasure) || (sceneLineMeasure && sceneAreaMeasure))) {
            tabButton.addEventListener('click', handleToolToggleClear);
        }

        return () => {
            if (measureButton && ((mapLineMeasure && mapAreaMeasure) || (sceneLineMeasure && sceneAreaMeasure))) {
                measureButton.removeEventListener('click', handleToolToggleClear);
            }

            if (tabButton && ((mapLineMeasure && mapAreaMeasure) || (sceneLineMeasure && sceneAreaMeasure))) {
                tabButton.removeEventListener('click', handleToolToggleClear);
            }
        };
    }, [mapLineMeasure, mapAreaMeasure, sceneLineMeasure, sceneAreaMeasure]);

    function handleTabChange(_event: React.ChangeEvent, newValue: number) {
        setTabValue(newValue);
    }

    function handleClearClicked() {
        if (activeView === 'MAP' && mapLineMeasure && mapAreaMeasure) {
            tabValue === 0 && mapLineMeasure.viewModel.clear();
            tabValue === 1 && mapAreaMeasure.viewModel.clear();
        } else if (activeView === 'SCENE' && sceneLineMeasure && sceneAreaMeasure) {
            tabValue === 0 && sceneLineMeasure.viewModel.clear();
            tabValue === 1 && sceneAreaMeasure.viewModel.clear();
        }
    }

    function handleToolToggleClear() {
        if (activeView === 'MAP' && mapLineMeasure && mapAreaMeasure) {
            mapLineMeasure.viewModel.clear();
            mapAreaMeasure.viewModel.clear();
        } else if (activeView === 'SCENE' && sceneLineMeasure && sceneAreaMeasure) {
            sceneLineMeasure.viewModel.clear();
            sceneAreaMeasure.viewModel.clear();
        }
    }

    return (
        <WidgetContainer>
            <WidgetHeader position='static'>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label='measure tabs'>
                    <Tab label='Distance' />
                    <Tab label='Area' />
                </Tabs>
            </WidgetHeader>
            <MeasureWidgetContent role='tabpanel' hidden={tabValue !== 0}>
                <div ref={mapLineMeasureRef} hidden={activeView !== 'MAP'} />
                <div ref={sceneLineMeasureRef} hidden={activeView !== 'SCENE'} />
                <ActionButton color='secondary' variant='contained' disabled={!hasLine} onClick={handleClearClicked}>
                    Clear
                </ActionButton>
            </MeasureWidgetContent>
            <MeasureWidgetContent role='tabpanel' hidden={tabValue !== 1}>
                <div ref={mapAreaMeasureRef} hidden={activeView !== 'MAP'} />
                <div ref={sceneAreaMeasureRef} hidden={activeView !== 'SCENE'} />
                <ActionButton color='secondary' variant='contained' disabled={!hasArea} onClick={handleClearClicked}>
                    Clear
                </ActionButton>
            </MeasureWidgetContent>
        </WidgetContainer>
    );
}

export default Measure;
