import Widget from '@arcgis/core/widgets/Widget';
import { tsx as arcgisTsx } from '@arcgis/core/widgets/support/widget';
import MapView from '@arcgis/core/views/MapView';
import SceneView from '@arcgis/core/views/SceneView';

interface ViewSwitcherProps {
    activeView: MapView | SceneView;
    inactiveView: MapView | SceneView;
    onViewChange: (newActiveView: MapView | SceneView, newInactiveView: MapView | SceneView) => void;
}

export default class ViewSwitcher extends Widget {
    private activeView: MapView | SceneView;
    private inactiveView: MapView | SceneView;
    private onViewChange: (newActiveView: MapView | SceneView, newInactiveView: MapView | SceneView) => void;

    constructor(props: ViewSwitcherProps) {
        super();

        this.activeView = props.activeView;
        this.inactiveView = props.inactiveView;
        this.onViewChange = props.onViewChange;
    }

    private switchView(): void {
        if (!this.activeView || !this.inactiveView) return;

        const viewpoint = this.activeView.viewpoint.clone();
        const container = this.activeView.container;
        //@ts-ignore
        this.activeView.container = null; // Detach current view
        this.inactiveView.viewpoint = viewpoint; // Sync viewpoint
        this.inactiveView.container = container; // Attach new view

        // Swap views and trigger callback
        this.onViewChange(this.inactiveView, this.activeView);

        // Force re-render to update label
        this.scheduleRender();
    }

    render() {
        // @ts-ignore
        // still functions just the arcgis support widget types not working correctly
        return arcgisTsx(
            'div',
            {
                class: 'esri-widget--button esri-widget',
                bind: this,
                onclick: this.switchView,
            },
            this.activeView.type === '2d' ? '3D' : '2D'
        );
    }
}
