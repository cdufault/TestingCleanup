import React, { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import '../Share/RichTextEditorViewerStyles.css';
import 'react-quill/dist/quill.snow.css';

interface EditorPropViewer {
    /**data currently saved in the featurelayer before any edits are applied */
    viewerData: string;
}
function RichTextEditorViewer(props: EditorPropViewer) {
    const { viewerData } = props;
    const [editorTextValue, setEditorTextValue] = useState<string>('');

    useEffect(() => {
        setEditorTextValue(viewerData ? viewerData : '');
    }, [viewerData]);

    /*
        ts-ignore added to eliminate this message:
            ReactQuill' cannot be used as a JSX component.
            Its type 'typeof ReactQuill' is not a valid JSX element type.
            Types of construct signatures are incompatible.
    */
    // @ts-ignore
    return <ReactQuill theme='bubble' value={editorTextValue} readOnly={true} />;
}
export default RichTextEditorViewer;
