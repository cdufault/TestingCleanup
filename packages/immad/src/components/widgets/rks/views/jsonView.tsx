import React from 'react';
import { Box } from '@mui/material';
import { InputField } from '../../../common';

interface jsonInputProps {
    json: string;
}

function JsonView({ json }: jsonInputProps): JSX.Element {
    return (
        <Box>
            <InputField variant='outlined' fullWidth size='small' color='secondary' multiline value={json} />
        </Box>
    );
}

export default JsonView;
