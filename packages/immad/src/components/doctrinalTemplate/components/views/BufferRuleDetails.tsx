import React, { useRef, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import NumberIcon from 'calcite-ui-icons-react/NumberIcon';
import TableIcon from 'calcite-ui-icons-react/TableIcon';
import { CenteredMenuItem, CenteredSelect } from './ruleStyles';
import { BufferConstraintType, BufferOperationType, BufferRule } from '../../api/Rule';
import { numberBasedFieldTypes } from '../../helpers/ruleHelper';

import Field = __esri.Field;
import FeatureLayer = __esri.FeatureLayer;
import { DataSource } from '../../api/DataSources';
import Layer = __esri.Layer;

/**
 * Defines the input properties required by the BufferRuleDetails component.
 */
export interface BufferRuleDetailsProps {
    rule: BufferRule;
    onRuleDetailsUpdated: () => void;
}

/**
 * A sub component of the RuleView component that provides the
 * visualization for buffer rule details.
 */
const BufferRuleDetails = (props: BufferRuleDetailsProps): JSX.Element => {
    const { onRuleDetailsUpdated } = props;

    const rule = useRef<BufferRule>(props.rule);

    const [constraint, setConstraint] = useState<number | undefined>();

    const [constraintMode, setConstraintMode] = useState<BufferConstraintType>(props.rule.constraintMode);

    const [operation, setOperation] = useState<BufferOperationType>(props.rule.operation);

    const [fields, setFields] = useState<Field[]>([]);

    useEffect(() => {
        if (rule.current.constraint !== undefined) {
            if (
                typeof rule.current.constraint !== 'number' &&
                rule.current.constraintMode === BufferConstraintType.Field
            ) {
                const initialField = rule.current.constraint as Field;
                const fieldIndex = fields.findIndex((field) => field.name === initialField.name);

                if (fieldIndex >= 0) {
                    setConstraint(fieldIndex);
                } else {
                    // field not found
                }
            } else if (
                typeof rule.current.constraint === 'number' &&
                rule.current.constraintMode === BufferConstraintType.Number
            ) {
                setConstraint(rule.current.constraint);
            }
        }

        const layerDataSource = props.rule.dataSource as DataSource & { layer: Layer };
        const layer = layerDataSource.layer;
        if (layer) {
            const handle = layer.watch('loadStatus', (loadStatus, oldLoadStatus, propertyName, target) => {
                switch (loadStatus) {
                    case 'loaded': {
                        const layer = target as FeatureLayer;
                        if (layer) {
                            setFields(layer.fields.filter((field) => numberBasedFieldTypes.indexOf(field.type) >= 0));
                        }
                    }
                }
            });
            const featureLayer = layer as FeatureLayer;
            setFields(featureLayer?.fields?.filter((field) => numberBasedFieldTypes.indexOf(field.type) >= 0));
            return () => handle?.remove();
        }
    }, []);

    useEffect(() => {
        if (rule.current.constraint !== constraint) {
            if (constraint !== undefined && rule.current.constraintMode === BufferConstraintType.Field) {
                rule.current.constraint = fields[constraint];
            } else {
                rule.current.constraint = constraint;
            }

            onRuleDetailsUpdated();
        }
    }, [constraint, fields]);

    useEffect(() => {
        if (constraintMode !== rule.current.constraintMode) {
            rule.current.constraintMode = constraintMode;
            rule.current.constraint = undefined;
            setConstraint(undefined);
            onRuleDetailsUpdated();
        }
    }, [constraintMode]);

    useEffect(() => {
        if (rule.current.operation !== operation) {
            rule.current.operation = operation;
            onRuleDetailsUpdated();
        }
    }, [operation]);

    return (
        <Box py={1} border={1} borderRight={0} borderLeft={0} borderColor='grey.500' display='flex'>
            <Box height='100%' flexGrow={2}>
                <TextField
                    fullWidth
                    defaultValue={'Buffer of ' + rule.current.dataSource.alias}
                    inputProps={{ readOnly: true }}
                    variant='outlined'
                    size='small'
                />
            </Box>
            <Box ml={1} height='100%' flexGrow={1}>
                <CenteredSelect
                    variant='outlined'
                    value={operation}
                    onChange={(evt) => {
                        setOperation(evt.target.value as BufferOperationType);
                    }}
                >
                    {Object.values(BufferOperationType).map((value) => {
                        return (
                            <CenteredMenuItem key={value} value={value}>
                                {value}
                            </CenteredMenuItem>
                        );
                    })}
                </CenteredSelect>
            </Box>
            <Box ml={1} height='100%' flexGrow={2}>
                {constraintMode === BufferConstraintType.Number ? (
                    <TextField
                        fullWidth
                        type='number'
                        value={constraint !== undefined ? constraint : ''}
                        variant='outlined'
                        size='small'
                        onChange={(evt) =>
                            evt.target.value !== '' ? setConstraint(Number(evt.target.value)) : setConstraint(undefined)
                        }
                    />
                ) : (
                    <CenteredSelect
                        fullWidth
                        variant='outlined'
                        value={constraint !== undefined ? constraint : ''}
                        onChange={(evt) =>
                            evt.target.value !== '' ? setConstraint(Number(evt.target.value)) : setConstraint(undefined)
                        }
                    >
                        {fields.map((field, index) => {
                            return (
                                <CenteredMenuItem key={field.name} value={index}>
                                    {field.name}
                                </CenteredMenuItem>
                            );
                        })}
                    </CenteredSelect>
                )}
            </Box>
            <Box>
                <Button
                    title={
                        constraintMode === BufferConstraintType.Number
                            ? 'Manual entry mode, click to switch to buffer by field mode.'
                            : 'Buffer by field mode, click to switch to manual entry mode.'
                    }
                    onClick={() => {
                        if (constraintMode === BufferConstraintType.Number) {
                            setConstraintMode(BufferConstraintType.Field);
                        } else if (constraintMode === BufferConstraintType.Field) {
                            setConstraintMode(BufferConstraintType.Number);
                        }
                    }}
                >
                    {constraintMode === BufferConstraintType.Number ? (
                        <NumberIcon></NumberIcon>
                    ) : (
                        <TableIcon></TableIcon>
                    )}
                </Button>
            </Box>
        </Box>
    );
};

export default BufferRuleDetails;
