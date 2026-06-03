import styled from 'styled-components';
import { default as MuiToggleButton } from '@mui/material/ToggleButton';
import { default as MuiAvatar } from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import { Dialog, DialogActions, DialogContentText } from '@mui/material';
import { createStyles, makeStyles } from '@mui/styles';
import { AppBar } from '../common/styles';

const StyledMenuBar = styled(AppBar)``;

const GridSpacer = styled.div`
    flex-grow: 1;
`;

const ToggleButton = styled(MuiToggleButton)`
    padding-block-start: 0.1rem;
    padding-block-end: 0.1rem;
    padding-inline-start: 1rem;
    padding-inline-end: 1rem;
`;

const Avatar = styled(MuiAvatar)`
    width: 1.5rem;
    height: 1.5rem;
    font-size: 0.8rem;
`;

const StyledDialogContentText = styled(DialogContentText)`
    color: var(--calcite-ui-danger);
`;

const BigAvatar = styled(MuiAvatar)`
    width: 3.5rem;
    height: 3.5rem;
    font-size: 0.8rem;
`;

const StyledWidgetModalDialog = styled(Dialog)`
    margin: 0;
    min-width: 40rem;
`;

const StyledDialogActions = styled(DialogActions)`
    padding: 24px;
`;

const StyledDivHidden = styled.div`
    display: none;
`;

const StyledUserButton = styled(Button)<{ variant: 'contained' | 'outlined' }>`
    color: ${({ variant }) => (variant === 'contained' ? 'white' : '#0daeff')};
    background-color: ${({ variant }) => (variant === 'contained' ? '#0daeff' : '#04a6d')};
    border-radius: 33.33px;
    border: ${({ variant }) => (variant === 'outlined' ? '1px solid #0daeff' : 'none')};

    &:hover {
        background-color: ${({ variant }) => (variant === 'contained' ? '#034a6d' : '#3D445B')};
    }
    width: 16rem;
`;

const StyledButtonContainer = styled.div`
    padding: 5px 5px 5px 0;
`;

const StyledPopoutContent = styled.div`
    padding: 10px;
`;

const StyledAvatarContainer = styled.div`
    display: flex;
    justify-content: center;
    padding-bottom: 3px;
`;

const StyledUsernameContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
`;

const StyledRow = styled.div`
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    align-items: center;
    column-gap: 5px;
`;

const StyledRowWithPadding = styled.div`
    display: flex;
    flex-grow: 1;
    padding-top: 5px;
`;

const StyledColumn = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
`;

const StyledCalciteIcon = styled.img`
    height: 24px;
    width: 24px;
    filter: invert(1);
`;

const useStyles = makeStyles(() =>
    createStyles({
        muipaper: {
            outline: 'none',
            position: 'absolute',
            maxWidth: 'calc(100% - 32px)',
            minWidth: '16px',
            maxHeight: 'calc(100% - 32px)',
            minHeight: '16px',
            overflow: 'hidden',
        },
        rotateIcon: {
            animation: '$spin 2s linear infinite',
        },
        '@keyframes spin': {
            '0%': {
                transform: 'rotate(360deg)',
            },
            '100%': {
                transform: 'rotate(0deg)',
            },
        },
    })
);

const StyledDialogButton = styled(Button)<{ variant: 'contained' | 'outlined' }>`
    color: ${({ variant }) => (variant === 'contained' ? 'white' : '#0daeff')};
    background-color: ${({ variant }) => (variant === 'contained' ? '#0daeff' : '#04a6d')};
    border-radius: 10px;
    border: ${({ variant }) => (variant === 'outlined' ? '1px solid #0daeff' : 'none')};

    &:hover {
        background-color: ${({ variant }) => (variant === 'contained' ? '#59c3ff' : '#3D445B')};
    }
    width: 1.5rem;
`;

const StyledSettingsButtonRow = styled.div`
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    justify-content: center;
    align-items: center;
    column-gap: 5px;
    padding-top: 5px;
`;

export {
    StyledMenuBar,
    GridSpacer,
    ToggleButton,
    Avatar,
    BigAvatar,
    StyledWidgetModalDialog,
    StyledDialogActions,
    StyledDivHidden,
    StyledDialogContentText,
    StyledUserButton,
    StyledButtonContainer,
    StyledPopoutContent,
    StyledAvatarContainer,
    StyledUsernameContainer,
    StyledRow,
    StyledRowWithPadding,
    StyledColumn,
    useStyles,
    StyledCalciteIcon,
    StyledDialogButton,
    StyledSettingsButtonRow,
};
