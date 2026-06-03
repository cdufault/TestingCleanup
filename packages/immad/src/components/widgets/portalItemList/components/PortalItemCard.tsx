// React imports
import React, { useState, useEffect } from 'react';

// Component imports
import { Typography, Divider, Tooltip } from '@mui/material';
import { OverflowTooltip, InputGroup } from '../../../common';
import CheckCircleIcon from 'calcite-ui-icons-react/CheckCircleIcon';
import CircleDisallowedIcon from 'calcite-ui-icons-react/CircleDisallowedIcon';
import LaunchIcon from 'calcite-ui-icons-react/LaunchIcon';

// Helper Imports
import { ApplicationStateHelper } from '../../../../helpers/ApplicationStateHelper';
import { cleanLicenseInfo, getClassificationList } from '@stratcom/lib-functions';
import { ConfigHelper } from '../../../../helpers/configHelper';
import { useSnackbar } from 'notistack';

import { DataFeedItem } from '../resources';
import defaultThumbnail from '../../../../images/default_thumbnail.png';
import { theme } from '../../../../styles/theme';
import FeatureLayerIcon from 'calcite-ui-icons-react/FeatureLayerIcon';
import LayerIcon from 'calcite-ui-icons-react/LayerIcon';
import HammerIcon from 'calcite-ui-icons-react/HammerIcon';
import ImageLayerIcon from 'calcite-ui-icons-react/ImageLayerIcon';
import LayerServiceIcon from 'calcite-ui-icons-react/LayerServiceIcon';
import TileLayerIcon from 'calcite-ui-icons-react/TileLayerIcon';
import LayerMapIcon from 'calcite-ui-icons-react/LayerMapIcon';

import {
    StyledClassificationMarkingText,
    StyledCard,
    StyledCardContent,
    StyledCardMedia,
    StyledCardContentBox,
    StyledItemMarkingBox,
    StyledItemStatusBox,
    StyledItemClassificationBox,
    StyledItemCreatedByBox,
    StyledInlineFlexBox,
    StyledIconBox,
    StyledCardActions,
    StyledLaunchIconBox,
    StyledStatusBox,
    StyledSpanBlock,
    StyledSpanForEllipsis,
    StyledSpanEmptyBlock,
    StyledBoxDisplayFlex,
    StyledTypographyMarginTop,
    StyledTopicIcon,
} from '../styles';
import { UserSession } from '@esri/arcgis-rest-auth';
import { useAppSelector } from '../../../../hooks/hooks';

interface PortalItemCardProps {
    item: DataFeedItem;
    cardActionsTemplate: JSX.Element | undefined;
    useNoneCloneJSX?: boolean;
    userSession: UserSession;
}

interface ClassificationColor {
    backgroundColor: string;
    textColor: string;
}
/**
 * Displays a formatted portal item
 * @param props contains the portal item and the card actions template
 */
function PortalItemCard(props: PortalItemCardProps): JSX.Element {
    const { item, cardActionsTemplate, useNoneCloneJSX, userSession } = props;
    const AppConfig = useAppSelector((state) => state.applicationSlice);
    const { portalItem } = item;
    const { id } = portalItem;
    const url = AppConfig.portalUrl;

    const { title, owner, thumbnailUrl, modified, created, licenseInfo, snippet, type, numViews } = portalItem;
    // removes f=json which causes issues with BMPs.
    const trimmedThumbnailUrl = thumbnailUrl ? thumbnailUrl.split('?')[0] : defaultThumbnail;
    const thumbnailImage = getSecureThumbnailUrl(trimmedThumbnailUrl, userSession);

    const [classification, setClassification] = useState<string>();
    const [classifyColor, setClassifyColor] = useState<ClassificationColor>({
        backgroundColor: theme.palette.common.black,
        textColor: theme.palette.common.white,
    });
    const [cardActions, setCardActions] = useState<JSX.Element>();
    const [contentStatus, setContentStatus] = useState<string>();
    const { enqueueSnackbar } = useSnackbar();

    const [categoryData, setCategoryData] = useState<JSX.Element>(
        <>
            <StyledSpanBlock>None</StyledSpanBlock>
            <StyledSpanEmptyBlock> </StyledSpanEmptyBlock>
            <StyledSpanEmptyBlock> </StyledSpanEmptyBlock>
        </>
    );
    const [categoryDataToolTip, setCategoryDataToolTip] = useState<string>('None');

    useEffect(() => {
        if (licenseInfo) {
            try {
                const classifications = getClassificationList();

                const goodLicenseInfo = cleanLicenseInfo(licenseInfo, classifications);

                if (goodLicenseInfo && ApplicationStateHelper.isJSON(goodLicenseInfo)) {
                    const licenseInfoObject = JSON.parse(goodLicenseInfo);
                    const isSCI = licenseInfoObject?.sciOptions?.length > 0;
                    const color = getClassificationColor(licenseInfoObject.classification, isSCI);
                    if (color) {
                        setClassifyColor(color);
                    }
                    setClassification(licenseInfoObject.banner);
                } else {
                    setClassification('Classification Not Set');
                }
            } catch (e) {
                console.error(e);
                setClassification('Classification Not Set');
            }
        } else {
            setClassification('Classification Not Set');
        }
        if (cardActionsTemplate && useNoneCloneJSX !== true) {
            //set the current item properties on a clone of the actions template
            const clone = React.cloneElement(cardActionsTemplate, { ...cardActionsTemplate.props, item: portalItem });
            setCardActions(clone);
        }

        //content type for authoritative can be org_authoritative or public_authoritative
        if (portalItem.sourceJSON?.contentStatus?.includes('authoritative')) {
            setContentStatus('authoritative');
        } else if (portalItem.sourceJSON?.contentStatus === 'deprecated') {
            setContentStatus('deprecated');
        }

        if (cardActionsTemplate && cardActionsTemplate.props.categories) {
            const forDisplay = portalItem?.categories[0]?.split('/');
            if (forDisplay && forDisplay.length > 3) {
                // handles 2 or more levels deep topics
                setCategoryData(
                    <>
                        <StyledSpanBlock>{forDisplay[2]}</StyledSpanBlock>
                        <StyledSpanForEllipsis>...</StyledSpanForEllipsis>
                        <StyledSpanBlock>{forDisplay[forDisplay.length - 1]}</StyledSpanBlock>
                    </>
                );
            } else if (forDisplay) {
                // handles 1 level deep mission topics
                setCategoryData(
                    <>
                        <StyledSpanBlock>{forDisplay[forDisplay.length - 1]}</StyledSpanBlock>
                        <StyledSpanEmptyBlock> </StyledSpanEmptyBlock>
                        <StyledSpanEmptyBlock> </StyledSpanEmptyBlock>
                    </>
                );
            }
            const categories = portalItem.categories.toString();
            setCategoryDataToolTip(categories?.replaceAll(',', '\n'));
        }
    }, []);

    const getClassificationColor = (classification: string, isSCI: boolean): ClassificationColor | undefined => {
        const appConfig = ConfigHelper.getAppConfig();
        let classificationColor;

        if (isSCI) {
            classificationColor = appConfig.portalItemList.classifications.find((x) => x.name === 'SCI');
        } else {
            classificationColor = appConfig.portalItemList.classifications.find(
                (colorDefinition) => colorDefinition.name === classification
            );
        }

        return classificationColor;
    };

    function getSecureThumbnailUrl(thumbnailUrl: string, session?: UserSession): string {
        return thumbnailUrl && session ? `${thumbnailUrl}?token=${session.token}` : defaultThumbnail;
    }

    function getTypeIcon() {
        switch (type) {
            case 'Feature Service':
                return <FeatureLayerIcon size={16} />;
            case 'Image Service':
                return <ImageLayerIcon size={16} />;
            case 'Scene Service':
                return <LayerServiceIcon size={16} />;
            case 'Geoprocessing Service':
                return <HammerIcon size={16} />;
            case 'Vector Tile Service':
                return <TileLayerIcon size={16} />;
            case 'Map Service':
                return <LayerMapIcon size={16} />;
            default:
                return <LayerIcon size={16} />;
        }
    }

    const viewInPortal = () => {
        if (url && id) {
            window.open(`${url}/home/item.html?id=${id}`, '_blank', 'noopener');
        } else {
            enqueueSnackbar('Unable to retrieve the portal url for the selected item.', {
                variant: 'error',
            });
        }
    };

    return (
        <StyledCard variant='outlined'>
            <StyledCardContent>
                <InputGroup>
                    <StyledCardMedia image={thumbnailImage} title={'View in Portal'} onClick={viewInPortal} />
                    <StyledCardContentBox>
                        <StyledItemStatusBox>
                            <StyledLaunchIconBox title={'View in Portal'}>
                                <LaunchIcon size={14.5} onClick={viewInPortal} />
                            </StyledLaunchIconBox>
                            {classification && (
                                <StyledItemClassificationBox
                                    title={
                                        classification === 'Classification Not Set'
                                            ? 'View in Portal to set classification'
                                            : classification
                                    }
                                    bgcolor={classifyColor.backgroundColor}
                                    color={classifyColor.textColor}
                                >
                                    <StyledClassificationMarkingText>{classification}</StyledClassificationMarkingText>
                                </StyledItemClassificationBox>
                            )}
                        </StyledItemStatusBox>

                        <StyledStatusBox>
                            <OverflowTooltip gutterBottom={true} variant='subtitle1' value={title} />
                        </StyledStatusBox>

                        {cardActionsTemplate?.props.categories ? (
                            <StyledBoxDisplayFlex>
                                <StyledTopicIcon size={16} />
                                <Tooltip title={categoryDataToolTip} aria-multiline={true}>
                                    <StyledTypographyMarginTop variant='body2'>
                                        {categoryData}
                                    </StyledTypographyMarginTop>
                                </Tooltip>
                            </StyledBoxDisplayFlex>
                        ) : (
                            <StyledItemCreatedByBox>
                                <StyledInlineFlexBox>
                                    {type && <StyledIconBox title={type}>{getTypeIcon()}</StyledIconBox>}
                                    <Typography variant='caption' color='textSecondary'>
                                        {' '}
                                        by {owner}
                                    </Typography>
                                </StyledInlineFlexBox>
                            </StyledItemCreatedByBox>
                        )}

                        <StyledStatusBox>
                            {contentStatus && (
                                <StyledItemMarkingBox
                                    color={contentStatus === 'authoritative' ? '#4aaa4a' : '#d30a0a'}
                                    title={contentStatus === 'authoritative' ? 'Authoritative' : 'Deprecated'}
                                >
                                    {contentStatus === 'authoritative' ? (
                                        <CheckCircleIcon size={16} />
                                    ) : (
                                        <CircleDisallowedIcon size={16} />
                                    )}
                                </StyledItemMarkingBox>
                            )}
                        </StyledStatusBox>
                    </StyledCardContentBox>
                </InputGroup>

                <StyledStatusBox>
                    <Typography variant='caption' color='textSecondary'>
                        {`Updated: ${modified ? new Date(modified).toUTCString() : new Date(created).toUTCString()}`}
                    </Typography>
                    <Typography style={{ alignItems: 'flex-end' }} variant='caption' color='textSecondary'>
                        {`Views: ${numViews}`}
                    </Typography>
                </StyledStatusBox>

                <Typography variant={'body1'} color='textPrimary' gutterBottom={true}>
                    {snippet}
                </Typography>
            </StyledCardContent>
            <Divider />
            <StyledCardActions>{useNoneCloneJSX ? cardActionsTemplate : cardActions}</StyledCardActions>
        </StyledCard>
    );
}

export default PortalItemCard;
