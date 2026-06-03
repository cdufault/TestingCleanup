// React imports
import React, { MouseEventHandler, useContext, useEffect, useRef, useState } from 'react';

//Material Ui imports
import { Button, Menu, MenuItem } from '@mui/material';

import CSVLayer from '@arcgis/core/layers/CSVLayer';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer';
import ImageryLayer from '@arcgis/core/layers/ImageryLayer';
import SceneLayer from '@arcgis/core/layers/SceneLayer';
import WFSLayer from '@arcgis/core/layers/WFSLayer';

import { MapContext } from '../../../contexts/Map';
import ConfirmDialog from './ConfirmDialog';

import { ConfigHelper } from '../../../helpers/configHelper';
import { QuickFilterOption } from '../resources';
import CaretDownIcon from 'calcite-ui-icons-react/CaretDownIcon';
import { ActionButton } from '../../common';

interface QuickFilterButtonProps {
    layer: FeatureLayer | SceneLayer | GeoJSONLayer | CSVLayer | WFSLayer | ImageryLayer;
}

function QuickFilterButton(props: QuickFilterButtonProps): JSX.Element {
    const { layer } = props;
    const appConfig = ConfigHelper.getAppConfig();
    const { activeView } = useContext(MapContext);
    const [selectedOption, setSelectedOption] = useState<string>('Clear Filter');
    const [confirmIsOpen, setConfirmIsOpen] = useState<boolean>(false);
    const filterOverride = useRef<string>();
    const [actionsAnchorEl, setActionsAnchorEl] = useState<null | HTMLElement>(null);
    const openActionsMenu = Boolean(actionsAnchorEl);

    useEffect(() => {
        if (layer) {
            //if the definition expression for the layer changes, update the quick filter dropdown
            //this will handle changes from both the quick filter and the filter widget
            const handle = layer.watch('definitionExpression', (newValue) => {
                const option = appConfig.tacticalGrid.quickFilters.find((f) => f.value === newValue);
                if (option) {
                    setSelectedOption(option.label);
                } else {
                    setSelectedOption('Clear Filter');
                }
            });
            return () => handle.remove();
        }
    }, []);

    useEffect(() => {
        //when the view switches from 2d/3d, check for a filter and update the dropdown
        const option = appConfig.tacticalGrid.quickFilters.find((f) => f.value === layer.definitionExpression);
        if (option) {
            setSelectedOption(option.label);
        } else {
            setSelectedOption('Clear Filter');
        }
    }, [activeView]);

    const updateLayerFilter = (selectedOptionLabel: string) => {
        //get the config item for the selected option
        const option = appConfig.tacticalGrid.quickFilters.find((f) => f.label === selectedOptionLabel);
        if (option && option.value !== 'clear') {
            //apply selected filter
            if (layer.definitionExpression) {
                const existingFilter = appConfig.tacticalGrid.quickFilters.find(
                    (f) => f.value === layer.definitionExpression
                );
                if (existingFilter) {
                    //overwrite previous quick filter
                    layer.definitionExpression = option.value;
                } else {
                    //custom filter found, prompt user to overwrite
                    filterOverride.current = option.value;
                    setConfirmIsOpen(true);
                }
            } else {
                //no existing filter, apply quick filter
                layer.definitionExpression = option.value;
            }
        } else {
            //handles selection for 'set' and 'clear'
            layer.definitionExpression = '';
        }
    };

    const onConfirmDialogClose = (response: boolean) => {
        if (response && filterOverride.current) {
            //overwrite existing filter
            layer.definitionExpression = filterOverride.current;
        }
        filterOverride.current = undefined;
        setConfirmIsOpen(false);
    };

    /**
     * Handle filter button click
     * @param event button click event
     */
    /* const handleFiltersButtonClick = (event: { currentTarget: React.SetStateAction<HTMLElement | null> }) => {
        setActionsAnchorEl(event?.currentTarget);
    }; */
    const handleFiltersButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setActionsAnchorEl(event?.target as HTMLElement);
    };

    /**
     * Menu close event handler
     */
    const handleFilterItemsMenuClose = () => {
        setActionsAnchorEl(null);
    };

    /**
     * Handle click event on menu item
     * @param event menu click event
     */
    const handleMenuSelection = (event: { currentTarget: { id: React.SetStateAction<string> } }) => {
        setActionsAnchorEl(null);
        const value = event.currentTarget.id;
        value && updateLayerFilter(value.toString());
        value && setSelectedOption(value.toString());
    };

    return (
        <>
            <ConfirmDialog
                onClose={onConfirmDialogClose}
                open={confirmIsOpen}
                message={
                    'The existing layer filter will be replaced by the selected Quick Filter, do you want to proceed?'
                }
                title={'Quick Filter'}
            />
            <ActionButton
                variant='outlined'
                color='secondary'
                /* disabled={currentlySelectedRowIsLocked} */
                onClick={handleFiltersButtonClick}
                title='Update SMART Data.'
                endIcon={<CaretDownIcon size={16} />}
            >
                {'Filters'}
            </ActionButton>
            <Menu
                open={openActionsMenu}
                anchorEl={actionsAnchorEl}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                onClose={handleFilterItemsMenuClose}
            >
                {}
                {appConfig.tacticalGrid.quickFilters.map((option: QuickFilterOption, idx: number) => {
                    return (
                        <MenuItem
                            onClick={handleMenuSelection}
                            key={`filter${idx}`}
                            value={option.label}
                            id={option.label}
                            disabled={selectedOption === option.label}
                        >
                            {option.label}
                        </MenuItem>
                    );
                })}
            </Menu>
        </>
    );
}

export default QuickFilterButton;
