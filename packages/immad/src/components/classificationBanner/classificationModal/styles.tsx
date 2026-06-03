import styled from 'styled-components';
import { DialogActions } from '@mui/material';
import { ActionButton } from '../../common';

const ClassificationWarning = styled.p`
    color: ${(props) => props.theme.palette.warning.main};
`;

const StyledDialogActionDiv = styled(DialogActions)`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
`;

const StyledDynamicClassificationToggleDiv = styled.div`
    display: flex;
    flex-direction: row;
`;

const StyledActionButton = styled(ActionButton)`
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
`;

export { ClassificationWarning, StyledDialogActionDiv, StyledDynamicClassificationToggleDiv, StyledActionButton };
