// React imports
import React, { useState, ChangeEvent } from 'react';

// Component imports
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import CheckBox from '@mui/material/Checkbox';
import Radio from '@mui/material/Radio';
import {
    WidgetContainer,
    WidgetHeader,
    WidgetContent,
    WidgetActions,
    ActionButton,
    InputLabel,
    FieldGroup,
    InputGroup,
    InlineSelect,
    InputField,
    CheckBoxGroup,
    RadioGroup,
} from '../common';

// Config
const measures = ['km', 'm', 'mi', 'yd', 'ft'];

// Component
// TESTING ONLY
// This component is used as a sandbox for form components
const DefaultComponent = (): JSX.Element => {
    const [measure, setMeasure] = useState(measures[0]);
    const [checks, setChecks] = useState({
        checkedA: true,
        checkedB: false,
        checkedC: false,
    });
    const [radioValue, setRadioValue] = useState('optionA');

    const handleSelectChange = (event: ChangeEvent<HTMLInputElement>) => {
        setMeasure(event.target.value);
    };

    const handleCheckChange = (event: ChangeEvent<HTMLInputElement>) => {
        setChecks({
            ...checks,
            [event.target.name]: event.target.checked,
        });
    };

    const handleRadioChange = (event: ChangeEvent<HTMLInputElement>) => {
        setRadioValue((event.target as HTMLInputElement).value);
    };

    return (
        <WidgetContainer>
            {/* [Optional] Header is used for tools like a filter, not for widget title. */}
            <WidgetHeader position='static'>Default Widget Header</WidgetHeader>

            {/* The content container should be the only scrolling container in the widget window */}
            <WidgetContent elevation={0}>
                <Typography variant='overline'>Section Divider</Typography>
                <Divider />

                {/* InputField component inherits from MUI TextField component and shares the same props */}
                <FieldGroup>
                    <InputLabel>Standard text input</InputLabel>
                    <InputField
                        variant='outlined'
                        placeholder='Enter some text...'
                        helperText='Required'
                        fullWidth
                        size='small'
                        color='secondary'
                    />
                </FieldGroup>

                <FieldGroup>
                    <InputLabel>Standard number input with measure select</InputLabel>

                    <InputGroup>
                        <InputField
                            variant='outlined'
                            type='number'
                            placeholder='Enter a number...'
                            helperText='Optional'
                            fullWidth
                            size='small'
                            color='secondary'
                            InputLabelProps={{ shrink: true }}
                        />

                        <InlineSelect
                            variant='outlined'
                            value={measure}
                            onChange={handleSelectChange}
                            color='secondary'
                        >
                            {measures.map((measure) => (
                                <MenuItem key={measure} value={measure}>
                                    {measure}
                                </MenuItem>
                            ))}
                        </InlineSelect>
                    </InputGroup>
                </FieldGroup>

                <FieldGroup $bottomgutter>
                    <InputLabel>Standard select</InputLabel>
                    <InputField
                        variant='outlined'
                        select
                        value={measure}
                        onChange={handleSelectChange}
                        fullWidth
                        color='secondary'
                    >
                        {measures.map((measure) => (
                            <MenuItem key={measure} value={measure}>
                                {measure}
                            </MenuItem>
                        ))}
                    </InputField>
                </FieldGroup>

                <Typography variant='overline'>Another Section Divider</Typography>
                <Divider />

                <CheckBoxGroup $bottomgutter>
                    <FormControlLabel
                        control={<CheckBox checked={checks.checkedA} onChange={handleCheckChange} name='checkedA' />}
                        label='Standard Checkbox A'
                    />

                    <FormControlLabel
                        control={<CheckBox checked={checks.checkedB} onChange={handleCheckChange} name='checkedB' />}
                        label='Standard Checkbox B'
                    />

                    <FormControlLabel
                        control={<CheckBox checked={checks.checkedC} onChange={handleCheckChange} name='checkedC' />}
                        label='Standard Checkbox C'
                    />
                </CheckBoxGroup>

                <Typography variant='overline'>Yet Another Section Divider</Typography>
                <Divider />

                <RadioGroup
                    aria-label='Radio buttons'
                    name='radioButtons'
                    value={radioValue}
                    onChange={handleRadioChange}
                    $bottomgutter
                >
                    <FormControlLabel value='optionA' control={<Radio />} label='Option A' />

                    <FormControlLabel value='optionB' control={<Radio />} label='Option B' />

                    <FormControlLabel value='optionC' control={<Radio />} label='Option C' />
                </RadioGroup>

                <Typography variant='overline'>Final Section Shows Scrolling</Typography>
                <Divider />

                <RadioGroup
                    aria-label='Radio buttons'
                    name='radioButtons'
                    value={radioValue}
                    onChange={handleRadioChange}
                >
                    <FormControlLabel value='optionA' control={<Radio />} label='Option A' />

                    <FormControlLabel value='optionB' control={<Radio />} label='Option B' />

                    <FormControlLabel value='optionC' control={<Radio />} label='Option C' />
                </RadioGroup>
            </WidgetContent>

            <WidgetActions elevation={0}>
                <ActionButton variant='outlined' color='secondary'>
                    Cancel
                </ActionButton>

                <ActionButton variant='contained' color='secondary'>
                    Submit
                </ActionButton>
            </WidgetActions>
        </WidgetContainer>
    );
};

export default DefaultComponent;
