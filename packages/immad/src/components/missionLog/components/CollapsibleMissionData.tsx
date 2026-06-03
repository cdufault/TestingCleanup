import React, { useState, useEffect, useRef, useContext } from 'react';
import {
    MissionBodyHead,
    StyledBaseIconButton,
    StyledBodyHeadDiv,
    StyledFlashIconButton,
    StyledFullHeightDiv,
    StyledFullHeightTableDiv,
    StyledIconButton,
    StyledTableRow,
} from '../styles';
import { CardActions, Collapse, Table, TableBody, TableHead, TableRow } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import CaretDownIcon from 'calcite-ui-icons-react/CaretDownIcon';
import CaretUpIcon from 'calcite-ui-icons-react/CaretUpIcon';
import ZoomToObjectIcon from 'calcite-ui-icons-react/ZoomToObjectIcon';
import { IFtrAttributeValueObj, NewtMessage } from '../MissionLogSlice';
import { RMTCodeTypeQueryMetadata, RMTQueryMetadata } from '../../administrator/components/AdminSettingsSlice';
import { useAppSelector } from '../../../hooks/hooks';
import { createGridColumnDefinitions, flashNewtData, zoomToNewtData } from '../MissionLogHelper';
import { MapContext } from '../../../contexts/Map';
import SceneView from '@arcgis/core/views/SceneView';
import MapView from '@arcgis/core/views/MapView';
import { useSelector } from 'react-redux';
import { RootState } from '../../../data/store';
import FlashIcon from 'calcite-ui-icons-react/FlashIcon';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import TableCell from '@mui/material/TableCell';
import { ExpandedState } from './CollapsibleMissionHeader';

interface missionDataProps {
    message: NewtMessage;
    messageType: string;
    messageCode: string;
    expanded: ExpandedState;
}

/**
 *
 * @param props
 * @constructor
 */
const CollapsibleMissionData = (props: missionDataProps): JSX.Element => {
    const rmtData: RMTQueryMetadata[] = useAppSelector((state) => state.adminSettingsSlice.rmtQueryMetadata);
    const flashGraphicColor = useSelector((state: RootState) => state.applicationSlice.flashGraphicColor);
    const { message, messageType, messageCode, expanded } = props;
    const rmtCodeType = useRef<RMTCodeTypeQueryMetadata>();
    const portalItemId = useRef<string>();
    const { activeView, getMapView, getSceneView } = useContext(MapContext);

    const [originValue, setOriginValue] = useState<string>();
    const [rmtItem, setRmtItem] = useState<RMTQueryMetadata>();
    const [messageDataOpen, setMessageDataOpen] = useState(false);
    const [gridColumnDefinitions, setGridColumnDefinitions] = useState<GridColDef[]>();

    useEffect(() => {
        setMessageDataOpen(expanded === 'expandedAll');
    }, [expanded]);

    useEffect(() => {
        for (const rmtDataItem of rmtData) {
            if (rmtDataItem.rmtMessageType.toUpperCase() === messageType) {
                setRmtItem(rmtDataItem);
                for (const codeType of rmtDataItem.codeTypes) {
                    if (codeType.newtCode === messageCode) {
                        rmtCodeType.current = codeType;
                        portalItemId.current = codeType.portalItemId;
                        for (const queryField of codeType.queryFields) {
                            if (queryField.label === 'translateFieldLabel') {
                                const field = queryField.selectedFieldObj.alias;
                                if (message.value?.length) {
                                    setOriginValue(message.value[0][field]);
                                }
                            } else {
                                setOriginValue(message.origin.toString());
                            }
                        }
                    }
                }
            }
        }
        setGridColumnDefinitions(createGridColumnDefinitions(message));
    }, [message]);

    /**
     * Handle toggle expand click.
     */
    const handleExpandClick = () => {
        setMessageDataOpen(!messageDataOpen);
    };

    const flashFeature = (currentView: MapView | SceneView | undefined, flashDuration: number) => {
        let graphicsLayer: GraphicsLayer = currentView?.map.findLayerById('MissionLogFlashLayer') as GraphicsLayer;
        if (!graphicsLayer) {
            graphicsLayer = new GraphicsLayer({
                title: '__flash_graphics_',
                id: 'MissionLogFlashLayer',
            });
            currentView?.map.add(graphicsLayer);
        }
        flashNewtData(
            portalItemId.current ? portalItemId.current : '',
            [message.value[0].OBJECTID],
            flashGraphicColor,
            graphicsLayer,
            currentView,
            flashDuration
        );
    };

    /**
     * Handle click on zoom button - zooms to feature and flashes it.
     */
    const handleZoomClick = () => {
        let currentView: MapView | SceneView | undefined = getSceneView();
        if (activeView === 'MAP') {
            currentView = getMapView();
        }
        if (portalItemId.current && message?.value && currentView) {
            zoomToNewtData(portalItemId.current, [message.value[0].OBJECTID], 2, currentView).then(() => {
                flashFeature(currentView, 3000);
            });
        }
    };

    /**
     * Handle click on flash button by flashing the feature.
     */
    const handleFlashClick = () => {
        let currentView: MapView | SceneView | undefined = getSceneView();
        if (activeView === 'MAP') {
            currentView = getMapView();
        }
        flashFeature(currentView, 2000);
    };

    return (
        <StyledFullHeightDiv>
            <CardActions>
                <MissionBodyHead>
                    <StyledBaseIconButton title='Zoom to item.' onClick={handleZoomClick}>
                        <ZoomToObjectIcon></ZoomToObjectIcon>
                    </StyledBaseIconButton>
                    <StyledFlashIconButton title='Flash item.' onClick={handleFlashClick}>
                        <FlashIcon size={24} />
                    </StyledFlashIconButton>
                    <StyledBodyHeadDiv>
                        {originValue} {rmtItem?.actionPhrase} {message.count} {rmtItem?.trailingPhrase}
                    </StyledBodyHeadDiv>
                    <StyledIconButton onClick={handleExpandClick}>
                        {messageDataOpen ? <CaretUpIcon /> : <CaretDownIcon />}
                    </StyledIconButton>
                </MissionBodyHead>
            </CardActions>
            <StyledFullHeightTableDiv>
                <Collapse in={messageDataOpen}>
                    <Table>
                        <TableHead>
                            <TableRow key={'tableHeaderRow'}>
                                {gridColumnDefinitions?.map((header) => (
                                    <TableCell key={header.field}>{header.headerName}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {message.value.map((row: IFtrAttributeValueObj, index: number) => (
                                <StyledTableRow key={index}>
                                    {gridColumnDefinitions?.map((headerKey) => (
                                        <TableCell key={headerKey.field}>{row[headerKey.field]}</TableCell>
                                    ))}
                                </StyledTableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Collapse>
            </StyledFullHeightTableDiv>
        </StyledFullHeightDiv>
    );
};

export default CollapsibleMissionData;
