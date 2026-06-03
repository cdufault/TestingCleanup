import React, { useContext, useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DoctrinalTemplate from './api/DoctrinalTemplate';
import DoctrinalTemplatePortalItemActions from './components/views/DoctrinalTemplatePortalItemActions';
import { loadTemplate } from './helpers/doctrinalTemplateHelper';
import { WidgetContainer, WidgetHeader } from '../common';
import PortalItemList from '../widgets/portalItemList';
import { MapContext } from '../../contexts/Map';
import PortalItem = __esri.PortalItem;
import View = __esri.View;

/**
 * Defines the input properties required by the DoctrinalTemplatePicker component.
 */
interface DoctrinalTemplatePickerProps {
    onTemplateSelected: (template: DoctrinalTemplate, item?: PortalItem) => void;
}

/**
 * A component that provides the ability to create new or load existing doctrinal templates.
 */
const DoctrinalTemplatePicker = (props: DoctrinalTemplatePickerProps): JSX.Element => {
    const { onTemplateSelected } = props;

    const [view, setView] = useState<View | undefined>();

    const { activeView, getMapView, getSceneView } = useContext(MapContext);

    const { enqueueSnackbar } = useSnackbar();

    const handleEditAction = (portalItem: PortalItem): void => {
        try {
            const template = loadTemplate(portalItem, view?.map);
            onTemplateSelected(template, portalItem);
        } catch (error) {
            console.error(error);
            enqueueSnackbar('Error loading this template, see console for more information.', {
                variant: 'error',
            });
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

    return (
        <WidgetContainer>
            <WidgetHeader position='static'>
                <Box width='100%' display='flex'>
                    <Box height='100%' display='flex'>
                        <Box height='100%' display='flex' alignItems='center' justifyContent='center'>
                            Saved Templates
                        </Box>
                    </Box>
                    <Box flexGrow={1} />
                    <Box>
                        <Button
                            color='secondary'
                            variant='contained'
                            onClick={() => {
                                onTemplateSelected(new DoctrinalTemplate());
                            }}
                            title='Create a new doctrinal template.'
                        >
                            NEW TEMPLATE
                        </Button>
                    </Box>
                </Box>
            </WidgetHeader>
            <PortalItemList
                isSpatial={false}
                showFilter={true}
                showSearch={true}
                showSort={true}
                itemTypes={['Raster function template']}
                itemsPerPage={6}
                tags={['Doctrinal Template']}
                cardActionsTemplate={<DoctrinalTemplatePortalItemActions view={view} onEdit={handleEditAction} />}
            />
        </WidgetContainer>
    );
};

export default DoctrinalTemplatePicker;
