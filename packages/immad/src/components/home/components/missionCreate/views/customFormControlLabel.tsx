import React, { useState } from 'react';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';

interface CustomFormControlLabelProps {
    controlValue: string;
    controlLabel: string;
}

const CustomFormControlLabel = ({ controlValue, controlLabel }: CustomFormControlLabelProps): JSX.Element => {
    const [value] = useState(controlValue);
    const [label] = useState(controlLabel);

    return <FormControlLabel value={value} control={<Radio />} label={label} />;
};

export default CustomFormControlLabel;
