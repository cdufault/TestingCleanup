import React, { useCallback, useEffect, useRef, useState } from 'react';

import './LandingPage.css';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import RegionCard from '../../features/RegionCard/RegionCard';
import LandingPageSummary from '../../features/LandingPageSummary/LandingPageSummary';
import Calendar from '../../features/Calendar/Calendar';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { ILandingPageItems, ILandingPageSummaryRow, IRegionCard, setTotalCards } from './landingPageSlice';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, IconButton, Typography, Switch, Stack } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { setApplicationLoading, setIs2dOnlyActive } from '../../ApplicationSlice';
import { HoverTwoButtonGroup } from '@stratcom/react-widget-lib';
import { getWebGL3DSupportInfo, WebGL3DSupportInfo } from '@stratcom/lib-functions';
import { enqueueSnackbar } from 'notistack';
import { useRegionAppData } from '../../hooks/useRegionAppData';
// Icon Imports
import TableIcon from 'calcite-ui-icons-react/TableIcon';
import ArrowBoldUpIcon from 'calcite-ui-icons-react/ArrowBoldUpIcon';
import CubeIcon from 'calcite-ui-icons-react/CubeIcon';
import SquareIcon from 'calcite-ui-icons-react/SquareIcon';
import PresentationIcon from 'calcite-ui-icons-react/PresentationIcon';
import Carousel from '../../features/CarouselObject/Carousel';
import LandingPageBranding from './LandingPageBranding';
import { useSelector } from 'react-redux';
import { RootState } from '../../data/store';

/**
 * The properties for the region information object to build region and summary cards from.
 */
export interface regionInfo {
    regionName: string;
    regionSummary: string;
}

/**
 * This is the constructor for the initial GATE landing page.
 * @constructor
 */
export default function LandingPage() {
    const dispatch = useAppDispatch();
    const landingPageData = useAppSelector((state) => state.landingPage.landingPageItems);
    const applicationLoading = useAppSelector((state) => state.applicationSlice.applicationLoading);
    const landingPageDataError = useAppSelector((state) => state.landingPage.error);
    const [summaryArray, setSummaryArray] = useState<ILandingPageSummaryRow[]>([]);
    const configureApplication = useAppSelector((state) => state.applicationSlice.gateConfigured);
    const highInterestEventCardTitle = useAppSelector(
        (state) => state.applicationSlice.gateDynamicConfig.highInterestEventCardTitle
    );
    const opsClocks = useAppSelector((state) => state.applicationSlice.gateDynamicConfig.opsClockList);
    const navigate = useNavigate();
    const regionDisplayMode = useAppSelector((state) => state.applicationSlice.regionDisplayMode);
    const { currentIndex } = useSelector((state: RootState) => state.landingPage);

    const nextRef = useRef<HTMLDivElement | null>(null);
    const prevRef = useRef<HTMLDivElement | null>(null);
    const startShadowRef = useRef<HTMLDivElement | null>(null);
    const endShadowRef = useRef<HTMLDivElement | null>(null);
    const regionRef = useRef<HTMLDivElement | null>(null);

    const isFirstRender = useRef(true);

    const [cardContainerScrollLocation, setCardContainerScrollLocation] = useState<number>(0);
    const [cards, setCards] = useState<JSX.Element[]>([]);
    const { regionSliceData } = useRegionAppData();

    const params2D = `viewType=2d`;
    const params3D = `viewType=3d`;

    const is2dOnlyActive = useAppSelector((state) => state.applicationSlice.is2dOnlyActive);

    useEffect(() => {
        dispatch(setTotalCards(landingPageData?.regionCards.length));
    }, [regionSliceData]);

    const button2DClicked = useCallback(() => {
        navigate({
            pathname: '/presentation',
            search: params2D,
        });
    }, [navigate]);

    const button3DClicked = useCallback(() => {
        navigate({
            pathname: '/presentation',
            search: params3D,
        });
    }, [navigate]);

    useEffect(() => {
        if (!configureApplication) {
            navigate('/configuration');
        }
        const webglSupport: WebGL3DSupportInfo = getWebGL3DSupportInfo() as WebGL3DSupportInfo;
        // only provide warning once
        if (!webglSupport.isWebGLSupported && isFirstRender.current) {
            isFirstRender.current = false;
            dispatch(setIs2dOnlyActive(true));
            if (regionDisplayMode === 'Standard') {
                enqueueSnackbar(`${webglSupport.resultMessage}\nViewing regions in 3D has been disabled.`, {
                    variant: 'warning',
                    autoHideDuration: 12000,
                    anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
                });
            }
        }
    }, []);

    useEffect(() => {
        if (landingPageDataError) {
            navigate('/error', {
                state: 'The initial data for populating the landing page was not found.',
            });
        }
        if (landingPageData && landingPageData.regionCards.length > 0) {
            // by this time all data is loaded set application loading false in application slice.
            dispatch(setApplicationLoading(false));
            const summaryArray = createLandingPageSummaryArray(landingPageData);
            setSummaryArray(summaryArray);
        }
    }, [landingPageData, landingPageDataError]);

    /**
     * Creates an array of landing page summary objects to populate the landing page
     * summary section with data. This will be updated in the future to
     * use real data coming from feature class. Currently, using mock data from useLandingPageData hook.
     * @param landingPageData an array of items needed to compose a landing page
     */
    function createLandingPageSummaryArray(landingPageData: ILandingPageItems) {
        const regionSummaryItems: ILandingPageSummaryRow[] = [];
        if (landingPageData) {
            landingPageData.regionCards.forEach((card) => {
                regionSummaryItems.push({
                    regionName: card.regionName,
                    summaryStatement: card.summaryStatement,
                    icodValue: card.summaryIcod,
                });
            });
        }
        return regionSummaryItems;
    }
    useEffect(() => {
        const map = landingPageData?.regionCards?.map((card, idx) => (
            <Box className='card presentation-card' key={idx}>
                <div className='presentation-previous-card-start shadow-indicator' ref={startShadowRef} />
                <div className='presentation-previous-card shadow-indicator' ref={prevRef} />
                <div className='presentation-region-card' ref={regionRef}>
                    <RegionCard regionCard={card} />
                </div>
                <div className='presentation-next-card shadow-indicator' ref={nextRef} />
                <div className='presentation-next-card-end shadow-indicator' ref={endShadowRef} />
            </Box>
        ));
        setCards(map);
    }, [landingPageData]);

    useEffect(() => {
        const measureDimensions = () => {
            if (
                !regionRef.current ||
                !prevRef.current ||
                !nextRef.current ||
                !startShadowRef.current ||
                !endShadowRef.current
            )
                return;

            const isAtStart = currentIndex === 0;
            const isAtEnd = currentIndex + 1 >= cards.length;

            if (isAtStart) {
                // start case
                regionRef.current.className = `presentation-region-card start`;
                nextRef.current.className = `presentation-faux-card next end shift-left-3 shrink-1 visible`;
                endShadowRef.current.className = 'presentation-faux-card next end shift-left-2 shrink-2 visible';
                prevRef.current.className = `presentation-faux-card next end shift-left-1 shrink-3 visible`;
                startShadowRef.current.className = `presentation-faux-card next end shrink-4 visible`;
            } else if (isAtEnd) {
                // end case
                startShadowRef.current.className = `presentation-faux-card previous start shrink-4 visible`;
                prevRef.current.className = `presentation-faux-card previous start shift-right-1 shrink-3 visible`;
                endShadowRef.current.className = 'presentation-faux-card previous start shift-right-2 shrink-2 visible';
                nextRef.current.className = `presentation-faux-card previous start shift-right-3 shrink-1 visible`;
                regionRef.current.className = `presentation-region-card end`;
            } else {
                // middle case
                startShadowRef.current.className = `presentation-faux-card previous start shrink-2 visible`;
                prevRef.current.className = `presentation-faux-card previous start shift-right-1 shrink-1 visible`;
                regionRef.current.className = `presentation-region-card center`;
                nextRef.current.className = `presentation-faux-card next end shift-left-1 shrink-1 visible`;
                endShadowRef.current.className = 'presentation-faux-card next end shrink-2 visible';
            }
        };

        // Ensure DOM updates and styles are applied before measuring
        requestAnimationFrame(measureDimensions);

        // Fallback for older browsers
        const timeout = setTimeout(measureDimensions, 100);

        return () => clearTimeout(timeout);
    }, [currentIndex, cards.length]);

    // Split rows into two columns: even-indexed for the first column; odd-indexed for the 2nd column
    // Note: in the future when changes are made to IMMAD, the user will be forced to specify which column
    // to place each region card in so this will need to change when that happens.
    const evenIndexedRows = landingPageData?.regionCards.filter((_, index) => index % 2 === 0);
    const oddIndexedRows = landingPageData?.regionCards.filter((_, index) => index % 2 !== 0);

    return (
        <>
            {configureApplication ? (
                <>
                    <LandingPageBranding clocks={opsClocks} />
                    <div
                        className={
                            regionDisplayMode === 'Standard' ? 'card-container' : 'card-container overflow-hidden'
                        }
                        onScroll={(evt) => {
                            setCardContainerScrollLocation((evt.target as HTMLElement).scrollTop);
                        }}
                    >
                        {landingPageData && !applicationLoading && landingPageData?.regionCards?.length > 0 ? (
                            <>
                                {regionDisplayMode === 'Standard' ? (
                                    <Box className='cards-wrapper'>
                                        <Box className='landing-page-summary-card'>
                                            <LandingPageSummary
                                                summaryItems={summaryArray}
                                                summaryTitle={highInterestEventCardTitle}
                                            />
                                        </Box>

                                        <Box className='region-cards-container'>
                                            <div className='region-cards-container-header'>
                                                <IconButton
                                                    className='zoom-to-button'
                                                    title='Scroll to Calendar'
                                                    onClick={() => {
                                                        const cardContainer = document.getElementsByClassName(
                                                            'card-container'
                                                        )[0] as HTMLElement;
                                                        cardContainer.scrollTo(0, cardContainer.scrollHeight);
                                                        cardContainer.focus(); // focus needed to fix bug SI-3730
                                                    }}
                                                >
                                                    <TableIcon className='zoom-to-button-icon' />
                                                </IconButton>
                                                <HoverTwoButtonGroup
                                                    width={'75px'}
                                                    iconWidth={'37.5px'}
                                                    height={'50px'}
                                                    iconHeight={'50px'}
                                                    rightButtonLabel={'3D Presentation'}
                                                    leftButtonLabel={
                                                        !is2dOnlyActive
                                                            ? '2D Presentation'
                                                            : '2D Presentation\n3D Presentation Mode has been disabled due to lack of Web GL support.'
                                                    }
                                                    hoverButtonLabel={'Presentation View'}
                                                    onRightButtonClick={button3DClicked}
                                                    onLeftButtonClick={button2DClicked}
                                                    rightButtonIcon={<CubeIcon />}
                                                    leftButtonIcon={<SquareIcon />}
                                                    hoverButtonIcon={<PresentationIcon />}
                                                    disable3dButton={is2dOnlyActive}
                                                />
                                            </div>
                                            <div className='region-cards-container-body'>
                                                <Grid className={'region-card-column'}>
                                                    {evenIndexedRows.map(
                                                        (card: IRegionCard, idx: React.Key | null | undefined) => (
                                                            <Box className='card' key={`even-${idx}`}>
                                                                <RegionCard regionCard={card} />
                                                            </Box>
                                                        )
                                                    )}
                                                </Grid>
                                                <Grid className={'region-card-column'}>
                                                    {oddIndexedRows.map(
                                                        (card: IRegionCard, idx: React.Key | null | undefined) => (
                                                            <Box className='card' key={`odd-${idx}`}>
                                                                <RegionCard regionCard={card} />
                                                            </Box>
                                                        )
                                                    )}
                                                </Grid>
                                            </div>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Box className='presentation-cards-wrapper'>
                                        <Box className='landing-page-summary-card'>
                                            <LandingPageSummary
                                                summaryItems={summaryArray}
                                                summaryTitle={highInterestEventCardTitle}
                                            />
                                        </Box>
                                        <Box className='region-cards-carousel-container'>
                                            <Carousel cards={cards} />
                                        </Box>
                                    </Box>
                                )}

                                {cardContainerScrollLocation > 0 ? (
                                    <IconButton
                                        className='zoom-to-button'
                                        id='scroll-to-top'
                                        title='Scroll to Top'
                                        onClick={() => {
                                            // need to get the element that contains the scrollbar
                                            const cardContainer = document.getElementsByClassName('card-container')[0];
                                            cardContainer.scrollTo({ top: 0 });
                                        }}
                                    >
                                        <ArrowBoldUpIcon className='zoom-to-button-icon' />
                                    </IconButton>
                                ) : (
                                    <></>
                                )}
                            </>
                        ) : applicationLoading ? (
                            <div className='center-circular-progress'>
                                <CircularProgress size={'5rem'} />
                            </div>
                        ) : (
                            <Card sx={{ height: '50%' }}>
                                <CardContent>
                                    <Grid
                                        container
                                        direction='row'
                                        spacing={2}
                                        columns={1}
                                        justifyContent='center'
                                        alignItems='center'
                                    >
                                        <Typography variant='h2' gutterBottom>
                                            There are no regions available.
                                        </Typography>{' '}
                                    </Grid>
                                </CardContent>
                            </Card>
                        )}
                        {regionDisplayMode === 'Standard' ? (
                            <div className='calendar-div'>
                                <Calendar />
                            </div>
                        ) : (
                            <></>
                        )}
                    </div>
                </>
            ) : (
                <div className='card-container'></div>
            )}
        </>
    );
}
