import DoctrinalTemplate from './DoctrinalTemplate';

/**
 * This class is responsible for creating, serializing, deserializing
 * and transforming doctrinal templates.  This class will be refactored later
 * into a set of standalone helper functions.
 */
class DoctrinalTemplateManager {
    /**
     * Creates a new instance of a doctrinal template.
     */
    createNewTemplate(): DoctrinalTemplate {
        return new DoctrinalTemplate();
    }

    /*
    loadTemplate(): DoctrinalTemplate | undefined {
        return undefined;
    }

    saveTemplate(template: DoctrinalTemplate): void {}

    exportTemplate(template: DoctrinalTemplate): void {}

    previewTemplate(template: DoctrinalTemplate): ImageryLayer | undefined {
        return undefined;
    }

    updatePreview(template: DoctrinalTemplate, layer: ImageryLayer): boolean {
        return false;
    }
    */
}

export default DoctrinalTemplateManager;
