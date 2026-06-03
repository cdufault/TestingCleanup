import React, { useEffect, useState } from 'react';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import { PortalItemSelect } from '@stratcom/react-widget-lib';
import { theme } from '../../../styles/theme';
import { ParameterView, AnalyticsParameterType } from '../../../interfaces/AnalyticsGPTypes';
import { StyledParameterDivContainer, StyledPortalItemSelect } from '../styles';
import Portal from '@arcgis/core/portal/Portal';
import PortalItem from '@arcgis/core/portal/PortalItem';

export type AnalyticToolParamProps = {
    toolParameters: Array<ParameterView>;
    isSaveDisabled: boolean;
    onParameterValueChanged: (new_value: AnalyticsParameterType, parameter: ParameterView) => void;
};

type SharedFieldProps = {
    param: ParameterView;
    isSaveDisabled: boolean;
    onParameterValueChanged: (new_value: AnalyticsParameterType, param: ParameterView) => void;
};

export default function AnalyticToolParamControls(props: AnalyticToolParamProps): JSX.Element {
    /** Handles string input with local state to defer updates.
     * Prevents triggering parent updates on every keystroke — only updates on blur or Enter.
     * Solves issue where field lost focus or jumped on change.
     * @param param
     * @param isSaveDisabled
     * @param onParameterValueChanged
     * @constructor
     */
    const ParamField = ({ param, isSaveDisabled, onParameterValueChanged }: SharedFieldProps) => {
        const [localValue, setLocalValue] = useState(param.value ?? '');
        useEffect(() => {
            setLocalValue(param.value ?? '');
        }, [param.value]);
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setLocalValue(e.target.value);
        };
        const handleBlur = () => {
            if (!isSaveDisabled && localValue !== param.value) {
                onParameterValueChanged(localValue, param);
            }
        };
        return (
            <TextField
                label={param.label}
                value={localValue}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSaveDisabled}
                fullWidth
                sx={{ mt: 1, mb: 1 }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault(); // Prevent form submit
                        handleBlur(); // save Value
                    }
                }}
            />
        );
    };

    /**
     * Handles numeric input with local state to capture partial/invalid input (e.g., "-").
     * Converts and validates value on blur or Enter before updating parent.
     * Fixes premature save and loss of user input when entering partial numbers.
     * @param param
     * @param isSaveDisabled
     * @param onParameterValueChanged
     * @constructor
     */
    const NumberParamField = ({ param, isSaveDisabled, onParameterValueChanged }: SharedFieldProps) => {
        const [localValue, setLocalValue] = useState(typeof param.value === 'number' ? param.value.toString() : '');
        useEffect(() => {
            setLocalValue(typeof param.value === 'number' ? param.value.toString() : '');
        }, [param.value]);
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setLocalValue(e.target.value); // keep as string for partial input like "-"
        };
        const handleBlur = () => {
            const numericValue = Number(localValue);
            const isValidNumber = !isNaN(numericValue);
            if (!isSaveDisabled && isValidNumber && numericValue !== param.value) {
                onParameterValueChanged(numericValue, param);
            }
        };
        return (
            <TextField
                label={param.label}
                type='number'
                value={localValue}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSaveDisabled}
                fullWidth
                sx={{ mt: 1, mb: 1 }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault(); // Prevent form submit
                        handleBlur(); // save Value
                    }
                }}
            />
        );
    };

    /**
     * Unified field for handling string/number lists and pick lists using MUI Autocomplete.
     * Uses local state and commits changes on blur or Enter.
     * Supports both multiple and single values based on `param.control_type` and `param.data_type`:
     *   - `control_type === 'list'` => freeSolo + multiple
     *   - `control_type === 'pick_list'` => no freeSolo, single item
     *   - `data_type === 'number'` => parses strings to numbers
     * Dynamically determines behavior and enforces correct typing to avoid runtime or TS errors.
     * Fixes:
     *   - Values being treated as objects (e.g. [object Object])
     *   - Wrong input mode (e.g. pick_list wrongly allowing multiple)
     *   - TS2322 type mismatch by explicitly mapping to expected value shape
     * @param param
     * @param isSaveDisabled
     * @param onParameterValueChanged
     * @constructor
     */
    const AutocompleteParamField = ({ param, isSaveDisabled, onParameterValueChanged }: SharedFieldProps) => {
        const isNumber = param.data_type === 'number';
        const isFreeSolo = param.control_type === 'list';
        const isPickList = param.control_type === 'pick_list';
        const isMultiple =
            (param.control_type === 'list' && param.data_type !== 'string') ||
            (Array.isArray(param.value) && !isPickList);
        const [localValue, setLocalValue] = useState(() => {
            if (isMultiple) return Array.isArray(param.value) ? param.value : [];
            return typeof param.value === 'string' || typeof param.value === 'number' ? param.value : '';
        });
        useEffect(() => {
            if (isMultiple) {
                setLocalValue(Array.isArray(param.value) ? param.value : []);
            } else {
                setLocalValue(typeof param.value === 'string' || typeof param.value === 'number' ? param.value : '');
            }
        }, [param.value]);
        const handleCommit = () => {
            if (!isSaveDisabled && JSON.stringify(localValue) !== JSON.stringify(param.value)) {
                if (isNumber && isMultiple) {
                    const numericValues = (localValue as (string | number)[]).map(Number).filter((val) => !isNaN(val));
                    onParameterValueChanged(numericValues, param);
                } else if (isNumber && !isMultiple) {
                    const numericValue = Number(localValue);
                    if (!isNaN(numericValue)) {
                        onParameterValueChanged(numericValue, param);
                    }
                } else {
                    onParameterValueChanged(localValue, param);
                }
            }
        };

        // allow reset to blank at the top
        const options = param.pick_list_options ? ['', ...param.pick_list_options] : [''];

        return (
            <Autocomplete
                multiple={isMultiple}
                freeSolo={isFreeSolo}
                disableClearable={!isFreeSolo}
                options={options}
                disabled={isSaveDisabled}
                value={localValue}
                onChange={(event, newValue) => {
                    setLocalValue(newValue);
                }}
                onBlur={handleCommit}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCommit();
                    }
                }}
                getOptionLabel={(option) => {
                    // Ensure proper string rendering for single value mode
                    if (typeof option === 'string' || typeof option === 'number') return option.toString();
                    return '';
                }}
                renderTags={(value, getTagProps) =>
                    isMultiple
                        ? value.map((option, index) => <Chip label={option} {...getTagProps({ index })} key={index} />)
                        : null
                }
                renderInput={(params) => (
                    <TextField {...params} label={param.label} type={isNumber ? 'number' : 'text'} />
                )}
            />
        );
    };

    /**
     * LinearUnitParamField
     * Combines a number input + unit dropdown for linear units.
     * @param param
     * @param isSaveDisabled
     * @param onParameterValueChanged
     * @constructor
     */
    const LinearUnitParamField = ({ param, isSaveDisabled, onParameterValueChanged }: SharedFieldProps) => {
        // - Stores number and unit in separate local states (avoids full re-renders when one changes).
        // - Commits combined value directly to parent via onParameterValueChanged on blur or Enter.
        // - Still avoids changing param.value until user finishes editing.
        // Separate local states for number and unit
        const [localNumber, setLocalNumber] = useState('');
        const [localUnit, setLocalUnit] = useState('Meters'); // Sync local state from incoming param value
        useEffect(() => {
            if (typeof param.value === 'string') {
                const [num, ...unitParts] = param.value.split(' ');
                setLocalNumber(num || '');
                setLocalUnit(unitParts.join(' ') || 'Meters');
            }
        }, [param.value]);
        // Commit changes to parent
        const commitValue = () => {
            const combined = `${localNumber} ${localUnit}`.trim();
            if (!isSaveDisabled && combined !== param.value) {
                onParameterValueChanged(combined, param);
            }
        };
        // Blur handler for entire component
        const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
                commitValue();
            }
        };
        return (
            <div onBlur={handleBlur} style={{ display: 'flex', gap: '8px' }}>
                {/* Number input */}
                <TextField
                    label={param.label}
                    type='number'
                    value={localNumber}
                    disabled={isSaveDisabled}
                    onChange={(e) => setLocalNumber(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            commitValue();
                        }
                    }}
                    sx={{ mt: 1, mb: 1, width: 400 }}
                />
                {/* Unit selector */}
                <Autocomplete
                    sx={{ mt: 1, mb: 1, width: 200 }}
                    options={['Feet', 'Kilometers', 'Meters', 'Miles', 'Nautical Miles', 'Yards']}
                    value={localUnit}
                    disabled={isSaveDisabled}
                    onChange={(event, newValue) => {
                        if (newValue) setLocalUnit(newValue);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            commitValue();
                        }
                    }}
                    renderInput={(params) => <TextField {...params} label='Units' />}
                />
            </div>
        );
    };

    /**
     * PortalItemParamField
     * Wraps PortalItemSelect with local state to defer updates until user interaction is complete.
     * Follows the same pattern as other param fields to ensure consistent state management.
     * @param param
     * @param isSaveDisabled
     * @param onParameterValueChanged
     * @constructor
     */
    const PortalItemParamField = ({ param, isSaveDisabled, onParameterValueChanged }: SharedFieldProps) => {
        const [localValue, setLocalValue] = useState(typeof param.value === 'string' ? param.value : '');
        const [isUserInitiated, setIsUserInitiated] = useState(false);

        useEffect(() => {
            const newValue = typeof param.value === 'string' ? param.value : '';

            // Only update local value if this is a legitimate change from the parent
            // or if we don't have a user-initiated value yet
            if (!isUserInitiated || newValue !== '') {
                setLocalValue(newValue);
            }
        }, [param.value]);

        const commitValue = (newValue: string) => {
            if (!isSaveDisabled && newValue !== param.value) {
                console.debug('PortalItemParamField committing value to parent:', {
                    paramId: param.id,
                    value: newValue,
                });
                onParameterValueChanged(newValue, param);
            }
        };

        const handleItemChange = (item: PortalItem | null) => {
            const newValue = item ? item.id : '';

            // Mark this as user-initiated if an item is selected
            if (item) {
                setIsUserInitiated(true);
            }

            // Prevent clearing values unless it's a legitimate clear action
            // Only update if: 1) selecting an item, 2) explicitly clearing by user, 3) no current value
            if (item || (localValue === '' && newValue === '')) {
                setLocalValue(newValue);
                commitValue(newValue);
            } else if (localValue !== '' && newValue === '') {
                // This is likely a mass reset - ignore it
                console.debug('PortalItemParamField ignoring reset attempt:', {
                    paramId: param.id,
                    reason: 'Preventing mass reset of existing value',
                });
            }
        };

        let itemType: string;
        switch (param.portal_item_type) {
            case 'GP':
                itemType = 'Geoprocessing Service';
                break;
            case 'Geoprocessing Service':
            case 'Image Service':
            case 'Scene Service':
                itemType = param.portal_item_type;
                break;
            default:
                itemType = 'feature';
        }

        return (
            <StyledPortalItemSelect>
                <PortalItemSelect
                    theme={theme}
                    portal={Portal.getDefault() as Portal}
                    label={param.label}
                    disabled={isSaveDisabled}
                    query={`type: ${itemType}`}
                    portalItemID={localValue}
                    onItemChange={handleItemChange}
                />
            </StyledPortalItemSelect>
        );
    };
    const CheckboxParamField = ({ param, isSaveDisabled, onParameterValueChanged }: SharedFieldProps) => {
        const [localValue, setLocalValue] = useState(typeof param.value === 'boolean' ? param.value : false);
        useEffect(() => {
            setLocalValue(typeof param.value === 'boolean' ? param.value : false);
        }, [param.value]);
        const handleBlur = () => {
            if (!isSaveDisabled && localValue !== param.value) {
                onParameterValueChanged(localValue, param);
            }
        };
        return (
            <FormControlLabel
                control={
                    <Checkbox
                        checked={localValue}
                        disabled={isSaveDisabled}
                        onChange={(e) => setLocalValue(e.target.checked)}
                        onBlur={handleBlur}
                    />
                }
                label={param.label}
                sx={{ mt: 1, mb: 1 }}
            />
        );
    };

    return (
        <StyledParameterDivContainer>
            {props.toolParameters.map((param) => {
                if (param.data_type === 'string' && param.control_type === 'portal_item') {
                    return (
                        <PortalItemParamField
                            key={`${param.id}-${param.parameter_name}`}
                            param={param}
                            isSaveDisabled={props.isSaveDisabled}
                            onParameterValueChanged={props.onParameterValueChanged}
                        />
                    );
                } else if (param.data_type == 'string' && param.control_type === 'linear_unit') {
                    return (
                        <LinearUnitParamField
                            key={`${param.id}-${param.parameter_name}`}
                            param={param}
                            isSaveDisabled={props.isSaveDisabled}
                            onParameterValueChanged={props.onParameterValueChanged}
                        />
                    );
                } else if (param.control_type === 'list' && param.data_type === 'string') {
                    return (
                        <AutocompleteParamField
                            key={`${param.id}-${param.parameter_name}`}
                            param={param}
                            isSaveDisabled={props.isSaveDisabled}
                            onParameterValueChanged={props.onParameterValueChanged}
                        />
                    );
                } else if (param.control_type === 'list' && param.data_type === 'number') {
                    return (
                        <AutocompleteParamField
                            key={`${param.id}-${param.parameter_name}`}
                            param={param}
                            isSaveDisabled={props.isSaveDisabled}
                            onParameterValueChanged={props.onParameterValueChanged}
                        />
                    );
                } else if (param.data_type === 'string' && param.control_type === 'pick_list') {
                    return (
                        <AutocompleteParamField
                            key={`${param.id}-${param.parameter_name}`}
                            param={param}
                            isSaveDisabled={props.isSaveDisabled}
                            onParameterValueChanged={props.onParameterValueChanged}
                        />
                    );
                } else if (param.data_type === 'number') {
                    return (
                        <NumberParamField
                            key={`${param.id}-${param.parameter_name}`}
                            param={param}
                            isSaveDisabled={props.isSaveDisabled}
                            onParameterValueChanged={props.onParameterValueChanged}
                        />
                    );
                } else if (param.data_type === 'boolean') {
                    return (
                        <CheckboxParamField
                            key={`${param.id}-${param.parameter_name}`}
                            param={param}
                            isSaveDisabled={props.isSaveDisabled}
                            onParameterValueChanged={props.onParameterValueChanged}
                        />
                    );
                } else if (param.data_type === 'string' && param.control_type !== 'group') {
                    return (
                        <ParamField
                            key={`${param.id}-${param.parameter_name}`}
                            param={param}
                            isSaveDisabled={props.isSaveDisabled}
                            onParameterValueChanged={props.onParameterValueChanged}
                        />
                    );
                }
            })}
        </StyledParameterDivContainer>
    );
}
