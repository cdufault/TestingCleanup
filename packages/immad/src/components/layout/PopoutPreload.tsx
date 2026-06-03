// React imports
import React from 'react';

// Component imports
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import CheckBox from '@mui/material/Checkbox';
import Radio from '@mui/material/Radio';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import BasePagination from '@mui/material/Pagination';
import CircularProgress from '@mui/material/CircularProgress';
import AppBar from '@mui/material/AppBar';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MuiRadioGroup from '@mui/material/RadioGroup';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Backdrop,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Popover,
} from '@mui/material';

// Component
// Force loads the CSS Modules in the Workspace for Flex-Layout's popout window
// There needs to be a reference component in the dom so the module doesn't upload when the popout window removes
// components from the main page.
const PopoutPreload = (): JSX.Element => {
    return (
        <div aria-hidden='true' style={{ display: 'none' }}>
            <MenuItem />
            <Popover open={false} />
            <Divider />
            <FormControlLabel control={<CheckBox />} label='' />
            <CheckBox />
            <Radio />
            <List />
            <ListItem />
            <ListItemIcon />
            <ListItemText />
            <Tab />
            <Tabs />
            <Card />
            <CardMedia component='div' />
            <CardContent />
            <CardActions />
            <BasePagination />
            <CircularProgress />
            <AppBar />
            <TextField variant='outlined' />
            <Select />
            <MuiRadioGroup />
            <Dialog open={false} />
            <DialogContent />
            <DialogTitle />
            <DialogActions />
            <Backdrop open={false} />
            <Accordion>
                <AccordionSummary />
                <AccordionDetails />
            </Accordion>
        </div>
    );
};

export default PopoutPreload;
