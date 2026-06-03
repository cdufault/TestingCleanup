import React, { useEffect, useState } from 'react';
import { StyledFormControl, StyledSelect } from '../styles';
import { InputLabel, MenuItem } from '@mui/material';
import { RMTFtrClassField, RMTQueryField, updateQueryFieldObj } from './AdminSettingsSlice';
import { useAppDispatch } from '../../../hooks/hooks';

/**
 * properties for the RMTFieldsSelect
 */
interface RMTFieldsSelectProps {
    rmtMessageType: string;
    queryFieldObj: RMTQueryField;
    canEdit: boolean;
    ftrClassFieldsObj: RMTFtrClassField[];
    newtCode: string;
    tooltip: string;
}

/** wrapper for a select used to retrieve RMTD featureclass fields */
export default function RMTFieldsSelect(props: RMTFieldsSelectProps): JSX.Element {
    const { rmtMessageType, canEdit, ftrClassFieldsObj, newtCode, tooltip, queryFieldObj } = props;
    //initially a reference but will be copied when/if the field name is changed
    const [selectedFieldObjCopy, setSelectedFieldObjCopy] = useState<RMTFtrClassField>(queryFieldObj.selectedFieldObj);
    const [selectedFieldName, setSelectedFieldName] = useState(queryFieldObj.selectedFieldObj.name);
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (ftrClassFieldsObj && ftrClassFieldsObj.length > 0) {
            const fname = ftrClassFieldsObj.find((fObj) => fObj.name === selectedFieldName);
            !fname && setSelectedFieldName(''); //set empty when no field is defined or found
        }
    }, [ftrClassFieldsObj]);

    useEffect(() => {
        if (queryFieldObj && queryFieldObj.selectedFieldObj.name !== selectedFieldObjCopy.name) {
            setSelectedFieldObjCopy({
                name: queryFieldObj.selectedFieldObj.name,
                alias: queryFieldObj.selectedFieldObj.alias,
                fieldType: queryFieldObj.selectedFieldObj.fieldType,
            });
            setSelectedFieldName(queryFieldObj.selectedFieldObj.name);
        }
    }, [queryFieldObj]);

    useEffect(() => {
        if (selectedFieldObjCopy !== queryFieldObj.selectedFieldObj) {
            dispatch(
                updateQueryFieldObj({
                    messageType: rmtMessageType,
                    newtCode: newtCode,
                    queryFieldObj: selectedFieldObjCopy, //object values copied into the slice object
                    queryFieldLabel: queryFieldObj.label,
                })
            );
        }
    }, [selectedFieldObjCopy]);

    /**
     * Remove all spaces from a string
     * @param fieldName name of the field
     * @returns fieldName with all spaces removed
     */
    function removeSpaces(fieldName: string) {
        const key = fieldName.replace(/\s/g, ''); //remove all spaces
        return key;
    }

    /**
     * Handle the fields select change event
     * @param value selected item name
     */
    function onFieldNamesSelectChange(value: string) {
        const fClassObj = ftrClassFieldsObj.find((fieldsObj) => fieldsObj.name === value);
        if (fClassObj) {
            setSelectedFieldObjCopy({
                name: fClassObj.name,
                alias: fClassObj.alias,
                fieldType: fClassObj.fieldType,
            });
            setSelectedFieldName(fClassObj.name);
        }
    }
    return (
        <>
            <StyledFormControl fullWidth>
                <InputLabel id='input_label'>{queryFieldObj.label}</InputLabel>
                <StyledSelect
                    labelId='input_label'
                    fullWidth
                    title={tooltip}
                    variant='outlined'
                    color='secondary'
                    disabled={!canEdit}
                    label='Fields'
                    value={selectedFieldName}
                    onChange={(evt) => onFieldNamesSelectChange(evt.target.value)}
                >
                    {ftrClassFieldsObj &&
                        ftrClassFieldsObj.map((obj: RMTFtrClassField, idx: number) => (
                            <MenuItem
                                key={removeSpaces(queryFieldObj.label) + '_' + idx + removeSpaces(obj.name)}
                                value={obj.name}
                            >
                                {obj.alias}
                            </MenuItem>
                        ))}
                </StyledSelect>
            </StyledFormControl>
        </>
    );
}
