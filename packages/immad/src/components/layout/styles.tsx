import { Button } from '@mui/material';
import styled from 'styled-components';

const Container = styled.div`
    position: relative;
    width: 100%;
    height: 100%;
`;

const StyledFlexContainer = styled.div`
    display: flex;
`;

const StyledButtonContainer = styled.div`
    display: flex;
    padding: 5px;
    justify-content: flex-end;
`;

const StyledButton = styled(Button)`
    margin: 5px;
`;

const RightButton = styled(Button)`
    float: right;
    margin-left: 10px;
`;

export { Container, RightButton, StyledButton, StyledButtonContainer, StyledFlexContainer };
