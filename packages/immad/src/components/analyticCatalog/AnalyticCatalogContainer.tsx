// React imports
import React, { useState, useEffect, useRef, Fragment, useContext } from 'react';

// Component imports
import PortalItemList from '../widgets/portalItemList';
import { Divider, Tabs, Tab, IconButton } from '@mui/material';
import ArrowLeftIcon from 'calcite-ui-icons-react/ArrowLeftIcon';
import DefaultInputForm from './components/DefaultInputForm';
import CardActionItems from './components/CardActionItems';
import SubmittedJobsList from '../widgets/submittedJobsList';

// Helper imports
import { ConfigHelper } from '../../helpers/configHelper';
import PortalItem from '@arcgis/core/portal/PortalItem';
import { AppConfig } from '../../interfaces/AppConfig';
import { FieldGroup, WidgetContainer } from '../common';
import { StyledWidgetContent } from './styles';
import { SubmittedJobsContext } from '../../contexts/SubmittedJobs';
import { AppBar } from '../common/styles';

function AnalyticCatalogContainer(): JSX.Element {
    const [activeComponent, setActiveComponent] = useState<JSX.Element>();
    const [selectedTool, setSelectedTool] = useState<PortalItem>();
    const [toolIsSelected, setToolIsSelected] = useState<boolean>(false);
    const { tabValue, setTabValue } = useContext(SubmittedJobsContext);

    const appConfig = useRef<AppConfig>();

    const analyticCatalogContent = useRef<HTMLDivElement>(null);

    useEffect(() => {
        appConfig.current = ConfigHelper.getAppConfig();
        setTabValue(0);
    }, []);

    useEffect(() => {
        if (selectedTool) {
            setToolIsSelected(true);
            setActiveComponent(<DefaultInputForm item={selectedTool} setTab={setTabValue} />);
        } else {
            setToolIsSelected(false);
        }
    }, [selectedTool]);

    const handleBackButtonClick = () => {
        setSelectedTool(undefined);
    };

    const handleTabChange = (_event: any, newValue: number) => {
        setTabValue(newValue);
    };

    return (
        <WidgetContainer>
            <StyledWidgetContent ref={analyticCatalogContent}>
                <AppBar position='static'>
                    <Tabs value={tabValue} onChange={handleTabChange} indicatorColor='secondary'>
                        <Tab label='Tools' />
                        <Tab label='Results' />
                    </Tabs>
                </AppBar>

                <div role='tabpanel' hidden={tabValue !== 0}>
                    {!toolIsSelected ? (
                        <PortalItemList
                            isSpatial={false}
                            showFilter={true}
                            showSearch={true}
                            showSort={true}
                            itemTypes={['Geoprocessing Service']}
                            itemsPerPage={6}
                            tags={ConfigHelper.getAppConfig().analyticCatalog.tool_tag}
                            cardActionsTemplate={<CardActionItems setSelectedTool={setSelectedTool} />}
                        />
                    ) : (
                        <Fragment>
                            <IconButton
                                size='small'
                                onClick={handleBackButtonClick}
                                title='Go back to the starting page.'
                            >
                                <ArrowLeftIcon size={30} />
                            </IconButton>
                            <Divider />
                            <FieldGroup>{activeComponent}</FieldGroup>
                        </Fragment>
                    )}
                </div>
                <div role='tabpanel' hidden={tabValue !== 1}>
                    <SubmittedJobsList />
                </div>
            </StyledWidgetContent>
        </WidgetContainer>
    );
}

export default AnalyticCatalogContainer;
