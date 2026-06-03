import { css } from 'styled-components';

import { theme } from './theme';

const flexLayoutStyles = css`
    /* Theme */

    .flexlayout__tab_button_content {
        color: ${theme.palette.primary.contrastText};
    }

    .flexlayout__tabset_tabbar_outer {
        background-color: ${theme.palette.background.default};
    }

    .flexlayout__tabset-selected {
        background-image: none;
        background-color: ${theme.palette.background.paper};
    }

    .flexlayout__tab_button {
        &:hover {
            background-color: ${theme.palette.secondary.main};
        }
    }

    .flexlayout__tab_button--unselected {
        background-color: ${theme.palette.primary.main};
    }

    .flexlayout__tab_button--selected {
        background-color: ${theme.palette.primary.light};
    }

    .flexlayout__tab_button_trailing {
        display: flex;
        align-items: center;
        background: none !important;
    }

    .flexlayout__tab_toolbar_button-float,
    .flexlayout__tab_toolbar_button-min,
    .flexlayout__tab_toolbar_button-max {
        background: none;
    }

    .flexlayout__splitter {
        background-color: ${theme.palette.background.default};
        transition: background 250ms ease;

        &:hover {
            background-color: ${theme.palette.secondary.main};
        }
    }

    /* Overrides */
    .flexlayout__tab {
        z-index: 100;
        background-color: ${theme.palette.background.paper};
    }
`;

export default flexLayoutStyles;
