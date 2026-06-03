import React, { useState, useEffect } from 'react';
import { Card, CardContent, Box, Chip } from '@mui/material';
import RichTextEditorViewer from '../../Share/RichTextEditorViewer';
import ExclamationMarkCircle from 'calcite-ui-icons-react/ExclamationMarkCircleIcon';
import { LevelTypeStrings } from '../../pages/LandingPage/landingPageSlice';
import { ConfidenceType, formatDateToICODString } from '@stratcom/lib-functions';
import { RootState } from '../../data/store';
import './ActivityCard.css';
import '@fontsource/roboto/100.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@fontsource/roboto/900.css';
import { useSelector } from 'react-redux';

/**
 * Props for the ActivityCard component.
 */
export type ActivityCardProps = {
    /**
     * The category of the activity.
     */
    category: string;

    /**
     * Additional comments related to the category.
     */
    categoryComments: string;

    /**
     * The ICOD (Information Cut Off Date) value as a date.
     */
    icodValue: Date;

    /**
     * The confidence level in the category.
     */
    categoryConfidence: ConfidenceType;

    /**
     * The category level, represented as a string.
     */
    categoryLevel: LevelTypeStrings;
};

export const ActivityCard = ({
    category,
    categoryComments,
    icodValue,
    categoryConfidence,
    categoryLevel,
}: ActivityCardProps) => {
    const [formattedIcodDate, setFormattedIcodDate] = useState<string>('');

    const highColor = useSelector(
        (state: RootState) => state.applicationSlice.gateDynamicConfig.highActivitySnapshotCategoryColor
    );
    const moderateColor = useSelector(
        (state: RootState) => state.applicationSlice.gateDynamicConfig.moderateActivitySnapshotCategoryColor
    );
    const lowColor = useSelector(
        (state: RootState) => state.applicationSlice.gateDynamicConfig.lowActivitySnapshotCategoryColor
    );

    useEffect(() => {
        if (icodValue) {
            setFormattedIcodDate(formatDateToICODString(icodValue));
        } else {
            // this is for anything with no ICOD date to help clean it up the data
            setFormattedIcodDate('No ICOD Found.');
        }
    }, [icodValue]);

    return (
        <Card className='activity-card'>
            <Box className='activity-header activity-element-top'>
                <Chip
                    label={categoryConfidence.toLowerCase() === 'expected' ? 'Expected' : 'Not Expected'}
                    className={`chip ${
                        categoryConfidence.toLowerCase() === 'expected' ? 'chip-expected' : 'chip-not-expected'
                    } chip-confidence`}
                    title={`These item are currently ${categoryConfidence} for this region.`}
                />

                <Chip
                    variant='outlined'
                    label={categoryLevel.toUpperCase()}
                    className={`chip chip-${categoryLevel.toLowerCase()} chip-level`}
                    icon={
                        categoryLevel.toLowerCase() === 'high' ? (
                            <ExclamationMarkCircle style={{ color: highColor, width:20, height:20, marginLeft:8, marginRight:-10, marginBottom:1}} />
                        ) : (
                            <></>
                        )
                    }
                    title={`This region has been assessed as ${categoryLevel}.`}
                    style={
                        categoryLevel.toLowerCase() === 'high'
                            ? { color: highColor, borderColor: highColor }
                            : categoryLevel.toLowerCase() === 'moderate'
                            ? { color: moderateColor, borderColor: moderateColor }
                            : { color: lowColor, borderColor: lowColor }
                    }
                />
            </Box>
            <Box className='activity-card-category activity-element-middle'>
                <Box className='activity-card-category-value'>{category.toUpperCase()}</Box>
            </Box>
            <CardContent className='activity-card-content activity-element-middle'>
                <Box className='activity-card-rich-text-editor'>
                    <RichTextEditorViewer viewerData={categoryComments} />
                </Box>
            </CardContent>
            <div className='activity-card-icod activity-element-bottom'>ICOD: {formattedIcodDate}</div>
        </Card>
    );
};
