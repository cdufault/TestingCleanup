import React, { useState, useEffect } from 'react';
import SaveIcon from 'calcite-ui-icons-react/SaveIcon';
import CaretDownIcon from 'calcite-ui-icons-react/CaretDownIcon';

import { Grid, MenuItem, ButtonGroup, Menu } from '@mui/material';
import { useSaveLoadContext } from '../../../../contexts/SaveLoad';
import { IconButton } from '@mui/material';

interface SaveStateProps {
    onClickHandler: (buttonSelectedIndex: number) => void;
    disabled: boolean;
    buttonOptions: string[];
    selectedIndex: number;
}

export default function SaveState(props: SaveStateProps): JSX.Element {
    const saveLoadContext = useSaveLoadContext();
    const [buttonSelectedIndex, setButtonSelectedIndex] = useState(props.selectedIndex);
    const [saveDisabled, setSaveDisabled] = useState(false);
    const [isAnalyst, setIsAnalyst] = useState(true);
    const saveButtonOptions = props.buttonOptions;
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);

    useEffect(() => {
        if (!saveLoadContext.isGroupMgrOrOwner) {
            // force back to save as workspace
            setButtonSelectedIndex(0);
        }
        if (isAnalyst && !saveLoadContext.isStateSaved) {
            if (saveDisabled) {
                setSaveDisabled(false);
            }
        } else if (saveLoadContext.isGroupMgrOrOwner && !saveLoadContext.isStateSaved) {
            if (saveDisabled) {
                setSaveDisabled(false);
            }
        } else {
            setSaveDisabled(true);
        }
    }, [saveLoadContext.isStateSaved, isAnalyst]);

    useEffect(() => {
        setButtonSelectedIndex(saveLoadContext.saveButtonSelectIndex);
    }, [saveLoadContext.saveButtonSelectIndex]);

    useEffect(() => {
        if (!saveLoadContext.isGroupMgrOrOwner) {
            setIsAnalyst(true);
        } else {
            setIsAnalyst(false);
        }
    }, [saveLoadContext.isGroupMgrOrOwner]);

    function onClickHandler() {
        props.onClickHandler(buttonSelectedIndex);
    }

    /**
     * Handles menu item click
     * @param index The selected item index
     */
    function handleMenuItemClick(index: number) {
        setButtonSelectedIndex(index);
        handleMenuClose();
        props.onClickHandler(index);
    }

    /**
     * Checks if user is mission current owner and will
     * enable save default mission map
     * @param index index 1 is save as default mission
     */
    function isMissionCurrentOwner(index: number): boolean {
        if (index === 1) {
            return !saveLoadContext.isGroupMgrOrOwner;
        }
        return false;
    }

    /**
     * Check if index needs to be disabled.
     * @param index
     */
    function isIndexDisabled(index: number): boolean {
        if (!saveLoadContext.isGroupMgrOrOwner && buttonSelectedIndex !== 0) {
            setButtonSelectedIndex(0);
            if (index === 0) {
                return true;
            }
        }
        return index === buttonSelectedIndex;
    }

    /**
     * If not manager set disabled messaged
     * @param index of values in button drop down.
     */
    function setMessageIfDisabledOption(index: number): string {
        let message = saveButtonOptions[index];
        if (index === 1) {
            if (!saveLoadContext.isGroupMgrOrOwner) {
                message = 'Only Mission Managers Can Save Default Map';
            }
        }
        return message;
    }

    /**
     * Closes the menu
     */
    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    return (
        <Grid container direction='column' alignItems='center' spacing={0}>
            <Grid item xs={12}>
                <ButtonGroup variant='outlined' size='small' aria-label='Save' disabled={saveDisabled}>
                    <IconButton
                        aria-label='Save'
                        onClick={onClickHandler}
                        title={saveButtonOptions[buttonSelectedIndex]}
                    >
                        <SaveIcon size={16} />
                    </IconButton>
                    {!isAnalyst && (
                        <IconButton
                            aria-controls={openMenu ? 'split-button-menu' : undefined}
                            aria-expanded={openMenu ? 'true' : undefined}
                            aria-label='Select Save Method'
                            aria-haspopup='menu'
                            onClick={(event) => {
                                setAnchorEl(event.currentTarget);
                            }}
                            title={
                                isAnalyst
                                    ? 'Only Mission Managers Can Save Default Map'
                                    : saveButtonOptions[buttonSelectedIndex]
                            }
                        >
                            <CaretDownIcon size={16} />
                        </IconButton>
                    )}
                </ButtonGroup>
                <Menu
                    open={openMenu}
                    anchorEl={anchorEl}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    onClose={handleMenuClose}
                >
                    {saveButtonOptions.map((option, index) => {
                        return (
                            <div key={option} title={setMessageIfDisabledOption(index)}>
                                <MenuItem
                                    key={option}
                                    disabled={isMissionCurrentOwner(index)}
                                    selected={isIndexDisabled(index)}
                                    onClick={() => handleMenuItemClick(index)}
                                >
                                    {option}
                                </MenuItem>
                            </div>
                        );
                    })}
                </Menu>
            </Grid>
        </Grid>
    );
}
