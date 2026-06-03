import {
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    Checkbox,
    ListItemIcon,
    ListItemText,
    FormControlLabel,
    Typography,
} from '@mui/material';
import React, { SetStateAction, useEffect, useState } from 'react';
import { getMissionIdByTitle, getMissionTacticalGridFieldMap } from '../../../helpers/missionHelper';
import { ActionButton } from '../../common';
import { StyledDialog, StyledBackdrop, StyledArrowBoldRightIcon } from '../styles';
import { useSaveLoadContext } from '../../../contexts/SaveLoad';
import { FieldMapType } from './StratLeadFormElements';

interface FieldMapDialogProps {
    selectedFieldMaps: FieldMapType[];
    setSelectedFieldMaps: React.Dispatch<SetStateAction<FieldMapType[]>>;
    onClose: () => void;
    container?: HTMLElement | null;
    setMissionDefinedFieldMapsFound: React.Dispatch<SetStateAction<boolean>>;
}

const FieldMapDialog = (props: FieldMapDialogProps): JSX.Element => {
    const { onClose, container, selectedFieldMaps, setSelectedFieldMaps, setMissionDefinedFieldMapsFound } = props;
    const [isCheckAll, setIsCheckAll] = useState<boolean>(false);
    const [allFieldMaps, setAllFieldMaps] = useState<FieldMapType[]>([]);
    const saveLoadContext = useSaveLoadContext();

    useEffect(() => {
        initForm();
    }, []);

    useEffect(() => {
        if (selectedFieldMaps.length > 0 && selectedFieldMaps.length === allFieldMaps.length) {
            !isCheckAll && setIsCheckAll(true);
        } else {
            isCheckAll && setIsCheckAll(false);
        }
    }, [allFieldMaps, selectedFieldMaps]);

    const initForm = async () => {
        const selectedMissionId = await getMissionIdByTitle(saveLoadContext.missionSelect);
        if (selectedMissionId) {
            const mappings: any | undefined = await getMissionTacticalGridFieldMap(selectedMissionId);
            const fieldMapArray = mappings ?? [...mappings]; //await getMissionTacticalGridFieldMap(selectedMissionId);
            if (fieldMapArray !== undefined && fieldMapArray.length > 0) {
                // &&
                setAllFieldMaps(
                    fieldMapArray.map((field: any) => {
                        return {
                            systemFieldName: field.systemFieldName as string,
                            tacticalGridFieldName: field.tacticalGridFieldName as string,
                        };
                    })
                );
            } else {
                setAllFieldMaps([...[]]);
                setMissionDefinedFieldMapsFound(false);
            }
        }
    };

    const onAllCheckboxChange = (_event: any) => {
        setIsCheckAll(!isCheckAll);
        allFieldMaps &&
            setSelectedFieldMaps(
                allFieldMaps.map((field) => {
                    return {
                        systemFieldName: field.systemFieldName,
                        tacticalGridFieldName: field.tacticalGridFieldName,
                    };
                })
            );
        if (isCheckAll) {
            setSelectedFieldMaps([]);
        }
    };
    const onCheckboxChange = (event: any) => {
        const { id, name, checked } = event.target;
        selectedFieldMaps &&
            setSelectedFieldMaps([...selectedFieldMaps, { systemFieldName: id, tacticalGridFieldName: name }]);
        if (!checked) {
            selectedFieldMaps && setSelectedFieldMaps(selectedFieldMaps.filter((item) => item.systemFieldName != id));
        }
    };

    return (
        <StyledDialog open={true} container={container} BackdropComponent={StyledBackdrop}>
            <DialogTitle>{'Tactical Grid Field Mapping'}</DialogTitle>
            <DialogContent>
                {allFieldMaps && allFieldMaps.length > 0 ? (
                    <>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    id={'selectAll'}
                                    name={'selectAll'}
                                    checked={isCheckAll}
                                    onChange={onAllCheckboxChange}
                                />
                            }
                            label='Check/Uncheck All'
                        />
                        <List>
                            {allFieldMaps.map((fieldMap, index) => {
                                return (
                                    <ListItem key={index}>
                                        <ListItemIcon>
                                            <Checkbox
                                                id={fieldMap.systemFieldName}
                                                name={fieldMap.tacticalGridFieldName}
                                                checked={selectedFieldMaps?.some(
                                                    (selectedField) =>
                                                        selectedField.systemFieldName === fieldMap.systemFieldName
                                                )}
                                                onChange={onCheckboxChange}
                                            />
                                        </ListItemIcon>
                                        <ListItemText>
                                            {fieldMap.tacticalGridFieldName}
                                            <StyledArrowBoldRightIcon />
                                            {fieldMap.systemFieldName}
                                        </ListItemText>
                                    </ListItem>
                                );
                            })}
                        </List>
                    </>
                ) : (
                    <Typography>No field mappings were defined for this Mission. </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <ActionButton color='secondary' variant='contained' onClick={onClose}>
                    Done
                </ActionButton>
            </DialogActions>
        </StyledDialog>
    );
};
export default FieldMapDialog;
