import styled from 'styled-components';

import { ActionButton, InputGroup } from '../../common';
import { Button, ToggleButton } from '@mui/material';
import LayerSelect from '../../common/layerSelect/LayerSelect';

const StyledInputGroup = styled(InputGroup)`
    align-items: center;
    width: 100%;
    margin: '1rem 0rem 0rem 0rem';
`;

const StyledActionInputGroup = styled(StyledInputGroup)`
    margin-top: 1rem;
`;

const StyledInlineButton = styled(ActionButton)`
    min-width: auto;
    margin: 0 5px 0 5px;
    height: auto;
    color: #0daeff !important;
    background-color: #262b3d;
    border-radius: 33.33px;
    border: none;
    &:hover {
        background-color: #3d445b;
    }
`;

const StyledLayerSelect = styled(LayerSelect)`
    padding: 5px;
    color: #0daeff;
    background-color: #262b3d;
    border-radius: 33.33px;
    border: none;
    &:hover {
        background-color: #3d445b;
    }
`;

const StyledInlineToggleButton = styled(ToggleButton)`
    margin: 0 5px 0 5px;
    color: #0daeff;
    background-color: #262b3d;
    border-radius: 33.33px;
    border: none;

    &:hover {
        background-color: #3d445b;
    }

    &:disabled {
        color: #1f485c;
        background-color: #262b3d;
    }
    &.Mui-selected {
        background-color: rgb(4, 147, 217);
        color: rgb(255, 255, 255);
    }
`;

export { StyledInputGroup, StyledActionInputGroup, StyledInlineButton, StyledLayerSelect, StyledInlineToggleButton };
