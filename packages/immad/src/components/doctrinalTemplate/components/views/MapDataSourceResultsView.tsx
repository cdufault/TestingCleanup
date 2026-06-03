import React, { useContext, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import RadioGroup from '@mui/material/RadioGroup';
import MapDataSourceView from './MapDataSourceView';
import { DataSource } from '../../api/DataSources';
import { createDataSourceFromLayer } from '../../helpers/dataSourceHelper';
import { MapContext } from '../../../../contexts/Map';
import View = __esri.View;

/**
 * Defines layer types that are filtered out prior to layer to data source conversion.
 */
const unsupportedLayerTypes = ['elevation', 'group', 'tile', 'vector-tile'];

/**
 * Defines the input properties required by the MapDataSourceResults component.
 */
interface MapDataSourceResultsViewProps {
    dataSource?: DataSource;
    filterDataSourceType?: string;
    onDataSourceSelected: (source: DataSource | undefined) => void;
}

/**
 * A sub component of the ChooseDataSourcePage component that provides the
 * visualization of a collection of map based data sources.
 */
const MapDataSourceResultsView = (props: MapDataSourceResultsViewProps): JSX.Element => {
    const { onDataSourceSelected } = props;

    const { activeView, getMapView, getSceneView } = useContext(MapContext);

    const [selectedValue, setSelectedValue] = useState<string>(props.dataSource ? props.dataSource.id : '');

    const [dataSources, setDataSources] = useState<DataSource[]>([]);

    useEffect(() => {
        const selectedDataSource = dataSources.find((dataSource) => dataSource.id === selectedValue);
        onDataSourceSelected(selectedDataSource);
    }, [selectedValue, dataSources]);

    useEffect(() => {
        let view: View | undefined = undefined;

        if (activeView === 'MAP') {
            view = getMapView();
        } else if (activeView === 'SCENE') {
            view = getSceneView();
        }

        if (view) {
            const newDataSourceList: DataSource[] = [];

            view.map.allLayers.forEach((layer) => {
                if (!layer?.isPreviewLayer && unsupportedLayerTypes.indexOf(layer.type) === -1) {
                    const dataSource = createDataSourceFromLayer(layer);

                    if (dataSource) {
                        newDataSourceList.push(dataSource);
                    }
                }
            });

            setDataSources(newDataSourceList);
        } else {
            setDataSources([]);
        }
    }, [activeView]);

    return (
        <Box width='100%' height='100%' display='flex' boxSizing='border-box' flexDirection='column'>
            <RadioGroup value={selectedValue} onChange={(_evt, val) => setSelectedValue(val)}>
                {dataSources.map((dataSource) => {
                    return (
                        <MapDataSourceView
                            key={dataSource.id}
                            dataSource={dataSource}
                            disabled={
                                props.filterDataSourceType && props.filterDataSourceType !== dataSource.type
                                    ? true
                                    : false
                            }
                        />
                    );
                })}
            </RadioGroup>
        </Box>
    );
};

export default MapDataSourceResultsView;
