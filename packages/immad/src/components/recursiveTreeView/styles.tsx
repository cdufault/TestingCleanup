import { makeStyles } from '@mui/styles';

const useStyles = makeStyles({
    root: {
        flexGrow: 1,
        maxWidth: 300,
        // Theme highlight (secondary.main): '#54a8ff' | A shade lighter (secondary.light): '#85bffa'
        '& .MuiTreeItem-content.Mui-selected, & .MuiTreeItem-content.Mui-selected.Mui-focused, & .MuiTreeItem-content.Mui-selected:hover':
            {
                backgroundColor: '#333b42 !important',
            },
        '& .MuiTreeItem-content.Mui-selected .MuiTreeItem-label, & .MuiTreeItem-content.Mui-selected.Mui-focused .MuiTreeItem-label, & .MuiTreeItem-content.Mui-selected:hover .MuiTreeItem-label':
            {
                backgroundColor: 'transparent !important',
            },
    },
    rootNoHighlight: {
        flexGrow: 1,
        maxWidth: 300,
        '& .MuiTreeItem-content.Mui-selected, & .MuiTreeItem-content.Mui-selected.Mui-focused, & .MuiTreeItem-content.Mui-selected:hover':
            {
                backgroundColor: 'transparent !important',
            },
    },
});

export { useStyles };
