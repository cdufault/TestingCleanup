import React, { useRef } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Rule from '../../api/Rule';
import { ActionButton, WidgetActions, WidgetContainer, WidgetContent, WidgetHeader } from '../../../common';

/**
 * Defines the input properties required by the CreateRulesPage component.
 */
interface EditRulePropertiesPageProps {
    rule: Rule;
    onBackClick: () => void;
    onCancelClick: () => void;
    onConfirmClick: (rule: Rule) => void;
}

/**
 * A sub component of the DoctrinalTemplateEditor component that provides the
 * ability to edit properties associated with a rule.
 */
const EditRulePropertiesPage = (props: EditRulePropertiesPageProps): JSX.Element => {
    const { onBackClick, onCancelClick, onConfirmClick } = props;

    const rule = useRef<Rule>(props.rule);

    return (
        <WidgetContainer>
            <WidgetHeader position='static'>
                <Box height='100%' display='flex'>
                    <Box height='100%' display='flex' alignItems='center' justifyContent='center'>
                        Edit Rule Properties
                    </Box>
                </Box>
            </WidgetHeader>
            <WidgetContent>
                <Box width='100%' height='100%' display='flex' boxSizing='border-box' flexDirection='column'>
                    <Box mb={1} width='100%'>
                        DataSource: {rule.current.dataSource.alias}
                    </Box>
                    <Box mb={1} width='100%' display='flex' boxSizing='border-box' flexDirection='column'>
                        <Typography>Alias</Typography>
                        <TextField
                            fullWidth
                            defaultValue={rule.current.alias}
                            placeholder='Rule Alias...'
                            variant='outlined'
                            helperText='optional'
                            onChange={(evt) => {
                                rule.current.alias = evt.target.value;
                            }}
                        ></TextField>
                    </Box>
                    <Box width='100%' display='flex' boxSizing='border-box' flexDirection='column'>
                        <Typography>Description</Typography>
                        <TextField
                            fullWidth
                            defaultValue={rule.current.description}
                            placeholder='Rule Description...'
                            variant='outlined'
                            helperText='optional'
                            rows={3}
                            onChange={(evt) => {
                                rule.current.description = evt.target.value;
                            }}
                        ></TextField>
                    </Box>
                </Box>
            </WidgetContent>
            <WidgetActions elevation={0}>
                <Box width='100%' display='flex' boxSizing='border-box'>
                    <Box>
                        <ActionButton
                            variant='contained'
                            color='secondary'
                            title='Go back to the doctrinal template editing page.'
                            onClick={onCancelClick}
                        >
                            CANCEL
                        </ActionButton>
                    </Box>
                    <Box flexGrow={1}></Box>
                    <Box>
                        <ActionButton
                            variant='contained'
                            color='secondary'
                            title='Go back to rule data source selection page.'
                            onClick={onBackClick}
                        >
                            BACK
                        </ActionButton>
                        <ActionButton
                            variant='contained'
                            color='secondary'
                            title='Confirm the rule properties.'
                            onClick={() => onConfirmClick(rule.current)}
                        >
                            CONFIRM
                        </ActionButton>
                    </Box>
                </Box>
            </WidgetActions>
        </WidgetContainer>
    );
};

export default EditRulePropertiesPage;
