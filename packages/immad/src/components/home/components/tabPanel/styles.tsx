import styled from 'styled-components';

const Container = styled.main`
    width: 100%;
    height: 100%;
    background: ${(props) => props.theme.palette.background.default};
    overflow: hidden;
`;

export { Container };
