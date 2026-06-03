lexer grammar ClassificationBannerLexer;

import CommonLexer, CUIBannerLexer;

COSMIC_TOP_SECRET_BOHEMIA       :   'COSMIC TOP SECRET BOHEMIA';
COSMIC_TOP_SECRET_DASH_BOHEMIA  :   'COSMIC TOP SECRET-BOHEMIA';
COSMIC_TOP_SECRET               :   'COSMIC TOP SECRET';
NATO_SECRET                     :   'NATO SECRET';
NATO_CONFIDENTIAL               :   'NATO CONFIDENTIAL';
NATO_RESTRICTED                 :   'NATO RESTRICTED';
NATO_UNCLASSIFIED               :   'NATO UNCLASSIFIED';
COSMIC_TOP_SECRET_ATOMAL        :   'COSMIC TOP SECRET ATOMAL';
SECRET_ATOMAL                   :   'SECRET ATOMAL';
CONFIDENTIAL_ATOMAL             :   'CONFIDENTIAL ATOMAL';

CUI             :   'CUI'               -> pushMode(CUI_MODE)
                ;

CONTROLLED      :   'CONTROLLED'        -> pushMode(CUI_MODE)
                ;

UNCLASSIFIED    :   'UNCLASSIFIED'      -> pushMode(CUI_MODE)
                ;

CONFIDENTIAL    :   'CONFIDENTIAL'
                ;

SECRET          :   'SECRET'
                ;

TOP_SECRET      :   'TOP SECRET'
                ;

RESTRICTED      :   'RESTRICTED'
                ;

NOFORN          :   'NOFORN'
                ;

DFS             :   '//'    ->  pushMode(ADDITIONAL_MARKINGS_MODE);

/* This mode is for SECRET/TOP SECRET/CONFIDENTIAL labels which can (but do not have to) include SCI markings not listed here.
*  This mode can support free-text SCI markings, however, the lexer needs to recognize other types of markings (e.g. dissemination
*  control, AEA, etc.) and leave this mode if it sees them.
*/

mode CUI_MODE;
C_DFS                        :    '//' -> type(DFS), popMode;     // Hack to get to the right mode for processing CUI labels

mode ADDITIONAL_MARKINGS_MODE;

A_SPACE           :     SPACE -> type(SPACE);

A_COUNTRY_CODE    :     COUNTRY_CODE -> type(COUNTRY_CODE);

A_UNCLASSIFIED    :     UNCLASSIFIED -> type(UNCLASSIFIED)
                  ;
A_CONFIDENTIAL    :     CONFIDENTIAL -> type(CONFIDENTIAL)
                  ;
A_SECRET          :     SECRET -> type(SECRET)
                  ;
A_TOP_SECRET      :     TOP_SECRET -> type(TOP_SECRET)
                  ;

A_RESTRICTED      :   'RESTRICTED';

A_COSMIC_TOP_SECRET_BOHEMIA       :   COSMIC_TOP_SECRET_BOHEMIA -> type(COSMIC_TOP_SECRET_BOHEMIA);
A_COSMIC_TOP_SECRET_DASH_BOHEMIA  :   COSMIC_TOP_SECRET_DASH_BOHEMIA -> type(COSMIC_TOP_SECRET_DASH_BOHEMIA);
A_COSMIC_TOP_SECRET               :   COSMIC_TOP_SECRET -> type(COSMIC_TOP_SECRET);
A_NATO_SECRET                     :   NATO_SECRET -> type(NATO_SECRET);
A_NATO_CONFIDENTIAL               :   NATO_CONFIDENTIAL -> type(NATO_CONFIDENTIAL);
A_NATO_RESTRICTED                 :   NATO_RESTRICTED -> type(NATO_RESTRICTED);
A_NATO_UNCLASSIFIED               :   NATO_UNCLASSIFIED -> type(NATO_UNCLASSIFIED);
A_COSMIC_TOP_SECRET_ATOMAL        :   COSMIC_TOP_SECRET_ATOMAL -> type(COSMIC_TOP_SECRET_ATOMAL);
A_SECRET_ATOMAL                   :   SECRET_ATOMAL -> type(SECRET_ATOMAL);
A_CONFIDENTIAL_ATOMAL             :   CONFIDENTIAL_ATOMAL -> type(CONFIDENTIAL_ATOMAL);

A_LIMDIS                          :   LIMDIS     -> type(LIMDIS);
A_NODIS                           :   NODIS      -> type(NODIS);
A_EXDIS                           :   EXDIS      -> type(EXDIS);
A_SBU                             :   SBU        -> type(SBU);
A_SBU_NOFORN                      :   SBU_NOFORN -> type(SBU_NOFORN);
A_LES                             :   LES        -> type(LES);
A_LES_NOFORN                      :   LES_NOFORN -> type(LES_NOFORN);
A_SSI                             :   SSI        -> type(SSI);


M_FS                              :   '/'     -> type(FS);
M_DFS                             :   '//'    -> type(DFS);

/** CAPCO Section 4. SCI Control System Markings **/
/* This is a subset of the overall SCI controls. Additional controls are supported as alphabetic characters under the MARKING token. */

HCS                     :   'HCS'
                        ;

TK                      :   'TALENT KEYHOLE'
                        |   'TK'
                        ;

KLONDIKE                :   'KLONDIKE'
                        |   'KDK'
                        ;

RESERVE                 :   'RESERVE'
                        |   'RSV'
                        ;

RESERVE_COMPARTMENT     :   RESERVE ' ' [A-Z][A-Z][A-Z]
                        ;

SI_GAMMA                :   'SI-GAMMA' | 'SI-G';

SI                      :   'SI'
                        ;

SI_COMPARTMENT          :   SI '-' [A-Z][A-Z][A-Z]
                        ;

GAMMA_SUBCOMPARTMENT    :   'G ' [A-Z][A-Z][A-Z][A-Z]
                        ;
/* FGI Markings */
M_FGI                             :   FGI -> type(FGI), pushMode(COUNTRY_LIST_MODE);

/* Carry over these dissemination control markings from the common lexer so we can leave the control markings mode if we see them */
M_DISPLAY_ONLY                    :   DISPLAY_ONLY    -> type(DISPLAY_ONLY),  pushMode(COUNTRY_LIST_MODE);
M_REL_TO                          :   REL_TO          -> type(REL_TO),        pushMode(COUNTRY_LIST_MODE);

M_RSEN                            :   RSEN            -> type(RSEN);
M_ORCON                           :   ORCON           -> type(ORCON);
M_ORCON_USGOV                     :   ORCON_USGOV     -> type(ORCON_USGOV);
M_IMCON                           :   IMCON           -> type(IMCON);
M_NOFORN                          :   NOFORN          -> type(NOFORN);
M_RELIDO                          :   RELIDO          -> type(RELIDO);
M_FISA                            :   FISA            -> type(FISA);

/** CAPCO Section 5. Special Access Program Markings **/

MULTIPLE_PROGRAMS               :   'MULTIPLE PROGRAMS';

WAIVED                          :   'WAIVED'
                                ;
/** AEA **/

RD                              :   ('RD-'
                                |   'RESTRICTED DATA-')             -> pushMode(AEA_MODE)
                                ;

FRD                             :   ('FRD-'
                                |   'FORMERLY RESTRICTED DATA')     -> pushMode(AEA_MODE)
                                ;


SAR_CI                          :   'SAR-'                          -> pushMode(SAR_MODE)
                                ;

SPECIAL_ACCESS_REQUIRED_CI      :   'SPECIAL ACCESS REQUIRED-'      -> pushMode(SAR_MODE)
                                ;

ALPHAWORD                       :   ( CHAR )+;


mode AEA_MODE;

CNWDI                           :   'CRITICAL NUCLEAR WEAPON DESIGN INFORMATION'
                                |   'CNWDI';

SIGMA                           :   ('SIGMA' | 'SG' );

SIGMANUM                        :   DIGIT DIGIT
                                ;

AEA_SPACE                       :   ' ';
AEA_EXIT                        :   '//'        -> type(DFS), popMode;

mode SAR_MODE;

fragment SAR_SPACE              : ' ';
fragment SAR_DASH               : '-';

SAR_EXIT                        : '//'        -> type(DFS), popMode;
SAR_FS                          : '/';

SAP_COMPARTMENT_NAME            :  SAR_DASH ALPHANUMERIC;
SAP_SUBCOMPARTMENT_NAME         :  SAR_SPACE ALPHANUMERIC;

SAP_PROGRAM_NAME                :  ALPHANUMERIC (SAR_SPACE ALPHANUMERIC)*;

ALPHANUMERIC                    : ( CHAR | DIGIT )+;
