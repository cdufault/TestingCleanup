import React, { useRef, useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import ArrowLeftIcon from 'calcite-ui-icons-react/ArrowLeftIcon';
import DoctrinalTemplateView from './DoctrinalTemplateView';
import DoctrinalTemplate from '../../api/DoctrinalTemplate';
import Rule from '../../api/Rule';
import { ActionButton, WidgetActions, WidgetContainer, WidgetContent, WidgetHeader } from '../../../common';

/**
 * Defines the input properties required by the EditTemplatePage component.
 */
interface EditTemplatePageProps {
    onAddRuleClick: () => void;
    onBackClick: () => void;
    onEditRuleClick: (rule: Rule) => void;
    onPreviewClick: () => void;
    onSaveClick: () => void;
    template: DoctrinalTemplate;
}

/**
 * A sub component of the DoctrinalTemplateEditor component that provides the
 * ability to modify the rule set of a doctrinal template.
 */
const EditTemplatePage = (props: EditTemplatePageProps): JSX.Element => {
    const { onAddRuleClick, onBackClick, onEditRuleClick, onPreviewClick, onSaveClick } = props;

    const template = useRef<DoctrinalTemplate>(props.template);

    const [title, setTitle] = useState<string>(props.template.title);

    return (
        <WidgetContainer>
            <WidgetHeader position='static'>
                <Box display='flex' boxSizing='border-box'>
                    <Box>
                        <IconButton size='small' onClick={onBackClick} title='Go back to the starting page.'>
                            <ArrowLeftIcon size={30} />
                        </IconButton>
                    </Box>
                    <Box ml={1} height='100%' flexGrow={1}>
                        <TextField
                            fullWidth
                            value={title}
                            onChange={(evt) => {
                                setTitle(evt.target.value);
                                template.current.title = evt.target.value;
                            }}
                        ></TextField>
                    </Box>
                    <Box display='flex' boxSizing='border-box'>
                        <ActionButton
                            variant='contained'
                            color='secondary'
                            title='Save the current template.'
                            onClick={onSaveClick}
                        >
                            SAVE
                        </ActionButton>
                        <ActionButton
                            variant='contained'
                            color='secondary'
                            title='Add a new rule.'
                            onClick={onAddRuleClick}
                        >
                            ADD RULE
                        </ActionButton>
                    </Box>
                </Box>
            </WidgetHeader>
            <WidgetContent>
                <DoctrinalTemplateView onEditRuleClick={onEditRuleClick} template={template.current} />
            </WidgetContent>
            <WidgetActions elevation={0}>
                <Box width='100%' display='flex' boxSizing='border-box'>
                    <Box>
                        <ActionButton
                            variant='contained'
                            color='secondary'
                            title='Add the doctrinal template rule set results as a layer to the map display.'
                            onClick={onPreviewClick}
                        >
                            PREVIEW
                        </ActionButton>
                    </Box>
                    <Box flexGrow={1} />
                    <Box title='Not Implemented'>
                        <ActionButton disabled variant='contained' color='secondary'>
                            EXPORT
                        </ActionButton>
                    </Box>
                </Box>
            </WidgetActions>
        </WidgetContainer>
    );
};

export default EditTemplatePage;
