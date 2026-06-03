import { Box } from '@mui/material';
import React, { useLayoutEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * This is the page that will be displayed for any errors that need to be sent to the user.
 * @constructor
 */
export default function ErrorPage(props: any) {
    const [errorMessage, setErrorMessage] = useState('An unknown error occurred!!');
    const location = useLocation();
    useLayoutEffect(() => {
        if (!props.error && location.state) {
            setErrorMessage(location.state);
        } else {
            setErrorMessage(props.error);
        }
    }, []);
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <article style={{ padding: '100px', textAlign: 'center', width: '60%' }}>
                <h1 style={{ color: 'red', paddingTop: '20px' }}>An Error Occurred!!!</h1>
                <p style={{ fontSize: '1.75em', fontWeight: '400', paddingTop: '20px' }}>{errorMessage}</p>
                <p style={{ padding: '10px' }}>See 'Console' for more details - press F12</p>
                <p style={{ padding: '20px', fontSize: '1.2em' }}>
                    "Based on the findings of the report, my conclusion was that this idea was not a practical deterrent
                    for reasons which at this moment must be all too obvious." - Dr. Strangelove
                </p>
            </article>
        </Box>
    );
}
