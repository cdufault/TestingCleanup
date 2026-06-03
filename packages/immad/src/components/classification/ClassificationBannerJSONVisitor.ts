import {AbstractParseTreeVisitor} from "antlr4ng";
import {ClassificationMarking} from "@stratcom/lib-functions/types/interfaces/Classification";
import {ClassificationBannerParserVisitor} from "./gen/ClassificationBannerParserVisitor";
import {
    AeaMarkingsContext,
    ClassificationBannerLineContext,
    ClassificationMarkingContext, CuiNonIcDcmContext,
    DisseminationControlContext,
    DisseminationControlsContext,
    FgiCountryListContext,
    FgiMarkingsContext, NonIcDisseminationControlContext, NonIcDisseminationControlsContext,
    SapMarkingsContext,
    SapProgramIdentifiersContext,
    SciControlSystemContext,
    UnclassifiedBannerLineContext,
    UnitedStatesBannerLineContext
} from "./gen/ClassificationBannerParser";
import {
    CuiBannerLineContext,
    CuiCategoryMarkingContext,
    CuiCategoryMarkingsContext,
    CuiDisseminationOptionContext,
    CuiDisseminationOptionsContext,
    CuiLabelContext,
    CuiNonIcDcmsContext,
    CuiSpecifiedCategoryMarkingContext,
    CuiSpecifiedCategoryMarkingsContext,
    RelToDisseminationOptionContext,
    UnclassCuiLabelContext, UnclassDisseminationOptionContext, UnclassDisseminationOptionsContext
} from "./gen/CUIBannerParser";
import {CUIBannerParserVisitor} from "./gen/CUIBannerParserVisitor";

/**
 * Given an input ClassificationBanner context tree, this visitor outputs Portal Classification Tool Marking matching the banner.
 */
export class ClassificationBannerJSONVisitor
    extends AbstractParseTreeVisitor<ClassificationMarking>
    implements ClassificationBannerParserVisitor<ClassificationMarking>,
        CUIBannerParserVisitor<ClassificationMarking>
{

    /**
     * Returns the default result for the visitor.
     * @protected
     */
    protected defaultResult(): ClassificationMarking | null {
        return {
            classification: '',
            banner: '',
            disseminationOptions: [],
            aeaOptions: [],
            fgiOptions: [],
            relToOptions: [],
            sapOptions: [],
            sciOptions: [],
        } as ClassificationMarking;
    }


    /**
     * Aggregates multiple results to build up an output result.
     * @param aggregate The current aggregated result
     * @param nextResult The next result to be aggregated
     * @returns ClassificationMarking The aggregation of the two input parameter markings.
     * @protected
     */
    protected aggregateResult(aggregate: ClassificationMarking, nextResult: ClassificationMarking): ClassificationMarking {
        return {
            ...aggregate,
            ...nextResult,
            banner: aggregate.banner + nextResult.banner,
            classification: aggregate.classification + nextResult.classification,
            aeaOptions: [...(aggregate.aeaOptions ?? []), ...(nextResult.aeaOptions ?? [])],
            fgiOptions: [...(aggregate.fgiOptions ?? []), ...(nextResult.fgiOptions ?? [])],
            sapOptions: [...(aggregate.sapOptions ?? []), ...(nextResult.sapOptions ?? [])],
            sciOptions: [...(aggregate.sciOptions ?? []), ...(nextResult.sciOptions ?? [])],
            relToOptions: [...(aggregate.relToOptions ?? []), ...(nextResult.relToOptions ?? [])],
            disseminationOptions: [...(aggregate.disseminationOptions ?? []), ...(nextResult.disseminationOptions ?? [])],
        }
    }

    visitClassificationBannerLine(ctx: ClassificationBannerLineContext): ClassificationMarking {
        const classification = this.visitChildren(ctx);
        if(classification) {
            classification.banner = ctx.getText().replaceAll('<EOF>', '');
            return classification;
        }
        else {
            return this.defaultResult() as ClassificationMarking;
        }
    }

    visitCuiBannerLine(ctx: CuiBannerLineContext): ClassificationMarking {
        return this.visitChildren(ctx) as ClassificationMarking;
    }

    visitCuiDisseminationOptions(ctx: CuiDisseminationOptionsContext): ClassificationMarking {
        return this.visitChildren(ctx) as ClassificationMarking;
    }

    visitUnclassDisseminationOptions(ctx: UnclassDisseminationOptionsContext): ClassificationMarking {
        return this.visitChildren(ctx) as ClassificationMarking;
    }

    visitUnclassDisseminationOption(ctx: UnclassDisseminationOptionContext): ClassificationMarking {
        const classificationMarking = {  ...this.defaultResult(), ...this.visitChildren(ctx) } as ClassificationMarking;
        classificationMarking.disseminationOptions = [ ...(classificationMarking.disseminationOptions ?? []), ctx.getText()];
        return classificationMarking;
    }


    visitCuiDisseminationOption(ctx: CuiDisseminationOptionContext): ClassificationMarking {
        const classificationMarking = {  ...this.defaultResult(), ...this.visitChildren(ctx) } as ClassificationMarking;
        classificationMarking.disseminationOptions = [ ...(classificationMarking.disseminationOptions ?? []), ctx.getText()];
        return classificationMarking;
    }

    visitUnclassCuiLabel(ctx: UnclassCuiLabelContext): ClassificationMarking {
        const classificationMarking = this.visitChildren(ctx) as ClassificationMarking;
        classificationMarking.classification = ctx.UNCLASSIFIED().getText();
        return classificationMarking;
    }

    visitCuiCategoryMarking(ctx: CuiCategoryMarkingContext): ClassificationMarking {
        const categoryMarking = ctx.CUI_CATEGORY_MARKING();
        return {
            ...this.defaultResult(),
            disseminationOptions: categoryMarking? [ categoryMarking?.getText() ] : []
        } as ClassificationMarking;
    }

    visitCuiCategoryMarkings(ctx: CuiCategoryMarkingsContext): ClassificationMarking {
        return this.visitChildren(ctx) as ClassificationMarking;
    }

    visitCuiSpecifiedCategoryMarking(ctx: CuiSpecifiedCategoryMarkingContext): ClassificationMarking {
        const categoryMarking = ctx.CUI_SPECIFIED_MARKING();
        return {
            ...this.defaultResult(),
            disseminationOptions: categoryMarking? [ categoryMarking?.getText() ] : []
        } as ClassificationMarking;
    }

    visitCuiSpecifiedCategoryMarkings(ctx: CuiSpecifiedCategoryMarkingsContext): ClassificationMarking {
        return this.visitChildren(ctx) as ClassificationMarking;
    }


    visitCuiLabel(ctx: CuiLabelContext): ClassificationMarking {
        const classificationMarking = this.visitChildren(ctx) as ClassificationMarking;
        classificationMarking.classification = 'CUI';
        return classificationMarking;
    }

    visitUnitedStatesBannerLine(ctx: UnitedStatesBannerLineContext): ClassificationMarking {
        return this.visitChildren(ctx) as ClassificationMarking;
    }


    visitUnclassifiedBannerLine(ctx: UnclassifiedBannerLineContext): ClassificationMarking {
        const classificationMarking = this.visitChildren(ctx) as ClassificationMarking;
        classificationMarking.classification = ctx.getText().replaceAll('<EOF>', '');
        return classificationMarking;
    }

    visitClassificationMarking(ctx: ClassificationMarkingContext): ClassificationMarking {
        const classificationMarking = this.visitChildren(ctx) as ClassificationMarking;
        classificationMarking.classification = ctx.getText().replaceAll('<EOF>', '');
        return classificationMarking;
    }


    visitRelToDisseminationOption(ctx: RelToDisseminationOptionContext): ClassificationMarking {
        const entityList = ctx.usaFirstCountryOrEntityList();
        if(entityList) {
            let relToOptions: string[] = [];

            const usa = entityList.COUNTRY_CODE_USA();
            if(usa) {
                const usaText = usa.getText();
                if(usaText) {
                    relToOptions.push(usaText);
                }
            }

            const authorizedEntities = entityList.authorizedEntity();
            for (let authorizedEntity of authorizedEntities) {
                const entityText = authorizedEntity.getText();
                if(entityText) {
                    relToOptions.push(entityText);
                }
            }

            const terminalNodes = entityList.COUNTRY_CODE();
            const countryCodes: string[] = terminalNodes.map(node => node.getText()).filter(text => text !== null);
            relToOptions.push( ...countryCodes );

            return {
                ...this.visitChildren(ctx),
                relToOptions: relToOptions
            } as ClassificationMarking;
        }
        return this.defaultResult() as ClassificationMarking;
    }

    visitCuiNonIcDcms(ctx: CuiNonIcDcmsContext): ClassificationMarking {
        return this.visitChildren(ctx) as ClassificationMarking;
    }

    visitCuiNonIcDcm(ctx: CuiNonIcDcmContext): ClassificationMarking {
        const symbol = ctx.LIMDIS() ?? ctx.EXDIS() ?? ctx.NODIS() ??  ctx.SBU() ?? ctx.SBU_NOFORN()
                                                     ?? ctx.LES() ?? ctx.LES_NOFORN() ?? ctx.SSI();
        return {
            ...this.defaultResult(),
            disseminationOptions: (symbol ? [ symbol.getText() ] : [])
        } as ClassificationMarking;
    }

    visitNonIcDisseminationControl(ctx: NonIcDisseminationControlContext): ClassificationMarking {
        const symbol = ctx.LIMDIS() ?? ctx.EXDIS() ?? ctx.NODIS() ??  ctx.SBU_NOFORN()
                                                     ?? ctx.LES() ?? ctx.LES_NOFORN() ?? ctx.SSI();
        return {
            ...this.defaultResult(),
            disseminationOptions: (symbol ? [ symbol.getText() ] : [])
        } as ClassificationMarking;
    }


    visitNonIcDisseminationControls(ctx: NonIcDisseminationControlsContext): ClassificationMarking {
        return this.visitChildren(ctx) as ClassificationMarking;
    }

    visitDisseminationControls(ctx: DisseminationControlsContext): ClassificationMarking {
        return this.visitChildren(ctx) as ClassificationMarking;
    }

    visitDisseminationControl(ctx: DisseminationControlContext): ClassificationMarking {
        const relToDisseminationOption = ctx.relToDisseminationOption();
        if(relToDisseminationOption) {
            return this.visit(relToDisseminationOption) as ClassificationMarking;
        }

        // NOTE: skipping displayOnlyDisseminationOptions() as it is not represented in PCT JSON
        const displayOnlyDisseminationOption = ctx.displayOnlyDisseminationOption();
        if(displayOnlyDisseminationOption) {
            return this.visit(displayOnlyDisseminationOption) as ClassificationMarking;
        }

        return { ...this.defaultResult(), disseminationOptions: [ ctx.getText() ] } as ClassificationMarking;
    }

    visitSciControlSystem(ctx: SciControlSystemContext): ClassificationMarking {
        let sciOptions: string[] = [];
        for (let sciControlContext of ctx.sciControl()) {
            const sciText = sciControlContext.getText();
            if(sciText) {
                sciOptions.push(sciText);
            }
        }

        return { ...this.defaultResult(), sciOptions: sciOptions } as ClassificationMarking;
    }

    visitFgiMarkings(ctx: FgiMarkingsContext): ClassificationMarking {

        // For a plain FGI which has no country codes, we mark it CONCEALED
        if(ctx.FGI() && !ctx.fgiCountryList()) {
            return {
                ...this.defaultResult(),
                fgiOptions: ['CONCEALED']
            } as ClassificationMarking
        }

        return this.visitChildren(ctx) as ClassificationMarking;

    }

    visitFgiCountryList(ctx: FgiCountryListContext): ClassificationMarking {
        return {
            ...this.defaultResult(),
            fgiOptions: ctx.COUNTRY_CODE()?.map(countryCode => countryCode.getText()) ?? []
        }  as ClassificationMarking;
    }

    visitSapMarkings(ctx: SapMarkingsContext): ClassificationMarking {
        return this.visitChildren(ctx) as ClassificationMarking;
    }

    visitSapProgramIdentifiers(ctx: SapProgramIdentifiersContext): ClassificationMarking {
        let sapOptions: string[] = [];

        // TODO: Check to see if this is correct with PCT.

        for (const sapProgramIdentifierContext of ctx.sapProgramIdentifier()) {
            const text = sapProgramIdentifierContext.getText();
            if(text) {
                sapOptions.push(text);
            }
        }

        return {
            ...this.defaultResult(),
            sapOptions: sapOptions
        } as ClassificationMarking;
    }


    visitAeaMarkings(ctx: AeaMarkingsContext): ClassificationMarking {

        // TODO: Check to see if this is correct with PCT.

        return {
            ...this.defaultResult(),
            aeaOptions: [ ctx.getText() ]
        } as ClassificationMarking;
    }





}