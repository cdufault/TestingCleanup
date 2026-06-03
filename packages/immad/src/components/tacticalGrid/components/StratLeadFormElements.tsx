import React, { ChangeEvent, useEffect, useState } from 'react';
import { Typography, FormControlLabel, Radio, MenuItem, Box, TextField, Divider } from '@mui/material';
import { FlexedBox, RadioGroupStratLead, StratLeadSectionTitle } from '../styles';
import { FieldGroup, InputField, InputLabel } from '../../common/styles';
import { formatDatePart } from '../helpers/gridHelper';

/**
 * Interface that describes a JSON 'field' item in the .../get_system.json. HTML elements are contructed
 * from this 'field' data based on the type attribute.
 */
export interface JsonFieldItemProp {
    classification: string;
    default: boolean;
    default_value?: string;
    name: string;
    order: number;
    placeholder?: string;
    required?: boolean;
    title?: string;
    type: string;
    values?: string;
    regex?: string;
    excludeFromJsonUpdate?: boolean;
}

/**
 * Expirimental feature that writes the value in the SMART field when the field has a mapping. -- only textboxes for now.
 */
const baseHintText = 'Current value in SMART:';

/**
 * Types of actions that a stratleadForm can support
 */
export type stratleadFormAction = 'updateAll' | 'updateTime' | 'updateSource' | 'updateLocation' | 'submit';

/**
 * Types of HTML elements SMART data form will be supporting.
 */
export type htmlElementType = 'select' | 'radio' | 'textarea' | 'textbox' | 'date' | 'section' | 'label';

/**
 * Describes the data passed that allows for the creation of a StratLead form HTML element.
 */
export interface StratLeadFormElementProps {
    dataObj: JsonFieldItemProp;
    updateData: (value: string, id: string, isValid?: boolean) => void; //callback to parent when data in the HTML element changes
    funcToUpdateChildElement: (
        //passed back to the parent to allow the parent to push data values to the HTML element
        value: React.Dispatch<React.SetStateAction<string>>, //elements setState function
        id: string,
        validVal: string[] | undefined,
        type: htmlElementType,
        updateHintText?: (foo: string) => void
    ) => void;
    title?: string;
}

/**
 * Values pairs used for updating/fetching SMART data. Can be used in URL or post body
 */
export interface fieldMappingParams {
    fieldName: string;
    fieldValue: string;
}

/**
 * Describes the data passed for the creation of a StratLead dialog.
 * @open if set the true the dialog is open
 * @selectedFieldMaps user defined settings that maps field names between the Tactical Grid and SMART
 * @additonalFieldsToAdd an array of field names (strings) that should be added to the data form, these names are
 * defined in the config.json file
 */
export interface CreateStratLeadDialogProps {
    onClose: (result: stratLeadDialogResult) => void;
    open: boolean;
    container?: HTMLElement | null;
    dialogTitle?: string;
    selectedFieldMaps?: FieldMapType[];
    arrayOfLimitedFieldNamesToAddToForm: string[];
    additonalFieldsToAdd: any[];
    tacticalGridDashboardId: string | undefined;
    semiMajorFieldName: string;
    semiMinorFieldName: string;
    radiusFieldName: string;
}

/**
 * Data type for SMART dashboard systems that are listed in the update form as being siblinngs (in the same group)
 * as the selected Tactical Grid row. All the data values come from the SMART record with the exception of
 * isGroup which is determined to be true only if no groupId attribute is found on the SMART record.
 */
export interface SystemType {
    systemName: string;
    isGroup: boolean;
    recordId: string;
    recordPath: string;
    recordVersion: string;
    guid?:string;
}

/**
 * Data type for field maps
 * @systemFieldName name of the field in SMART
 * @tacticalGridFieldName name of the field in the Tactical Grid
 */
export interface FieldMapType {
    systemFieldName: string;
    tacticalGridFieldName: string;
}

/**
 * Shape of the data object used to map a StratLead form HTML element's setState function and the allowed data values for the element.
 */
export interface elementSetStateObj {
    func: React.Dispatch<React.SetStateAction<string>>; //the setState function for it's data value
    //values that are allowed as data in the HTML element - mostly for radio and selects elements- undefined for textboxes/textarea and date elements.
    validVals: string[] | undefined;
    currentValue?: string;
    type: htmlElementType;
    updateHintText?: (foo: string) => void;
}

/**
 * Represents the data that is returned when the CreateStratLeadDialog closes due to either a Cancel or Submit action.
 */
export interface stratLeadDialogResult {
    message: string;
    success: boolean;
    status?: 'error' | 'warning' | 'info';
}

/**
 * HTML select element
 * @param props element props
 */
export const StratLeadFormSelectElement = (props: StratLeadFormElementProps): JSX.Element => {
    const { dataObj, updateData, funcToUpdateChildElement } = props;
    const [updatedValue, setUpdatedValue] = useState<string | undefined>('');
    const [hintText, setHintText] = useState('');

    useEffect(() => {
        if (updatedValue !== undefined) {
            updateData(updatedValue, dataObj.name);
        }
    }, [updatedValue]);

    useEffect(() => {
        const validInputs = dataObj.values?.split(',');
        if (validInputs) {
            const result = validInputs.find((input) => input === dataObj.default_value);
            if (result) {
                setUpdatedValue(dataObj.default_value); //handle case where defaultValue is 'none'
            }
        }
        funcToUpdateChildElement(setUpdatedValue, dataObj.name, validInputs, 'select', updateHint);
    }, []);

    /**
     * Handle select change.
     * @param event change event
     */
    function onChangeHandler(event: ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        setUpdatedValue(value);
    }

    /**
     * Callback function that is passed to the parent form so that the parent can update the
     * hint text (data value currently in SMART)
     * @param val value to set in the hint text
     */
    function updateHint(val: string) {
        if (val && val !== '') {
            setHintText(`${baseHintText} ${val}`);
        }
    }

    const values = dataObj.values?.split(',');
    const partialKey = dataObj.name.trim();

    return (
        <>
            <FieldGroup>
                <InputLabel>{dataObj.title}</InputLabel>
                {hintText && hintText !== '' ? <Typography variant='caption'>{hintText}</Typography> : ''}
                <InputField
                    fullWidth
                    variant='outlined'
                    color='secondary'
                    select
                    required
                    value={updatedValue}
                    onChange={onChangeHandler}
                >
                    {values?.map((val, index) => (
                        <MenuItem key={`${partialKey}_${index}`} value={val}>
                            {val}
                        </MenuItem>
                    ))}
                </InputField>
                {dataObj.required === false ? (
                    <Box mt={0.5} fontWeight='fontWeightLight' fontStyle='italic'>
                        <Typography variant='caption'>Optional</Typography>
                    </Box>
                ) : (
                    ''
                )}
            </FieldGroup>
        </>
    );
};

/**
 * HTLM textbox element
 * @param props element props
 */
export const StratLeadFormTextElement = (props: StratLeadFormElementProps): JSX.Element => {
    const { dataObj, updateData, funcToUpdateChildElement } = props;
    const [updatedValue, setUpdatedValue] = useState<string | undefined>(dataObj.default_value);
    const [hintText, setHintText] = useState('');
    const [isValid, setIsValid] = useState(true); //testout

    useEffect(() => {
        if (updatedValue !== undefined) {
            updateData(updatedValue, dataObj.name, isValid);
        }
    }, [updatedValue, isValid]);

    function updateHint(val: string) {
        if (val && val !== '') {
            setHintText(`${baseHintText} ${val}`);
        }
    }

    useEffect(() => {
        funcToUpdateChildElement(setUpdatedValue, dataObj.name, undefined, 'textbox', updateHint);
    }, []);

    /**
     * Handle textbox change event
     * @param event change event
     */
    function onChangeHandler(event: ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        const valueIsValid = true;
        //hold for later adding validation if required
        /*  if (dataObj.regex) {
            //sample data had ^[0-9]+[x]?[0-9]+$ was replaced with ^[0-9]+[.]?[0-9]+$
            const regEx = new RegExp(dataObj.regex);
            valueIsValid = regEx.test(value);
        } */
        setIsValid(valueIsValid);
        setUpdatedValue(value);
    }

    return (
        <>
            <FieldGroup>
                <InputLabel>{dataObj.title}</InputLabel>
                {isValid && hintText && hintText !== '' ? <Typography variant='caption'>{hintText}</Typography> : ''}
                {!isValid && updatedValue !== '' ? (
                    <Typography variant='caption' color='error'>{`Value is not valid: ${updatedValue}`}</Typography>
                ) : (
                    ''
                )}
                <InputField
                    variant='outlined'
                    placeholder={dataObj.placeholder}
                    helperText={dataObj.required ? '' : 'Optional'}
                    fullWidth
                    size='small'
                    color='secondary'
                    title={dataObj.title}
                    onChange={onChangeHandler}
                    value={updatedValue}
                />
            </FieldGroup>
        </>
    );
};

/**
 * HTLM date element
 * @param props element props
 */
export const StratLeadFormDateElement = (props: StratLeadFormElementProps): JSX.Element => {
    const { dataObj, updateData, funcToUpdateChildElement } = props;
    const [updatedValue, setUpdatedValue] = useState<string | undefined>(dataObj.default_value ?? '');

    useEffect(() => {
        if (updatedValue !== undefined) {
            updateData(updatedValue, dataObj.name);
        }
    }, [updatedValue]);

    useEffect(() => {
        funcToUpdateChildElement(setUpdatedValue, dataObj.name, [], 'date');
        if (dataObj.default && dataObj.default_value) {
            const d = new Date(dataObj.default_value);
            const dateVal = d.toString();
            const newDateString = `${d.getUTCFullYear()}-${formatDatePart('month', dateVal)}-${formatDatePart(
                'day',
                dateVal
            )}T${formatDatePart('hour', dateVal)}:${formatDatePart('minute', dateVal)}:${formatDatePart(
                'second',
                dateVal
            )}`;
            setUpdatedValue(newDateString);
        }
    }, []);

    /**
     * Handle date element change event
     * @param event change event
     */
    function onChangeHandler(event: ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        setUpdatedValue(value);
    }

    return (
        <>
            <FieldGroup>
                <FlexedBox>
                    <Box pr={1} pt={0.5}>
                        <InputLabel>{dataObj.title}</InputLabel>
                    </Box>
                    <Box mr={1}>
                        <TextField value={updatedValue} onChange={onChangeHandler} type='datetime-local' />
                    </Box>
                </FlexedBox>
            </FieldGroup>
        </>
    );
};

/**
 * HTML radio group element
 * @param props element props
 */
export const StratLeadFormRadioElement = (props: StratLeadFormElementProps): JSX.Element => {
    const { dataObj, updateData, funcToUpdateChildElement } = props;
    const [updatedValue, setUpdatedValue] = useState<string | undefined>(dataObj.default_value);
    const [hintText, setHintText] = useState('');

    useEffect(() => {
        if (updatedValue !== undefined) {
            updateData(updatedValue, dataObj.name);
        }
    }, [updatedValue]);

    useEffect(() => {
        const validInputs = dataObj.values?.split(',');
        funcToUpdateChildElement(setUpdatedValue, dataObj.name, validInputs, 'radio', updateHint);
    }, []);

    /**
     * Callback function that is passed to the parent form so that the parent can update the
     * hint text (data value currently in SMART)
     * @param val value to set in the hint text
     */
    function updateHint(val: string) {
        if (val && val !== '') {
            setHintText(`${baseHintText} ${val}`);
        }
    }
    /**
     * Handle radio elemnt change event.
     * @param event change event
     */
    function onChangeHandler(event: ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        setUpdatedValue(value);
    }

    const radioValues = dataObj.values?.split(',');
    const labelOne = radioValues ? radioValues[0] : '';
    const labelTwo = radioValues ? radioValues[1] : '';

    return (
        <>
            <FieldGroup>
                <InputLabel>{dataObj.title}</InputLabel>
                {hintText && hintText !== '' ? <Typography variant='caption'>{hintText}</Typography> : ''}
                <RadioGroupStratLead name='loopRadioButton' onChange={onChangeHandler} row>
                    <FormControlLabel
                        control={<Radio />}
                        label={labelOne}
                        value={labelOne}
                        title=''
                        checked={updatedValue === labelOne}
                    />
                    <FormControlLabel
                        control={<Radio />}
                        label={labelTwo}
                        value={labelTwo}
                        title=''
                        checked={updatedValue === labelTwo}
                    />
                </RadioGroupStratLead>
            </FieldGroup>
        </>
    );
};

/**
 * HTML textarea element
 * @param props element props
 */
export const StratLeadFormTextAreaElement = (props: StratLeadFormElementProps): JSX.Element => {
    const { dataObj, updateData, funcToUpdateChildElement } = props;
    const [updatedValue, setUpdatedValue] = useState<string | undefined>(dataObj.default_value);

    useEffect(() => {
        if (updatedValue !== undefined) {
            updateData(updatedValue, dataObj.name);
        }
    }, [updatedValue]);

    useEffect(() => {
        funcToUpdateChildElement(setUpdatedValue, dataObj.name, undefined, 'textarea');
    }, []);

    /**
     * Handle textarea text change event.
     * @param event change event
     */
    function onChangeHandler(event: ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        setUpdatedValue(value);
    }

    return (
        <>
            <FieldGroup>
                <InputLabel>{dataObj.title}</InputLabel>
                <InputField
                    multiline
                    variant='outlined'
                    minRows={4}
                    fullWidth
                    value={updatedValue}
                    autoComplete='off'
                    onChange={onChangeHandler}
                />
            </FieldGroup>
        </>
    );
};

/**
 * HTML textarea element
 * @param props element props
 */
export const StratLeadFormLabelElement = (props: StratLeadFormElementProps): JSX.Element => {
    const { dataObj, updateData, funcToUpdateChildElement } = props;
    const [updatedValue, setUpdatedValue] = useState<string | undefined>(dataObj.default_value);

    useEffect(() => {
        if (updatedValue !== undefined) {
            updateData(updatedValue, dataObj.name);
        }
    }, [updatedValue]);

    useEffect(() => {
        funcToUpdateChildElement(setUpdatedValue, dataObj.name, undefined, 'label');
    }, []);

    return (
        <>
            <FieldGroup>
                <FlexedBox>
                    <Box pr={1}>
                        <InputLabel>{dataObj.title}</InputLabel>
                    </Box>
                    <Box mr={1}>
                        <InputLabel>{updatedValue} </InputLabel>
                    </Box>
                </FlexedBox>
            </FieldGroup>
        </>
    );
};

/**
 * Represents a section in the form where groups of elements are separated by some category/type of data being represented
 * @param props element props
 */
export const StratLeadFormSectionTitle = (props: StratLeadFormElementProps): JSX.Element => {
    const { title, funcToUpdateChildElement } = props;
    const [sectionTitle, setSectionTitle] = useState<string | undefined>(title);
    useEffect(() => {
        funcToUpdateChildElement(setSectionTitle, '', [], 'section');
    }, []);
    return (
        <>
            <StratLeadSectionTitle>
                <Typography variant='h6' gutterBottom component='div'>
                    {sectionTitle}
                </Typography>
            </StratLeadSectionTitle>
            <Divider />
        </>
    );
};
