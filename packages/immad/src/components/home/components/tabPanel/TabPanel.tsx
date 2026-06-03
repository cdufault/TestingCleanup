// React imports
import React, { ReactNode } from 'react';

// Style imports
import { Container } from './styles';

interface TabPanelProps {
    children?: ReactNode;
    index: any;
    value: any;
}

const TabPanel = (props: TabPanelProps): JSX.Element => {
    const { children, value, index, ...other } = props;

    return (
        <Container
            role='tabpanel'
            hidden={value !== index}
            id={`home-tabpanel-${index}`}
            aria-labelledby={`home-tabpanel-${index}`}
            {...other}
        >
            {value === index && <>{children}</>}
        </Container>
    );
};

export default TabPanel;
