import React, { useRef, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { CenteredMenuItem, CenteredSelect } from './ruleStyles';
import { ImageOperationType, ImageServiceRule } from '../../api/Rule';
import InfoPopover from '../../../common/InfoPopover';

/**
 * Defines the input properties required by the ImageServiceRuleDetails component.
 */
export interface ImageServiceRuleDetailsProps {
    rule: ImageServiceRule;
    onRuleDetailsUpdated: () => void;
}

/**
 * A sub component of the RuleView component that provides the
 * visualization for an image service rule details.
 */
const ImageServiceRuleDetails = (props: ImageServiceRuleDetailsProps): JSX.Element => {
    const { onRuleDetailsUpdated } = props;

    const rule = useRef<ImageServiceRule>(props.rule);

    const [constraint, setConstraint] = useState<number | undefined>(props.rule.constraint);

    const [operation, setOperation] = useState<ImageOperationType>(props.rule.operation);

    const [info, setInfo] = useState<string | undefined>();

    useEffect(() => {
        const imageServiceDS = rule.current.dataSource;

        imageServiceDS.layer.when(() => {
            if (imageServiceDS.layer.serviceRasterInfo?.statistics) {
                const infoStr = `Min:  ${imageServiceDS.layer.serviceRasterInfo.statistics[0].min}
                        Mean: ${imageServiceDS.layer.serviceRasterInfo.statistics[0].avg}
                        Max: ${imageServiceDS.layer.serviceRasterInfo.statistics[0].max}`;
                setInfo(infoStr);
            }
        });
    }, []);

    useEffect(() => {
        rule.current.constraint = constraint;
        onRuleDetailsUpdated();
    }, [constraint]);

    useEffect(() => {
        rule.current.operation = operation;
        onRuleDetailsUpdated();
    }, [operation]);

    return (
        <Box py={1} border={1} borderRight={0} borderLeft={0} borderColor='grey.500' display='flex'>
            <Box height='100%' flexGrow={2}>
                <TextField
                    fullWidth
                    defaultValue={rule.current.dataSource.alias}
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
                        setOperation(evt.target.value as ImageOperationType);
                    }}
                >
                    {Object.values(ImageOperationType).map((value) => {
                        return (
                            <CenteredMenuItem key={value} value={value}>
                                {value}
                            </CenteredMenuItem>
                        );
                    })}
                </CenteredSelect>
            </Box>
            <Box ml={1} height='100%' flexGrow={2}>
                <TextField
                    fullWidth
                    type='number'
                    defaultValue={constraint}
                    variant='outlined'
                    size='small'
                    onChange={(evt) =>
                        evt.currentTarget.value
                            ? setConstraint(Number(evt.currentTarget.value))
                            : setConstraint(undefined)
                    }
                />
            </Box>
            <Box hidden={info === undefined} pl={1} height='100%'>
                <InfoPopover description={'Data Source Statistics\n' + info} />
            </Box>
        </Box>
    );
};

export default ImageServiceRuleDetails;
