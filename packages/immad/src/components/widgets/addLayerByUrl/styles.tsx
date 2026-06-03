import styled from 'styled-components';
import { InputLabel, Modal, Select } from '@mui/material';
import { addStylesToElement } from 'ag-grid-community/dist/lib/utils/dom';

const WidgetModalDialog = styled(Modal)`
    width: 40rem;
    height: fit-content;
    margin: auto;
    background: ${(props) => props.theme.palette.primary.main};
    box-shadow: ${(props) => props.theme.shadows[1]};
`;

const RightSelect = styled(Select)`
    float: right;
    margin-left: 10px;
`;

const StyledInputLabel = styled(InputLabel)`
    padding: 5px 5px 0 0;
`;

const URLContainer = styled.div`
    display: flex;
    column-gap: 5px;
`;

const OverflowDiv = styled.div`
    overflow: auto;
    max-height: 325px;
`;

export { WidgetModalDialog, RightSelect, StyledInputLabel, URLContainer, OverflowDiv };
