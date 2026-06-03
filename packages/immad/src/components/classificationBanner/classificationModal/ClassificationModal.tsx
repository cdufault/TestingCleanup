import {
    Alert,
    Autocomplete,
    Dialog,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    Switch,
    TextField, Tooltip,
    Typography,
} from '@mui/material';
import * as React from 'react';
import {useCallback, useEffect, useState} from 'react';
import {
    ClassificationWarning,
    StyledActionButton,
    StyledDialogActionDiv,
    StyledDynamicClassificationToggleDiv,
} from './styles';
import {
    DataGrid, GridCellModes, GridCellModesModel, GridCellParams,
    GridColumns, GridPreProcessEditCellProps,
    GridRenderEditCellParams,
    GridValueGetterParams,
    GridValueSetterParams, useGridApiContext,
} from '@mui/x-data-grid';
import {ClassificationItem} from '../interfaces/ClassificationItem';
import LaunchIcon from 'calcite-ui-icons-react/LaunchIcon';
import {useAppDispatch, useAppSelector} from '../../../hooks/hooks';
import {RootState} from '../../../data/store';
import {setClassificationItems, setIsDynamicClassificationEnabled} from '../ClassificationSlice';
import {ClassificationMarking} from '@stratcom/lib-functions/types/interfaces/Classification';
import {createPortalLink, setManualClassification} from '@stratcom/lib-functions';
import DynamicClassificationToggle from '../../menuBar/components/DynamicClassificationToggle';
import {ClassificationBannerJSONVisitor} from "../../classification/ClassificationBannerJSONVisitor";
import {ClassificationBannerParser} from "../../classification/gen/ClassificationBannerParser";
import {
    ATNSimulator,
    BaseErrorListener,
    CharStream,
    CommonTokenStream,
    RecognitionException,
    Recognizer,
    Token
} from "antlr4ng";
import {ClassificationBannerLexer} from "../../classification/gen/ClassificationBannerLexer";
import XIcon from "calcite-ui-icons-react/XIcon";
import {useSnackbar} from "notistack";
import * as antlr from "antlr4ng";

/**
 * The props interface for the Classification Modal Dialog
 */
export interface ClassificationModalProps {
    /**
     * Represents whether the modal is open.
     */
    open: boolean;

    /**
     * Event handler which executes when the user closes the dialog.
     */
    onClose: () => void;
}


class SyntaxErrorListener extends BaseErrorListener {

    constructor() {
        super();
    }

    syntaxError<S extends Token, T extends ATNSimulator>(recognizer: Recognizer<T>, offendingSymbol: S | null, line: number, column: number, msg: string, e: RecognitionException | null) {
        console.error('Syntax error: ' + offendingSymbol?.text + " msg: " + msg, { variant: 'error' })
    }
}

/*
    ErrorListener used to notify the grid cell with the ANTLR error message.
 */
class GridErrorListener extends BaseErrorListener {

    private readonly params;

    constructor(params : { error?: string }) {
        super();
        this.params = params;
    }

    syntaxError<S extends Token, T extends ATNSimulator>(recognizer: Recognizer<T>, offendingSymbol: S | null, line: number, column: number, msg: string, e: RecognitionException | null) {
        this.params.error = msg;
    }
}


/**
 * Classification Modal dialog which contains a list of classification items and supports manually overriding
 * classifications.
 * @param props The classification modal props
 * @constructor Classification Modal Props constructor
 */
const ClassificationModal = (props: ClassificationModalProps): JSX.Element => {
    const dispatch = useAppDispatch();
    const { open, onClose } = props;
    const classificationItems = useAppSelector((state: RootState) => state.classificationSlice.classificationItems);
    const classificationMarking = useAppSelector((state: RootState) => state.classificationSlice.classificationMarking);
    const classOptions = ['UNCLASSIFIED', 'UNCLASSIFIED//LIMDIS', 'CONFIDENTIAL', 'SECRET', 'TOP SECRET', 'TOP SECRET//SI/TK'];
    const isDynamicClassificationEnabled = useAppSelector(
        (state: RootState) => state.classificationSlice.isDynamicClassificationEnabled
    );
    const [cellModesModel, setCellModesModel] = useState<GridCellModesModel>({});

    const [isEditing, setIsEditing] = useState<boolean>(false);

    const [dynamicClassLabelText, setDynamicClassLabelText] = useState<string>('Dynamic Classification: On');

    const classificationBannerJSONVisitor = new ClassificationBannerJSONVisitor();

    const [syntaxError ,setSyntaxError] = useState<string>();

    const { enqueueSnackbar } = useSnackbar();

    /**
     * Updates cell to edit mode when clicked.
     */
    const handleCellClick = useCallback((params: GridCellParams) => {
        setCellModesModel((prevModel) => {
            return {
                // Revert mode of the other cells from other rows
                ...Object.keys(prevModel).reduce(
                    (acc, id) => ({
                        ...acc,
                        [id]: Object.keys(prevModel[id]).reduce(
                            (acc2, field) => ({
                                ...acc2,
                                [field]: {mode: GridCellModes.View}
                            }),
                            {}
                        )
                    }),
                    {}
                ),
                [params.id]: {
                    // Revert the mode of the other cells in the same row
                    ...Object.keys(prevModel[params.id] || {}).reduce(
                        (acc, field) => ({...acc, [field]: {mode: GridCellModes.View}}),
                        {}
                    ),
                    [params.field]: {mode: GridCellModes.Edit}
                }
            };
        });
    }, []);

    useEffect(() => {
        if (!isDynamicClassificationEnabled) {
            setDynamicClassLabelText('Dynamic Classification: Off');
        } else {
            setDynamicClassLabelText('Dynamic Classification: On');
        }
    }, [isDynamicClassificationEnabled]);

    /**
     * Creates a Dynamic Banner parser for processing classification banner text.
     * @param text
     */
    const getParserForClassificationText = (text: string) : ClassificationBannerParser => {
        const inputStream : CharStream = CharStream.fromString(text);
        const lexer = new ClassificationBannerLexer(inputStream);
        const syntaxErrorListener = new SyntaxErrorListener();
        const tokenStream = new CommonTokenStream(lexer);
        const parser = new ClassificationBannerParser(tokenStream);
        parser.addErrorListener(syntaxErrorListener);
        return parser;
    }

    /**
     * Update the manual classification for the current item.
     * @param classificationValue String value of the new classification value.
     * @param classificationItem Existing classification information for the layer.
     */
    const updateManualClassification = (classificationValue: string | null, classificationItem: ClassificationItem) : boolean => {

        if(classificationValue === null)
        {
            setManualClassification(classificationItem, null).then((updatedItem: ClassificationItem) => {
                const updatedClassificationItems = classificationItems.map((classItem) =>
                    classItem.id === classificationItem.id ? updatedItem : classItem
                );
                dispatch(setClassificationItems(updatedClassificationItems));
                return updatedItem;
            }).catch(e => {
                console.error(e.message, e);
            });
        }
        else {
            const parser = getParserForClassificationText(classificationValue);
            try {
                // parse text
                const classificationBannerLineContext = parser.classificationBannerLine();
                const classificationMarking: ClassificationMarking = classificationBannerJSONVisitor.visitClassificationBannerLine(classificationBannerLineContext);
                if (parser.numberOfSyntaxErrors == 0) {
                    setManualClassification(classificationItem, classificationMarking)
                        .then((updatedItem: ClassificationItem) => {
                            const updatedClassificationItems = classificationItems.map((classItem) =>
                                classItem.id === classificationItem.id ? updatedItem : classItem
                            );
                            dispatch(setClassificationItems(updatedClassificationItems));
                        }).catch(e => {
                        console.error(e.message, e);
                    });
                } else {
                    enqueueSnackbar('There was a syntax error with the classification banner. Check the log for more details.', { variant: 'error' });
                    return false;
                }
            } catch (e) {
                console.error(e.message, e);
            }
        }

        return true;
    };

    /**
     * Checks the syntax of a classification string using ANTRL parser.
     * @param classificationValue The classification string to check
     * @returns A string error with an error message, or null if the syntax is correct
     */
    const checkSyntax = (classificationValue: string) : string => {

        const inputStream : CharStream = CharStream.fromString(classificationValue);
        const lexer = new ClassificationBannerLexer(inputStream);

        const tokenStream = new CommonTokenStream(lexer);
        const parser = new ClassificationBannerParser(tokenStream);

        let params : { error?: string } = { error: '' };

        const gridErrorListener = new GridErrorListener(params);

        parser.addErrorListener(gridErrorListener);
        lexer.addErrorListener(gridErrorListener);

        parser.classificationBannerLine();

        parser.removeErrorListeners();
        lexer.removeErrorListeners();

        return params.error ?? '';
    }

    const columns: GridColumns<ClassificationItem> = [
        {
            field: 'title',
            headerName: 'Layer',
            flex: 1,
            valueGetter: (params: GridValueGetterParams<ClassificationItem>) => params.row.title ?? 'NULL',
            renderCell: (params) => {
                const item = params.row as ClassificationItem;
                const portalHostname = item.portalHostname;
                const portalItemId = item.id;
                return (
                    <div key={item.id}>
                        {params.value}
                        {portalItemId && portalHostname && (
                            <IconButton
                                title={'View Portal Item'}
                                aria-label='View Portal Item'
                                onClick={() => window.open(createPortalLink(portalHostname, portalItemId), '_blank')}
                            >
                                <LaunchIcon size={14} />
                            </IconButton>
                        )}
                    </div>
                );
            },
        },
        {
            field: 'type',
            headerName: 'Type',
            flex: 0.25,
            valueGetter: (params: GridValueGetterParams) => params.row.type ?? 'Layer',
        },
        {
            field: 'classification',
            headerName: 'Classification',
            flex: 0.75,
            editable: true,

            preProcessEditCellProps: (params: GridPreProcessEditCellProps) => {
                let hasError = false;
                setSyntaxError('');

                try {
                    const syntaxError = checkSyntax(params.props.value.toUpperCase());
                    setSyntaxError(syntaxError);
                    hasError = (syntaxError !== '');
                }
                catch(e) {
                    if(e instanceof antlr.RecognitionException) {
                        // Since this calls a parser and exceptions are expected, we mute this exception unless debugging
                        console.debug(e.message);
                    }
                    else {
                        console.error(e.message);
                    }
                }

                return { ...params.props, error: hasError }
            },

            valueParser: (value, params) => {
                if(value) {
                    return value.toUpperCase()
                }
                else {
                    return value;
                }
            },

            valueGetter: (params: GridValueGetterParams) => {
                const classificationItem = params.row as ClassificationItem;
                const marking = classificationItem.manualClassification ?? classificationItem.classification;
                return marking?.banner;
            },

            valueSetter: (params: GridValueSetterParams) => {
                const classificationItem = params.row as ClassificationItem;

                try {
                    updateManualClassification(params.value?.toUpperCase() ?? null, classificationItem);
                }
                catch(e) {
                    console.error(e.message);
                }

                return { ...classificationItem };
            },

            renderCell: params => {
                const apiRef = useGridApiContext();
                const selectCell = () => apiRef.current.setCellMode(params.id, params.field, 'edit');

                if(!params.value)
                    return <Alert onClick={selectCell} style={{width: '100%'}} variant={'outlined'} severity={'warning'}>No Marking Found</Alert>;
                else
                    return <TextField fullWidth  onClick={selectCell} value={params.value} />;
            },

            renderEditCell: (params: GridRenderEditCellParams<any, ClassificationItem>) => {
                const apiRef = useGridApiContext();
                return (
                    <Autocomplete
                        freeSolo
                        openOnFocus={true}
                        selectOnFocus={true}
                        options={classOptions}
                        fullWidth
                        size={'small'}
                        value={params.value || null}
                        renderInput={(classParams) =>
                            <Tooltip title={syntaxError}>
                                <TextField
                                    {...classParams}
                                    autoFocus
                                    focused={isEditing}
                                    error={!!syntaxError}
                                    placeholder={'Type or Select a Classification'}
                                    value={params.value}
                                />
                            </Tooltip>}
                        onFocus={() => {
                            setIsEditing(true);
                        }}
                        onBlur={() => {
                            setIsEditing(false);
                        }}
                        onInputChange={(event, value) => {
                            apiRef.current.setEditCellValue(
                            {
                                id: params.id,
                                field: params.field,
                                value: value
                            });
                        }}

                    />
                );
            },

        },
        {
            field: 'origin',
            headerName: 'Origin',
            flex: 0.25,
            valueGetter: (params: GridValueGetterParams) => {
                const override = params.row.manualClassification;
                if (override) {
                    return 'Manual';
                } else if (params.row.classification) {
                    return 'Portal';
                } else {
                    return 'N/A';
                }
            },
            renderCell: params => {
                if(params.value === 'Manual') {
                    return <div>
                        {params.value}
                        <IconButton
                            title={'Remove Manual Classification'}
                            aria-label='Remove Manual Classification'
                            onClick={() => {
                                const classificationItem = params.row as ClassificationItem;

                                const updatedItem = { ...classificationItem, manualClassification: null } as ClassificationItem;

                                const updatedClassificationItems = classificationItems.map((classItem) =>
                                    classItem.id === classificationItem.id ? updatedItem : classItem
                                );
                                dispatch(setClassificationItems(updatedClassificationItems));
                            }}
                        >
                            <XIcon size={14} />
                        </IconButton>
                        </div>
                }
            }
        },
    ];

    /**
     * Sets global dynamic classification state depending on if dynamic classification is selected on or off
     */
    const toggleDynamicClassification = () => {
        dispatch(setIsDynamicClassificationEnabled(!isDynamicClassificationEnabled));
    };

    const handleCellModesModelChange = useCallback((newModel: GridCellModesModel) => {
        setCellModesModel(newModel);
    }, []);

    return (
        <Dialog onClose={(event, reason) => { if(reason !== "backdropClick") onClose(); }} open={open} maxWidth={'lg'} fullWidth>
            <DialogTitle>Classification Marker Info</DialogTitle>
            <DialogContent>
                <Typography>Double-click on the classification entry to set a manual classification on the item.</Typography>
                {classificationItems && classificationItems.length > 0 && (
                    <DataGrid
                        sx={{ height: '400px' }}
                        autoPageSize
                        rows={classificationItems}
                        columns={columns}
                        cellModesModel={cellModesModel}
                        onCellModesModelChange={handleCellModesModelChange}
                        onCellEditCommit={() => setIsEditing(false)}
                        onCellClick={handleCellClick}
                        onCellEditStart={()=>{
                            setIsEditing(true);
                        }}
                        getRowId={(item) => item.id}
                    />
                )}

                {isDynamicClassificationEnabled ?
                    classificationMarking ? (
                        <Alert variant={'outlined'} severity={'success'}>
                            Calculated Classification: {classificationMarking?.banner}
                        </Alert>
                    ) : (
                        <Alert variant={'outlined'} severity={'warning'}>
                            Dynamic Banner is disabled because one or more items are missing a classification marking.
                        </Alert>
                    ) : <Alert variant={'outlined'} severity={'info'}>Dynamic Banner is set to Off.</Alert>
                }
                <ClassificationWarning>
                    This content is dynamic in nature and may contain elements of information that are not marked in
                    accordance with 32 CFR § 2001.23. This content may not be used as a source of derivative
                    classification; refer instead to the pertinent classification guide(s).
                </ClassificationWarning>
            </DialogContent>

            <StyledDialogActionDiv>
                <div />
                    <StyledDynamicClassificationToggleDiv>
                        <FormControlLabel
                            control={
                                <Switch checked={isDynamicClassificationEnabled} onChange={toggleDynamicClassification} />
                            }
                            label={dynamicClassLabelText}
                        />
                        <DynamicClassificationToggle
                            enabled={isDynamicClassificationEnabled}
                            onClick={toggleDynamicClassification}
                        />
                    </StyledDynamicClassificationToggleDiv>
                <StyledActionButton color='secondary' variant='contained' disabled={isEditing} onClick={onClose} >
                    Close
                </StyledActionButton>
            </StyledDialogActionDiv>
        </Dialog>
    );
};

export default ClassificationModal;
