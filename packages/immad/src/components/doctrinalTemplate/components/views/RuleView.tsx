import React, { useRef, useEffect, useState } from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionActions from '@mui/material/AccordionActions';
import Box from '@mui/material/Box';
import CheckBox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import CaretDown from 'calcite-ui-icons-react/CaretDownIcon';
import BufferRuleDetails from './BufferRuleDetails';
import ImageServiceRuleDetails from './ImageServiceRuleDetails';
import { RuleDetails, RuleHeader } from './ruleStyles';
import StatusChip, { ChipStatus } from './StatusChip';
import Rule, { BufferRule, ImageServiceRule, RuleStatus } from '../../api/Rule';
import { ActionButton } from '../../../common';
import { isRuleValid } from '../../helpers/ruleHelper';
import Layer = __esri.Layer;
import { DataSource } from '../../api/DataSources';

/**
 * The data model that drives the rule view state.
 */
export interface RuleViewModel {
    rule: Rule;
    expanded: boolean;
    setExpanded?: (expanded: boolean) => void;
}

/**
 * Defines the input properties required by the RuleView component.
 */
export interface RuleViewProps {
    onEditClick: (ruleVM: RuleViewModel) => void;
    onRemoveClick: (ruleVM: RuleViewModel) => void;
    ruleVM: RuleViewModel;
}

/**
 * A sub component of the DoctrinalTemplateview component that provides the
 * visualization of an individual rule for a doctrinal template.
 */
const RuleView = (props: RuleViewProps): JSX.Element => {
    const { onEditClick, onRemoveClick } = props;

    const ruleVM = useRef<RuleViewModel>(props.ruleVM);

    const [expanded, setExpanded] = useState<boolean>(props.ruleVM.expanded);

    const [enabled, setEnabled] = useState<boolean>(props.ruleVM.rule.enabled);

    const [ruleStatus, setRuleStatus] = useState<RuleStatus>(RuleStatus.NotReady);

    const [statusLabel, setStatusLabel] = useState<string>('');

    const [chipStatus, setChipStatus] = useState<ChipStatus>('default');

    const updateRuleStatus = () => {
        const isValidStatus = isRuleValid(ruleVM.current.rule);
        setStatusLabel(isValidStatus.message);
        setRuleStatus(isValidStatus.status);
    };

    useEffect(() => {
        // Set the chip status based on the rule status
        switch (ruleStatus) {
            case RuleStatus.NotReady:
                setChipStatus('default');
                break;
            case RuleStatus.Warning:
                setChipStatus('warning');
                break;
            case RuleStatus.Error:
                setChipStatus('error');
                break;
            case RuleStatus.Ready:
                setChipStatus('success');
                break;
            default:
                setChipStatus('default');
                break;
        }
    }, [ruleStatus]);

    const createRuleDetails = (): JSX.Element | undefined => {
        switch (ruleVM.current.rule.type) {
            case 'image':
                return (
                    <ImageServiceRuleDetails
                        rule={ruleVM.current.rule as ImageServiceRule}
                        onRuleDetailsUpdated={updateRuleStatus}
                    />
                );
            case 'buffer':
                return (
                    <BufferRuleDetails
                        rule={ruleVM.current.rule as BufferRule}
                        onRuleDetailsUpdated={updateRuleStatus}
                    />
                );
            default:
                return undefined;
        }
    };

    useEffect(() => {
        ruleVM.current.setExpanded = setExpanded;
        const layerDataSource = props.ruleVM.rule.dataSource as DataSource & { layer: Layer };
        const layer: Layer = layerDataSource.layer;
        if (layer) {
            const handle = layer.watch('loadStatus', () => {
                updateRuleStatus();
            });
            updateRuleStatus();
            return () => handle.remove();
        }
    }, []);

    useEffect(() => {
        ruleVM.current.rule.enabled = enabled;
    }, [enabled]);

    useEffect(() => {
        ruleVM.current.expanded = expanded;
    }, [expanded]);

    return (
        <Box
            mb={1}
            width='100%'
            boxSizing='border-box'
            border={1}
            borderColor='grey.500'
            display='flex'
            flexDirection='column'
        >
            <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
                <RuleHeader expandIcon={<CaretDown />}>
                    <FormControlLabel
                        control={
                            <CheckBox
                                color={'secondary'}
                                checked={enabled}
                                title={
                                    enabled
                                        ? 'This rule is included in the doctrinal template results.'
                                        : 'This rule is excluded from the doctrinal template results.'
                                }
                                onChange={(_evt, checked) => {
                                    setEnabled(checked);
                                }}
                            />
                        }
                        label={ruleVM.current.rule.alias}
                        onClick={(event) => event.stopPropagation()}
                        onFocus={(event) => event.stopPropagation()}
                    />
                </RuleHeader>
                <RuleDetails>
                    <Box width='100%' display='flex' boxSizing='border-box' flexDirection='column'>
                        <Box mb={1}>{ruleVM.current.rule.description}</Box>
                        {createRuleDetails()}
                    </Box>
                </RuleDetails>
                <AccordionActions>
                    <Box width='100%' display='flex' boxSizing='border-box'>
                        <Box>
                            <StatusChip
                                label={ruleStatus}
                                title={statusLabel}
                                variant='outlined'
                                status={chipStatus}
                                size='medium'
                            />
                        </Box>
                        <Box flexGrow={1}></Box>
                        <Box display='flex' boxSizing='border-box'>
                            <ActionButton
                                variant='contained'
                                color='secondary'
                                title='Edit the rule data source, name, or description.'
                                onClick={() => {
                                    onEditClick(ruleVM.current);
                                }}
                            >
                                EDIT
                            </ActionButton>
                            <ActionButton
                                variant='contained'
                                color='secondary'
                                title='Remove the rule from the doctrinal template.'
                                onClick={() => {
                                    onRemoveClick(ruleVM.current);
                                }}
                            >
                                REMOVE
                            </ActionButton>
                        </Box>
                    </Box>
                </AccordionActions>
            </Accordion>
        </Box>
    );
};

export default RuleView;
