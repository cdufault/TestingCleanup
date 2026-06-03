import React from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import { IRegionCardRow } from '../../pages/LandingPage/landingPageSlice';
import RichTextEditorViewer from "../../Share/RichTextEditorViewer";
import './RegionCard.css';

/**
 * Region Details Properties
 */
export interface RegionCardRowProps {
    regionCardRow: IRegionCardRow;
}

/**
 * Region Details card will contain the summary of the regions activity as well
 * as a link to the specific region page.
 * Each grid item occupies three columns of the card viewport grid
 * @param props contains the name of the region to link to in the dialog, a IRegionCardRow of data, and a index number.
 * @constructor
 */
export default function RegionCardRow(props: RegionCardRowProps) {
    const row = props.regionCardRow;

    return (
        <>
            {/* Category */}
            <Grid sm={3} md={3}>
                <div className="category-row-wrap">
                    <b>{row.category}</b>
                </div>
            </Grid>

            {/* CatLevel */}
            <Grid sm={3} md={3}>
                {row.catLevel}
            </Grid>

            {/* CatConfidence */}
            <Grid sm={3} md={3}>
                {row.catConfidence}
            </Grid>

            {/* if maxCatConfidenceLength is 0 the padding of 16px, by the MaterialUI, must be accounted for in calculation. Otherwise it is not needed. */}
            <Grid sm={11} md={11}>
                <div>
                    <RichTextEditorViewer viewerData={row.catComments} />
                </div>
            </Grid>
        </>
    );
}
