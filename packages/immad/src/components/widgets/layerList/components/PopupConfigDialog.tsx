import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Button,
    ButtonGroup,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControlLabel,
    IconButton,
    ListItemText,
    Menu,
    MenuItem,
    Radio,
    RadioGroup,
    Switch,
    TextField,
} from '@mui/material';
import { FieldGroup, InputField, InputLabel } from '../../../common';
import { RightButton } from '../../../layout/styles';
import TextContent from '@arcgis/core/popup/content/TextContent';
import Content from '@arcgis/core/popup/content/Content';
import { LogHelper } from '../../../../helpers/logHelper';
import FieldsContent from '@arcgis/core/popup/content/FieldsContent';
import PopupTemplate from '@arcgis/core/PopupTemplate';
import FeatureLayer = __esri.FeatureLayer;
import GeoJSONLayer = __esri.GeoJSONLayer;
import CSVLayer = __esri.CSVLayer;
import ImageryLayer = __esri.ImageryLayer;
import ImageryTileLayer = __esri.ImageryTileLayer;
import OGCFeatureLayer = __esri.OGCFeatureLayer;
import PointCloudLayer = __esri.PointCloudLayer;
import StreamLayer = __esri.StreamLayer;
import WFSLayer = __esri.WFSLayer;
import SceneLayer = __esri.SceneLayer;
import FieldInfo = __esri.FieldInfo;
import { useSnackbar } from 'notistack';
import { StyledDiv } from '../styles';
import { StyledButtonGroup } from '../../../tacticalGrid/styles';
import Layer = __esri.Layer;
import BracketsCurlyIcon from 'calcite-ui-icons-react/BracketsCurlyIcon';
import XIcon from 'calcite-ui-icons-react/XIcon';
import PopupFieldsDialog from './PopupFieldsDialog';

/**
 * Layer types that carry the property popup
 */
type PopupSupportedLayer =
    | FeatureLayer
    | CSVLayer
    | GeoJSONLayer
    | ImageryLayer
    | ImageryTileLayer
    | OGCFeatureLayer
    | PointCloudLayer
    | SceneLayer
    | StreamLayer
    | WFSLayer;

type FieldsIndexLayer = Exclude<PopupSupportedLayer, ImageryTileLayer>;

/**
 * Interface to handle callback and input data coming from
 * where the modal dialog is initialized.
 */
interface PopupConfigDialogProps {
    handleClose: () => void;
    handleCancel: () => void;
    layer: Layer;
}

/**
 * Returns the field names for a layer. Includes both RasterFields and standard Fields
 * @param layer
 */
function getFieldNames(layer: PopupSupportedLayer): string[] {
    if (layer) {
        const rasterLayer = layer as ImageryLayer | ImageryTileLayer;
        const fieldsLayer = layer as FieldsIndexLayer;
        const expressionInfos = layer.popupTemplate?.expressionInfos;
        return [
            ...(fieldsLayer?.fields.map((field) => field.name) ?? []),
            ...(rasterLayer?.rasterFields?.map((field) => field.name) ?? []),
            ...(expressionInfos?.map((expressionInfo) => expressionInfo.name) ?? []),
        ];
    } else {
        return [];
    }
}

function ContentControl(props: {
    id: number;
    layer: FieldsIndexLayer;
    content: Content;
    contentChanged: (content: Content, index: number) => void;
    useFieldNameAsDefaultLabel: boolean;
}): JSX.Element {
    const { layer, content, contentChanged, useFieldNameAsDefaultLabel } = props;

    const type = content.type;
    const [fieldLabelsMap, setFieldLabelsMap] = useState<Map<string, string>>(new Map<string, string>());
    const [showFieldsDialog, setShowFieldDialog] = useState(false);
    const fieldAliasMap = useRef<Map<string, string>>(new Map<string, string>());
    createFieldMappings(layer);

    // All field names, including Raster Fields (RawPixelValue, etc.)
    const fieldNames = getFieldNames(layer);

    // Used only for test type
    const [text, setText] = useState<string>('');

    // Represents the configured fields for this control. This is a subset of fieldNames
    const [fields, setFields] = useState<string[]>([]);

    useEffect(() => {
        if (layer) {
            const labelMappings = createFieldLabelMapping(layer, useFieldNameAsDefaultLabel);
            setFieldLabelsMap(labelMappings);
        }
    }, [useFieldNameAsDefaultLabel]);

    useEffect(() => {
        switch (type) {
            case 'text':
                const textContent = content as TextContent;
                setText(textContent.text);
                break;
            case 'fields':
                const fieldsContent = content as FieldsContent;
                if (fieldsContent && fieldsContent.fieldInfos) {
                    setFields(fieldsContent.fieldInfos.map((field) => field.fieldName));
                } else {
                    setFields([]);
                }
                break;
        }
    }, []);

    useEffect(() => {
        try {
            if (type === 'text') {
                const textContent = content as TextContent;
                textContent.text = text;
                contentChanged(textContent, props.id);
            } else if (type === 'fields') {
                const fieldsContent = content as FieldsContent;
                fieldsContent.fieldInfos = fields.map((fieldName: string) => {
                    const updatedOrExistingLabel = fieldLabelsMap.get(fieldName);
                    const fieldAlias = fieldAliasMap?.current.get(fieldName);
                    return {
                        fieldName: fieldName,
                        label: updatedOrExistingLabel ?? (useFieldNameAsDefaultLabel ? fieldName : fieldAlias),
                    } as FieldInfo;
                });

                contentChanged(fieldsContent, props.id);
            }
        } catch (e) {
            console.error('Error retrieving popup content', e);
        }
    }, [text, fields]);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const menuOpen = Boolean(anchorEl);

    const addFieldText = (fieldName: string) => {
        setText((text) => text + ` {${fieldName}} `);
        setAnchorEl(null);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    /** create a field name to field alias name mappings Map
     * @param layer the target fields layer
     */
    function createFieldMappings(layer: FieldsIndexLayer) {
        layer.fields?.forEach((field) => {
            fieldAliasMap.current.set(field.name, field.alias.trim());
        });
    }

    /**
     * Create mappings between field name and the default value to use for the popup which
     * will be a user defined value, alias name, or field name
     * @param fieldsLayer current layer that will use the popup
     * @returns Map<fieldName, fieldLabel>
     */
    function createFieldLabelMapping(fieldsLayer: FieldsIndexLayer, useFieldNames: boolean): Map<string, string> {
        const labelMappings = new Map<string, string>();
        const fieldsContent = content as FieldsContent;
        if (fieldsContent && fieldsContent.fieldInfos) {
            fieldsContent.fieldInfos.map((field) => {
                labelMappings.set(field.fieldName, field.label ?? '');
            });
        }
        fieldsLayer.fields.forEach((field) => {
            const isInMap = labelMappings.has(field.name);
            if (!isInMap) {
                useFieldNames ? labelMappings.set(field.name, field.name) : labelMappings.set(field.name, field.alias);
            }
        });
        return labelMappings;
    }

    /**
     * Handler for the show fields dialog button
     */
    function showFieldsClickHandler() {
        setShowFieldDialog(true);
    }

    /**
     * Callback method passed to the show fields dialog - used for canceling any dialog actions
     */
    function handleCancelFieldsUpdate() {
        setShowFieldDialog(false);
    }

    /**
     * Callback method passed to the show fields dialog - used for updating visible fields
     * @param fieldsToDisplay the list of fields that should be displayed in the popup
     */
    function handleApplyFieldsUpdate(fieldsToDisplay: string[]) {
        setFields([...fieldsToDisplay]);
        setShowFieldDialog(false);
    }

    return (
        <>
            {type === 'fields' && (
                <FieldGroup>
                    <InputLabel>Popup Fields:</InputLabel>
                    <div>
                        {showFieldsDialog && (
                            <>
                                <PopupFieldsDialog
                                    handleCancel={handleCancelFieldsUpdate}
                                    handleApply={handleApplyFieldsUpdate}
                                    selectedFieldNames={fields}
                                    fieldNames={fieldNames}
                                    fieldAliasesMap={fieldAliasMap.current}
                                    fieldLabelsMap={fieldLabelsMap}
                                />
                            </>
                        )}
                    </div>

                    <ButtonGroup>
                        <Button
                            size='small'
                            color='secondary'
                            title='Select fields to display and edit field labels'
                            onClick={showFieldsClickHandler}
                        >
                            Edit Fields & Labels
                        </Button>
                        <Button
                            size='small'
                            color='secondary'
                            title='Select all available fields'
                            onClick={() => {
                                setFields(fieldNames);
                            }}
                        >
                            Select All Fields
                        </Button>
                        <Button
                            size='small'
                            color='secondary'
                            title='Clear all selected fields'
                            onClick={() => {
                                setFields([]);
                            }}
                        >
                            Clear All Fields
                        </Button>
                    </ButtonGroup>
                    <div>{`${fields.length} of ${fieldNames.length} Fields Selected`}</div>
                </FieldGroup>
            )}
            {type === 'text' && (
                <StyledDiv>
                    <TextField
                        variant='outlined'
                        multiline
                        minRows={1}
                        maxRows={6}
                        fullWidth
                        placeholder={'Enter a field expression e.g. {objectid} or {name}'}
                        value={text}
                        onChange={(event) => {
                            setText(event.target.value);
                        }}
                    />
                    <IconButton
                        onClick={(e) => {
                            setAnchorEl(e.currentTarget);
                        }}
                    >
                        <BracketsCurlyIcon size={16} />
                    </IconButton>
                    <Menu open={menuOpen} anchorEl={anchorEl} onClose={handleClose}>
                        {fieldNames.map((fieldName) => {
                            return (
                                <MenuItem key={fieldName} onClick={() => addFieldText(fieldName)} value={fieldName}>
                                    <ListItemText primary={fieldName} />
                                </MenuItem>
                            );
                        })}
                    </Menu>
                </StyledDiv>
            )}
        </>
    );
}

/**
 * Modal Dialog for getting a URL input from the user.
 * @param props RenameLayerDialogProps
 * @constructor
 */
export default function PopupConfigDialog(props: PopupConfigDialogProps): JSX.Element {
    const [open] = useState<boolean>(true);

    const { handleClose, handleCancel, layer } = props;

    const popupSupportedLayer = layer as PopupSupportedLayer;

    const popupTemplateRef = useRef<PopupTemplate | null>();

    const [title, setTitle] = useState<string>('');
    const [contents, setContents] = useState<Content[]>([]);

    const [popupEnabled, setPopupEnabled] = useState<boolean>(popupSupportedLayer.popupEnabled);

    const [lastEditInfoEnabled, setLastEditInfoEnabled] = useState<boolean>(
        popupSupportedLayer.popupTemplate?.lastEditInfoEnabled
    );

    const { enqueueSnackbar } = useSnackbar();

    const fieldsIndexLayer = layer as FieldsIndexLayer;
    const [useFieldNameAsLabel, setUseFieldNameAsLabel] = useState(true);

    useEffect(() => {
        if (popupTemplateRef.current) {
            popupTemplateRef.current.lastEditInfoEnabled = lastEditInfoEnabled;
        }
    }, [lastEditInfoEnabled]);

    useEffect(() => {
        const popupLayer = layer as PopupSupportedLayer;
        if (popupLayer) {
            // Clone the existing template, to support Cancel
            const popupTemplate = popupLayer.popupTemplate?.clone() ?? popupLayer.createPopupTemplate();

            setTitle(popupTemplate.title as string);

            const content = popupTemplate.content as Content[];
            if (content) {
                // Filter only supported content for editing. Currently only supports text and fields
                const supportedContent = content.filter((item) => item.type === 'text' || item.type === 'fields');
                if (supportedContent.length < content.length) {
                    enqueueSnackbar('Some Popup content types could not be displayed.', { variant: 'info' });
                }
                setContents(supportedContent);
            }

            popupTemplateRef.current = popupTemplate;
            setPopupEnabled(popupEnabled);

            // Set additional options
            setLastEditInfoEnabled(popupTemplate.lastEditInfoEnabled);
        }
    }, [layer]);

    const handleCancelClick = () => {
        handleCancel();
    };

    const handleAddExpression = () => {
        setContents((contents) => [...contents, new TextContent({ text: '' })]);
    };

    const handleAddFields = () => {
        setContents((contents) => [...contents, new FieldsContent({ fieldInfos: [] })]);
    };

    useEffect(() => {
        if (popupTemplateRef.current === null) {
            popupTemplateRef.current = new PopupTemplate();
        }
        if (popupTemplateRef.current) {
            popupTemplateRef.current.content = contents;
        }
    }, [contents]);

    useEffect(() => {
        if (popupTemplateRef.current === null) {
            popupTemplateRef.current = new PopupTemplate();
        }
        if (popupTemplateRef.current) {
            popupTemplateRef.current.title = title;
        }
    }, [title]);

    const handleApplyClicked = useCallback(() => {
        try {
            if (popupSupportedLayer.popupTemplate) {
                const content = popupSupportedLayer.popupTemplate.content as Content[];
                // Re-add any content objects (media, etc.) which could not be read in this dialog.
                // This may mess up the popup layout/ordering but it is the best we can do for now.
                if (content) {
                    const unsupportedContent = content.filter((item) => item.type !== 'text' && item.type !== 'fields');

                    if (unsupportedContent && unsupportedContent.length > 0) {
                        const popupTemplate = popupTemplateRef.current;
                        if (popupTemplate) {
                            const currentContent = popupTemplate.content as Content[];
                            if (currentContent) {
                                popupTemplate.content = [ ...currentContent, ...unsupportedContent];
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Error updating popup template.', e);
        }

        popupSupportedLayer.popupTemplate = popupTemplateRef.current as PopupTemplate;
        popupSupportedLayer.popupEnabled = popupEnabled;
        handleClose();
    }, [popupEnabled]);

    const handleContentsChanged = useCallback(
        () => (content: Content, index: number) => {
            setContents((contents) => {
                const newArray = [...contents];
                newArray[index] = content;
                return newArray;
            });
        },
        [setContents]
    );

    const removeContentItem = (index: number) => {
        setContents((content) => [...content.slice(0, index), ...content.slice(index + 1)]);
    };

    /**
     * Handle radio button change event
     * @param evt radio button checked change event
     * @param value button data
     */
    function useAliasOrFieldNameRadioChange(evt: React.ChangeEvent<HTMLInputElement>, value: string) {
        setUseFieldNameAsLabel(value === 'fieldNameAsLabel');
    }

    return (
        <Dialog open={open} onClose={handleClose} aria-labelledby='form-dialog-title'>
            <DialogTitle id='form-dialog-title'>Popup Config Options</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Configure the Popup Template for the Layer by setting a title, selecting displayed fields, and
                    setting expressions.
                </DialogContentText>
                <FieldGroup>
                    <FormControlLabel
                        label={'Enable Popups'}
                        control={
                            <Switch
                                inputProps={{ 'aria-label': 'Enable Popups' }}
                                checked={popupEnabled}
                                onChange={(e) => setPopupEnabled(e.target.checked)}
                            />
                        }
                    />
                </FieldGroup>

                {!popupEnabled && <div>Popups have been disabled for this layer.</div>}

                {popupEnabled && fieldsIndexLayer && (
                    <>
                        <FieldGroup>
                            <FormControlLabel
                                label={'Show Last Edit Info'}
                                control={
                                    <Switch
                                        inputProps={{ 'aria-label': 'Show Last Edit Info' }}
                                        checked={lastEditInfoEnabled}
                                        onChange={(e) => setLastEditInfoEnabled(e.target.checked)}
                                    />
                                }
                            />
                        </FieldGroup>

                        <FieldGroup>
                            <RadioGroup name='fieldLabelRadioButton' onChange={useAliasOrFieldNameRadioChange} row>
                                <FormControlLabel
                                    control={<Radio />}
                                    label='Use Field Name as Default Label'
                                    value='fieldNameAsLabel'
                                    title='Use field name as the default popup label'
                                    checked={useFieldNameAsLabel}
                                ></FormControlLabel>
                                <FormControlLabel
                                    control={<Radio />}
                                    label='Use Alias as Default Label'
                                    value='aliasAsLabel'
                                    title='Use field alias as the default popup label'
                                    checked={!useFieldNameAsLabel}
                                ></FormControlLabel>
                            </RadioGroup>
                        </FieldGroup>

                        <StyledButtonGroup>
                            <Button title='Add' variant='contained' color='primary' onClick={handleAddExpression}>
                                Add Expression
                            </Button>

                            <Button title='Add' variant='contained' color='primary' onClick={handleAddFields}>
                                Add Fields
                            </Button>
                        </StyledButtonGroup>

                        <FieldGroup>
                            <InputLabel>Popup Title:</InputLabel>
                            <InputField
                                variant='outlined'
                                size='small'
                                fullWidth
                                color='secondary'
                                title='Title'
                                value={title}
                                placeholder={'Enter field expressions e.g. {objectid}'}
                                onChange={(event) => setTitle(event.target.value)}
                            />
                        </FieldGroup>
                        {contents &&
                            contents.map((content, index) => {
                                return (
                                    <StyledDiv key={contents.length + '_' + index}>
                                        <ContentControl
                                            id={index}
                                            layer={fieldsIndexLayer}
                                            content={content}
                                            contentChanged={handleContentsChanged}
                                            useFieldNameAsDefaultLabel={useFieldNameAsLabel}
                                        />

                                        <IconButton
                                            title='Remove fields widget from UI'
                                            onClick={() => removeContentItem(index)}
                                        >
                                            <XIcon />
                                        </IconButton>
                                    </StyledDiv>
                                );
                            })}
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <RightButton title='Cancel' variant='contained' color='primary' onClick={handleCancelClick}>
                    Cancel
                </RightButton>
                <RightButton title='Apply' variant='contained' color='secondary' onClick={handleApplyClicked}>
                    Apply
                </RightButton>
            </DialogActions>
        </Dialog>
    );
}
