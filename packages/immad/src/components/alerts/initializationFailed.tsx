import React from 'react';

export function InitializationFailed(): JSX.Element {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '1rem' }}>
            <h2>Application initialization failed</h2>
            <p>Please contact an administrator for assistance.</p>
        </div>
    );
}
