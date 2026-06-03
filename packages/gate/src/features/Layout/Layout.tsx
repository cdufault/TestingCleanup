import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAppSelector } from '../../hooks/hooks';
import ExerciseBanner from '../ExerciseBanner/ExerciseBanner';

function Layout() {
    const [showExercise, setShowExercise] = useState(false);
    const gateSystemHighClassification = useAppSelector(
        (state) => state.applicationSlice.gateDynamicConfig.systemHighClassification
    );
    const [classificationText, setClassificationText] = useState<string>('');
    const appConfig = useAppSelector((state) => state.applicationSlice.applicationConfig);

    useEffect(() => {
        if (appConfig) {
            setShowExercise(appConfig.appIsExercise);
        }
    }, [appConfig]);

    useEffect(() => {
        if (gateSystemHighClassification) {
            setClassificationText(gateSystemHighClassification);
        }
    }, [gateSystemHighClassification]);

    return (
        <>
            <div className='container'>
                <header className='security-header'>
                    <div className='security-banner'>{classificationText}</div>

                    {showExercise && <div className='security-exercise-banner'>EXERCISE</div>}
                </header>

                {/*the outlet component represents all the children in the layout component. anything nested inside the layout*/}
                {/*component is represented by the outlet. that allows you to apply more things to your overall app if you*/}
                {/*want to. We can have a header and a footer component in here, and we can use more than 1 outlet as we create*/}
                {/*routing in our application*/}
                <Outlet />

                <footer className='security-footer'>
                    {showExercise && <div className='security-exercise-banner'>EXERCISE</div>}
                    <footer className='security-banner'>{classificationText}</footer>
                </footer>
            </div>
        </>
    );
}

export default Layout;
