/**
 * Allow users to search Portal for a list of items and returns back the items matching the search results.
 *
 */

import { useCallback, useEffect, useState } from 'react';
import * as React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import { Avatar, CircularProgress, ListItemAvatar, ListItemText, MenuItem, Paper, TextField } from '@mui/material';
import PortalQueryParams from '@arcgis/core/portal/PortalQueryParams';
import PortalItem from '@arcgis/core/portal/PortalItem';
import CheckIcon from 'calcite-ui-icons-react/CheckIcon';
import { PortalItemSelectProps } from '../../types/PortalItemSelect';
import { ThemeProvider } from '@emotion/react';
import Typography from '@mui/material/Typography';

/**
 * A reusable Portal Item select control. Searches for items in Portal and provides a compact search result list to the user.
 * @param props The Portal Item props to provide to the select control.
 * @constructor
 */
export const PortalItemSelect = (props: PortalItemSelectProps): JSX.Element => {
    const fallbackImg = './assets/logo.png';

    const { portal, onItemChange, query, label, disabled, portalItemID } = props;

    /** Whether the dialog is open */
    const [open, setOpen] = useState(false);

    /**
     * Determines whether the control is currently searching
     */
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Represents the current Portal Item.
     */
    const [portalItem, setPortalItem] = useState<PortalItem | null>(null);

    /**
     * The available options
     */
    const [options, setOptions] = useState<readonly PortalItem[]>(portalItem ? [portalItem] : []);

    /**
     * The current input (search) text.
     */
    const [inputValue, setInputValue] = useState<string>('');

    /**
     * Updates the selected Portal Item with the initial portal item id.
     */
    useEffect(() => {
        if (portal) {
            if (portalItemID) {
                const abortController = new AbortController();

                const portalItem = new PortalItem({
                    portal: portal,
                    id: portalItemID,
                });

                portalItem
                    .load(abortController.signal)
                    .then((portalItem) => setPortalItem(portalItem))
                    .catch((error) => {
                        console.error(error);
                        setPortalItem(null);
                    });
            } else {
                setPortalItem(null);
            }
        }
    }, [portal, portalItemID]);

    /**
     * Searches portal items in the Portal based the current inputValue
     */
    const searchData = useCallback(() => {
        const abortController = new AbortController();

        if (open && !isLoading) {
            const portalQueryParams = {
                num: 25,
                query: query ? `${query} AND ${inputValue ?? '*'}` : inputValue ?? '*',
                sortField: 'num-views',
                sortOrder: 'desc',
            } as PortalQueryParams;
            setIsLoading(true);
            portal
                .queryItems(portalQueryParams, { signal: abortController.signal })
                .then((queryResult) => {
                    if (queryResult) {
                        const portalItems: PortalItem[] = queryResult.results.filter((item: any) => item as PortalItem);
                        setOptions(portalItems);
                    }
                })
                .catch((error: any) => {
                    console.error(error.message);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }

        return () => {
            abortController.abort();
        };
    }, [inputValue, open]);

    useEffect(() => {
        if (portalItem) {
            setOptions([portalItem]);
        } else {
            setOptions([]);
        }
    }, [portalItem]);

    useEffect(() => {
        if (inputValue && open && !isLoading) {
            searchData();
        }
    }, [inputValue]);

    useEffect(() => {
        setOpen(false);

        if (portalItem) {
            portalItem
                .load()
                .then((portalItem) => onItemChange(portalItem))
                .catch((error) => console.error(error));
        } else {
            onItemChange(null);
        }
    }, [portalItem]);

    const component = (
        <Autocomplete
            fullWidth
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            options={options}
            loading={isLoading}
            value={portalItem}
            loadingText={`Searching ${portal.name} for items...`}
            disabled={!portal || disabled}
            noOptionsText={
                inputValue
                    ? `No items found matching search term "${inputValue}". Please perform a new search for items.`
                    : `No items found. Type to search for items.`
            }
            filterOptions={(x) => x}
            onInputChange={(e, value) => {
                setInputValue(value);
            }}
            PaperComponent={({ children }) => {
                return (
                    <Paper>
                        <Typography variant={'subtitle2'}>
                            Filtering Portal items by search term: "{inputValue}"
                        </Typography>
                        {children}
                    </Paper>
                );
            }}
            onChange={(event, value: PortalItem | null) => setPortalItem(value)}
            renderOption={(props, portalItem: PortalItem) => {
                const thumbnailURL = portalItem?.getThumbnailUrl(32) ?? fallbackImg;
                return (
                    <MenuItem {...props} key={portalItem.id}>
                        <ListItemAvatar>
                            <Avatar alt={portalItem?.type} src={thumbnailURL} variant={'rounded'} />
                        </ListItemAvatar>
                        <ListItemText
                            primary={portalItem.title}
                            secondary={`type: ${portalItem.type} - owner: ${portalItem.owner}`}
                        />
                    </MenuItem>
                );
            }}
            getOptionLabel={(portalItemOrString) => portalItemOrString?.title ?? ''}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    InputProps={{
                        ...params.InputProps,
                        startAdornment: portalItem && portalItem.title === inputValue && (
                            <Avatar
                                alt={portalItem?.type}
                                src={portalItem?.getThumbnailUrl(32) ?? fallbackImg}
                                variant={'rounded'}
                            />
                        ),
                        endAdornment: (
                            <>
                                {isLoading ? (
                                    <CircularProgress color='inherit' size={16} />
                                ) : (
                                    portalItem && <CheckIcon color='inherit' size={16} />
                                )}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                />
            )}
        />
    );

    return props.theme ? <ThemeProvider theme={props.theme}>{component}</ThemeProvider> : component;
};
