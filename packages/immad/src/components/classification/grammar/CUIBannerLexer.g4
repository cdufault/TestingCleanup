lexer grammar CUIBannerLexer;

import CommonLexer;

CUI_DFS                         :   DFS -> type(DFS), popMode;

CUI                             :   'CUI'               ;
CONTROLLED                      :   'CONTROLLED'        ;
UNCLASSIFIED                    :   'UNCLASSIFIED'      ;

CUI_SPECIFIED_MARKING           :   'SP-' CUI_CATEGORY_MARKING;

COMMA                           :   ',';

CUI_CATEGORY_FOUO               : 'FOUO';         // Legacy, for use with UNCLASSIFIED label
CUI_CATEGORY_SGI                : 'SGI';

CUI_CATEGORY_MARKING            : 'AIV'
                                | 'ADPO'
                                | 'AG'
                                | 'CRITAN'
                                | 'ARCHR'
                                | 'ASYL'
                                | 'FSEC'
                                | 'BATT'
                                | 'BUDG'
                                | 'FUND'
                                | 'CVI'
                                | 'CHLD'
                                | 'CVIC'
                                | 'BARG'
                                | 'CMPRS'
                                | 'LCOMM'
                                | 'COMPT'
                                | 'CCI'
                                | 'CONTRACT'
                                | 'SUB'
                                | 'CTI'         // Controlled Technical Information
                                | 'CHRI'
                                | 'CEII'        // Critical Infrastructure Information
                                | 'DREC'
                                | 'LDNA'
                                | 'DCRIT'       // DoD Critical Infrastructure Info
                                | 'XFER'
                                | 'EMGT'        // Emergency Mgmt Critical Infrastructure
                                | 'CONREG'
                                | 'EXPT'        // Export Control
                                | 'EXPTR'       // Export Control Research
                                | 'JURY'
                                | 'FHFANPI'
                                | 'TAX'
                                | 'FSI'
                                | FISA          // Intelligence
                                | 'FISAB'       // Intelligence - Business Records
                                | 'CRIT'        // Critical Infrastructure
                                | 'FNC'
                                | 'INTEL'       // Intelligence
                                | 'LEI'         // Law Enforcement
                                | 'NUC'         // Nuclear
                                | 'PRVCY'       // Privacy
                                | 'PROCURE'
                                | PROPIN      // Proprietary Business Information
                                | 'GENETIC'     // Privacy
                                | 'GEO'         // Intelligence
                                | 'HLTH'
                                | 'HISTP'
                                | 'INF'         // Law Enforcement
                                | 'ISVI'        // Critical Infrastructure
                                | 'PRIIG'
                                | 'IFNC'        // Intelligence Financial Records
                                | 'ID'          // Intelligence Internal Data
                                | 'INTL'        // International Agreements
                                | 'FINT'        // International Financial Institutions
                                | 'INVENT'      // Patents
                                | 'INV'         // Law Enforcement - Investigation
                                | 'SURV'
                                | 'JUV'
                                | 'LFNC'
                                | 'PRIVILEGE'
                                | 'LMI'
                                | 'MERG'
                                | 'MIL'         // Privacy - Military Personnel Records
                                | 'NPSR'
                                | 'LNSL'        // Law Enforcement - National Security Letter
                                | 'NNPI'        // Defense - Naval Nuclear Propulsion Info
                                | 'NETW'
                                | 'RECCOM'      // Nuclear - Nuclear Recomendation Material
                                | 'SRI'         // Nuclear - Nuclear Security-Related Info
                                | 'OCCMTO'
                                | 'SERV'
                                | 'OPSEC'       // Intelligence - Operations Security
                                | 'APP'
                                | 'TRACE'       // Law Enforcement - Pen Register / Trap & Trace
                                | 'RESD'
                                | 'PERS'
                                | 'PEST'
                                | 'PHYS'        // Critical Infrastructure - Physical Security
                                | 'PRE'         // Legal
                                | 'PRIOR'       // Legal
                                | 'PSI'         // Defense - Privileged Safety Information
                                | 'MFC'
                                | 'POST'
                                | 'PCII'        // Critical Infrastructure - Protected Crit Infra Info
                                | 'LPROT'       // Legal Protective Order
                                | 'RAIL'
                                | 'RTR'
                                | 'RWRD'        // Law Enforcement - Reward
                                | CUI_CATEGORY_SGI         // Nuclear - Safeguards Information
                                | 'SAFE'        // Critical Infrastructure - SAFETY Act Info
                                | 'PSEC'
                                | SSI           // Transportation - Sensitive Security Information
                                | 'SCV'         // Law Enforcement
                                | 'SBIZ'
                                | 'SSEL'
                                | 'STAT'
                                | 'ADJ'
                                | 'STUD'
                                | 'CONV'
                                | 'TAI'
                                | 'PROT'
                                | 'LSCRN'       // Law Enforcement - Terrorist Screening
                                | 'TSCA'        // Critical Infrastructure - Toxic Substances
                                | 'DCNI'        // Defense - Unclassified Controlled Nuclear Info (Defense)
                                | 'UCNI'        // Nuclear - Unclassified Controlled Nuclear Info (Energy)
                                | 'CENS'
                                | 'LVIC'
                                | 'IVIC'
                                | 'VISA'
                                | 'WATER'
                                | 'WHSTL'       // Law Enforcement - Whistleblower Identity
                                | 'WIT'
                                | 'WDT'
                                ;


/* FGI Markings */
CUI_FGI                         :   FGI -> type(FGI), pushMode(COUNTRY_LIST_MODE);