import React, { useState } from 'react';
import Box from '@mui/material/Box';
import { Button, TextField } from '@mui/material';
import styled from '@emotion/styled';

const NewTabForm = styled(Box)`
    display: inline-grid;
    grid-row-gap: 20px;
    width: 100%;
    background-color: lightgray;
    min-height: 150px;
    padding: 20px;

    height: 30%;
    margin-left: 5%;
    margin-right: 5%;
    margin-top: 40px;
`;
const NewTabBox = styled(Box)`
    display: flex;
    height: 100vh;
`;
/**Placeholder for future props passes to AddNewTab */
interface AddNewTabProps {
    tabUrlProp?: string;
    height?: number | string;
    width?: number;
}

/**Holds the form for adding a new tab to the region page view */
export const AddNewTab = (props: AddNewTabProps): JSX.Element => {
    const { tabUrlProp } = props;
    const [tabTitle, setTabTitle] = useState<string>('');
    const [tabUrl, setTabUrl] = useState<string>(tabUrlProp ? tabUrlProp : '');

    /**Tracks the URL entered by the user pointing to the source of the data */
    function urlChanged(event: React.ChangeEvent<HTMLInputElement>) {
        setTabUrl(event.target.value);
    }

    /**Tracks the change to the name to apply to the new tab */
    function titleChanged(event: React.ChangeEvent<HTMLInputElement>) {
        setTabTitle(event.target.value);
    }

    /**TASK
     * Add the new tab button click handler */
    function addNewTabClickHandler() {
        //not yet implemented
    }

    let canAddNewTab = tabUrl !== '' && tabTitle !== '';
    return (
        <NewTabBox>
            <NewTabForm>
                <TextField
                    sx={{ width: '100%' }}
                    variant='outlined'
                    label='Add Content URL'
                    value={tabUrl}
                    onChange={urlChanged}
                />
                <TextField
                    sx={{ width: '100%' }}
                    variant='outlined'
                    label='New Tab Title'
                    value={tabTitle}
                    onChange={titleChanged}
                />
                <Button onClick={addNewTabClickHandler} disabled={!canAddNewTab}>
                    Add New Tab
                </Button>
            </NewTabForm>
        </NewTabBox>
    );
};
