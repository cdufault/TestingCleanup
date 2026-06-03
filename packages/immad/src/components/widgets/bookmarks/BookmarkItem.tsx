import React, { useEffect, useRef } from 'react';
import {
    StyledBookmarkTypography,
    StyledTextField,
    StyledIconButtonContainer,
    StyledListItemIcon,
    StyledBookmarkHandleBarDiv,
    StyledIconButton,
    StyledBookmarkItemMainDiv,
    StyledCalciteIconWrapperDiv,
} from './styles';
import DragIcon from 'calcite-ui-icons-react/DragIcon';
import RefreshIcon from 'calcite-ui-icons-react/RefreshIcon';
import XIcon from 'calcite-ui-icons-react/XIcon';
import Slide from '@arcgis/core/webscene/Slide';
import { StyledCalciteIcon } from './styles';
import '@esri/calcite-components/dist/components/calcite-icon.js';
import '@esri/calcite-components/dist/calcite/calcite.css';

/**
 * The interface for the BookmarkItem
 */
interface BookmarkItemProps {
    indexValue: number;
    slide: Slide;
    editableItemId: string;
    isDragging: boolean;
    dragHandleProps: any;
    onEdit: (id: string, title: string) => void;
    onGoto: (slideId: string) => void;
    onUpdate: (slideId: string) => void;
    onDelete: (slideId: string) => void;
    editingSlideInfo: { id: string; title: string } | null;
    setEditingSlideTitle: (slide: Slide | null) => void;
    setEditableItemId: (id: string) => void;
}

/**
 * BookmarkItem Component
 *
 * Represents a single bookmark item within the bookmarks list.
 * Provides functionalities such as editing the title, navigating to the bookmark,
 * updating its properties, and deleting it. Includes drag-and-drop support.
 *
 * @param indexValue - The index location of the BookmarkItem in the Bookmark Draggable area.
 * @param slide - The ArcGIS slide object representing the bookmark.
 * @param editableItemId - The ID of the bookmark currently being edited.
 * @param isDragging - Indicates whether the bookmark is being dragged.
 * @param dragHandleProps - Drag handle props provided by the `react-beautiful-dnd` library for drag-and-drop functionality.
 * @param onEdit - Callback to update the bookmark's title. Receives the bookmark ID and the new title as arguments.
 * @param onGoto - Callback to navigate to the bookmark. Receives the bookmark ID as an argument.
 * @param onUpdate - Callback to update the bookmark's view and layers. Receives the bookmark ID as an argument.
 * @param onDelete - Callback to delete the bookmark. Receives the bookmark ID as an argument.
 * @param editingSlideInfo - Object containing the currently editing slide's ID and title.
 * @param setEditingSlideTitle - Function to set the currently editing slide object.
 * @param setEditableItemId - Function to set the ID of the bookmark currently being edited.
 *
 * @returns {JSX.Element} A single bookmark item with drag-and-drop, editing, and action controls.
 *
 * @example
 * <BookmarkItem
 *   slide={slide}
 *   editableItemId={editableItemId}
 *   isDragging={snapshot.isDragging}
 *   dragHandleProps={provided.dragHandleProps}
 *   onEdit={updateBookmarkTitle}
 *   onGoto={gotoBookmark}
 *   onUpdate={updateBookmarkView}
 *   onDelete={deleteBookmark}
 *   editingSlide={editingSlide}
 *   setEditingSlide={setEditingSlide}
 *   setEditableItemId={setEditableItemId}
 * />
 */

const BookmarkItem: React.FC<BookmarkItemProps> = ({
    indexValue,
    slide,
    editableItemId,
    isDragging,
    dragHandleProps,
    onEdit,
    onGoto,
    onUpdate,
    onDelete,
    editingSlideInfo,
    setEditingSlideTitle,
    setEditableItemId,
}): JSX.Element => {
    const textFieldRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = useOutsideClickHandler(
            textFieldRef,
            editableItemId,
            slide.id,
            editingSlideInfo,
            onEdit,
            setEditableItemId
        );

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [editableItemId, editingSlideInfo, onEdit, setEditableItemId, slide.id]);

    /**
     * Creates a handler function to detect and handle clicks outside a specified element.
     *
     * This function checks if a click occurred outside the provided `textFieldRef` element,
     * and if the `editableItemId` matches the current slide ID. If so, it triggers the `onEdit`
     * callback to save the current title and clears the `editableItemId`.
     *
     * @param textFieldRef - Reference to the text field DOM element.
     * @param editableItemId - The ID of the bookmark currently being edited.
     * @param slideId - The ID of the current slide.
     * @param editingSlideInfo - Object containing the current editing slide's ID and title.
     * @param onEdit - Callback function to update the bookmark's title.
     * @param setEditableItemId - Function to clear or update the editable item ID.
     * @returns A handler function for the 'mousedown' event.
     */
    const useOutsideClickHandler = (
        textFieldRef: React.RefObject<HTMLDivElement>,
        editableItemId: string,
        slideId: string,
        editingSlideInfo: { id: string; title: string } | null,
        onEdit: (id: string, title: string) => void,
        setEditableItemId: (id: string) => void
    ) => {
        return (event: MouseEvent) => {
            if (
                textFieldRef.current &&
                !textFieldRef.current.contains(event.target as Node) &&
                editableItemId === slideId
            ) {
                if (editingSlideInfo) {
                    onEdit(editingSlideInfo.id, editingSlideInfo.title.trim());
                }
                setEditableItemId('');
            }
        };
    };

    /**
     * This function ensures that the bookmark title is saved when the text field loses focus.
     * If the title is empty or contains only whitespace, it will be trimmed before saving.
     * The function also clears `editableItemId` to exit editing mode.
     */
    const handleBlur = () => {
        if (editingSlideInfo) {
            onEdit(editingSlideInfo.id, editingSlideInfo.title.trim());
        }
        setEditableItemId('');
    };

    return (
        <StyledBookmarkItemMainDiv
            style={{
                backgroundColor: isDragging ? '#444' : indexValue % 2 === 0 ? '#272c31' : '#333b42',
            }}
            onClick={() => {
                if (editableItemId !== slide.id) {
                    onGoto(slide.id);
                }
            }}
        >
            <StyledBookmarkHandleBarDiv
                {...dragHandleProps}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                <DragIcon />
            </StyledBookmarkHandleBarDiv>
            <StyledIconButtonContainer>
                <StyledIconButton
                    title='Update Bookmark'
                    onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        onUpdate(slide.id);
                    }}
                >
                    <RefreshIcon />
                </StyledIconButton>
                <StyledIconButton
                    title='Delete Bookmark'
                    onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        onDelete(slide.id);
                    }}
                >
                    <XIcon />
                </StyledIconButton>
            </StyledIconButtonContainer>
            <StyledListItemIcon>
                <img src={slide.thumbnail.url} alt={slide.title.text} />
            </StyledListItemIcon>
            {editableItemId === slide.id ? (
                <StyledTextField
                    ref={textFieldRef}
                    variant='outlined'
                    multiline
                    value={editingSlideInfo?.title || ''}
                    onChange={(evt: React.ChangeEvent<HTMLInputElement>) =>
                        setEditingSlideTitle((prev) => (prev ? { ...prev, title: evt.target.value } : null))
                    }
                    onBlur={handleBlur}
                    inputProps={{
                        onKeyDown: (evt: React.KeyboardEvent<HTMLInputElement>) => {
                            if (evt.key === 'Enter') {
                                evt.preventDefault();
                                handleBlur();
                            }
                        },
                    }}
                />
            ) : (
                <StyledBookmarkTypography
                    onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        setEditableItemId(slide.id);
                        setEditingSlideTitle({ id: slide.id, title: slide.title.text });
                    }}
                    align={'center'}
                >
                    {slide?.title?.text.trim() ? (
                        slide.title.text
                    ) : (
                        <StyledCalciteIconWrapperDiv>
                            <StyledCalciteIcon
                                icon='pencil'
                                scale='m'
                                onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    setEditableItemId(slide.id);
                                    setEditingSlideTitle({ id: slide.id, title: slide.title.text });
                                }}
                            />
                        </StyledCalciteIconWrapperDiv>
                    )}
                </StyledBookmarkTypography>
            )}
        </StyledBookmarkItemMainDiv>
    );
};

export default BookmarkItem;
