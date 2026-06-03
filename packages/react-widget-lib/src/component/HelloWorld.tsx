import React from 'react';
import Switch from '@mui/material/Switch';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export const Helloworld = ({inputText }: {inputText:string}) => {//
    return (
        <>
            <div className="text">Styled in external css file. {inputText}</div>
            <Switch />
            <Box>
                <Typography sx={{fontSize:'15px', color:'white'}}>MUI sx styled.</Typography>
            </Box>
        </>  
    )
}

/*
    import React from 'react';
    import { Helloworld } from '@stratcom/react-widget-lib';
        
    export const MyReactComponent = () : JSX.Element => {
        return (
            <>
                <Helloworld  inputText="Hello"/>
            </>
        )
    }

*/