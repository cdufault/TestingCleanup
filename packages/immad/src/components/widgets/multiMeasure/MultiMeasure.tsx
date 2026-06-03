// React imports
import React, { useContext, useEffect, useRef, useState } from 'react';

// Context imports
import { MapContext } from '../../../contexts/Map';

// Component imports
import { ActionButton, WidgetContainer, WidgetHeader } from '../../common';
import AreaMeasurement2D from '@arcgis/core/widgets/AreaMeasurement2D';
import AreaMeasurement3D from '@arcgis/core/widgets/AreaMeasurement3D';
import DistanceMeasurement2D from '@arcgis/core/widgets/DistanceMeasurement2D';
import DirectLineMeasurement3D from '@arcgis/core/widgets/DirectLineMeasurement3D';
import { Tabs, Tab } from '@mui/material';

import { getPortalUserProperties, UserProperties, ImmadDisplaySettings } from '../../../helpers/portalUsersHelper';
import { MeasureWidgetContent } from './styles';

enum MeasurementType {
    'DirectLineMeasurement3D',
    'DistanceMeasurement2D',
    'AreaMeasurement2D',
    'AreaMeasurement3D',
}

const MultiMeasure = (): JSX.Element => {
    const { mapViewInitialized, sceneViewInitialized, activeView, getMapView, getSceneView, activeEditor } =
        useContext(MapContext);
    const [hasArea, setHasArea] = useState(false);
    const [hasLine, setHasLine] = useState(false);

    const mapAreaMeasure = useRef<AreaMeasurement2D[]>([]);
    const [mapAreaMeasureState, setMapAreaMeasureState] = useState<AreaMeasurement2D[]>([]);

    const mapLineMeasure = useRef<DistanceMeasurement2D[]>([]);
    const [mapLineMeasureState, setMapLineMeasureState] = useState<DistanceMeasurement2D[]>([]);

    const sceneAreaMeasure = useRef<AreaMeasurement3D[]>([]);
    const [sceneAreaMeasureState, setSceneAreaMeasureState] = useState<AreaMeasurement3D[]>([]);

    const sceneLineMeasure = useRef<DirectLineMeasurement3D[]>([]);
    const [sceneLineMeasureState, setSceneLineMeasureState] = useState<DirectLineMeasurement3D[]>([]);

    const mapAreaMeasureRef = useRef<HTMLDivElement>(null);
    const mapLineMeasureRef = useRef<HTMLDivElement>(null);
    const sceneAreaMeasureRef = useRef<HTMLDivElement>(null);
    const sceneLineMeasureRef = useRef<HTMLDivElement>(null);

    const [mapAreaInitialized, setMapAreaInitialized] = useState(false);
    const [mapLineInitialized, setMapLineInitialized] = useState(false);
    const [sceneAreaInitialized, setSceneAreaInitialized] = useState(false);
    const [sceneLineInitialized, setSceneLineInitialized] = useState(false);

    // this is the value of the internal tab (line/area)
    const [tabValue, setTabValue] = useState(0);
    const [userProperties, setUserProperties] = useState<UserProperties>();

    const currentMeasurementType = useRef<MeasurementType>();

    useEffect(() => {
        loadUserProperties();
    }, []);

    useEffect(() => {
        setCurrentMeasurementType();
    }, [activeView, tabValue, userProperties]);

    useEffect(() => {
        removeExtraDOMElements();
    }, [mapViewInitialized, sceneViewInitialized]);

    useEffect(() => {
        if (
            mapAreaMeasureState.length ||
            mapLineMeasureState.length ||
            sceneAreaMeasureState.length ||
            sceneLineMeasureState.length
        ) {
            removeExtraDOMElements();
        }

        const buttons = document.getElementsByTagName('button');
        const measureButton = Array.from(buttons).find((button) => button.title.toLowerCase() === 'measure');

        if (measureButton && (mapLineMeasure || sceneLineMeasure)) {
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
    }, [mapLineMeasureState, mapAreaMeasureState, sceneLineMeasureState, sceneAreaMeasureState]);

    // this block is dual purpose as both state and ref are used with an event attached
    const _setMapAreaState = (areas: AreaMeasurement2D[]): void => {
        setMapAreaMeasureState([...areas]);
        mapAreaMeasure.current = [...areas];
    };

    const _setMapLineState = (lines: DistanceMeasurement2D[]): void => {
        setMapLineMeasureState([...lines]);
        mapLineMeasure.current = [...lines];
    };

    const _setSceneAreaState = (areas: AreaMeasurement3D[]): void => {
        setSceneAreaMeasureState([...areas]);
        sceneAreaMeasure.current = [...areas];
    };

    const _setSceneLineState = (lines: DirectLineMeasurement3D[]): void => {
        setSceneLineMeasureState([...lines]);
        sceneLineMeasure.current = [...lines];
    };

    /**
     * Clears the measurement view modeal and removes from array
     * @param measurements array of measurements to clear
     */
    const clearViewModels = async (
        measurements: DistanceMeasurement2D[] | DirectLineMeasurement3D[] | AreaMeasurement2D[] | AreaMeasurement3D[]
    ): Promise<DistanceMeasurement2D[] | DirectLineMeasurement3D[] | AreaMeasurement2D[] | AreaMeasurement3D[]> => {
        const returnMeasurements = [...measurements] as typeof measurements;
        if (measurements) {
            for (const measurement of measurements) {
                measurement.viewModel.clear();
                const index = returnMeasurements.findIndex((item: any) => {
                    return item.id === measurement.id;
                });
                if (index > -1) {
                    returnMeasurements.splice(index, 1);
                }
            }
        }

        return returnMeasurements;
    };

    /**
     * Generic method for creating new measurement
     * @param measurement specific measurement object type to create
     */
    const createNewMeasurement = (
        measurement: DistanceMeasurement2D | DirectLineMeasurement3D | AreaMeasurement2D | AreaMeasurement3D
    ): void => {
        const view = activeView === 'MAP' ? getMapView() : getSceneView();
        // create measurement
        if (measurement && view && userProperties) {
            measurement.view = view;

            switch (currentMeasurementType.current) {
                case MeasurementType.AreaMeasurement2D:
                    if (mapAreaMeasureRef.current) {
                        setMapAreaInitialized(true);
                        measurement.container = mapAreaMeasureRef.current;
                        measurement.unit = userProperties.immadDisplaySettings.areaUnit;
                    }
                    break;
                case MeasurementType.AreaMeasurement3D:
                    if (sceneAreaMeasureRef.current) {
                        setSceneAreaInitialized(true);
                        measurement.container = sceneAreaMeasureRef.current;
                        measurement.unit = userProperties.immadDisplaySettings.areaUnit;
                    }
                    break;
                case MeasurementType.DistanceMeasurement2D:
                    if (mapLineMeasureRef.current) {
                        setMapLineInitialized(true);
                        measurement.container = mapLineMeasureRef.current;
                        measurement.unit = userProperties.immadDisplaySettings.distanceUnit;
                    }
                    break;
                case MeasurementType.DirectLineMeasurement3D:
                    if (sceneLineMeasureRef.current) {
                        setSceneLineInitialized(true);
                        measurement.container = sceneLineMeasureRef.current;
                        measurement.unit = userProperties.immadDisplaySettings.distanceUnit;
                    }
                    break;
            }

            measurement.watch('viewModel.state', (state) => {
                if (state === 'disabled') {
                    measurement.viewModel.clear();
                }

                if (state === 'measured') {
                    let newMeasurementButtons = null;
                    switch (currentMeasurementType.current) {
                        case MeasurementType.DirectLineMeasurement3D:
                            newMeasurementButtons = document.getElementsByClassName(
                                'esri-direct-line-measurement-3d__clear-button'
                            );
                            break;
                        case MeasurementType.DistanceMeasurement2D:
                            newMeasurementButtons = document.getElementsByClassName(
                                'esri-distance-measurement-2d__clear-button'
                            );
                            break;
                        case MeasurementType.AreaMeasurement2D:
                            newMeasurementButtons = document.getElementsByClassName(
                                'esri-area-measurement-2d__clear-button'
                            );
                            break;
                        case MeasurementType.AreaMeasurement3D:
                            newMeasurementButtons = document.getElementsByClassName(
                                'esri-area-measurement-3d__clear-button'
                            );
                            break;
                    }

                    if (newMeasurementButtons?.length) {
                        newMeasurementButtons[0].remove();
                    }

                    switch (currentMeasurementType.current) {
                        case MeasurementType.DistanceMeasurement2D:
                            setHasArea(false);
                            setHasLine(true);
                            _setMapLineState([...mapLineMeasure.current, measurement as DistanceMeasurement2D]);
                            createNewMeasurement(new DistanceMeasurement2D());
                            break;
                        case MeasurementType.DirectLineMeasurement3D:
                            setHasArea(false);
                            setHasLine(true);
                            _setSceneLineState([...sceneLineMeasure.current, measurement as DirectLineMeasurement3D]);
                            createNewMeasurement(new DirectLineMeasurement3D());
                            break;
                        case MeasurementType.AreaMeasurement2D:
                            setHasArea(true);
                            setHasLine(false);
                            _setMapAreaState([...mapAreaMeasure.current, measurement as AreaMeasurement2D]);
                            createNewMeasurement(new AreaMeasurement2D());
                            break;
                        case MeasurementType.AreaMeasurement3D:
                            setHasArea(true);
                            setHasLine(false);
                            _setSceneAreaState([...sceneAreaMeasure.current, measurement as AreaMeasurement3D]);
                            createNewMeasurement(new AreaMeasurement3D());
                            break;
                    }
                }

                if (state === 'measuring') {
                    switch (currentMeasurementType.current) {
                        case MeasurementType.DistanceMeasurement2D:
                        case MeasurementType.DirectLineMeasurement3D:
                            setHasArea(false);
                            setHasLine(true);
                            break;
                        case MeasurementType.AreaMeasurement2D:
                        case MeasurementType.AreaMeasurement3D:
                            setHasArea(true);
                            setHasLine(false);
                            break;
                    }
                }
            });

            const container = measurement.container as HTMLElement;
            container.addEventListener('click', () => {
                if (activeEditor) {
                    activeEditor.cancelWorkflow();
                    measurement.viewModel.start();
                }
            });
        }
    };

    /**
     * Clears all measurements from map when button is pressed or tab(line/area) is toggled
     */
    const handleClearAll = async (): Promise<void> => {
        setHasArea(false);
        setHasLine(false);
        if (activeView === 'MAP') {
            if (tabValue === 0 && mapLineMeasureState.length) {
                const mapLines = await clearViewModels([...mapLineMeasure.current]);
                _setMapLineState([...mapLines] as DistanceMeasurement2D[]);
            } else if (mapAreaMeasureState.length) {
                const mapAreas = await clearViewModels([...mapAreaMeasure.current]);
                _setMapAreaState([...mapAreas] as AreaMeasurement2D[]);
            }
        } else if (activeView === 'SCENE') {
            if (tabValue === 0 && sceneLineMeasureState.length) {
                const sceneLines = await clearViewModels([...sceneLineMeasure.current]);
                _setSceneLineState([...sceneLines] as DirectLineMeasurement3D[]);
            } else if (sceneAreaMeasureState.length) {
                const sceneAreas = await clearViewModels([...sceneAreaMeasure.current]);
                _setSceneAreaState([...sceneAreas] as AreaMeasurement3D[]);
            }
        }
    };

    const handleTabChange = (event: React.ChangeEvent, newValue: number): void => {
        setTabValue(newValue);
        handleClearAll();
    };

    /**
     * Clears all measurements when tool is toggled off
     */
    const handleToolToggleClear = (): void => {
        if ((activeView === 'MAP' && mapLineMeasureState.length) || mapAreaMeasureState.length) {
            if (mapLineMeasureState.length) {
                for (const line of mapLineMeasureState) {
                    line.viewModel.clear();
                }
            }
            if (mapAreaMeasureState.length) {
                for (const area of mapAreaMeasureState) {
                    area.viewModel.clear();
                }
            }
        } else if ((activeView === 'SCENE' && sceneLineMeasureState.length) || sceneAreaMeasureState.length) {
            if (sceneLineMeasureState.length) {
                for (const line of sceneLineMeasureState) {
                    line.viewModel.clear();
                }
            }
            if (sceneAreaMeasureState.length) {
                for (const area of sceneAreaMeasureState) {
                    area.viewModel.clear();
                }
            }
        }
    };

    const loadUserProperties = async (): Promise<void> => {
        const result = await getPortalUserProperties();
        if (result) {
            if (!result.immadDisplaySettings) {
                const immadDisplaySettings: ImmadDisplaySettings = {
                    distanceUnit: 'imperial',
                    areaUnit: 'imperial',
                    lightingEnabled: false,
                    listenForConnection: true,
                    addToLayerList: true,
                    pollDelay: 5,
                    defaultPopupEnabled: true,
                };
                result.immadDisplaySettings = immadDisplaySettings;
            }
            setUserProperties(result);
        } else {
            //If no results set the default properties
            const properties: UserProperties = {
                immadDisplaySettings: {
                    distanceUnit: 'imperial',
                    areaUnit: 'imperial',
                    lightingEnabled: false,
                    listenForConnection: true,
                    addToLayerList: true,
                    pollDelay: 5,
                    defaultPopupEnabled: true,
                },
            };
            setUserProperties(properties);
        }
    };

    /**
     * Remove empty containers from the DOM
     * @param containers collection of DOM containers to remove
     */
    const removeContainers = (containers: HTMLCollectionOf<Element>) => {
        // remove ghost containers from the dom that make spacing look weird
        if (containers.length > 1) {
            for (const container of Array.from(containers)) {
                if (!container.hasChildNodes() || !container.firstChild?.hasChildNodes()) {
                    container.remove();
                }
            }
        }
    };

    /**
     * This is a special method used to remove empty DOM elements that are causing extra spacing
     */
    const removeExtraDOMElements = (): void => {
        const readyWidgets = sceneLineMeasure.current.filter((item) => {
            return item.viewModel.state === 'ready';
        });

        if (readyWidgets.length > 1) {
            sceneLineMeasure.current.splice(1);
        }

        switch (currentMeasurementType.current) {
            case MeasurementType.DirectLineMeasurement3D:
                removeContainers(document.getElementsByClassName('esri-direct-line-measurement-3d__container'));
                break;
            case MeasurementType.DistanceMeasurement2D:
                removeContainers(document.getElementsByClassName('esri-distance-measurement-2d__container'));
                break;
            case MeasurementType.AreaMeasurement2D:
                removeContainers(document.getElementsByClassName('esri-area-measurement-2d__container'));
                break;
            case MeasurementType.AreaMeasurement3D:
                removeContainers(document.getElementsByClassName('esri-area-measurement-3d__container'));
                break;
        }
    };

    const setCurrentMeasurementType = (): void => {
        if (activeView === 'MAP') {
            if (tabValue === 0 && mapViewInitialized && userProperties && mapLineMeasureRef.current) {
                currentMeasurementType.current = MeasurementType.DistanceMeasurement2D;
                if (!mapLineInitialized) {
                    createNewMeasurement(new DistanceMeasurement2D());
                }
            } else if (tabValue === 1 && mapViewInitialized && userProperties && mapAreaMeasureRef.current) {
                currentMeasurementType.current = MeasurementType.AreaMeasurement2D;
                if (!mapAreaInitialized) {
                    createNewMeasurement(new AreaMeasurement2D());
                }
            }
        } else {
            if (tabValue === 0 && sceneViewInitialized && userProperties && sceneAreaMeasureRef.current) {
                currentMeasurementType.current = MeasurementType.DirectLineMeasurement3D;
                if (!sceneLineInitialized) {
                    createNewMeasurement(new DirectLineMeasurement3D());
                }
            } else if (tabValue === 1 && sceneViewInitialized && userProperties && sceneAreaMeasureRef.current) {
                currentMeasurementType.current = MeasurementType.AreaMeasurement3D;
                if (!sceneAreaInitialized) {
                    createNewMeasurement(new AreaMeasurement3D());
                }
            }
        }
    };

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
                <ActionButton color='secondary' variant='contained' disabled={!hasLine} onClick={handleClearAll}>
                    Clear All
                </ActionButton>
            </MeasureWidgetContent>
            <MeasureWidgetContent role='tabpanel' hidden={tabValue !== 1}>
                <div ref={mapAreaMeasureRef} hidden={activeView !== 'MAP'} />
                <div ref={sceneAreaMeasureRef} hidden={activeView !== 'SCENE'} />
                <ActionButton color='secondary' variant='contained' disabled={!hasArea} onClick={handleClearAll}>
                    Clear All
                </ActionButton>
            </MeasureWidgetContent>
        </WidgetContainer>
    );
};

export default MultiMeasure;
