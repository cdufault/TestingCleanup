import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Unstable_Grid2';
import { ILandingPageSummaryRow } from '../../pages/LandingPage/landingPageSlice';
import './LandingPageSummary.css';
import { SummaryItemCard } from './SummaryItemCard';
import { Box } from '@mui/material';
import { useAppSelector } from '../../hooks/hooks';
import { useSelector } from 'react-redux';
import { RootState } from '../../data/store';

/**Describes the summary item for the landing page regions */
export interface LandingPageSummaryProps {
    summaryItems: ILandingPageSummaryRow[];
    summaryTitle: string;
}

/**
 * Region Summary card will contain the summary of the regions as defined by an analyst in the feature class.
 * @param props contains the list of the regions infos to make the summary's from
 * @constructor
 */
export default function LandingPageSummary(props: LandingPageSummaryProps) {
    const { summaryItems, summaryTitle } = props;
    const regionDisplayMode = useAppSelector((state) => state.applicationSlice.regionDisplayMode);
    const { currentIndex } = useSelector((state: RootState) => state.landingPage);

    return (
        <Card className={'summary-card'}>
            <CardContent className={'summary-card-content summary-card'}>
                <Box className={'summary-title summary-card'}>{summaryTitle.toUpperCase()}</Box>
                <Grid
                    className={'summary-card-container ' + String(regionDisplayMode)}
                    container
                    direction={'column'}
                    spacing={2}
                    columns={1}
                    justifyContent='center'
                >
                    {regionDisplayMode === 'Standard' ? (
                        <>
                            {summaryItems.map((summaryItem, idx) => (
                                <Box key={idx}>
                                    <SummaryItemCard regionSummary={summaryItem} />
                                </Box>
                            ))}
                        </>
                    ) : (
                        <Box>
                            <SummaryItemCard regionSummary={summaryItems[currentIndex]} />
                        </Box>
                    )}
                </Grid>
            </CardContent>
        </Card>
    );
}
