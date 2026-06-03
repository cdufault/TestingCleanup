import React, { useContext, useEffect, useRef, useState } from 'react';
import { useSnackbar } from 'notistack';
import { IGroup } from '@esri/arcgis-rest-portal';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DoctrinalTemplate from '../../api/DoctrinalTemplate';
import { saveTemplate } from '../../helpers/doctrinalTemplateHelper';
import { ActionButton, WidgetActions, WidgetContainer, WidgetContent, WidgetHeader } from '../../../common';
import { AppContext } from '../../../../contexts/App';
import { SaveLoadContext } from '../../../../contexts/SaveLoad';
import { ConfigHelper } from '../../../../helpers/configHelper';
import { LogHelper } from '../../../../helpers/logHelper';
import { getMissionIdByTitle } from '../../../../helpers/missionHelper';
import {
    findPortalGroupsByTag,
    isItemSharedWithPortalGroup,
    shareItemWithPortalGroup,
    unshareItemWithPortalGroup,
} from '../../../../helpers/portalGroupHelper';

import PortalItem = __esri.PortalItem;

/**
 * Defines the input properties required by the SaveTemplatePage component.
 */
interface SaveTemplatePageProps {
    onCancelClick: () => void;
    onSave: (portalItem: PortalItem) => void;
    templateRef: DoctrinalTemplate;
    portalItemRef?: PortalItem;
}

/**
 * A subcomponent of the DoctrinalTemplateEditor component that provides the
 * ability to set doctrinal template metadata properties prior to saving.
 */
const SaveTemplatePage = (props: SaveTemplatePageProps): JSX.Element => {
    const { onSave, onCancelClick } = props;
    const { missionSelect } = useContext(SaveLoadContext);
    const { portalUser } = useContext(AppContext);
    const { userRoles } = useContext(AppContext);
    const analystGroupId = useRef<string>('');
    const isSharedWithAnalystGroup = useRef<boolean>(false);
    const isSharedWithMissionGroup = useRef<boolean>(false);
    const portalItem = useRef<PortalItem | undefined>(props.portalItemRef);
    const template = useRef<DoctrinalTemplate>(props.templateRef);
    const [description, setDescription] = useState<string>(props.templateRef.description);
    const [disableAnalystSharing, setDisableAnalystSharing] = useState<boolean>(true);
    const [disableContinue, setDisableContinue] = useState<boolean>(true);
    const [hasInvalidTitle, setHasInvalidTitle] = useState<boolean>(true);
    const [missionGroupId, setMissionGroupId] = useState<string>('');
    const [shareWithAnalysts, setShareWithAnalysts] = useState<boolean>(false);
    const [shareWithMission, setShareWithMission] = useState<boolean>(false);
    const [summary, setSummary] = useState<string>(props.templateRef.summary);
    const [templateNameHelperText, setTemplateNameHelperText] = useState<string>('Error: This field is required');
    const [title, setTitle] = useState<string>(props.templateRef.title);
    const [canEditTemplate, setCanEditTemplate] = useState(false);
    const [saveCopy, setSaveCopy] = useState<boolean>(true);
    const { enqueueSnackbar } = useSnackbar();

    const handleSaveClick = async (saveCopy?: boolean) => {
        let message = `${template.current.title} saved.`;
        let messageType: 'default' | 'error' | 'success' | 'warning' | 'info' | undefined = 'info';

        try {
            const item = await saveTemplate(template.current, portalItem.current, saveCopy);
            portalItem.current = item;

            await handleUpdateMissionSharing(item);
            await handleUpdateAnalystSharing(item);

            onSave(item);
        } catch (error) {
            LogHelper.log('Error saving doctrinal template: ' + error, true);
            message = `Failed to save ${template.current.title}.  See console for more information.`;
            messageType = 'error';
        }

        enqueueSnackbar(message, { variant: messageType });
    };

    const handleUpdateMissionSharing = async (item: PortalItem) => {
        if (shareWithMission && !isSharedWithMissionGroup.current) {
            const missionSharingResponse = await shareItemWithPortalGroup(missionGroupId, item.id, undefined, true);
            if (missionSharingResponse.notSharedWith && missionSharingResponse.notSharedWith.length > 0) {
                LogHelper.log('Failed to share the doctrinal template with the mission group.', true);
            }
        } else if (!shareWithMission && isSharedWithMissionGroup.current) {
            const missionUnSharingResponse = await unshareItemWithPortalGroup(missionGroupId, item.id);
            if (missionUnSharingResponse === 'Failed' || missionUnSharingResponse.length > 0) {
                LogHelper.log('Failed to unshare the doctrinal template with the mission group.', true);
            }
        }
    };

    const handleUpdateAnalystSharing = async (item: PortalItem) => {
        if (shareWithAnalysts && !isSharedWithAnalystGroup.current) {
            const analystSharingResponse = await shareItemWithPortalGroup(
                analystGroupId.current,
                item.id,
                undefined,
                true
            );
            if (analystSharingResponse.notSharedWith && analystSharingResponse.notSharedWith.length > 0) {
                LogHelper.log('Failed to share the doctrinal template with the analyst group.', true);
            }
        } else if (!shareWithAnalysts && isSharedWithAnalystGroup.current) {
            const analystUnSharingResponse = await unshareItemWithPortalGroup(analystGroupId.current, item.id);
            if (analystUnSharingResponse === 'Failed' || analystUnSharingResponse.length > 0) {
                LogHelper.log('Failed to unshare the doctrinal template with the analyst group.', true);
            }
        }
    };

    useEffect(() => {
        const appConfig = ConfigHelper.getAppConfig();
        // This sets the initial state of the share with analysts check box.
        findPortalGroupsByTag(appConfig.roles.analyst.tag).then((groupSearchResults) => {
            // If the analyst group id cannot be fetched then the check box is disabled.
            if (!groupSearchResults.success || groupSearchResults.item.length === 0) {
                setDisableAnalystSharing(true);
            } else {
                analystGroupId.current = (groupSearchResults.item[0] as IGroup).id;
                setDisableAnalystSharing(false);

                // If the doctrinal template is associated with portal item then set the
                // checked/unchecked state of the share with analysts checkbox based on the
                // sharing properties of the portal item.
                if (portalItem.current) {
                    isItemSharedWithPortalGroup(analystGroupId.current, portalItem.current.id).then(
                        (isSharedResult) => {
                            // This is a workaround for a bug... isSharedResult should always be true or false
                            // but sometimes it returns undefined.
                            if (isSharedResult === undefined) {
                                isSharedResult = false;
                            }

                            isSharedWithAnalystGroup.current = isSharedResult;
                            setShareWithAnalysts(isSharedResult);
                        }
                    );
                }
            }
        });
        findItemOwner();
    }, []);

    useEffect(() => {
        // When the user changes the current mission update the mission group id.
        setMissionGroupId('');
        getMissionIdByTitle(missionSelect).then((missionId) => {
            if (missionId) {
                setMissionGroupId(missionId);
            } else {
                setMissionGroupId('');
            }
        });
    }, [missionSelect]);

    useEffect(() => {
        // If a mission group id exists and the doctrinal template is associated with a portal
        // item then set the checked/unchecked state of the share with mission checkbox based
        // on the sharing properties of the portal item.
        if (missionGroupId && portalItem.current) {
            isItemSharedWithPortalGroup(missionGroupId, portalItem.current.id).then((isSharedResult) => {
                // This is a workaround for a bug... isSharedResult should always be true or false but sometimes
                // it returns undefined.
                if (isSharedResult === undefined) {
                    isSharedResult = false;
                }
                isSharedWithMissionGroup.current = isSharedResult;
                setShareWithMission(isSharedResult);
            });
        }
    }, [missionGroupId]);

    useEffect(() => {
        template.current.createdBy = portalUser.username;
    }, [portalUser]);

    useEffect(() => {
        template.current.title = title;
        if (template.current.title.length > 0 && hasInvalidTitle) {
            setHasInvalidTitle(false);
            setDisableContinue(false);
            setTemplateNameHelperText('Required');
        } else if (template.current.title.length === 0 && !hasInvalidTitle) {
            setHasInvalidTitle(true);
            setDisableContinue(true);
            setTemplateNameHelperText('Error: This field is required');
        }
        // check if the save function needs to save a copy or update the existing template
        if (template.current.title !== portalItem.current?.title && canEditTemplate) {
            setSaveCopy(false);
        } else {
            setSaveCopy(true);
        }
    }, [title]);

    const findItemOwner = () => {
        if (portalUser.username === portalItem.current?.owner || userRoles.Administrator) {
            setCanEditTemplate(true);
            // check if the save function needs to save a copy or update the existing template
            if (template.current.title !== portalItem.current?.title) {
                setSaveCopy(false);
            } else {
                setSaveCopy(true);
            }
        }
    };

    return (
        <WidgetContainer>
            <WidgetHeader position='static'>
                <Box my={0.5}>Edit Doctrinal Template Properties</Box>
            </WidgetHeader>
            <WidgetContent>
                <Box width='100%' height='100%' display='flex' flexDirection='column' boxSizing='border-box'>
                    <Box mb={1} display='flex' flexDirection='column'>
                        <Typography>Title</Typography>
                        <TextField
                            fullWidth
                            placeholder='Enter a template title...'
                            value={title}
                            variant='outlined'
                            helperText={templateNameHelperText}
                            error={hasInvalidTitle}
                            onChange={(evt) => {
                                setTitle(evt.target.value);
                            }}
                        />
                    </Box>
                    <Box mb={1} display='flex' flexDirection='column'>
                        <Typography>Summary</Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={2}
                            placeholder='Enter a summary...'
                            variant='outlined'
                            value={summary}
                            onChange={(evt) => {
                                setSummary(evt.target.value);
                                template.current.summary = evt.target.value;
                            }}
                        />
                    </Box>
                    <Box mb={1} display='flex' flexDirection='column'>
                        <Typography>Description</Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            placeholder='Enter a description...'
                            variant='outlined'
                            value={description}
                            onChange={(evt) => {
                                setDescription(evt.target.value);
                                template.current.description = evt.target.value;
                            }}
                        />
                    </Box>
                    <Box my={1}>
                        <Typography>
                            Owner: {portalItem.current ? portalItem.current.owner : template.current.createdBy}
                        </Typography>
                    </Box>
                    <Box mt={1}>
                        <FormControlLabel
                            disabled={!missionGroupId}
                            title='Share the template with the Mission group'
                            control={
                                <Checkbox
                                    color={'secondary'}
                                    checked={shareWithMission}
                                    onChange={(evt) => {
                                        setShareWithMission((evt.target as HTMLInputElement).checked);
                                    }}
                                />
                            }
                            label='Share with the mission group'
                        />
                    </Box>
                    <Box mb={1}>
                        <FormControlLabel
                            disabled={disableAnalystSharing}
                            title='Share the template with the all analysts'
                            control={
                                <Checkbox
                                    checked={shareWithAnalysts}
                                    onChange={(evt) => {
                                        setShareWithAnalysts((evt.target as HTMLInputElement).checked);
                                    }}
                                />
                            }
                            label='Share with all analysts'
                        />
                    </Box>
                </Box>
            </WidgetContent>
            <WidgetActions elevation={0}>
                <Box width='100%' display='flex' boxSizing='border-box'>
                    <Box>
                        <ActionButton variant='contained' color='secondary' title='Go back.' onClick={onCancelClick}>
                            CANCEL
                        </ActionButton>
                    </Box>
                    <Box flexGrow={1} />
                    <Box title={disableContinue ? 'The Doctrinal Template must have a Title.' : ''}>
                        <ActionButton
                            variant='contained'
                            color='secondary'
                            disabled={disableContinue}
                            title='Save the template as a copy you own.'
                            onClick={() => {
                                handleSaveClick(saveCopy);
                            }}
                        >
                            SAVE COPY
                        </ActionButton>
                    </Box>
                    <Box
                        title={
                            disableContinue
                                ? 'The Doctrinal Template must have a Title.'
                                : !canEditTemplate
                                ? 'You do not own this item, or you have insufficient permissions to save it.'
                                : ''
                        }
                    >
                        <ActionButton
                            variant='contained'
                            color='secondary'
                            title={'Save the template.'}
                            disabled={disableContinue || !canEditTemplate}
                            onClick={() => {
                                handleSaveClick(saveCopy);
                            }}
                        >
                            SAVE
                        </ActionButton>
                    </Box>
                </Box>
            </WidgetActions>
        </WidgetContainer>
    );
};

export default SaveTemplatePage;
