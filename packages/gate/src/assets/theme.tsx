import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            dark: '#293040',
            main: '#485a73',
            contrastText: '#fff',
        },
        secondary: {
            light: '#85bffa',
            main: '#54a8ff',
            dark: '#208cfa',
            contrastText: '#000',
        },
        divider: '#485a73',
        background: {
            paper: '#181d26',
            default: '#0d0d0d',
        },
        common: {
            black: '#0d0d0d',
            white: '#f1f1f1',
        },
        text: {
            primary: '#fff',
        },
    },

    typography: {
        fontFamily: 'Arial, sans-serif',
        htmlFontSize: 14,
        fontSize: 14,
    },

    spacing: (factor: number) => `${0.5 * factor}rem`,

    components: {
        MuiRadio: {
            styleOverrides: {
                colorPrimary: {
                    color: '#485a73',
                    '&.Mui-checked': {
                        color: '#208cfa',
                    },
                },
            },
        },
        MuiCheckbox: {
            styleOverrides: {
                colorPrimary: {
                    color: '#485a73',
                    '&.Mui-checked': {
                        color: '#208cfa',
                    },
                },
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    backgroundColor: '#f1f1f1',
                    color: '#293040',
                    border: '1px solid #f1f1f1',
                },
            },
        },
    },
});

export { theme };
