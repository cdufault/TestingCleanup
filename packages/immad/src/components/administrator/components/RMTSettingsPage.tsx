import React, { useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import { RMTButton, StyledRightButton, StyledHeaderBox, StyledRMTContainer } from '../styles';
import { useSnackbar } from 'notistack';
import { ConfigHelper } from '../../../helpers/configHelper';
import { updatePortalWebApp } from '../../../helpers/portalItemsHelper';
import { PortalAppSettings } from '../../../interfaces/AnalyticsGPTypes';
import { AppConfig } from 'src/interfaces/AppConfig';
import { FieldGroup } from '../../common';
import {
    RMTQueryMetadata,
    RMTCodeTypeQueryMetadata,
    INewtType,
    ICode,
    setRMTData,
    setRMTMessageTable,
} from './AdminSettingsSlice';
import CreateRMTTypesDialog from './CreateRMTTypesDialog';
import { useAppDispatch, useAppSelector } from '../../../hooks/hooks';
import RMTMessageType from './RMTMessageType';
import { PortalItemSelect } from '@stratcom/react-widget-lib';
import { theme } from '../../../styles/theme';
import Portal from '@arcgis/core/portal/Portal';
import PortalItem from '@arcgis/core/portal/PortalItem';

/** UI form for setting RMT feature classes, RMT message types, and RMT code types */
export default function RMTSettingsPage(): JSX.Element {
    const { enqueueSnackbar } = useSnackbar();
    const [appConfig, setAppConfig] = useState<AppConfig>();
    const [isSaveDisabled, setIsSaveDisabled] = useState<boolean>(true);

    const [rmtDataItemsCopy, setRMTDataItemsCopy] = useState<RMTQueryMetadata[]>([]);
    const [canEdit, setCanEdit] = useState(false);
    const [portalAppConfigData, setPortalAppConfigData] = useState<PortalAppSettings | undefined>();
    const [showRMTDialog, setShowRMTDialog] = useState(false);
    const [origAppConfigRMTData, setOrigAppConfigRMTData] = useState<RMTQueryMetadata[] | undefined>();
    const dispatch = useAppDispatch();
    const [hasError, setHasError] = useState(false);
    const [errorText, setErrorText] = useState('');
    const rmtData = useAppSelector((state) => state.adminSettingsSlice.rmtQueryMetadata);
    const messageFeatureTable = useAppSelector((state) => state.adminSettingsSlice.rmtMessageTable);
    type AppReducerFields = keyof PortalAppSettings;
    const actionCreator = (type: AppReducerFields, payload: string) => ({
        type,
        payload,
    });

    useEffect(() => {
        const config = ConfigHelper.getAppConfig();
        setAppConfig(config);
        initialize();
    }, []);

    useEffect(() => {
        if (rmtDataItemsCopy) {
            const sliceCopy = JSON.stringify(rmtDataItemsCopy);
            const rmtSliceData = JSON.parse(sliceCopy);
            dispatch(setRMTData(rmtSliceData));
            rmtDataItemsCopy.length > 0 && canSave();
        }
    }, [rmtDataItemsCopy]);

    /**
     * Retrieve RMT settings from portal app, hydrate the slice, and stash data for rollback if needed
     */
    const initialize = async (): Promise<void> => {
        const appConfigPortal = await ConfigHelper.loadAppConfigFromPortal();
        const stringifiedAppConfigRMTData = JSON.stringify(appConfigPortal.rmtData);
        setPortalAppConfigData(appConfigPortal);
        console.debug('Portal app config data when initialized: ', appConfigPortal);

        if (stringifiedAppConfigRMTData) {
            const RMTDataCopy = JSON.parse(stringifiedAppConfigRMTData);
            setRMTDataItemsCopy(RMTDataCopy);
            setOrigAppConfigRMTData(appConfigPortal.rmtData);
        } else {
            console.debug('No RMT data was found in the portal application');
        }
    };

    /**
     * Ensure that no duplicate types are defined
     */
    const canSave = () => {
        const types = rmtDataItemsCopy.map((item) => item.rmtMessageType);
        const uniqueItems = new Set(types);
        const uniqueTypes = Array.from(uniqueItems);
        if (types.length > 0 && types.length !== uniqueTypes.length) {
            setErrorText('Only one instance of a type can be defined.');
            setHasError(true);
            return;
        }
        setErrorText('');
        setHasError(false);
    };

    /**
     * Handle Save button clicked.
     */
    const saveButtonClicked = async function () {
        setIsSaveDisabled(true);
        setCanEdit(false);

        if (portalAppConfigData) {
            if (rmtData) {
                delete portalAppConfigData.rmtData;
                portalAppConfigData.rmtData = rmtData;
            } else {
                console.debug('No RMTMessage data was found that could be saved.');
            }
            if (messageFeatureTable) {
                delete portalAppConfigData.rmtMessageTableId;
                portalAppConfigData.rmtMessageTableId = messageFeatureTable;
            } else {
                console.debug('No RMTMessage table was found that could be saved.');
                enqueueSnackbar('RMT Message Table must be set for the Message Log widget to function properly.', {
                    variant: 'warning',
                    persist: true,
                });
            }
        }

        console.debug('Portal app data that will be saved: ', portalAppConfigData);
        const result = await updatePortalWebApp(
            appConfig ? appConfig.portalConfigItemId : '',
            JSON.stringify(portalAppConfigData)
        );
        if (result.success) {
            enqueueSnackbar('RMT Settings have been saved!', { variant: 'success' });
        } else {
            console.error('The RMT settings were NOT saved.');
            enqueueSnackbar('Error occurred updating RMT Settings. See console logs for more details.', {
                variant: 'error',
            });
        }
        initialize();
    };

    /**
     * Handle Edit button clicked.
     */
    const editButtonClicked = function () {
        setIsSaveDisabled(false);
        setCanEdit(true);
    };

    /**
     * Handle Cancel button clicked.
     * Reset the original data back into the UI
     */
    const cancelButtonClicked = async function () {
        const origRMTData = origAppConfigRMTData && JSON.stringify(origAppConfigRMTData);
        if (origRMTData) {
            const origData = JSON.parse(origRMTData);
            setRMTDataItemsCopy(origData);
        } else {
            setRMTDataItemsCopy([]);
        }
        setIsSaveDisabled(true);
        setCanEdit(false);
        initialize();
    };

    /**
     * Handler for the remove message item click event
     * @param rmtMessageType type of rmt message to be removed
     */
    const removeMessageTypeClickHandler = (rmtMessageType: string) => {
        const temp = [...rmtDataItemsCopy];
        const index = temp.findIndex((mType) => mType.rmtMessageType === rmtMessageType);
        index !== -1 && temp.splice(index, 1);
        setRMTDataItemsCopy([...temp]);
    };

    /**
     * Cancel button handler
     */
    const cancelDefineRMTSettingsDialog = () => {
        setShowRMTDialog(false);
    };

    /**
     * Get all the RMT message types defined in the app config json for RMT data
     * @returns string array of type names
     */
    const getAllMessageTypes = (): string[] => {
        const types: string[] = [];
        //get mission messages from config file
        const messages = appConfig?.missionMessages;
        if (messages) {
            messages.forEach((item) => types.push(item.rmtType));
        }
        return types;
    };

    /**
     * Apply button handler
     * @param messageType type of message incoming to search
     */
    const applyDefineRMTSettingsDialog = (messageType: string) => {
        setShowRMTDialog(false);
        //get this type from the config file definitions
        const missionMessagesFromConfig = appConfig?.missionMessages;
        const selectedType = missionMessagesFromConfig?.find((data: INewtType) => data.rmtType === messageType);
        if (selectedType) {
            configureCurrentRMTType(selectedType.codes, selectedType?.rmtType);
        } else {
            console.error(`Message type: ${messageType} was not found in the application config file.`);
        }
    };

    /**
     * Set the props on the RMT type selected for editing
     * @param newtCodes array of ICode objects
     * @param messageTypeHeader header for the type
     */
    const configureCurrentRMTType = (newtCodes: ICode[], messageTypeHeader: string) => {
        const cats: RMTCodeTypeQueryMetadata[] = [];
        newtCodes.map((code) => {
            const qFieldLabelsArray = code.queryLabels.map((label: string) => {
                return {
                    label: label,
                    selectedFieldObj: { name: '', codeAlias: '', fieldType: '' },
                };
            });
            cats.push({
                newtCode: code.type.trim(),
                codeAlias: code.codeAlias,
                //when editing existing items is supported this will need to be set to a valid value
                portalItemId: '',
                id: '-1',
                queryFields: qFieldLabelsArray ?? [
                    { label: '', selectedFieldObj: { name: '', codeAlias: '', fieldType: '' } },
                ],
            });
        });

        const newItem = { rmtMessageType: messageTypeHeader, codeTypes: cats, actionPhrase: '' };
        if (rmtDataItemsCopy) {
            setRMTDataItemsCopy((items) => [...items, newItem]);
        } else {
            setRMTDataItemsCopy([newItem]);
        }
    };

    /**
     * Add new RMT type button click handler
     */
    const addNewTypeClickHandler = () => {
        setShowRMTDialog(true);
    };

    /**
     * Change handler for the portal item select element; changing mission message table portal item reference
     * @param item new portal item that the mission messages will be stored in
     */
    async function onPortalItemSelectChanged(item: PortalItem | null) {
        if (item) {
            dispatch(actionCreator('rmtMessageTableId', item?.id ?? ''));
            dispatch(setRMTMessageTable(item?.id));
        } else {
            dispatch(actionCreator('rmtMessageTableId', ''));
            dispatch(setRMTMessageTable(''));
        }
    }

    return (
        <>
            {showRMTDialog ? (
                <CreateRMTTypesDialog
                    onCancel={cancelDefineRMTSettingsDialog}
                    onApply={applyDefineRMTSettingsDialog}
                    rmtMessageTypes={getAllMessageTypes()}
                />
            ) : (
                <StyledRMTContainer>
                    <StyledHeaderBox>
                        <Typography variant='h4' gutterBottom={true}>
                            Record Message Traffic Settings
                            {errorText !== '' && (
                                <Typography color='error' gutterBottom={true}>
                                    {errorText}
                                </Typography>
                            )}
                            {isSaveDisabled ? (
                                <StyledRightButton variant='contained' color='secondary' onClick={editButtonClicked}>
                                    Edit
                                </StyledRightButton>
                            ) : (
                                <>
                                    <StyledRightButton
                                        variant='contained'
                                        color='secondary'
                                        type='submit'
                                        disabled={hasError}
                                        onClick={saveButtonClicked}
                                    >
                                        Save
                                    </StyledRightButton>
                                    <StyledRightButton
                                        variant='contained'
                                        color='primary'
                                        onClick={cancelButtonClicked}
                                        title={'Cancel edits.'}
                                    >
                                        Cancel
                                    </StyledRightButton>
                                </>
                            )}
                        </Typography>
                    </StyledHeaderBox>

                    <FieldGroup>
                        <PortalItemSelect
                            theme={theme}
                            portal={Portal.getDefault() as Portal}
                            label={'RMT Message Table'}
                            disabled={isSaveDisabled}
                            query={"type: 'feature'"}
                            portalItemID={messageFeatureTable}
                            onItemChange={onPortalItemSelectChanged}
                        />
                    </FieldGroup>

                    <FieldGroup>
                        {canEdit && (
                            <RMTButton title='Add' variant='contained' color='primary' onClick={addNewTypeClickHandler}>
                                Add New RMT Message Type
                            </RMTButton>
                        )}

                        {rmtDataItemsCopy && rmtDataItemsCopy.length > 0
                            ? rmtDataItemsCopy.map((item: RMTQueryMetadata) => (
                                  <RMTMessageType
                                      messageType={item.rmtMessageType}
                                      canEdit={canEdit}
                                      removeMessage={removeMessageTypeClickHandler}
                                  />
                              ))
                            : !canEdit && (
                                  <Typography variant='h6' gutterBottom={true}>
                                      No RMT settings were found. Click Edit to display the Add New Item button.
                                  </Typography>
                              )}
                    </FieldGroup>
                </StyledRMTContainer>
            )}
        </>
    );
}
