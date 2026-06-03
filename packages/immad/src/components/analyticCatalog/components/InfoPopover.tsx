import { Card, IconButton, Popover, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import InformationIcon from 'calcite-ui-icons-react/InformationIcon';
import React, { useState } from 'react';
import { PopoverCardContent, PopoverCardImage } from '../../common/styles';
import { TaskResourceParameter } from '../resources';

interface InfoPopoverProps {
    description: string;
    baseUrl?: string;
    resources?: TaskResourceParameter[];
}

export default function InfoPopover(props: InfoPopoverProps): JSX.Element {
    const [anchorEl, setAnchorEl] = useState<Element>();
    const { description, baseUrl, resources } = props;

    const handleClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        setAnchorEl(event.target as Element);
    };
    const handleClose = () => {
        setAnchorEl(undefined);
    };
    const open = anchorEl ? true : false;
    const id = open ? 'simple-popover' : undefined;
    const resourceUrl = baseUrl ? baseUrl + '/resources/' : undefined;

    return (
        <Box>
            <Box>
                <IconButton onClick={handleClick}>
                    <InformationIcon size={16} />
                </IconButton>
            </Box>
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
            >
                <Card>
                    {resources &&
                        resources.map((taskResource, index) => {
                            if (taskResource && taskResource.resources) {
                                return taskResource.resources.map((taskInfo, idx) => {
                                    if (resourceUrl && taskInfo.url) {
                                        const combinedUrl = resourceUrl + taskInfo.url;
                                        return (
                                            <PopoverCardImage
                                                key={'infoPopoverImage_' + index + '_' + idx}
                                                src={combinedUrl}
                                            />
                                        );
                                    }
                                });
                            }
                        })}
                    <PopoverCardContent>
                        <Typography>{description}</Typography>
                    </PopoverCardContent>
                </Card>
            </Popover>
        </Box>
    );
}
