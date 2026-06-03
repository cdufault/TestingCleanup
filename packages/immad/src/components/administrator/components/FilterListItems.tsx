import React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import CheckCircleIcon from 'calcite-ui-icons-react/CheckCircleIcon';
import { FiltersListItem, useAdminSettingsContext } from '../../../contexts/AdminSettingsContext';
/**
 * Defines the input properties required by the FilterListItems component.
 */
interface FilterListItemsProps {
    onFilterChange(item: { id: number; value?: string }): void;
    filtersList: FiltersListItem[];
}

/**
 * A sub component of the PortalUsersPage component that provides the
 * ability for IMMAD to create the filter objects.
 * @param props
 * @constructor
 */
export default function FilterListItems(props: FilterListItemsProps): JSX.Element {
    const adminSettingsContext = useAdminSettingsContext();
    const filtersList = props.filtersList;

    function handleFilterItemClick(item: FiltersListItem): void {
        // Filter changed reset to first page of table.
        adminSettingsContext.setTablePage(0);
        if (adminSettingsContext.selectedFilterItem.id === item.id) {
            // toggle off
            props.onFilterChange({ id: 0, value: '' });
        } else {
            // toggle on
            props.onFilterChange(item);
        }
    }
    const listItems = filtersList.map((item) => (
        <ListItem
            key={item.id}
            onClick={() => handleFilterItemClick(item)}
            selected={adminSettingsContext.selectedFilterItem.id === item.id}
        >
            <ListItemIcon>{adminSettingsContext.selectedFilterItem.id === item.id && <CheckCircleIcon />}</ListItemIcon>
            <ListItemText primary={item.value} />
        </ListItem>
    ));
    return <List>{listItems}</List>;
}
