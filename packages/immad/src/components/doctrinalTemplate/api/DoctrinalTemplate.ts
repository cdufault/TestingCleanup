import Rule from './Rule';
import { DataSource } from './DataSources';
import { RasterFunctionTemplatePropertySet, RasterFunctionVariable } from './RasterFunctionTemplate';
import { createRule, repairRule } from '../helpers/ruleHelper';
import Map = __esri.Map;

/**
 * This enumeration defines what analysis mode is used to link rules together for a doctrinal
 * template.  The 'All' mode links rules with boolean 'and' operations.  The 'Any' mode links
 * rules with boolean 'or' operations.  'WeightedSum' mode multiplies each rule by a user
 * supplied factor then links rules together with plus operations.
 */
export enum DoctrinalTemplateAnalysisMode {
    All = 'All',
    Any = 'Any',
    WeightedSum = 'Weighted',
}

/**
 * An extension of the RasterFunctionTemplatePropertySet type with a 'Template'
 * property added to store a serialized DoctrinalTemplateProps
 */
export interface DoctrinalTemplatePropertySet extends RasterFunctionTemplatePropertySet {
    Template: RasterFunctionVariable<DoctrinalTemplateProps>;
}

/**
 * Interface representing the serializable properties of a doctrinal template.
 */
export interface DoctrinalTemplateProps {
    createdBy: string;
    description: string;
    mode: DoctrinalTemplateAnalysisMode;
    rules: Rule[];
    summary: string;
    title: string;
}

/**
 * Class represnting the business logic state of a doctrinal template.
 */
class DoctrinalTemplate {
    private ruleCounter: number;
    createdBy: string;
    description: string;
    mode: DoctrinalTemplateAnalysisMode;
    rules: Rule[];
    summary: string;
    title: string;

    /**
     * Initialize an empty doctrinal template.
     */
    constructor() {
        this.ruleCounter = 0;
        this.createdBy = '';
        this.description = '';
        this.mode = DoctrinalTemplateAnalysisMode.All;
        this.rules = [];
        this.summary = '';
        this.title = 'New Doctrinal Template';
    }

    /**
     * Create a new rule.  The rule is not added to the doctrinal template.  This method
     * guarantees that the rule id is unique within the scope of the doctrinal template
     * that created it.
     *
     * @param dataSource The data source the rule will be based on.
     * @param alias A name alias for the rule.  Defaults to 'Rule # - Datasource alias'
     * @param description A description of the rule.
     * @returns a new rule.  This rule is not added to the doctrinal template.
     */
    createRule(dataSource: DataSource, alias?: string, description?: string): Rule {
        this.ruleCounter++;

        return createRule(dataSource, this.ruleCounter, alias, description);
    }

    /**
     * Remove a rule from a doctrinal template.
     * @param rule The rule beign removed.
     * @returns returns the index of rule that was removed or -1 if the rule was not found.
     */
    removeRule(rule: Rule): number {
        const index = this.rules.findIndex((ruleElement) => {
            return ruleElement.id === rule.id;
        });

        if (index >= 0) {
            this.rules.splice(index, 1);
        }

        return index;
    }

    /**
     * Generates a serializable version of this doctrinal template.
     */
    toJson(): DoctrinalTemplateProps {
        return {
            createdBy: this.createdBy,
            description: this.description,
            mode: this.mode,
            rules: this.rules,
            summary: this.summary,
            title: this.title,
        } as DoctrinalTemplateProps;
    }

    static fromJson(templateProps: DoctrinalTemplateProps, map?: Map): DoctrinalTemplate {
        const template = new DoctrinalTemplate();
        template.createdBy = templateProps.createdBy;
        template.description = templateProps.description;
        template.mode = templateProps.mode;
        template.rules = templateProps.rules;
        template.summary = templateProps.summary;
        template.title = templateProps.title;

        // Syncronize the rule counter so the next rule gets the proper index.
        const ruleIndices = template.rules.map((rule) => {
            return rule.id;
        });
        template.ruleCounter = Math.max(...ruleIndices);
        template.ruleCounter++;

        template.rules.map((rule) => {
            return repairRule(rule, map);
        });

        return template;
    }
}

export default DoctrinalTemplate;
