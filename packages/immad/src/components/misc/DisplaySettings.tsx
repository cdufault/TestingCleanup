import {
    FieldGroup,
    ActionButton,
    WidgetContainer,
    WidgetActions,
    WidgetContent,
    WidgetHeader,
    InputLabel,
} from '../common';
import React, { useContext } from 'react';
import { FormControlLabel, Switch, MenuItem } from '@mui/material';
import { MapContext } from '../../contexts/Map';
import { UserSettingsContext } from '../../contexts/UserSettings';
import { InputField } from '../common';
import { useSnackbar } from 'notistack';
import { updateLightingIsEnabled } from '../UserSettingsSlice';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';

const DisplaySettings = (): JSX.Element => {
    const { activeView } = useContext(MapContext);
    const {
        distanceUnit,
        setDistanceUnit,
        areaUnit,
        setAreaUnit,
        saveUserPropertiesToPortalAsync,
        listenForConnection,
        setListenForConnection,
        addToLayerList,
        setAddToLayerList,
        pollDelay,
        setPollDelay,
    } = useContext(UserSettingsContext);
    const { enqueueSnackbar } = useSnackbar();
    const dispatch = useAppDispatch();
    const lightingEnabled = useAppSelector((state) => state.userSettingsSlice.lightingIsEnabled);

    const distanceUnits = [
        { title: 'Imperial', value: 'imperial' },
        { title: 'Metric', value: 'metric' },
        { title: 'Inches', value: 'inches' },
        { title: 'Feet', value: 'feet' },
        { title: 'Yards', value: 'yards' },
        { title: 'Miles', value: 'miles' },
        { title: 'Nautical Miles', value: 'nautical-miles' },
        { title: 'Feet(US)', value: 'us-feet' },
        { title: 'Meters', value: 'meters' },
        { title: 'Kilometers', value: 'kilometers' },
    ];
    const areaUnits = [
        { title: 'Imperial', value: 'imperial' },
        { title: 'Metric', value: 'metric' },
        { title: 'Square Inches', value: 'square-inches' },
        { title: 'Square Feet', value: 'square-feet' },
        { title: 'Square Yards', value: 'square-yards' },
        { title: 'Square Miles', value: 'square-miles' },
        { title: 'Square Feet(US)', value: 'square-us-feet' },
        { title: 'Square Meters', value: 'square-meters' },
        { title: 'Square Kilometers', value: 'square-kilometers' },
        { title: 'Acres', value: 'acres' },
        { title: 'Hectares', value: 'hectares' },
    ];

    const onSaveClick = async () => {
        const saveResponse = await saveUserPropertiesToPortalAsync();
        if (saveResponse) {
            enqueueSnackbar('User settings saved successfully.', {
                variant: 'success',
            });
        } else {
            enqueueSnackbar('Error saving user settings.', {
                variant: 'error',
            });
        }
    };

    /**
     * Handle the change on the enable/disable lighting switch
     * @param event change event on the toggle button
     */
    const lightingSwitchChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
        dispatch(updateLightingIsEnabled(event.target.checked));
    };

    return (
        <WidgetContainer>
            <React.Fragment>
                <WidgetContent elevation={0}>
                    {activeView === 'SCENE' && (
                        <React.Fragment>
                            <WidgetHeader position='static'>Display Settings (3D)</WidgetHeader>

                            <FieldGroup $bottomgutter title='Display Settings'>
                                <FormControlLabel
                                    control={
                                        <Switch checked={lightingEnabled} onChange={lightingSwitchChangeHandler} />
                                    }
                                    label='Show Day/Night Lighting'
                                />
                            </FieldGroup>
                            {/* Commenting out this toggle and retaining for future JS API update as there is a bug with
                             the atmosphere leaving a permanent shadow in JSAPI v.4.31 - only way to get around this
                             currently is to turn it off by default and remove the toggle until a fix is out */}
                            {/*<FieldGroup $bottomgutter title='Display Settings'>*/}
                            {/*    <FormControlLabel*/}
                            {/*        control={*/}
                            {/*            <Switch checked={atmosphereEnabled} onChange={atmosphereSwitchChangeHandler} />*/}
                            {/*        }*/}
                            {/*        label='Display Atmosphere'*/}
                            {/*    />*/}
                            {/*</FieldGroup>*/}
                        </React.Fragment>
                    )}
                    {activeView === 'MAP' && (
                        <React.Fragment>
                            <WidgetHeader position='static'>Display Settings (2D)</WidgetHeader>
                        </React.Fragment>
                    )}

                    {/*<FieldGroup> Removed as currently does nothing to the application. Keeping code in case it needs to be implemented later. */}
                    {/*    <FormControlLabel*/}
                    {/*        control={*/}
                    {/*            <Switch*/}
                    {/*                checked={defaultPopupEnabled}*/}
                    {/*                onChange={(event) => setDefaultPopupEnabled(event.target.checked)}*/}
                    {/*            />*/}
                    {/*        }*/}
                    {/*        label={'Use a default Popup Template for Layers'}*/}
                    {/*    />*/}
                    {/*</FieldGroup>*/}

                    <WidgetHeader position='static' style={{ marginTop: '15px' }}>
                        Measure Tool Settings
                    </WidgetHeader>
                    <FieldGroup>
                        <InputLabel>Distance</InputLabel>
                        <InputField
                            variant='outlined'
                            select
                            fullWidth
                            color='secondary'
                            title='Distance'
                            value={distanceUnit}
                            onChange={(event) => {
                                setDistanceUnit(event.target.value);
                            }}
                        >
                            {distanceUnits.map((unit) => {
                                return (
                                    <MenuItem key={unit.value} value={unit.value} id={unit.value}>
                                        {unit.title}
                                    </MenuItem>
                                );
                            })}
                        </InputField>
                    </FieldGroup>
                    <FieldGroup>
                        <InputLabel>Area</InputLabel>
                        <InputField
                            variant='outlined'
                            select
                            fullWidth
                            color='secondary'
                            title='Area'
                            value={areaUnit}
                            onChange={(event) => {
                                setAreaUnit(event.target.value);
                            }}
                        >
                            {areaUnits.map((unit) => {
                                return (
                                    <MenuItem key={unit.value} value={unit.value} id={unit.value}>
                                        {unit.title}
                                    </MenuItem>
                                );
                            })}
                        </InputField>
                    </FieldGroup>

                    <WidgetHeader position='static' style={{ marginTop: '15px' }}>
                        RemoteView Settings
                    </WidgetHeader>
                    <FieldGroup>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={listenForConnection}
                                    onChange={(event) => {
                                        setListenForConnection(event.target.checked);
                                    }}
                                />
                            }
                            label='Listen for RemoteView Connection'
                        />
                    </FieldGroup>
                    <FieldGroup>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={addToLayerList}
                                    onChange={(event) => {
                                        setAddToLayerList(event.target.checked);
                                    }}
                                />
                            }
                            label='Show RemoteView Layers in Layer List'
                        />
                    </FieldGroup>
                    <FormControlLabel
                        control={
                            <InputField
                                variant='outlined'
                                type='number'
                                size='small'
                                color='secondary'
                                inputProps={{ min: '3', max: '60' }}
                                onChange={(evt) => {
                                    setPollDelay(parseFloat(evt.target.value));
                                }}
                                value={pollDelay}
                            />
                        }
                        label='Polling Delay in Seconds'
                    />
                </WidgetContent>
            </React.Fragment>
            <React.Fragment>
                <WidgetActions>
                    <ActionButton variant='contained' color='secondary' title='Save' onClick={onSaveClick}>
                        SAVE
                    </ActionButton>
                </WidgetActions>
            </React.Fragment>
        </WidgetContainer>
    );
};

export default DisplaySettings;
