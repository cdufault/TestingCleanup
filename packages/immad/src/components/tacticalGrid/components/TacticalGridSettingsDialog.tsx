import React, { useEffect, useRef, useState } from 'react';

import {
    DialogTitle,
    DialogContent,
    DialogActions,
    Menu,
    MenuItem,
    RadioGroup,
    FormControlLabel,
    Radio,
    FormLabel,
    Tooltip,
    Checkbox,
} from '@mui/material';
import { ActionButton } from '../../common';
import { StyledBackdrop, StyledDialog } from '../styles';
import { TwoColumnGrid, ContentBody } from './stylesTGridSettingsDlg';
import { ITacticalGridSettings } from '../../../interfaces/UserSaveState';
import GearIcon from 'calcite-ui-icons-react/GearIcon';
import RefreshIcon from 'calcite-ui-icons-react/RefreshIcon';
import DownloadIcon from 'calcite-ui-icons-react/DownloadIcon';
import { IconButtonDiv } from './stylesTGridSettingsDlg';
import { useAppDispatch, useAppSelector } from '../../../hooks/hooks';
import { setTgridInDrawEllipseMode } from './TacticalGridDataSlice';

/**props for opening the tactical grid dialog */
interface TacticalGridSettingsDialogProps {
    onClose: (value: ITacticalGridSettings | undefined, rowHeightUpdated: boolean) => void;
    open: boolean;
    message: string;
    container?: HTMLElement | null;
    title?: string;
    currentSettings: ITacticalGridSettings;
}

/**widget to collect tactical grid settings that is currently supporting - visible row count, row height */
const TacticalGridSettingsDialog = (props: TacticalGridSettingsDialogProps): JSX.Element => {
    const { onClose, open, currentSettings, container } = props;
    const [gridSettings] = useState<ITacticalGridSettings>(currentSettings);
    const gridSettingsRef = useRef<ITacticalGridSettings>();
    const [rowHeightUpdated, setRowHeightUpdated] = useState<boolean>(false);

    useEffect(() => {
        if (gridSettings) {
            gridSettingsRef.current = { ...gridSettings };
        }
    }, [gridSettings]);

    /***handler for closing the dialog without making any changes */
    const handleCancel = () => {
        onClose(undefined, false);
    };

    /**handler for closing the dialog and passing back values to use when saving the settings */
    const handleOk = () => {
        onClose(gridSettingsRef.current, rowHeightUpdated);
    };

    /**visible row count radio button change handler */
    const visibleRowCountChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
        gridSettings.visibleRowCount = (event.target as HTMLInputElement).value;
        gridSettingsRef.current = { ...gridSettings };
    };

    /**row height radio button change handler */
    const rowHeightChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
        gridSettings.rowHeight = (event.target as HTMLInputElement).value;
        gridSettingsRef.current = { ...gridSettings };
        setRowHeightUpdated(true);
    };

    return (
        <StyledDialog open={open} container={container} BackdropComponent={StyledBackdrop}>
            <DialogTitle>Tatical Grid Settings</DialogTitle>
            <DialogContent>
                <ContentBody>
                    <section>
                        <FormLabel>Visible Row Count</FormLabel>
                        <RadioGroup defaultValue={gridSettings.visibleRowCount} onChange={visibleRowCountChanged}>
                            <TwoColumnGrid>
                                <FormControlLabel value='25' control={<Radio />} label='25' />
                                <FormControlLabel value='50' control={<Radio />} label='50' />
                                <FormControlLabel value='100' control={<Radio />} label='100' />
                                <FormControlLabel value='200' control={<Radio />} label='200' />
                                <FormControlLabel value='350' control={<Radio />} label='350' />
                                <FormControlLabel value='15' control={<Radio />} label='auto' />
                            </TwoColumnGrid>
                        </RadioGroup>
                    </section>
                    <section>
                        <FormLabel>Grid Row Height</FormLabel>
                        <RadioGroup defaultValue={gridSettings.rowHeight} onChange={rowHeightChanged}>
                            <TwoColumnGrid>
                                <FormControlLabel value='20' control={<Radio />} label='20' />
                                <FormControlLabel value='25' control={<Radio />} label='25' />
                                <FormControlLabel value='30' control={<Radio />} label='30' />
                                <FormControlLabel value='40' control={<Radio />} label='40' />
                                <FormControlLabel value='45' control={<Radio />} label='45' />
                                <FormControlLabel value='50' control={<Radio />} label='50' />
                                <FormControlLabel value='35' control={<Radio />} label='default' />
                            </TwoColumnGrid>
                        </RadioGroup>
                    </section>
                    {rowHeightUpdated && <p>The grid will be closed and re-opened to apply row height changes.</p>}
                </ContentBody>
            </DialogContent>
            <DialogActions>
                <ActionButton color='secondary' variant='contained' onClick={handleOk}>
                    Apply
                </ActionButton>
                <ActionButton color='secondary' variant='contained' onClick={handleCancel}>
                    Cancel
                </ActionButton>
            </DialogActions>
        </StyledDialog>
    );
};

/**describes the props for the grid setting menu */
interface TacticalGridSettingsMenuProps {
    onClose: (idClicked: string) => void;
    open: boolean;
    container?: HTMLElement | null;
}

/**menu items for show various tactical grid related options */
export const TacticalGridSettingsMenu = (props: TacticalGridSettingsMenuProps): JSX.Element => {
    const { onClose, open, container } = props;
    const dispatch = useAppDispatch();
    const showEllipseCheckbox = useAppSelector((state) => state.tacticalGridDataSlice.showEllipseCheckbox);
    const showEllipseForSelected = useAppSelector((state) => state.tacticalGridDataSlice.tgridInDrawEllipseMode);

    /**placeholder: handler for menu items yet to be defined */
    const handleMenuItemClick = () => {
        //take appropriate action based on the selected menu options
    };

    /**handle menu close event */
    const handleClose = (id: string) => {
        onClose(id);
    };

    /**
     * Handle support ellipse checkbox change.
     * @param value true or false if not checked
     */
    async function showEllipseForSelectedCheckChanged(value: boolean): Promise<void> {
        dispatch(setTgridInDrawEllipseMode(value));
    }

    return (
        <>
            <Menu anchorEl={container} open={open} onClose={onClose} onClick={handleMenuItemClick}>
                <MenuItem id='' onClick={() => handleClose('tactical-grid-settings')}>
                    <IconButtonDiv>
                        <GearIcon />
                    </IconButtonDiv>
                    Tactical Grid Settings
                </MenuItem>
                <Tooltip title='Not implemented'>
                    <span>
                        <MenuItem disabled={true}>
                            <IconButtonDiv>
                                <DownloadIcon />
                            </IconButtonDiv>
                            Download to CSV
                        </MenuItem>
                    </span>
                </Tooltip>
                <MenuItem onClick={() => handleClose('refresh-tactical-grid')}>
                    <IconButtonDiv>
                        <RefreshIcon />
                    </IconButtonDiv>
                    Refresh Grid Data
                </MenuItem>
                <MenuItem>
                    <Tooltip title={showEllipseCheckbox ? 'No ellipse field mappings defined.' : ''}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    title='Show ellipses.'
                                    disabled={showEllipseCheckbox}
                                    checked={showEllipseForSelected}
                                    onChange={(evt: any) => showEllipseForSelectedCheckChanged(evt.target.checked)}
                                />
                            }
                            label='View Ellipse Mode'
                        />
                    </Tooltip>
                </MenuItem>
            </Menu>
        </>
    );
};
export default TacticalGridSettingsDialog;
