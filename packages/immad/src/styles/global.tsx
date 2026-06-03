import { createGlobalStyle } from 'styled-components';
import { theme } from './theme';

// ArcGIS JS API base styles/theme
// import '@arcgis/core/assets/esri/themes/dark/main.css';

// ArcGIS JS API theme overrides
import esriThemeDark from './esriThemeDark';

// FlexLayout Theme/Overrides
import flexLayoutStyles from './flexLayoutStyles';

// MUI Overrides
import muiStyles from './muiStyles';

const GlobalStyle = createGlobalStyle`
    /* Document Resets */
    html,
    body,
    #root {
        width: 100%;
        height: 100%;
    }

    html {
        font-size: 87.5%;
    }

    body {
        margin: 0;
        padding: 0;
        color-scheme: dark;
        --calcite-color-text-1: ${theme.palette.primary.contrastText};
        --calcite-color-foreground-1: ${theme.palette.background.paper};
    }
    
    .webmap {
        height: 100%;
        width: 100%;
    }
    
    /* Esri Theme Overrides */
    ${esriThemeDark}

    /* Flex Layout Theme/Overrides */
    ${flexLayoutStyles}

    /* MUI Global Overrides */
    ${muiStyles}
    
    /* Datepicker Styles */
    .react-datepicker-wrapper,
    .react-datepicker__input-container,
    .react-datepicker__input-container input {
        height: 100%;
        min-height: 2.8rem;
        font-family: ${theme.typography.fontFamily};
        font-size: ${theme.typography.fontSize};
        background-color: ${theme.palette.background.paper};
        color: ${theme.palette.primary.contrastText};
    }
    
    /* Quill Styles */
    
    .ql-toolbar .ql-stroke {
        fill: none;
        stroke: ${theme.palette.primary.contrastText};
    }
    
    .ql-toolbar .ql-fill {
        fill: ${theme.palette.primary.contrastText};
        stroke: none;
    }
    
    .ql-toolbar .ql-picker {
        color: ${theme.palette.primary.contrastText};
    }
    
    .ql-picker-options {
        color: ${theme.palette.primary.main};
    }
`;

export { GlobalStyle };
