// React imports
import React, { useContext, useReducer, useState } from 'react';

// Component imports
import Typography from '@mui/material/Typography';
import { AppContext } from '../../../contexts/App';

// Style imports
import { StyledRightButton } from '../styles';
import TextInput from '../../common/TextInput';

export type UserProfile = {
    firstName: string;
    lastName: string;
    email: string;
    description: string;
    units: string;
};
type UserReducerFields = keyof UserProfile;

interface UserAction {
    type: UserReducerFields;
    payload: string;
}

function reducer(state: UserProfile, action: UserAction) {
    switch (action.type) {
        case 'firstName':
            return { ...state, [action.type]: action.payload };
        case 'lastName':
            return { ...state, [action.type]: action.payload };
        case 'email':
            return { ...state, [action.type]: action.payload };
        case 'description':
            return { ...state, [action.type]: action.payload };
        case 'units':
            return { ...state, [action.type]: action.payload };
        default:
            throw new Error('Missed Item!');
    }
}

const actionCreator = (type: UserReducerFields, payload: string) => ({
    type,
    payload,
});

export default function UserSettingPage(): JSX.Element {
    const { portalUser } = useContext(AppContext);

    const initialState: UserProfile = {
        firstName: portalUser.fullName.split(' ')[0],
        lastName: portalUser.fullName.split(' ')[1],
        email: portalUser.email,
        description: portalUser.description,
        units: portalUser.units,
    };
    const [state, dispatch] = useReducer(reducer, initialState);
    const [isDisabled, setIsDisabled] = useState<boolean>(true);
    const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
        // call rest endpoint and set values to those in the form
        // https://cigt-srv21.esri.tech/portal/sharing/rest/community/users/Christopher_Dufault/update
        // stops page from closing by default on submit.
        event.preventDefault();
    };

    function editButtonClicked() {
        setIsDisabled(false);
    }
    function cancelButtonClicked() {
        setIsDisabled(true);
    }

    return (
        <form onSubmit={handleSubmit}>
            <Typography variant='h4' gutterBottom={true}>
                User Settings
                {isDisabled ? (
                    <StyledRightButton variant='contained' color='secondary' onClick={editButtonClicked}>
                        Edit
                    </StyledRightButton>
                ) : (
                    <>
                        <StyledRightButton variant='contained' color='secondary' type='submit'>
                            Save
                        </StyledRightButton>
                        <StyledRightButton variant='contained' color='primary' onClick={cancelButtonClicked}>
                            Cancel
                        </StyledRightButton>
                    </>
                )}
            </Typography>
            <TextInput
                fieldValue={state.firstName}
                changeInput={(event) => dispatch(actionCreator('firstName', event.target.value))}
                label='First Name:'
                fieldName='firstName'
                isDisabled={isDisabled}
            />
            <TextInput
                fieldValue={state.lastName}
                changeInput={(event) => dispatch(actionCreator('lastName', event.target.value))}
                label='Last Name:'
                fieldName='lastName'
                isDisabled={isDisabled}
            />
            <TextInput
                fieldValue={state.email}
                changeInput={(event) => dispatch(actionCreator('email', event.target.value))}
                label='Email:'
                fieldName='email'
                isDisabled={isDisabled}
            />
            <TextInput
                fieldValue={state.description}
                changeInput={(event) => dispatch(actionCreator('description', event.target.value))}
                label='Description:'
                fieldName='description'
                isDisabled={isDisabled}
            />
            <TextInput
                fieldValue={state.units}
                changeInput={(event) => dispatch(actionCreator('units', event.target.value))}
                label='Units:'
                fieldName='units'
                isDisabled={isDisabled}
            />
        </form>
    );
}
