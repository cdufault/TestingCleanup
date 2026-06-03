// @ts-nocheck
import React, { useEffect, useState } from 'react';
import 'react-quill/dist/quill.snow.css';
import { StyledReactQuill } from './gateStyles';

/**Inputs props to the rich text editor */
interface EditorProp {
    /**data currently saved in the featurelayer before any edits are applied */
    commentDataOnStartup: string;
    /**call this method with any new or edited data added to the editor */
    setUpdatedCommentVal: React.Dispatch<React.SetStateAction<string>>;
    /** whether or not the rich text editor is read-only (defaults to false) */
    isReadOnly?: boolean;
}

/**Rich text editor widget */
function RichTextEditor(props: EditorProp) {
    const { commentDataOnStartup, setUpdatedCommentVal, isReadOnly } = props;
    const [editorTextValue, setEditorTextValue] = useState<string>('');
    const placeholderText = 'Enter a description...';

    /**set any existing comment data into the editor, any changes/additions to the data will be
     * tracked by a state (prop) method the caller passes into this component (setUpdatedCommentVal)
     */
    useEffect(() => {
        setEditorTextValue(commentDataOnStartup);
    }, [commentDataOnStartup]);

    /**
     * Handle editor text changed.
     * @param val new value
     */
    function onTextChanged(val: string) {
        setUpdatedCommentVal(val);
        setEditorTextValue(val);
    }
    const toolbarOptions = [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ size: ['small', false, 'large', 'huge'] }],
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ color: [] }, { background: [] }],
        [{ font: [] }],
        [{ align: [] }],
    ];
    return (
        <StyledReactQuill
            theme='snow'
            value={editorTextValue}
            placeholder={placeholderText}
            readOnly={isReadOnly ?? false}
            onChange={onTextChanged}
            modules={{ toolbar: toolbarOptions }}
        />
    );
}
export default RichTextEditor;
