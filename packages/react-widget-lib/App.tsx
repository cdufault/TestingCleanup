import React from 'react';
import {Helloworld} from './dist/react-widget-lib';

function App() {
    return (
        <>
            <h1>Vite HTML page loaded.</h1>
            <div>
                <Helloworld inputText='Running Hello World widget.'/>
            </div>
        </>
    )
}

export default App