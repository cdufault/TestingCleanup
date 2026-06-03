import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { CenterBox } from './MuiBoxStyles';
import { CircularProgress, Typography } from '@mui/material';
import styled from '@emotion/styled';
import './RegionPage.css';
import { useAppSelector } from '../../hooks/hooks';

/**Placeholder to custom tab props to be defined later */
interface CustomTabProps {
    tabUrl?: string;
}

/**Tabs in the region with predefined content such as story maps will use this component to render themselves into
 * a iframe. URLs and tab naming should be retrieved from a configuration.
 */
export const CustomTab = (props: CustomTabProps): JSX.Element => {
    const { tabUrl } = props;
    const [isLoading, setIsLoading] = useState(true);
    const [hasInputDataError, setHasInputDataError] = useState(false);
    const [iFrameSrc, setIFrameSrc] = useState<string | undefined>();
    const config = useAppSelector((state) => state.applicationSlice.applicationConfig); 
    
    //URL to Ian's storymap. Unable to load from external/local URL
    //const iansStoryMap = 'https://cigt-srv21.esri.tech/portal/apps/storymaps/stories/9fc61ac7fa5b43879897f622cf5c5368';

    useEffect(() => {
        if (!tabUrl) {
            //testing only - DEFAULT for proof of concept is to load a local portal
            setIFrameSrc(config.portalUrl);
        }
        else{
            setIFrameSrc(tabUrl);
        }
    }, [tabUrl]);

    /**Called when iframe loads or fails to load
     * @event iframe load event
     */
    function iFrameLoadedComplete(event: React.SyntheticEvent<HTMLIFrameElement, Event>) {
        setIsLoading(false);
    }

    return (
        <>
            {
                hasInputDataError ? 
                    <Box sx={{height:'100vh'}}>
                        <CenterBox sx={{color:'white'}}>
                            <Typography variant='h4' component='h4'>
                                Failed to fine a proper URL to retrieve data. . .
                            </Typography>
                        </CenterBox>
                    </Box> : null
            }
            {
                isLoading ? 
                    <div className='iframe-box'>
                        <CenterBox sx={{color:'white'}}>
                             <CircularProgress/>
                        </CenterBox>
                    </div> : null
            }
            {
                iFrameSrc ?
                    <div className='iframe-box'>
                        <iframe src={iFrameSrc} 
                            title='Custom Tab' 
                            height='100%' 
                            width='100%' 
                            onLoad={iFrameLoadedComplete}>
                        </iframe>   
                    </div>:null  
            }
            
        </>
    );
};
