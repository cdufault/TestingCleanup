import React, { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import Box from '@mui/material/Box';
import { IconButton, Menu, MenuItem } from '@mui/material';
import { IItem } from '@esri/arcgis-rest-portal';
import Typography from '@mui/material/Typography';
import { getPortalGroupUsers } from '../../../../../helpers/portalUsersHelper';
import defaultThumbnail from '../../../../../images/default_thumbnail.png';
import { findPortalGroupByTitle, getGroupContentByGroupId } from '../../../../../helpers/portalGroupHelper';
import { getPortalItemById } from '../../../../../helpers/portalItemsHelper';
import PortalItem from '@arcgis/core/portal/PortalItem';
import {
    StyledBoxCardHeader,
    StyledBoxDisplayFlex,
    StyledBoxFullWidth,
    StyledCardActions,
    StyledCardContentNoTopPadding,
    StyledCardMediaPng,
    StyledCardRoot,
    StyledCenterCircularProgressDiv,
    StyledHeadingDiv,
    StyledMissionIcon,
    StyledSpanBlock,
    StyledSpanEmptyBlock,
    StyledSpanForEllipsis,
    StyledTopicIcon,
    StyledTypographyMarginTop,
    StyledTypographyTitle,
} from '../styles';
import HandleVerticalIcon from 'calcite-ui-icons-react/HandleVerticalIcon';
import CircularProgress from '@mui/material/CircularProgress';
import { ConfirmationDialog } from '../../../../common/ConfirmationDialog';
import CubeIcon from 'calcite-ui-icons-react/CubeIcon';
import SquareIcon from 'calcite-ui-icons-react/SquareIcon';
import { HoverTwoButtonGroup } from '@stratcom/react-widget-lib';
import { useAppSelector } from '../../../../../hooks/hooks';

const menuOptions = ['Edit Mission', 'Delete Mission'];
const ITEM_HEIGHT = 48;

interface PortalMissionProps {
    currentMission: IItem;
    setSelected: (value: IItem) => void;
    currentUserName: string;
    deleted: (value: IItem) => void;
}

/**
 * Creates Mission cards for the mission page
 * @param props
 * @constructor
 */
export default function PortalMission(props: PortalMissionProps): JSX.Element {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const menuOpen = Boolean(anchorEl);
    const [thumbnailImage, setThumbnailImage] = useState<string>(defaultThumbnail);
    const [mission, setMission] = useState<IItem>(props.currentMission);
    const [isGroupMember, setIsGroupMember] = useState<boolean>(false);
    const [isGroupMgrOrOwner, setIsGroupMgrOrOwner] = useState<boolean>(false);
    const [groupDefaultScene, setGroupDefaultScene] = useState<PortalItem>();
    const [missionAppObject, setMissionAppObject] = useState<IItem>();
    const [categoryDataToolTip, setCategoryDataToolTip] = useState<string>('None');
    const [categoryData, setCategoryData] = useState<JSX.Element>(
        <>
            <StyledSpanBlock>None</StyledSpanBlock>
            <StyledSpanEmptyBlock> </StyledSpanEmptyBlock>
            <StyledSpanEmptyBlock> </StyledSpanEmptyBlock>
        </>
    );
    const [deleting, setDeleting] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const is2dOnlyActive = useAppSelector((state) => state.webMapViewSlice.is2dOnlyActive);
    const { push } = useHistory();

    const stateObject2d = {
        pathname: '/workspace',
        state: {
            value: mission,
            timeStamp: new Date(),
            viewType: '2D',
        },
    };

    const stateObject3d = {
        pathname: '/workspace',
        state: {
            value: mission,
            timeStamp: new Date(),
            viewType: '3D',
        },
    };

    const modified = new Date(mission.modified).toString();
    const description = mission.snippet
        ? mission.snippet
        : mission.description
        ? mission.description
        : 'No description available.';
    const canViewMission = isGroupMgrOrOwner || isGroupMember;
    const currentUserName = useRef(props.currentUserName);
    const mounted = useRef(false);

    useEffect(() => {
        // get default scene from group ID
        // use web mapping application get group by Name instead
        mounted.current = true;

        findPortalGroupByTitle(mission.title).then((groupItemArray) => {
            // got group but need to access content now.
            groupItemArray.item.filter((group) => {
                //should only be one item
                if (mounted.current) {
                    findGroupMembers(group.id);
                    // need to update mission to pass to open it properly.
                    setMission(group);
                    getGroupContentByGroupId(group.id).then((groupContentArray) => {
                        if (mounted.current) {
                            const sceneItem = groupContentArray.filter((groupContentItem) => {
                                return groupContentItem.type == 'Web Scene';
                            });
                            const appObject = groupContentArray.filter((groupContentItem) => {
                                return (
                                    groupContentItem.type == 'Application' ||
                                    groupContentItem.type === 'Web Application'
                                );
                            });
                            getPortalItemById(sceneItem[0]?.id).then((result) => {
                                if (result && mounted.current) {
                                    // Will need to adjust if more than 1 scene per mission is used in the future.
                                    setGroupDefaultScene(result);
                                    setMissionAppObject(appObject[0]);
                                }
                            });
                        }
                    });
                }
            });
        });
        return () => {
            mounted.current = false;
        };
    }, []);

    useEffect(() => {
        if (missionAppObject && missionAppObject.categories && groupDefaultScene) {
            setThumbnailImage(groupDefaultScene.thumbnailUrl);
            if (missionAppObject && missionAppObject.categories?.length > 0) {
                const forDisplay = missionAppObject.categories[0].split('/');
                if (forDisplay.length > 3) {
                    // handles 2 or more levels deep topics
                    setCategoryData(
                        <>
                            <StyledSpanBlock>{forDisplay[2]}</StyledSpanBlock>
                            <StyledSpanForEllipsis>...</StyledSpanForEllipsis>
                            <StyledSpanBlock>{forDisplay[forDisplay.length - 1]}</StyledSpanBlock>
                        </>
                    );
                } else {
                    // handles 1 level deep mission topics
                    setCategoryData(
                        <>
                            <StyledSpanBlock>{forDisplay[forDisplay.length - 1]}</StyledSpanBlock>
                            <StyledSpanEmptyBlock> </StyledSpanEmptyBlock>
                            <StyledSpanEmptyBlock> </StyledSpanEmptyBlock>
                        </>
                    );
                }
                const categories = missionAppObject.categories.toString();
                setCategoryDataToolTip(categories.replaceAll(',', '\n'));
            } // else {
            //     console.debug(`No categories for: ${mission.title}`); // left for debugging if needed.
            // }
        }
    }, [groupDefaultScene, missionAppObject]);

    function handleMenuClick(event: React.MouseEvent<HTMLElement>) {
        setAnchorEl(event.currentTarget);
    }

    async function handleMenuItemClick(event: React.MouseEvent<HTMLElement>) {
        if (event.currentTarget.innerText.toUpperCase() === 'EDIT MISSION') {
            editMission();
        }
        if (event.currentTarget.innerText.toUpperCase() === 'DELETE MISSION') {
            setDeleting(true);
            setDialogOpen(true);
        }
        handleClose();
    }

    function handleClose() {
        setAnchorEl(null);
    }

    function editMission() {
        if (!isGroupMgrOrOwner) {
            return;
        }
        props.setSelected(mission);
    }

    function setSessionKey() {
        if (!canViewMission) {
            return;
        }
        sessionStorage.setItem('first_time', '1');
    }

    function openMission2D() {
        push(stateObject2d);
        setSessionKey();
    }

    function openMission3D() {
        push(stateObject3d);
        setSessionKey();
    }

    function findGroupMembers(missionId: string) {
        getPortalGroupUsers(missionId).then((result) => {
            if (mounted.current) {
                const userNames = result.users;
                const owner = result.owner;
                const mgrNames = result.admins;
                const userName = userNames.find((username) => username === currentUserName.current);
                if (userName) {
                    setIsGroupMember(true);
                }
                const mgrName = mgrNames.find((managerName) => managerName === currentUserName.current);
                if (mgrName || owner === currentUserName.current) {
                    setIsGroupMgrOrOwner(true);
                }
            }
        });
    }
    function handleCancel() {
        setDeleting(false);
        setDialogOpen(false);
    }
    /**
     * Delete is a go pass the Mission back to caller to delete
     */
    function handleYes() {
        setDialogOpen(false);
        props.deleted(mission);
    }

    return (
        <>
            <StyledCardRoot variant='outlined'>
                <ConfirmationDialog
                    description={'Are you sure you want to delete this mission?'}
                    open={dialogOpen}
                    title={'WARNING'}
                    onClose={handleCancel}
                    onSubmit={handleYes}
                />
                {deleting ? (
                    <StyledCenterCircularProgressDiv>
                        <CircularProgress color={'secondary'} size={'5rem'} />
                    </StyledCenterCircularProgressDiv>
                ) : (
                    <>
                        <StyledHeadingDiv>
                            <StyledCardMediaPng image={thumbnailImage} />
                            <StyledBoxCardHeader>
                                <span title={mission.title}>
                                    <StyledTypographyTitle noWrap variant='body1'>
                                        <StyledMissionIcon size={16} />
                                        {mission.title}
                                    </StyledTypographyTitle>
                                </span>
                                <StyledBoxDisplayFlex>
                                    <StyledTopicIcon size={16} />
                                    <span title={categoryDataToolTip} aria-multiline={true}>
                                        <StyledTypographyMarginTop variant='body2'>
                                            {categoryData}
                                        </StyledTypographyMarginTop>
                                    </span>
                                </StyledBoxDisplayFlex>
                            </StyledBoxCardHeader>
                        </StyledHeadingDiv>
                        <StyledCardContentNoTopPadding>
                            <Typography variant='caption'>{modified}</Typography>
                            <Box mt={1} maxHeight='60px' overflow='auto'>
                                <span title={description}>
                                    <Typography noWrap={true} variant='body2'>
                                        {description}
                                    </Typography>
                                </span>
                            </Box>
                        </StyledCardContentNoTopPadding>
                        <StyledCardActions>
                            <StyledBoxFullWidth>
                                {canViewMission ? (
                                    <HoverTwoButtonGroup
                                        disable3dButton={is2dOnlyActive}
                                        width='96px'
                                        iconWidth='48px'
                                        height='30px'
                                        iconHeight='30px'
                                        rightButtonLabel='3D'
                                        leftButtonLabel={
                                            !is2dOnlyActive
                                                ? '2D'
                                                : '2D\nOpen Mission in 3D has been disabled due to lack of Web GL support.'
                                        }
                                        hoverButtonLabel='OPEN'
                                        onRightButtonClick={openMission3D}
                                        onLeftButtonClick={openMission2D}
                                        rightButtonIcon={<CubeIcon />}
                                        leftButtonIcon={<SquareIcon />}
                                    />
                                ) : (
                                    <></>
                                )}
                            </StyledBoxFullWidth>
                            <Box>
                                <IconButton
                                    aria-label='more'
                                    aria-controls='long-menu'
                                    aria-haspopup='true'
                                    onClick={handleMenuClick}
                                >
                                    <HandleVerticalIcon />
                                </IconButton>
                                <Menu
                                    id='long-menu'
                                    anchorEl={anchorEl}
                                    keepMounted
                                    open={menuOpen}
                                    onClose={handleClose}
                                    PaperProps={{
                                        style: {
                                            maxHeight: ITEM_HEIGHT * 4.5,
                                            width: '20ch',
                                        },
                                    }}
                                >
                                    {menuOptions.map((menuOption) => {
                                        if (menuOption === 'Delete Mission') {
                                            return (
                                                <MenuItem
                                                    key={menuOption}
                                                    onClick={handleMenuItemClick}
                                                    disabled={
                                                        menuOption === 'Delete Mission' ? !isGroupMgrOrOwner : false
                                                    }
                                                >
                                                    {menuOption}
                                                </MenuItem>
                                            );
                                        } else if (menuOption === 'Edit Mission') {
                                            return (
                                                <MenuItem
                                                    key={menuOption}
                                                    onClick={handleMenuItemClick}
                                                    disabled={
                                                        menuOption === 'Edit Mission' ? !isGroupMgrOrOwner : false
                                                    }
                                                >
                                                    {menuOption}
                                                </MenuItem>
                                            );
                                        }
                                    })}
                                </Menu>
                            </Box>
                        </StyledCardActions>
                    </>
                )}
            </StyledCardRoot>
        </>
    );
}
