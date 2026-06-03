import React, { useEffect, useState } from 'react';
import { StyledAccordion, StyledAccordionSummary, StyledActionPhraseBox, StyledFormControl } from '../styles';
import PortalItem from '@arcgis/core/portal/PortalItem';
import {
    RMTCodeTypeQueryMetadata,
    RMTFtrClassField,
    RMTQueryField,
    updatePortalItemId,
    updateCodeAlias,
} from './AdminSettingsSlice';
import { AccordionDetails, TextField, Typography } from '@mui/material';
import { PortalItemSelect } from '@stratcom/react-widget-lib';
import { theme } from '../../../styles/theme';
import Portal from '@arcgis/core/portal/Portal';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { useAppDispatch } from '../../../hooks/hooks';
import DownArrowIcon from 'calcite-ui-icons-react/ArrowDownIcon';
import RMTFieldsSelect from './RMTFieldsSelect';

/**
 * properties for the RMTCodeType
 */
interface RMTCodeTypeProps {
    canEdit: boolean;
    rmtMessageType: string;
    codeType: RMTCodeTypeQueryMetadata;
}

/**Handle display and selection of props for the RMTQueryMetadata */
export default function RMTCodeType(props: RMTCodeTypeProps): JSX.Element {
    const { canEdit, rmtMessageType, codeType } = props;
    const [ftrClassFieldsObj, setFtrClassFieldsObj] = useState<RMTFtrClassField[]>([]);
    const dispatch = useAppDispatch();
    const [portalItemId, setPortalItemId] = useState('');
    const [codeAlias, setCodeAlias] = useState('');

    useEffect(() => {
        if (codeType) {
            setPortalItemId(codeType.portalItemId);
            if (codeType.portalItemId !== portalItemId) {
                getLayerFieldNames(codeType.portalItemId);
            }
            setCodeAlias(codeType.codeAlias);
        }
    }, [codeType]);

    useEffect(() => {
        if (portalItemId && portalItemId !== codeType.portalItemId) {
            getLayerFieldNames(portalItemId);
        }
    }, [portalItemId]);

    /**
     * Selected featureclass portal item change event handler
     * @param portalItemId
     */
    const onPortalItemSelectWidgetChanged = (portalItemId: string) => {
        if (portalItemId !== codeType.portalItemId) {
            dispatch(
                updatePortalItemId({
                    messageType: rmtMessageType,
                    newtCode: codeType.newtCode,
                    portalItemId: portalItemId,
                    codeType: codeType,
                })
            );
            setPortalItemId(portalItemId);
        }
    };

    /**
     * Handle alias change event
     * @param evt change event for the textbox
     */
    const onAliasTextChange = (evt: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        dispatch(
            updateCodeAlias({
                messageType: rmtMessageType,
                newtCode: codeType.newtCode,
                codeAlias: evt.target.value,
                codeType: codeType,
            })
        );
        setCodeAlias(evt.target.value);
    };

    /**
     * Retrieve all the ftr class field names and alias names with the exception of the geometry field
     * @param portalItemId featureclass portal item id
     */
    const getLayerFieldNames = (portalItemId: string) => {
        const featureLayer = new FeatureLayer({
            portalItem: {
                id: portalItemId,
            },
        });
        featureLayer.load().then((e) => {
            const fieldObjects = featureLayer.fields
                .filter((field) => field.type !== 'geometry')
                .map((field) => {
                    const numberTypes = ['integer', 'single', 'small-integer', 'double', 'long'];
                    const isNumber = numberTypes.find((numberType) => numberType === field.type);
                    return { alias: field.alias, name: field.name, fieldType: isNumber ? 'number' : 'string' };
                });
            console.debug(`fields for ${portalItemId}: `, fieldObjects);
            //fire UI update to redraw the select
            setFtrClassFieldsObj([...fieldObjects]);
        });
    };

    return (
        <>
            <StyledAccordion>
                <StyledAccordionSummary expandIcon={<DownArrowIcon />}>
                    <Typography>{codeType.newtCode}</Typography>
                </StyledAccordionSummary>
                <AccordionDetails>
                    <StyledActionPhraseBox>
                        <TextField
                            label={'Code Alias'}
                            fullWidth
                            value={codeAlias}
                            placeholder='Add Data String'
                            inputProps={{ readOnly: !canEdit }}
                            variant='outlined'
                            size='small'
                            onChange={(evt) => {
                                onAliasTextChange(evt);
                            }}
                        />
                    </StyledActionPhraseBox>
                    <StyledFormControl fullWidth>
                        <PortalItemSelect
                            theme={theme}
                            portal={Portal.getDefault() as Portal}
                            label={'Source Data'}
                            disabled={!canEdit}
                            query={"type: 'feature'"}
                            portalItemID={portalItemId}
                            onItemChange={(item: PortalItem | null) => {
                                onPortalItemSelectWidgetChanged(item ? item.id : '');
                            }}
                        />
                    </StyledFormControl>
                    {codeType &&
                        codeType.queryFields.map((queryField: RMTQueryField, index: number) => (
                            <RMTFieldsSelect
                                rmtMessageType={rmtMessageType}
                                queryFieldObj={queryField}
                                canEdit={canEdit}
                                ftrClassFieldsObj={ftrClassFieldsObj}
                                newtCode={codeType.newtCode}
                                tooltip={
                                    index === 0
                                        ? 'Field to query for message values.'
                                        : 'Additional field needed for processing'
                                }
                            />
                        ))}
                </AccordionDetails>
            </StyledAccordion>
        </>
    );
}
