import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import DoctrinalTemplate from './api/DoctrinalTemplate';
import DoctrinalTemplateEditor from './DoctrinalTemplateEditor';
import DoctrinalTemplatePicker from './DoctrinalTemplatePicker';
import PortalItem = __esri.PortalItem;

/**
 * The main doctrinal template component used by the immad application.  This is an
 * aggregated component consisting of the DoctrinalTemplatePicker and
 * DoctrinalTemplateEditor components.
 */
const DoctrinalTemplateComponent = (): JSX.Element => {
    const [template, setTemplate] = useState<DoctrinalTemplate | undefined>();

    const [portalItem, setPortalItem] = useState<PortalItem | undefined>();

    const [currentComponent, setCurrentComponent] = useState<JSX.Element | undefined>();

    useEffect(() => {
        if (template) {
            setCurrentComponent(
                <DoctrinalTemplateEditor
                    template={template}
                    portalItem={portalItem}
                    onCloseClick={() => {
                        setTemplate(undefined);
                    }}
                />
            );
        } else {
            setCurrentComponent(
                <DoctrinalTemplatePicker
                    onTemplateSelected={(template, item) => {
                        setTemplate(template);
                        setPortalItem(item);
                    }}
                />
            );
        }
    }, [template]);

    return currentComponent ? currentComponent : <Box />;
};

export default DoctrinalTemplateComponent;
