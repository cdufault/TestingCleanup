import React, { useCallback, useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { useNavigate } from 'react-router-dom';
import { IRegionCard } from '../../pages/LandingPage/landingPageSlice';
import { Box } from '@mui/material';
import icon4_green from '../../images/icon4_green.png';
import icon3_gold from '../../images/icon3_gold.png';
import icon2_orange from '../../images/icon2_orange.png';
import icon1_red from '../../images/icon1_red.png';
import CubeIcon from 'calcite-ui-icons-react/CubeIcon';
import SquareIcon from 'calcite-ui-icons-react/SquareIcon';
import './RegionCard.css';
import { useAppSelector } from '../../hooks/hooks';
import Chip from '@mui/material/Chip';
import { HoverTwoButtonGroup } from '@stratcom/react-widget-lib';

import { ActivityCard } from './ActivityCard';

/**
 * Region Details Properties
 */
export interface RegionCardProps {
    regionCard: IRegionCard;
}

/**
 * Region Details card will contain the summary of the regions activity as well
 * as a link to the specific region page.
 * @param props contains the name of the region to link to in the dialog and a collection of region cards data.
 * @constructor
 */
export default function RegionCard(props: RegionCardProps) {
    const navigate = useNavigate();
    const regionCard = props.regionCard;
    const regionDisplayMode = useAppSelector((state) => state.applicationSlice.regionDisplayMode);
    const regionName = regionCard.regionName;
    const params2D = `regionId=${regionName}&viewType=2d`;
    const params3D = `regionId=${regionName}&viewType=3d`;
    const appDataMap = useAppSelector((state) => state.landingPage.appData);
    const [badgeLevel, setBadgeLevel] = useState<number>(0);
    const [watchConLink, setWatchConLink] = useState<string>('');
    const [watchConComment, setWatchConComment] = useState<string>('');
    const [watchConIcon, setWatchConIcon] = useState<JSX.Element>(<img src={icon4_green} alt={'4'} />);
    const is2dOnlyActive = useAppSelector((state) => state.applicationSlice.is2dOnlyActive);

    useEffect(() => {
        if (badgeLevel) {
            getThemeColor(badgeLevel);
        }
    }, [badgeLevel]);

    /**
     * Get the color state for a given watchcon level
     * @param level the level defined on the application object for watchcon color
     * @returns a string to represent a color state
     */
    function getThemeColor(level: number) {
        switch (level) {
            case 1:
                setWatchConIcon(<img src={icon1_red} alt={'1'} />);
                break;
            case 2:
                setWatchConIcon(<img src={icon2_orange} alt={'2'} />);
                break;
            case 3:
                setWatchConIcon(<img src={icon3_gold} alt={'3'} />);
                break;
            default:
                setWatchConIcon(<img src={icon4_green} alt={'4'} />);
        }
    }

    /**
     * Get the watchcon info from the application object
     */
    const AccessRegionWatchConInfo = async () => {
        try {
            if (appDataMap) {
                const appObj = appDataMap.find((item) => {
                    if (item.key === regionName) {
                        return item.value;
                    }
                });

                if (appObj && appObj.value.appId) {
                    const level = appObj.value.watchcon?.level;

                    if (appObj.value.watchcon && level) {
                        const levelVal = Number(level);
                        setBadgeLevel(levelVal);
                        setWatchConLink(appObj.value.watchcon.link);
                        setWatchConComment(appObj.value.watchcon.comment);
                    }
                }
            }
        } catch (error: any) {
            console.error('Error querying region headers:', error);
        }
    };

    useEffect(() => {
        AccessRegionWatchConInfo();
    }, [appDataMap]);

    const button2DClicked = useCallback(() => {
        navigate({
            pathname: '/region',
            search: params2D,
        });
    }, [navigate]);

    const button3DClicked = useCallback(() => {
        navigate({
            pathname: '/region',
            search: params3D,
        });
    }, [navigate]);

    /** The Region Header section */
    const RegionHeader = () => (
        <div className={'region-header'}>
            <Box className={'region-card-header'}>
                <Box className='region-card-chip'>
                    <Chip
                        component='a'
                        href={watchConLink}
                        icon={watchConIcon}
                        target='_blank'
                        title={watchConComment}
                        sx={{
                            backgroundColor: 'transparent',
                        }}
                    />
                </Box>
                <Box className='region-card-title'>{regionName.toUpperCase()}</Box>
                <Box sx={{ flexBasis: '73px' }} />
            </Box>
            <HoverTwoButtonGroup
                width='96px'
                iconWidth='48px'
                height='30px'
                iconHeight='30px'
                rightButtonLabel='3D'
                leftButtonLabel={
                    !is2dOnlyActive
                        ? '2D'
                        : 'View in 2D\nViewing regions in 3D has been disabled due to lack of Web GL support.'
                }
                hoverButtonLabel='VIEW'
                onRightButtonClick={button3DClicked}
                onLeftButtonClick={button2DClicked}
                rightButtonIcon={<CubeIcon />}
                leftButtonIcon={<SquareIcon />}
                disable3dButton={is2dOnlyActive}
            />
        </div>
    );

    return (
        <Card
            className={'region-card'}
            sx={{ ...(regionDisplayMode === 'Presentation' && { height: '100% !important' }) }}
        >
            <CardContent className={'region-card-content'}>
                <RegionHeader />

                {regionCard.regionCardRows.map((cardRow, idx) => (
                    <Box key={`${idx}`}>
                        <ActivityCard
                            categoryConfidence={cardRow.catConfidence}
                            categoryLevel={cardRow.catLevel}
                            category={cardRow.category}
                            categoryComments={cardRow.catComments}
                            icodValue={cardRow.icodDate}
                        />
                    </Box>
                ))}
            </CardContent>
        </Card>
    );
}
