import styled from 'styled-components';

const Row = styled.div`
    display: flex;
    width: 100%;
    height: 100%;
`;

const Container = styled(Row)`
    flex-direction: column;
`;

export { Container, Row };
