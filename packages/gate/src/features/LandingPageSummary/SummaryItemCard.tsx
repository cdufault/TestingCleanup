import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@mui/material';
import { ILandingPageSummaryRow } from '../../pages/LandingPage/landingPageSlice';
import RichTextEditorViewer from '../../Share/RichTextEditorViewer';
import './LandingPageSummary.css';
import { formatDateToICODString } from '@stratcom/lib-functions';

/** Interface that describes the Region Summary Card properties. */
interface RegionSummaryCardProps {
    regionSummary: ILandingPageSummaryRow;
}

export const SummaryItemCard = (props: RegionSummaryCardProps) => {
    const { regionSummary } = props;
    const [formattedIcodDate, setFormattedIcodDate] = useState<string>('');

    useEffect(() => {
        if (regionSummary?.icodValue) {
            setFormattedIcodDate(formatDateToICODString(regionSummary.icodValue));
        } else {
            // this is for anything with no ICOD date to help clean it up the data
            setFormattedIcodDate('No ICOD Found.');
        }
    }, [regionSummary?.icodValue]);
    return (
        <Card>
            <CardHeader className={'summary-item-card-header'} title={regionSummary?.regionName.toUpperCase()} />
            <CardContent className={'summary-item-card-summary summary-item-card'}>
                <RichTextEditorViewer viewerData={regionSummary?.summaryStatement} />
            </CardContent>
            <div className='summary-card-icod'>ICOD: {formattedIcodDate}</div>
        </Card>
    );
};
