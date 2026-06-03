/**
 * Maps to the tabset type defined in the region JSON - see FlexLayoutJson.ts
 */
export enum TabsetTypes {
    /**Tabset holding the tabs for the activity counts */
    CountsTabset = 'countstabset',

    /**Tabset holding the tabs for the activity trends*/
    AnalystCommentsTabset = 'analystcommentstabset',

    /**Tabset holding the tabs for the legend*/
    LegendTabset = 'legendtabset',

    /**Tabset holding the tabs for the region Map, create new tab form, and any custom tabs the user adds */
    Maps = 'maps',
}

/**JSON for the default flex layout in the Region view for the map, tools, and widgets */
export const flexLayoutJson = {
    global: {
        tabEnableFloat: true,
        tabSetMinWidth: 100,
        tabSetMinHeight: 100,
        borderMinSize: 100,
        tabEnableClose: false,
    },
    borders: [],
    layout: {
        type: 'row',
        id: 'rowone',
        weight: 20,
        children: [
            {
                type: 'row',
                id: '#f47b6fd6-68d1-4873-b60f-b0288f848b4b',
                weight: 25,
                children: [
                    {
                        type: 'tabset',
                        id: '#f4c3a744-cd30-44a1-9e70-acca90380eb3',
                        weight: 50,
                        children: [
                            {
                                type: 'tab',
                                id: TabsetTypes.CountsTabset,
                                name: 'Activity Counts',
                                component: 'Activity Counts',
                                enableClose: true,
                            },
                        ],
                    },
                    {
                        type: 'tabset',
                        id: '#87cac6bc-5641-4931-8d79-25a45b848ea5',
                        weight: 50,
                        children: [
                            {
                                type: 'tab',
                                id: TabsetTypes.AnalystCommentsTabset,
                                name: 'Analyst Comments',
                                component: 'Analyst Comments',
                                enableClose: true,
                            },
                        ],
                        active: true,
                    },
                ],
            },
            {
                type: 'row',
                id: 'mapsrow',
                weight: 60,
                children: [
                    {
                        type: 'tabset',
                        id: '3',
                        weight: 70,
                        children: [
                            {
                                type: 'tab',
                                id: TabsetTypes.Maps,
                                name: 'Region Map',
                                component: 'Region Map',
                                enableClose: false,
                                enableFloat: false,
                            },
                        ],
                    },
                ],
            },
            {
                type: 'row',
                id: 'legendrow',
                weight: 15,
                children: [
                    {
                        type: 'tabset',
                        id: 'legend',
                        children: [
                            {
                                type: 'tab',
                                id: TabsetTypes.LegendTabset,
                                name: 'Legend',
                                component: 'Legend',
                                enableClose: true,
                            },
                        ],
                    },
                ],
            },
        ],
    },
};

/**JSON for the default flex layout in the Region view for the map, tools, and widgets */
export const flexLayoutStackedJson = {
    global: {
        tabEnableFloat: true,
        tabSetMinWidth: 100,
        tabSetMinHeight: 100,
        borderMinSize: 100,
        tabEnableClose: false,
    },
    borders: [],
    layout: {
        type: 'row',
        id: 'rowone',
        children: [
            {
                type: 'row',
                id: '#f47b6fd6-68d1-4873-b60f-b0288f848b4b',
                weight: 35,
                children: [
                    {
                        type: 'tabset',
                        id: '#f4c3a744-cd30-44a1-9e70-acca90380eb3',
                        weight: 30,
                        children: [
                            {
                                type: 'tab',
                                id: TabsetTypes.CountsTabset,
                                name: 'Activity Counts',
                                component: 'Activity Counts',
                                enableClose: true,
                            },
                        ],
                    },
                    {
                        type: 'tabset',
                        id: '#87cac6bc-5641-4931-8d79-25a45b848ea5',
                        weight: 30,
                        children: [
                            {
                                type: 'tab',
                                id: TabsetTypes.AnalystCommentsTabset,
                                name: 'Analyst Comments',
                                component: 'Analyst Comments',
                                enableClose: true,
                            },
                        ],
                        active: true,
                    },
                    {
                        type: 'tabset',
                        id: 'legend',
                        children: [
                            {
                                type: 'tab',
                                id: TabsetTypes.LegendTabset,
                                name: 'Legend',
                                component: 'Legend',
                                enableClose: true,
                            },
                        ],
                    },
                    {
                        type: 'tabset',
                        id: 'maps',
                        weight: 40,
                        children: [
                            {
                                type: 'tab',
                                id: '3',
                                name: 'Region Map',
                                component: 'Region Map',
                                enableClose: false,
                                enableFloat: false,
                            },
                        ],
                    },
                ],
            },
        ],
    },
};
