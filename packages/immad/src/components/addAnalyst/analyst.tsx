import React, { useState, useEffect } from 'react';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import { makeStyles } from '@mui/styles';
import { IUser } from '@esri/arcgis-rest-portal';
import { isAnalystAddedToMission } from './helpers/addAnalystHelper';
import { Actions, MissionState, MissionAction } from '../../contexts/missionStateReducer';
import { AppConfig } from '../../interfaces/AppConfig';

const useStyles = makeStyles((_theme) => ({
    cardRoot: {
        display: 'flex',
        width: '400px',
        flexDirection: 'column',
        margin: '20px 10px 10px 10px',
        height: '200px',
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
}));

const Analyst = (props: {
    currentAnalyst: IUser;
    dispatch: React.Dispatch<MissionAction>;
    state: MissionState;
    config: AppConfig;
}): JSX.Element => {
    const { currentAnalyst, dispatch, state, config } = props;
    const classes = useStyles();
    const [analyst] = useState<IUser>(currentAnalyst);
    //const isAddedToMission = useRef(false);
    const [addedToMission, addToMission] = useState(false);

    useEffect(() => {
        const isAdded = isAnalystAddedToMission(analyst, state);
        //isAddedToMission.current = isAdded;
        addToMission(isAdded);
    }, []);

    function addAnalystToMission(): void {
        //isAddedToMission.current = true;
        addToMission(true);
        dispatch({ type: Actions.ADD_ANALYST, payload: { item: analyst } });
    }
    function removeAnalystFromMission(): void {
        //isAddedToMission.current = false;
        addToMission(false);
        dispatch({ type: Actions.REMOVE_ANALYST, payload: { item: analyst } });
    }

    //const defaultThumbnailUrl = config ? `${config.portalUrl}/assets/default_thumbnail.png` : '';
    //const modified = new Date(analyst.modified).toString();
    //const description = analyst.snippet ? MyComponent(analyst.snippet) : 'No description available.';
    return (
        <div>
            {config ? (
                <Card className={classes.cardRoot}>
                    <div className={classes.heading}>
                        <CardMedia
                            style={{ height: 110, width: 110, marginTop: 16, marginLeft: 16 }}
                            className={classes.media}
                            component='div'
                        />
                        <div className={classes.title}>
                            <Box fontWeight='fontWeightBold' letterSpacing={1} lineHeight={1.25}>
                                {analyst.fullName}
                            </Box>

                            <Box className={classes.modifiedDate} fontWeight='fontWeightLight'>
                                Role: {analyst.role}
                            </Box>
                            <CardActions>
                                {addedToMission ? (
                                    <Button
                                        onClick={removeAnalystFromMission}
                                        size='medium'
                                        fullWidth={true}
                                        style={{ color: 'red' }}
                                    >
                                        Remove from Mission
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={addAnalystToMission}
                                        size='medium'
                                        fullWidth
                                        style={{ color: 'lightblue' }}
                                    >
                                        Add to Mission
                                    </Button>
                                )}
                            </CardActions>
                        </div>
                    </div>
                    <div className={classes.description}>
                        <CardContent style={{ paddingTop: '15px' }}>
                            <Box textOverflow='ellipsis' overflow='hidden' className={classes.wordBreak}>
                                Username: {analyst.username}
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
export default Analyst;
