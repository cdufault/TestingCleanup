import React from 'react';
import { StyledFieldGroupStyled } from '../administrator/styles';
import { InputField, InputLabel } from './index';

/**
 * Props for the TextInput component.
 */
interface TextInputProps {
    /** The name of the input field. */
    fieldName: string;
    /** The type of the input field (e.g., 'text', 'number', etc.). */
    fieldType?: string;
    /** The label to display above the input field. */
    label: string;
    /** The value of the input field.*/
    fieldValue: string | number | null;
    /** Event handler for input change.*/
    changeInput: React.FormEventHandler<HTMLInputElement>;
    /** Whether the input field is disabled.*/
    isDisabled?: boolean;
    /** Tooltip to display when hovering over the input field.*/
    toolTip?: string;
    /** Placeholder text to display in the input field. */
    placeHolder?: string;
    /** Whether the input field is a multi-line textarea.*/
    multiLine?: boolean;
    /** Whether there is an error in the input text.*/
    error?: boolean;
    /** Helper text that goes with an error to help get the correct value in the field.*/
    helperText?: string;
    /** Event handler for onBlur.*/
    onBlur?: React.EventHandler<any>;
}

/** Text Input component for form fields.
 * @param {TextInputProps} props - Props for the TextInput component.
 * @returns {JSX.Element} The rendered TextInput component.
 */
const TextInput = ({
    fieldName,
    fieldType,
    label,
    fieldValue,
    changeInput,
    isDisabled,
    toolTip,
    placeHolder,
    multiLine,
    error,
    helperText,
    onBlur,
}: TextInputProps): JSX.Element => {
    return (
        <StyledFieldGroupStyled>
            <InputLabel htmlFor={fieldName} className='form-label'>
                {label}
            </InputLabel>
            <InputField
                autoComplete='off'
                variant='outlined'
                type={fieldType ?? 'text'}
                className='form-control'
                id={fieldName}
                name={fieldName}
                value={fieldValue}
                onInput={changeInput}
                disabled={isDisabled ?? false}
                title={toolTip}
                placeholder={placeHolder}
                multiline={multiLine ?? false}
                error={error ?? false}
                helperText={helperText ?? ''}
                onBlur={onBlur}
            />
        </StyledFieldGroupStyled>
    );
};
export default TextInput;
