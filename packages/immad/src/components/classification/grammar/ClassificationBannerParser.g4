/**
    UNCLASSIFIED

    Grammar for Classification Banner Markings.
    Based on the following sources:
    -  (U) Intelligence Community Authorized Classification and Control Markings
           Register andd manual

*/

parser grammar ClassificationBannerParser    ;

options {
      tokenVocab = ClassificationBannerLexer;
}

import CUIBannerParser;

classificationBannerLine        :   (unclassifiedBannerLine | cuiBannerLine | unitedStatesBannerLine) EOF
                                ;

foreignBannerLine               :   COUNTRY_CODE SPACE foreignClassificationMarking
                                ;

foreignClassificationMarking    :   TOP_SECRET
                                |   SECRET
                                |   CONFIDENTIAL
                                |   RESTRICTED
                                |   UNCLASSIFIED
                                ;

/** NATO Classification Markings **/

natoBannerLine                  :   natoClassificationMarking
                                ;

natoClassificationMarking       :   COSMIC_TOP_SECRET_BOHEMIA
                                |   COSMIC_TOP_SECRET_DASH_BOHEMIA
                                |   COSMIC_TOP_SECRET
                                |   NATO_SECRET
                                |   NATO_CONFIDENTIAL
                                |   NATO_RESTRICTED
                                |   NATO_UNCLASSIFIED
                                |   COSMIC_TOP_SECRET_ATOMAL
                                |   SECRET_ATOMAL
                                |   CONFIDENTIAL_ATOMAL
                                ;

/** The lone UNCLASSIFIED marking represents documents which are not classified and not CUI. **/
unclassifiedBannerLine          :   UNCLASSIFIED EOF
                                ;

/** United States Classification Markings
*   Sources:
*   - (U) CAPCO Manual, Marking Structure and Formatting
**/

unitedStatesBannerLine          :   ((classificationMarking (DFS (foreignBannerLine | natoBannerLine))?) |
                                    (DFS (foreignBannerLine | natoBannerLine))) additionalMarkings?
                                ;

/**
    Marking order defined by CAPCO Manual
*/
additionalMarkings              :   ((DFS sciControlSystem) (DFS sapMarkings)? (DFS aeaMarkings)? (DFS fgiMarkings)? (DFS disseminationControls)? (DFS nonIcDisseminationControls)?)
                                |   ((DFS sapMarkings) (DFS aeaMarkings)? (DFS fgiMarkings)? (DFS disseminationControls)? (DFS nonIcDisseminationControls)?)
                                |   ((DFS aeaMarkings) (DFS fgiMarkings)? (DFS disseminationControls)? (DFS nonIcDisseminationControls)?)
                                |   ((DFS fgiMarkings) (DFS disseminationControls)? (DFS nonIcDisseminationControls)?)
                                |   ((DFS disseminationControls) (DFS nonIcDisseminationControls)?)
                                |   ((DFS nonIcDisseminationControls))
                                ;

nonIcDisseminationControls      :   nonIcDisseminationControl (FS nonIcDisseminationControl)*;

nonIcDisseminationControl       :   LIMDIS | NODIS | EXDIS | SBU | SBU_NOFORN | LES | LES_NOFORN | SSI | FISA;

fgiMarkings                     :   FGI (SPACE fgiCountryList)?;

fgiCountryList                  :   COUNTRY_CODE (SPACE COUNTRY_CODE)*;

classificationMarking           :   SECRET | CONFIDENTIAL | TOP_SECRET
                                ;

/** SCI Control System Markings **/
sciControlSystem                :  sciControl (FS sciControl)*
                                ;

sciControl                      :  knownSciControl | unknownSciControl;

knownSciControl                 : HCS
                                | KLONDIKE
                                | GAMMA_SUBCOMPARTMENT
                                | SI_GAMMA
                                | SI
                                | SI_COMPARTMENT
                                | TK
                                | RESERVE
                                | RESERVE_COMPARTMENT
                                ;

// TODO: Finish this section

unknownSciControl               : ALPHAWORD;

/** Special Access Program Markings **/
sapMarkings                     :   (SAR_CI | SPECIAL_ACCESS_REQUIRED_CI) sapProgramIdentifiers;

sapProgramIdentifiers           :   sapProgramIdentifier (SAR_FS sapProgramIdentifier)*;

sapProgramIdentifier            :   sapProgram (sapCompartment)*
                                ;

sapProgram                      :   SAP_PROGRAM_NAME
                                ;

sapCompartment                  :   SAP_COMPARTMENT_NAME (sapSubcompartment)*
                                ;

sapSubcompartment               :   SAP_SUBCOMPARTMENT_NAME;


/** Atomic Energy Act Information Markings **/

aeaMarkings                     :  (RD | FRD) additionalAeaMarkings;

additionalAeaMarkings           :   CNWDI
                                |   (SIGMA AEA_SPACE sigmaCategoryList);

sigmaCategoryList               :   SIGMANUM (AEA_SPACE SIGMANUM)*;

disseminationControls           :  disseminationControl (FS disseminationControl)*
                                ;

/* Dissemination Controls Section */
disseminationControl            :  RSEN
                                |  ORCON
                                |  ORCON_USGOV
                                |  IMCON
                                |  NOFORN
                                |  RELIDO
                                |  FISA
                                |  relToDisseminationOption
                                |  displayOnlyDisseminationOption
                                ;

