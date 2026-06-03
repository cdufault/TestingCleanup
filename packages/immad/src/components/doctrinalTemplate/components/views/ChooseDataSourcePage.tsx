import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import MapDataSourceResultsView from './MapDataSourceResultsView';
import { DataSource } from '../../api/DataSources';
import Rule from '../../api/Rule';
import { ActionButton, WidgetActions, WidgetContainer, WidgetContent, WidgetHeader } from '../../../common';

/**
 * Defines the different methods of retrieving data sources for a doctrinal template.
 * rule.  Used internally by the ChooseDataSourcePage component.
 */
enum DataSourceModeEnum {
    Map = 'Map',
    Mission = 'Mission',
    Url = 'Url',
    Recent = 'Recent',
}

/**
 * Defines the input properties required by the ChooseDataSourcePage component.
 */
interface ChooseDataSourcePageProps {
    rule?: Rule;
    onCancelClick: () => void;
    onContinueClick: (source: DataSource) => void;
}

/**
 * A sub component of the DoctrinalTemplateEditor component that provides the
 * ability to select a data source for doctrinal template.  This is used when
 * creating new rules and in the future to replace the data source of an existing
 * rule.
 */
const ChooseDataSourcePage = (props: ChooseDataSourcePageProps): JSX.Element => {
    const { onCancelClick, onContinueClick, rule } = props;

    const [dataSourceMode, setDataSourceMode] = useState<string>(DataSourceModeEnum.Map);

    const [selectedDataSource, setSelectedDataSource] = useState<DataSource | undefined>(rule?.dataSource);

    const [dataSourceResults, setDataSourceResults] = useState<JSX.Element>(<Box />);

    const handleContinueClicked = (): void => {
        if (selectedDataSource) {
            onContinueClick(selectedDataSource);
        }
    };

    useEffect(() => {
        setSelectedDataSource(undefined);

        switch (dataSourceMode) {
            case DataSourceModeEnum.Map:
                setDataSourceResults(
                    <MapDataSourceResultsView
                        dataSource={rule?.dataSource}
                        filterDataSourceType={rule?.dataSource.type}
                        onDataSourceSelected={(source) => {
                            setSelectedDataSource(source);
                        }}
                    />
                );
                break;
            case DataSourceModeEnum.Mission:
            case DataSourceModeEnum.Url:
            case DataSourceModeEnum.Recent:
            default:
                setDataSourceResults(<Box />);
                break;
        }
    }, [dataSourceMode]);

    return (
        <WidgetContainer>
            <WidgetHeader position='static'>
                <Box height='100%' display='flex'>
                    <Box height='100%' display='flex' alignItems='center' justifyContent='center'>
                        Choose Data Source
                    </Box>
                </Box>
            </WidgetHeader>
            <WidgetContent>
                <Box width='100%' height='100%' display='flex' boxSizing='border-box' flexDirection='column'>
                    <Box mb={1} display='flex' boxSizing='border-box'>
                        <Box height='100%' mr={1} display='flex' alignItems='center' justifyContent='center'>
                            Data Sources
                        </Box>
                        <ToggleButtonGroup
                            value={dataSourceMode}
                            exclusive
                            onChange={(_evt, value) => {
                                setDataSourceMode(value);
                            }}
                        >
                            <ToggleButton title='Current map data sources' value={DataSourceModeEnum.Map}>
                                {DataSourceModeEnum.Map}
                            </ToggleButton>
                            <ToggleButton disabled value={DataSourceModeEnum.Mission}>
                                {DataSourceModeEnum.Mission}
                            </ToggleButton>
                            <ToggleButton disabled value={DataSourceModeEnum.Url}>
                                {DataSourceModeEnum.Url}
                            </ToggleButton>
                            <ToggleButton disabled value={DataSourceModeEnum.Recent}>
                                {DataSourceModeEnum.Recent}
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                    <Box flexGrow={1}>
                        <Box
                            borderTop={1}
                            borderColor='grey.500'
                            width='100%'
                            height='100%'
                            display='flex'
                            alignItems='center'
                            justifyContent='center'
                        >
                            {dataSourceResults}
                        </Box>
                    </Box>
                </Box>
            </WidgetContent>
            <WidgetActions elevation={0}>
                <Box width='100%' display='flex' boxSizing='border-box'>
                    <Box>
                        <ActionButton
                            variant='contained'
                            color='secondary'
                            title='Go back to the doctrinal template editing page.'
                            onClick={onCancelClick}
                        >
                            CANCEL
                        </ActionButton>
                    </Box>
                    <Box flexGrow={1} />
                    <Box>
                        <ActionButton
                            variant='contained'
                            color='secondary'
                            title='Continue to the rule properties page.'
                            disabled={selectedDataSource === undefined}
                            onClick={handleContinueClicked}
                        >
                            CONTINUE
                        </ActionButton>
                    </Box>
                </Box>
            </WidgetActions>
        </WidgetContainer>
    );
};

export default ChooseDataSourcePage;
