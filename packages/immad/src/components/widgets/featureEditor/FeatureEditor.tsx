import React, { useContext, useEffect, useState, useRef } from 'react';
import Editor from '@arcgis/core/widgets/Editor';
import { MapContext } from '../../../contexts/Map';
import MapView from '@arcgis/core/views/MapView';
import SceneView from '@arcgis/core/views/SceneView';
import { Box, Typography } from '@mui/material';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { StyledEditorWidgetContainer, StyledWarningBox } from './styles';
import { useAppSelector } from '../../../hooks/hooks';

function FeatureEditor(): JSX.Element {
    const [view, setView] = useState<SceneView | MapView>();
    const [warning, setWarning] = useState<string>();

    const editorRef = useRef<Editor>(null);
    const { mapView, sceneView, setActiveEditor } = useContext(MapContext);
    const activeView = useAppSelector((state) => state.webMapViewSlice.activeView);
    const [editableLayers, setEditableLayers] = useState<FeatureLayer[]>();
    const editorDivRef = useRef<HTMLDivElement>();

    const layerViewCreateHandleRef = useRef<IHandle>();
    const layerViewDestroyHandleRef = useRef<IHandle>();
    const viewTypeRef = useRef('');

    /**[] */
    useEffect(() => {
        return () => {
            cleanUp();
        };
    }, []);

    useEffect(() => {
        if (activeView === 'MAP' && mapView) {
            setView(mapView);
        } else if (sceneView) {
            setView(sceneView);
        }
    }, [activeView, mapView, sceneView]);

    /**view, editorDivRef.current */
    useEffect(() => {
        if (!view || !editorDivRef.current) return;

        // If there's an editor already, and view type changed — destroy and recreate
        const currentViewType = view.type;
        const previousViewType = viewTypeRef.current;

        const viewHasChanged = currentViewType !== previousViewType;

        if (editorRef.current && viewHasChanged) {
            editorRef.current.destroy();
            editorRef.current = null;
            setActiveEditor(undefined);
        }

        // Always update viewTypeRef
        viewTypeRef.current = currentViewType;

        // (Re)create editor only if needed
        if (!editorRef.current && editorDivRef.current && view) {
            createEditor();
        } else if (editorRef.current && !viewHasChanged) {
            // If same view type, just update the view
            resetEditor();
        }

        // Update editable layers and listeners
        setEditableFtrLayersInView();

        layerViewCreateHandleRef.current?.remove();
        layerViewDestroyHandleRef.current?.remove();

        layerViewCreateHandleRef.current = view.on('layerview-create', (event) => {
            if (event.layer.type === 'feature') {
                setEditableFtrLayersInView();
            }
        });

        layerViewDestroyHandleRef.current = view.on('layerview-destroy', (event) => {
            if (event.layer.type === 'feature') {
                setEditableFtrLayersInView();
            }
        });

        // Cleanup on unmount or view change
        return () => {
            layerViewCreateHandleRef.current?.remove();
            layerViewDestroyHandleRef.current?.remove();
        };
    }, [view, editorDivRef.current]);

    /**editableLayers */
    useEffect(() => {
        //repaint ui when layers are updated
        const warningStr = editableLayers && editableLayers.length < 1 ? 'No editable layers were found.' : undefined;
        setWarning(warningStr);
    }, [editableLayers]);

    /**
     * Remove items when user closes the tab
     */
    async function cleanUp() {
        layerViewDestroyHandleRef.current && layerViewDestroyHandleRef.current.remove();
        layerViewCreateHandleRef.current && layerViewCreateHandleRef.current.remove();
        if (editorRef.current) {
            try {
                await editorRef.current.cancelWorkflow();
            } catch (e) {
                console.warn('Editor cancelWorkflow failed:', e);
            }
            editorRef.current.destroy();
            editorRef.current = null;
        }
    }

    /**
     * Get all the editable feature layers in the view
     */
    function setEditableFtrLayersInView() {
        if (!view) {
            return;
        }

        const ftrLayers: FeatureLayer[] = [];

        view.map.allLayers.forEach((lyr) => {
            if (lyr.type === 'feature' && (lyr as FeatureLayer).capabilities?.operations.supportsEditing === true) {
                ftrLayers.push(lyr as FeatureLayer);
            }
        });
        setEditableLayers(ftrLayers);
    }

    /**
     * Change view on widget when the view switches
     */
    function resetEditor() {
        if (editorRef.current && view) {
            editorRef.current.view = view;
        }
    }

    /**
     * Create the editor widget
     */
    function createEditor() {
        if (!view || !editorDivRef.current) return;

        const editor = new Editor({
            view: view,
            container: editorDivRef.current,
        });
        editorRef.current = editor;
        setActiveEditor(editor);
    }

    return (
        <StyledEditorWidgetContainer>
            {warning && (
                <StyledWarningBox>
                    <Typography variant='h6' color='error' align='center'>
                        {warning}
                    </Typography>
                </StyledWarningBox>
            )}
            <Box ref={editorDivRef} key={view?.type}></Box>
        </StyledEditorWidgetContainer>
    );
}

export default FeatureEditor;
