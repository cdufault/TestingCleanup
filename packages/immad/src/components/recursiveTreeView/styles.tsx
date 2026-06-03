import { makeStyles } from '@mui/styles';

const useStyles = makeStyles({
    root: {
        flexGrow: 1,
        maxWidth: 300,
        '&.MuiTreeItem-root.Mui-selected > .MuiTreeItem-content .MuiTreeItem-label:hover, .MuiTreeItem-root.Mui-selected:focus > .MuiTreeItem-content .MuiTreeItem-label, .MuiTreeItem-root.Mui-selected > .MuiTreeItem-content .MuiTreeItem-label':
            {
                backgroundColor: 'green',
            },
    },
    rootNoHighlight: {
        flexGrow: 1,
        maxWidth: 300,
        '&.MuiTreeItem-root.Mui-selected > .MuiTreeItem-content .MuiTreeItem-label:hover, .MuiTreeItem-root.Mui-selected:focus > .MuiTreeItem-content .MuiTreeItem-label, .MuiTreeItem-root.Mui-selected > .MuiTreeItem-content .MuiTreeItem-label':
            {
                backgroundColor: 'transparent',
            },
    },
});

export { useStyles };
