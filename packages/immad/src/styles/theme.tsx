import { Theme, createTheme } from '@mui/material/styles';

declare module '@mui/styles/defaultTheme' {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface DefaultTheme extends Theme {}
}

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            dark: '#293040',
            main: '#485a73',
            light: '#6480a0',
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
        MuiButton: {
            styleOverrides: {
                outlinedPrimary: {
                    color: '#f1f1f1',
                },
            },
        },
        MuiSwitch: {
            styleOverrides: {
                switchBase: {
                    // unchecked thumb
                    color: '#485a73',
                },
                colorPrimary: {
                    '&.Mui-checked': {
                        // checked color for thumb
                        color: '#85bffa',
                    },
                },
                track: {
                    opacity: 0.2,
                    backgroundColor: '#fff',
                    '.Mui-checked.Mui-checked + &': {
                        opacity: 0.7,
                        backgroundColor: '#208cfa',
                    },
                },
            },
        },
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
        MuiTextField: {
            defaultProps: {
                InputProps: {
                    autoComplete: 'off',
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
