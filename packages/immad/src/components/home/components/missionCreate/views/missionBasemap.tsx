import React, { useState } from 'react';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import { makeStyles } from '@mui/styles';
import { IItem } from '@esri/arcgis-rest-portal';
import { Actions, MissionAction, MissionState } from '../../../../../contexts/missionStateReducer';
import { AppConfig } from '../../../../../interfaces/AppConfig';

const useStyles = makeStyles((_theme) => ({
    cardRoot: {
        display: 'flex',
        width: '400px',
        flexDirection: 'column',
        margin: '20px 10px 10px 10px',
        height: '300px',
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
}));

function MyComponent(data: string) {
    return <p dangerouslySetInnerHTML={{ __html: data }} />;
}

const MissionBasemap = (props: {
    currentBasemap: IItem;
    dispatch: React.Dispatch<MissionAction>;
    state: MissionState;
    config: AppConfig;
}): JSX.Element => {
    const { currentBasemap, dispatch, state, config } = props;
    const classes = useStyles();

    const [basemap] = useState<IItem>(currentBasemap);

    function addBasemapToMission() {
        dispatch({ type: Actions.UPDATE_BASEMAP, payload: { item: basemap } });
    }

    function removeBasemapFromMission() {
        dispatch({ type: Actions.UPDATE_BASEMAP, payload: { item: {} } });
    }

    const defaultThumbnailUrl = config ? `${config.portalUrl}/assets/default_thumbnail.png` : '';
    const thumbnailUrl =
        basemap && basemap.portalItem.thumbnailUrl ? basemap.portalItem.thumbnailUrl : defaultThumbnailUrl; //domParser
    //const thumbnailUrl = `${config.appConfig?.portalUrl}/sharing/rest/content/items/${basemap.id}/info/${basemap.thumbnail}`;
    const modified = basemap.portalItem.modified.toString();
    const description = basemap.snippet ? MyComponent(basemap.snippet) : 'No description available.';

    return (
        <div>
            {config ? (
                <Card className={classes.cardRoot}>
                    <div className={classes.heading}>
                        <CardMedia
                            style={{ height: 110, width: 110, marginTop: 16, marginLeft: 16 }}
                            image={thumbnailUrl ? thumbnailUrl : ''}
                        />
                        <div className={classes.title}>
                            <Box fontWeight='fontWeightBold' letterSpacing={1} lineHeight={1.25}>
                                {basemap.portalItem ? basemap.portalItem.title : basemap.title}
                            </Box>
                            <Box fontWeight='fontWeightLight'>{basemap.portalItem ? basemap.portalItem.type : ''}</Box>
                            <Box className={classes.modifiedDate} fontWeight='fontWeightLight'>
                                {modified}
                            </Box>
                            <CardActions>
                                {state.mapItem &&
                                basemap.portalItem &&
                                state.mapItem.portalItem &&
                                state.mapItem.portalItem.id == basemap.portalItem.id ? (
                                    <Button
                                        onClick={removeBasemapFromMission}
                                        size='medium'
                                        fullWidth={true}
                                        style={{ color: 'red' }}
                                    >
                                        Remove from Mission
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={addBasemapToMission}
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
                        <CardContent style={{ paddingTop: 0 }}>
                            <Box textOverflow='ellipsis' overflow='hidden' className={classes.wordBreak}>
                                {description}
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
export default MissionBasemap;
