import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../../hooks/hooks';
import Box from '@mui/material/Box';
import './LandingPage.css';
import { OpsClockWidgetShared } from '../../Share/OpsClockWidgetShared';
import { OpsClockDataSerializable } from '@stratcom/react-widget-lib/types/OpsClockWidgetLib';

/**
 * The properties for the landing page branding object to build region-specific and landing-page specific branding.
 */
export interface landingPageBrandingProps {
    clocks: OpsClockDataSerializable[];
}

export default function LandingPageBranding(props: landingPageBrandingProps) {
    const brandingTitleAlias = useAppSelector((state) => state.applicationSlice.gateDynamicConfig.brandingTitleAlias);
    const brandingSubtitleAlias = useAppSelector(
        (state) => state.applicationSlice.gateDynamicConfig.brandingSubtitleAlias
    );
    const versionNumber = useAppSelector((state) => state.applicationSlice.versionText);
    const brandingLogo = useAppSelector((state) => state.applicationSlice.gateDynamicConfig.brandingLogo);
    const basenameText = useAppSelector((state) => state.applicationSlice.basenameText);
    const [imageUrl, setImageUrl] = useState<string>('');

    useEffect(() => {
        if (brandingLogo) {
            const builtUrl = basenameText + brandingLogo;
            setImageUrl(builtUrl);
        } else {
            const defaultImage = basenameText + 'logo192.png';
            setImageUrl(defaultImage);
        }
    }, [brandingLogo]);

    return (
        <Box className='LandingPage-branding-container'>
            <Box
                component={'img'}
                title={`v${versionNumber}`}
                className='LandingPage-branding-logo'
                src={imageUrl}
                alt={'US Strategic Command seal image'}
            />
            <div className='titleAndClocksSection'>
                <Box className='LandingPage-branding-titles'>
                    <Box className='LandingPage-branding-title'>{brandingTitleAlias}</Box>
                    <Box className='LandingPage-branding-subtitle'>{brandingSubtitleAlias}</Box>
                </Box>
                <Box className='LandingPage-opsclocks'>
                    <OpsClockWidgetShared clocks={props.clocks} />
                </Box>
            </div>
        </Box>
    );
}
