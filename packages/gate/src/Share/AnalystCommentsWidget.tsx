import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { Button, CircularProgress, Typography } from '@mui/material';

import { AnalystCommentsQueryResult } from '@stratcom/lib-functions';
import { queryTrendsData } from './TrendsWidgetHelper';
import { RootState } from '../data/store';
import { useAppSelector } from '../hooks/hooks';
import { CenterBox, StyledAnalystCommentsWidgetBox } from '../pages/RegionPage/MuiBoxStyles';
import RichTextEditorViewer from './RichTextEditorViewer';

/**
 * Represents a single row of data
 * @typedef {Object} RowData
 * @property {string} rowLabel - the label of the row.
 * @property {number} positionInTable - the positions of the row in the table.
 */
interface RowData {
    rowLabel: string;
    positionInTable: number;
}
/**Activity Trends widget template */
export const AnalystCommentsWidget = (): JSX.Element => {
    const [globalId, setGlobalId] = useState('');
    const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0);
    const [analystCommentsQueryResults, setAnalystCommentsQueryResults] = useState<AnalystCommentsQueryResult[]>([]);
    const [noDataFoundMessage, setNoDataFoundMessage] = useState('');

    const landingPageData = useAppSelector((state) => state.landingPage.landingPageItems);
    const regionName = useAppSelector((state: RootState) => state.regionSlice.regionName);
    const portalUrl = useAppSelector((state: RootState) => state.applicationSlice.applicationConfig.portalUrl);
    const gateTypeKeywords = useAppSelector((state: RootState) => state.applicationSlice.gateRegionAppTypeKeywords);
    const analystCommentsFClassId = useAppSelector(
        (state: RootState) => state.applicationSlice.gateDynamicConfig.analystCommentsFeatureClassId
    );
    const regionsFClassId = useAppSelector(
        (state: RootState) => state.applicationSlice.gateDynamicConfig.regionFeatureClassId
    );
    const defaultRefreshIntervalIfNotDefined = 10;
    const currentMode = useAppSelector((state: RootState) => state.applicationSlice.regionDisplayMode);

    const updateFrequencyForAnalystCommentCategory = useAppSelector(
        (state: RootState) => state.applicationSlice.gateDynamicConfig.updateFrequencyForAnalystCommentCategoryInMinutes
    );

    const appDataMap = useAppSelector((state) => state.landingPage.appData);
    const [currentTrendItem, setCurrentTrendItem] = useState<AnalystCommentsQueryResult | undefined>();
    const [categoryItemCounter, setCategoryItemCounter] = useState<number>(0);

    useEffect(() => {
        let trendsUpdateInterval: NodeJS.Timer | undefined = undefined;
        if (autoRefreshInterval > 0 && currentMode === 'Standard') {
            trendsUpdateInterval = setInterval(queryRegionTimer, autoRefreshInterval * 60 * 1000);
        }

        return () => {
            if (trendsUpdateInterval) {
                clearInterval(trendsUpdateInterval);
            }
        };
    }, [autoRefreshInterval]);

    useEffect(() => {
        if (regionName !== '') {
            setAutoRefreshInterval(0);
        }
    }, [regionName]);

    useEffect(() => {
        if (portalUrl !== '' && gateTypeKeywords !== '' && regionName !== '' && analystCommentsFClassId !== '') {
            regionPageChange(portalUrl, gateTypeKeywords, regionName);
        }
    }, [portalUrl, gateTypeKeywords, regionName, analystCommentsFClassId, globalId, landingPageData]);

    useEffect(() => {
        let trendsInterval: NodeJS.Timer | undefined = undefined;
        if (analystCommentsQueryResults.length > 0) {
            let updateFrequency = updateFrequencyForAnalystCommentCategory
                ? updateFrequencyForAnalystCommentCategory
                : 1;
            trendsInterval = setInterval(updateCount, (updateFrequency as number) * 60 * 1000);
        }
        return () => {
            if (trendsInterval) {
                clearInterval(trendsInterval);
            }
        };
    }, [analystCommentsQueryResults]);

    useEffect(() => {
        if (analystCommentsQueryResults.length > 0) {
            displayNextAnalystTrendCategory();
        }
    }, [categoryItemCounter, analystCommentsQueryResults]);

    /**refresh trends data - used by the timer/interval to auto update ui */
    async function queryRegionTimer() {
        await regionPageChange(portalUrl, gateTypeKeywords, regionName);
    }

    /**update the counter on the analyst comment category */
    function updateCount() {
        if (analystCommentsQueryResults.length > 0) {
            setCategoryItemCounter((categoryItemCounter) => {
                if (categoryItemCounter + 1 >= analystCommentsQueryResults.length) {
                    return 0;
                } else {
                    return categoryItemCounter + 1;
                }
            });
        }
    }

    /**Display the next analyst comment category item */
    function displayNextAnalystTrendCategory() {
        setCurrentTrendItem(analystCommentsQueryResults[categoryItemCounter]);
    }

    /**handle btn next category comment click */
    function btnShowNextCategoryCommentClick() {
        setAnalystCommentsQueryResults([...analystCommentsQueryResults]);
        if (categoryItemCounter + 1 >= analystCommentsQueryResults.length) {
            setCategoryItemCounter(0);
        } else {
            setCategoryItemCounter((categoryItemCounter) => categoryItemCounter + 1);
        }
    }

    /**handle btn previous category comment click */
    function btnShowPrevCategoryCommentClick() {
        setAnalystCommentsQueryResults([...analystCommentsQueryResults]);
        if (categoryItemCounter - 1 < 0) {
            setCategoryItemCounter(analystCommentsQueryResults.length - 1); //go to last item
        } else {
            setCategoryItemCounter((categoryItemCounter) => categoryItemCounter - 1);
        }
    }

    /**
     * update the associated data for the current region -- called every time a new region is designated
     * several state variables are updated in this call but no query to the trends feature class
     * @param portalUrl url to the portal
     * @param gateTypeKeywords gate typekeywords for application searches
     * @param regionName name of the current region
     */
    async function updateSelectedRegionData(portalUrl: string, gateTypeKeywords: string, regionName: string) {
        let globalId = '';
        let regionAppData = undefined;
        const appData = appDataMap?.find((item) => {
            if (item.key === regionName) {
                return item.value;
            }
        });
        if (appData) {
            regionAppData = appData.value;
            const refreshInterval = regionAppData?.refreshIntervalInMinutes
                ? regionAppData.refreshIntervalInMinutes
                : defaultRefreshIntervalIfNotDefined;
            globalId = regionAppData.regionFtrClassGlobalId;
            globalId && setGlobalId(globalId);
            setAutoRefreshInterval(refreshInterval);
        } else {
            setGlobalId('');
            setAnalystCommentsQueryResults([]);
            setNoDataFoundMessage('No Comments Found.');
        }
        return [globalId, regionAppData];
    }

    /**
     * Update the text data for the analyst comments widget from the trends feature class
     */
    async function refreshAnalystCommentsData(globalId: string, selectedRegionAppData: any) {
        // Check if the necessary data is available before proceeding
        if (regionName && analystCommentsFClassId !== '' && globalId !== '' && selectedRegionAppData) {
            // Sort the rows of the selectedRegionAppData by their positionInTable property
            const sortedArray = selectedRegionAppData.rows
                .slice()
                .sort((a: any, b: any) => a.positionInTable - b.positionInTable);

            // Create a mapping of row labels to their corresponding indices in the sortedArray
            const categoryIndexMap: { [key: string]: number } = sortedArray.reduce(
                // The reduce function is used here to iterate over the sortedArray and build the categoryIndexMap object.
                (acc: { [key: string]: number }, item: RowData, index: number) => {
                    // For each item in the sortedArray, we add its rowLabel as a key in the categoryIndexMap
                    // and assign its index as the value.
                    acc[item.rowLabel] = index;
                    return acc;
                },
                {} // The initial value of the accumulator is an empty object.
            );

            try {
                // Query the trends data for the specified region, analystCommentsFClassId, and globalId.
                const results = await queryTrendsData(selectedRegionAppData, analystCommentsFClassId, globalId);

                if (results && results.length > 0) {
                    // If we have results, we sort them based on the categoryIndexMap we created earlier.
                    const sortedQueryResults = [...results].sort((a, b) => {
                        // Sorting is based on the categoryIndexMap values, which represent the positions of the row labels in the sortedArray.
                        if (a.category && b.category) {
                            const categoryAIndex = categoryIndexMap[a.category];
                            const categoryBIndex = categoryIndexMap[b.category];
                            return categoryAIndex - categoryBIndex;
                        }
                        return 0;
                    });

                    // Update the state with the sortedQueryResults and reset the "No Data Found" message.
                    setAnalystCommentsQueryResults(sortedQueryResults);
                    setNoDataFoundMessage('');
                } else {
                    // If there are no results, reset the state with an empty array and display the "No Trends Data Found" message.
                    setAnalystCommentsQueryResults([]);
                    setNoDataFoundMessage('No Comments Found');
                }
            } catch (error) {
                // If there is an error during the data fetching process, reset the state with an empty array and display an error message.
                setAnalystCommentsQueryResults([]);
                setNoDataFoundMessage('Error fetching data.');
            }
        }
    }

    /**
     * function to keep update and refresh organized and running one before the other to avoid race condition
     * @param portalUrl url of portal
     * @param gateTypeKeywords gate typekeywords for application searches
     * @param regionName name of current region
     */
    async function regionPageChange(portalUrl: string, gateTypeKeywords: string, regionName: string) {
        if (regionsFClassId !== '' && landingPageData) {
            // update region data needs to run first
            const [tempGlobalId, tempRegionAppData] = await updateSelectedRegionData(
                portalUrl,
                gateTypeKeywords,
                regionName
            );
            setGlobalId(tempGlobalId);
            // after update runs, then refresh comment data with the values returned from update function
            await refreshAnalystCommentsData(tempGlobalId, tempRegionAppData);
        }
    }

    let message =
        analystCommentsQueryResults.length > 1
            ? `Each item will display for  ${
                  updateFrequencyForAnalystCommentCategory
                      ? (updateFrequencyForAnalystCommentCategory as number) * 60
                      : 60
              } seconds`
            : '';

    /**Styles inline since this is just a placeholder */
    return (
        <StyledAnalystCommentsWidgetBox>
            {currentTrendItem && analystCommentsQueryResults.length > 0 && (
                <>
                    <Box sx={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', marginBottom: 'auto' }}>
                        <TrendsRow trendComment={currentTrendItem} index={categoryItemCounter} />
                    </Box>
                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
                        <Box sx={{ marginLeft: '-12px' }}>
                            <Button variant='text' onClick={btnShowPrevCategoryCommentClick}>
                                Prev
                            </Button>
                        </Box>
                        <Box sx={{ paddingTop: '7px' }}>
                            <Typography variant='subtitle2'>
                                Item: {categoryItemCounter + 1} of {analystCommentsQueryResults.length}
                            </Typography>
                        </Box>
                        <Box>
                            <Button variant='text' onClick={btnShowNextCategoryCommentClick}>
                                Next
                            </Button>
                        </Box>
                    </Box>

                    <Box sx={{}}>
                        <Typography variant='caption'>{message}</Typography>
                    </Box>
                </>
            )}

            {analystCommentsQueryResults.length < 1 && noDataFoundMessage === '' && (
                <CenterBox>
                    <CircularProgress />
                </CenterBox>
            )}
            {noDataFoundMessage !== '' && (
                <CenterBox>
                    <Typography>{noDataFoundMessage}</Typography>
                </CenterBox>
            )}
        </StyledAnalystCommentsWidgetBox>
    );
};

/**
 * describes a single element in the trends widget display
 */
export interface TrendsRowProps {
    /**the text of the comment along with the date */
    trendComment: AnalystCommentsQueryResult;
    /**index value for rendering order and */
    index: number;
}

/**A row of data in the trends widget */
export default function TrendsRow(props: TrendsRowProps) {
    const { comment, date, category, human_readable_class } = props.trendComment;
    const newDate = new Date(date);
    const dateText = newDate.toUTCString();

    return (
        <React.Fragment>
            <Box key={props.index} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ paddingTop: '10px' }}>
                    <Typography variant='h6'>{category}</Typography>
                </Box>
                <Box sx={{ paddingTop: '15px' }}>
                    <Typography variant='subtitle2'>Classification:</Typography>
                </Box>
                <Box sx={{}}>
                    <Typography variant='subtitle2'>
                        {human_readable_class ? human_readable_class : 'UNCLASSIFIED//'}
                    </Typography>
                </Box>

                <Box sx={{ paddingTop: '15px', overflow: 'auto' }}>
                    <RichTextEditorViewer viewerData={comment} />
                </Box>

                <Box sx={{ display: 'flex', paddingTop: '10px' }}>
                    <Box sx={{}}>
                        <Typography variant='subtitle2'>Last Updated:</Typography>
                    </Box>
                    <Box sx={{}}>
                        <Typography variant='subtitle2'>{dateText}</Typography>
                    </Box>
                </Box>
            </Box>
        </React.Fragment>
    );
}
