/**
 * This set of tests prototypes test that call the ArcGIS Rest API
 */
//import { getUniqueDataSourcesForRules } from '../helpers/dataSourceHelper';
import {
    CharStream,
    CommonTokenStream,





} from "antlr4ng";
import 'jest-canvas-mock';
import {ClassificationBannerLexer} from "./gen/ClassificationBannerLexer";
import {ClassificationBannerLineContext, ClassificationBannerParser} from "./gen/ClassificationBannerParser";
import {ClassificationBannerJSONVisitor} from "./ClassificationBannerJSONVisitor";


const createAST = (text: string) : ClassificationBannerLineContext => {
    const inputStream : CharStream = CharStream.fromString(text);
    const lexer = new ClassificationBannerLexer(inputStream);
    lexer.removeErrorListeners();
    const tokenStream = new CommonTokenStream(lexer);
    const parser = new ClassificationBannerParser(tokenStream);
    parser.removeErrorListeners();
    return parser.classificationBannerLine();
}

const testJson1 = {"classification":"SECRET","banner":"SECRET//FRD-SIGMA 14 18//REL TO USA, GBR","disseminationOptions":[],"aeaOptions":["FRD-SIGMA 14 18"],"fgiOptions":[],"relToOptions":["USA","GBR"],"sapOptions":[],"sciOptions":[]};
const testJson2 = {"classification":"SECRET","banner":"SECRET//SI/TK/ASDF//FGI DEU GBR//REL TO USA, FVEY, DEU, MEX, GBR/RELIDO/NOFORN","disseminationOptions":["RELIDO","NOFORN"],"aeaOptions":[],"fgiOptions":["DEU","GBR"],"relToOptions":["USA","FVEY","DEU","MEX","GBR"],"sapOptions":[],"sciOptions":["SI","TK","ASDF"]};
const testJson3 = {"classification":"TOP SECRET","banner":"TOP SECRET//SAR-BP-123/CA-XYZ YYY//NOFORN","disseminationOptions":["NOFORN"],"aeaOptions":[],"fgiOptions":[],"relToOptions":[],"sapOptions":["BP-123","CA-XYZ YYY"],"sciOptions":[]};
const testJson4 = {"classification":"UNCLASSIFIED","banner":"UNCLASSIFIED//LIMDIS","disseminationOptions":["LIMDIS"],"aeaOptions":[],"fgiOptions":[],"relToOptions":[],"sapOptions":[],"sciOptions":[]};

describe('Visitor Tests', () => {

    const jsonVisitor = new ClassificationBannerJSONVisitor();

    it("should handle banner, AEA and REL TO lines", async() => {
        const classificationMarking = jsonVisitor.visitClassificationBannerLine(createAST('SECRET//FRD-SIGMA 14 18//REL TO USA, GBR'));
        console.log(JSON.stringify(classificationMarking));
    });


    it('should handle UNCLASSIFIED//FOUO', async() => {

        const classificationMarkingFOUO = {"classification":"UNCLASSIFIED","banner":"UNCLASSIFIED//FOUO","disseminationOptions":["FOUO"],"aeaOptions":[],"fgiOptions":[],"relToOptions":[],"sapOptions":[],"sciOptions":[]};

        const classificationMarking2 = jsonVisitor.visitClassificationBannerLine(createAST('UNCLASSIFIED//FOUO'));
        console.log(JSON.stringify(classificationMarkingFOUO));

        expect(classificationMarking2).toEqual(classificationMarkingFOUO);
        expect(classificationMarking2).not.toEqual(testJson1);
    })

    it('should handle banner, SCI, FGI and dissemination options', async() => {

        const classificationMarking2 = jsonVisitor.visitClassificationBannerLine(createAST('SECRET//SI/TK/ASDF//FGI DEU GBR//REL TO USA, FVEY, DEU, MEX, GBR/RELIDO/NOFORN'));
        console.log(JSON.stringify(classificationMarking2));

        expect(classificationMarking2).toEqual(testJson2);
        expect(classificationMarking2).not.toEqual(testJson1);
    })

    it('should handle banner, complex SAP, and dissemination options', async() => {

        const classificationMarking3 = jsonVisitor.visitClassificationBannerLine(createAST('TOP SECRET//SAR-BP-123/CA-XYZ YYY//NOFORN'));
        console.log(JSON.stringify(classificationMarking3));

        expect(classificationMarking3).toEqual(testJson3);
        expect(classificationMarking3).not.toEqual(testJson1);
    })

    it('should handle UNCLASSIFIED//LIMDIS banners', async() => {

        const classificationMarking4 = jsonVisitor.visitClassificationBannerLine(createAST('UNCLASSIFIED//LIMDIS'));
        console.log(JSON.stringify(classificationMarking4));

        expect(classificationMarking4).toEqual(testJson4);
        expect(classificationMarking4).not.toEqual(testJson1);
    })
});