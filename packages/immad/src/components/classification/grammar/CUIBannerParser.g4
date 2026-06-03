/**
	CUI Banner Line Grammar

	Banner Format:
	CUI//Category Marking//Limited Dissemination Control
 */
parser grammar CUIBannerParser;

options {
      tokenVocab = CUIBannerLexer;
}

cuiBannerLine                   :   ( unclassCuiLabel additionalUcCuiMarkings )
                                |   ( cuiLabel additionalCuiMarkings? )
                                ;

additionalUcCuiMarkings         :   ((DFS fgiMarkings) (DFS unclassDisseminationOptions)? (DFS cuiNonIcDcms)? )
                                |   (                  (DFS unclassDisseminationOptions)  (DFS cuiNonIcDcms)? )
                                |   (                                                     (DFS cuiNonIcDcms)  )
                                ;

additionalCuiMarkings           :   ((DFS (cuiCategoryMarkings | cuiSpecifiedCategoryMarkings)) (DFS cuiDisseminationOptions)? (DFS cuiNonIcDcms)? )
                                |   (                                                           (DFS cuiDisseminationOptions)  (DFS cuiNonIcDcms)? )
                                |   (                                                                                          (DFS cuiNonIcDcms)  )
                                ;

fgiMarkings                     :   FGI (SPACE fgiCountryList)?;

fgiCountryList                  :   COUNTRY_CODE (SPACE COUNTRY_CODE)*;

cuiNonIcDcms                    :   cuiNonIcDcm (FS cuiNonIcDcm)*;

cuiNonIcDcm                     :   LIMDIS | NODIS | EXDIS | SBU | SBU_NOFORN | LES | LES_NOFORN | SSI;

cuiLabel                        :   CUI | CONTROLLED;

unclassCuiLabel                 :   UNCLASSIFIED
                                ;

unclassDisseminationOptions     :   (unclassDisseminationOption | cuiDisseminationOption) (FS unclassDisseminationOptions)*
                                ;

unclassDisseminationOption      :   CUI_CATEGORY_FOUO
                                ;

cuiCategoryMarkings             :   cuiCategoryMarking (FS cuiCategoryMarking)*
                                ;

cuiSpecifiedCategoryMarkings    :   cuiSpecifiedCategoryMarking (FS cuiSpecifiedCategoryMarking)*
                                ;

cuiCategoryMarking              :   CUI_CATEGORY_MARKING | FISA;

cuiSpecifiedCategoryMarking     :   CUI_SPECIFIED_MARKING;


cuiDisseminationOptions         :   cuiDisseminationOption (FS cuiDisseminationOption)*;

cuiDisseminationOption          :   NOFORN
                                |   FED_ONLY
                                |   FEDCON
                                |   NOCON
                                |   ORCON
                                |   ORCON_USGOV
                                |   DL_ONLY
                                |   RELIDO
                                |   FISA
                                |   relToDisseminationOption
                                |   displayOnlyDisseminationOption
                                ;

relToDisseminationOption        :   REL_TO usaFirstCountryOrEntityList;

displayOnlyDisseminationOption  :   DISPLAY_ONLY usaFirstCountryOrEntityList;

authorizedEntity                :   FVEY | TEYE | ACGU | NATO | TETRAGRAPH;

usaFirstCountryOrEntityList     :   COUNTRY_CODE_USA (((DIV COUNTRY_CODE) (DIV COUNTRY_CODE)* (DIV authorizedEntity)*) |
                                                     ((DIV authorizedEntity) (DIV authorizedEntity)*));
