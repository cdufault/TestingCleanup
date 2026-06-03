/**
 * This set of tests prototypes test that call the ArcGIS Rest API
 */
//import { getUniqueDataSourcesForRules } from '../helpers/dataSourceHelper';
import {
    CharStream,
    CommonTokenStream,
    BaseErrorListener,
    ATNSimulator,
    Token,
    Recognizer,
    RecognitionException, DFA, BitSet, ATNConfigSet, Parser, Lexer, TerminalNode,
} from "antlr4ng";
import 'jest-canvas-mock';
import {ClassificationBannerParser} from "./gen/ClassificationBannerParser";
import {ClassificationBannerLexer} from "./gen/ClassificationBannerLexer";

class NoErrorListener extends BaseErrorListener {

    constructor() {
        super();
    }

    syntaxError<S extends Token, T extends ATNSimulator>(recognizer: Recognizer<T>, offendingSymbol: S | null, line: number, column: number, msg: string, e: RecognitionException | null) {
        fail(msg);
    }


    reportAmbiguity(recognizer: Parser, dfa: DFA, startIndex: number, stopIndex: number, exact: boolean, ambigAlts: BitSet | undefined, configs: ATNConfigSet) {
        fail("ambiguity");
    }


}

class SyntaxError extends BaseErrorListener {

    private error : boolean;

    constructor() {
        super();
        this.error = false;
    }

    syntaxError<S extends Token, T extends ATNSimulator>(recognizer: Recognizer<T>, offendingSymbol: S | null, line: number, column: number, msg: string, e: RecognitionException | null) {
        this.error = true;
    }

    public get isError() { return this.error; }

}

function createParserNoError(lexer: Lexer) : ClassificationBannerParser
{

    // lexer.addErrorListener(new NoErrorListener());

    const tokenStream = new CommonTokenStream(lexer);
    const p = new ClassificationBannerParser(tokenStream);
    p.removeErrorListeners();
    p.addErrorListener(new NoErrorListener());
    return p;
}

function testMarkingNoSyntaxErrors(marking : string, shouldPass: boolean = true) {
    const inputStream : CharStream = CharStream.fromString(marking);
    const lexer = new ClassificationBannerLexer(inputStream);
    const syntaxError = new SyntaxError();
    lexer.removeErrorListeners();
    lexer.addErrorListener(syntaxError);
    let parser = createParserNoError(lexer);
    parser.removeErrorListeners();
    parser.addErrorListener(syntaxError);
    const tree = parser.classificationBannerLine();
    expect(syntaxError.isError).toEqual(!shouldPass);
    return tree;
}

function banner(marking: string) {
    const inputStream : CharStream = CharStream.fromString(marking);
    const lexer = new ClassificationBannerLexer(inputStream);
    lexer.removeErrorListeners();
    const tokenStream = new CommonTokenStream(lexer);
    const parser = new ClassificationBannerParser(tokenStream);
    parser.removeErrorListeners();

    return {
        lexer: lexer,
        parser: parser,
        tree: parser.classificationBannerLine()
    };
}

const unclassifiedBannerStmt = "UNCLASSIFIED";

describe('Standard Tests', () => {
    it("should fail when given an invalid marking - UNCLASSIFIEDASDFDSDFSDF", async() => {
        testMarkingNoSyntaxErrors("UNCLASSIFIEDASDFDSDFSDF", false);
    });

    it("should handle CUI and CONTROLLED markings", async() => {
        testMarkingNoSyntaxErrors("CUI", true);
        testMarkingNoSyntaxErrors("CONTROLLED", true);
        testMarkingNoSyntaxErrors("CUI//NOFORN", true);
        testMarkingNoSyntaxErrors("CONTROLLED//NOFORN", true);
        testMarkingNoSyntaxErrors("UNCLASSIFIED//FOUO/NOFORN", true);
        testMarkingNoSyntaxErrors("UNCLASSIFIED//FOUO/NOFORN//LIMDIS", true);
    });

    it("should fail on invalid CUI and CONTROLLED markings", async() => {
        testMarkingNoSyntaxErrors("UCI", false);
        testMarkingNoSyntaxErrors("CONTORLLDE", false);
        testMarkingNoSyntaxErrors("CUI//YESFORN", false);
    });
    it("should pass on CUI SPECIFIED profile markings", async() => {
        testMarkingNoSyntaxErrors("CUI//SP-ADPO", true);
        testMarkingNoSyntaxErrors("CONTROLLED//SP-LSCRN", true);
        testMarkingNoSyntaxErrors("CONTROLLED//SP-ABCD", false);
    });

    it("should succeed with simple banner marking - UNCLASSIFIED ", async() => {

        const syntaxError = new SyntaxError();


        const inputStream : CharStream = CharStream.fromString(unclassifiedBannerStmt);
        const lexer = new ClassificationBannerLexer(inputStream);
        lexer.removeErrorListeners();
        lexer.addErrorListener(syntaxError);

        let noParam = createParserNoError(lexer);

        noParam.classificationBannerLine();
        expect(syntaxError.isError).toEqual(false);

    });

    it("should parse SCI compartments and subcompartments", async() => {
        testMarkingNoSyntaxErrors("TOP SECRET//TALENT KEYHOLE");
        testMarkingNoSyntaxErrors("TOP SECRET//SI/TALENT KEYHOLE");
        testMarkingNoSyntaxErrors("TOP SECRET//SI/TALENT KEYHOLE//NOFORN");
        testMarkingNoSyntaxErrors("TOP SECRET//SI-GAMMA");
        testMarkingNoSyntaxErrors("TOP SECRET//SI-G/TK");

        // testMarking("SECRET//SAR-BUTTER POPCORN-J12 J54-K15/CD-YYY 456 689/XR-XRA RB//NOFORN");
    })
    it("should parse SAP programs, compartments and sub-compartments", async() => {
        testMarkingNoSyntaxErrors("SECRET//SAR-BP-J12 J54-K15/CD-YYY 456 689/XR-XRA RB//NOFORN");
        testMarkingNoSyntaxErrors("SECRET//SAR-BUTTER POPCORN-J12 J54-K15/CD-YYY 456 689/XR-XRA RB//NOFORN");
    })
    it("should parse AEA markings", async() => {
        testMarkingNoSyntaxErrors("SECRET//RD-SIGMA 34 33 55");
        testMarkingNoSyntaxErrors("SECRET//FRD-CNWDI");
        testMarkingNoSyntaxErrors("SECRET//RD-SIGMA 34 33 55//REL TO USA, GBR");
    })
});


describe('NATO Tests', () => {
    const markings = [
        { name: 'COSMIC TOP SECRET', code: ClassificationBannerLexer.COSMIC_TOP_SECRET },
        { name: 'COSMIC TOP SECRET BOHEMIA', code: ClassificationBannerLexer.COSMIC_TOP_SECRET_BOHEMIA },
        { name: 'COSMIC TOP SECRET-BOHEMIA', code: ClassificationBannerLexer.COSMIC_TOP_SECRET_DASH_BOHEMIA },
        { name: 'CONFIDENTIAL ATOMAL', code: ClassificationBannerLexer.CONFIDENTIAL_ATOMAL },
        { name: 'SECRET ATOMAL', code: ClassificationBannerLexer.SECRET_ATOMAL },
        { name: 'COSMIC TOP SECRET ATOMAL', code: ClassificationBannerLexer.COSMIC_TOP_SECRET_ATOMAL },
        { name: 'NATO SECRET', code: ClassificationBannerLexer.NATO_SECRET },
        { name: 'NATO CONFIDENTIAL', code: ClassificationBannerLexer.NATO_CONFIDENTIAL },
        { name: 'NATO RESTRICTED', code: ClassificationBannerLexer.NATO_RESTRICTED },
        { name: 'NATO UNCLASSIFIED', code: ClassificationBannerLexer.NATO_UNCLASSIFIED },
    ]

    it("should succeed with basic NATO Banner Lines", async() => {

        for(const marking of markings) {
            console.log(`Testing ${marking.name} ...` );

            const tree = testMarkingNoSyntaxErrors(`//${marking.name}`);
            if(tree) {
                expect((tree.unitedStatesBannerLine()?.natoBannerLine()?.natoClassificationMarking()?.getChild(0) as TerminalNode)?.getSymbol()?.type)
                    .toEqual(marking.code);
            }
        }
    });

    it("should support combined NATO and US classification markings", async() => {
        testMarkingNoSyntaxErrors('SECRET//NATO SECRET');
        testMarkingNoSyntaxErrors('CONFIDENTIAL//NATO SECRET');
        testMarkingNoSyntaxErrors('TOP SECRET//COSMIC TOP SECRET');
        testMarkingNoSyntaxErrors('CONFIDENTIAL//NATO RESTRICTED');

    })

});


describe('Non-US Classification Tests', () => {


    it("should support a single country code: //[COUNTRY_CODE] SECRET", async() => {
        testMarkingNoSyntaxErrors(`//DEU SECRET`);
    });

});
describe("CUI Tests", () => {
    it("should support basic CUI markings", async() => {
        testMarkingNoSyntaxErrors("CUI");
        testMarkingNoSyntaxErrors("UNCLASSIFIED//FOUO");
        testMarkingNoSyntaxErrors("UNCLASSIFIED//LIMDIS");
        testMarkingNoSyntaxErrors("CUI//DREC/LDNA/FISA//REL TO USA, GBR");
    })
});

describe('FGI tests', () => {
    it("should support FGI markings", async() => {
        testMarkingNoSyntaxErrors('TOP SECRET//FGI');
        testMarkingNoSyntaxErrors('TOP SECRET//FOREIGN GOVERNMENT INFORMATION');
        testMarkingNoSyntaxErrors('TOP SECRET//FGI//REL TO USA, GBR/NOFORN');
        testMarkingNoSyntaxErrors('TOP SECRET//FOREIGN GOVERNMENT INFORMATION//REL TO USA, GBR/NOFORN');
        testMarkingNoSyntaxErrors('SECRET//FGI CAN');
        testMarkingNoSyntaxErrors('SECRET//FGI CAN GBR');
        testMarkingNoSyntaxErrors('SECRET//FGI CAN GBR DEU//REL TO USA, GBR/NOFORN');
        testMarkingNoSyntaxErrors('TOP SECRET//FGI//IMCON/RELIDO');
        testMarkingNoSyntaxErrors('SECRET//RD-CNWDI//FGI CAN DEU GBR');
        testMarkingNoSyntaxErrors('SECRET//SAR-RED WAGON//FGI//RELIDO');

    });

    it("should support concealed FGI markings e.g. TOP SECRET//FGI//NOFORN", async() => {
        testMarkingNoSyntaxErrors('SECRET//SI/TK//FGI//NOFORN', true);
    });

    it("should fail with invalid FGI markings", async() => {
        testMarkingNoSyntaxErrors('SECRET//SI/TK//FGI/NOFORN', false);
        testMarkingNoSyntaxErrors('SECRET//SI/TK//FGI AAA//NOFORN', false);
        testMarkingNoSyntaxErrors('SECRET//SI/TK//FGI AAA/NOFORN', false);
    });

});

describe('Combined markings tests', () => {
    it("Should handle SECRET//DEU SECRET//SI/TK//RELIDO/NOFORN/REL TO USA, GBR//LIMDIS", async() => {

        const stmt = "SECRET//DEU SECRET//SI/TK//RELIDO/NOFORN/REL TO USA, GBR//LIMDIS";

        const result = banner(stmt);
        expect(result.parser.numberOfSyntaxErrors).toBe(0);
    });
});

describe('REL TO Tests', () => {
    it("should support REL TO USA, GBR, DEU", async() => {

        const relToStmt = "REL TO USA, GBR, DEU";
        const markings = ['CUI', 'UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP SECRET'];

        for(const marking of markings) {
            const result = banner(`${marking}//${relToStmt}`);
            expect(result.parser.numberOfSyntaxErrors).toBe(0);
        }
    });

    it("should fail on REL TO USA only", async() => {
        const invalidRelToStmt = "REL TO USA";
        const markings = ['CUI', 'UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP SECRET'];

        for(const marking of markings) {
            const result = banner(`${marking}//${invalidRelToStmt}`);
            expect(result.parser.numberOfSyntaxErrors).toBe(1);
        }
    });

    it("should not support REL TO FVEY (must include USA first)", async() => {
        const relToStmt = "REL TO FVEY";
        const markings = ['CUI', 'UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP SECRET'];

        for(const marking of markings) {
            const result = banner(`${marking}//${relToStmt}`);
            expect(result.parser.numberOfSyntaxErrors).toBe(1);
        }
    });


    it("should support REL TO USA, FVEY", async() => {
        const relToStmt = "REL TO USA, FVEY";
        const markings = ['CUI', 'UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP SECRET'];

        for(const marking of markings) {
            const result = banner(`${marking}//${relToStmt}`);
            console.log(`${marking}//${relToStmt}`);
            expect(result.parser.numberOfSyntaxErrors).toBe(0);
        }
    });



    it("should support REL TO USA, [TETRAGRAPH] (four character word) ", async() => {
        const relToStmt = "REL TO USA, ASDF";
        const markings = ['CUI', 'UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP SECRET'];

        for(const marking of markings) {
            const result = banner(`${marking}//${relToStmt}`);
            expect(result.parser.numberOfSyntaxErrors).toBe(0);
        }
    });
});
