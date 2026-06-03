import React from 'react';
import './exerciseBanner.css';
import { setActive } from './ExerciseBannerSlice';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';

export default function ExerciseBanner() {
    const bannerValue = useAppSelector((state) => state.exerciseBannerSlice.active);
    const dispatch = useAppDispatch();

    if (bannerValue === false) {
        dispatch(setActive());
    }

    return (
        <div className='exercise-banner-background'>
            <div className='exercise-header-div'>
                <h1 className='exercise-h1'>EXERCISE</h1>
            </div>
        </div>
    );
}
