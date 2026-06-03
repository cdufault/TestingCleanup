lexer grammar CommonLexer;

fragment CHAR                   : 'A' .. 'Z';
fragment DIGIT                  : '0' .. '9';
fragment WORD                   : CHAR+;

SPACE                           :   ' ';
DASH                            :   '-';


DFS                             :   '//';
FS                              :   '/';

DISPLAY_ONLY                    :   'DISPLAY ONLY ' -> pushMode(COUNTRY_LIST_MODE);
REL_TO                          :   ('REL TO ' | 'AUTHORIZED FOR RELEASE TO ') -> pushMode(COUNTRY_LIST_MODE);    /* Switch to Country Listing Lexical Mode */

FED_ONLY                        :   'FED ONLY';
FEDCON                          :   'FEDCON';
NOCON                           :   'NOCON';
DL_ONLY                         :   'DL ONLY';

RSEN                            :   'RISK SENSITIVE'                                | 'RSEN';
ORCON                           :   'ORIGINATOR CONTROLLED'                         | 'ORCON';
ORCON_USGOV                     :   'ORIGINATOR CONTROLLED-USGOV'                   | 'ORCON-USGOV';
IMCON                           :   'CONTROLLED IMAGERY'                            | 'IMCON';
SAMI                            :   'SOURCES AND METHODS INFORMATION'               | 'SAMI';
NOFORN                          :   'NOT RELEASABLE TO FOREIGN NATIONALS'           | 'NOFORN';
PROPIN                          :   'CAUTION-PROPRIETARY INFORMATION INVOLVED'      | 'PROPIN';
RELIDO                          :   'RELEASABLE BY INFORMATION DISCLOSURE OFFICIAL' | 'RELIDO';
FISA                            :   'FOREIGN INTELLIGENCE SURVEILLANCE ACT'         | 'FISA';

/* Non-IC Dissemination Markings */

LIMDIS                          :   'LIMITED DISTRIBUTION'              | 'LIMDIS';
EXDIS                           :   'EXCLUSIVE DISTRIBUTION'            | 'EXDIS';
NODIS                           :   'NO DISTRIBUTION'                   | 'NODIS';
SBU                             :   'SENSITIVE BUT UNCLASSIFIED'        | 'SBU';
SBU_NOFORN                      :   'SENSITIVE BUT UNCLASSIFIED NOFORN' | 'SBU NOFORN';
LES                             :   'LAW ENFORCEMENT SENSITIVE'         | 'LES';
LES_NOFORN                      :   'LAW ENFORCEMENT SENSITIVE NOFORN'  | 'LES NOFORN';
SSI                             :   'SENSITIVE SECURITY INFORMATION'    | 'SSI';

/* FGI Markings */
FGI                             :   ('FGI' | 'FOREIGN GOVERNMENT INFORMATION') -> pushMode(COUNTRY_LIST_MODE);

/**
 *  (U) COUNTRY_LIST_MODE
 *      This lexical mode represents part of the grammar relating to listing country codes. These may be comma separated or space separated.
 *      Examples:   ...//REL TO USA, GBR
 *                  ...//JOINT SECRET USA, GBR
 *                  ...//FGI DEU GBR
 **/
mode COUNTRY_LIST_MODE;
EXIT_FS                         :  '/'  -> type(FS),  popMode;          // Single slash ends this mode
EXIT_DFS                        :  '//' -> type(DFS), popMode;          // Double slash ends this mode

C_SPACE                         :  SPACE -> type(SPACE);

DIV                             :   ', ';

/* Some known tetragraph entities */
FVEY                            :   'FVEY';
TEYE                            :   'TEYE';
ACGU                            :   'ACGU';
NATO                            :   'NATO';

COUNTRY_CODE_USA                :   'USA';

COUNTRY_CODE                    :   'AFG'   |   'XQZ'   |   'ALB'   |   'ALG'   |   'ASM'   |   'AND'   |   'AGO'   |   'AIA'   |   'ATA'   |   'ATG'
                                |   'ARG'   |   'ARM'   |   'ABW'   |   'XAC'   |   'AUS'   |   'AUT'   |   'AZE'   |   'BHS'   |   'BHR'   |   'XBK'
                                |   'BGD'   |   'BRB'   |   'XBI'   |   'BLR'   |   'BEL'   |   'BLZ'   |   'BEN'   |   'BMU'   |   'BTN'   |   'BOL'
                                |   'BES'   |   'BIH'   |   'BWA'   |   'BVT'   |   'IOT'   |   'BRN'   |   'BGR'   |   'BFA'   |   'MMR'   |   'BDI'
                                |   'CPV'   |   'KHM'   |   'CMR'   |   'CAN'   |   'CYM'   |   'CAF'   |   'TCD'   |   'CHL'   |   'CHN'   |   'CXR'
                                |   'CPT'   |   'CCK'   |   'COL'   |   'COM'   |   'COG'   |   'COD'   |   'COK'   |   'XCS'   |   'CRI'   |   'CIV'
                                |   'HRV'   |   'CUB'   |   'CUW'   |   'CYP'   |   'CZE'   |   'DNK'   |   'XXD'   |   'DGA'   |   'DJI'   |   'DMA'
                                |   'ECU'   |   'EGY'   |   'SLV'   |   'XAZ'   |   'XCR'   |   'XCY'   |   'XKM'   |   'XKN'   |   'AX3'   |   'GNQ'
                                |   'ERI'   |   'EST'   |   'ETH'   |   'XEU'   |   'FLK'   |   'FRO'   |   'FJI'   |   'FIN'   |   'FRA'   |   'GUF'
                                |   'PYF'   |   'ATF'   |   'GAB'   |   'XGZ'   |   'GEO'   |   'DEU'   |   'GHA'   |   'GIB'   |   'XGL'   |   'GRC'
                                |   'GRL'   |   'GRD'   |   'GLP'   |   'GUM'   |   'AX2'   |   'GTM'   |   'GGY'   |   'GIN'   |   'GNB'   |   'GUY'
                                |   'HTI'   |   'HMD'   |   'VAT'   |   'HND'   |   'HKG'   |   'XHO'   |   'HUN'   |   'ISL'   |   'IND'   |   'IDN'
                                |   'IRN'   |   'IRQ'   |   'IRL'   |   'IMN'   |   'ISR'   |   'ITA'   |   'JAM'   |   'XJM'   |   'JPN'   |   'XJV'
                                |   'JEY'   |   'XJA'   |   'JOR'   |   'XJN'   |   'KAZ'   |   'KEN'   |   'XKR'   |   'KIR'   |   'PRK'   |   'KOR'
                                |   'XKS'   |   'KWT'   |   'KGZ'   |   'LAO'   |   'LVA'   |   'LBN'   |   'LSO'   |   'LBR'   |   'LBY'   |   'LIE'
                                |   'LTU'   |   'LUX'   |   'MAC'   |   'MKD'   |   'MDG'   |   'MWI'   |   'MYS'   |   'MDV'   |   'MLI'   |   'MLT'
                                |   'MHL'   |   'MTQ'   |   'MRT'   |   'MUS'   |   'MYT'   |   'MEX'   |   'FSM'   |   'XMW'   |   'MDA'   |   'MCO'
                                |   'MNG'   |   'MNE'   |   'MSR'   |   'MAR'   |   'MOZ'   |   'NAM'   |   'NRU'   |   'XNV'   |   'NPL'   |   'NLD'
                                |   'NCL'   |   'NZL'   |   'NIC'   |   'NER'   |   'NGA'   |   'NIU'   |   'NFK'   |   'MNP'   |   'NOR'   |   'OMN'
                                |   'PAK'   |   'PLW'   |   'XPL'   |   'PAN'   |   'PNG'   |   'XPR'   |   'PRY'   |   'PER'   |   'PHL'   |   'PCN'
                                |   'POL'   |   'PRT'   |   'PRI'   |   'QAT'   |   'REU'   |   'ROU'   |   'RUS'   |   'RWA'   |   'BLM'   |   'SHN'
                                |   'KNA'   |   'LCA'   |   'MAF'   |   'SPM'   |   'VCT'   |   'WSM'   |   'SMR'   |   'STP'   |   'SAU'   |   'SEN'
                                |   'SRB'   |   'SYC'   |   'SLE'   |   'SGP'   |   'SXM'   |   'SVK'   |   'SVN'   |   'SLB'   |   'SOM'   |   'ZAF'
                                |   'SGS'   |   'SSD'   |   'ESP'   |   'XSP'   |   'LKA'   |   'SDN'   |   'SUR'   |   'XSV'   |   'SWZ'   |   'SWE'
                                |   'CHE'   |   'SYR'   |   'TWN'   |   'TJK'   |   'TZA'   |   'THA'   |   'TLS'   |   'TGO'   |   'TKL'   |   'TON'
                                |   'TTO'   |   'XTR'   |   'TUN'   |   'TUR'   |   'TKM'   |   'TCA'   |   'TUV'   |   'UGA'   |   'UKR'   |   'ARE'
                                |   'GBR'   | /*  'USA' |*/ 'AX1'   |   'URY'   |   'UZB'   |   'VUT'   |   'VEN'   |   'VNM'   |   'VGB'   |   'VIR'
                                |   'XWK'   |   'WLF'   |   'XWB'   |   'ESH'   |   'YEM'   |   'ZMB'   |   'ZWE'
                                ;

COUNTRY_CODE_FULL               :   COUNTRY_CODE | COUNTRY_CODE_USA;

TETRAGRAPH                      :   [A-Z][A-Z][A-Z][A-Z];




