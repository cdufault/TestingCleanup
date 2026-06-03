import { css } from 'styled-components';
import { theme } from './theme';

const muiStyles = css`
    .MuiGrid-item {
        display: flex;
    }

    .MuiGrid-spacing-xs-1 {
        width: 100%;
        margin: 0;
    }

    .MuiSelect-outlined.MuiSelect-outlined {
        padding-block-start: 0.3rem;
        padding-block-end: 0.3rem;
        padding-inline-start: 1rem;
        padding-inline-end: 2.3rem;
        font-size: 1rem;
    }

    input[type='date']::-webkit-calendar-picker-indicator {
        filter: invert(1);
    }

    .MuiTab-textColorPrimary.Mui-selected {
        color: ${theme.palette.primary.contrastText};
    }

    .MuiButton-textPrimary {
        color: ${theme.palette.primary.contrastText};
    }
`;

export default muiStyles;
