import React, { Fragment, useContext, useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import HandleVertical from 'calcite-ui-icons-react/HandleVerticalIcon';
import { useAppDispatch, useAppSelector } from '../../../hooks/hooks';
import { setSelectedTGridDataSliceAction, setTgridSelectedRowForAction } from './TacticalGridDataSlice';
import { TacticalGridContext } from '../../../contexts/TacticalGrid';
import { isLockingStatus } from '../helpers/gridHelper';
import { ConfigHelper } from '../../../helpers/configHelper';
import { RowStatusEnum } from '../resources';
import { AppContext } from '../../../contexts/App';

/**
 * Input prop to TacticalGridActionMenu
 */
interface TacticalGridActionMenuProps {
    /**object containing feature class field names and related data  - a data row*/
    fieldsData: any;
}

/**
 * A widget that represents a context menu that can be displayed in a Tactical Grid column.
 * @param props a row of field data
 * @returns JSX.Element
 */
const TacticalGridActionMenu = (props: TacticalGridActionMenuProps): JSX.Element => {
    const { userRoles } = useContext(AppContext);
    const isAdminUser = userRoles.Administrator === true || userRoles.MissionManager === true;
    const { fieldsData } = props;
    const [actionMenuIsOpen, setActionMenuIsOpen] = useState(false);
    const [evalStatusValue, setEvalStatusValue] = useState();
    const [anchorElement, setAnchorElement] = useState<HTMLButtonElement>();
    const [selectedObjectId, setSelectedObjectId] = useState<number>(-1);
    const [rowIsLocked, setRowIsLocked] = useState(false);
    const [canShowMenu, setCanShowMenu] = useState(false);

    const dispatch = useAppDispatch();
    const appConfig = ConfigHelper.getAppConfig();
    const tGridLayerOIDFieldName = useAppSelector(
        (state: any) => state.tacticalGridDataSlice.tgridFeatureLayerOIDFieldName
    );
    const { selectedRows } = useContext(TacticalGridContext);
    const gridHasSelection = selectedRows && selectedRows.length > 0;

    useEffect(() => {
        dispatch(setSelectedTGridDataSliceAction({ action: 'empty', oid: -1 }));
    }, []);

    useEffect(() => {
        if (fieldsData && tGridLayerOIDFieldName) {
            const oidVal = fieldsData[tGridLayerOIDFieldName.toLowerCase()];
            const fieldDataEvalStatus = fieldsData[appConfig.tacticalGrid.statusField];
            setRowIsLocked(isLockingStatus(fieldDataEvalStatus));
            setEvalStatusValue(fieldDataEvalStatus ? fieldDataEvalStatus : undefined);
            setSelectedObjectId(oidVal);
        }
    }, [fieldsData]);

    useEffect(() => {
        if (selectedObjectId !== -1) {
            canMenuBeDisplayed();
        }
    }, [selectedObjectId]);

    useEffect(() => {
        if (!selectedRows || selectedRows?.length < 1) {
            setCanShowMenu(false);
        }
    }, [selectedRows]);

    /**
     * Handle click on the filter button - sets HTML anchor element for placing the context menu
     * @param event filter button click event
     */
    const onFilterButtonClick = (event: React.MouseEvent<HTMLButtonElement | MouseEvent>) => {
        setAnchorElement(event.currentTarget as HTMLButtonElement);
        setActionMenuIsOpen(true);
    };

    /**
     * Handle closing event on the dialog. Close is triggered by clicking a menu item or clicking away.
     */
    function handleClose() {
        setActionMenuIsOpen(false);
    }

    /**
     * Hanndle menu item click then fire a state update on the Tactical Grid slice which will
     * enable the tacticalGrid to respond to the action state change, also dispatches the row data to the slice
     * so the UI elements can handle the form data for updating.
     * @param action selected action item selected
     */
    function handleMenuItemClick(selectedAction: string) {
        setActionMenuIsOpen(false);
        dispatch(setSelectedTGridDataSliceAction({ action: selectedAction.toLowerCase(), oid: selectedObjectId }));
        dispatch(setTgridSelectedRowForAction(fieldsData));
    }

    /**
     * Determine if the action item can/should be displayed in the context menu.
     * @param action the action that may or may not be displayed in the menu
     * @returns true if it should be shown otherwise false
     */
    function isMenuItemVisible(action: string) {
        if (action === 'Clear Status') {
            if (isAdminUser) {
                //action only allowed for admin users
                return rowIsLocked && gridHasSelection; //only applicable to locked rows
            }
            return false;
        } else if (action === 'No Action' || action === 'Evaluate' || action === 'Update Time') {
            return !rowIsLocked || !gridHasSelection;
        } else {
            return (!gridHasSelection && action === 'Issue') || !rowIsLocked;
        }
    }

    /**
     * Determines if the context menu can be displayed for a given row.
     * Sets a state object with the result.
     */
    function canMenuBeDisplayed() {
        let found = undefined;
        if (selectedRows && selectedRows.length > 0 && selectedObjectId) {
            //row must be in the selectedRows collection, note that locked rows are not added to this collection
            found = selectedRows.find((row) => row[tGridLayerOIDFieldName.toLowerCase()] === selectedObjectId);
        }
        found ? setCanShowMenu(true) : setCanShowMenu(false);
    }

    /**items that can appear in the context menu */
    const actionItems = [
        'Clear Status',
        'No Action',
        'Evaluating',
        'Update Time',
        'Update Location',
        'Update Source',
        'Issue',
        'Update All',
    ];

    return (
        <>
            {canShowMenu ? (
                <Fragment>
                    <Button
                        sx={{ minWidth: '32px' }}
                        color='primary'
                        size='small'
                        onClick={onFilterButtonClick}
                        title={'Select an Action'}
                    >
                        <HandleVertical size={16} />
                    </Button>

                    <Popover
                        open={actionMenuIsOpen}
                        onClose={handleClose}
                        anchorEl={anchorElement}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                        }}
                    >
                        <MenuList id='split-button-menu'>
                            {actionItems.map(
                                (option, index) =>
                                    isMenuItemVisible(option) &&
                                    !(
                                        option.toLowerCase() === RowStatusEnum.EVALUATING &&
                                        evalStatusValue === option.toLowerCase()
                                    ) && (
                                        <div key={option} title={option}>
                                            <MenuItem
                                                key={option}
                                                onClick={() => handleMenuItemClick(option)}
                                                title={option}
                                            >
                                                {option}
                                            </MenuItem>
                                        </div>
                                    )
                            )}
                        </MenuList>
                    </Popover>
                </Fragment>
            ) : (
                <></>
            )}
        </>
    );
};

export default TacticalGridActionMenu;
