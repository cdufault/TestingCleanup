import React, { useState } from 'react';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import { makeStyles } from '@mui/styles';
import { WorkSpaceItem } from '../../../../../interfaces/UserSaveState';
import { Link } from 'react-router-dom';

import Avatar from '@mui/material/Avatar';

const useStyles = makeStyles((_theme) => ({
    cardRoot: {
        display: 'flex',
        width: '400px',
        flexDirection: 'column',
        margin: '20px 10px 10px 10px',
        height: '220px',
        border: '1px solid white',
    },
    description: {
        display: 'flex',
        flexDirection: 'column',
    },
    heading: {
        display: 'flex',
        flexDirection: 'row',
    },
    title: {
        display: 'flex',
        flexDirection: 'column',
        margin: '16px 16px 10px 10px',
        width: '70%',
        fontWeight: 600,
    },
    wordBreak: {
        wordWrap: 'break-word',
    },
    modifiedDate: {
        width: '100%',
        fontWeight: 200,
    },
    Button: {
        color: 'red',
    },
    media: {
        border: '1px solid lightblue',
    },
    alphabet: {
        fontWeight: 700,
        fontSize: 'xx-large',
    },
}));

function viewWorkspaceButtonClicked() {
    sessionStorage.setItem('first_time', '1');
}
/*function MyComponent(data) {
    return <p dangerouslySetInnerHTML={{ __html: data }} />;
}*/

const UserWorkSpaceItem = (props: { currentWorkspace: WorkSpaceItem }): JSX.Element => {
    const classes = useStyles();
    const [workspace] = useState<WorkSpaceItem>(props.currentWorkspace);

    const config = {}; //holding out for possible future use, currently being pulled in the parent container Home.tsx and could be passed if needed.
    //const defaultThumbnailUrl = config ? `${config.portalUrl}/assets/default_thumbnail.png` : "";
    const modified = new Date(workspace.lastSaved).toString();
    //const description = feed.snippet ? MyComponent(feed.snippet) : 'No description available.';
    return (
        <div>
            {config ? (
                <Card className={classes.cardRoot}>
                    <div className={classes.heading}>
                        <Avatar variant='square' style={{ height: 80, width: 80, marginTop: 16, marginLeft: 16 }}>
                            <div className={classes.alphabet}>{workspace.workspaceId.charAt(0)}</div>
                        </Avatar>
                        <div className={classes.title}>
                            <Box fontWeight='fontWeightBold' letterSpacing={1} lineHeight={1.25}>
                                {workspace.workspaceId}
                            </Box>

                            <Box className={classes.modifiedDate} fontWeight='fontWeightLight'>
                                {modified}
                            </Box>
                            <Box className={classes.modifiedDate} fontWeight='fontWeightLight'>
                                Type: &nbsp; &nbsp;{workspace.viewType}
                            </Box>
                            <CardActions>
                                <Link
                                    to={{
                                        pathname: '/workspace',
                                        state: {
                                            value: workspace,
                                            timeStamp: new Date(),
                                        },
                                    }}
                                    style={{ textDecoration: 'none' }}
                                >
                                    <Button
                                        onClick={viewWorkspaceButtonClicked}
                                        size='medium'
                                        fullWidth={true}
                                        style={{ color: 'white' }}
                                    >
                                        View Mission
                                    </Button>
                                </Link>
                            </CardActions>
                        </div>
                    </div>
                    <div className={classes.description}>
                        <CardContent style={{ paddingTop: '15px' }}>
                            <Box textOverflow='ellipsis' overflow='hidden' className={classes.wordBreak}>
                                {'No description.'}
                            </Box>
                        </CardContent>
                    </div>
                </Card>
            ) : (
                <h4>Loading...</h4>
            )}
        </div>
    );
};
export default UserWorkSpaceItem;
