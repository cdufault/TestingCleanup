import React from 'react';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import { DataSource } from '../../api/DataSources';

/**
 * Converts the type property of a data source into a user friendly representation.
 * @param dataSource The data source being labelled.
 */
const generateDataSourceTypeLabel = (dataSource: DataSource): string => {
    switch (dataSource.type) {
        case 'ImageService':
            return 'Imagery Layer';
        case 'FeatureService':
            return 'Feature Layer';
        default:
            return 'Unsupported Data Source Type (' + dataSource.type + ')';
    }
};

/**
 * Defines the input properties required by the MapDataSource component.
 */
interface MapDataSourceViewProps {
    dataSource: DataSource;
    disabled?: boolean;
}

/**
 * A sub component of the MapDataSourceResults component that provides the
 * visualization of a map based data source.
 */
const MapDataSourceView = (props: MapDataSourceViewProps): JSX.Element => {
    return (
        <FormControlLabel
            value={props.dataSource.id}
            label=''
            disabled={props.disabled}
            control={
                <Box mt={1} py={1} width='100%' boxSizing='border-box' border={1} borderColor='grey.500' display='flex'>
                    <Radio color={'secondary'} disabled={props.disabled} value={props.dataSource.id} />
                    <Box mr={1} display='flex' flexDirection='column'>
                        <Box color={props.disabled ? 'text.disabled' : 'text.primary'}>{'Name:'}</Box>
                        <Box color={props.disabled ? 'text.disabled' : 'text.primary'}>{'Type:'}</Box>
                    </Box>
                    <Box flexGrow={1} display='flex' flexDirection='column'>
                        <Box fontWeight='bold' color={props.disabled ? 'text.disabled' : 'text.primary'}>
                            {props.dataSource.alias}
                        </Box>
                        <Box color={props.disabled ? 'text.disabled' : 'text.primary'}>
                            {generateDataSourceTypeLabel(props.dataSource)}
                        </Box>
                    </Box>
                </Box>
            }
        />
    );
};

export default MapDataSourceView;
