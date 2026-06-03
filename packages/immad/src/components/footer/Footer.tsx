// React imports
import React, { useEffect, useState } from 'react';

// Component imports
import { Grid, Typography } from '@mui/material';

// Context
// Style imports
import { FooterColumn } from './styles';
import { ConfigHelper } from '../../helpers/configHelper';

// Component
const Footer = (): JSX.Element => {
    const [currentTimeUTC, setCurrentTimeUTC] = useState<string | null>();
    const [moveToNextMinute, setMoveToNextMinute] = useState(true);
    const appConfig = ConfigHelper.getAppConfig();

    useEffect(() => {
        const currentTime = new Date();

        //reset time at nearest minute and every minute after that
        //this '60' could be changed to a variable later that comes from a preference if necessary
        const delay = (moveToNextMinute ? 60 - currentTime.getSeconds() : 60) * 1000;

        //check if time is set and it not, set it
        if (currentTimeUTC) {
            const interval = setInterval(() => {
                setMoveToNextMinute(false);
                setCurrentTimeUTC(new Date().toISOString().split('.')[0] + 'Z');
            }, delay);
            return () => clearInterval(interval);
        } else {
            setCurrentTimeUTC(currentTime.toISOString().split('.')[0] + 'Z');
        }
    }, [currentTimeUTC]);

    return (
        <Grid container component='footer' spacing={1} alignItems='center' justifyContent='space-between'>
            <FooterColumn item style={{ flex: 1 }}>
                {currentTimeUTC}
            </FooterColumn>
            <FooterColumn item style={{ flex: 1, justifyContent: 'flex-end' }}>
                {appConfig.areClassificationMarkingsFake && (
                    <Typography align='right' variant='caption'>
                        UNCLASSIFIED - ALL OTHER MARKINGS ARE FOR ILLUSTRATION PURPOSES ONLY.
                    </Typography>
                )}
            </FooterColumn>
        </Grid>
    );
};

export default Footer;
