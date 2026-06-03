import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

/**
 * J2 Summary card will contain the summary provided by the J2 for the
 * current region cards displayed in the landing page.
 * @constructor
 */
export default function J2Summary() {
    return (
        <Card>
            <CardContent>
                <Typography>
                    <b>J2 ASSESSMENT: </b>
                    Assessment text: assessment typically includes and intake meeting, the administration of
                    standardized assessments, gathering information from relative third parties (teachers, physicians,
                    etc.), informal assessment, and a feedback interview in which we share the information we have
                    collected and interpreted.
                </Typography>
            </CardContent>
        </Card>
    );
}
