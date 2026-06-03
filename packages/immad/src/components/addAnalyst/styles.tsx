import styled from 'styled-components';
import Modal from '@mui/material/Modal';

export const AddAnalystModalDialog = styled(Modal)`
    width: 70%;
    height: 80%;
    margin: auto;
    background: ${(props) => props.theme.palette.primary.main};
    box-shadow: ${(props) => props.theme.shadows[1]};
`;

export const AddAnalystDialogBody = styled.div`
    height: 88%;
`;

export const AddAnalystButtonContainer = styled.div`
    display: flex;
    padding: 5px;
    justify-content: flex-end;
    margin-top: 30px;
`;
