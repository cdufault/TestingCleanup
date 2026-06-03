import styled from 'styled-components';
import { Dialog, DialogActions } from '@mui/material';

const StyledSpinnerDiv = styled.div`
    display: flex;
    width: 100%;
    height: 95%;
    align-items: center;
    justify-content: center;
`;
const StyledWidgetModalDialog = styled(Dialog)`
    margin: 0;
    min-width: 40rem;
`;

const StyledDialogActions = styled(DialogActions)`
    padding: 24px;
`;

export { StyledSpinnerDiv, StyledWidgetModalDialog, StyledDialogActions };
