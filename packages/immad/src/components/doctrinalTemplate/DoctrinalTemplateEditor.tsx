import React, { useState, useRef, useEffect, useContext } from 'react';
import { useSnackbar } from 'notistack';
import Box from '@mui/material/Box';
import { DataSource } from './api/DataSources';
import DoctrinalTemplate from './api/DoctrinalTemplate';
import Rule from './api/Rule';
import ChooseDataSourcePage from './components/views/ChooseDataSourcePage';
import EditRulePropertiesPage from './components/views/EditRulePropertiesPage';
import EditTemplatePage from './components/views/EditTemplatePage';
import SaveTemplatePage from './components/views/SaveTemplatePage';
import { applyDoctrinalTemplateLayerStyling, convertToImageryLayer } from './helpers/doctrinalTemplateHelper';
import ZoomToAction from '../common/ZoomToAction';
import { MapContext } from '../../contexts/Map';
import ImageryLayer = __esri.ImageryLayer;
import LayerView = __esri.LayerView;
import PortalItem = __esri.PortalItem;
import View = __esri.View;
import { ConfigHelper } from '../../helpers/configHelper';

/**
 * Defines the available workflow states for the DoctrinalTemplateEditor component.
 */
enum EditTemplateStepEnum {
    ChooseDataSource,
    EditRuleProperties,
    EditTemplate,
    SaveTemplate,
}

/**
 * Defines the input properties required by the DoctrinalTemplateEditor component.
 */
interface DoctrinalTemplateEditorProps {
    template: DoctrinalTemplate;
    portalItem?: PortalItem;
    onCloseClick: () => void;
}

/**
 * A component that provides the ability to modify, preview, save and export, doctrinal templates.
 */
const DoctrinalTemplateEditor = (props: DoctrinalTemplateEditorProps): JSX.Element => {
    const { onCloseClick } = props;

    const rule = useRef<Rule | undefined>();

    const editedRule = useRef<Rule | undefined>();

    const template = useRef<DoctrinalTemplate>(props.template);

    const portalItem = useRef<PortalItem | undefined>(props.portalItem);

    const [step, setStep] = useState<EditTemplateStepEnum>(EditTemplateStepEnum.EditTemplate);

    const [page, setPage] = useState<JSX.Element | undefined>();

    const [previewLayer, setPreviewLayer] = useState<ImageryLayer | undefined>();

    const [view, setView] = useState<View | undefined>();

    const { activeView, getMapView, getSceneView } = useContext(MapContext);

    const { enqueueSnackbar } = useSnackbar();

    const appConfig = ConfigHelper.getAppConfig();

    const previewTemplate = async (template: DoctrinalTemplate | undefined) => {
        try {
            if (template) {
                const renderer = appConfig?.doctrinalTemplate?.renderer;
                const imageryLayer = await convertToImageryLayer(template, renderer);
                setPreviewLayer(imageryLayer);
            }
        } catch (error) {
            console.error('Error previewing doctrinal template: ' + error);
            enqueueSnackbar('Error previewing doctrinal template.', { variant: 'error' });
        }
    };

    useEffect(() => {
        switch (activeView) {
            case 'MAP':
                setView(getMapView());
                break;
            case 'SCENE':
                setView(getSceneView());
                break;
            default:
                setView(undefined);
                break;
        }
    }, [activeView]);

    useEffect(() => {
        if (previewLayer) {
            updatePreviewLayer(previewLayer);
        } else {
            // TODO: implement update layer
            // previewLayer.set('raster', rasterData).refresh();
        }
        return () => {
            if (previewLayer) {
                view?.map.remove(previewLayer);
            }
        };
    }, [previewLayer, view]);

    useEffect(() => {
        switch (step) {
            case EditTemplateStepEnum.EditTemplate:
                setPage(
                    <EditTemplatePage
                        template={template.current}
                        onAddRuleClick={() => {
                            setStep(EditTemplateStepEnum.ChooseDataSource);
                        }}
                        onBackClick={() => {
                            onCloseClick();
                        }}
                        onEditRuleClick={(ruleToEdit) => {
                            rule.current = ruleToEdit;
                            editedRule.current = { ...ruleToEdit };
                            setStep(EditTemplateStepEnum.ChooseDataSource);
                        }}
                        onPreviewClick={() => {
                            previewTemplate(template.current);
                        }}
                        onSaveClick={() => {
                            setStep(EditTemplateStepEnum.SaveTemplate);
                        }}
                    />
                );
                break;
            case EditTemplateStepEnum.ChooseDataSource:
                setPage(
                    <ChooseDataSourcePage
                        rule={editedRule.current}
                        onCancelClick={() => {
                            rule.current = undefined;
                            editedRule.current = undefined;
                            setStep(EditTemplateStepEnum.EditTemplate);
                        }}
                        onContinueClick={(source: DataSource) => {
                            if (editedRule.current) {
                                editedRule.current.dataSource = source;
                            } else {
                                editedRule.current = template.current.createRule(source);
                            }

                            setStep(EditTemplateStepEnum.EditRuleProperties);
                        }}
                    />
                );
                break;
            case EditTemplateStepEnum.EditRuleProperties:
                if (editedRule.current) {
                    setPage(
                        <EditRulePropertiesPage
                            rule={editedRule.current}
                            onBackClick={() => {
                                setStep(EditTemplateStepEnum.ChooseDataSource);
                            }}
                            onCancelClick={() => {
                                rule.current = undefined;
                                editedRule.current = undefined;
                                setStep(EditTemplateStepEnum.EditTemplate);
                            }}
                            onConfirmClick={(finishedRule) => {
                                const index = template.current.rules.findIndex((rule) => rule.id === finishedRule.id);
                                if (index === -1) {
                                    template.current.rules.push(finishedRule);
                                } else {
                                    template.current.rules[index] = finishedRule;
                                }

                                rule.current = undefined;
                                editedRule.current = undefined;
                                setStep(EditTemplateStepEnum.EditTemplate);
                            }}
                        />
                    );
                } else {
                    console.error('Cannot load the edit rule page because there is no current rule.');
                    enqueueSnackbar(
                        'An unexpected error occurred in doctrinal template, see console for more details.',
                        {
                            variant: 'error',
                        }
                    );
                }
                break;
            case EditTemplateStepEnum.SaveTemplate:
                setPage(
                    <SaveTemplatePage
                        onCancelClick={() => {
                            setStep(EditTemplateStepEnum.EditTemplate);
                        }}
                        onSave={(item) => {
                            portalItem.current = item;
                            setStep(EditTemplateStepEnum.EditTemplate);
                        }}
                        portalItemRef={portalItem.current}
                        templateRef={template.current}
                    />
                );
                break;
            default:
                console.error('No UI is available for this step of the doctrinal template workflow: ' + step);
                enqueueSnackbar('An unexpected error occurred in doctrinal template, see console for more details.', {
                    variant: 'error',
                });
                break;
        }
    }, [step]);

    const updatePreviewLayer = async (previewLayer: ImageryLayer) => {
        applyDoctrinalTemplateLayerStyling(previewLayer);
        view && view.map.add(previewLayer);

        const handleError = (error: any) => {
            console.error('Error zooming to layer: ' + error);
            enqueueSnackbar('Error zooming to layer.', { variant: 'error' });
        };

        // Update progressor
        view?.whenLayerView(previewLayer)
            .then((lv: LayerView) => {
                console.debug(previewLayer.rasterFields + ' are the raster fields');
                enqueueSnackbar(`Layer ${lv.layer.title} Added to the map.`, {
                    variant: 'info',
                    action: <ZoomToAction layer={previewLayer} view={view} onError={handleError} />,
                });
            })
            .catch((error) => {
                console.error('Error adding preview layer to the map: ' + error);
                enqueueSnackbar('Error adding preview layer to the map.', { variant: 'error' });

                if (previewLayer) {
                    view?.map.remove(previewLayer);
                }
            });
    };

    return page ? page : <Box />;
};

export default DoctrinalTemplateEditor;
