import React, { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import RuleView, { RuleViewModel } from './RuleView';
import DoctrinalTemplate, { DoctrinalTemplateAnalysisMode } from '../../api/DoctrinalTemplate';
import Rule from '../../api/Rule';
import { ArrowCollapseVerticalIcon, ArrowExpandVerticalIcon } from '../../resources';

/**
 * Defines the input properties required by the DoctrinalTemplateView component.
 */
interface DoctrinalTemplateViewProps {
    template: DoctrinalTemplate;
    onEditRuleClick: (rule: Rule) => void;
}

/**
 * A sub component of the EditTemplatePage component that provides the
 * visualization of a doctrinal template.
 */
const DoctrinalTemplateView = (props: DoctrinalTemplateViewProps): JSX.Element => {
    const { onEditRuleClick } = props;

    const template = useRef<DoctrinalTemplate>(props.template);

    const [analysisMode, setAnalysisMode] = useState<DoctrinalTemplateAnalysisMode>(props.template.mode);

    const [ruleViewModels, setRuleViewModels] = useState<RuleViewModel[]>([]);

    const handleRemoveClicked = (ruleVM: RuleViewModel) => {
        const index = template.current.removeRule(ruleVM.rule);

        if (index >= 0) {
            ruleViewModels.splice(index, 1);
            setRuleViewModels([...ruleViewModels]);
        } else {
            // Somehow we have an orphaned rule that doesn't belong to
            // the doctrinal template object.
        }
    };

    const handleExpandAllClicked = () => {
        ruleViewModels.forEach((ruleVM) => {
            ruleVM.setExpanded ? ruleVM.setExpanded(true) : (ruleVM.expanded = true);
        });
    };

    const handleCollapseAllClicked = () => {
        ruleViewModels.forEach((ruleVM) => {
            ruleVM.setExpanded ? ruleVM.setExpanded(false) : (ruleVM.expanded = false);
        });
    };

    useEffect(() => {
        const ruleViewModels = template.current.rules.map((rule, index) => {
            if (index === template.current.rules.length - 1) {
                return { rule: rule, expanded: true } as RuleViewModel;
            } else {
                return { rule: rule, expanded: false } as RuleViewModel;
            }
        });

        setRuleViewModels(ruleViewModels);
    }, []);

    return (
        <Box width='100%' height='100%' display='flex' boxSizing='border-box' flexDirection='column'>
            <Box mb={1}>
                <Box display='flex'>
                    <Box>
                        <ToggleButtonGroup
                            exclusive
                            value={analysisMode}
                            size='small'
                            onChange={(_evt, newMode) => {
                                if (newMode) {
                                    setAnalysisMode(newMode);
                                    template.current.mode = newMode;
                                }
                            }}
                        >
                            <ToggleButton title='All rules must pass.' value={DoctrinalTemplateAnalysisMode.All}>
                                ALL
                            </ToggleButton>
                            <ToggleButton title='Any rule can pass.' value={DoctrinalTemplateAnalysisMode.Any}>
                                ANY
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                    <Box flexGrow={1} />
                    <Box>
                        <Button onClick={handleCollapseAllClicked} startIcon={<ArrowCollapseVerticalIcon />}>
                            Collapse all
                        </Button>
                        <Button onClick={handleExpandAllClicked} startIcon={<ArrowExpandVerticalIcon />}>
                            Expand all
                        </Button>
                    </Box>
                </Box>
            </Box>

            {/*<Box mb={1} borderTop={1} borderRadius='borderRadius' borderColor='grey.500'></Box>*/}

            <Box width='100%' height='100%' boxSizing='border-box' style={{ overflowX: 'hidden', overflowY: 'auto' }}>
                {ruleViewModels.map((ruleVM) => {
                    return (
                        <RuleView
                            key={ruleVM.rule.id}
                            ruleVM={ruleVM}
                            onRemoveClick={handleRemoveClicked}
                            onEditClick={(ruleVM) => onEditRuleClick(ruleVM.rule)}
                        />
                    );
                })}
                <Box width='100%' my={2} display='flex' justifyContent='center' alignItems='center'>
                    <Typography>Click the ADD RULE button to create a new rule.</Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default DoctrinalTemplateView;
