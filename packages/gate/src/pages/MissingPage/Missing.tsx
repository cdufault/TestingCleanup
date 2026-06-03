import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import React from 'react';
import '../../assets/index.css';

/**
 * This is the page that will be displayed for any routes that are not defined.
 * @constructor
 */
export default function Missing() {
    const navigate = useNavigate();

    function handleClick() {
        navigate('/');
    }

    return (
        <article className='missing-div' style={{ padding: '100px', textAlign: 'center' }}>
            <h1>"Gentlemen! You can't fight in here! This is the War Room!" - President Merkin Muffley</h1>
            <p>Page Not Found</p>
            <div className='flexGrow'>
                <Button onClick={handleClick}>Visit the Landing Page</Button>
            </div>
        </article>
    );
}
